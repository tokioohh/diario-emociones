import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { addDays, dayKey, formatLong } from '../core/dates';
import { defaultStepTitles } from '../core/planner';
import { useStore } from '../core/store';
import type { DeliverableInput, DeliverableKind } from '../core/types';
import DatePickerSheet from '../ui/DatePickerSheet';
import Screen from '../ui/Screen';
import { colors, radius } from '../ui/theme';

const kinds: { id: DeliverableKind; label: string; emoji: string }[] = [
  { id: 'proyecto', label: 'Proyecto', emoji: '🧩' }, { id: 'examen', label: 'Examen', emoji: '📚' }, { id: 'tarea', label: 'Tarea', emoji: '✍️' },
];
const hours = [9, 12, 18, 20];

export default function NuevaEntrega() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { deliverables, saveDeliverable } = useStore();
  const existing = deliverables.find((item) => item.id === id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [course, setCourse] = useState(existing?.course ?? '');
  const [kind, setKind] = useState<DeliverableKind>(existing?.kind ?? 'proyecto');
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? dayKey(addDays(new Date(), 7)));
  const [reminderHour, setReminderHour] = useState(existing?.reminderHour ?? 18);
  const [remindersEnabled, setRemindersEnabled] = useState(existing?.remindersEnabled ?? true);
  const [stepTitles, setStepTitles] = useState<string[]>(existing?.steps.map((step) => step.title) ?? defaultStepTitles(existing?.kind ?? 'proyecto', existing?.dueDate ?? dayKey(addDays(new Date(), 7))));
  const [showCalendar, setShowCalendar] = useState(false);
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(() => title.trim().length > 0 && stepTitles.some((step) => step.trim()), [title, stepTitles]);

  const save = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    const input: DeliverableInput = { title: title.trim(), course: course.trim(), kind, dueDate, reminderHour, remindersEnabled, stepTitles };
    try {
      const permissionGranted = await saveDeliverable(input, existing?.id);
      if (remindersEnabled && !permissionGranted) Alert.alert('Plan guardado', 'Los avisos están apagados en los permisos del teléfono. Puedes activarlos desde Ajustes.');
      router.back();
    } catch {
      Alert.alert('No se pudo guardar', 'Inténtalo de nuevo. Tu plan no se ha perdido.');
    } finally { setSaving(false); }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
          <Text style={styles.headerTitle}>{existing ? 'Editar entrega' : 'Nueva entrega'}</Text><View style={styles.back} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={styles.intro}>Hazlo más manejable. Un paso pequeño cuenta.</Text>
          <Text style={styles.label}>¿Qué necesitas terminar?</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Ej. Proyecto de estructuras" placeholderTextColor={colors.dim} style={styles.input} maxLength={80} returnKeyType="next" accessibilityLabel="Nombre de la entrega" />
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.kindRow}>{kinds.map((item) => <Pressable key={item.id} onPress={() => { setKind(item.id); if (!existing) setStepTitles(defaultStepTitles(item.id, dueDate)); }} style={[styles.kind, kind === item.id && styles.kindSelected]} accessibilityRole="button" accessibilityState={{ selected: kind === item.id }}><Text style={styles.kindEmoji}>{item.emoji}</Text><Text style={[styles.kindText, kind === item.id && styles.kindTextSelected]}>{item.label}</Text></Pressable>)}</View>
          <Text style={styles.label}>Materia o contexto <Text style={styles.optional}>· opcional</Text></Text>
          <TextInput value={course} onChangeText={setCourse} placeholder="Ej. Cálculo II" placeholderTextColor={colors.dim} style={styles.input} maxLength={60} returnKeyType="done" accessibilityLabel="Materia o contexto opcional" />
          <Text style={styles.label}>Fecha límite</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowCalendar(true)} accessibilityRole="button" accessibilityLabel={`Fecha límite ${formatLong(new Date(`${dueDate}T12:00:00`))}`}>
            <View style={styles.dateIcon}><Ionicons name="calendar-outline" size={20} color={colors.accent} /></View><View style={styles.dateCopy}><Text style={styles.dateMain}>{formatLong(new Date(`${dueDate}T12:00:00`))}</Text><Text style={styles.dateHint}>Toca para cambiar la fecha</Text></View><Ionicons name="chevron-forward" size={18} color={colors.dim} />
          </Pressable>
          <View style={styles.sectionHeading}><View><Text style={styles.labelTight}>Pasos sugeridos</Text><Text style={styles.muted}>Puedes personalizar cada paso</Text></View><Ionicons name="sparkles-outline" size={19} color={colors.accent} /></View>
          <View style={styles.stepsCard}>
            {stepTitles.map((step, index) => <View key={`${index}`} style={styles.stepRow}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View><TextInput value={step} onChangeText={(value) => setStepTitles((all) => all.map((item, i) => i === index ? value : item))} style={styles.stepInput} placeholder={`Paso ${index + 1}`} placeholderTextColor={colors.dim} maxLength={70} accessibilityLabel={`Nombre del paso ${index + 1}`} /><Pressable onPress={() => setStepTitles((all) => all.filter((_, i) => i !== index))} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar paso ${index + 1}`}><Ionicons name="close-circle" size={21} color={colors.dim} /></Pressable></View>)}
            <Pressable style={styles.addStep} onPress={() => setStepTitles((all) => [...all, ''])} accessibilityRole="button"><Ionicons name="add-circle-outline" size={19} color={colors.accent} /><Text style={styles.addStepText}>Añadir un paso</Text></Pressable>
          </View>
          <View style={styles.reminderCard}>
            <View style={styles.reminderTop}><View style={styles.reminderIcon}><Ionicons name="notifications-outline" size={19} color={colors.accent} /></View><View style={styles.reminderCopy}><Text style={styles.reminderTitle}>Recordatorios</Text><Text style={styles.muted}>Un aviso el día de cada paso</Text></View><Switch value={remindersEnabled} onValueChange={setRemindersEnabled} trackColor={{ false: colors.surfaceHi, true: colors.accent }} thumbColor={colors.text} accessibilityLabel="Activar recordatorios de pasos" /></View>
            {remindersEnabled && <View style={styles.hourRow}>{hours.map((hour) => <Pressable key={hour} onPress={() => setReminderHour(hour)} style={[styles.hourChip, reminderHour === hour && styles.hourSelected]} accessibilityRole="button" accessibilityState={{ selected: reminderHour === hour }}><Text style={[styles.hourText, reminderHour === hour && styles.hourTextSelected]}>{String(hour).padStart(2, '0')}:00</Text></Pressable>)}</View>}
          </View><View style={{ height: 95 }} />
        </ScrollView>
        <View style={styles.footer}><Pressable onPress={save} disabled={!isValid || saving} style={[styles.saveButton, (!isValid || saving) && styles.saveDisabled]} accessibilityRole="button"><Text style={styles.saveText}>{saving ? 'Guardando…' : existing ? 'Guardar cambios' : 'Crear mi plan'}</Text><Ionicons name="arrow-forward" size={19} color={colors.onMood} /></Pressable></View>
      </KeyboardAvoidingView>
      {showCalendar && <DatePickerSheet value={dueDate} onSelect={(value) => { setDueDate(value); if (!existing) setStepTitles(defaultStepTitles(kind, value)); }} onClose={() => setShowCalendar(false)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 }, header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }, back: { width: 42, height: 42, justifyContent: 'center' }, headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 22, paddingTop: 16, gap: 9 }, intro: { color: colors.dim, fontSize: 15, lineHeight: 22, marginBottom: 6 }, label: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 2 }, labelTight: { color: colors.text, fontSize: 14, fontWeight: '700' }, optional: { color: colors.dim, fontSize: 12, fontWeight: '400' },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 15, fontSize: 15 }, kindRow: { flexDirection: 'row', gap: 8 }, kind: { flex: 1, minHeight: 78, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 6 }, kindSelected: { borderColor: colors.accent, backgroundColor: '#292642' }, kindEmoji: { fontSize: 21 }, kindText: { color: colors.dim, fontSize: 13, fontWeight: '600' }, kindTextSelected: { color: colors.text },
  dateButton: { minHeight: 70, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }, dateIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' }, dateCopy: { flex: 1, gap: 3 }, dateMain: { color: colors.text, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' }, dateHint: { color: colors.dim, fontSize: 12 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }, muted: { color: colors.dim, fontSize: 12, marginTop: 3 }, stepsCard: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, paddingVertical: 5 }, stepRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line }, stepNumber: { width: 25, height: 25, borderRadius: 13, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' }, stepNumberText: { color: colors.accent, fontSize: 12, fontWeight: '800' }, stepInput: { flex: 1, color: colors.text, fontSize: 13, paddingVertical: 9 }, addStep: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 13 }, addStepText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  reminderCard: { marginTop: 14, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 12 }, reminderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, reminderIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' }, reminderCopy: { flex: 1 }, reminderTitle: { color: colors.text, fontSize: 14, fontWeight: '700' }, hourRow: { flexDirection: 'row', gap: 8 }, hourChip: { flex: 1, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHi }, hourSelected: { backgroundColor: colors.accent }, hourText: { color: colors.dim, fontSize: 12, fontWeight: '700' }, hourTextSelected: { color: colors.onMood },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 14, backgroundColor: colors.bg }, saveButton: { minHeight: 54, borderRadius: radius.pill, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, saveDisabled: { opacity: 0.45 }, saveText: { color: colors.onMood, fontSize: 15, fontWeight: '800' },
});

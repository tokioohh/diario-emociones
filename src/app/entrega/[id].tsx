import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dayKey, formatLong } from '../../core/dates';
import { completionPercent } from '../../core/planner';
import { useStore } from '../../core/store';
import Screen from '../../ui/Screen';
import { colors, radius } from '../../ui/theme';

const typeInfo = { proyecto: { label: 'Proyecto', emoji: '🧩' }, examen: { label: 'Examen', emoji: '📚' }, tarea: { label: 'Tarea', emoji: '✍️' } } as const;

export default function EntregaDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deliverables, toggleDeliverableStep, deleteDeliverable } = useStore();
  const item = deliverables.find((deliverable) => deliverable.id === id);
  const [focusUntil, setFocusUntil] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!focusUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [focusUntil]);

  if (!item) return <Screen><View style={styles.missing}><Text style={styles.missingText}>No encontramos esta entrega.</Text><Pressable onPress={() => router.back()}><Text style={styles.link}>Volver al plan</Text></Pressable></View></Screen>;

  const percent = completionPercent(item.steps);
  const type = typeInfo[item.kind];
  const overdue = !item.completedAt && item.dueDate < dayKey(new Date());
  const remainingSeconds = focusUntil ? Math.max(0, Math.ceil((focusUntil - now) / 1000)) : 0;
  const timerActive = remainingSeconds > 0;
  const timerLabel = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  const remove = () => Alert.alert('Eliminar entrega', 'Se borrarán también sus pasos y recordatorios.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => { deleteDeliverable(item.id); router.back(); } },
  ]);

  const toggleStep = async (stepId: string) => {
    const granted = await toggleDeliverableStep(item.id, stepId);
    if (!granted) Alert.alert('Avisos apagados', 'El avance se guardó, pero no hay permiso para programar recordatorios.');
  };

  return (
    <Screen>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable><View style={styles.headerActions}><Pressable onPress={() => router.push({ pathname: '/nueva-entrega', params: { id: item.id } })} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Editar entrega"><Ionicons name="create-outline" size={21} color={colors.text} /></Pressable><Pressable onPress={remove} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Eliminar entrega"><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable></View></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroTop}><View style={styles.heroEmojiWrap}><Text style={styles.heroEmoji}>{type.emoji}</Text></View><Text style={styles.kind}>{type.label.toUpperCase()}</Text></View>
          <Text style={styles.title}>{item.title}</Text>
          {!!item.course && <Text style={styles.course}>{item.course}</Text>}
          <View style={styles.deadline}><Ionicons name={overdue ? 'alert-circle-outline' : 'calendar-outline'} size={17} color={overdue ? colors.danger : colors.accent} /><Text style={[styles.deadlineText, overdue && styles.overdue]}>{overdue ? 'Venció' : 'Fecha límite'} · {formatLong(new Date(`${item.dueDate}T12:00:00`))}</Text></View>
          <View style={styles.progressSection}><View style={styles.progressLabels}><Text style={styles.progressLabel}>Tu avance</Text><Text style={styles.percent}>{percent}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View><Text style={styles.progressHint}>{item.completedAt ? 'Lo lograste. ¡Buen trabajo!' : `${item.steps.filter((step) => step.completedAt).length} de ${item.steps.length} pasos completados`}</Text></View>
        </View>

        {!item.completedAt && <View style={styles.focusCard}><View style={styles.focusIcon}><Ionicons name="timer-outline" size={22} color={colors.accent} /></View><View style={styles.focusCopy}><Text style={styles.focusTitle}>{timerActive ? 'Solo este momento' : '¿Te cuesta empezar?'}</Text><Text style={styles.focusSub}>{timerActive ? 'Concéntrate en un pequeño avance.' : 'Prueba con cinco minutos, sin presión.'}</Text></View>{timerActive ? <Text style={styles.timer}>{timerLabel}</Text> : <Pressable style={styles.focusButton} onPress={() => { setNow(Date.now()); setFocusUntil(Date.now() + 5 * 60 * 1000); }} accessibilityRole="button"><Text style={styles.focusButtonText}>Empezar</Text></Pressable>}</View>}

        <View style={styles.stepsHeading}><View><Text style={styles.stepsTitle}>Pasos pequeños</Text><Text style={styles.stepsSub}>Marca cada uno al terminar</Text></View><Text style={styles.stepCount}>{item.steps.filter((step) => step.completedAt).length}/{item.steps.length}</Text></View>
        <View style={styles.stepsCard}>{item.steps.map((step, index) => {
          const done = !!step.completedAt;
          const isCurrent = !done && item.steps.find((candidate) => !candidate.completedAt)?.id === step.id;
          return <Pressable key={step.id} onPress={() => void toggleStep(step.id)} style={[styles.step, index < item.steps.length - 1 && styles.stepBorder]} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`${step.title}, ${done ? 'completado' : 'pendiente'}, ${formatLong(new Date(`${step.dueDate}T12:00:00`))}`}>
            <View style={[styles.checkbox, done && styles.checked]}>{done && <Ionicons name="checkmark" size={17} color={colors.onMood} />}</View><View style={styles.stepCopy}><Text style={[styles.stepTitle, done && styles.stepDone]}>{step.title}</Text><Text style={[styles.stepDate, isCurrent && styles.currentDate]}>{isCurrent ? 'SIGUIENTE · ' : ''}{formatLong(new Date(`${step.dueDate}T12:00:00`))}</Text></View>{isCurrent && <View style={styles.nextDot} />}
          </Pressable>;
        })}</View>
        <Text style={styles.localNote}><Ionicons name="notifications-outline" size={14} color={colors.dim} /> {item.remindersEnabled ? `Aviso a las ${String(item.reminderHour).padStart(2, '0')}:00 en días de paso` : 'Recordatorios desactivados'}</Text>
        <View style={{ height: 28 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 54, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, headerActions: { flexDirection: 'row', gap: 8 }, content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30, gap: 15 },
  hero: { backgroundColor: colors.surface, borderRadius: 23, borderWidth: 1, borderColor: colors.line, padding: 19, gap: 9 }, heroTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, heroEmojiWrap: { width: 47, height: 47, borderRadius: 16, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' }, heroEmoji: { fontSize: 24 }, kind: { color: colors.accent, fontSize: 10, letterSpacing: 1.2, fontWeight: '800' }, title: { color: colors.text, fontSize: 25, lineHeight: 31, fontWeight: '800', marginTop: 4 }, course: { color: colors.dim, fontSize: 14, marginTop: -4 }, deadline: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 }, deadlineText: { color: colors.dim, fontSize: 13, textTransform: 'capitalize' }, overdue: { color: colors.danger }, progressSection: { marginTop: 12, gap: 8 }, progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, progressLabel: { color: colors.text, fontSize: 13, fontWeight: '700' }, percent: { color: colors.accent, fontSize: 16, fontWeight: '800' }, progressTrack: { height: 8, backgroundColor: colors.surfaceHi, borderRadius: 5, overflow: 'hidden' }, progressFill: { height: 8, backgroundColor: colors.accent, borderRadius: 5 }, progressHint: { color: colors.dim, fontSize: 12 },
  focusCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, backgroundColor: '#25243D', borderWidth: 1, borderColor: '#514A79' }, focusIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' }, focusCopy: { flex: 1 }, focusTitle: { color: colors.text, fontSize: 13, fontWeight: '800' }, focusSub: { color: colors.dim, fontSize: 11, marginTop: 3 }, focusButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.accent }, focusButtonText: { color: colors.onMood, fontSize: 12, fontWeight: '800' }, timer: { color: colors.accent, fontSize: 19, fontWeight: '800', fontVariant: ['tabular-nums'] },
  stepsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }, stepsTitle: { color: colors.text, fontSize: 18, fontWeight: '800' }, stepsSub: { color: colors.dim, fontSize: 12, marginTop: 3 }, stepCount: { color: colors.accent, fontSize: 13, fontWeight: '800' }, stepsCard: { backgroundColor: colors.surface, borderRadius: 19, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14 }, step: { minHeight: 69, flexDirection: 'row', alignItems: 'center', gap: 12 }, stepBorder: { borderBottomWidth: 1, borderBottomColor: colors.line }, checkbox: { width: 25, height: 25, borderRadius: 9, borderWidth: 1.5, borderColor: colors.dim, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: colors.accent, borderColor: colors.accent }, stepCopy: { flex: 1, gap: 5 }, stepTitle: { color: colors.text, fontSize: 14, fontWeight: '600' }, stepDone: { color: colors.dim, textDecorationLine: 'line-through' }, stepDate: { color: colors.dim, fontSize: 10, textTransform: 'capitalize' }, currentDate: { color: colors.accent, fontWeight: '800', letterSpacing: 0.5 }, nextDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }, localNote: { color: colors.dim, fontSize: 11, alignSelf: 'center' }, missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, missingText: { color: colors.text, fontSize: 16 }, link: { color: colors.accent, fontWeight: '700' },
});

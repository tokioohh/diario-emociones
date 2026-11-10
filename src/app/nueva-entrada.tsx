import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { QUADRANTS, quadrantOf } from '../core/emotions';
import { useStore } from '../core/store';
import type { Mood } from '../core/types';
import Chip from '../ui/Chip';
import MoodSheet from '../ui/MoodSheet';
import Screen from '../ui/Screen';
import { colors, radius } from '../ui/theme';

export default function NuevaEntrada() {
  const { addEntry } = useStore();
  const [text, setText] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [panel, setPanel] = useState(false);
  const q = mood ? QUADRANTS[quadrantOf(mood)] : null;

  const save = () => {
    if (!mood) return;
    addEntry({ text, mood, labels });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>Cancelar</Text>
          </Pressable>
          <Text style={styles.title}>Nueva entrada</Text>
          <Pressable onPress={save} disabled={!mood} hitSlop={12}>
            <Text style={[styles.link, !mood && { opacity: 0.35 }]}>Guardar</Text>
          </Pressable>
        </View>

        <View style={styles.prompt}>
          <Text style={styles.promptTitle}>Haz una pausa</Text>
          <Text style={styles.promptSub}>No tienes que encontrar las palabras perfectas. Escribe solo lo que te ayude.</Text>
        </View>
        <TextInput
          style={styles.input}
          multiline
          autoFocus
          value={text}
          onChangeText={setText}
          placeholder="¿Qué pasó? Escribe lo que quieras recordar de este momento."
          placeholderTextColor={colors.dim}
          textAlignVertical="top"
          accessibilityLabel="Texto de la entrada"
        />

        <View style={styles.footer}>
          {q && mood ? (
            <Pressable onPress={() => setPanel(true)} style={[styles.feeling, { borderColor: q.color }]} accessibilityRole="button" accessibilityLabel="Cambiar sentimiento">
              <Chip label={q.name} color={q.color} />
              {labels.map((l) => (
                <Chip key={l} label={l} color={q.color} selected={false} />
              ))}
              <Text style={styles.change}>Cambiar</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setPanel(true)} style={styles.add} accessibilityRole="button">
              <Text style={styles.addText}>+ Agregar sentimiento</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {panel && (
        <MoodSheet
          initial={{ mood, labels }}
          onClose={() => setPanel(false)}
          onDone={(m, l) => {
            setMood(m);
            setLabels(l);
            setPanel(false);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 14 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  link: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  prompt: { paddingHorizontal: 22, paddingTop: 20, gap: 6 },
  promptTitle: { color: colors.text, fontSize: 25, fontWeight: '800' },
  promptSub: { color: colors.dim, fontSize: 15, lineHeight: 22 },
  input: { flex: 1, color: colors.text, fontSize: 17, lineHeight: 26, paddingHorizontal: 22, paddingTop: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  add: { height: 52, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  feeling: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.card, borderWidth: 1.5 },
  change: { color: colors.dim, fontSize: 14, marginLeft: 'auto' },
});

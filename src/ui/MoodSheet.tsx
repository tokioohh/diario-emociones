import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EMOTION_OPTIONS, closestEmotion, emotionForLabel } from '../core/emotions';
import type { EmotionOption } from '../core/emotions';
import type { Mood } from '../core/types';
import { colors, radius } from './theme';

type Props = {
  initial: { mood: Mood | null; labels: string[] };
  onDone: (mood: Mood, labels: string[]) => void;
  onClose: () => void;
};

export default function MoodSheet({ initial, onDone, onClose }: Props) {
  const [selected, setSelected] = useState<EmotionOption | null>(() =>
    (initial.labels[0] && emotionForLabel(initial.labels[0])) || (initial.mood && closestEmotion(initial.mood)) || null,
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar panel" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>¿Cómo te sientes?</Text>
          <Text style={styles.hint}>Elige lo que más se acerque. No hay respuestas buenas o malas.</Text>
          <View style={styles.options}>
            {EMOTION_OPTIONS.map((option) => {
              const active = selected?.label === option.label;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setSelected(option)}
                  style={[styles.option, active && styles.optionActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={option.label}
                >
                  <Text style={styles.emoji}>{option.emoji}</Text>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            disabled={!selected}
            onPress={() => selected && onDone(selected.mood, [selected.label])}
            style={[styles.primary, !selected && styles.primaryDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>Guardar emoción</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,6,24,0.6)' },
  sheet: { maxHeight: '90%', backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'left' },
  hint: { color: colors.dim, fontSize: 14, lineHeight: 20, textAlign: 'left' },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 4 },
  option: { width: '48.2%', minHeight: 82, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  optionActive: { borderColor: colors.accent, backgroundColor: '#25243B' },
  emoji: { fontSize: 29 },
  optionLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  optionLabelActive: { color: colors.accent, fontWeight: '700' },
  primary: { height: 52, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { color: colors.onMood, fontSize: 16, fontWeight: '700' },
});

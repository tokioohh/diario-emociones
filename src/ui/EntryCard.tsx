import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { QUADRANTS, emotionForLabel, quadrantOf } from '../core/emotions';
import { formatTime } from '../core/dates';
import type { Entry } from '../core/types';
import Chip from './Chip';
import { colors, radius } from './theme';

export default function EntryCard({ entry, onDelete, showDay }: { entry: Entry; onDelete?: (id: string) => void; showDay?: string }) {
  const q = QUADRANTS[quadrantOf(entry.mood)];
  const selectedEmotion = entry.labels[0] ? emotionForLabel(entry.labels[0]) : undefined;
  const confirm = () =>
    onDelete &&
    Alert.alert('Eliminar entrada', 'Se borrará de este teléfono y no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(entry.id) },
    ]);
  return (
    <Pressable onLongPress={confirm} delayLongPress={450} style={[styles.card, { borderLeftColor: q.color }]} accessibilityHint={onDelete ? 'Mantén presionado para eliminar' : undefined}>
      <Text style={styles.time}>
        {showDay ? `${showDay} · ` : ''}
        {formatTime(entry.at)}
        {entry.source === 'watch' ? ' · desde el reloj' : ''}
      </Text>
      {!!entry.text && <Text style={styles.text}>{entry.text}</Text>}
      <View style={styles.row}>
        {selectedEmotion ? <Chip small label={`${selectedEmotion.emoji} ${selectedEmotion.label}`} color={q.color} /> : <Chip small label={q.name} color={q.color} />}
        {entry.labels.slice(selectedEmotion ? 1 : 0).map((l) => (
          <Chip small key={l} label={l} color={q.color} selected={false} />
        ))}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 4, padding: 16, gap: 9 },
  time: { color: colors.dim, fontSize: 13 },
  text: { color: colors.text, fontSize: 16, lineHeight: 23 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});

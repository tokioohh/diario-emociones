import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from './theme';

type Props = { label: string; color?: string; selected?: boolean; onPress?: () => void; small?: boolean };

export default function Chip({ label, color = colors.accent, selected = true, onPress, small }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      style={[styles.chip, small && styles.small, selected ? { backgroundColor: color, borderColor: color } : { borderColor: colors.line }]}
    >
      <Text style={[styles.text, small && styles.textSmall, { color: selected ? colors.onMood : colors.text }]}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  small: { paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 15, fontWeight: '600' },
  textSmall: { fontSize: 13 },
});

import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DIAS_CORTO, MESES, dayKey, parseDay } from '../core/dates';
import { colors, radius } from './theme';

export default function DatePickerSheet({ value, onSelect, onClose }: { value: string; onSelect: (date: string) => void; onClose: () => void }) {
  const selectedDate = parseDay(value);
  const [cursor, setCursor] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const today = dayKey(new Date());
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const canGoBack = cursor.getFullYear() > currentMonth.getFullYear()
    || (cursor.getFullYear() === currentMonth.getFullYear() && cursor.getMonth() > currentMonth.getMonth());
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)] as (number | null)[];
  }, [cursor]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar calendario" />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Fecha de entrega</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar"><Text style={styles.close}>Listo</Text></Pressable>
        </View>
        <View style={styles.monthRow}>
          <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} disabled={!canGoBack} style={[styles.arrow, !canGoBack && styles.disabledArrow]} accessibilityRole="button" accessibilityState={{ disabled: !canGoBack }} accessibilityLabel="Mes anterior">
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Text style={styles.month}>{MESES[cursor.getMonth()]} {cursor.getFullYear()}</Text>
          <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} style={styles.arrow} accessibilityLabel="Mes siguiente">
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>
        <View style={styles.week}>
          {DIAS_CORTO.map((day) => <Text key={day} style={styles.weekDay}>{day.slice(0, 1)}</Text>)}
        </View>
        <View style={styles.grid}>
          {cells.map((number, index) => {
            if (!number) return <View key={`empty-${index}`} style={styles.cell} />;
            const key = dayKey(new Date(cursor.getFullYear(), cursor.getMonth(), number));
            const disabled = key < today;
            const selected = key === value;
            return (
              <Pressable
                key={key}
                disabled={disabled}
                onPress={() => { onSelect(key); onClose(); }}
                style={styles.cell}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                accessibilityLabel={`${number} de ${MESES[cursor.getMonth()]}${key === today ? ', hoy' : ''}`}
              >
                <View style={[styles.day, key === today && styles.today, selected && styles.selected, disabled && styles.disabled]}>
                  <Text style={[styles.dayText, selected && styles.selectedText, disabled && styles.disabledText]}>{number}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.helper}>Puedes elegir hoy o cualquier fecha futura.</Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,6,24,0.6)' },
  sheet: { maxHeight: '88%', backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 21, fontWeight: '800' },
  close: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  month: { color: colors.text, fontSize: 17, fontWeight: '700', textTransform: 'capitalize' },
  arrow: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  disabledArrow: { opacity: 0.35 },
  arrowText: { color: colors.text, fontSize: 26, lineHeight: 29 },
  week: { flexDirection: 'row', marginTop: 12 },
  weekDay: { flex: 1, textAlign: 'center', color: colors.dim, fontSize: 12, fontWeight: '700', paddingVertical: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  today: { borderWidth: 1, borderColor: colors.accent },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  disabled: { opacity: 0.35 },
  dayText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  selectedText: { color: colors.onMood, fontWeight: '800' },
  disabledText: { color: colors.dim },
  helper: { color: colors.dim, fontSize: 13, textAlign: 'center', paddingTop: 8 },
});

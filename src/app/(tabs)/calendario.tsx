import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DIAS_CORTO, MESES, dayKey, formatLong, monthKey, parseDay } from '../../core/dates';
import { QUADRANTS, mean, quadrantOf } from '../../core/emotions';
import { useStore } from '../../core/store';
import EntryCard from '../../ui/EntryCard';
import Screen from '../../ui/Screen';
import { colors, radius } from '../../ui/theme';

export default function Calendario() {
  const { entries, closings, deleteEntry } = useStore();
  const today = dayKey(new Date());
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const month = monthKey(cursor);
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)] as (number | null)[];
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof entries>();
    entries.filter((e) => e.day.startsWith(month)).forEach((e) => map.set(e.day, [...(map.get(e.day) ?? []), e]));
    return map;
  }, [entries, month]);

  const selEntries = entries.filter((e) => e.day === selected);
  const selClosing = closings[selected];
  const move = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => move(-1)} hitSlop={12} accessibilityLabel="Mes anterior"><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>{MESES[cursor.getMonth()]} {cursor.getFullYear()}</Text>
        <Pressable onPress={() => move(1)} hitSlop={12} accessibilityLabel="Mes siguiente"><Ionicons name="chevron-forward" size={24} color={colors.text} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.week}>
          {DIAS_CORTO.map((d) => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((n, i) => {
            if (!n) return <View key={`e${i}`} style={styles.cell} />;
            const key = `${month}-${String(n).padStart(2, '0')}`;
            const list = byDay.get(key);
            const q = list ? QUADRANTS[quadrantOf({ valence: mean(list.map((e) => e.mood.valence)), energy: mean(list.map((e) => e.mood.energy)) })] : null;
            return (
              <Pressable key={key} style={styles.cell} onPress={() => setSelected(key)} accessibilityRole="button" accessibilityState={{ selected: key === selected }} accessibilityLabel={`${n}, ${list ? `${list.length} entradas` : 'sin registros'}${key === today ? ', hoy' : ''}`}>
                <View style={[styles.inner, q && { backgroundColor: q.color }, key === today && styles.today, key === selected && styles.selected]}>
                  {closings[key] && <Ionicons name="checkmark-circle" size={14} color={q ? colors.onMood : colors.accent} style={styles.check} />}
                  <Text style={[styles.num, { color: q ? colors.onMood : colors.text }]}>{n}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{formatLong(parseDay(selected))}</Text>
          {selClosing ? (
            <Pressable onPress={() => router.push({ pathname: '/cierre', params: { day: selected } })}>
              <Text style={styles.detailSub}>Cierre: {selClosing.score}/10 · {selClosing.headline}</Text>
            </Pressable>
          ) : (
            <Text style={styles.detailSub}>{selEntries.length ? 'Día sin cerrar' : 'Sin registros este día'}</Text>
          )}
          {selEntries.map((e) => (
            <EntryCard key={e.id} entry={e} onDelete={deleteEntry} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', textTransform: 'capitalize' },
  week: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 4 },
  weekDay: { flex: 1, textAlign: 'center', color: colors.dim, fontSize: 12, fontWeight: '600', paddingVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.95, padding: 3 },
  inner: { flex: 1, borderRadius: radius.cell, backgroundColor: colors.surface, justifyContent: 'flex-end', padding: 7 },
  today: { borderWidth: 1.5, borderColor: colors.accent },
  selected: { borderWidth: 2.5, borderColor: colors.text },
  check: { position: 'absolute', top: 4, right: 4 },
  num: { fontSize: 17, fontWeight: '700' },
  detail: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32, gap: 12 },
  detailTitle: { color: colors.text, fontSize: 23, fontWeight: '800', textTransform: 'capitalize' },
  detailSub: { color: colors.dim, fontSize: 16 },
});

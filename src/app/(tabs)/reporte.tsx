import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DIAS_CORTO, addDays, formatShort, parseDay, startOfWeek } from '../../core/dates';
import { QUADRANTS, QUADRANT_ORDER } from '../../core/emotions';
import { buildWeekReport } from '../../core/report';
import { useStore } from '../../core/store';
import Chip from '../../ui/Chip';
import EntryCard from '../../ui/EntryCard';
import Screen from '../../ui/Screen';
import { colors, radius } from '../../ui/theme';

export default function Reporte() {
  const { entries, closings } = useStore();
  const [start, setStart] = useState(() => startOfWeek(new Date()));
  const r = useMemo(() => buildWeekReport(start, entries, closings), [start, entries, closings]);
  const total = r.totalEntries;
  const energy = r.avgEnergy === null ? '' : r.avgEnergy >= 0.25 ? 'alta' : r.avgEnergy <= -0.25 ? 'baja' : 'moderada';

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => setStart(addDays(start, -7))} hitSlop={12} accessibilityLabel="Semana anterior"><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <Text style={styles.title}>{formatShort(start)} – {formatShort(addDays(start, 6))}</Text>
        <Pressable onPress={() => setStart(addDays(start, 7))} hitSlop={12} accessibilityLabel="Semana siguiente"><Ionicons name="chevron-forward" size={24} color={colors.text} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!total ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="analytics-outline" size={28} color={colors.accent} /></View>
            <Text style={styles.emptyTitle}>Tu semana, poco a poco</Text>
            <Text style={styles.empty}>Cuando registres algunos momentos, aquí podrás ver patrones y un resumen para compartir con tu terapeuta.</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.big}>{r.avgScore ?? '–'}<Text style={styles.of}>/10</Text></Text>
              <Text style={styles.sub}>Puntuación media · {r.daysLogged}/7 días con registro · {total} entradas · {r.daysClosed} días cerrados</Text>
              {!!energy && <Text style={styles.sub}>Energía {energy} en promedio.</Text>}
              {r.lowestPart && <Text style={styles.sub}>Tu ánimo suele bajar durante {r.lowestPart}.</Text>}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cada día</Text>
              <View style={styles.bars}>
                {r.days.map((d, i) => (
                  <View key={d.day} style={styles.barCol}>
                    <Text style={styles.barVal}>{d.score !== null ? Math.round(d.score) : ''}</Text>
                    <View style={[styles.bar, { height: d.score !== null ? 8 + (d.score / 10) * 80 : 8, backgroundColor: d.quadrant ? QUADRANTS[d.quadrant].color : colors.surfaceHi }]} />
                    <Text style={styles.barDay}>{DIAS_CORTO[i]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Estados de ánimo</Text>
              <View style={styles.stack}>
                {QUADRANT_ORDER.map((q) => r.quadrantCounts[q] > 0 && <View key={q} style={{ flex: r.quadrantCounts[q], backgroundColor: QUADRANTS[q].color }} />)}
              </View>
              {QUADRANT_ORDER.map((q) => (
                <View key={q} style={styles.legend}>
                  <View style={[styles.swatch, { backgroundColor: QUADRANTS[q].color }]} />
                  <Text style={styles.legendText}>{QUADRANTS[q].name}</Text>
                  <Text style={styles.legendNum}>{r.quadrantCounts[q]}</Text>
                </View>
              ))}
            </View>

            {!!r.topLabels.length && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Lo que más sentiste</Text>
                <View style={styles.chips}>
                  {r.topLabels.map((l) => (
                    <Chip key={l.label} label={`${l.label} ×${l.count}`} selected={false} />
                  ))}
                </View>
              </View>
            )}

            {!!r.heavy.length && (
              <View style={{ gap: 10 }}>
                <Text style={styles.section}>Lo que más pesó</Text>
                {r.heavy.map((e) => <EntryCard key={e.id} entry={e} showDay={formatShort(parseDay(e.day))} />)}
              </View>
            )}
            {!!r.uplifting.length && (
              <View style={{ gap: 10 }}>
                <Text style={styles.section}>Lo que más ayudó</Text>
                {r.uplifting.map((e) => <EntryCard key={e.id} entry={e} showDay={formatShort(parseDay(e.day))} />)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 16 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  scroll: { paddingHorizontal: 22, paddingTop: 8, gap: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 72, gap: 14 },
  emptyIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  emptyTitle: { color: colors.text, fontSize: 21, fontWeight: '700', textAlign: 'center' },
  empty: { color: colors.dim, fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 320 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.line },
  cardTitle: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  big: { color: colors.text, fontSize: 52, fontWeight: '800' },
  of: { color: colors.dim, fontSize: 22, fontWeight: '600' },
  sub: { color: colors.dim, fontSize: 15, lineHeight: 21 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 136, paddingTop: 8 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: 22, borderRadius: 8 },
  barVal: { color: colors.text, fontSize: 12, height: 16 },
  barDay: { color: colors.dim, fontSize: 12 },
  stack: { flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden', backgroundColor: colors.surfaceHi },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: colors.text, fontSize: 15, flex: 1 },
  legendNum: { color: colors.dim, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 6 },
});

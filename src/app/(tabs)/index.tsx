import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dayKey, formatLong } from '../../core/dates';
import { QUADRANTS, emotionForLabel, quadrantOf } from '../../core/emotions';
import { completionPercent, nextDeliverableStep } from '../../core/planner';
import { useStore } from '../../core/store';
import { buildDaySummary } from '../../core/summary';
import EntryCard from '../../ui/EntryCard';
import Screen from '../../ui/Screen';
import { colors, radius } from '../../ui/theme';

export default function Hoy() {
  const { entriesOf, closings, deleteEntry, deliverables } = useStore();
  const now = new Date();
  const today = dayKey(now);
  const list = entriesOf(today);
  const closing = closings[today];
  const last = list[list.length - 1];
  const live = list.length ? buildDaySummary(list) : null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const nextPlan = deliverables.filter((item) => !item.completedAt).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.dateBlock}>
          <Text style={styles.eyebrow}>DIARIO DE EMOCIONES</Text>
          <Text style={styles.headerTitle}>{formatLong(now)}</Text>
        </View>

        <Pressable style={styles.settings} onPress={() => router.push('/ajustes')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Ajustes">
          <Ionicons name="settings-outline" size={26} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>{last ? 'TU MOMENTO MÁS RECIENTE' : 'UN ESPACIO PARA TI'}</Text>
          <Text style={styles.heroBig}>{last ? (last.labels[0] ? `${emotionForLabel(last.labels[0])?.emoji ?? ''} ${last.labels[0]}` : QUADRANTS[quadrantOf(last.mood)].name) : '¿Cómo estás\nahora?'}</Text>
          <Text style={styles.heroSub}>{list.length ? `${list.length} ${list.length === 1 ? 'momento registrado' : 'momentos registrados'} hoy` : 'Tómate un momento para poner en palabras lo que sientes.'}</Text>
          {!list.length && <Pressable style={styles.heroAction} onPress={() => router.push('/nueva-entrada')} accessibilityRole="button"><Text style={styles.heroActionText}>Registrar cómo me siento</Text><Ionicons name="arrow-forward" size={18} color={colors.onMood} /></Pressable>}
        </View>

        {nextPlan && <Pressable style={styles.planCard} onPress={() => router.push(`/entrega/${nextPlan.id}`)} accessibilityRole="button" accessibilityLabel={`Siguiente paso: ${nextDeliverableStep(nextPlan)?.title}`}>
          <View style={styles.planIcon}><Ionicons name="checkbox-outline" size={20} color={colors.accent} /></View>
          <View style={styles.planCopy}><Text style={styles.planEyebrow}>TU SIGUIENTE PASO</Text><Text style={styles.planTitle} numberOfLines={1}>{nextDeliverableStep(nextPlan)?.title}</Text><Text style={styles.planSub}>{nextPlan.title} · {completionPercent(nextPlan.steps)}% completado</Text></View><Ionicons name="arrow-forward" size={18} color={colors.accent} />
        </Pressable>}

        <View style={styles.card}>
          <View style={styles.cardHeading}><View><Text style={styles.cardTitle}>Tu día</Text><Text style={styles.cardSub}>{list.length ? 'Cada punto es un momento que registraste' : 'Tus momentos aparecerán aquí'}</Text></View><Ionicons name="time-outline" size={20} color={colors.dim} /></View>
          <View style={styles.track}>
            {list.map((e) => {
              const m = new Date(e.at);
              const pct = ((m.getHours() * 60 + m.getMinutes()) / 1440) * 100;
              return <View key={e.id} style={[styles.dot, { left: `${pct}%`, backgroundColor: QUADRANTS[quadrantOf(e.mood)].color }]} />;
            })}
            <View style={[styles.now, { left: `${(minutes / 1440) * 100}%` }]} />
          </View>
          {!list.length && <View style={styles.timelineEmpty}><Text style={styles.timelineEmptyText}>Aún no hay momentos registrados</Text></View>}
          <View style={styles.ticks}>
            {['0 h', '6 h', '12 h', '18 h', '24 h'].map((t) => (
              <Text key={t} style={styles.tick}>{t}</Text>
            ))}
          </View>
        </View>

        <Pressable
          disabled={!list.length}
          onPress={() => router.push({ pathname: '/cierre', params: { day: today } })}
          style={[styles.card, styles.closingCard, !list.length && { opacity: 0.7 }]}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>Cierre del día</Text>
          {closing ? (
            <>
              <Text style={styles.score}>{closing.score}/10 · {closing.headline}</Text>
              <Text style={styles.cardSub}>Toca para ver el resumen o actualizarlo.</Text>
            </>
          ) : live ? (
            <>
              <Text style={styles.score}>{live.score}/10 hasta ahora</Text>
              <Text style={styles.cardSub}>Toca para ver el resumen y cerrar el día.</Text>
            </>
          ) : (
            <Text style={styles.cardSub}>Registra al menos un momento para poder cerrar el día.</Text>
          )}
        </Pressable>

        {[...list].reverse().map((e) => (
          <EntryCard key={e.id} entry={e} onDelete={deleteEntry} />
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/nueva-entrada')} accessibilityRole="button">
        <Ionicons name="add" size={24} color={colors.onMood} />
        <Text style={styles.fabText}>Nueva entrada</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4 },
  dateBlock: { gap: 5 },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerTitle: { color: colors.dim, fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  settings: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 22, paddingTop: 12, gap: 16, paddingBottom: 120 },
  hero: { alignItems: 'flex-start', paddingVertical: 18, gap: 10 },
  heroSmall: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.1 },
  heroBig: { color: colors.text, fontSize: 39, lineHeight: 46, fontWeight: '800', textAlign: 'left' },
  heroSub: { color: colors.dim, fontSize: 16, lineHeight: 23, maxWidth: 330 },
  heroAction: { minHeight: 50, marginTop: 5, backgroundColor: colors.accent, paddingHorizontal: 18, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroActionText: { color: colors.onMood, fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 18, gap: 10, borderWidth: 1, borderColor: colors.line },
  planCard: { minHeight: 76, backgroundColor: '#25243D', borderRadius: 18, borderWidth: 1, borderColor: '#514A79', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  planIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  planCopy: { flex: 1, gap: 3 }, planEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, planTitle: { color: colors.text, fontSize: 14, fontWeight: '700' }, planSub: { color: colors.dim, fontSize: 11 },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  cardSub: { color: colors.dim, fontSize: 13, lineHeight: 19, marginTop: 3 },
  closingCard: { minHeight: 104, justifyContent: 'center' },
  score: { color: colors.text, fontSize: 22, fontWeight: '700' },
  track: { height: 10, borderRadius: 8, backgroundColor: colors.surfaceHi, marginTop: 6 },
  timelineEmpty: { minHeight: 34, justifyContent: 'center' },
  timelineEmptyText: { color: colors.dim, fontSize: 13 },
  dot: { position: 'absolute', top: 1, width: 14, height: 14, borderRadius: 7, marginLeft: -7 },
  now: { position: 'absolute', top: -6, width: 2, height: 28, backgroundColor: '#fff', marginLeft: -1 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tick: { color: colors.dim, fontSize: 12 },
  fab: { position: 'absolute', right: 20, bottom: 18, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: 20, height: 54, borderRadius: radius.pill, elevation: 6 },
  fabText: { color: colors.onMood, fontSize: 16, fontWeight: '700' },
});

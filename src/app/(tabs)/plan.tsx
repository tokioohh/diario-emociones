import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dayKey, formatLong } from '../../core/dates';
import { completionPercent, nextDeliverableStep } from '../../core/planner';
import { useStore } from '../../core/store';
import Screen from '../../ui/Screen';
import { colors, radius } from '../../ui/theme';

const emoji = { proyecto: '🧩', examen: '📚', tarea: '✍️' } as const;

export default function Plan() {
  const { deliverables } = useStore();
  const today = dayKey(new Date());
  const sorted = [...deliverables].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const active = sorted.filter((item) => !item.completedAt);
  const completed = sorted.filter((item) => item.completedAt);
  const next = active[0];

  return (
    <Screen>
      <View style={styles.header}><View><Text style={styles.eyebrow}>UN PASO A LA VEZ</Text><Text style={styles.title}>Tu plan</Text></View><Pressable style={styles.addButton} onPress={() => router.push('/nueva-entrega')} accessibilityRole="button" accessibilityLabel="Añadir entrega"><Ionicons name="add" size={24} color={colors.onMood} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.content}>
        {next && <Pressable style={styles.todayCard} onPress={() => router.push(`/entrega/${next.id}`)} accessibilityRole="button">
          <View style={styles.todayTop}><View style={styles.todayIcon}><Text style={styles.todayEmoji}>{emoji[next.kind]}</Text></View><View style={styles.todayPill}><Text style={styles.todayPillText}>SIGUIENTE</Text></View></View>
          <Text style={styles.todayTitle}>{next.title}</Text>
          <Text style={styles.todaySub}>{nextDeliverableStep(next)?.title ?? 'Todo listo'} · {next.dueDate < today ? 'fecha vencida' : `vence ${formatLong(new Date(`${next.dueDate}T12:00:00`))}`}</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${completionPercent(next.steps)}%` }]} /></View>
          <View style={styles.todayBottom}><Text style={styles.progressText}>{completionPercent(next.steps)}% completado</Text><Ionicons name="arrow-forward" size={17} color={colors.accent} /></View>
        </Pressable>}

        <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>En marcha</Text><Text style={styles.count}>{active.length}</Text></View>
        {active.length ? active.map((item) => {
          const progress = completionPercent(item.steps);
          const overdue = item.dueDate < today;
          return <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/entrega/${item.id}`)} accessibilityRole="button" accessibilityLabel={`${item.title}, ${progress}% completado`}>
            <View style={styles.cardTop}><View style={styles.itemEmoji}><Text style={styles.emoji}>{emoji[item.kind]}</Text></View><View style={styles.itemCopy}><Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.itemMeta}>{item.course ? `${item.course} · ` : ''}{overdue ? 'Fecha vencida' : `Vence ${formatLong(new Date(`${item.dueDate}T12:00:00`))}`}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.dim} /></View>
            <View style={styles.miniProgress}><View style={[styles.miniFill, { width: `${progress}%` }]} /></View><View style={styles.cardBottom}><Text style={styles.cardStep} numberOfLines={1}>{nextDeliverableStep(item)?.title ?? 'Todo listo'}</Text><Text style={styles.cardPct}>{progress}%</Text></View>
          </Pressable>;
        }) : <View style={styles.empty}><View style={styles.emptyArt}><Text style={styles.emptyEmoji}>🌱</Text></View><Text style={styles.emptyTitle}>Empieza con una entrega</Text><Text style={styles.emptyCopy}>Proyectos, exámenes o tareas: los dividimos en pasos pequeños y claros.</Text><Pressable style={styles.emptyAction} onPress={() => router.push('/nueva-entrega')} accessibilityRole="button"><Text style={styles.emptyActionText}>Crear mi primer plan</Text><Ionicons name="arrow-forward" size={17} color={colors.onMood} /></Pressable></View>}

        {!!completed.length && <><View style={[styles.sectionTitle, { marginTop: 18 }]}><Text style={styles.sectionHeading}>Completadas</Text><Text style={styles.count}>{completed.length}</Text></View>{completed.map((item) => <Pressable key={item.id} style={[styles.card, styles.doneCard]} onPress={() => router.push(`/entrega/${item.id}`)} accessibilityRole="button"><View style={styles.cardTop}><View style={styles.doneIcon}><Ionicons name="checkmark" size={17} color={colors.accent} /></View><View style={styles.itemCopy}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.itemMeta}>Completada · {formatLong(new Date(`${item.dueDate}T12:00:00`))}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.dim} /></View></Pressable>)}</>}
        <View style={{ height: 34 }} />
      </ScrollView>
      {!!active.length && <Pressable style={styles.fab} onPress={() => router.push('/nueva-entrega')} accessibilityRole="button"><Ionicons name="add" size={20} color={colors.onMood} /><Text style={styles.fabText}>Nueva entrega</Text></Pressable>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 9, paddingBottom: 14 }, eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 3 }, addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, content: { paddingHorizontal: 22, gap: 11, paddingBottom: 90 },
  todayCard: { backgroundColor: '#25243D', borderColor: '#514A79', borderWidth: 1, borderRadius: 22, padding: 18, gap: 8, marginBottom: 8 }, todayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, todayIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' }, todayEmoji: { fontSize: 21 }, todayPill: { backgroundColor: '#3B355A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }, todayPillText: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1 }, todayTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 }, todaySub: { color: colors.dim, fontSize: 13, lineHeight: 19 }, progressTrack: { height: 7, backgroundColor: colors.surfaceHi, borderRadius: 5, overflow: 'hidden', marginTop: 6 }, progressFill: { height: 7, backgroundColor: colors.accent, borderRadius: 5 }, todayBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, progressText: { color: colors.dim, fontSize: 12, fontWeight: '600' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 1 }, sectionHeading: { color: colors.text, fontSize: 17, fontWeight: '700' }, count: { color: colors.dim, backgroundColor: colors.surfaceHi, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, fontWeight: '700' }, card: { backgroundColor: colors.surface, borderRadius: radius.card, borderColor: colors.line, borderWidth: 1, padding: 14, gap: 10 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, itemEmoji: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' }, emoji: { fontSize: 19 }, itemCopy: { flex: 1, gap: 4 }, itemTitle: { color: colors.text, fontSize: 15, fontWeight: '700' }, itemMeta: { color: colors.dim, fontSize: 12 }, miniProgress: { height: 5, borderRadius: 4, backgroundColor: colors.surfaceHi, overflow: 'hidden' }, miniFill: { height: 5, borderRadius: 4, backgroundColor: colors.accent }, cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardStep: { flex: 1, color: colors.dim, fontSize: 12, marginRight: 12 }, cardPct: { color: colors.accent, fontSize: 12, fontWeight: '800' }, doneCard: { opacity: 0.76 }, doneIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 22, padding: 22, marginTop: 2 }, emptyArt: { width: 70, height: 70, borderRadius: 24, backgroundColor: '#292642', alignItems: 'center', justifyContent: 'center', marginBottom: 11 }, emptyEmoji: { fontSize: 34 }, emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' }, emptyCopy: { color: colors.dim, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, maxWidth: 280 }, emptyAction: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', height: 46, borderRadius: radius.pill, backgroundColor: colors.accent, paddingHorizontal: 17, marginTop: 16 }, emptyActionText: { color: colors.onMood, fontSize: 13, fontWeight: '800' }, fab: { position: 'absolute', right: 20, bottom: 12, minHeight: 48, borderRadius: radius.pill, paddingHorizontal: 17, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.accent, elevation: 5 }, fabText: { color: colors.onMood, fontWeight: '800', fontSize: 13 },
});

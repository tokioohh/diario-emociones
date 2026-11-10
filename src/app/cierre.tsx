import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dayKey, formatLong, parseDay } from '../core/dates';
import { useStore } from '../core/store';
import { buildDaySummary } from '../core/summary';
import Screen from '../ui/Screen';
import { colors, radius } from '../ui/theme';

export default function Cierre() {
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day ?? dayKey(new Date());
  const { entriesOf, closings, closeDay } = useStore();
  const list = entriesOf(day);
  const saved = closings[day];
  const summary = list.length ? buildDaySummary(list) : null;
  const shown = summary ?? saved;
  const stale = !!saved && !!summary && (saved.entryCount !== list.length || saved.score !== summary.score);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.link}>Cerrar</Text>
        </Pressable>
        <Text style={styles.title}>{formatLong(parseDay(day))}</Text>
        <View style={{ width: 48 }} />
      </View>
      {shown ? (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.score}>{shown.score}<Text style={styles.of}>/10</Text></Text>
          <Text style={styles.headline}>{shown.headline}</Text>
          <View style={styles.card}>
            {shown.lines.map((l, i) => (
              <Text key={i} style={styles.line}>{l}</Text>
            ))}
          </View>
          {summary && (
            <Pressable
              style={styles.btn}
              onPress={() => {
                closeDay(day);
                router.back();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>{saved ? (stale ? 'Actualizar cierre' : 'Guardar de nuevo') : 'Cerrar el día'}</Text>
            </Pressable>
          )}
          <Text style={styles.note}>El resumen se calcula en tu teléfono con reglas simples; nada sale de él.</Text>
        </ScrollView>
      ) : (
        <Text style={[styles.note, { padding: 24 }]}>No hay registros en este día.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  link: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  body: { padding: 20, gap: 16, alignItems: 'stretch' },
  score: { color: colors.text, fontSize: 72, fontWeight: '800', textAlign: 'center' },
  of: { color: colors.dim, fontSize: 28, fontWeight: '600' },
  headline: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 18, gap: 10, borderWidth: 1, borderColor: colors.line },
  line: { color: colors.text, fontSize: 16, lineHeight: 23 },
  btn: { height: 54, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.onMood, fontSize: 17, fontWeight: '700' },
  note: { color: colors.dim, fontSize: 13, textAlign: 'center' },
});

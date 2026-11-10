import { router } from 'expo-router';
import * as LocalAuth from 'expo-local-authentication';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { pad2 } from '../core/dates';
import { useStore } from '../core/store';
import Screen from '../ui/Screen';
import { colors, radius } from '../ui/theme';

export default function Ajustes() {
  const { settings, updateSettings } = useStore();
  const r = settings.reminder;

  const toggleLock = async (on: boolean) => {
    if (!on) return void updateSettings({ lockEnabled: false });
    const level = await LocalAuth.getEnrolledLevelAsync();
    if (level === LocalAuth.SecurityLevel.NONE) {
      Alert.alert('Falta un bloqueo en el teléfono', 'Configura una huella, rostro o PIN en los ajustes del sistema y vuelve a intentarlo.');
      return;
    }
    const ok = await LocalAuth.authenticateAsync({ promptMessage: 'Confirma para activar el bloqueo' });
    if (ok.success) updateSettings({ lockEnabled: true });
  };

  const setReminder = async (patch: Partial<typeof r>) => {
    const ok = await updateSettings({ reminder: { ...r, ...patch } });
    if (!ok) Alert.alert('Notificaciones desactivadas', 'Permite las notificaciones de esta app en los ajustes del sistema para recibir el recordatorio.');
  };
  const step = (field: 'hour' | 'minute', delta: number) =>
    field === 'hour' ? setReminder({ hour: (r.hour + delta + 24) % 24 }) : setReminder({ minute: (r.minute + delta + 60) % 60 });

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.link}>Listo</Text></Pressable>
        <Text style={styles.title}>Ajustes</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Bloqueo con huella o PIN</Text>
              <Text style={styles.sub}>Se pide al abrir la app y al volver de segundo plano.</Text>
            </View>
            <Switch value={settings.lockEnabled} onValueChange={toggleLock} trackColor={{ true: colors.accent, false: colors.line }} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Recordatorio diario</Text>
              <Text style={styles.sub}>Una notificación para registrar o cerrar el día.</Text>
            </View>
            <Switch value={r.enabled} onValueChange={(v) => setReminder({ enabled: v })} trackColor={{ true: colors.accent, false: colors.line }} />
          </View>
          {r.enabled && (
            <View style={styles.time}>
              <Stepper label="Hora" value={pad2(r.hour)} onMinus={() => step('hour', -1)} onPlus={() => step('hour', 1)} />
              <Text style={styles.colon}>:</Text>
              <Stepper label="Minutos" value={pad2(r.minute)} onMinus={() => step('minute', -15)} onPlus={() => step('minute', 15)} />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tus datos</Text>
          <Text style={styles.sub}>Todo se guarda como archivos JSON en este teléfono. La app no usa internet y no tiene cuentas. El respaldo automático de Android está desactivado.</Text>
        </View>
      </View>
    </Screen>
  );
}

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Text style={styles.sub}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable onPress={onMinus} style={styles.stepBtn} accessibilityLabel={`${label} menos`}><Text style={styles.stepText}>−</Text></Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable onPress={onPlus} style={styles.stepBtn} accessibilityLabel={`${label} más`}><Text style={styles.stepText}>+</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  link: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  body: { padding: 20, gap: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { color: colors.text, fontSize: 17, fontWeight: '600' },
  sub: { color: colors.dim, fontSize: 14, lineHeight: 20 },
  time: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 14 },
  colon: { color: colors.text, fontSize: 28, paddingBottom: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.text, fontSize: 22 },
  value: { color: colors.text, fontSize: 28, fontWeight: '700', minWidth: 44, textAlign: 'center' },
});

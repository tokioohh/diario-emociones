import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import * as LocalAuth from 'expo-local-authentication';
import { useStore } from '../core/store';
import Screen from './Screen';
import { colors, radius } from './theme';

/** Bloquea la app con huella/rostro o el PIN del teléfono al abrirla y al volver de segundo plano. */
export default function LockGate({ children }: { children: ReactNode }) {
  const { ready, settings } = useStore();
  const [locked, setLocked] = useState(settings.lockEnabled);
  const busy = useRef(false);
  const wasBackground = useRef(false);

  const unlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await LocalAuth.authenticateAsync({ promptMessage: 'Desbloquea tu diario', cancelLabel: 'Cancelar' });
      if (r.success) setLocked(false);
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (ready && settings.lockEnabled && locked) unlock();
  }, [ready, settings.lockEnabled, locked, unlock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') wasBackground.current = true;
      if (s === 'active' && wasBackground.current) {
        wasBackground.current = false;
        if (settings.lockEnabled) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [settings.lockEnabled]);

  if (!ready) return <Screen><View /></Screen>;
  if (settings.lockEnabled && locked) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Diario bloqueado</Text>
          <Text style={styles.sub}>Usa tu huella, rostro o el PIN del teléfono.</Text>
          <Pressable style={styles.btn} onPress={unlock} accessibilityRole="button">
            <Text style={styles.btnText}>Desbloquear</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }
  return <>{children}</>;
}
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  sub: { color: colors.dim, fontSize: 15, textAlign: 'center' },
  btn: { marginTop: 12, backgroundColor: colors.accent, paddingHorizontal: 28, height: 50, borderRadius: radius.pill, justifyContent: 'center' },
  btnText: { color: colors.onMood, fontSize: 17, fontWeight: '700' },
});

import { router, Stack, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import '../core/notifications';
import { StoreProvider } from '../core/store';
import LockGate from '../ui/LockGate';
import { colors } from '../ui/theme';

export default function RootLayout() {
  const notificationResponse = Notifications.useLastNotificationResponse();
  const handledNotification = useRef<string | null>(null);
  useEffect(() => {
    const response = notificationResponse;
    if (!response || handledNotification.current === response.notification.request.identifier) return;
    const url = response.notification.request.content.data?.url;
    if (typeof url !== 'string' || !/^\/entrega\/[^/]+$/.test(url)) return;
    handledNotification.current = response.notification.request.identifier;
    router.push(url as Href);
    void Notifications.clearLastNotificationResponseAsync();
  }, [notificationResponse]);

  return (
    <StoreProvider>
      <LockGate>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="nueva-entrada" options={{ presentation: 'modal' }} />
          <Stack.Screen name="cierre" options={{ presentation: 'modal' }} />
          <Stack.Screen name="ajustes" options={{ presentation: 'modal' }} />
          <Stack.Screen name="nueva-entrega" options={{ presentation: 'modal' }} />
          <Stack.Screen name="entrega/[id]" />
        </Stack>
      </LockGate>
    </StoreProvider>
  );
}

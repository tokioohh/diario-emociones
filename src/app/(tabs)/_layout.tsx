import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { colors } from '../../ui/theme';

const icon = (name: keyof typeof Ionicons.glyphMap) => {
  const TabIcon = ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;
  TabIcon.displayName = `TabIcon(${name})`;
  return TabIcon;
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.dim,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line, borderTopWidth: 1, height: 62, paddingTop: 5, paddingBottom: 5, elevation: 0 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoy', tabBarIcon: icon('moon-outline') }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: icon('checkbox-outline') }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario', tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="reporte" options={{ title: 'Reporte', tabBarIcon: icon('bar-chart-outline') }} />
    </Tabs>
  );
}

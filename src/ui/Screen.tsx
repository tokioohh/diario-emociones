import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Starfield from './Starfield';
import { colors } from './theme';

export default function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={styles.root}>
      <Starfield />
      <SafeAreaView style={[styles.fill, style]} edges={['top']}>
        {children}
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg }, fill: { flex: 1 } });

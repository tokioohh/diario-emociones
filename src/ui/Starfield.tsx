import { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

// A quiet, deterministic night sky that stays light on view count.
function Starfield() {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => {
    const seeded = (index: number, salt: number) => {
      const value = Math.sin((index + 1) * salt * 93.73) * 10000;
      return value - Math.floor(value);
    };
    return Array.from({ length: 24 }, (_, i) => ({ x: seeded(i, 1) * width, y: seeded(i, 2) * height, r: 0.7 + seeded(i, 3), o: 0.12 + seeded(i, 4) * 0.24 }));
  }, [width, height]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((st, i) => (
        <View key={i} style={{ position: 'absolute', left: st.x, top: st.y, width: st.r * 2, height: st.r * 2, borderRadius: st.r, backgroundColor: '#FFFFFF', opacity: st.o }} />
      ))}
    </View>
  );
}
export default memo(Starfield);

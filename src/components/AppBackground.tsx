import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

/**
 * 全局背景：柔和渐变底（参考图风格）
 *
 * 说明：
 * - 目标是把“灵动活泼”的氛围作为全局默认背景
 * - 卡片与按钮负责提供“玻璃质感/高亮”，让页面不死板
 */
export function AppBackground(props: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={['#F9F8F6', '#F9F8F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      pointerEvents="box-none"
      style={styles.root}
    >
      {/* 用径向渐变替代多层实心圆，边缘更柔和、无明显圈层边界 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="warmGlow" cx="128" cy="341" r="300" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFE1C5" stopOpacity="0.90" />
              <Stop offset="0.38" stopColor="#FFE1C5" stopOpacity="0.46" />
              <Stop offset="0.72" stopColor="#FFE1C5" stopOpacity="0.18" />
              <Stop offset="1" stopColor="#FFE1C5" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="coolGlow" cx="265" cy="412" r="300" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#B5DEFF" stopOpacity="0.80" />
              <Stop offset="0.38" stopColor="#B5DEFF" stopOpacity="0.46" />
              <Stop offset="0.72" stopColor="#B5DEFF" stopOpacity="0.18" />
              <Stop offset="1" stopColor="#B5DEFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width="393" height="852" fill="url(#warmGlow)" />
          <Rect x="0" y="0" width="393" height="852" fill="url(#coolGlow)" />
        </Svg>
      </View>
      {props.children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
});


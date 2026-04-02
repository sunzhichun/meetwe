import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MeetWeProvider } from './src/context/MeetWeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { meetWeTheme } from './src/theme';
import { AppBackground } from './src/components/AppBackground';

/**
 * App 根组件
 *
 * 结构说明：
 * - SafeAreaProvider：适配刘海屏安全区
 * - NativeBaseProvider：统一组件主题（圆角/配色）
 * - NavigationContainer：页面路由容器
 * - MeetWeProvider：MeetWe 会话状态（参与者/约会类型/最近一次结果）
 */
export default function App() {
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      // 让 NavigationContainer 的“背景色”不与渐变打架
      background: 'transparent',
    },
  };

  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={meetWeTheme}>
        <MeetWeProvider>
          <AppBackground>
            <NavigationContainer theme={navTheme}>
              <AppNavigator />
              <StatusBar style="dark" />
            </NavigationContainer>
          </AppBackground>
        </MeetWeProvider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}

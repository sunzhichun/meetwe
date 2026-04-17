import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { GroupSetupScreen } from '../screens/GroupSetupScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { PlanListScreen } from '../screens/PlanListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * App 主导航栈
 *
 * 三个页面：
 * - Home：品牌介绍 + 进入设置
 * - GroupSetup：输入参与者/交通方式/约会类型
 * - Results：展示推荐列表与关键指标
 */
export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerTransparent: false,
        headerStyle: {
          backgroundColor: '#F9F8F6',
        },
        headerTintColor: '#1A1A1A',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupSetup"
        component={GroupSetupScreen}
        options={{ title: '聚会设置' }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ title: '推荐结果' }}
      />
      <Stack.Screen
        name="PlanList"
        component={PlanListScreen}
        options={{ title: '计划清单' }}
      />
    </Stack.Navigator>
  );
}

import React from 'react';
import { Box, Pressable, ScrollView, Text, VStack } from 'native-base';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import { useMeetWe } from '../context/MeetWeContext';
import { RecommendationCard } from '../components/RecommendationCard';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanList'>;

/**
 * 计划清单页
 *
 * 目标：
 * - 展示用户从结果页加入的候选方案
 * - 字段口径与结果卡片保持一致
 */
export function PlanListScreen({ navigation }: Props) {
  const { planItems, removePlanItem } = useMeetWe();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerBackButtonDisplayMode: 'minimal',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} px={2} py={1} accessibilityLabel="返回">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  return (
    <Box flex={1}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 28, paddingTop: 80 }}>
        <VStack space={4} alignItems="stretch" w="100%">
          {planItems.length === 0 ? (
            <Box
              bg="rgba(255,255,255,0.58)"
              borderRadius="3xl"
              borderWidth={1}
              borderColor="rgba(255,255,255,0.4)"
              p={4}
              w="100%"
            >
              <Text color="gray.700">计划清单暂时为空，可在推荐页点击“加入计划”。</Text>
            </Box>
          ) : null}

          {planItems.map((item) => (
            <RecommendationCard
              key={item.id}
              recommendation={item.recommendation}
              participantLabels={item.participantLabels}
              participantCoords={item.participantCoords}
              participantTransports={item.participantTransports}
              // PlanList 中只展示已加入的项，因此“钉子”支持取消选中（移除计划项）
              onTogglePlan={(rec) => removePlanItem(rec.place.id)}
              isPlanned={true}
            />
          ))}
        </VStack>
      </ScrollView>
    </Box>
  );
}


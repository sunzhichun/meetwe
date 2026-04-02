import React from 'react';
import { Box, Text, VStack } from 'native-base';
import { useWindowDimensions } from 'react-native';
import type { ResultsMapSectionProps } from './types';

/**
 * Web：react-native-maps 不可用，提供占位说明（真机/模拟器用 Expo Go 看地图）
 */
export function ResultsMapSection(props: ResultsMapSectionProps) {
  const { height } = useWindowDimensions();
  const h = Math.min(240, Math.round(height * 0.28));

  if (props.mapTopRecommendations.length === 0 && props.participantCoords.length === 0) {
    return null;
  }

  return (
    <Box
      h={h}
      w="100%"
      borderRadius="2xl"
      bg="rgba(255,255,255,0.45)"
      borderWidth={1}
      borderColor="rgba(255,255,255,0.35)"
      justifyContent="center"
      alignItems="center"
      px={4}
    >
      <VStack space={2} alignItems="center">
        <Text fontWeight="bold" color="gray.700">
          地图预览
        </Text>
        <Text fontSize="sm" color="gray.600" textAlign="center">
          网页端暂不渲染地图。请在 Expo Go（iOS / Android）中查看参与者位置与 Top5 推荐点。
        </Text>
      </VStack>
    </Box>
  );
}

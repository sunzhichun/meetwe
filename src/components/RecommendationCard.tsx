import React from 'react';
import { Linking } from 'react-native';
import { Box, HStack, Pressable, Text, VStack } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { LatLng, Recommendation, TransportMode } from '../types';
import { GlassCard } from './GlassCard';

/**
 * 推荐卡片（v0.2 视觉版）
 *
 * 口径：
 * - 去掉“类别单独展示”
 * - 不展示推荐名次序号
 * - 地点名下仅展示：评分 + 平均耗时
 * - 平均耗时显示整数
 * - 每人通勤使用进度条表现差异
 */
export function RecommendationCard(props: {
  recommendation: Recommendation;
  participantLabels: string[];
  participantCoords: LatLng[];
  participantTransports: TransportMode[];
  onTogglePlan?: (recommendation: Recommendation) => void;
  isPlanned?: boolean;
}) {
  const r = props.recommendation;
  const maxTime = Math.max(...r.timesMinutes, 1);
  const isPlanned = props.isPlanned ?? false;

  return (
    <GlassCard px={5} py={5} w="100%">
      <VStack space={3}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space={2} alignItems="center" flex={1}>
            <Text fontSize="lg" fontWeight="bold" color="#1A1A1A" numberOfLines={1} flex={1}>
              {r.place.name}
            </Text>
          </HStack>

          {props.onTogglePlan ? (
            <Pressable onPress={() => props.onTogglePlan?.(r)}>
              <Box
                w={9}
                h={9}
                borderRadius="full"
                borderWidth={1}
                // 强制使用 RN style，避免 native-base 的 bg/borderColor 在不同平台/主题下被二次解析
                alignItems="center"
                justifyContent="center"
                style={{
                  // 选中态使用“纯色/不透明”，避免与玻璃卡片底色混合后看起来偏绿
                  backgroundColor: isPlanned ? '#F48549' : '#FFFFFF',
                  borderColor: isPlanned ? '#F48549' : 'rgba(0,0,0,0.06)',
                }}
              >
                <Box style={{ transform: [{ rotate: '45deg' }] }}>
                  <MaterialCommunityIcons
                    name="pin"
                    size={15}
                    color={isPlanned ? '#FFFFFF' : '#F48549'}
                  />
                </Box>
              </Box>
            </Pressable>
          ) : null}
        </HStack>

        <HStack space={2} flexWrap="wrap">
          <Box px={2.5} py={1} borderRadius={999 / 2} bg="rgba(242,208,115,0.2)" borderWidth={1} borderColor="#E7A115">
            <Text fontSize="xs" color="#E7A115">
              评分 {r.rating.toFixed(1)}
            </Text>
          </Box>
          <Box px={2.5} py={1} borderRadius={999 / 2} bg="rgba(115,185,241,0.2)" borderWidth={1} borderColor="#1E80CE">
            <Text fontSize="xs" color="#1E80CE">
              平均耗时 {Math.round(r.meanMinutes)} min
            </Text>
          </Box>
        </HStack>

        <VStack space={2}>
          {r.timesMinutes.map((t, idx) => {
            // 使用整数百分比，避免 Fabric 下浮点 -> long long 的精度转换异常
            const percent = Math.round(Math.max(8, Math.min(100, (t / maxTime) * 100)));
            const label = props.participantLabels[idx] ?? `${idx + 1}`;
            return (
              <Pressable
                key={`${r.place.id}_bar_${idx}`}
                onPress={() =>
                  openAmapRoute({
                    from: props.participantCoords[idx],
                    to: r.place.coordinate,
                    mode: props.participantTransports[idx],
                  })
                }
              >
                <VStack space={1}>
                  <HStack justifyContent="space-between">
                    <Text fontSize="xs" color="#4A4A4A">
                      {label}
                    </Text>
                    <Text fontSize="xs" color="#4A4A4A">
                      {Math.round(t)} min
                    </Text>
                  </HStack>
                  <Box
                    h={2.5}
                    borderRadius="full"
                    bg="rgba(255,255,255,0.55)"
                    overflow="hidden"
                  >
                    <Box
                      h="100%"
                      borderRadius="full"
                      bg="#C7E6FF"
                      // NativeBase width 以百分比字符串最稳妥
                      w={`${percent}%`}
                    />
                  </Box>
                </VStack>
              </Pressable>
            );
          })}
        </VStack>
      </VStack>
    </GlassCard>
  );
}

function openAmapRoute(params: { from?: LatLng; to: LatLng; mode?: TransportMode }) {
  if (!params.from) return;
  const style = amapStyle(params.mode);
  const url = `androidamap://route?sourceApplication=MeetWe&dlat=${params.to.lat}&dlon=${params.to.lng}&slat=${params.from.lat}&slon=${params.from.lng}&dev=0&t=${style}`;
  void Linking.openURL(url);
}

function amapStyle(mode?: TransportMode): number {
  // 高德 t：0=驾车，1=公交，2=步行，3=骑行
  if (mode === 'car') return 0;
  if (mode === 'walk') return 2;
  if (mode === 'ebike' || mode === 'bike') return 3;
  return 1;
}

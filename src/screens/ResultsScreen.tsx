import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated } from 'react-native';
import { Box, Button, HStack, Pressable, ScrollView, Slider, Text, VStack } from 'native-base';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RecommendationCard } from '../components/RecommendationCard';
import { EventTypePicker } from '../components/EventTypePicker';
import { ResultsMapSection } from '../components/resultsMap/ResultsMapSection';
import { useMeetWe } from '../context/MeetWeContext';
import type { EventType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

/**
 * 结果页：展示 Top 推荐列表（带轻微渐入动画）
 */
export function ResultsScreen({ navigation }: Props) {
  const {
    lastResult,
    session,
    setEventType,
    addPlanItem,
    removePlanItem,
    planItems,
    isComputing,
    computeError,
    computeRecommendations,
  } = useMeetWe();
  const [ratingThreshold, setRatingThreshold] = React.useState(4.0);
  const [ratingSliderValue, setRatingSliderValue] = React.useState(4.0);
  const [mapCollapsed, setMapCollapsed] = React.useState(false);
  const [mapFullscreen, setMapFullscreen] = React.useState(false);
  const plannedPlaceIds = React.useMemo(() => {
    return new Set(planItems.map((x) => x.recommendation.place.id));
  }, [planItems]);

  const participantLabels = useMemo(() => {
    return session.participants.map((p) => p.displayName?.trim() || '未命名');
  }, [session.participants]);
  const participantCoords = useMemo(
    () => lastResult?.participantCoords.map((x) => x.coordinate) ?? [],
    [lastResult]
  );
  const participantTransports = useMemo(
    () => session.participants.map((p) => p.transport),
    [session.participants]
  );

  // 把 PlanList 入口放到顶部 header 右侧，与“推荐结果”标题同一层级，避免遮挡/滚动影响
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerBackButtonDisplayMode: 'minimal',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} px={2} py={1} accessibilityLabel="返回">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
      ),
      headerRight: mapFullscreen
        ? undefined
        : () => (
            <Pressable
              onPress={() => navigation.navigate('PlanList')}
              accessibilityLabel="查看计划清单"
              style={{ marginRight: 20 }}
            >
              <Box
                flexDirection="row"
                alignItems="center"
                bg="white"
                borderRadius={16}
                borderWidth={1}
                borderColor="rgba(0,0,0,0.06)"
                px={3}
                py={1.5}
              >
                <VStack alignItems="center" justifyContent="center" mr={1.5} mt={0.5}>
                  <Box style={{ transform: [{ rotate: '45deg' }] }}>
                    <MaterialCommunityIcons name="pin" size={14} color="#E8672D" />
                  </Box>
                  <Text fontSize={9} color="#1A1A1A" fontWeight="bold" lineHeight={10} mt={-1}>
                    {planItems.length}
                  </Text>
                </VStack>
                <Box w="1px" h={3} bg="rgba(0,0,0,0.1)" mr={1.5} />
                <Feather name="menu" size={16} color="#4A4A4A" />
              </Box>
            </Pressable>
          ),
    });
  }, [navigation, planItems.length, mapFullscreen]);

  if (!lastResult) {
    return (
      <Box flex={1} px={5} py={8}>
        <Text color="gray.700">暂无计算结果。请返回上一页生成推荐。</Text>
        <Button mt={4} borderRadius="3xl" onPress={() => navigation.navigate('GroupSetup')}>
          返回聚会设置
        </Button>
      </Box>
    );
  }

  const filteredRecs = useMemo(
    () => lastResult.recommendations.filter((x) => x.rating >= ratingThreshold),
    [lastResult.recommendations, ratingThreshold]
  );
  const mapTopRecommendations = useMemo(() => filteredRecs.slice(0, 5), [filteredRecs]);
  const shouldShowRerankHint = filteredRecs.length < 3;

  const onChangeEventType = async (next: EventType) => {
    setEventType(next);
    const nextSession = { ...session, eventType: next };
    try {
      await computeRecommendations(nextSession);
    } catch {
      // UI 在下方根据 computeError 展示（不弹 alert，避免打断用户操作）
    }
  };

  const onRecomputeByRating = async () => {
    try {
      await computeRecommendations(undefined, { minRating: ratingThreshold });
    } catch {
      // UI 在上方根据 computeError 展示
    }
  };

  return (
    <Box flex={1} position="relative">
      {isComputing ? (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(255,255,255,0.72)"
          zIndex={20}
          alignItems="center"
          justifyContent="center"
        >
          <ActivityIndicator size="large" />
        </Box>
      ) : null}
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ padding: 20, paddingBottom: 110, paddingTop: 70, alignItems: 'stretch' }}
      >
        <VStack space={5} alignItems="stretch" w="100%">
          {computeError && !isComputing ? (
            <Box bg="white" borderRadius="2xl" p={4} shadow={1}>
              <Text color="red.600" fontWeight="bold">
                计算失败
              </Text>
              <Text color="gray.700" mt={2}>
                {computeError}
              </Text>
            </Box>
          ) : null}

          {/* 模块A：评分筛选器 */}
          <Box
            bg="rgba(181,222,255,0.40)"
            borderRadius="2xl"
            p={5}
            w="100%"
            shadow={0}
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 1 }}
          >
            <VStack space={3}>
              <VStack space={2}>
                <EventTypePicker value={session.eventType} onChange={onChangeEventType} />
              </VStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.700" fontWeight="bold">
                  评分筛选
                </Text>
                <Text color="gray.700" fontWeight="bold">
                  {ratingSliderValue.toFixed(1)} 分以上
                </Text>
              </HStack>
              <Slider
                minValue={3.5}
                maxValue={5}
                step={0.1}
                value={ratingSliderValue}
                onChange={(v) => setRatingSliderValue(Number(v.toFixed(1)))}
                onChangeEnd={(v) => {
                  const nextValue = Number(v.toFixed(1));
                  setRatingSliderValue(nextValue);
                  setRatingThreshold(nextValue);
                }}
                isDisabled={isComputing}
              >
                <Slider.Track bg="rgba(255,255,255,0.5)">
                  <Slider.FilledTrack bg="#F48549" />
                </Slider.Track>
                <Slider.Thumb bg="#F48549" />
              </Slider>
            </VStack>
          </Box>

          {/* 模块B：地图（与评分筛选联动：仅展示筛选后 Top5 推荐点） */}
          <Box
            bg="rgba(255,253,235,0.85)"
            borderRadius="2xl"
            p={5}
            w="100%"
            shadow={0}
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 1 }}
          >
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text color="gray.700" fontWeight="bold">
                  地图
                </Text>
                <Pressable
                  onPress={() => setMapCollapsed((v) => !v)}
                  accessibilityLabel={mapCollapsed ? '展开地图模块' : '折叠地图模块'}
                >
                  <Box px={2} py={1} borderRadius={10} bg="rgba(255,255,255,0.65)">
                    <Feather name={mapCollapsed ? 'chevron-down' : 'chevron-up'} size={16} color="#4A4A4A" />
                  </Box>
                </Pressable>
              </HStack>
              {mapCollapsed ? null : (
                <ResultsMapSection
                  participantCoords={participantCoords}
                  participantLabels={participantLabels}
                  mapTopRecommendations={mapTopRecommendations}
                  onFullscreenChange={setMapFullscreen}
                />
              )}
            </VStack>
          </Box>

          <VStack space={4} alignItems="stretch" w="100%">
            {shouldShowRerankHint ? (
              <Box bg="white" borderRadius="2xl" p={4} w="100%">
                <Text color="gray.700">
                  当前评分下结果较少，可重新检索并为您推荐高分地点。
                </Text>
                <Button
                  mt={3}
                  alignSelf="flex-start"
                  borderRadius="full"
                  px={5}
                  onPress={() => {
                    void onRecomputeByRating();
                  }}
                  isDisabled={isComputing}
                >
                  重新推荐
                </Button>
              </Box>
            ) : null}

            {filteredRecs.slice(0, 8).map((r, idx) => (
              <StaggerFadeIn key={r.place.id} index={idx}>
                <RecommendationCard
                  recommendation={r}
                  participantLabels={participantLabels}
                  participantCoords={participantCoords}
                  participantTransports={participantTransports}
                  onTogglePlan={(rec) => {
                    const placeId = rec.place.id;
                    if (plannedPlaceIds.has(placeId)) {
                      removePlanItem(placeId);
                    } else {
                      addPlanItem(rec);
                    }
                  }}
                  isPlanned={plannedPlaceIds.has(r.place.id)}
                />
              </StaggerFadeIn>
            ))}
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}

/**
 * 轻微“错峰渐入”动画：让结果页更有生命感（MVP 级微动效）
 */
function StaggerFadeIn(props: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const delay = props.index * 70;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [opacity, props.index, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], width: '100%' }}>
      {props.children}
    </Animated.View>
  );
}

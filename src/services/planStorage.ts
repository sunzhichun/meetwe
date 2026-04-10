import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlanItem } from '../types';

const PLAN_STORAGE_KEY = '@meetwe_plan_list_v1';

export async function savePlanItems(items: PlanItem[]): Promise<void> {
  await AsyncStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(items));
}

function isLegacyMockPlanItem(item: PlanItem): boolean {
  const placeId = item.recommendation?.place?.id ?? '';
  const placeName = item.recommendation?.place?.name ?? '';

  // 旧 mock 阶段生成的地点通常具备稳定前缀：
  // - id: place_*
  // - name: 暖食聚点 / 轻生活聚点 / 星光聚点 / 趣玩聚点 / 漫行聚点
  if (placeId.startsWith('place_')) return true;
  if (
    placeName.startsWith('暖食聚点') ||
    placeName.startsWith('轻生活聚点') ||
    placeName.startsWith('星光聚点') ||
    placeName.startsWith('趣玩聚点') ||
    placeName.startsWith('漫行聚点')
  ) {
    return true;
  }

  return false;
}

export async function loadPlanItems(): Promise<PlanItem[]> {
  const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PlanItem[];
    return parsed.filter((item) => !isLegacyMockPlanItem(item));
  } catch {
    return [];
  }
}


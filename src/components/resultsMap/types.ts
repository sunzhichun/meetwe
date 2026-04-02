import type { LatLng, Recommendation } from '../../types';

export type ResultsMapSectionProps = {
  participantCoords: LatLng[];
  participantLabels: string[];
  /** 已与评分筛选联动后的 Top5，用于红点与序号 */
  mapTopRecommendations: Recommendation[];
};

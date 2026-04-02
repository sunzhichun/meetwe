import type { LatLng } from '../types';

/**
 * 高德 Web 服务通用返回结构（JSON 模式下）
 */
export type AmapBaseResponse =
  | { status: '1' | 1; info: 'ok' | string; infocode?: string; count?: string | number }
  | { status: '0' | 0; info: string; infocode?: string; count?: string | number };

/**
 * 地理编码（v3/geocode/geo）
 */
export type AmapGeocodeResult = {
  location: string; // "lon,lat"
  formatted_address?: string;
  citycode?: string; // 行政/城市编码（公交接口所需）
  adcode?: string;
};

export type AmapGeocodeResponse = AmapBaseResponse & {
  geocodes?: AmapGeocodeResult[];
};

/**
 * 路径规划 2.0（v5/direction/*）返回中我们关心的最小子集。
 * 注意：不同 mode 返回字段结构可能略有差异，因此用更宽松的类型。
 */
export type AmapRouteDurationSeconds = string | number;

export type AmapRoutePath = {
  duration?: AmapRouteDurationSeconds; // 秒
};

export type AmapDrivingWalkingCyclingResponse = AmapBaseResponse & {
  route?: {
    paths?: AmapRoutePath[];
  };
};

/**
 * 公交（v5/direction/transit/integrated）
 * 依据文档：transits[].transit[].duration 单位：秒（或 route.duration 作为兜底）。
 */
export type AmapTransitPlan = {
  duration?: AmapRouteDurationSeconds;
};

export type AmapTransitSegment = {
  transits?: {
    // 部分响应中 transit 字段为数组或对象，这里保持兼容
    transit?: AmapTransitPlan | AmapTransitPlan[];
    // 有的响应层级会在 transit 处直接给 duration
    duration?: AmapRouteDurationSeconds;
  }[];
};

export type AmapTransitIntegratedResponse = AmapBaseResponse & {
  route?: {
    duration?: AmapRouteDurationSeconds;
    // transit 相关字段在 v5 接口中通常位于 route 下
    transits?: {
      transit?: AmapTransitPlan | AmapTransitPlan[];
      duration?: AmapRouteDurationSeconds;
    }[];
  };
};

/**
 * POI 搜索（后续接入 place/text 或 place/around）
 * 这里先给出一个“我们需要字段”的最小形状，避免过度绑定接口细节。
 */
export type AmapPoi = {
  id?: string; // POI ID（若有）
  name?: string;
  location?: string; // "lon,lat"
  address?: string;
  cityname?: string;
  adname?: string;
  citycode?: string;
  adcode?: string;
  // 可能来自 different 字段：rating/overall_rating/biz_ext 等
  rating?: number | string;
  overall_rating?: number | string;
  biz_ext?: { rating?: number | string } | string;
  // POI 类目/标签（用于与 eventType 映射）
  type?: string;
};

export type AmapPoiSearchResponse = AmapBaseResponse & {
  pois?: Array<{
    id?: string;
    name?: string;
    location?: string;
    address?: string;
    cityname?: string;
    adname?: string;
    citycode?: string;
    adcode?: string;
    type?: string;
    biz_ext?: { rating?: string | number } | string;
    rating?: string | number;
    overall_rating?: string | number;
    // 兼容其他字段
  }>;
};

/**
 * 统一的高德 POI 规范化输出（供推荐逻辑使用）
 */
export type NormalizedAmapPoi = {
  id: string;
  name: string;
  coordinate: LatLng;
  rating: number | null; // 无评分用 null，后续做过滤
  category: string | null;
};


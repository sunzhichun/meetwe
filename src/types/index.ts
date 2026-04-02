/**
 * 全局类型定义：MeetWe 的会话输入、计算结果与推荐项结构。
 */

/** 交通方式 */
export type TransportMode = 'car' | 'bus' | 'walk' | 'ebike' | 'bike';

/**
 * 约会类型（影响模拟候选地点类别与评分分布）
 *
 * 与真实 POI 对接时，多标签冲突下的归类优先级（仅用于候选归类）：
 * 美食 > 商城购物 > 景点 > 休闲玩乐 > 电影
 */
export type EventType = 'food' | 'shopping' | 'movie' | 'leisure' | 'sightseeing';

/** 与上面优先级一致，供 mock 归类等复用 */
export const EVENT_TYPE_PRIORITY: readonly EventType[] = [
  'food',
  'shopping',
  'sightseeing',
  'leisure',
  'movie',
] as const;

/** 经纬度坐标 */
export type LatLng = { lat: number; lng: number };

/** 单个参与者 */
export type Participant = {
  /** 稳定 id（用于列表 key 与确定性噪声种子） */
  id: string;
  /** 展示名称（可选） */
  displayName: string;
  /** 用户输入的文本地址（模拟阶段：不调用真实地理编码） */
  addressText: string;
  /** 通过 POI 联想选择后的坐标（有值时优先使用，避免二次 geocode 失败） */
  selectedCoordinate?: LatLng;
  /** 通过 POI 联想选择后的城市编码（公交接口 city1/city2） */
  selectedCityCode?: string;
  /** 通过 POI 联想选择后的行政区编码（用于 city/adcode 搜索约束） */
  selectedAdCode?: string;
  /** 交通方式 */
  transport: TransportMode;
  /** 确认后折叠卡片，仅展示昵称与交通方式 */
  collapsed?: boolean;
};

/** 一次“约会团体”会话输入 */
export type MeetWeSession = {
  participants: Participant[];
  eventType: EventType;
};

/** 模拟地点 */
export type MockPlace = {
  id: string;
  name: string;
  category: string;
  coordinate: LatLng;
};

/** 单个候选地点的计算指标 */
export type CandidateMetrics = {
  place: MockPlace;
  /** 每个参与者到达该地点的通勤时间（分钟） */
  timesMinutes: number[];
  /** 通勤时间方差（人口方差：更直观反映“是否公平”） */
  variance: number;
  /** 平均通勤时间（分钟） */
  meanMinutes: number;
  /** 模拟地点评分（3.5~5.0） */
  rating: number;
};

/** 最终展示的一条推荐 */
export type Recommendation = CandidateMetrics & {
  /** 是否处于“通勤指标接近”的决胜区间，从而触发了评分 tie-breaker */
  tieBreakerApplied: boolean;
};

/** 计算结果（用于结果页展示与可选持久化） */
export type MeetWeComputationResult = {
  /** 推荐列表（已排序） */
  recommendations: Recommendation[];
  /** 参与者解析后的坐标（便于结果页展示/复盘） */
  participantCoords: {
    participantId: string;
    coordinate: LatLng;
    addressText: string;
    source?: 'selected' | 'geocode' | 'poi-search';
    resolvedText?: string;
  }[];
  /** 调试统计：用于定位空结果卡在哪一层 */
  debugStats?: {
    rawPois: number;
    ratedPois: number;
    routeCandidates: number;
    finalCandidates: number;
    routeFailCount: number;
    missingCityCodeCount: number;
    firstRouteError?: string;
    participantModes: TransportMode[];
  };
  /** 生成时间戳 */
  computedAt: number;
};

/**
 * 计划清单项：用户从推荐结果中“加入计划”的快照
 *
 * 说明：
 * - 保留推荐卡片展示所需字段
 * - 同时保留“每位参与者的坐标+交通方式”，以支持点击进度条跳高德
 */
export type PlanItem = {
  id: string;
  addedAt: number;
  sessionSignature?: string;
  recommendation: Recommendation;
  participantLabels: string[];
  participantCoords: LatLng[];
  participantTransports: TransportMode[];
};

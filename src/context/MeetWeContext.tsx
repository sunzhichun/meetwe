import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  MeetWeComputationResult,
  MeetWeSession,
  Participant,
  EventType,
  PlanItem,
  Recommendation,
} from '../types';
import {
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS,
  createInitialSession,
  createNewParticipant,
} from '../state/meetweSession';
import { loadLastSession, saveLastSession } from '../services/sessionStorage';
import { loadPlanItems, savePlanItems } from '../services/planStorage';
import { computeMeetWeRecommendations } from '../logic/recommend';
import type { ComputeRecommendationOptions } from '../logic/recommend';

type MeetWeContextValue = {
  /** 当前会话（输入侧状态） */
  session: MeetWeSession;
  /** 直接替换会话（用于从本地存储恢复） */
  setSession: React.Dispatch<React.SetStateAction<MeetWeSession>>;
  /** 更新某个参与者字段 */
  updateParticipant: (id: string, patch: Partial<Participant>) => void;
  /** 新增参与者（最多 6） */
  addParticipant: () => void;
  /** 删除参与者（最少 2） */
  removeParticipant: (id: string) => void;
  /** 修改约会类型 */
  setEventType: (eventType: EventType) => void;
  /** 最近一次计算结果（便于结果页与后续扩展：分享/收藏） */
  lastResult: MeetWeComputationResult | null;
  setLastResult: React.Dispatch<React.SetStateAction<MeetWeComputationResult | null>>;
  /** 计划清单（跨重启持久化） */
  planItems: PlanItem[];
  addPlanItem: (recommendation: Recommendation) => void;
  removePlanItem: (placeId: string) => void;

  /** 异步计算状态（接入真实地图后用于避免重复触发/提示错误） */
  isComputing: boolean;
  computeError: string | null;
  computeRecommendations: (
    overrideSession?: MeetWeSession,
    options?: ComputeRecommendationOptions
  ) => Promise<MeetWeComputationResult>;
};

const MeetWeContext = createContext<MeetWeContextValue | null>(null);

function patchChangesParticipantMeaningfully(patch: Partial<Participant>): boolean {
  return (
    Object.prototype.hasOwnProperty.call(patch, 'displayName') ||
    Object.prototype.hasOwnProperty.call(patch, 'addressText') ||
    Object.prototype.hasOwnProperty.call(patch, 'transport') ||
    Object.prototype.hasOwnProperty.call(patch, 'selectedCoordinate') ||
    Object.prototype.hasOwnProperty.call(patch, 'selectedCityCode') ||
    Object.prototype.hasOwnProperty.call(patch, 'selectedAdCode')
  );
}

function buildSessionSignature(session: MeetWeSession): string {
  return JSON.stringify(
    session.participants.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      addressText: p.addressText,
      transport: p.transport,
      selectedCoordinate: p.selectedCoordinate ?? null,
      selectedCityCode: p.selectedCityCode ?? null,
      selectedAdCode: p.selectedAdCode ?? null,
    }))
  );
}

export function MeetWeProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MeetWeSession>(() => createInitialSession());
  const [lastResult, setLastResult] = useState<MeetWeComputationResult | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [planOwnerSignature, setPlanOwnerSignature] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);
  /** 本地会话是否已从 AsyncStorage 恢复完成（避免“先保存默认值覆盖历史数据”） */
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const loaded = await loadLastSession();
      const loadedPlans = await loadPlanItems();
      if (!alive) return;
      if (loaded) {
        setSession(loaded);
      }
      setPlanItems(loadedPlans);
      setPlanOwnerSignature(loadedPlans[0]?.sessionSignature ?? null);
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // 会话每次变化自动落盘（MVP：简单可靠；后续可做防抖/脏检查）
    saveLastSession(session).catch(() => {});
  }, [session, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const currentSignature = buildSessionSignature(session);
    if (planOwnerSignature && planOwnerSignature !== currentSignature) {
      setPlanItems([]);
      setPlanOwnerSignature(null);
      savePlanItems([]).catch(() => {});
    }
  }, [session, hydrated, planOwnerSignature]);

  useEffect(() => {
    if (!hydrated) return;
    savePlanItems(planItems).catch(() => {});
  }, [planItems, hydrated]);

  const activePlanItems = useMemo(() => {
    const currentSignature = buildSessionSignature(session);
    return planItems.filter((item) => item.sessionSignature === currentSignature);
  }, [planItems, session]);

  const updateParticipant = useCallback((id: string, patch: Partial<Participant>) => {
    const shouldClearPlans = patchChangesParticipantMeaningfully(patch);
    if (shouldClearPlans) {
      setPlanItems([]);
    }
    setSession((prev) => ({
      ...prev,
      participants: prev.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const addParticipant = useCallback(() => {
    setPlanItems([]);
    setSession((prev) => {
      if (prev.participants.length >= MAX_PARTICIPANTS) return prev;
      const nextIndex = prev.participants.length + 1;
      return { ...prev, participants: [...prev.participants, createNewParticipant(nextIndex)] };
    });
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setPlanItems([]);
    setSession((prev) => {
      if (prev.participants.length <= MIN_PARTICIPANTS) return prev;
      return { ...prev, participants: prev.participants.filter((p) => p.id !== id) };
    });
  }, []);

  const setEventType = useCallback((eventType: EventType) => {
    setSession((prev) => ({ ...prev, eventType }));
  }, []);

  const addPlanItem = useCallback(
    (recommendation: Recommendation) => {
      if (!lastResult) return;

      const participantLabels = session.participants.map((p) => p.displayName?.trim() || '未命名');
      const participantCoords = lastResult.participantCoords.map((x) => x.coordinate);
      const participantTransports = session.participants.map((p) => p.transport);

      setPlanItems((prev) => {
        // 同一地点重复加入时，保留最新一条并移动到最前，避免列表重复膨胀
        const deduped = prev.filter((x) => x.recommendation.place.id !== recommendation.place.id);
        const sessionSignature = buildSessionSignature(session);
        setPlanOwnerSignature(sessionSignature);
        const next: PlanItem = {
          id: `plan_${recommendation.place.id}_${Date.now()}`,
          addedAt: Date.now(),
          sessionSignature,
          recommendation,
          participantLabels,
          participantCoords,
          participantTransports,
        };
        return [next, ...deduped];
      });
    },
    [lastResult, session.participants]
  );

  const removePlanItem = useCallback((placeId: string) => {
    setPlanItems((prev) => {
      const next = prev.filter((x) => x.recommendation.place.id !== placeId);
      if (next.length === 0) {
        setPlanOwnerSignature(null);
      }
      return next;
    });
  }, []);

  const computeRecommendations = useCallback(
    async (overrideSession?: MeetWeSession, options?: ComputeRecommendationOptions) => {
      const targetSession = overrideSession ?? session;
      setIsComputing(true);
      setComputeError(null);
      try {
        const result = await computeMeetWeRecommendations(targetSession, options);
        setLastResult(result);
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setComputeError(msg);
        throw e;
      } finally {
        setIsComputing(false);
      }
    },
    [session]
  );

  const value = useMemo(
    () => ({
      session,
      setSession,
      updateParticipant,
      addParticipant,
      removeParticipant,
      setEventType,
      lastResult,
      setLastResult,
      planItems: activePlanItems,
      addPlanItem,
      removePlanItem,
      isComputing,
      computeError,
      computeRecommendations,
    }),
    [
      session,
      updateParticipant,
      addParticipant,
      removeParticipant,
      setEventType,
      lastResult,
      activePlanItems,
      addPlanItem,
      removePlanItem,
      isComputing,
      computeError,
      computeRecommendations,
    ]
  );

  return <MeetWeContext.Provider value={value}>{children}</MeetWeContext.Provider>;
}

export function useMeetWe(): MeetWeContextValue {
  const ctx = useContext(MeetWeContext);
  if (!ctx) {
    throw new Error('useMeetWe 必须在 MeetWeProvider 内使用');
  }
  return ctx;
}

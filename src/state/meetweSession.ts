import type { MeetWeSession, Participant } from '../types';

/**
 * MeetWe 会话默认值与简单工厂方法
 *
 * 说明：
 * - MVP 先给 2 个参与者，符合“2~6 人”的下限
 * - 参与者 id 在会话生命周期内必须稳定（列表渲染 key、确定性算法种子）
 */

export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 6;

export function createNewParticipant(labelIndex: number): Participant {
  return {
    // 用时间戳 + 随机串生成唯一 id：避免同一毫秒重复的概率极低
    id: `p_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
    displayName: `参与者${labelIndex}`,
    addressText: '',
    transport: 'car',
  };
}

/** 创建初始会话：2 人 + 默认约会类型 */
export function createInitialSession(): MeetWeSession {
  return {
    eventType: 'food',
    participants: [createNewParticipant(1), createNewParticipant(2)],
  };
}

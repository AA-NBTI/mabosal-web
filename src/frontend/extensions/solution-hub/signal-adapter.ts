import type { MabosalSessionState } from '../../../modules/phase13/phase13-types.js';
import type { SignalLevel, SignalTag } from './types.js';

/**
 * 신호 어댑터: 마보살 엔진 결과(MaSignalSet)를 읽기 전용으로 참조해 신호 태그로 번역한다.
 * 엔진 계산 로직은 일절 건드리지 않는다.
 */

const STATE_LEVEL: Record<string, number> = {
  DORMANT: 0,
  TRIGGERED: 1,
  ACTIVE: 2,
  DOMINANT: 3,
  OVERBURDENED: 3,
};

const AXIS_RANK: Record<string, number> = {
  LOW: 0,
  MODERATE: 1,
  HIGH: 2,
  VERY_HIGH: 3,
};

type Axis = 'pressure' | 'opportunity' | 'volatility' | 'intensity' | 'mitigation';

interface TagRule {
  tag: string;
  maIds: string[];
  axis: Axis;
}

const RULES: TagRule[] = [
  // 재정/경제 버티컬
  { tag: 'money.loss', maIds: ['ma_wealth', 'ma_asset', 'ma_business'], axis: 'pressure' },
  { tag: 'money.gain', maIds: ['ma_wealth', 'ma_asset', 'ma_business'], axis: 'opportunity' },
  
  // 커리어/이직/성장 버티컬
  { tag: 'career.change', maIds: ['ma_career', 'ma_movement'], axis: 'volatility' },
  { tag: 'career.transition', maIds: ['ma_career', 'ma_movement', 'ma_business'], axis: 'pressure' },
  { tag: 'career.promotion', maIds: ['ma_career', 'ma_social'], axis: 'opportunity' },

  // 부동산/주거 버티컬
  { tag: 'home.move', maIds: ['ma_home', 'ma_movement'], axis: 'volatility' },
  { tag: 'home.asset', maIds: ['ma_home', 'ma_asset', 'ma_document'], axis: 'pressure' },
  { tag: 'home.contract', maIds: ['ma_home', 'ma_document'], axis: 'opportunity' },

  // 정서/멘탈케어 버티컬
  { tag: 'mind.stress', maIds: ['ma_social', 'ma_gossip', 'ma_family', 'ma_romance'], axis: 'pressure' },
  
  // 법률/분쟁 버티컬 (스위치만 관리)
  { tag: 'legal.dispute', maIds: ['ma_legal', 'ma_document'], axis: 'pressure' },
];

export function extractSignalTags(session: MabosalSessionState | null | undefined): SignalTag[] {
  const signals = session?.signalSet?.signals;
  if (!signals) return [];

  const result: SignalTag[] = [];

  for (const rule of RULES) {
    let best = 0;
    let bestName = '';

    for (const maId of rule.maIds) {
      const entity = signals[maId];
      if (!entity || !entity.activation?.isActivated) continue;

      const base = STATE_LEVEL[entity.activation.state] ?? 0;
      const axisRank = AXIS_RANK[entity.qualitativeAxis?.[rule.axis] as string] ?? 0;
      // 상태와 강도 축 중 유의미한 수치 반영 (최소 1)
      const level = Math.max(base > 0 ? 1 : 0, Math.min(base, axisRank || base));

      if (level > best) {
        best = level;
        bestName = entity.koreanName || maId;
      }
    }

    if (best > 0) {
      result.push({ tag: rule.tag, level: Math.min(3, best) as SignalLevel, sourceName: bestName });
    }
  }

  return result;
}

/**
 * [fortune-adapter] 세션(MabosalSessionState) → 일일 지수 엔진(DailyFortuneEngine) 입력 변환 계약
 *
 * 배경: 세션은 { fact, signalSet } 을 만들지만, 지수 엔진은
 *   signal.axis5_baseline / signal.wealth / signal.output / relationship.summary / day_master_strength.yongshin
 * 을 읽는다. 이 모듈이 두 형식을 잇는 유일한 변환 지점이며, 계약은 tests/ 에서 검증한다.
 *
 * 순수 함수만 포함한다 (저장소·DOM 비의존).
 */
import type { DailyFortuneInput } from '../../../modules/daily-fortune/daily-fortune-engine.js';

type Element5 = '목' | '화' | '토' | '금' | '수';

const LEVEL: Record<string, number> = { LOW: 25, MODERATE: 50, HIGH: 72, VERY_HIGH: 90 };
const STATE: Record<string, number> = { DORMANT: 30, TRIGGERED: 55, ACTIVE: 70, DOMINANT: 85, OVERBURDENED: 60 };

/** 오행 상생(내가 낳는 오행) */
const GENERATES: Record<Element5, Element5> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
/** 나를 낳는 오행(인성) */
const GENERATED_BY: Record<Element5, Element5> = { 목: '수', 화: '목', 토: '화', 금: '토', 수: '금' };
/** 오행 상극(내가 극하는 오행) */
const CONTROLS: Record<Element5, Element5> = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' };

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const level = (v?: string) => LEVEL[v || ''] ?? 50;
const stateScore = (v?: string) => STATE[v || ''] ?? 50;

export interface SessionLike {
  fact?: any;
  signalSet?: { signals?: Record<string, any> };
}

/** 신강/신약 분류와 일간 오행으로 용신·희신 도출 (엔진 기본값 '화/토' 고정 문제 해소) */
export function deriveYongshin(classification: string | undefined, dayElement: string | undefined): { yongshin: Element5; heeshin: Element5 } {
  const el = (['목', '화', '토', '금', '수'].includes(dayElement || '') ? dayElement : '토') as Element5;
  const cls = classification || '';
  if (cls.includes('신약')) {
    // 일간이 약함 → 인성(나를 생함)이 용신, 비겁(같은 오행)이 희신
    return { yongshin: GENERATED_BY[el], heeshin: el };
  }
  if (cls.includes('신강')) {
    // 일간이 강함 → 식상(내가 생함)으로 설기, 재성(내가 극함)이 희신
    return { yongshin: GENERATES[el], heeshin: CONTROLS[el] };
  }
  // 중화: 식상으로 유통, 인성이 희신
  return { yongshin: GENERATES[el], heeshin: GENERATED_BY[el] };
}

function blend(sig: any): number {
  if (!sig) return 50;
  return Math.round(stateScore(sig.activation?.state) * 0.5 + level(sig.qualitativeAxis?.intensity) * 0.5);
}

function avg(nums: number[], fallback = 50): number {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : fallback;
}

export interface FortuneAdapterResult {
  input: DailyFortuneInput;
  yongshin: Element5;
  heeshin: Element5;
}

/**
 * 세션 → DailyFortuneInput. 세션이 없거나 fact가 없으면 null (→ 엔진이 기본 천기 산출).
 */
export function toDailyFortuneInput(
  session: SessionLike | null | undefined,
  extras: { userName?: string; gender?: 'male' | 'female'; targetDate?: Date } = {}
): FortuneAdapterResult | null {
  const fact = session?.fact;
  if (!fact || !fact.four_pillars) return null;

  const signals = session?.signalSet?.signals || {};
  const strength = fact.day_master_strength || {};
  const { yongshin, heeshin } = deriveYongshin(strength.classification, fact.day_element);

  // 1) 5대 축 기준선: 비활성(DORMANT)이 아닌 마(Ma)들의 기회/완충/압박 평균
  const live = Object.values(signals).filter((s: any) => s?.activation?.state && s.activation.state !== 'DORMANT');
  const axis5_baseline = {
    opportunity: avg(live.map((s: any) => level(s.qualitativeAxis?.opportunity))),
    mitigation: avg(live.map((s: any) => level(s.qualitativeAxis?.mitigation))),
    pressure: avg(live.map((s: any) => level(s.qualitativeAxis?.pressure))),
  };

  // 2) 재성/식상/비겁 신호 대용: 재물마·사업마·인마(비겁 분산 위험)
  const wealthSig = signals['ma_wealth'];
  const businessSig = signals['ma_business'] || signals['ma_career'];
  const socialSig = signals['ma_social'];
  const wealth = {
    structureScore: blend(wealthSig),
    sikSangProduceJae: blend(businessSig),
    biGeopDispersion: avg([level(wealthSig?.qualitativeAxis?.pressure), level(socialSig?.qualitativeAxis?.volatility)]),
    dayMasterCapacity: clamp(Math.round(30 + (Number(strength.totalStrengthScore) || 50) * 0.7)),
  };

  // 3) 추진력: 직장마·사업마·이동마의 활성도
  const output = {
    executionDrive: avg([signals['ma_career'], signals['ma_business'], signals['ma_movement']].filter(Boolean).map(blend)),
  };

  // 4) 관계: 충·형·해 개수로 마찰 점수 산정 (엔진은 summary.total_clash_score 사용)
  const clashes = (fact.branch_clashes || []).length;
  const punish = (fact.branch_punishments || []).length;
  const minor = (fact.minor_relations || []).length;
  const relationship = { summary: { total_clash_score: clamp(clashes * 12 + punish * 8 + minor * 3, 0, 80) } };

  const sajuCore = {
    ...fact,
    day_master_strength: { ...strength, yongshin, heeshin },
  };

  return {
    yongshin,
    heeshin,
    input: {
      sajuCore: sajuCore as any,
      signal: { axis5_baseline, wealth, output } as any,
      relationship: relationship as any,
      userName: extras.userName,
      gender: extras.gender,
      targetDate: extras.targetDate,
    },
  };
}

/** 대시보드 렌더러(renderCheonmyeongwonDailyDashboard) 옵션으로 변환 */
export function toDashboardOptions(
  session: SessionLike | null | undefined,
  extras: { userName?: string; gender?: 'male' | 'female' } = {}
): { sajuCore?: any; signal?: any; relationship?: any; yongshin?: string; gender?: 'male' | 'female'; userName?: string } {
  const r = toDailyFortuneInput(session, extras);
  if (!r) return { userName: extras.userName, gender: extras.gender };
  return {
    sajuCore: r.input.sajuCore,
    signal: r.input.signal,
    relationship: r.input.relationship,
    yongshin: r.yongshin,
    gender: extras.gender,
    userName: extras.userName,
  };
}

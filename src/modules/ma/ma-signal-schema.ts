/**
 * 21개 Ma 공통 Signal 스키마 및 레지스트리 (Phase 5)
 * 
 * 원칙:
 * 1. 21개 마(StandardMaId 20개 + 확장 슬롯)에 대한 표준 메타데이터와 공통 신호 스키마를 정의합니다.
 * 2. 5대 질적 축(Qualitative5Axis: intensity, pressure, opportunity, volatility, mitigation)을 보존합니다.
 * 3. Activation 상태(ActivationEvaluation)와 Rule Certainty를 체계적으로 관리합니다.
 * 4. 건강마, 사고마, 재판마 등 민감 주제에 대한 안전 가이드라인(safetyGuideline)을 내장합니다.
 */

import { TenGod, TimeDependencyInfo } from '../../core/types.js';
import {
  ActivationState,
  MaActivationEvaluation,
  MaCategory,
  MaSignalEntity,
  Qualitative5Axis,
  QualitativeLevel,
  RuleCertainty,
  StandardMaId,
} from './ma-types.js';

export interface MaDefinition {
  moduleId: StandardMaId;
  koreanName: string;
  category: MaCategory;
  order: number;
  coreTenGods: TenGod[];
  defaultCertainty: RuleCertainty;
  safetyCaution?: 'HEALTH_EQUILIBRIUM' | 'ACCIDENT_TENSION' | 'LEGAL_DISPUTE';
}

/**
 * 20대 표준 Ma + 확장 슬롯(21번) 정의 레지스트리
 */
export const STANDARD_MA_DEFINITIONS: Record<StandardMaId, MaDefinition> = {
  ma_wealth: {
    moduleId: 'ma_wealth',
    koreanName: '재물마',
    category: 'CORE',
    order: 1,
    coreTenGods: ['정재', '편재'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_business: {
    moduleId: 'ma_business',
    koreanName: '사업마',
    category: 'CORE',
    order: 2,
    coreTenGods: ['편재', '식신', '상관'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_career: {
    moduleId: 'ma_career',
    koreanName: '직장마',
    category: 'CORE',
    order: 3,
    coreTenGods: ['정관', '정인'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_asset: {
    moduleId: 'ma_asset',
    koreanName: '자산마',
    category: 'CORE',
    order: 4,
    coreTenGods: ['정재', '정인', '편인'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_social: {
    moduleId: 'ma_social',
    koreanName: '인마',
    category: 'CORE',
    order: 5,
    coreTenGods: ['비견', '겁재'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_romance: {
    moduleId: 'ma_romance',
    koreanName: '연애마',
    category: 'CORE',
    order: 6,
    coreTenGods: ['식신', '상관', '편재', '편관'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_marriage: {
    moduleId: 'ma_marriage',
    koreanName: '결혼마',
    category: 'CORE',
    order: 7,
    coreTenGods: ['정재', '정관'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_family: {
    moduleId: 'ma_family',
    koreanName: '가족마',
    category: 'DERIVED',
    order: 8,
    coreTenGods: ['정인', '비견'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_children: {
    moduleId: 'ma_children',
    koreanName: '자녀마',
    category: 'DERIVED',
    order: 9,
    coreTenGods: ['식신', '상관', '관성' as any], // 남녀 배우자 모델을 통해 팩트 주입
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_parents: {
    moduleId: 'ma_parents',
    koreanName: '부모마',
    category: 'DERIVED',
    order: 10,
    coreTenGods: ['정인', '편인', '편재'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_health: {
    moduleId: 'ma_health',
    koreanName: '건강마',
    category: 'CORE',
    order: 11,
    coreTenGods: ['비견', '식신'],
    defaultCertainty: 'PHASE5_CONFIRMED',
    safetyCaution: 'HEALTH_EQUILIBRIUM',
  },
  ma_accident: {
    moduleId: 'ma_accident',
    koreanName: '사고마',
    category: 'DERIVED',
    order: 12,
    coreTenGods: ['편관', '상관'],
    defaultCertainty: 'PHASE5_CONFIRMED',
    safetyCaution: 'ACCIDENT_TENSION',
  },
  ma_gossip: {
    moduleId: 'ma_gossip',
    koreanName: '구설마',
    category: 'DERIVED',
    order: 13,
    coreTenGods: ['상관', '겁재'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_document: {
    moduleId: 'ma_document',
    koreanName: '문서마',
    category: 'CORE',
    order: 14,
    coreTenGods: ['정인', '편인'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_legal: {
    moduleId: 'ma_legal',
    koreanName: '재판마',
    category: 'DERIVED',
    order: 15,
    coreTenGods: ['편관', '상관'],
    defaultCertainty: 'PHASE5_CONFIRMED',
    safetyCaution: 'LEGAL_DISPUTE',
  },
  ma_movement: {
    moduleId: 'ma_movement',
    koreanName: '이동마',
    category: 'DERIVED',
    order: 16,
    coreTenGods: ['편재', '식신'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_exam: {
    moduleId: 'ma_exam',
    koreanName: '시험마',
    category: 'DERIVED',
    order: 17,
    coreTenGods: ['정인', '정관'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_fame: {
    moduleId: 'ma_fame',
    koreanName: '명예마',
    category: 'CORE',
    order: 18,
    coreTenGods: ['정관', '편관'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_noble: {
    moduleId: 'ma_noble',
    koreanName: '귀인마',
    category: 'OPTIONAL',
    order: 19,
    coreTenGods: ['정인', '정관'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
  ma_home: {
    moduleId: 'ma_home',
    koreanName: '집마',
    category: 'DERIVED',
    order: 20,
    coreTenGods: ['정인', '정재'],
    defaultCertainty: 'PHASE5_CONFIRMED',
  },
};

/**
 * 기본 5대 질적 축 생성 팩토리 (초기값: 모두 LOW)
 */
export function createDefaultQualitative5Axis(override?: Partial<Qualitative5Axis>): Qualitative5Axis {
  return {
    intensity: 'LOW',
    pressure: 'LOW',
    opportunity: 'LOW',
    volatility: 'LOW',
    mitigation: 'LOW',
    ...override,
  };
}

/**
 * 기본 MaActivationEvaluation 생성 팩토리 (초기값: DORMANT)
 */
export function createDefaultActivationEvaluation(override?: Partial<MaActivationEvaluation>): MaActivationEvaluation {
  return {
    state: 'DORMANT',
    isActivated: false,
    primaryCauses: [],
    inhibitingFactors: [],
    mitigatingFactors: [],
    certainty: 'PHASE5_CONFIRMED',
    ...override,
  };
}

/**
 * MaSignalEntity 생성 팩토리
 */
export function createMaSignalEntity(params: {
  moduleId: StandardMaId | string;
  activation: MaActivationEvaluation;
  qualitativeAxis: Qualitative5Axis;
  referencedFacts?: {
    tenGods: TenGod[];
    pillarsInvolved: ('year' | 'month' | 'day' | 'hour')[];
    relationshipsUsed: string[];
  };
  timeDependency?: TimeDependencyInfo;
  customMetadata?: {
    koreanName: string;
    category: MaCategory;
    order: number;
  };
}): MaSignalEntity {
  const def = STANDARD_MA_DEFINITIONS[params.moduleId as StandardMaId];

  const koreanName = params.customMetadata?.koreanName ?? def?.koreanName ?? params.moduleId;
  const category = params.customMetadata?.category ?? def?.category ?? 'OPTIONAL';
  const order = params.customMetadata?.order ?? def?.order ?? 21;

  let safetyGuideline: MaSignalEntity['safetyGuideline'];
  if (def?.safetyCaution) {
    safetyGuideline = {
      isRestrictedTopic: true,
      cautionType: def.safetyCaution,
      contextNote: '의학적/법적 직접 단정 금지 원칙 준수',
    };
  }

  return {
    moduleId: params.moduleId,
    koreanName,
    category,
    order,
    activation: params.activation,
    qualitativeAxis: params.qualitativeAxis,
    referencedFacts: params.referencedFacts ?? {
      tenGods: def ? [...def.coreTenGods] : [],
      pillarsInvolved: ['year', 'month', 'day'],
      relationshipsUsed: [],
    },
    safetyGuideline,
    timeDependency: params.timeDependency ?? {
      requires_hour: false,
      time_dependency: 20,
      is_missing_hour: false,
      notes: '기본 신호 시간 의존도',
    },
  };
}

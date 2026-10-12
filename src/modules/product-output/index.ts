/**
 * src/modules/product-output/index.ts
 *
 * Phase 83: 4단계 상품 출력 구조 (Product Output Layer) 메인 엔트리
 *
 * 파이프라인:
 *   CommonCaseInput
 *         ↓
 *   buildCommonResult() [19개 모듈 1회 실행 + 통합/사건/시간축/처방 공통 보존]
 *         ↓
 *   generateProductOutputs()
 *   ├── FreeOutput (8개 섹션)
 *   ├── PaidOutput (11개 섹션)
 *   ├── ConflictMalSalOutput (9개 섹션)
 *   └── PremiumOutput (24개 섹션)
 */

import { buildCommonResult } from './common-result-builder.js';
import { buildFreeSections } from './outputs/free-output.js';
import { buildPaidSections } from './outputs/paid-output.js';
import { buildConflictMalSalSections } from './outputs/conflict-malsal-output.js';
import { buildPremiumSections } from './outputs/premium-output.js';
import type {
  CommonCaseInput,
  CommonResultData,
  OutputEvidence,
  JudgmentType,
  OutputSection,
  ProductOutput,
  ProductOutputSet,
  ProductTier,
} from './types.js';

export * from './types.js';
export * from './blocks.js';
export { buildCommonResult, ALL_19_MODULES } from './common-result-builder.js';
export { buildResultScore } from './result-score-builder.js';
export { buildFreeSections } from './outputs/free-output.js';
export { buildPaidSections } from './outputs/paid-output.js';
export { buildConflictMalSalSections } from './outputs/conflict-malsal-output.js';
export { buildPremiumSections } from './outputs/premium-output.js';

function computeMeta(sections: OutputSection[]) {
  let full = 0;
  let partial = 0;
  let empty = 0;
  const missingBlocks: string[] = [];
  const evidences: OutputEvidence[] = [];
  const byType: Record<JudgmentType, number> = {
    fact: 0,
    interpretation: 0,
    event: 0,
    time: 0,
    malsal: 0,
    prescription: 0,
    decision: 0,
  };
  const byConfidence: Record<'high' | 'medium' | 'low', number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const s of sections) {
    if (s.coverage === 'FULL') full++;
    else if (s.coverage === 'PARTIAL') partial++;
    else empty++;

    for (const b of s.blocks) {
      if (b.missing) {
        missingBlocks.push(`${s.title} > ${b.label || b.type}`);
      }
      if (b.evidence) {
        evidences.push(b.evidence);
        byType[b.evidence.judgmentType] = (byType[b.evidence.judgmentType] || 0) + 1;
        byConfidence[b.evidence.confidence] = (byConfidence[b.evidence.confidence] || 0) + 1;
      }
    }
  }

  const supported = evidences.filter((e) => e.supported).length;

  return {
    sectionCount: sections.length,
    coverage: { full, partial, empty },
    missingBlocks,
    evidenceSummary: {
      total: evidences.length,
      supported,
      byType,
      byConfidence,
    },
    evidences,
  };
}

export function buildProductOutput(
  tier: ProductTier,
  common: CommonResultData
): ProductOutput {
  switch (tier) {
    case 'FREE': {
      const sections = buildFreeSections(common);
      return {
        tier: 'FREE',
        tierLabel: '무료 진단',
        tagline: '사주의 핵심 발견과 흐름 한눈에 보기',
        sections,
        meta: computeMeta(sections),
      };
    }
    case 'PAID': {
      const sections = buildPaidSections(common);
      return {
        tier: 'PAID',
        tierLabel: '유료 정밀 분석',
        tagline: '원국 구조와 현실 영역별 상세 해석 및 행동 처방',
        sections,
        meta: computeMeta(sections),
      };
    }
    case 'CONFLICT_MALSAL': {
      const sections = buildConflictMalSalSections(common);
      return {
        tier: 'CONFLICT_MALSAL',
        tierLabel: '상충·마살 특화 분석',
        tagline: '관계 충돌, 마살, 3개년 시간축의 집중 분석과 시기별 대응',
        sections,
        meta: computeMeta(sections),
      };
    }
    case 'PREMIUM': {
      const sections = buildPremiumSections(common);
      return {
        tier: 'PREMIUM',
        tierLabel: '프리미엄 통합 의사결정',
        tagline: '전체 명리 분석과 사건 진단, 선택지 비교 및 4주 실행 로드맵',
        sections,
        meta: computeMeta(sections),
      };
    }
  }
}

/**
 * 하나의 CASE 입력에 대해 4단계 상품 전체 출력을 생성한다.
 */
export function generateAllProductOutputs(input: CommonCaseInput): ProductOutputSet {
  const common = buildCommonResult(input);
  return {
    common,
    free: buildProductOutput('FREE', common),
    paid: buildProductOutput('PAID', common),
    conflictMalSal: buildProductOutput('CONFLICT_MALSAL', common),
    premium: buildProductOutput('PREMIUM', common),
  };
}

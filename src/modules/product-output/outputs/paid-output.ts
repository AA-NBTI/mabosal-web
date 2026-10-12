/**
 * src/modules/product-output/outputs/paid-output.ts
 *
 * Phase 83 — 상품 2: 유료 (전체 구조 + 상세 해석)
 *
 * 무료를 길게 만든 것이 아니라, 원국 구조 → 영역별 해석 → 현재 문제 → 시간축 → 진단 사슬 → 처방 순으로 구성한다.
 */

import { section } from '../blocks.js';
import type { CommonResultData, OutputSection } from '../types.js';
import {
  behaviorBlocks,
  currentIssueBlocks,
  daewunBlocks,
  daewunLuckActivation,
  diagnosisChainBlocks,
  geokgukBlocks,
  ohaengBlocks,
  primaryDomainEvidenceBlocks,
  scoreBlocks,
  sipsinBlocks,
  strengthBlocks,
  topicBlocks,
  yearBlocks,
  yongsinBlocks,
} from '../section-parts.js';
import { relationFactsBlock } from '../section-parts.js';

/** 유료 섹션 제목 (무료의 "더 깊은 분석 안내"에서도 참조) */
export const PAID_SECTION_TITLES = [
  '나의 핵심 구조',
  '직업',
  '재물',
  '연애·관계',
  '가족·생활',
  '현재 가장 중요한 문제',
  '현재 대운',
  '세운',
  '핵심 진단',
  '기본 점수 상세',
  '행동 처방',
];

export function buildPaidSections(cr: CommonResultData): OutputSection[] {
  const t = PAID_SECTION_TITLES;
  const [flow0, flow1] = cr.yearFlows;

  return [
    section('paid.coreStructure', 1, t[0], [
      ...ohaengBlocks(cr).slice(0, 2),
      ...sipsinBlocks(cr).filter((b) => b.label !== '십신 세부 개수'),
      ...geokgukBlocks(cr),
      ...strengthBlocks(cr),
      ...yongsinBlocks(cr).slice(0, 2),
    ]),
    section('paid.career', 2, t[1], [
      ...topicBlocks(cr, 'JOB'),
      ...primaryDomainEvidenceBlocks(cr, 'JOB'),
    ]),
    section('paid.money', 3, t[2], [
      ...topicBlocks(cr, 'MONEY'),
      ...primaryDomainEvidenceBlocks(cr, 'MONEY'),
    ]),
    section('paid.relationship', 4, t[3], [
      ...topicBlocks(cr, 'LOVE'),
      ...topicBlocks(cr, 'RELATIONSHIP'),
      relationFactsBlock(cr),
    ]),
    section('paid.family', 5, t[4], [
      ...topicBlocks(cr, 'MARRIAGE'),
    ]),
    section('paid.currentIssue', 6, t[5], currentIssueBlocks(cr)),
    section('paid.daewun', 7, t[6], [...daewunBlocks(cr), daewunLuckActivation(cr)]),
    section('paid.seun', 8, t[7], [...yearBlocks(flow0, '올해'), ...yearBlocks(flow1, '내년')]),
    section('paid.diagnosis', 9, t[8], diagnosisChainBlocks(cr)),
    section('paid.scores', 10, t[9], scoreBlocks(cr, 'detail')),
    section('paid.actions', 11, t[10], behaviorBlocks(cr).slice(0, 3)),
  ];
}

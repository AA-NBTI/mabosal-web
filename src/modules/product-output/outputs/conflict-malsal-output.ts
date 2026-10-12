/**
 * src/modules/product-output/outputs/conflict-malsal-output.ts
 *
 * Phase 83 — 상품 3: 상충·마살 추가 (관계·마살·시간축 집중 분석)
 *
 * 일반 사주풀이를 반복하지 않고,
 * 관계 + 상충·합·형·파·해 + 마·살 + 시간축을 집중 분석한다.
 */

import { section, textBlock } from '../blocks.js';
import type { CommonResultData, OutputSection } from '../types.js';
import {
  behaviorBlocks,
  daewunBlocks,
  daewunLuckActivation,
  magaBlocks,
  monthlyTable,
  pressureMonthsBlock,
  relationAvailabilityNote,
  relationLinkNote,
  relationTable,
  sinsalBlocks,
  yearBlocks,
} from '../section-parts.js';

export const CONFLICT_MALSAL_SECTION_TITLES = [
  '현재 고민과 직접 연결되는 관계',
  '마·살',
  '현재 대운과 관계 변화',
  '2026 흐름',
  '2027 흐름',
  '2028 흐름',
  '핵심 위험/주의 구간',
  '상충·마살 종합 판단',
  '대응 처방',
];

export function buildConflictMalSalSections(cr: CommonResultData): OutputSection[] {
  const t = CONFLICT_MALSAL_SECTION_TITLES;
  const [flow0, flow1, flow2] = cr.yearFlows;

  const y1Title = flow0 ? `${flow0.year} 흐름` : t[3];
  const y2Title = flow1 ? `${flow1.year} 흐름` : t[4];
  const y3Title = flow2 ? `${flow2.year} 흐름` : t[5];

  return [
    // ① 현재 고민과 직접 연결되는 관계
    section('cms.relations', 1, t[0], [
      relationTable(cr, true),
      relationLinkNote(cr),
    ]),

    // ② 마·살
    section('cms.malsal', 2, t[1], [
      ...magaBlocks(cr),
      ...sinsalBlocks(cr),
    ]),

    // ③ 현재 대운과 관계 변화
    section('cms.daewunChange', 3, t[2], [
      ...daewunBlocks(cr),
      daewunLuckActivation(cr),
    ]),

    // ④ 2026 흐름 (flow0)
    section('cms.year1', 4, y1Title, [
      ...yearBlocks(flow0, y1Title),
      monthlyTable(flow0, true),
      relationAvailabilityNote(flow0),
    ]),

    // ⑤ 2027 흐름 (flow1)
    section('cms.year2', 5, y2Title, [
      ...yearBlocks(flow1, y2Title),
      monthlyTable(flow1, true),
      relationAvailabilityNote(flow1),
    ]),

    // ⑥ 2028 흐름 (flow2)
    section('cms.year3', 6, y3Title, [
      ...yearBlocks(flow2, y3Title),
      monthlyTable(flow2, true),
      relationAvailabilityNote(flow2),
    ]),

    // ⑦ 핵심 위험/주의 구간
    section('cms.riskPeriods', 7, t[6], [
      pressureMonthsBlock(flow0),
      pressureMonthsBlock(flow1),
      textBlock(
        '위험 구간 종합 분석',
        cr.evidence?.eventPattern || cr.event?.riskLevel || cr.event?.intensityScore ? `구조적 압박 수준: ${cr.event?.intensityScore ?? '보통'} / 양상: ${cr.evidence?.eventPattern || '특이 양상 없음'}` : '',
        'evidence.eventPattern'
      ),
    ]),

    // ⑧ 상충·마살 종합 판단
    section('cms.synthesis', 8, t[7], [
      textBlock(
        '상충·마살 종합 판단',
        cr.integrated?.chainAnalysis?.eventMechanism || cr.event?.primaryDiagnosis,
        'integrated.chainAnalysis.eventMechanism'
      ),
      textBlock(
        '현실 영향 분석',
        cr.event?.practicalExplanation,
        'event.practicalExplanation'
      ),
    ]),

    // ⑨ 대응 처방
    section('cms.actions', 9, t[8], [
      ...behaviorBlocks(cr),
    ]),
  ];
}

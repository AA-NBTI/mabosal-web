/**
 * src/modules/product-output/outputs/free-output.ts
 *
 * Phase 83 — 상품 1: 무료 (핵심 발견)
 */

import { cx, factsBlock, listBlock, missingBlock, section, textBlock } from '../blocks.js';
import type { CommonResultData, OutputBlock, OutputSection } from '../types.js';
import {
  birthFacts,
  currentTimeAxisBlocks,
  dayMasterFacts,
  ohaengBlocks,
  pillarsTable,
  question,
  scoreBlocks,
  strengthBlocks,
  trouble,
} from '../section-parts.js';
import { domainKo } from '../blocks.js';
import { PAID_SECTION_TITLES } from './paid-output.js';

function firstN(items: string[], n: number): string[] {
  return items.filter(Boolean).slice(0, n);
}

function joinArr(a: unknown): string {
  return Array.isArray(a) ? a.map(cx).filter(Boolean).join(', ') : '';
}

/** 강점 후보: 엔진이 제공한 길한 요소만 사용 (최대 3개) */
function strengthItems(cr: CommonResultData): string[] {
  const ev = cr.evidence;
  const sin = cr.modules['SINSAL'];
  const rel = cr.modules['RELATION'];
  const eok = cr.modules['EOKBU'];
  const cand: string[] = [];

  const buffering = (ev?.conflictingOrBufferingSignals || []).map(cx).filter(Boolean);
  if (buffering[0]) cand.push(`완충 요소: ${buffering[0]}`);
  const aus = joinArr(sin?.auspicious);
  if (aus) cand.push(`길한 작용: ${aus}`);
  const harm = joinArr([...(rel?.sixHarmonies || []), ...(rel?.samhaps || []), ...(rel?.banhaps || []), ...(rel?.banghaps || [])]);
  if (harm) cand.push(`원국의 조화: ${harm}`);
  if (eok?.yongsin) cand.push(`균형을 돕는 기운: ${cx(eok.yongsin)}`);
  return firstN(cand, 3);
}

/** 주의 후보: 엔진이 제공한 취약 요소만 사용 (최대 3개) */
function cautionItems(cr: CommonResultData): string[] {
  const sin = cr.modules['SINSAL'];
  const rel = cr.modules['RELATION'];
  const core = cr.modules['CORE_ORIGINAL'];
  const ten = cr.modules['TEN_GODS'];
  const cand: string[] = [];

  const dom = domainKo(cr.classification?.primaryDomain);
  if (dom) cand.push(`지금 부딪히는 현실 영역: ${dom}`);
  const ch = joinArr(sin?.challenging);
  if (ch) cand.push(`주의가 필요한 작용: ${ch}`);
  const lack = joinArr(core?.ohaeng?.lacking);
  if (lack) cand.push(`부족한 오행: ${lack}`);
  const conflicts = joinArr([...(rel?.clashes || []), ...(rel?.punishments || []), ...(rel?.destructions || []), ...(rel?.harms || [])]);
  if (conflicts) cand.push(`원국의 충돌 관계: ${conflicts}`);
  const lackGroups = joinArr(ten?.lackingGroups);
  if (lackGroups) cand.push(`부족한 십신 그룹: ${lackGroups}`);
  return firstN(cand, 3);
}

function currentFlowBlocks(cr: CommonResultData): OutputBlock[] {
  const d = cr.modules['DAEWUN']?.currentDaewoon;
  const y = cr.yearFlows.find((f) => f.isCurrentYear) || cr.yearFlows[0];
  return [
    factsBlock(
      '지금의 큰 흐름',
      [
        { label: '현재 대운', value: d ? `${d.ganji} (${d.startAge}~${d.endAge}세)` : '' },
        { label: `${y?.year ?? ''}년 세운`, value: y?.ganji },
        { label: '부담이 큰 구간', value: y?.peakPeriod },
        { label: '완화 구간', value: y?.reliefPeriod },
      ],
      'DAEWUN + SEUN'
    ),
    ...currentTimeAxisBlocks(cr).slice(1, 2),
  ];
}

export function buildFreeSections(cr: CommonResultData): OutputSection[] {
  const strengths = strengthItems(cr);
  const cautions = cautionItems(cr);

  return [
    section('free.overview', 1, '나의 사주 한눈에', [
      birthFacts(cr),
      pillarsTable(cr),
      dayMasterFacts(cr),
      ohaengBlocks(cr)[1],
      strengthBlocks(cr)[0],
      textBlock('가장 눈에 띄는 특징', cr.modules['CORE_ORIGINAL']?.summary, 'CORE_ORIGINAL.summary'),
    ]),
    section('free.strengths', 2, '나의 주요 강점', [
      strengths.length ? listBlock('강점 (최대 3개)', strengths, 'EOKBU/SINSAL/RELATION/evidence') : missingBlock('list', '강점 (최대 3개)', 'EOKBU/SINSAL/RELATION/evidence'),
    ]),
    section('free.cautions', 3, '주의할 현실 영역', [
      cautions.length ? listBlock('주의 영역 (최대 3개)', cautions, 'SINSAL/CORE_ORIGINAL/RELATION') : missingBlock('list', '주의 영역 (최대 3개)', 'SINSAL/CORE_ORIGINAL/RELATION'),
    ]),
    section('free.currentFlow', 4, '현재 흐름', currentFlowBlocks(cr)),
    section('free.question', 5, '나의 핵심 질문', [
      textBlock('내가 입력한 질문', question(cr), 'input.desiredQuestion'),
      textBlock('내가 입력한 고민', trouble(cr), 'input.coreTrouble'),
    ]),
    section('free.coreDiagnosis', 6, '핵심 진단', [
      textBlock('핵심 진단', cr.event?.primaryDiagnosis, 'event.primaryDiagnosis'),
    ]),
    section('free.scores', 7, '기본 점수', scoreBlocks(cr, 'summary')),
    section('free.upsell', 8, '더 깊은 분석 안내', [
      listBlock('무료에서 발견된 핵심 이슈', cr.classification?.keyIssues, 'classification.keyIssues'),
      listBlock('유료 분석에서 확인할 수 있는 내용', PAID_SECTION_TITLES, 'structure:PAID'),
    ]),
  ];
}

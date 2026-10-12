/**
 * src/modules/product-output/outputs/premium-output.ts
 *
 * Phase 83 — 상품 4: 프리미엄 (전체 분석 + 사건 진단 + 시간축 + 선택 + 처방 + 실행)
 *
 * 전체 명리 데이터 + 사용자 질문 + 사건 + 관계 + 마살 + 시간축 + 처방을 하나의 의사결정 결과로 통합한다.
 */

import { section, textBlock } from '../blocks.js';
import type { CommonResultData, OutputSection } from '../types.js';
import {
  behaviorBlocks,
  birthFacts,
  choiceCriteriaBlocks,
  currentIssueBlocks,
  currentTimeAxisBlocks,
  daewunBlocks,
  daewunLuckActivation,
  dayMasterFacts,
  diagnosisChainBlocks,
  environmentBlocks,
  executionPlanBlocks,
  finalDiagnosisBlocks,
  geokgukBlocks,
  magaBlocks,
  monthlyTable,
  ohaengBlocks,
  optionBlocks,
  pillarsTable,
  pressureMonthsBlock,
  primaryDomainEvidenceBlocks,
  question,
  relationFactsBlock,
  relationLinkNote,
  relationTable,
  sinsalBlocks,
  sipsinBlocks,
  strengthBlocks,
  topicBlocks,
  trouble,
  yearBlocks,
  yongsinBlocks,
} from '../section-parts.js';

export const PREMIUM_SECTION_TITLES = [
  '이번 진단에서 확인하는 질문',
  '사주 전체 구조',
  '오행',
  '십신',
  '격국·강약',
  '직업',
  '재물',
  '연애·결혼',
  '가족·생활',
  '건강·생활관리',
  '관계 구조',
  '마·살',
  '현재 문제의 핵심',
  '현재 대운',
  '현재 세운',
  '월별 흐름',
  '중장기 흐름',
  '선택지 비교',
  '최종 판단',
  '4주 실행 계획',
  '환경 처방',
  '행동 처방',
  '앞으로의 선택 기준',
  '최종 진단',
];

export function buildPremiumSections(cr: CommonResultData): OutputSection[] {
  const t = PREMIUM_SECTION_TITLES;
  const [flow0, flow1, flow2] = cr.yearFlows;

  return [
    // ① 이번 진단에서 확인하는 질문
    section('prem.question', 1, t[0], [
      textBlock('확인할 핵심 질문', question(cr), 'input.desiredQuestion'),
      textBlock('현재 겪고 있는 고민', trouble(cr), 'input.coreTrouble'),
    ]),

    // ② 사주 전체 구조
    section('prem.structure', 2, t[1], [
      birthFacts(cr),
      pillarsTable(cr),
      dayMasterFacts(cr),
    ]),

    // ③ 오행
    section('prem.ohaeng', 3, t[2], ohaengBlocks(cr)),

    // ④ 십신
    section('prem.sipsin', 4, t[3], sipsinBlocks(cr)),

    // ⑤ 격국·강약
    section('prem.gyeokgukStrength', 5, t[4], [
      ...geokgukBlocks(cr),
      ...strengthBlocks(cr),
      ...yongsinBlocks(cr),
    ]),

    // ⑥ 직업
    section('prem.career', 6, t[5], [
      ...topicBlocks(cr, 'JOB'),
      ...primaryDomainEvidenceBlocks(cr, 'JOB'),
    ]),

    // ⑦ 재물
    section('prem.money', 7, t[6], [
      ...topicBlocks(cr, 'MONEY'),
      ...primaryDomainEvidenceBlocks(cr, 'MONEY'),
    ]),

    // ⑧ 연애·결혼
    section('prem.loveMarriage', 8, t[7], [
      ...topicBlocks(cr, 'LOVE'),
      ...topicBlocks(cr, 'MARRIAGE'),
    ]),

    // ⑨ 가족·생활
    section('prem.family', 9, t[8], [
      ...topicBlocks(cr, 'RELATIONSHIP'),
    ]),

    // ⑩ 건강·생활관리
    section('prem.health', 10, t[9], [
      ...topicBlocks(cr, 'HEALTH'),
    ]),

    // ⑪ 관계 구조
    section('prem.relations', 11, t[10], [
      relationFactsBlock(cr),
      relationTable(cr, true),
      relationLinkNote(cr),
    ]),

    // ⑫ 마·살
    section('prem.malsal', 12, t[11], [
      ...magaBlocks(cr),
      ...sinsalBlocks(cr),
    ]),

    // ⑬ 현재 문제의 핵심
    section('prem.coreIssue', 13, t[12], currentIssueBlocks(cr)),

    // ⑭ 현재 대운
    section('prem.daewun', 14, t[13], [
      ...daewunBlocks(cr),
      daewunLuckActivation(cr),
    ]),

    // ⑮ 현재 세운
    section('prem.seun', 15, t[14], yearBlocks(flow0, '올해 세운')),

    // ⑯ 월별 흐름
    section('prem.monthly', 16, t[15], [
      monthlyTable(flow0, true),
      pressureMonthsBlock(flow0),
    ]),

    // ⑰ 중장기 흐름
    section('prem.longTerm', 17, t[16], [
      ...yearBlocks(flow1, '내년 세운'),
      ...yearBlocks(flow2, '후년 세운'),
      ...currentTimeAxisBlocks(cr),
    ]),

    // ⑱ 선택지 비교
    section('prem.options', 18, t[17], [optionBlocks(cr)]),

    // ⑲ 최종 판단
    section('prem.finalJudgment', 19, t[18], diagnosisChainBlocks(cr)),

    // ⑳ 4주 실행 계획
    section('prem.plan', 20, t[19], executionPlanBlocks(cr)),

    // ㉑ 환경 처방
    section('prem.environment', 21, t[20], environmentBlocks(cr)),

    // ㉒ 행동 처방
    section('prem.behavior', 22, t[21], behaviorBlocks(cr)),

    // ㉓ 앞으로의 선택 기준
    section('prem.criteria', 23, t[22], choiceCriteriaBlocks(cr)),

    // ㉔ 최종 진단
    section('prem.finalDiagnosis', 24, t[23], finalDiagnosisBlocks(cr)),
  ];
}

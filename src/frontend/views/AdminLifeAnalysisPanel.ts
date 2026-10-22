
/**
 * [신규] 대운별 명리 인과 요인(호재/악재) 추출기
 * - 십년대운, 일년세운과 동일하게 호재/악재 뱃지 및 위키 사전 연동
 */
function extractDaewoonFactors(d: any): { upwardFactors: Array<{ name: string; weight: number; category: string }>; downwardFactors: Array<{ name: string; weight: number; category: string }> } {
  const upwardFactors: Array<{ name: string; weight: number; category: string }> = [];
  const downwardFactors: Array<{ name: string; weight: number; category: string }> = [];

  // 1. 12운성 길흉
  if (['건록', '제왕', '장생', '관대'].includes(d.twelveStage)) {
    upwardFactors.push({ category: '12운성', name: `12운성 ${d.twelveStage}`, weight: 15 });
  } else if (['사', '묘', '절'].includes(d.twelveStage)) {
    downwardFactors.push({ category: '12운성', name: `12운성 ${d.twelveStage}`, weight: -12 });
  }

  // 2. 십신 길흉
  if (['정관', '정재', '식신', '정인'].includes(d.stemTenGod)) {
    upwardFactors.push({ category: '십신', name: d.stemTenGod, weight: 12 });
  } else if (['편관', '상관', '겁재'].includes(d.stemTenGod)) {
    downwardFactors.push({ category: '십신', name: d.stemTenGod, weight: -10 });
  }

  // 3. 귀인 및 길신살 / 흉살
  (d.activeSinsals || []).forEach((s: string) => {
    if (s.includes('귀인') || s.includes('천을') || s.includes('문창')) {
      upwardFactors.push({ category: '신살', name: s, weight: 15 });
    } else if (s.includes('도화') || s.includes('화개')) {
      // 예술/매력/종교성이면 상황에 따라 중립/호재
      upwardFactors.push({ category: '신살', name: s, weight: 8 });
    } else {
      downwardFactors.push({ category: '신살', name: s, weight: -10 });
    }
  });

  // 4. 원국 상호작용 (충/형/해/파/원진/합)
  (d.relationsWithNatal || []).forEach((r: string) => {
    if (r.includes('합')) {
      upwardFactors.push({ category: '합', name: r, weight: 14 });
    } else if (r.includes('충')) {
      downwardFactors.push({ category: '충', name: r, weight: -20 });
    } else if (r.includes('형') || r.includes('해') || r.includes('원진')) {
      downwardFactors.push({ category: '형해', name: r, weight: -15 });
    } else if (r.includes('파')) {
      downwardFactors.push({ category: '파', name: r, weight: -10 });
    }
  });

  // 5. 공망
  if (d.isGongmang) {
    const branch = d.ganji && d.ganji.length >= 2 ? d.ganji[1] : '';
    downwardFactors.push({ category: '공망', name: `대운 ${branch} 공망`, weight: -15 });
  }

  return { upwardFactors, downwardFactors };
}

/**
 * AdminLifeAnalysisPanel: 관리자 전용 "인생분석" 객관 데이터 관제실
 * 
 * 사주 엔진의 0~100세 중간 데이터 창고(CanonicalLifeDataWarehouse)를 시각화하여
 * 대표님, AI 모델(안프로), 인간 전문 사주가가 단일한 원천 데이터로 소통할 수 있는 UI
 */

import { LifeAnalysisWarehouseBuilder, CanonicalLifeDataWarehouse, DaewoonWarehouseRecord, SewoonWarehouseRecord } from '../../modules/life-analysis/life-analysis-warehouse.js';
import { buildEvidencePacket, scopeEvidencePacket } from '../../modules/life-analysis/evidence/evidence-packet-builder.js';
import { DOMAIN_GLOSSARY, PALACE_GLOSSARY } from '../../modules/life-analysis/evidence/evidence-glossary.js';
import { SajuEvidencePacket, EvidenceItem, DomainSignal } from '../../modules/life-analysis/evidence/evidence-schema.js';
import { getEnrichedFreeReportMarkdown } from '../modules/result-v2/enriched-report-builder.js';
import { extractReportContext, getFreeReportMarkdown, renderNarrativeReport } from '../components/tier-templates.js';
import { appState } from '../state/app-state.js';
import { findSajuFactorWiki, SAJU_FACTOR_WIKI_DB, SajuFactorWikiItem } from '../data/saju-factor-wiki.js';

// 기본 분석 상태 (캐시)
let currentWarehouse: CanonicalLifeDataWarehouse | null = null;
let selectedDaewoonOrder = 1;
let selectedWikiFactor: string | null = null;

export function setSelectedWikiFactor(factor: string | null): void {
  selectedWikiFactor = factor;
}

export function getSelectedWikiFactor(): string | null {
  return selectedWikiFactor;
}

// 기본 초기값 생성
const builder = new LifeAnalysisWarehouseBuilder();

export function getActiveWarehouse(): CanonicalLifeDataWarehouse {
  if (!currentWarehouse) {
    // 기본 프리셋 (1998년 4월 12일 09시 20분 여성 - 기축일주)
    currentWarehouse = builder.buildWarehouse({
      birthYear: 1998,
      birthMonth: 4,
      birthDay: 12,
      birthHour: 9,
      birthMinute: 20,
      gender: 'female',
      calendarType: 'solar',
    });
    selectedDaewoonOrder = currentWarehouse.daewoonLayer.currentDaewoonOrder;
  }
  return currentWarehouse;
}

export function executeLifeAnalysis(params: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthTimeRaw?: string | number | null;
  birthHour?: number | null;
  birthMinute?: number | null;
  gender: 'male' | 'female';
  calendarType?: 'solar' | 'lunar';
}): CanonicalLifeDataWarehouse {
  currentWarehouse = builder.buildWarehouse(params);
  selectedDaewoonOrder = currentWarehouse.daewoonLayer.currentDaewoonOrder;
  return currentWarehouse;
}

let selectedYear: number | null = null;
let selectedMonth: number | null = null;
let isLifeChartFullscreen: boolean = false;
let isSajuInputExpanded: boolean = false;
export type LifeChartViewMode = '100years' | '10years' | '12months';
let lifeChartViewMode: LifeChartViewMode = '100years';

// [대분류/소분류 단계별 관제 상태]
export type LifeAnalysisStage = 'all' | 'stage-1' | 'stage-2' | 'stage-3' | 'stage-4';
let activeLifeStage: LifeAnalysisStage = 'all';

let stageExpandedMap: Record<string, boolean> = {
  'stage-1': true, // 1단계: 원국 진단
  'stage-2': true, // 2단계: 100년 라이프사이클 & 9대 영역
  'stage-3': true, // 3단계: 시간축 대운·세운·월운 심층 인과
  'stage-4': false, // 4단계: B2B 패킷 및 결과지 대조실 (기본은 접힘, 클릭 시 펼침)
};

export function setActiveLifeStage(stage: LifeAnalysisStage): void {
  activeLifeStage = stage;
  if (stage !== 'all') {
    stageExpandedMap[stage] = true;
  }
}

export function getActiveLifeStage(): LifeAnalysisStage {
  return activeLifeStage;
}

export function toggleLifeStage(stageId: string): void {
  stageExpandedMap[stageId] = !stageExpandedMap[stageId];
}

export function isLifeStageExpanded(stageId: string): boolean {
  if (activeLifeStage !== 'all') {
    return activeLifeStage === stageId;
  }
  return !!stageExpandedMap[stageId];
}

export function setAllLifeStagesExpanded(expanded: boolean): void {
  activeLifeStage = 'all';
  stageExpandedMap['stage-1'] = expanded;
  stageExpandedMap['stage-2'] = expanded;
  stageExpandedMap['stage-3'] = expanded;
  stageExpandedMap['stage-4'] = expanded;
}

export function setSelectedLifeSewoonYear(year: number): void {
  selectedYear = year;
}

export function getSelectedLifeSewoonYear(): number | null {
  return selectedYear;
}

export function setSelectedLifeMonth(month: number): void {
  selectedMonth = month;
}

export function getSelectedLifeMonth(): number | null {
  return selectedMonth;
}

export const setSelectedYear = setSelectedLifeSewoonYear;
export const getSelectedYear = getSelectedLifeSewoonYear;

export function setSelectedDaewoonOrder(order: number): void {
  selectedDaewoonOrder = order;
}

export function getSelectedDaewoonOrder(): number {
  return selectedDaewoonOrder;
}

export function setLifeChartViewMode(mode: LifeChartViewMode): void {
  lifeChartViewMode = mode;
}

export function getLifeChartViewMode(): LifeChartViewMode {
  return lifeChartViewMode;
}

export function toggleLifeChartViewMode(): void {
  if (lifeChartViewMode === '100years') {
    lifeChartViewMode = '10years';
  } else if (lifeChartViewMode === '10years') {
    lifeChartViewMode = '12months';
  } else {
    lifeChartViewMode = '100years';
  }
}

export function toggleLifeChartFullscreen(): void {
  isLifeChartFullscreen = !isLifeChartFullscreen;
}

export function setLifeChartFullscreen(fs: boolean): void {
  isLifeChartFullscreen = fs;
}

export function getLifeChartFullscreen(): boolean {
  return isLifeChartFullscreen;
}

export function toggleSajuInputExpanded(): void {
  isSajuInputExpanded = !isSajuInputExpanded;
}

export function getSajuInputExpanded(): boolean {
  return isSajuInputExpanded;
}

/**
 * 0점을 평운 기준선으로 하는 직관적 -100 ~ +100 점수 표기
 * - 0점: 평운 기준선 (중앙선)
 * - +구간: +10 ~ +100점 (상승 및 호재)
 * - -구간: -10 ~ -100점 (하강 및 상충마살)
 */
export function toConvertedLifeScore(rawStep: number): { score: number; text: string } {
  const rounded = Math.round(rawStep * 10) / 10;
  const scoreStr = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  const sign = rounded > 0 ? '+' : '';
  return {
    score: rounded,
    text: `${sign}${scoreStr}점`,
  };
}

/**
 * 대운 기운 점수(-50 ~ +50)를 0점 기준 직관적 점수 표기로 치환
 */
export function toConvertedDaewoonScore(rawScore: number): { score: number; text: string } {
  const rounded = Math.round(rawScore * 10) / 10;
  const scoreStr = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  const sign = rounded > 0 ? '+' : '';
  return { score: rounded, text: `${sign}${scoreStr}점` };
}

/**
 * 1년 세운 내 12개월(월운) 정밀 레코드 인터페이스
 */
export interface MonthWoonRecord {
  month: number; // 1 ~ 12
  monthName: string; // '1월', '2월' ...
  solarTerm: string; // '입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설', '소한'
  ganji: string; // 월건 간지 (예: '병인', '정묘'...)
  stemTenGod: string; // 천간 십신
  branchTenGod: string; // 지지 십신
  twelveStage: string; // 12운성
  stepHeight: number; // 0점 기준 -100 ~ +100 점수
  upSum: number; // 상승 가중치 총합
  downSum: number; // 하강 가중치 총합
  netWeight: number; // 순수 가중치 합 (upSum + downSum)
  formulaText: string; // 판별 산식 표준 텍스트 (예: "상승(+18점) + 하강(-42점) = 순수 -24점 ➔ 최종 -39점")
  upwardFactors: Array<{ name: string; weight: number; category: string }>;
  downwardFactors: Array<{ name: string; weight: number; category: string }>;
}

/**
 * 선택된 연도(세운)의 12개월(월운) 동적 명리 시뮬레이션 계산
 */
export function calculate12MonthsWoon(wh: CanonicalLifeDataWarehouse, targetYear: number): MonthWoonRecord[] {
  const natal = wh.natalLayer;
  const dayPillar = natal.pillars?.find((p: any) => p.position === '일주') || natal.pillars?.[2];
  const monthPillar = natal.pillars?.find((p: any) => p.position === '월주') || natal.pillars?.[1];
  const dayStem = natal.dayMaster?.stem || (dayPillar ? dayPillar.stem : '기');
  const dayBranch = dayPillar ? dayPillar.branch : '축';
  const monthBranch = monthPillar ? monthPillar.branch : '진';
  const primaryYongshin = natal.yongshin?.yongshin || '금';
  const secondaryYongshin = natal.yongshin?.heeshin || '수';
  const gishin = natal.yongshin?.gishin || '목';

  // 천간 10간 & 지지 12지
  const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const branches = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];
  const solarTerms = ['입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설', '소한'];

  // 년상기월법: targetYear의 연간 구하기
  // 4년 = 갑자년 기준
  const yearStemIdx = ((targetYear - 4) % 10 + 10) % 10;
  // 인월(1월 입춘)의 첫 천간 인덱스
  const firstStemIdx = ((yearStemIdx % 5) * 2 + 2) % 10;

  // 지지 충·파·해·원진 맵
  const clashes: Record<string, string> = { '자': '오', '축': '미', '인': '신', '묘': '유', '진': '술', '사': '해', '오': '자', '미': '축', '신': '인', '유': '묘', '술': '진', '해': '사' };
  const harms: Record<string, string> = { '자': '미', '축': '오', '인': '사', '묘': '진', '신': '해', '유': '술', '미': '자', '오': '축', '사': '인', '진': '묘', '해': '신', '술': '유' };
  const destructions: Record<string, string> = { '자': '유', '축': '진', '인': '해', '묘': '오', '사': '신', '술': '미', '유': '자', '진': '축', '해': '인', '오': '묘', '신': '사', '미': '술' };
  const wonjin: Record<string, string> = { '자': '미', '축': '오', '인': '유', '묘': '신', '진': '해', '사': '술', '미': '자', '오': '축', '유': '인', '신': '묘', '해': '진', '술': '사' };

  // 12운성 약식 조견표
  const twelveStageMap: Record<string, Record<string, string>> = {
    '기': { '인': '사', '묘': '병', '진': '쇠', '사': '제왕', '오': '건록', '미': '관대', '신': '목욕', '유': '장생', '술': '양', '해': '태', '자': '절', '축': '묘' },
    '갑': { '해': '장생', '자': '목욕', '축': '관대', '인': '건록', '묘': '제왕', '진': '쇠', '사': '병', '오': '사', '미': '묘', '신': '절', '유': '태', '술': '양' },
    '을': { '오': '장생', '사': '목욕', '진': '관대', '묘': '건록', '인': '제왕', '축': '쇠', '자': '병', '해': '사', '술': '묘', '유': '절', '신': '태', '미': '양' },
    '병': { '인': '장생', '묘': '목욕', '진': '관대', '사': '건록', '오': '제왕', '미': '쇠', '신': '병', '유': '사', '술': '묘', '해': '절', '자': '태', '축': '양' },
    '정': { '유': '장생', '신': '목욕', '미': '관대', '오': '건록', '사': '제왕', '진': '쇠', '묘': '병', '인': '사', '축': '묘', '자': '절', '해': '태', '술': '양' },
    '무': { '인': '장생', '묘': '목욕', '진': '관대', '사': '건록', '오': '제왕', '미': '쇠', '신': '병', '유': '사', '술': '묘', '해': '절', '자': '태', '축': '양' },
    '경': { '사': '장생', '오': '목욕', '미': '관대', '신': '건록', '유': '제왕', '술': '쇠', '해': '병', '자': '사', '축': '묘', '인': '절', '묘': '태', '진': '양' },
    '신': { '자': '장생', '해': '목욕', '술': '관대', '유': '건록', '신': '제왕', '미': '쇠', '오': '병', '사': '사', '진': '묘', '묘': '절', '인': '태', '축': '양' },
    '임': { '신': '장생', '유': '목욕', '술': '관대', '해': '건록', '자': '제왕', '축': '쇠', '인': '병', '묘': '사', '진': '묘', '사': '절', '오': '태', '미': '양' },
    '계': { '묘': '장생', '인': '목욕', '축': '관대', '자': '건록', '해': '제왕', '술': '쇠', '유': '병', '신': '사', '미': '묘', '오': '절', '사': '태', '진': '양' }
  };

  const records: MonthWoonRecord[] = [];

  for (let m = 0; m < 12; m++) {
    const stem = stems[(firstStemIdx + m) % 10];
    const branch = branches[m]; // 인, 묘, 진 ... 축
    const ganji = `${stem}${branch}`;
    const solarTerm = solarTerms[m];
    const monthNum = m + 1;

    const upwardFactors: Array<{ name: string; weight: number; category: string }> = [];
    const downwardFactors: Array<{ name: string; weight: number; category: string }> = [];

    // 12운성
    const dayMap = twelveStageMap[dayStem] || twelveStageMap['기'];
    const stage = dayMap[branch] || '평';
    if (['건록', '제왕', '장생'].includes(stage)) {
      upwardFactors.push({ category: '12운성', name: `12운성 ${stage}`, weight: stage === '제왕' ? 22 : 18 });
    } else if (['사', '묘', '절'].includes(stage)) {
      downwardFactors.push({ category: '12운성', name: `12운성 ${stage}`, weight: -15 });
    }

    // 일지/월지와의 충/파/해/원진
    if (clashes[branch] === dayBranch) {
      downwardFactors.push({ category: '충', name: `일지 충(${branch}${dayBranch}충)`, weight: -25 });
    } else if (clashes[branch] === monthBranch) {
      downwardFactors.push({ category: '충', name: `월지 충(${branch}${monthBranch}충)`, weight: -18 });
    }

    if (harms[branch] === dayBranch) {
      downwardFactors.push({ category: '해', name: `일지 해(${branch}${dayBranch}해)`, weight: -12 });
    }
    if (destructions[branch] === dayBranch) {
      downwardFactors.push({ category: '파', name: `일지 파(${branch}${dayBranch}파)`, weight: -10 });
    }
    if (wonjin[branch] === dayBranch) {
      downwardFactors.push({ category: '원진', name: `일지 원진(${branch}${dayBranch}원진)`, weight: -15 });
    }

    // 공망
    if (wh.deepStructure?.gongmang?.dayBased?.includes(branch)) {
      downwardFactors.push({ category: '공망', name: `월운 ${branch} 공망`, weight: -15 });
    }

    // 용신/희신
    const stemElem = stem === '갑' || stem === '을' ? '목' : stem === '병' || stem === '정' ? '화' : stem === '무' || stem === '기' ? '토' : stem === '경' || stem === '신' ? '금' : '수';
    const branchElem = ['인', '묘'].includes(branch) ? '목' : ['사', '오'].includes(branch) ? '화' : ['진', '술', '축', '미'].includes(branch) ? '토' : ['신', '유'].includes(branch) ? '금' : '수';

    if (stemElem === primaryYongshin || branchElem === primaryYongshin) {
      upwardFactors.push({ category: '용신', name: `주용신 ${primaryYongshin} 유입`, weight: 24 });
    } else if (stemElem === secondaryYongshin || branchElem === secondaryYongshin) {
      upwardFactors.push({ category: '희신', name: `희신 ${secondaryYongshin} 유입`, weight: 14 });
    }

    if (stemElem === gishin && branchElem === gishin) {
      downwardFactors.push({ category: '기신', name: `기신 ${gishin} 중첩`, weight: -16 });
    }

    // 종합 가중치 -> stepHeight (-80 ~ +80)
    const upSum = upwardFactors.reduce((a, b) => a + b.weight, 0);
    const downSum = downwardFactors.reduce((a, b) => a + b.weight, 0);
    const net = upSum + downSum;

    let stepH = 0;
    if (net >= 0) {
      stepH = Math.min(80, Math.round((net / 40) * 65));
    } else {
      stepH = Math.max(-80, Math.round((net / 40) * 65));
    }

    const finalConverted = toConvertedLifeScore(stepH).text;
    const formulaText = `상승(+${upSum}점) + 하강(${downSum}점) = 순수 ${net > 0 ? '+' + net : net}점 ➔ 최종 ${finalConverted}`;

    records.push({
      month: monthNum,
      monthName: `${monthNum}월`,
      solarTerm,
      ganji,
      stemTenGod: '월간',
      branchTenGod: '월지',
      twelveStage: stage,
      stepHeight: stepH,
      upSum,
      downSum,
      netWeight: net,
      formulaText,
      upwardFactors,
      downwardFactors,
    });
  }

  return records;
}

/**
 * 0~100세 라이프사이클 간결한 1.2px 스텝 라인(Step-Line) SVG 렌더링
 * - 어지러운 텍스트 노이즈를 전면 배제하고, 극도로 정갈한 1.2px 정밀 스텝 파동 선만 렌더링
 * - 100년 전체 구조가 화면 너비에 100% 최적화(Fit to Screen)되어 스크롤 없이 한눈에 조망
 * - 특정 연도를 클릭하면 해당 위치에만 핀포인트 뱃지가 떠올라 직관적으로 파악됨
 */
function renderLifeCycleStepLineSvg(wh: CanonicalLifeDataWarehouse, isFullscreen: boolean = false): string {
  const sewoonRecords = wh.sewoonLayer.records;
  const daewoonRecords = wh.daewoonLayer.records;
  if (!sewoonRecords || sewoonRecords.length === 0) return '';

  const isZoom = lifeChartViewMode === '10years';
  
  // [대시보드 vs 전체보기 최적화]
  // - 대시보드(!isFullscreen): 작은 화면으로 전체 흐름을 즉시 판단할 수 있는 250px 컴팩트 뷰
  // - 전체화면(isFullscreen): 100vh 전면 뷰포트에서 상세 요인을 넓고 깊이 있게 파악하는 1600x580 대형 뷰
  const width = isFullscreen ? 1600 : 1100;
  const height = isFullscreen ? 580 : 250;
  const padLeft = isFullscreen ? 70 : 55;
  const padRight = isFullscreen ? 50 : 35;
  const padTop = isFullscreen ? 190 : 50;
  const padBottom = isFullscreen ? 36 : 28;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // 0점 기준 대칭 볼륨 스케일 (-80 ~ +80)
  const minY = -80;
  const maxY = 80;

  const currentYear = new Date().getFullYear();
  const birthYear = parseInt(wh.metadata.input.birthDate.split('-')[0], 10) || 1998;
  const currentAge = currentYear - birthYear + 1;

  if (selectedYear === null) {
    const curSewoon = sewoonRecords.find(s => s.isCurrentYear);
    selectedYear = curSewoon ? curSewoon.year : sewoonRecords[0].year;
  }

  // 10년 줌인 대상 레코드 필터
  const targetDw = daewoonRecords.find(d => d.order === selectedDaewoonOrder) || daewoonRecords[0];
  const activeRecords = isZoom
    ? sewoonRecords.filter(s => s.age >= targetDw.startAge && s.age <= targetDw.endAge)
    : sewoonRecords;

  const count = activeRecords.length;
  const stepW = chartW / (count > 1 ? count : 1);

  // 명리 요인 간결 라벨 포맷터
  const formatFactorShort = (f: { name: string; weight: number }, isUp: boolean): string => {
    let name = f.name || '';
    name = name.replace(/\([\u4e00-\u9fa5a-zA-Z0-9_\s]+\)/g, '');
    name = name.replace(/^세운\s*/, '');
    name = name.replace(/\s*유입$/, '');
    name = name.replace(/\s*과다$/, '');
    name = name.trim();
    if (name.length > 7) {
      name = name.substring(0, 7);
    }
    const weightStr = f.weight > 0 ? `+${f.weight}` : `${f.weight}`;
    return `${name} (${weightStr})`;
  };

  // 좌표 계산
  const points = activeRecords.map((s, idx) => {
    const x = isZoom
      ? padLeft + idx * stepW
      : padLeft + (s.age / 100) * chartW;
    const clampedH = Math.max(minY, Math.min(maxY, s.stepHeight));
    const normalizedH = (clampedH - minY) / (maxY - minY);
    const y = padTop + chartH * (1 - normalizedH);
    return { x, y, record: s };
  });

  // 스텝(Step) 경로 생성
  let stepD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    stepD += ` H ${curr.x} V ${curr.y}`;
  }
  stepD += ` H ${points[points.length - 1].x + (isZoom ? stepW : chartW / 100)}`;

  // +60 / 0 / -60 기준선 Y좌표
  const yPlus60 = padTop + chartH * (1 - (60 - minY) / (maxY - minY));
  const zeroY = padTop + chartH * (1 - (0 - minY) / (maxY - minY));
  const yMinus60 = padTop + chartH * (1 - (-60 - minY) / (maxY - minY));

  // 현시점(올해) X좌표
  let curAgeX: number | null = null;
  if (!isZoom) {
    const curAgeClamped = Math.max(0, Math.min(100, currentAge));
    curAgeX = padLeft + (curAgeClamped / 100) * chartW + (chartW / 100) / 2;
  } else {
    const curIdx = activeRecords.findIndex(s => s.year === currentYear);
    if (curIdx !== -1) {
      curAgeX = padLeft + curIdx * stepW + stepW / 2;
    }
  }

  // [요구사항 1번 수정] 백년운세 & 십년대운 모두 데이터 포인트 칸의 정확한 정중앙 X좌표 계산
  const selectedPoint = points.find(p => p.record.year === selectedYear) || points[0];
  const selBoxW = isZoom ? stepW : (chartW / 100);
  const selMidX = selectedPoint.x + selBoxW / 2;

  const wrapperH = isFullscreen ? '100%' : '250px';

  return `
  <div class="life-chart-canvas-wrapper" style="width: 100%; height: ${wrapperH}; min-height: ${wrapperH}; max-height: ${wrapperH}; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(15, 23, 42, 0.4); border-radius: 12px; padding: 0.25rem; position: relative; box-sizing: border-box; overflow: hidden;">
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; display: block; margin: 0 auto; font-family: var(--font-sans, 'Noto Sans KR', sans-serif); user-select: none;">
      
      <style>
        .btn-select-sewoon-year { transition: fill 0.1s ease; }
        .btn-select-sewoon-year:hover { fill: rgba(255, 255, 255, 0.16) !important; }
        .btn-select-daewoon-header:hover rect { fill: rgba(56, 189, 248, 0.3) !important; stroke: #38bdf8 !important; }
        .btn-select-sewoon-to-months:hover rect { fill: rgba(56, 189, 248, 0.32) !important; }
        .sewoon-header-box:hover { stroke: #38bdf8 !important; }
        .sewoon-hover-score { opacity: 0; transition: opacity 0.15s ease, transform 0.15s ease; }
        .sewoon-hover-score.is-selected { opacity: 1 !important; }
        .sewoon-col-group:hover .sewoon-hover-score { opacity: 1 !important; }
        .sewoon-col-group:hover .sewoon-hitbox { fill: rgba(56, 189, 248, 0.14) !important; }
        .btn-open-factor-wiki { transition: filter 0.15s ease, transform 0.15s ease; }
        .btn-open-factor-wiki:hover { filter: brightness(1.28); }
      </style>

      <!-- +60 / 0 / -60 대칭 볼륨 기준선 (20등급 가상 척도 가이드) -->
      <line x1="${padLeft}" y1="${yPlus60}" x2="${width - padRight}" y2="${yPlus60}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="3,3" stroke-width="1" />
      <line x1="${padLeft}" y1="${zeroY}" x2="${width - padRight}" y2="${zeroY}" stroke="rgba(255,255,255,0.32)" stroke-width="1.4" />
      <line x1="${padLeft}" y1="${yMinus60}" x2="${width - padRight}" y2="${yMinus60}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="3,3" stroke-width="1" />

      <!-- Y축 레이블 (+60 / 0 / -60 세련된 Space Grotesk 디스플레이 폰트 적용) -->
      <text x="${padLeft - 12}" y="${yPlus60 + 5}" fill="#38bdf8" font-size="${isFullscreen ? 14.5 : 11.5}" font-weight="700" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="end">+60</text>
      <text x="${padLeft - 12}" y="${zeroY + 5}" fill="#ffffff" font-size="${isFullscreen ? 14.5 : 12}" font-weight="800" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="end">0</text>
      <text x="${padLeft - 12}" y="${yMinus60 + 5}" fill="#fca5a5" font-size="${isFullscreen ? 14.5 : 11.5}" font-weight="700" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="end">-60</text>

      ${!isZoom ? `
        <!-- [백년운세 모드] 상단 대운 헤더 버튼 + 대운 요인 뱃지 (십년대운과 동일한 2단 분리 구조) -->
        <text x="${padLeft - 12}" y="${isFullscreen ? 24 : 26}" fill="#64748b" font-size="${isFullscreen ? 14.5 : 10.5}" font-weight="700" text-anchor="end">대운</text>
        
        ${daewoonRecords.map((d, dIdx) => {
          const colW = (chartW / daewoonRecords.length);
          const midX = padLeft + dIdx * colW + colW / 2;
          const isTargetDw = d.order === selectedDaewoonOrder;
          const isEnergyPos = d.energyScore >= 0;
          const { upwardFactors, downwardFactors } = extractDaewoonFactors(d);
          const headerBoxW = colW - (isFullscreen ? 6 : 4);
          const badgeW = Math.max(50, Math.min(headerBoxW - 4, isFullscreen ? 140 : 78));

          const dwTooltip = `제${d.order}대운(${d.ganji}) (${d.startYear}~${d.endYear}년 · ${d.startAge}~${d.endAge}세)\n` +
            `• 십신: ${d.stemTenGod} · 12운성: ${d.twelveStage}\n` +
            `• 상승: ${upwardFactors.map(f => f.name).join(', ') || '없음'}\n` +
            `• 하강: ${downwardFactors.map(f => f.name).join(', ') || '없음'}\n(클릭 시 해당 십년대운 10년 궤적 확대)`;

          if (!isFullscreen) {
            // [대시보드 컴팩트 뷰]: 대운 헤더 박스
            return `
              <g class="btn-select-daewoon-header" data-order="${d.order}" style="cursor: pointer;">
                <title>${dwTooltip}</title>
                <rect class="daewoon-header-box" x="${midX - headerBoxW / 2}" y="5" width="${headerBoxW}" height="38" rx="5"
                  fill="${isTargetDw ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)'}"
                  stroke="${isTargetDw ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}" stroke-width="${isTargetDw ? '1.5' : '0.8'}" />
                <text x="${midX}" y="21.5" fill="${isTargetDw ? '#38bdf8' : '#ffffff'}" font-size="13.5" font-weight="700" font-family="var(--font-serif, 'Noto Serif KR', serif)" text-anchor="middle">${d.ganji}</text>
                <text x="${midX}" y="35" fill="${isTargetDw ? '#ffffff' : '#94a3b8'}" font-size="10" font-weight="700" text-anchor="middle">${d.startYear}~${d.endYear}년</text>
              </g>
              <line x1="${padLeft + dIdx * colW}" y1="${padTop - 6}" x2="${padLeft + dIdx * colW}" y2="${padTop + chartH + 6}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
            `;
          }

          // [전체화면 대형 뷰]: 상단부(대운 전환)와 하단부(대운 요인 뱃지 위키) 물리적 분리
          return `
            <!-- 1. [상단부] 대운 전환 버튼 (클릭 시 해당 10년 대운 모드로 확대) -->
            <g class="btn-select-daewoon-header" data-order="${d.order}" style="cursor: pointer;">
              <title>${dwTooltip}</title>
              <rect class="daewoon-header-box" x="${midX - headerBoxW / 2}" y="2" width="${headerBoxW}" height="44" rx="6"
                fill="${isTargetDw ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)'}"
                stroke="${isTargetDw ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}" stroke-width="${isTargetDw ? '1.5' : '0.8'}" />
              <text x="${midX}" y="21" fill="${isTargetDw ? '#38bdf8' : '#ffffff'}" font-size="16" font-weight="700" font-family="var(--font-serif, 'Noto Serif KR', serif)" text-anchor="middle">제${d.order}대운(${d.ganji})</text>
              <text x="${midX}" y="38" fill="${isTargetDw ? '#ffffff' : '#94a3b8'}" font-size="11.5" font-weight="700" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="middle">${d.startYear}~${d.endYear}년</text>
            </g>

            <!-- 2. [하단부] 대운 핵심 호재/악재 요인 뱃지 독립 영역 (클릭 시 위키 연동) -->
            <g class="daewoon-factors-area">
              <!-- 대운 호재 뱃지 -->
              ${upwardFactors.slice(0, 3).map((uf, uIdx) => {
                const badgeY = 48 + (uIdx * 23);
                return `
                  <g class="btn-open-factor-wiki" data-factor="${uf.name}" style="cursor: pointer;">
                    <title>${uf.name} 명리 위키 백과 보기</title>
                    <rect x="${midX - badgeW / 2}" y="${badgeY}" width="${badgeW}" height="21" rx="4"
                      fill="${isTargetDw ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.15)'}"
                      stroke="${isTargetDw ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'}" stroke-width="0.8" />
                    <text x="${midX}" y="${badgeY + 15}" fill="#38bdf8" font-size="13.5" font-weight="700" text-anchor="middle">
                      ${formatFactorShort(uf, true)}
                    </text>
                  </g>
                `;
              }).join('')}

              <!-- 대운 악재 뱃지 -->
              ${downwardFactors.slice(0, 3).map((df, dIdx) => {
                const badgeY = 48 + (Math.min(upwardFactors.length, 3) * 23) + (dIdx * 23);
                return `
                  <g class="btn-open-factor-wiki" data-factor="${df.name}" style="cursor: pointer;">
                    <title>${df.name} 명리 위키 백과 보기</title>
                    <rect x="${midX - badgeW / 2}" y="${badgeY}" width="${badgeW}" height="21" rx="4"
                      fill="${isTargetDw ? 'rgba(248, 113, 113, 0.28)' : 'rgba(248, 113, 113, 0.15)'}"
                      stroke="${isTargetDw ? '#f87171' : 'rgba(248, 113, 113, 0.4)'}" stroke-width="0.8" />
                    <text x="${midX}" y="${badgeY + 15}" fill="#fca5a5" font-size="13.5" font-weight="700" text-anchor="middle">
                      ${formatFactorShort(df, false)}
                    </text>
                  </g>
                `;
              }).join('')}

              ${upwardFactors.length === 0 && downwardFactors.length === 0 ? `
                <text x="${midX}" y="67" fill="#64748b" font-size="13.5" font-weight="600" text-anchor="middle">평운 (안정)</text>
              ` : ''}
            </g>

            <line x1="${padLeft + dIdx * colW}" y1="${padTop - 6}" x2="${padLeft + dIdx * colW}" y2="${padTop + chartH + 6}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          `;
        }).join('')}

        <!-- 하단 X축 연도 라벨 및 대운 시작 연도 -->
        <text x="${padLeft - 12}" y="${padTop + chartH + (isFullscreen ? 22 : 18)}" fill="#64748b" font-size="${isFullscreen ? 14.5 : 9.5}" font-weight="700" text-anchor="end">연도</text>
        <line x1="${padLeft}" y1="${padTop + chartH + 6}" x2="${width - padRight}" y2="${padTop + chartH + 6}" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        
        ${points.map(p => `
          <line x1="${p.x + (chartW / 100) / 2}" y1="${padTop + chartH + 6}" x2="${p.x + (chartW / 100) / 2}" y2="${padTop + chartH + 9}" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" />
        `).join('')}

        ${daewoonRecords.map(d => {
          const x = padLeft + (d.startAge / 100) * chartW + (chartW / 100) / 2;
          const isTargetDw = d.order === selectedDaewoonOrder;
          return `
            <line x1="${x}" y1="${padTop + chartH + 6}" x2="${x}" y2="${padTop + chartH + 13}" stroke="${isTargetDw ? '#38bdf8' : 'rgba(255,255,255,0.45)'}" stroke-width="${isTargetDw ? '1.8' : '1.2'}" />
            <text x="${x}" y="${padTop + chartH + (isFullscreen ? 22 : 18)}" fill="${isTargetDw ? '#38bdf8' : '#94a3b8'}" font-size="${isFullscreen ? 14.5 : 10.5}" font-weight="${isTargetDw ? '800' : '600'}" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="middle">${d.startYear}년</text>
          `;
        }).join('')}
        <line x1="${width - padRight}" y1="${padTop + chartH + 6}" x2="${width - padRight}" y2="${padTop + chartH + 13}" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" />
        <text x="${width - padRight}" y="${padTop + chartH + (isFullscreen ? 22 : 18)}" fill="#64748b" font-size="${isFullscreen ? 14.5 : 10}" font-weight="600" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="middle">${daewoonRecords[daewoonRecords.length - 1].endYear}년</text>
      ` : `
        <!-- [십년대운 모드] 상단부(연도 이동)와 하단부(상충마살 위키)가 명확히 분리된 2단 헤더 구조 -->
        ${points.map((p, idx) => {
          const midX = p.x + stepW / 2;
          const isSel = p.record.year === selectedYear;
          const upFactors = (p.record.upwardFactors || []).slice(0, 2);
          const downFactors = (p.record.downwardFactors || []).slice(0, 2);
          const headerBoxW = stepW - (isFullscreen ? 6 : 4);
          const badgeW = Math.max(50, Math.min(headerBoxW - 4, isFullscreen ? 140 : 78));

          const isPos = p.record.stepHeight >= 0;

          if (!isFullscreen) {
            // [대시보드 컴팩트 뷰]: 상단부(간지/연도) 클릭 시 12개월 세운으로 이동
            return `
              <g class="btn-select-sewoon-year-hdr" data-year="${p.record.year}" style="cursor: pointer;">
                <title>${p.record.year}년 (${p.record.ganji}년): ${toConvertedLifeScore(p.record.stepHeight).text} - 클릭 시 12개월 일년세운으로 이동</title>
                <rect class="sewoon-header-box" x="${p.x + 2}" y="5" width="${headerBoxW}" height="38" rx="5"
                  fill="${isSel ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)'}"
                  stroke="${isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}" stroke-width="${isSel ? '1.5' : '0.8'}" />
                <text x="${midX}" y="21.5" fill="${isSel ? '#38bdf8' : '#ffffff'}" font-size="13.5" font-weight="700" font-family="var(--font-serif, 'Noto Serif KR', serif)" text-anchor="middle">${p.record.ganji}년</text>
                <text x="${midX}" y="35" fill="${isSel ? '#ffffff' : '#94a3b8'}" font-size="10.5" font-weight="700" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="middle">${p.record.year}년</text>
              </g>
              <line x1="${p.x}" y1="${padTop - 6}" x2="${p.x}" y2="${padTop + chartH + 6}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
            `;
          }

          // [전체화면 대형 정밀 뷰]: 상단부(연도 클릭 ➔ 세운 이동)와 하단부(상충마살 클릭 ➔ 위키 팝업)를 물리적으로 분리
          return `
            <!-- 1. [상단부] 연도/간지 이동 버튼 (클릭 시 12개월 세운으로 이동) -->
            <g class="btn-select-sewoon-year-hdr" data-year="${p.record.year}" style="cursor: pointer;">
              <title>${p.record.year}년 (${p.record.ganji}년): ${toConvertedLifeScore(p.record.stepHeight).text} 12개월 일년세운 보기</title>
              <rect class="sewoon-header-box" x="${p.x + 3}" y="2" width="${headerBoxW}" height="44" rx="6"
                fill="${isSel ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)'}"
                stroke="${isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}" stroke-width="${isSel ? '1.5' : '0.8'}" />
              <text x="${midX}" y="21" fill="${isSel ? '#38bdf8' : '#ffffff'}" font-size="16" font-weight="700" font-family="var(--font-serif, 'Noto Serif KR', serif)" text-anchor="middle">${p.record.ganji}년</text>
              <text x="${midX}" y="38" fill="${isSel ? '#ffffff' : '#94a3b8'}" font-size="11.5" font-weight="700" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="middle">${p.record.year}년</text>
            </g>

            <!-- 2. [하단부] 상충마살/호재 세부 요인 뱃지 독립 영역 (클릭 시 위키 백과 모달 팝업 및 하단 정보 연동) -->
            <g class="sewoon-factors-area">
              <!-- 호재 요인 뱃지 -->
              ${upFactors.map((uf, uIdx) => {
                const badgeY = 48 + (uIdx * 23);
                return `
                  <g class="btn-open-factor-wiki" data-factor="${uf.name}" style="cursor: pointer;">
                    <title>${uf.name} 명리 위키 백과 보기</title>
                    <rect x="${midX - badgeW / 2}" y="${badgeY}" width="${badgeW}" height="21" rx="4"
                      fill="${isSel ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.15)'}"
                      stroke="${isSel ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'}" stroke-width="0.8" />
                    <text x="${midX}" y="${badgeY + 15}" fill="#38bdf8" font-size="13.5" font-weight="700" text-anchor="middle">
                      ${formatFactorShort(uf, true)}
                    </text>
                  </g>
                `;
              }).join('')}

              <!-- 악재(상충마살) 요인 뱃지 -->
              ${downFactors.map((df, dIdx) => {
                const badgeY = 48 + (upFactors.length * 23) + (dIdx * 23);
                return `
                  <g class="btn-open-factor-wiki" data-factor="${df.name}" style="cursor: pointer;">
                    <title>${df.name} 명리 위키 백과 보기</title>
                    <rect x="${midX - badgeW / 2}" y="${badgeY}" width="${badgeW}" height="21" rx="4"
                      fill="${isSel ? 'rgba(248, 113, 113, 0.28)' : 'rgba(248, 113, 113, 0.15)'}"
                      stroke="${isSel ? '#f87171' : 'rgba(248, 113, 113, 0.4)'}" stroke-width="0.8" />
                    <text x="${midX}" y="${badgeY + 15}" fill="#fca5a5" font-size="13.5" font-weight="700" text-anchor="middle">
                      ${formatFactorShort(df, false)}
                    </text>
                  </g>
                `;
              }).join('')}

              ${upFactors.length === 0 && downFactors.length === 0 ? `
                <text x="${midX}" y="67" fill="#64748b" font-size="13.5" font-weight="600" text-anchor="middle">평운 (안정)</text>
              ` : ''}
            </g>

            <!-- 그래프 영역 세로 구분 점선 -->
            <line x1="${p.x}" y1="${padTop - 6}" x2="${p.x}" y2="${padTop + chartH + 6}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          `;
        }).join('')}
        
        <!-- 하단 X축 연도 라벨 및 베이스라인 -->
        <text x="${padLeft - 12}" y="${padTop + chartH + (isFullscreen ? 22 : 18)}" fill="#64748b" font-size="${isFullscreen ? 14.5 : 9.5}" font-weight="700" text-anchor="end">연도</text>
        <line x1="${padLeft}" y1="${padTop + chartH + 6}" x2="${width - padRight}" y2="${padTop + chartH + 6}" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        ${points.map(p => {
          const isPointPos = p.record.stepHeight >= 0;
          return `
            <text x="${p.x + stepW / 2}" y="${padTop + chartH + (isFullscreen ? 22 : 18)}"
              fill="${p.record.year === selectedYear ? (isPointPos ? '#38bdf8' : '#f87171') : '#94a3b8'}"
              font-size="${isFullscreen ? 14.5 : 11}" font-weight="${p.record.year === selectedYear ? '800' : '600'}" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="middle">${p.record.year}년</text>
          `;
        }).join('')}
      `}

      <!-- 1. 1년 단위 기운 볼륨 바 (0점 기준 상하 기둥, 음수 시 붉은색 계열 완벽 적용) -->
      <g class="sewoon-year-bars">
        ${points.map(p => {
          const boxW = isZoom ? stepW : Math.max(2, chartW / 100);
          const barH = Math.abs(p.y - zeroY);
          const barY = Math.min(p.y, zeroY);
          const isPos = p.record.stepHeight >= 0;
          const isSel = p.record.year === selectedYear;
          const barColor = isSel
            ? (isPos ? 'rgba(56, 189, 248, 0.55)' : 'rgba(248, 113, 113, 0.55)')
            : (isPos ? 'rgba(56, 189, 248, 0.16)' : 'rgba(248, 113, 113, 0.14)');
          return `
            <rect x="${p.x + (boxW > 6 ? 1 : 0.5)}" y="${barY}" width="${Math.max(1.5, boxW - (boxW > 6 ? 2 : 1))}" height="${Math.max(1, barH)}"
              fill="${barColor}"
              rx="${boxW > 8 ? 2 : 0}" />
          `;
        }).join('')}
      </g>

      <!-- [선택 지점 정중앙 중심선] 양수 시 푸른색(#38bdf8), 음수 시 붉은색(#f87171) 명확한 시각화 -->
      ${(() => {
        const isSelPos = selectedPoint.record.stepHeight >= 0;
        const selLineColor = isSelPos ? '#38bdf8' : '#f87171';
        return `
          <line x1="${selMidX}" y1="${padTop}" x2="${selMidX}" y2="${padTop + chartH}" stroke="${selLineColor}" stroke-width="1.5" stroke-dasharray="3,3" />
        `;
      })()}

      <!-- 2. 단색 정갈한 1.8px 스텝 파동 선 (1년 단위 세운 오르내림 궤적) -->
      <path d="${stepD}" fill="none" stroke="#e2e8f0" stroke-width="${isZoom ? 2 : 1.5}" stroke-linecap="square" stroke-linejoin="miter" />

      <!-- 3. 1년 단위 데이터 포인트 점 (음수 시 붉은색, 양수 시 푸른색으로 점수 색상 일치) -->
      <g class="sewoon-year-points">
        ${points.map(p => {
          const boxW = isZoom ? stepW : Math.max(2, chartW / 100);
          const midX = p.x + boxW / 2;
          const isSel = p.record.year === selectedYear;
          const isPos = p.record.stepHeight >= 0;
          const r = isSel ? (isZoom ? 7.5 : 4.5) : (isZoom ? 5.5 : 1.8);
          const pointFill = isSel
            ? (isPos ? '#38bdf8' : '#f87171')
            : (isPos ? '#93c5fd' : '#fca5a5');
          return `
            <circle cx="${midX}" cy="${p.y}" r="${r}"
              fill="${pointFill}"
              stroke="#0f172a"
              stroke-width="${isZoom ? 2 : (isSel ? 2 : 0)}" />
          `;
        }).join('')}
      </g>

      <!-- 4. 10년 줌인 모드: 호버 및 클릭(선택) 시에만 해당 60점 라인에 점수 뱃지 노출 (세련된 Space Grotesk 디스플레이 폰트 적용) -->
      ${isZoom ? `
        <g class="sewoon-interactive-scores">
          ${points.map(p => {
            const midX = p.x + stepW / 2;
            const isSel = p.record.year === selectedYear;
            const isPos = p.record.stepHeight >= 0;
            const scoreBtnY = isPos ? yMinus60 : yPlus60;
            const scoreObj = toConvertedLifeScore(p.record.stepHeight);
            const scoreColor = isPos ? '#38bdf8' : '#f87171';

            return `
              <g class="sewoon-col-group ${isSel ? 'is-active-year' : ''}">
                <!-- 연도별 전면 투명 히트박스 -->
                <rect class="sewoon-hitbox btn-select-sewoon-year" data-year="${p.record.year}" data-age="${p.record.age}"
                  x="${p.x}" y="${padTop}" width="${stepW}" height="${chartH}"
                  fill="${isSel ? (isPos ? 'rgba(56, 189, 248, 0.12)' : 'rgba(248, 113, 113, 0.12)') : 'transparent'}"
                  style="cursor: pointer;">
                  <title>${p.record.year}년 (${p.record.ganji}): ${scoreObj.text}</title>
                </rect>

                <!-- 60점 라인 점수 뱃지: 음수는 확실한 붉은색 테두리/글자, 양수는 푸른색 표기 -->
                <g transform="translate(${midX}, ${scoreBtnY})" class="sewoon-hover-score ${isSel ? 'is-selected' : ''}" style="pointer-events: none;">
                  <rect x="${isFullscreen ? -33 : -28}" y="${isFullscreen ? -13 : -11}" width="${isFullscreen ? 66 : 56}" height="${isFullscreen ? 26 : 22}" rx="5"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke="${scoreColor}"
                    stroke-width="${isSel ? 2 : 1.2}"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
                  <text x="0" y="${isFullscreen ? 5 : 4}"
                    fill="${scoreColor}"
                    font-size="${isFullscreen ? 14.5 : 11.5}" font-weight="800" text-anchor="middle" font-family="var(--font-display, 'Space Grotesk', sans-serif)" letter-spacing="0.2px">
                    ${scoreObj.text}
                  </text>
                </g>
              </g>
            `;
          }).join('')}
        </g>
      ` : ''}

      <!-- 5. 백년운세 모드: 선택된 연도 60점 라인 점수 뱃지 (음수 시 붉은색 #f87171, 양수 시 푸른색 #38bdf8) -->
      ${!isZoom ? `
        ${(() => {
          const isPos = selectedPoint.record.stepHeight >= 0;
          const scoreY = isPos ? yMinus60 : yPlus60;
          const scoreObj = toConvertedLifeScore(selectedPoint.record.stepHeight);
          const badgeX = Math.max(padLeft + 32, Math.min(width - padRight - 32, selMidX));
          const scoreColor = isPos ? '#38bdf8' : '#f87171';
          return `
            <g transform="translate(${badgeX}, ${scoreY})" style="pointer-events: none;">
              <rect x="${isFullscreen ? -36 : -30}" y="${isFullscreen ? -14 : -12}" width="${isFullscreen ? 72 : 60}" height="${isFullscreen ? 28 : 24}" rx="6"
                fill="#0b0f19"
                stroke="${scoreColor}"
                stroke-width="1.8"
                filter="drop-shadow(0 2px 6px rgba(0,0,0,0.6))" />
              <text x="0" y="${isFullscreen ? 5.5 : 4.5}" fill="${scoreColor}" font-size="${isFullscreen ? 14.5 : 12}" font-weight="800" text-anchor="middle" font-family="var(--font-display, 'Space Grotesk', sans-serif)" letter-spacing="0.2px">
                ${scoreObj.text}
              </text>
            </g>
          `;
        })()}

        <!-- 백년운세 모드 각 연도별 투명 인터랙션 히트박스 (클릭 시 선택 연도 변경) -->
        ${points.map(p => {
          const isSel = p.record.year === selectedYear;
          const boxW = Math.max(2, chartW / 100);
          return `
            <rect class="btn-select-sewoon-year" data-year="${p.record.year}" data-age="${p.record.age}"
              x="${p.x}" y="${padTop}" width="${boxW}" height="${chartH}"
              fill="${isSel ? 'rgba(56, 189, 248, 0.2)' : 'transparent'}"
              style="cursor: pointer;">
              <title>${p.record.year}년 (${p.record.ganji}년 · ${p.record.age}세): ${toConvertedLifeScore(p.record.stepHeight).text}</title>
            </rect>
          `;
        }).join('')}
      ` : ''}

    </svg>
  </div>
  `;
}


/**
 * 선택된 연도(세운)의 명리 상승/하강 원인 요인 정밀 인스펙터 카드 렌더링
 */
function renderSewoonFactorInspector(wh: CanonicalLifeDataWarehouse): string {
  const sewoonRecords = wh.sewoonLayer.records;
  if (!sewoonRecords || sewoonRecords.length === 0) return '';

  const currentYear = new Date().getFullYear();
  const curSewoon = sewoonRecords.find(s => s.year === (selectedYear || currentYear)) || sewoonRecords[0];

  const downCount = curSewoon.downwardFactors ? curSewoon.downwardFactors.length : 0;
  const upCount = curSewoon.upwardFactors ? curSewoon.upwardFactors.length : 0;
  const heightColor = curSewoon.stepHeight > 0 ? '#e2e8f0' : curSewoon.stepHeight < 0 ? '#cbd5e1' : '#94a3b8';

  const dwRecord = wh.daewoonLayer.records.find(d => d.order === curSewoon.daewoonOrder);
  const daewoonGanji = dwRecord ? dwRecord.ganji : '';

  const upSum = curSewoon.upwardFactors ? curSewoon.upwardFactors.reduce((a, b) => a + b.weight, 0) : 0;
  const downSum = curSewoon.downwardFactors ? curSewoon.downwardFactors.reduce((a, b) => a + b.weight, 0) : 0;
  const net = upSum + downSum;
  const isPos = curSewoon.stepHeight >= 0;

  // [신규 L1/L2 구조화 데이터 패킷 연동]
  const evidencePacket = buildEvidencePacket(wh, { wolwoonYears: [curSewoon.year] });
  const sewoonNode = evidencePacket.timeline.sewoon.find(s => s.year === curSewoon.year);
  const sewoonFactors = evidencePacket.evidence.filter(e => e.scope.type === 'sewoon' && e.scope.year === curSewoon.year);
  const domainSignals = sewoonNode?.domainSignals || [];

  return `
  <div style="margin-top: 1rem; background: #0f172a; border: 1.5px solid ${isPos ? 'rgba(56, 189, 248, 0.3)' : 'rgba(248, 113, 113, 0.3)'}; border-radius: 10px; padding: 1.15rem;">
    <!-- 인스펙터 상단 헤더 -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.65rem; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 18px; color: ${isPos ? '#38bdf8' : '#f87171'};">manage_search</span>
        <span style="font-size: 0.88rem; font-weight: 800; color: #fff;">
          세운 인과 요인: ${curSewoon.year}년 (${curSewoon.age}세·<span style="font-family: var(--font-serif, 'Noto Serif KR', serif); font-size: 0.95rem;">${curSewoon.ganji}</span>)
        </span>
        ${curSewoon.isCurrentYear ? '<span style="font-size: 0.65rem; background: #334155; color: #f8fafc; border: 1px solid #64748b; font-weight: 800; padding: 0.1rem 0.35rem; border-radius: 3px;">올해</span>' : ''}
        <span style="font-size: 0.7rem; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 700;">L1/L2 구조화 창고 팩트 연동</span>
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.76rem;">
        <span style="color: #94a3b8;">
          소속: <strong style="color: #e2e8f0;">제${curSewoon.daewoonOrder}대운(<span style="font-family: var(--font-serif, 'Noto Serif KR', serif); font-size: 0.85rem;">${daewoonGanji}</span>)</strong>
        </span>
        <span style="color: #94a3b8;">
          12운성: <strong style="color: #e2e8f0;">${curSewoon.twelveStage}</strong>
        </span>
        <span style="background: rgba(0,0,0,0.4); padding: 0.2rem 0.55rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px;">
          환산 점수: <strong style="color: ${isPos ? '#38bdf8' : '#fca5a5'}; font-size: 0.88rem;">${toConvertedLifeScore(curSewoon.stepHeight).text}</strong>
        </span>
      </div>
    </div>

    <!-- [신규 L2 시각화] 1. 9대 생활 영역 신호등 (Domain Matrix) 배너 -->
    <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 0.65rem 0.85rem; margin-bottom: 0.85rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem;">
        <span style="font-size: 0.78rem; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 0.3rem;">
          <span class="material-symbols-outlined" style="font-size: 15px; color: #38bdf8;">hub</span>
          [L2 영역 매트릭스] ${curSewoon.year}년 생활 영역별 기운 영향도 (사주 비전문가용 신호등)
        </span>
        <span style="font-size: 0.68rem; color: #94a3b8;">구조화 데이터가 자동으로 분류한 9대 생활 영역</span>
      </div>
      
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${domainSignals.map((ds: DomainSignal) => {
          const domLabel = DOMAIN_GLOSSARY[ds.domain] || ds.domain;
          const isNetPos = ds.net > 0;
          const isNetNeg = ds.net < 0;
          const badgeBg = isNetPos ? 'rgba(56, 189, 248, 0.12)' : isNetNeg ? 'rgba(248, 113, 113, 0.12)' : 'rgba(255, 255, 255, 0.05)';
          const badgeBorder = isNetPos ? 'rgba(56, 189, 248, 0.35)' : isNetNeg ? 'rgba(248, 113, 113, 0.35)' : 'rgba(255, 255, 255, 0.1)';
          const badgeColor = isNetPos ? '#38bdf8' : isNetNeg ? '#fca5a5' : '#cbd5e1';
          return `
            <div style="background: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 6px; padding: 0.3rem 0.55rem; font-size: 0.73rem; display: flex; align-items: center; gap: 0.35rem;">
              <span style="font-weight: 700; color: ${badgeColor};">${domLabel}</span>
              <span style="font-family: var(--font-display, 'Space Grotesk', sans-serif); font-size: 0.76rem; font-weight: 800; color: #fff;">
                ${ds.net > 0 ? '+' + ds.net : ds.net}점
              </span>
              <span style="font-size: 0.65rem; color: #94a3b8;">(${ds.evidenceIds.length}건)</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- [판별 산식 표준 공식 배너] 누락 없는 객관적 검증 공식 -->
    <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; padding: 0.55rem 0.95rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; font-size: 0.8rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">calculate</span>
        <strong style="color: #e2e8f0;">판별 공식:</strong>
        <span style="color: #38bdf8; font-weight: 700; font-family: var(--font-display, 'Space Grotesk', sans-serif);">상승 총점 (+${upSum}점)</span>
        <span style="color: #64748b;">+</span>
        <span style="color: #fca5a5; font-weight: 700; font-family: var(--font-display, 'Space Grotesk', sans-serif);">하강 총점 (${downSum}점)</span>
        <span style="color: #64748b;">=</span>
        <span style="color: #ffffff; font-weight: 800; background: rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 4px; font-family: var(--font-display, 'Space Grotesk', sans-serif);">
          순수 가중치 ${net > 0 ? '+' + net : net}점
        </span>
      </div>
      <div style="font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px; font-size: 0.88rem; font-weight: 800; color: ${isPos ? '#38bdf8' : '#fca5a5'};">
        ➔ 최종 판별: ${toConvertedLifeScore(curSewoon.stepHeight).text} (${isPos ? '상승세' : '하강세'})
      </div>
    </div>

    <!-- 하강 요인 vs 상승 요인 2단 그리드 -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0.85rem;">
      
      <!-- 1. 하강 요인 (L1 지장간 기전 및 궁위 세부 팩트 포함) -->
      <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px; color: #94a3b8;">trending_down</span>
            하강 요인 (${downCount})
          </span>
          <span style="font-size: 0.68rem; color: #fca5a5;">* L1 궁위·지장간 충돌 기전 연동</span>
        </div>

        ${downCount === 0 ? `
          <div style="font-size: 0.74rem; color: #64748b; padding: 0.4rem; text-align: center; background: rgba(0,0,0,0.15); border-radius: 6px;">
            하강 요인 없음
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${curSewoon.downwardFactors.map(f => {
              const weightText = f.weight < 0 ? `${f.weight}점` : `-${f.weight}점`;
              const matchedL1 = sewoonFactors.find(e => e.legacyLabel.includes(f.name) || f.name.includes(e.key));
              const palaceInfo = matchedL1?.palace ? PALACE_GLOSSARY[matchedL1.palace] : null;
              const hiddenInteractions = matchedL1?.hiddenStemInteractions || [];
              const domainTags = matchedL1?.domains.map(d => DOMAIN_GLOSSARY[d] || d).join(', ') || '';

              return `
                <details class="factor-accordion-item" style="background: rgba(0,0,0,0.28); border: 1px solid rgba(248,113,113,0.18); border-radius: 6px; overflow: hidden; transition: all 0.2s ease;">
                  <summary style="display: flex; justify-content: space-between; align-items: center; padding: 0.48rem 0.65rem; cursor: pointer; user-select: none; list-style: none;">
                    <div style="display: flex; align-items: center; gap: 0.45rem;">
                      <span class="btn-open-factor-wiki" data-factor="${f.name}" style="background: rgba(248,113,113,0.15); color: #fca5a5; font-size: 0.65rem; padding: 0.08rem 0.35rem; border-radius: 3px; font-weight: 700; cursor: pointer;" title="${f.name} 위키 보기">${f.category}</span>
                      <span class="btn-open-factor-wiki" data-factor="${f.name}" style="font-size: 0.78rem; font-weight: 800; color: #f8fafc; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;" title="${f.name} 위키 보기">${f.name}</span>
                      ${matchedL1 ? `<span style="font-size: 0.63rem; color: #94a3b8; font-family: monospace; background: rgba(255,255,255,0.06); padding: 0.05rem 0.3rem; border-radius: 2px;">[${matchedL1.id}]</span>` : ''}
                      <button type="button" class="btn-open-factor-wiki" data-factor="${f.name}" style="background: rgba(248,113,113,0.18); border: 1px solid rgba(248,113,113,0.35); color: #fca5a5; font-size: 0.63rem; font-weight: 800; padding: 0.08rem 0.35rem; border-radius: 3px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.15rem;" title="${f.name} 명리 지식 백과 팝업">
                        <span class="material-symbols-outlined" style="font-size: 12px;">menu_book</span>위키
                      </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                      <span style="font-size: 0.74rem; font-weight: 800; color: #fca5a5; font-family: var(--font-display, 'Space Grotesk', sans-serif); white-space: nowrap;">
                        ${weightText}
                      </span>
                      <span class="material-symbols-outlined" style="font-size: 15px; color: #94a3b8;">expand_more</span>
                    </div>
                  </summary>
                  <div style="padding: 0.55rem 0.75rem 0.65rem; font-size: 0.73rem; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); line-height: 1.55;">
                    <!-- [신규 L1 명리 팩트 뱃지] -->
                    <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.45rem;">
                      ${palaceInfo ? `<span style="background: rgba(248,113,113,0.15); color: #fca5a5; border: 1px solid rgba(248,113,113,0.3); padding: 0.1rem 0.4rem; border-radius: 3px;">영향 궁위: <strong>${palaceInfo.label}</strong></span>` : ''}
                      ${domainTags ? `<span style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 3px;">생활 영역: <strong>${domainTags}</strong></span>` : ''}
                    </div>

                    ${hiddenInteractions.length > 0 ? `
                      <div style="background: rgba(0,0,0,0.3); border-radius: 4px; padding: 0.35rem 0.5rem; margin-bottom: 0.4rem; border-left: 2px solid #f87171;">
                        <strong style="color: #fca5a5;">지장간 미세 충돌 기전:</strong>
                        ${hiddenInteractions.map(hi => `<span style="color: #fff; margin-left: 0.3rem;">${hi.incoming} ↔ ${hi.natal} (${hi.type === 'STEM_CHUNG' ? '천간충' : '암합'})</span>`).join(', ')}
                      </div>
                    ` : ''}

                    <div style="font-weight: 700; color: #fca5a5; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.3rem;">
                      <span class="material-symbols-outlined" style="font-size: 14px;">info</span>
                      명리 인과 작용 및 대처 가이드
                    </div>
                    <div>${f.description || '원국과 대운·세운 지지 간의 상충·형해 작용으로, 감정적 마찰이나 환경 변화 시 신중한 처세가 권장되는 구간입니다.'}</div>
                  </div>
                </details>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- 2. 상승 요인 -->
      <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px; color: #94a3b8;">trending_up</span>
            상승 요인 (${upCount})
          </span>
          <span style="font-size: 0.7rem; color: #64748b;">* 항목 클릭 시 위키 팝업 연동</span>
        </div>

        ${upCount === 0 ? `
          <div style="font-size: 0.74rem; color: #64748b; padding: 0.4rem; text-align: center; background: rgba(0,0,0,0.15); border-radius: 6px;">
            상승 요인 없음
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${curSewoon.upwardFactors.map(f => {
              const weightText = f.weight > 0 ? `+${f.weight}점` : `${f.weight}점`;
              const matchedL1 = sewoonFactors.find(e => e.legacyLabel.includes(f.name) || f.name.includes(e.key));
              const palaceInfo = matchedL1?.palace ? PALACE_GLOSSARY[matchedL1.palace] : null;
              const domainTags = matchedL1?.domains.map(d => DOMAIN_GLOSSARY[d] || d).join(', ') || '';

              return `
                <details class="factor-accordion-item" style="background: rgba(0,0,0,0.28); border: 1px solid rgba(56,189,248,0.18); border-radius: 6px; overflow: hidden; transition: all 0.2s ease;">
                  <summary style="display: flex; justify-content: space-between; align-items: center; padding: 0.48rem 0.65rem; cursor: pointer; user-select: none; list-style: none;">
                    <div style="display: flex; align-items: center; gap: 0.45rem;">
                      <span class="btn-open-factor-wiki" data-factor="${f.name}" style="background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 0.65rem; padding: 0.08rem 0.35rem; border-radius: 3px; font-weight: 700; cursor: pointer;" title="${f.name} 위키 보기">${f.category}</span>
                      <span class="btn-open-factor-wiki" data-factor="${f.name}" style="font-size: 0.78rem; font-weight: 800; color: #f8fafc; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;" title="${f.name} 위키 보기">${f.name}</span>
                      ${matchedL1 ? `<span style="font-size: 0.63rem; color: #94a3b8; font-family: monospace; background: rgba(255,255,255,0.06); padding: 0.05rem 0.3rem; border-radius: 2px;">[${matchedL1.id}]</span>` : ''}
                      <button type="button" class="btn-open-factor-wiki" data-factor="${f.name}" style="background: rgba(56,189,248,0.18); border: 1px solid rgba(56,189,248,0.35); color: #38bdf8; font-size: 0.63rem; font-weight: 800; padding: 0.08rem 0.35rem; border-radius: 3px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.15rem;" title="${f.name} 명리 지식 백과 팝업">
                        <span class="material-symbols-outlined" style="font-size: 12px;">menu_book</span>위키
                      </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                      <span style="font-size: 0.74rem; font-weight: 800; color: #38bdf8; font-family: var(--font-display, 'Space Grotesk', sans-serif); white-space: nowrap;">
                        ${weightText}
                      </span>
                      <span class="material-symbols-outlined" style="font-size: 15px; color: #94a3b8;">expand_more</span>
                    </div>
                  </summary>
                  <div style="padding: 0.55rem 0.75rem 0.65rem; font-size: 0.73rem; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); line-height: 1.55;">
                    <!-- [신규 L1 명리 팩트 뱃지] -->
                    <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.45rem;">
                      ${palaceInfo ? `<span style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 0.1rem 0.4rem; border-radius: 3px;">영향 궁위: <strong>${palaceInfo.label}</strong></span>` : ''}
                      ${domainTags ? `<span style="background: rgba(255,255,255,0.06); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 3px;">생활 영역: <strong>${domainTags}</strong></span>` : ''}
                    </div>

                    <div style="font-weight: 700; color: #38bdf8; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.3rem;">
                      <span class="material-symbols-outlined" style="font-size: 14px;">insights</span>
                      명리 인과 작용 및 기회 활용 가이드
                    </div>
                    <div>${f.description || '원국과 시간축의 기운이 조화롭게 호응하여 자립심, 추진력, 역량 발휘에 최적화된 기회 구간입니다.'}</div>
                  </div>
                </details>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  </div>
  `;
}

/**
 * 선택된 월(월운)의 명리 상승/하강 원인 요인 정밀 인스펙터 카드 렌더링
 * - 경오월 사례처럼 상승 기운(+18)과 하강 기운(-42)이 복합 작용할 때 누락률 0%로 모든 인과 요인과 계산 공식을 전수 나열
 */
function renderMonthWoonFactorInspector(wh: CanonicalLifeDataWarehouse, targetYear: number, monthNum: number): string {
  const months = calculate12MonthsWoon(wh, targetYear);
  const curMonth = months.find(m => m.month === monthNum) || months[4] || months[0]; // 기본 5월(경오월)

  const downCount = curMonth.downwardFactors ? curMonth.downwardFactors.length : 0;
  const upCount = curMonth.upwardFactors ? curMonth.upwardFactors.length : 0;
  const isPos = curMonth.stepHeight >= 0;

  return `
  <div style="margin-top: 1rem; background: #0f172a; border: 1.5px solid ${isPos ? 'rgba(56, 189, 248, 0.3)' : 'rgba(248, 113, 113, 0.3)'}; border-radius: 10px; padding: 1.15rem;">
    <!-- 인스펙터 상단 헤더 -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.65rem; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="material-symbols-outlined" style="font-size: 18px; color: ${isPos ? '#38bdf8' : '#f87171'};">fact_check</span>
        <span style="font-size: 0.88rem; font-weight: 800; color: #fff;">
          월운 인과 요인: ${targetYear}년 ${curMonth.month}월 (${curMonth.solarTerm} · <span style="font-family: var(--font-serif, 'Noto Serif KR', serif); font-size: 0.95rem;">${curMonth.ganji}</span>월)
        </span>
        <span style="font-size: 0.68rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 3px;">
          선택된 월운
        </span>
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.76rem;">
        <span style="color: #94a3b8;">
          12운성: <strong style="color: #e2e8f0;">${curMonth.twelveStage}</strong>
        </span>
        <span style="background: rgba(0,0,0,0.4); padding: 0.2rem 0.55rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px;">
          최종 환산 점수: <strong style="color: ${isPos ? '#38bdf8' : '#fca5a5'}; font-size: 0.84rem;">${toConvertedLifeScore(curMonth.stepHeight).text}</strong>
        </span>
      </div>
    </div>

    <!-- [판별 산식 표준 공식 배너] 경오(5월) 등의 복합 요인을 한눈에 규명하는 투명 산식 배너 -->
    <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; padding: 0.55rem 0.95rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; font-size: 0.8rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">calculate</span>
        <strong style="color: #e2e8f0;">월운 판별 공식:</strong>
        <span style="color: #38bdf8; font-weight: 700;">상승 총점 (+${curMonth.upSum}점)</span>
        <span style="color: #64748b;">+</span>
        <span style="color: #fca5a5; font-weight: 700;">하강 총점 (${curMonth.downSum}점)</span>
        <span style="color: #64748b;">=</span>
        <span style="color: #ffffff; font-weight: 800; background: rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 4px;">
          순수 가중치 ${curMonth.netWeight > 0 ? '+' + curMonth.netWeight : curMonth.netWeight}점
        </span>
      </div>
      <div style="font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px; font-size: 0.86rem; font-weight: 800; color: ${isPos ? '#38bdf8' : '#fca5a5'};">
        ➔ 최종 판별: ${toConvertedLifeScore(curMonth.stepHeight).text} (${isPos ? '상승 기운' : '하강/주의 기운'})
      </div>
    </div>

    <!-- 하강 요인 vs 상승 요인 2단 그리드 (누락률 0% 전수 나열) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0.85rem;">
      
      <!-- 1. 하강 요인 (오축해, 오축원진, 오 공망 등) -->
      <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px; color: #f87171;">trending_down</span>
            하강 및 상충마살 요인 (${downCount})
          </span>
          <span style="font-size: 0.72rem; color: #fca5a5; font-weight: 700; font-family: var(--font-display, 'Space Grotesk', sans-serif);">합계: ${curMonth.downSum}점</span>
        </div>

        ${downCount === 0 ? `
          <div style="font-size: 0.74rem; color: #64748b; padding: 0.4rem; text-align: center; background: rgba(0,0,0,0.15); border-radius: 6px;">
            하강 요인 없음 (안정)
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${curMonth.downwardFactors.map(f => {
              let insight = '시간축의 기운이 원국과 상호작용하여 신중한 처세와 감정 조절이 요구되는 시기입니다.';
              if (f.category === '충') insight = '원국과의 정면 충돌 기운으로 급격한 변동이나 긴장이 수반될 수 있으니 완충 전략이 필요합니다.';
              else if (f.category === '해') insight = '보이지 않는 은밀한 마찰과 의사소통 오해가 생기기 쉬우므로 계약과 언행에 각별히 유의해야 합니다.';
              else if (f.category === '원진') insight = '사소한 일로 원망과 감정적 왜곡이 생기기 쉬운 시기입니다. 섣부른 오해를 경계하고 차분한 소통이 필수적입니다.';
              else if (f.category === '공망') insight = '해당 지지의 에너지가 일시적으로 공허해져 실속이 줄어들 수 있으니, 무리한 확장보다 내실 다지기에 집중하세요.';
              else if (f.category === '기신') insight = '사주의 균형을 깨뜨리는 기운이 중첩되어 피로도나 압박감이 높아질 수 있으므로 리스크 관리가 필요합니다.';
              else if (f.category === '12운성') insight = '기운이 쇠퇴하거나 묘지에 드는 구간으로, 무리한 활동보다는 재충전과 내실 수양이 적합합니다.';

              return `
                <details class="factor-accordion-item" style="background: rgba(0,0,0,0.28); border: 1px solid rgba(248,113,113,0.18); border-radius: 6px; overflow: hidden; transition: all 0.2s ease;">
                  <summary style="display: flex; justify-content: space-between; align-items: center; padding: 0.48rem 0.65rem; cursor: pointer; user-select: none; list-style: none;">
                    <div style="display: flex; align-items: center; gap: 0.45rem;">
                      <span style="background: rgba(248,113,113,0.15); color: #fca5a5; font-size: 0.65rem; padding: 0.08rem 0.35rem; border-radius: 3px; font-weight: 700;">${f.category}</span>
                      <span style="font-size: 0.78rem; font-weight: 800; color: #f8fafc;">${f.name}</span>
                      <span style="font-size: 0.68rem; color: #94a3b8; display: flex; align-items: center; gap: 0.15rem;">
                        (상세 해설 <span class="material-symbols-outlined" style="font-size: 14px;">expand_more</span>)
                      </span>
                    </div>
                    <span style="font-size: 0.74rem; font-weight: 800; color: #fca5a5; font-family: var(--font-display, 'Space Grotesk', sans-serif); white-space: nowrap;">
                      ${f.weight}점
                    </span>
                  </summary>
                  <div style="padding: 0.55rem 0.75rem 0.65rem; font-size: 0.73rem; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); line-height: 1.55;">
                    <div style="font-weight: 700; color: #fca5a5; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.3rem;">
                      <span class="material-symbols-outlined" style="font-size: 14px;">info</span>
                      월운 명리 인과 작용 및 대처 가이드
                    </div>
                    <div>${insight}</div>
                  </div>
                </details>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- 2. 상승 요인 (건록 등) -->
      <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1; display: flex; align-items: center; gap: 0.3rem;">
            <span class="material-symbols-outlined" style="font-size: 15px; color: #38bdf8;">trending_up</span>
            상승 및 기회 요인 (${upCount})
          </span>
          <span style="font-size: 0.7rem; color: #64748b;">* 클릭 시 상세 해설 펼침</span>
        </div>

        ${upCount === 0 ? `
          <div style="font-size: 0.74rem; color: #64748b; padding: 0.4rem; text-align: center; background: rgba(0,0,0,0.15); border-radius: 6px;">
            상승 요인 없음
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${curMonth.upwardFactors.map(f => {
              let insight = '원국과 시간축의 기운이 호응하여 실질적 성취와 활력이 고양되는 상승 기운입니다.';
              if (f.category === '12운성') insight = '일간의 순환 에너지인 건록·제왕·장생의 도래로 본인의 주도력과 체력, 추진력이 최상으로 분출되는 시기입니다.';
              else if (f.category === '용신') insight = '사주의 조후와 억부를 최적화하는 주용신 유입으로 귀인의 도움, 재물 및 명예 성취가 크게 기대됩니다.';
              else if (f.category === '희신') insight = '일간과 용신을 부드럽게 생조하는 희신 기운으로 안정적이고 원활한 대인관계와 결실이 따릅니다.';

              return `
                <details class="factor-accordion-item" style="background: rgba(0,0,0,0.28); border: 1px solid rgba(56,189,248,0.18); border-radius: 6px; overflow: hidden; transition: all 0.2s ease;">
                  <summary style="display: flex; justify-content: space-between; align-items: center; padding: 0.48rem 0.65rem; cursor: pointer; user-select: none; list-style: none;">
                    <div style="display: flex; align-items: center; gap: 0.45rem;">
                      <span style="background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 0.65rem; padding: 0.08rem 0.35rem; border-radius: 3px; font-weight: 700;">${f.category}</span>
                      <span style="font-size: 0.78rem; font-weight: 800; color: #f8fafc;">${f.name}</span>
                      <span style="font-size: 0.68rem; color: #94a3b8; display: flex; align-items: center; gap: 0.15rem;">
                        (상세 해설 <span class="material-symbols-outlined" style="font-size: 14px;">expand_more</span>)
                      </span>
                    </div>
                    <span style="font-size: 0.74rem; font-weight: 800; color: #38bdf8; font-family: var(--font-display, 'Space Grotesk', sans-serif); white-space: nowrap;">
                      +${f.weight}점
                    </span>
                  </summary>
                  <div style="padding: 0.55rem 0.75rem 0.65rem; font-size: 0.73rem; color: #cbd5e1; border-top: 1px dashed rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); line-height: 1.55;">
                    <div style="font-weight: 700; color: #38bdf8; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.3rem;">
                      <span class="material-symbols-outlined" style="font-size: 14px;">insights</span>
                      월운 명리 인과 작용 및 기회 활용 가이드
                    </div>
                    <div>${insight}</div>
                  </div>
                </details>
              `;
            }).join('')}
          </div>
        `}
      </div>

    </div>
  </div>
  `;
}

/**
 * [요구사항 7번 구현] 선택된 연도의 12개월(월운) 주기표 SVG 및 정밀 매트릭스 렌더링
 * - 12개 스텝(1월~12월)
 * - 0점 기준선
 * - 마이너스 월은 +60점 라인에 점수 표기, 플러스 월은 -60점 라인에 점수 표기 (요구사항 4번과 동일 구조)
 * - 0점 기준 위쪽 칸에 + 플러스 요소(호재), 아래쪽 칸에 - 마이너스 요소(상충마살)
 * - 복수 요인 시 '외 N건' 카운트 명시 및 툴팁/인스펙터 연동으로 데이터 누락률 0% 보장
 */
export function render12MonthsCycleView(wh: CanonicalLifeDataWarehouse, targetYear: number, isFullscreen: boolean = false): string {
  const months = calculate12MonthsWoon(wh, targetYear);
  if (!months || months.length === 0) return '';

  const curSelectedMonth = selectedMonth || 5; // 기본 5월(경오월) 선택

  // [대시보드 vs 전체화면 최적화]
  const width = isFullscreen ? 1600 : 1100;
  const height = isFullscreen ? 580 : 250;
  const padLeft = isFullscreen ? 70 : 55;
  const padRight = isFullscreen ? 50 : 35;
  const padTop = isFullscreen ? 190 : 50;
  const padBottom = isFullscreen ? 36 : 28;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const minY = -80;
  const maxY = 80;

  const stepW = chartW / 12;

  // 좌표 계산
  const points = months.map((m, idx) => {
    const x = padLeft + idx * stepW;
    const clampedH = Math.max(minY, Math.min(maxY, m.stepHeight));
    const normalizedH = (clampedH - minY) / (maxY - minY);
    const y = padTop + chartH * (1 - normalizedH);
    return { x, y, record: m };
  });

  // 스텝 경로
  let stepD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    stepD += ` H ${curr.x} V ${curr.y}`;
  }
  stepD += ` H ${points[points.length - 1].x + stepW}`;

  // +60 / 0 / -60 기준선 Y좌표
  const yPlus60 = padTop + chartH * (1 - (60 - minY) / (maxY - minY));
  const zeroY = padTop + chartH * (1 - (0 - minY) / (maxY - minY));
  const yMinus60 = padTop + chartH * (1 - (-60 - minY) / (maxY - minY));

  const formatFactorShort = (f: { name: string; weight: number }, isUp: boolean): string => {
    let name = f.name || '';
    name = name.replace(/\(帝旺\)|\(長生\)|\(建祿\)|\(死\)|\(墓\)|\(絶\)|\(空亡\)/g, '');
    name = name.replace(/일지\s*/g, '');
    name = name.replace(/월운\s*/g, '');
    name = name.trim();
    if (name.length > 7) {
      name = name.substring(0, 7);
    }
    const weightStr = f.weight > 0 ? `+${f.weight}` : `${f.weight}`;
    return `${name} (${weightStr})`;
  };

  const selMidX = padLeft + ((curSelectedMonth - 1) * stepW) + stepW / 2;
  const wrapperH = isFullscreen ? '100%' : '250px';

  return `
  <div class="life-chart-canvas-wrapper" style="width: 100%; height: ${wrapperH}; min-height: ${wrapperH}; max-height: ${wrapperH}; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(15, 23, 42, 0.4); border-radius: 12px; padding: 0.25rem; position: relative; box-sizing: border-box; overflow: hidden;">
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%; display: block; margin: 0 auto; font-family: var(--font-sans, 'Noto Sans KR', sans-serif); user-select: none;">
      
      <style>
        .month-header-box:hover { stroke: #38bdf8 !important; }
        .month-hover-score { opacity: 0; transition: opacity 0.15s ease, transform 0.15s ease; }
        .month-hover-score.is-selected { opacity: 1 !important; }
        .month-col-group:hover .month-hover-score { opacity: 1 !important; }
        .month-col-group:hover .month-hitbox { fill: rgba(56, 189, 248, 0.14) !important; }
        .btn-open-factor-wiki { transition: filter 0.15s ease, transform 0.15s ease; }
        .btn-open-factor-wiki:hover { filter: brightness(1.28); }
      </style>

      <!-- +60 / 0 / -60 대칭 볼륨 기준선 -->
      <line x1="${padLeft}" y1="${yPlus60}" x2="${width - padRight}" y2="${yPlus60}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="3,3" stroke-width="1" />
      <line x1="${padLeft}" y1="${zeroY}" x2="${width - padRight}" y2="${zeroY}" stroke="rgba(255,255,255,0.32)" stroke-width="1.4" />
      <line x1="${padLeft}" y1="${yMinus60}" x2="${width - padRight}" y2="${yMinus60}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="3,3" stroke-width="1" />

      <text x="${padLeft - 12}" y="${yPlus60 + 5}" fill="#38bdf8" font-size="${isFullscreen ? 14.5 : 11.5}" font-weight="700" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="end">+60</text>
      <text x="${padLeft - 12}" y="${zeroY + 5}" fill="#ffffff" font-size="${isFullscreen ? 14.5 : 12}" font-weight="800" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="end">0</text>
      <text x="${padLeft - 12}" y="${yMinus60 + 5}" fill="#fca5a5" font-size="${isFullscreen ? 14.5 : 11.5}" font-weight="700" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="end">-60</text>

      <!-- [일년세운 12개월 모드] 상단 헤더 박스 -->
      ${points.map((p, idx) => {
        const midX = p.x + stepW / 2;
        const isSel = p.record.month === curSelectedMonth;
        const upFactors = p.record.upwardFactors || [];
        const downFactors = p.record.downwardFactors || [];
        const headerBoxW = stepW - (isFullscreen ? 6 : 4);
        const badgeW = Math.max(48, Math.min(headerBoxW - 4, isFullscreen ? 126 : 75));

        const tooltip = `${targetYear}년 ${p.record.month}월 (${p.record.ganji} · ${p.record.solarTerm})\n` +
          `• 공식: ${p.record.formulaText}\n` +
          `• 상승 (${upFactors.length}건): ${upFactors.map(f => `${f.name}(+${f.weight})`).join(', ') || '없음'}\n` +
          `• 하강 (${downFactors.length}건): ${downFactors.map(f => `${f.name}(${f.weight})`).join(', ') || '없음'}`;

        const isPos = p.record.stepHeight >= 0;

        if (!isFullscreen) {
          // [대시보드 컴팩트 뷰]: 월건 간지 및 월/절기 2줄 헤더
          return `
            <g class="btn-select-month-woon-hdr" data-month="${p.record.month}" style="cursor: pointer;">
              <title>${tooltip}</title>
              <rect class="month-header-box" x="${p.x + 2}" y="5" width="${headerBoxW}" height="38" rx="5"
                fill="${isSel ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)'}"
                stroke="${isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}" stroke-width="${isSel ? '1.5' : '0.8'}" />
              <text x="${midX}" y="21.5" fill="${isSel ? '#38bdf8' : '#ffffff'}" font-size="13.5" font-weight="700" font-family="var(--font-serif, 'Noto Serif KR', serif)" text-anchor="middle">${p.record.ganji}</text>
              <text x="${midX}" y="35" fill="${isSel ? '#ffffff' : '#94a3b8'}" font-size="10" font-weight="700" text-anchor="middle">${p.record.month}월 (${p.record.solarTerm})</text>
            </g>
            <line x1="${p.x}" y1="${padTop - 6}" x2="${p.x}" y2="${padTop + chartH + 6}" stroke="${isSel ? (isPos ? 'rgba(56, 189, 248, 0.4)' : 'rgba(248, 113, 113, 0.4)') : 'rgba(255,255,255,0.08)'}" stroke-dasharray="2,2" stroke-width="${isSel ? '1.5' : '1'}" />
          `;
        }

        // [전체화면 대형 뷰]: 상단부(월운 선택)와 하단부(요인 뱃지 위키) 물리적 분리
        return `
          <!-- 1. [상단부] 월건 간지 및 월/절기 버튼 -->
          <g class="btn-select-month-woon-hdr" data-month="${p.record.month}" style="cursor: pointer;">
            <title>${tooltip}</title>
            <rect class="month-header-box" x="${p.x + 2}" y="2" width="${headerBoxW}" height="44" rx="6"
              fill="${isSel ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)'}"
              stroke="${isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}" stroke-width="${isSel ? '1.5' : '0.8'}" />
            <text x="${midX}" y="21" fill="${isSel ? '#38bdf8' : '#ffffff'}" font-size="16" font-weight="700" font-family="var(--font-serif, 'Noto Serif KR', serif)" text-anchor="middle">${p.record.ganji}</text>
            <text x="${midX}" y="38" fill="${isSel ? '#ffffff' : '#94a3b8'}" font-size="11.5" font-weight="700" text-anchor="middle">${p.record.month}월 (${p.record.solarTerm})</text>
          </g>

          <!-- 2. [하단부] 호재/악재 요인 뱃지 독립 영역 (클릭 시 위키 모달 및 상세 해설 연동) -->
          <g class="month-factors-area">
            <!-- 호재 요인 뱃지 -->
            ${upFactors.map((uf, uIdx) => {
              const badgeY = 48 + (uIdx * 23);
              return `
                <g class="btn-open-factor-wiki" data-factor="${uf.name}" style="cursor: pointer;">
                  <title>${uf.name} 명리 위키 백과 보기</title>
                  <rect x="${midX - badgeW / 2}" y="${badgeY}" width="${badgeW}" height="21" rx="4"
                    fill="${isSel ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.15)'}"
                    stroke="${isSel ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)'}" stroke-width="0.8" />
                  <text x="${midX}" y="${badgeY + 15}" fill="#38bdf8" font-size="13.5" font-weight="700" text-anchor="middle">
                    ${formatFactorShort(uf, true)}
                  </text>
                </g>
              `;
            }).join('')}

            <!-- 악재 요인 뱃지 -->
            ${downFactors.map((df, dIdx) => {
              const badgeY = 48 + (upFactors.length * 23) + (dIdx * 23);
              return `
                <g class="btn-open-factor-wiki" data-factor="${df.name}" style="cursor: pointer;">
                  <title>${df.name} 명리 위키 백과 보기</title>
                  <rect x="${midX - badgeW / 2}" y="${badgeY}" width="${badgeW}" height="21" rx="4"
                    fill="${isSel ? 'rgba(248, 113, 113, 0.28)' : 'rgba(248, 113, 113, 0.15)'}"
                    stroke="${isSel ? '#f87171' : 'rgba(248, 113, 113, 0.4)'}" stroke-width="0.8" />
                  <text x="${midX}" y="${badgeY + 15}" fill="#fca5a5" font-size="13.5" font-weight="700" text-anchor="middle">
                    ${formatFactorShort(df, false)}
                  </text>
                </g>
              `;
            }).join('')}

            ${upFactors.length === 0 && downFactors.length === 0 ? `
              <text x="${midX}" y="67" fill="#64748b" font-size="13.5" font-weight="600" text-anchor="middle">평운 (안정)</text>
            ` : ''}
          </g>

          <line x1="${p.x}" y1="${padTop - 6}" x2="${p.x}" y2="${padTop + chartH + 6}" stroke="${isSel ? (isPos ? 'rgba(56, 189, 248, 0.4)' : 'rgba(248, 113, 113, 0.4)') : 'rgba(255,255,255,0.08)'}" stroke-dasharray="2,2" stroke-width="${isSel ? '1.5' : '1'}" />
        `;
      }).join('')}

      <!-- 하단 X축 월 라벨 -->
      <text x="${padLeft - 12}" y="${padTop + chartH + (isFullscreen ? 22 : 18)}" fill="#64748b" font-size="${isFullscreen ? 14.5 : 11}" font-weight="700" text-anchor="end">월별</text>
      <line x1="${padLeft}" y1="${padTop + chartH + 6}" x2="${width - padRight}" y2="${padTop + chartH + 6}" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
      ${points.map(p => `
        <text x="${p.x + stepW / 2}" y="${padTop + chartH + (isFullscreen ? 22 : 18)}" fill="${p.record.month === curSelectedMonth ? (p.record.stepHeight >= 0 ? '#38bdf8' : '#f87171') : '#94a3b8'}" font-size="${isFullscreen ? 14.5 : 11.5}" font-weight="${p.record.month === curSelectedMonth ? '800' : '600'}" font-family="var(--font-display, 'Space Grotesk', sans-serif)" text-anchor="middle">${p.record.month}월</text>
      `).join('')}

      <!-- 1. 월운 기운 볼륨 바 (음수 시 붉은색, 양수 시 푸른색) -->
      <g class="month-bars">
        ${points.map(p => {
          const barH = Math.abs(p.y - zeroY);
          const barY = Math.min(p.y, zeroY);
          const isPos = p.record.stepHeight >= 0;
          const isSel = p.record.month === curSelectedMonth;
          return `
            <rect x="${p.x + 2}" y="${barY}" width="${Math.max(2, stepW - 4)}" height="${Math.max(1, barH)}"
              fill="${isSel ? (isPos ? 'rgba(56, 189, 248, 0.42)' : 'rgba(248, 113, 113, 0.42)') : isPos ? 'rgba(56, 189, 248, 0.18)' : 'rgba(248, 113, 113, 0.14)'}"
              rx="2" />
          `;
        }).join('')}
      </g>

      <!-- [요구사항 1번 구현] 선택된 월 중심 점선 (데이터 점 및 점수 뱃지 아래에 배치, 음수 시 붉은색 명확화) -->
      ${(() => {
        const selMonthRec = points.find(p => p.record.month === curSelectedMonth);
        const isSelPos = selMonthRec ? selMonthRec.record.stepHeight >= 0 : true;
        const selLineColor = isSelPos ? '#38bdf8' : '#f87171';
        return `<line x1="${selMidX}" y1="${padTop}" x2="${selMidX}" y2="${padTop + chartH}" stroke="${selLineColor}" stroke-width="1.5" stroke-dasharray="3,3" />`;
      })()}

      <!-- 2. 정밀 스텝 파동 선 -->
      <path d="${stepD}" fill="none" stroke="#e2e8f0" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" />

      <!-- 3. 월별 데이터 포인트 원 (음수 시 붉은색, 양수 시 푸른색) -->
      <g class="month-points">
        ${points.map(p => {
          const midX = p.x + stepW / 2;
          const isPos = p.record.stepHeight >= 0;
          const isSel = p.record.month === curSelectedMonth;
          const pointFill = isSel
            ? (isPos ? '#38bdf8' : '#f87171')
            : (isPos ? '#93c5fd' : '#fca5a5');
          return `
            <circle cx="${midX}" cy="${p.y}" r="${isSel ? 6.5 : 4.5}"
              fill="${pointFill}"
              stroke="#0f172a"
              stroke-width="${isSel ? 2.5 : 1.8}" />
          `;
        }).join('')}
      </g>

      <!-- 4. 60점 라인 점수 뱃지 (음수 시 붉은색 #f87171, 양수 시 푸른색 #38bdf8 완벽 적용) -->
      <g class="month-interactive-scores">
        ${points.map(p => {
          const midX = p.x + stepW / 2;
          const isPos = p.record.stepHeight >= 0;
          const isSel = p.record.month === curSelectedMonth;
          const scoreBtnY = isPos ? yMinus60 : yPlus60;
          const scoreObj = toConvertedLifeScore(p.record.stepHeight);
          const scoreColor = isPos ? '#38bdf8' : '#f87171';

          return `
            <g class="month-col-group ${isSel ? 'is-active-month' : ''}">
              <!-- 월별 전면 투명 히트박스 -->
              <rect class="month-hitbox btn-select-month-woon" data-month="${p.record.month}"
                x="${p.x}" y="${padTop}" width="${stepW}" height="${chartH}"
                fill="${isSel ? (isPos ? 'rgba(56, 189, 248, 0.12)' : 'rgba(248, 113, 113, 0.12)') : 'transparent'}"
                style="cursor: pointer;">
                <title>${targetYear}년 ${p.record.month}월 (${p.record.ganji}): ${scoreObj.text}\n공식: ${p.record.formulaText}</title>
              </rect>

              <!-- 호버 또는 클릭 선택 시에만 60점 라인에 떠오르는 점수 뱃지 -->
              <g transform="translate(${midX}, ${scoreBtnY})" class="month-hover-score ${isSel ? 'is-selected' : ''}" style="pointer-events: none;">
                <rect x="${isFullscreen ? -33 : -28}" y="${isFullscreen ? -13 : -11}" width="${isFullscreen ? 66 : 56}" height="${isFullscreen ? 26 : 22}" rx="5"
                  fill="rgba(15, 23, 42, 0.95)"
                  stroke="${scoreColor}"
                  stroke-width="${isSel ? 2 : 1.2}"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
                <text x="0" y="${isFullscreen ? 5 : 4}"
                  fill="${scoreColor}"
                  font-size="${isFullscreen ? 14.5 : 11.5}" font-weight="800" text-anchor="middle" font-family="var(--font-display, 'Space Grotesk', sans-serif)" letter-spacing="0.2px">
                  ${scoreObj.text}
                </text>
              </g>
            </g>
          `;
        }).join('')}
      </g>

    </svg>
  </div>
  `;
}

/**
 * 일년세운(12개월) 하단 추가 설명 영역 렌더러 (월운 인스펙터 + 상세 매트릭스 표)
 */
function render12MonthsExplanationArea(wh: CanonicalLifeDataWarehouse, targetYear: number): string {
  const months = calculate12MonthsWoon(wh, targetYear);
  const curSelectedMonth = selectedMonth || 5;

  return `
    <div class="life-analysis-bottom-explanation-area" style="margin-top: 1.25rem;">
      <!-- 선택된 월운 인과 요인 및 산식 전용 인스펙터 패널 -->
      ${renderMonthWoonFactorInspector(wh, targetYear, curSelectedMonth)}

      <!-- 12개월 월운 상세 매트릭스 표 (공식 컬럼 포함) -->
      <div style="margin-top: 1.25rem; background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem; overflow-x: auto;">
        <div style="font-size: 0.82rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 17px; color: #38bdf8;">table_chart</span>
          12개월 월운 전체 인과 매트릭스 & 판별 산식
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.78rem; color: #e2e8f0;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.12); color: #94a3b8; font-size: 0.72rem;">
              <th style="padding: 0.45rem;">월</th>
              <th style="padding: 0.45rem;">절기</th>
              <th style="padding: 0.45rem;">간지</th>
              <th style="padding: 0.45rem;">12운성</th>
              <th style="padding: 0.45rem;">최종 점수</th>
              <th style="padding: 0.45rem;">판별 산식</th>
              <th style="padding: 0.45rem;">상승 요인</th>
              <th style="padding: 0.45rem;">하강 요인</th>
            </tr>
          </thead>
          <tbody>
            ${months.map(m => {
              const isSel = m.month === curSelectedMonth;
              const upStr = m.upwardFactors.map(f => `<span class="btn-open-factor-wiki" data-factor="${f.name}" style="cursor: pointer; display: inline-block; background: rgba(56,189,248,0.1); color: #38bdf8; border: 1px solid rgba(56,189,248,0.25); border-radius: 3px; padding: 0.05rem 0.35rem; margin: 0.05rem 0.15rem;" title="${f.name} 위키 사전 보기">${f.name}(+${f.weight})</span>`).join('') || '-';
              const downStr = m.downwardFactors.map(f => `<span class="btn-open-factor-wiki" data-factor="${f.name}" style="cursor: pointer; display: inline-block; background: rgba(248,113,113,0.1); color: #fca5a5; border: 1px solid rgba(248,113,113,0.25); border-radius: 3px; padding: 0.05rem 0.35rem; margin: 0.05rem 0.15rem;" title="${f.name} 위키 사전 보기">${f.name}(${f.weight})</span>`).join('') || '-';
              const isPos = m.stepHeight >= 0;
              return `
                <tr class="btn-select-month-woon" data-month="${m.month}" style="border-bottom: 1px solid rgba(255,255,255,0.04); background: ${isSel ? 'rgba(56, 189, 248, 0.15)' : isPos ? 'transparent' : 'rgba(248,113,113,0.02)'}; cursor: pointer;">
                  <td style="padding: 0.45rem; font-weight: 700; font-family: var(--font-display, 'Space Grotesk', sans-serif); color: ${isSel ? '#38bdf8' : '#e2e8f0'};">${m.month}월</td>
                  <td style="padding: 0.45rem; color: #94a3b8;">${m.solarTerm}</td>
                  <td style="padding: 0.45rem; font-weight: 700; font-family: var(--font-serif, 'Noto Serif KR', serif); font-size: 0.88rem; color: #fff;">${m.ganji}</td>
                  <td style="padding: 0.45rem; color: #cbd5e1;">${m.twelveStage}</td>
                  <td style="padding: 0.45rem; font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px; font-weight: 800; color: ${isPos ? '#38bdf8' : '#fca5a5'};">
                    ${toConvertedLifeScore(m.stepHeight).text}
                  </td>
                  <td style="padding: 0.45rem; font-family: var(--font-display, 'Space Grotesk', sans-serif); font-size: 0.74rem; color: #cbd5e1;">
                    ${m.formulaText}
                  </td>
                  <td style="padding: 0.45rem;">${upStr}</td>
                  <td style="padding: 0.45rem;">${downStr}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * [신규] 백년운세 모드 전용 하단 종합 요약 인스펙터
 */
function renderBaeknyeonSummaryInspector(wh: CanonicalLifeDataWarehouse, yr: number | null): string {
  const currentYear = new Date().getFullYear();
  const targetYear = yr || currentYear;
  const curSewoon = wh.sewoonLayer.records.find(s => s.year === targetYear) || wh.sewoonLayer.records[0];
  const curDw = wh.daewoonLayer.records.find(d => d.order === curSewoon.daewoonOrder) || wh.daewoonLayer.records[0];

  return `
    <div class="life-analysis-bottom-explanation-area" style="margin-top: 1.25rem;">
      <div style="background: #0f172a; border: 1.5px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 1.15rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.65rem; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-symbols-outlined" style="font-size: 20px; color: #38bdf8;">auto_graph</span>
            <span style="font-size: 0.92rem; font-weight: 800; color: #fff;">
              백년운세 생애 종합 궤적 · ${curSewoon.year}년 (${curSewoon.age}세 · <span style="font-family: var(--font-serif, 'Noto Serif KR', serif); font-size: 0.95rem;">${curSewoon.ganji}</span>년)
            </span>
            <span style="font-size: 0.7rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 4px;">
              제${curSewoon.daewoonOrder}대운(<span style="font-family: var(--font-serif, 'Noto Serif KR', serif); font-size: 0.78rem;">${curDw.ganji}</span>) 관할
            </span>
          </div>
          <div style="font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px; font-size: 0.88rem; font-weight: 800; color: ${curSewoon.stepHeight >= 0 ? '#38bdf8' : '#fca5a5'};">
            연간 환산 점수: ${toConvertedLifeScore(curSewoon.stepHeight).text} (${curSewoon.stepHeight >= 0 ? '상승' : '하강'})
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.85rem; font-size: 0.78rem;">
          <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); padding: 0.75rem; border-radius: 6px;">
            <div style="color: #94a3b8; font-weight: 700; margin-bottom: 0.35rem;">대운 흐름 (${curDw.startYear}~${curDw.endYear}년)</div>
            <div style="color: #cbd5e1; line-height: 1.5;">
              십신: <strong style="color: #fff;">${curDw.stemTenGod}</strong> · 12운성: <strong style="color: #fff;">${curDw.twelveStage}</strong><br/>
              주요 상호작용: ${[...curDw.relationsWithNatal, ...curDw.activeSinsals].join(', ') || '특이 신살 없음'}
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); padding: 0.75rem; border-radius: 6px;">
            <div style="color: #94a3b8; font-weight: 700; margin-bottom: 0.35rem;">세운 핵심 작용 요인 (${curSewoon.year}년)</div>
            <div style="color: #cbd5e1; line-height: 1.5;">
              상승 (${curSewoon.upwardFactors.length}건): ${curSewoon.upwardFactors.map(f => `<span class="btn-open-factor-wiki" data-factor="${f.name}" style="color: #38bdf8; cursor: pointer; text-decoration: underline;">${f.name}</span>`).join(', ') || '없음'}<br/>
              하강 (${curSewoon.downwardFactors.length}건): ${curSewoon.downwardFactors.map(f => `<span class="btn-open-factor-wiki" data-factor="${f.name}" style="color: #fca5a5; cursor: pointer; text-decoration: underline;">${f.name}</span>`).join(', ') || '없음'}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * [신규] 명리 요인 위키 백과 상세 카드 렌더러 (하단 영역에 실시간 연동)
 */
function renderSelectedFactorWikiCard(factorName: string | null): string {
  const item = factorName ? findSajuFactorWiki(factorName) : null;
  if (!item) return '';

  return `
    <div id="saju-factor-wiki-card" style="background: rgba(15, 23, 42, 0.98); border: 1.5px solid ${item.badgeColor}; border-radius: 10px; padding: 1.15rem; margin-top: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.4);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.65rem; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <span class="material-symbols-outlined" style="font-size: 22px; color: ${item.badgeColor};">menu_book</span>
          <div>
            <span style="font-size: 1.05rem; font-weight: 900; color: #ffffff;">${item.name}</span>
            <span style="font-size: 0.85rem; color: #94a3b8; margin-left: 0.35rem;">(${item.hanja})</span>
          </div>
          <span style="background: ${item.badgeColor}22; color: ${item.badgeColor}; border: 1px solid ${item.badgeColor}66; font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 4px;">
            ${item.category} · ${item.nature}
          </span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.72rem; color: #94a3b8;">* 백과사전 상세 지식창고</span>
        </div>
      </div>

      <!-- 핵심 정의 -->
      <div style="font-size: 0.84rem; color: #f8fafc; font-weight: 600; line-height: 1.6; margin-bottom: 0.85rem; background: rgba(0,0,0,0.3); padding: 0.75rem 1rem; border-radius: 6px; border-left: 3px solid ${item.badgeColor};">
        ${item.summary}
      </div>

      <!-- 4대 영역 영향 그리드 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.65rem; margin-bottom: 0.85rem; font-size: 0.76rem;">
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.6rem 0.75rem; border-radius: 6px;">
          <strong style="color: #60a5fa; display: block; margin-bottom: 0.2rem;">🏢 직업·사업 영향</strong>
          <span style="color: #cbd5e1;">${item.lifeImpact.career}</span>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.6rem 0.75rem; border-radius: 6px;">
          <strong style="color: #34d399; display: block; margin-bottom: 0.2rem;">💰 재물·투자 영향</strong>
          <span style="color: #cbd5e1;">${item.lifeImpact.wealth}</span>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.6rem 0.75rem; border-radius: 6px;">
          <strong style="color: #f472b6; display: block; margin-bottom: 0.2rem;">❤️ 인간관계·애정</strong>
          <span style="color: #cbd5e1;">${item.lifeImpact.relationship}</span>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 0.6rem 0.75rem; border-radius: 6px;">
          <strong style="color: #fca5a5; display: block; margin-bottom: 0.2rem;">🩺 건강·신체 영향</strong>
          <span style="color: #cbd5e1;">${item.lifeImpact.health}</span>
        </div>
      </div>

      <!-- 실전 대처 전략 -->
      <div style="background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.3); padding: 0.65rem 0.9rem; border-radius: 6px; font-size: 0.78rem; color: #e2e8f0; display: flex; align-items: flex-start; gap: 0.45rem;">
        <span class="material-symbols-outlined" style="font-size: 18px; color: #38bdf8; flex-shrink: 0;">lightbulb</span>
        <div>
          <strong style="color: #38bdf8;">실전 처세 및 대처 가이드:</strong> ${item.strategy}
        </div>
      </div>
    </div>
  `;
}

/**
 * [신규] 명리 요인 위키 팝업 모달 HTML
 */
function renderSajuFactorWikiModalHtml(): string {
  return `
    <div id="saju-factor-wiki-modal" style="display: none; position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); align-items: center; justify-content: center; padding: 1.5rem;">
      <div id="saju-factor-wiki-modal-content" style="background: #0b0f19; border: 1.5px solid #38bdf8; border-radius: 12px; max-width: 680px; width: 100%; max-height: 85vh; overflow-y: auto; padding: 1.5rem; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
        <!-- 동적 주입 -->
      </div>
    </div>
  `;
}

/**
 * 10개 대운 파노라마 카드 목록 렌더링 (대운별 전체 흐름과 구체적 현황 한눈 조망)
 */
function renderDaewoonPanoramaCards(daewoon: any, currentOrder: number): string {
  return daewoon.records.map((d: any) => {
    const isSelected = d.order === currentOrder;
    const isCur = d.isCurrent;
    const isEnergyPos = d.energyScore >= 0;
    const borderCol = isSelected ? (isEnergyPos ? '#38bdf8' : '#f87171') : isCur ? '#f8fafc' : 'rgba(255,255,255,0.08)';
    const bgCol = isSelected ? (isEnergyPos ? 'rgba(56, 189, 248, 0.12)' : 'rgba(248, 113, 113, 0.12)') : isCur ? 'rgba(255,255,255,0.04)' : '#182133';
    const notes = [...d.relationsWithNatal, ...d.activeSinsals].join(', ') || '특이 신살 없음';

    return `
      <div class="btn-select-daewoon-row" data-order="${d.order}"
        style="background: ${bgCol}; border: 1.2px solid ${borderCol}; border-radius: 8px; padding: 0.75rem; cursor: pointer; transition: all 0.15s ease; position: relative;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <div>
            <span style="font-size: 1.12rem; font-weight: 800; color: #ffffff;">제${d.order}대운</span><span style="font-size: 1.15rem; font-weight: 800; font-family: var(--font-serif, 'Noto Serif KR', serif); color: #38bdf8;">(${d.ganji})</span>
          </div>
          <div>
            ${isCur ? '<span style="font-size: 0.65rem; background: #334155; color: #f8fafc; border: 1px solid #64748b; padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 800;">현시점</span>' : ''}
          </div>
        </div>

        <div style="font-size: 0.74rem; color: #cbd5e1; font-family: var(--font-display, 'Space Grotesk', sans-serif); margin-bottom: 0.45rem;">
          ${d.startYear} ~ ${d.endYear}년
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem; font-size: 0.72rem; color: #94a3b8; background: rgba(0,0,0,0.25); padding: 0.35rem 0.45rem; border-radius: 4px; margin-bottom: 0.45rem;">
          <div>십신: <strong style="color: #e2e8f0;">${d.stemTenGod}</strong></div>
          <div>12운성: <strong style="color: #e2e8f0;">${d.twelveStage}</strong></div>
          <div>오행: <strong style="color: #cbd5e1;">${d.elementMix}</strong></div>
          <div>공망: <strong style="color: ${d.isGongmang ? '#f87171' : '#64748b'};">${d.isGongmang ? '공망' : '유효'}</strong></div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; margin-bottom: 0.35rem;">
          <span style="color: #94a3b8;">대운 기운:</span>
          <span style="font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px; font-weight: 800; color: ${isEnergyPos ? '#38bdf8' : '#fca5a5'};">
            ${toConvertedDaewoonScore(d.energyScore).text}
          </span>
        </div>

        <div style="font-size: 0.68rem; color: #94a3b8; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 0.35rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${notes}">
          ${notes}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 대운 내 10년 세운 상세 매트릭스 테이블 렌더링
 */
function renderSewoonMatrixTable(dwSewoon: any[], selectedYear: number | null): string {
  return dwSewoon.map((s: any) => {
    const isCurYr = s.isCurrentYear;
    const isSelected = s.year === selectedYear;
    const isRowPos = s.stepHeight >= 0;
    const rowBg = isSelected
      ? (isRowPos ? 'rgba(56, 189, 248, 0.15)' : 'rgba(248, 113, 113, 0.15)')
      : isCurYr
      ? 'rgba(255, 255, 255, 0.05)'
      : 'transparent';

    const downBadges = s.downwardFactors.map((f: any) => {
      const wText = f.weight < 0 ? `${f.weight}` : `-${f.weight}`;
      return `<span class="btn-open-factor-wiki" data-factor="${f.name}" style="cursor: pointer; display: inline-block; background: rgba(248,113,113,0.12); color: #fca5a5; border: 1px solid rgba(248,113,113,0.3); padding: 0.08rem 0.35rem; border-radius: 3px; margin: 0.05rem 0.15rem 0.05rem 0; font-size: 0.72rem;" title="${f.name} 위키 백과 보기">${f.name} (${wText})</span>`;
    }).join('') || '-';

    const upBadges = s.upwardFactors.map((f: any) => {
      const wText = f.weight > 0 ? `+${f.weight}` : `${f.weight}`;
      return `<span class="btn-open-factor-wiki" data-factor="${f.name}" style="cursor: pointer; display: inline-block; background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); padding: 0.08rem 0.35rem; border-radius: 3px; margin: 0.05rem 0.15rem 0.05rem 0; font-size: 0.72rem;" title="${f.name} 위키 백과 보기">${f.name} (${wText})</span>`;
    }).join('') || '-';

    const btnBg = isSelected ? (isRowPos ? '#38bdf8' : '#f87171') : 'rgba(255,255,255,0.06)';
    const btnBorder = isSelected ? (isRowPos ? '#38bdf8' : '#f87171') : 'rgba(255,255,255,0.12)';
    const btnColor = isSelected ? '#0b0f19' : '#cbd5e1';

    return `
      <tr class="btn-select-sewoon-row" data-year="${s.year}" style="border-bottom: 1px solid rgba(255,255,255,0.04); background: ${rowBg}; cursor: pointer;">
        <td style="padding: 0.5rem; font-weight: 700; font-family: var(--font-display, 'Space Grotesk', sans-serif);">
          ${s.year}년
          ${isCurYr ? '<span style="font-size: 0.62rem; background: #334155; color: #f8fafc; border: 1px solid #64748b; padding: 0.08rem 0.3rem; border-radius: 3px; margin-left: 0.2rem; font-weight: 700;">올해</span>' : ''}
        </td>
        <td style="padding: 0.5rem; font-weight: 800; font-family: var(--font-serif, 'Noto Serif KR', serif); font-size: 0.95rem; color: #fff;">${s.ganji}</td>
        <td style="padding: 0.5rem; color: #cbd5e1;">${s.stemTenGod} / ${s.branchTenGod}</td>
        <td style="padding: 0.5rem; color: #cbd5e1;">${s.twelveStage}</td>
        <td style="padding: 0.5rem; font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px; font-weight: 800; color: ${isRowPos ? '#38bdf8' : '#fca5a5'};">
          ${toConvertedLifeScore(s.stepHeight).text}
        </td>
        <td style="padding: 0.5rem;">
          <span style="font-size: 0.72rem; padding: 0.1rem 0.35rem; border-radius: 3px; font-weight: 600; background: rgba(255,255,255,0.06); color: #e2e8f0;">
            ${s.level}
          </span>
        </td>
        <td style="padding: 0.5rem;">
          ${downBadges}
        </td>
        <td style="padding: 0.5rem;">
          ${upBadges}
        </td>
        <td style="padding: 0.5rem; text-align: center;">
          <button type="button" class="btn-select-sewoon-year" data-year="${s.year}" style="background: ${btnBg}; color: ${btnColor}; font-weight: ${isSelected ? '800' : 'normal'}; border: 1px solid ${btnBorder}; border-radius: 4px; padding: 0.18rem 0.45rem; font-size: 0.7rem; cursor: pointer;">
            ${isSelected ? '조회중' : '선택'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 인생분석 전체 패널 HTML 렌더링
 */
export function renderAdminLifeAnalysisPanel(): string {
  const wh = getActiveWarehouse();
  const natal = wh.natalLayer;
  const daewoon = wh.daewoonLayer;
  const sewoon = wh.sewoonLayer;

  const currentOrder = getSelectedDaewoonOrder();
  const selectedDw = daewoon.records.find(d => d.order === currentOrder) || daewoon.records[0];

  // 해당 대운에 속하는 10년 세운 필터링
  const dwSewoon = sewoon.records.filter(s => s.age >= selectedDw.startAge && s.age <= selectedDw.endAge);

  const inp = wh.metadata.input;
  const [bYear, bMonth, bDay] = inp.birthDate.split('-').map(Number);
  const bHour = inp.birthTime ? parseInt(inp.birthTime.split(':')[0], 10) : 12;

  const isFullscreen = getLifeChartFullscreen();
  const currentViewMode = getLifeChartViewMode();
  const isSajuOpen = getSajuInputExpanded();
  const activeStage = getActiveLifeStage();

  // 선택된 연도 레코드 도출
  const allSewoons = sewoon.records;
  const curSewoon = allSewoons.find(s => s.year === (selectedYear || new Date().getFullYear())) || allSewoons[0];
  const targetDw = daewoon.records.find(d => d.order === selectedDaewoonOrder) || daewoon.records[0];
  const downTags = curSewoon.downwardFactors.map(f => f.name).join(', ') || '없음';
  const upTags = curSewoon.upwardFactors.map(f => f.name).join(', ') || '없음';

  // 12개월 주기표 렌더링 데이터
  const monthsData = calculate12MonthsWoon(wh, curSewoon.year);
  const curMonthRecord = monthsData.find(m => m.month === (selectedMonth || 5)) || monthsData[4] || monthsData[0];
  const curMonthUpTags = curMonthRecord.upwardFactors.map(f => `${f.name}(+${f.weight})`).join(', ') || '없음';
  const curMonthDownTags = curMonthRecord.downwardFactors.map(f => `${f.name}(${f.weight})`).join(', ') || '없음';

  // 계층형 브레드크럼 네비게이션 렌더러
  const renderBreadcrumbNav = (compact: boolean = false) => `
    <div style="display: inline-flex; align-items: center; gap: 0.4rem; flex-wrap: nowrap;">
      <div style="display: inline-flex; align-items: center; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 0.15rem 0.3rem; gap: 0.2rem; flex-shrink: 0;">
        <button type="button" class="btn-toggle-life-view-mode" data-mode="100years"
          style="background: ${currentViewMode === '100years' ? '#0284c7' : 'transparent'}; color: ${currentViewMode === '100years' ? '#ffffff' : '#94a3b8'}; font-weight: 700; border: none; border-radius: 4px; padding: ${compact ? '0.2rem 0.45rem' : '0.28rem 0.6rem'}; font-size: 0.72rem; cursor: pointer; transition: all 0.15s ease;">
          백년운세
        </button>
        <span style="color: #64748b; font-size: 0.68rem;">-</span>
        <button type="button" class="btn-toggle-life-view-mode" data-mode="10years"
          style="background: ${currentViewMode === '10years' ? '#0284c7' : 'transparent'}; color: ${currentViewMode === '10years' ? '#ffffff' : '#94a3b8'}; font-weight: 700; border: none; border-radius: 4px; padding: ${compact ? '0.2rem 0.45rem' : '0.28rem 0.6rem'}; font-size: 0.72rem; cursor: pointer; transition: all 0.15s ease;">
          제${targetDw.order}대운(${targetDw.ganji})
        </button>
        <span style="color: #64748b; font-size: 0.68rem;">-</span>
        <button type="button" class="btn-toggle-life-view-mode" data-mode="12months"
          style="background: ${currentViewMode === '12months' ? '#0284c7' : 'transparent'}; color: ${currentViewMode === '12months' ? '#ffffff' : '#94a3b8'}; font-weight: 700; border: none; border-radius: 4px; padding: ${compact ? '0.2rem 0.45rem' : '0.28rem 0.6rem'}; font-size: 0.72rem; cursor: pointer; transition: all 0.15s ease;">
          일년세운 (${curSewoon.year}년 ${curSewoon.ganji}년)
        </button>
      </div>
    </div>
  `;

  // 1. 일반 대시보드 뷰용 히어로 카드 (2단계 내부 소분류 2-A)
  const regularHeroCardHtml = `
    <div class="life-cycle-chart-hero-card" style="background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.6rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; border-radius: 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);">
            <span class="material-symbols-outlined" style="font-size: 1rem; color: #38bdf8;">ssid_chart</span>
            <span style="font-size: 0.82rem; font-weight: 700; color: #f8fafc;">0~100세 생애 에너지 궤적</span>
          </div>
          <span style="font-size: 0.82rem; color: #94a3b8;">
            현재 기준: <strong style="color: #38bdf8;">${curSewoon.year}년 (${curSewoon.age}세 · ${curSewoon.ganji}년)</strong>
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          ${renderBreadcrumbNav(false)}
          <button type="button" class="btn-open-life-fullscreen" onclick="window.__openLifeFullscreen && window.__openLifeFullscreen()"
            style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #dfe2f1; border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: #94a3b8;">fullscreen</span>
            전체화면
          </button>
        </div>
      </div>

      <div class="life-chart-canvas-container" style="width: 100%; height: 250px; min-height: 250px; max-height: 250px; position: relative;">
        ${currentViewMode === '100years' ? `
          ${renderLifeCycleStepLineSvg(wh, false)}
        ` : currentViewMode === '10years' ? `
          ${renderLifeCycleStepLineSvg(wh, false)}
        ` : `
          ${render12MonthsCycleView(wh, curSewoon.year, false)}
        `}
      </div>

      <div class="life-analysis-bottom-explanation-container" style="margin-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.25rem;">
        ${currentViewMode === '100years' ? `
          ${renderBaeknyeonSummaryInspector(wh, selectedYear)}
        ` : currentViewMode === '10years' ? `
          ${renderSewoonFactorInspector(wh)}
        ` : `
          ${render12MonthsExplanationArea(wh, curSewoon.year)}
        `}

        ${renderSelectedFactorWikiCard(selectedWikiFactor)}
      </div>
    </div>
  `;

  // 각 단계별 펼침 여부 확인
  const isStage1Open = isLifeStageExpanded('stage-1');
  const isStage2Open = isLifeStageExpanded('stage-2');
  const isStage3Open = isLifeStageExpanded('stage-3');
  const isStage4Open = isLifeStageExpanded('stage-4');

  return `
  <!-- 명리 요인 위키 백과 모달 레이어 -->
  ${renderSajuFactorWikiModalHtml()}

  <!-- 전체화면 오버레이: 스크롤 없는 100vh 싱글 뷰포트 & 클릭 핀포인트 HUD -->
  ${isFullscreen ? `
    <div id="life-chart-fullscreen-overlay" style="position: fixed; inset: 0; z-index: 99999; background: #070a13; overflow: hidden; width: 100vw; height: 100vh; max-height: 100vh; padding: 0.65rem 1.25rem 0.5rem; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; gap: 0.45rem;">
      <div style="background: #070a13; display: flex; flex-direction: column; gap: 0.4rem; flex-shrink: 0; padding-bottom: 0.35rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.5rem 1.15rem; gap: 0.75rem; flex-wrap: nowrap; overflow-x: auto;">
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;">
            <div style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.55rem; border-radius: 5px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);">
              <span class="material-symbols-outlined" style="font-size: 0.95rem; color: #38bdf8;">fullscreen</span>
              <span style="font-size: 0.78rem; font-weight: 800; color: #f8fafc;">전체화면 정밀 분석</span>
            </div>
            <span style="font-size: 0.84rem; font-weight: 700; color: #e2e8f0; white-space: nowrap;">
              ${inp.birthDate} (${natal.dayMaster.stem}${natal.dayMaster.element}) · 대운수 ${daewoon.daewoonNumber}
            </span>
          </div>

          <div style="display: flex; align-items: center; flex-shrink: 0;">
            ${renderBreadcrumbNav(true)}
          </div>

          <button type="button" class="btn-close-life-fullscreen" onclick="window.__closeLifeFullscreen && window.__closeLifeFullscreen()"
            style="background: #ef4444; color: #ffffff; font-weight: 800; border: none; border-radius: 6px; padding: 0.45rem 1.05rem; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 2px 8px rgba(239,68,68,0.4); flex-shrink: 0; z-index: 10; transition: all 0.15s ease;">
            <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
            닫기 (ESC)
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.35rem 1rem; font-size: 0.8rem; flex-wrap: nowrap; overflow-x: auto; gap: 0.6rem;">
          ${currentViewMode === '12months' ? `
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;">
              <span style="color: #94a3b8; font-size: 0.75rem;">기준 월운:</span>
              <strong style="color: #fff; font-size: 0.92rem;">${curSewoon.year}년 ${curMonthRecord.month}월 (${curMonthRecord.ganji} · ${curMonthRecord.solarTerm})</strong>
              <span style="color: #64748b;">|</span>
              <span style="color: #94a3b8; font-size: 0.75rem;">환산 점수:</span>
              <strong style="color: ${curMonthRecord.stepHeight >= 0 ? '#38bdf8' : '#fca5a5'}; font-size: 1.02rem; font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px;">
                ${toConvertedLifeScore(curMonthRecord.stepHeight).text}
              </strong>
            </div>

            <div style="display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;">
              <span style="color: #38bdf8; font-size: 0.76rem;">상승: <strong>${curMonthUpTags}</strong></span>
              <span style="color: #64748b;">|</span>
              <span style="color: #fca5a5; font-size: 0.76rem;">하강: <strong>${curMonthDownTags}</strong></span>
              <span style="color: #64748b; font-size: 0.7rem; background: rgba(255,255,255,0.06); padding: 0.1rem 0.4rem; border-radius: 4px;">산식: ${curMonthRecord.formulaText}</span>
            </div>
          ` : `
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;">
              <span style="color: #94a3b8; font-size: 0.75rem;">기준 연도:</span>
              <strong style="color: #fff; font-size: 0.92rem;">${curSewoon.year}년 (${curSewoon.ganji}년)</strong>
              <span style="color: #64748b;">|</span>
              <span style="color: #94a3b8; font-size: 0.75rem;">환산 점수:</span>
              <strong style="color: ${curSewoon.stepHeight >= 0 ? '#38bdf8' : '#fca5a5'}; font-size: 1.02rem; font-family: var(--font-display, 'Space Grotesk', sans-serif); letter-spacing: 0.2px;">
                ${toConvertedLifeScore(curSewoon.stepHeight).text}
              </strong>
            </div>

            <div style="display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;">
              <span style="color: #38bdf8; font-size: 0.76rem;">상승: <strong>${upTags}</strong></span>
              <span style="color: #64748b;">|</span>
              <span style="color: #fca5a5; font-size: 0.76rem;">하강: <strong>${downTags}</strong></span>
              <span style="color: #64748b; font-size: 0.7rem; background: rgba(255,255,255,0.06); padding: 0.1rem 0.4rem; border-radius: 4px;">기준: 0점 (평운)</span>
            </div>
          `}
        </div>
      </div>

      <div style="flex: 1; min-height: 0; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; overflow: hidden;">
        ${currentViewMode === '100years' ? `
          ${renderLifeCycleStepLineSvg(wh, true)}
        ` : currentViewMode === '10years' ? `
          ${renderLifeCycleStepLineSvg(wh, true)}
        ` : `
          ${render12MonthsCycleView(wh, curSewoon.year, true)}
        `}
      </div>

      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.4rem 1rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; flex-shrink: 0; flex-wrap: nowrap; overflow-x: auto; gap: 0.75rem;">
        ${currentViewMode === '12months' ? `
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">fact_check</span>
            <strong style="color: #fff;">${curSewoon.year}년 ${curMonthRecord.month}월 (${curMonthRecord.ganji} · ${curMonthRecord.solarTerm}) 월운 인과 요인:</strong>
            <span style="color: #94a3b8;">12운성 ${curMonthRecord.twelveStage} · 산식: ${curMonthRecord.formulaText}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.85rem; flex-shrink: 0;">
            <div style="color: #38bdf8; font-size: 0.76rem;">
              <strong>상승 요인 (${curMonthRecord.upwardFactors.length}):</strong> ${curMonthUpTags}
            </div>
            <span style="color: #64748b;">|</span>
            <div style="color: #fca5a5; font-size: 0.76rem;">
              <strong>하강 요인 (${curMonthRecord.downwardFactors.length}):</strong> ${curMonthDownTags}
            </div>
          </div>
        ` : `
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">manage_search</span>
            <strong style="color: #fff;">${curSewoon.year}년 (${curSewoon.age}세 · ${curSewoon.ganji}년) 명리 요인:</strong>
            <span style="color: #94a3b8;">제${curSewoon.daewoonOrder}대운(${targetDw.ganji}) · 12운성 ${curSewoon.twelveStage}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.85rem; flex-shrink: 0;">
            <div style="color: #38bdf8; font-size: 0.76rem;">
              <strong>상승 요인 (${curSewoon.upwardFactors.length}):</strong> ${upTags}
            </div>
            <span style="color: #64748b;">|</span>
            <div style="color: #fca5a5; font-size: 0.76rem;">
              <strong>하강 요인 (${curSewoon.downwardFactors.length}):</strong> ${downTags}
            </div>
          </div>
        `}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #64748b; padding: 0 0.5rem; flex-shrink: 0;">
        <span>* 백년운세에서 대운 칩 클릭 시 십년대운 확대 ➔ 세운 클릭 시 일년세운 확대 (상단 네비게이션으로 복구 가능)</span>
        <span>키보드 ESC 키 또는 빨간색 닫기 버튼으로 즉시 복귀</span>
      </div>
    </div>
  ` : ''}

  <!-- [메인 관제 레이아웃] 단계별 4대 관제 대분류/소분류 접이식 타워 -->
  <div class="admin-life-analysis-container" style="display: ${isFullscreen ? 'none' : 'flex'}; flex-direction: column; gap: 1.25rem;">
    
    <!-- ======================================================== -->
    <!-- [관제 헤더 0]: 분석 사주 요약 HUD & 컨트롤 툴바 -->
    <!-- ======================================================== -->
    <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
      
      <!-- 좌측: 현재 분석 중인 사주 프로필 칩 -->
      <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
        <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem; border-radius: 8px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3);">
          <span class="material-symbols-outlined" style="font-size: 1.1rem; color: #38bdf8;">warehouse</span>
          <span style="font-size: 0.85rem; font-weight: 800; color: #f8fafc;">백세인생 원천 창고</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.86rem; color: #e2e8f0;">
          <strong style="color: #fff;">${inp.birthDate}</strong>
          <span style="color: #94a3b8;">(${inp.gender === 'female' ? '여성' : '남성'}, ${inp.calendarType === 'solar' ? '양력' : '음력'} ${inp.birthTime || '시간미상'})</span>
          <span style="color: #64748b;">·</span>
          <span>일간: <strong style="color: var(--primary); font-size: 0.95rem;">${natal.dayMaster.stem}${natal.dayMaster.element}</strong> (${natal.strength.classification})</span>
          <span style="color: #64748b;">·</span>
          <span style="background: rgba(255,255,255,0.06); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; color: #cbd5e1;">
            대운수 ${daewoon.daewoonNumber} (${daewoon.direction})
          </span>
        </div>
      </div>

      <!-- 우측: 액션 툴바 (사주 변경 토글, 프롬프트 복사, B2B 패킷 복사, 전체 펼치기/접기) -->
      <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
        <!-- 사주 변경 토글 -->
        <button type="button" class="btn-toggle-saju-input"
          style="background: ${isSajuOpen ? 'var(--primary)' : 'rgba(255,255,255,0.06)'}; color: ${isSajuOpen ? '#1c1500' : '#cbd5e1'}; font-weight: 700; border: 1px solid ${isSajuOpen ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}; border-radius: 6px; padding: 0.35rem 0.7rem; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">tune</span>
          ${isSajuOpen ? '입력창 닫기' : '사주 변경/프리셋'}
        </button>

        <!-- 전체 펼치기 / 접기 토글 -->
        <button type="button" class="btn-toggle-all-life-stages" data-action="${(isStage1Open && isStage2Open && isStage3Open) ? 'collapse' : 'expand'}"
          style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-weight: 600; border-radius: 6px; padding: 0.35rem 0.7rem; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">${(isStage1Open && isStage2Open && isStage3Open) ? 'unfold_less' : 'unfold_more'}</span>
          ${(isStage1Open && isStage2Open && isStage3Open) ? '모두 접기' : '모두 펼치기'}
        </button>

        <!-- AI 프롬프트 복사 -->
        <button type="button" id="btn-copy-ai-prompt" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-weight: 600; border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
          <span class="material-symbols-outlined" style="font-size: 16px; color: #94a3b8;">smart_toy</span>
          프롬프트 복사
        </button>

        <!-- B2B 패킷 복사 -->
        <button type="button" id="btn-copy-evidence-packet" style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); color: #38bdf8; font-weight: 700; border-radius: 6px; padding: 0.35rem 0.65rem; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
          <span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">dataset</span>
          B2B 패킷 복사
        </button>
      </div>
    </div>

    <!-- [숨은 사주 입력 폼] 토글 시 노출 -->
    <div id="saju-input-section" style="${isSajuOpen ? 'display: block;' : 'display: none;'} background: #0b0f19; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.15rem; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
        <span style="font-size: 0.82rem; font-weight: 700; color: #dfe2f1; display: flex; align-items: center; gap: 0.35rem;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--primary);">tune</span>
          사주 입력 및 빠른 프리셋
        </span>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button type="button" id="btn-load-current-user-saju" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 0.72rem; padding: 0.35rem 0.65rem; border-radius: 6px; cursor: pointer;">
            현재 유저 사주 로드
          </button>
          <button type="button" class="btn-preset-saju" data-year="1998" data-month="4" data-day="12" data-hour="9" data-gender="female" style="background: rgba(242,202,80,0.12); border: 1px solid rgba(242,202,80,0.3); color: var(--primary); font-size: 0.72rem; padding: 0.35rem 0.65rem; border-radius: 6px; cursor: pointer;">
            1998년 기축 女 (토다자)
          </button>
          <button type="button" class="btn-preset-saju" data-year="1985" data-month="2" data-day="15" data-hour="14" data-gender="male" style="background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.3); color: #60a5fa; font-size: 0.72rem; padding: 0.35rem 0.65rem; border-radius: 6px; cursor: pointer;">
            1985년 갑목 男 (신강)
          </button>
        </div>
      </div>

      <form id="form-life-analysis-input" onsubmit="return false;" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; align-items: flex-end;">
        <div>
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">성별</label>
          <select id="la-gender" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.45rem 0.5rem; color: #fff; font-size: 0.82rem;">
            <option value="female" ${inp.gender === 'female' ? 'selected' : ''}>여성</option>
            <option value="male" ${inp.gender === 'male' ? 'selected' : ''}>남성</option>
          </select>
        </div>
        <div>
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">출생 연도</label>
          <input type="number" id="la-year" value="${bYear}" min="1920" max="2030" style="width: 100%; box-sizing: border-box; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.45rem 0.5rem; color: #fff; font-size: 0.82rem;" />
        </div>
        <div>
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">출생 월</label>
          <input type="number" id="la-month" value="${bMonth}" min="1" max="12" style="width: 100%; box-sizing: border-box; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.45rem 0.5rem; color: #fff; font-size: 0.82rem;" />
        </div>
        <div>
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">출생 일</label>
          <input type="number" id="la-day" value="${bDay}" min="1" max="31" style="width: 100%; box-sizing: border-box; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.45rem 0.5rem; color: #fff; font-size: 0.82rem;" />
        </div>
        <div>
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">출생 시분</label>
          <input type="text" id="la-time-input" value="${inp.birthTime || '09:20'}" placeholder="0920" style="width: 100%; box-sizing: border-box; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.45rem 0.5rem; color: #fff; font-size: 0.82rem;" />
        </div>
        <div>
          <label style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">양력/음력</label>
          <select id="la-calendar" style="width: 100%; background: #181c28; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.45rem 0.5rem; color: #fff; font-size: 0.82rem;">
            <option value="solar" ${inp.calendarType === 'solar' ? 'selected' : ''}>양력</option>
            <option value="lunar" ${inp.calendarType === 'lunar' ? 'selected' : ''}>음력</option>
          </select>
        </div>
        <div>
          <button type="submit" id="btn-run-life-analysis" style="width: 100%; background: var(--primary); color: #1c1500; font-weight: 800; border: none; border-radius: 6px; padding: 0.55rem; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
            <span class="material-symbols-outlined" style="font-size: 16px;">play_arrow</span>
            사주 재계산
          </button>
        </div>
      </form>
    </div>

    <!-- ======================================================== -->
    <!-- [핵심 UI 개편]: 단계별 4대 관제 대분류 내비게이션 바 -->
    <!-- 관리자가 '단계별로 뭘 눌러서 무엇을 알 수 있는지' 1초 만에 인지 -->
    <!-- ======================================================== -->
    <div style="background: #0b0f19; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 0.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
      
      <!-- ALL: 전체 보기 탭 -->
      <button type="button" class="btn-select-life-stage" data-stage="all"
        style="background: ${activeStage === 'all' ? '#1e293b' : 'rgba(255,255,255,0.02)'}; border: 1.5px solid ${activeStage === 'all' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 0.65rem 0.85rem; text-align: left; cursor: pointer; transition: all 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
          <span style="font-size: 0.68rem; font-weight: 800; color: ${activeStage === 'all' ? '#38bdf8' : '#94a3b8'}; text-transform: uppercase;">MASTER VIEW</span>
          <span class="material-symbols-outlined" style="font-size: 16px; color: ${activeStage === 'all' ? '#38bdf8' : '#64748b'};">view_stream</span>
        </div>
        <div style="font-size: 0.84rem; font-weight: 800; color: #fff;">전체 단계 한눈에 보기</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem;">1~4단계 전체를 스크롤로 조망</div>
      </button>

      <!-- 1단계: 사주 원국 정밀 진단실 -->
      <button type="button" class="btn-select-life-stage" data-stage="stage-1"
        style="background: ${activeStage === 'stage-1' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.02)'}; border: 1.5px solid ${activeStage === 'stage-1' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 0.65rem 0.85rem; text-align: left; cursor: pointer; transition: all 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
          <span style="font-size: 0.68rem; font-weight: 800; color: #38bdf8;">STEP 01</span>
          <span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">grid_4x4</span>
        </div>
        <div style="font-size: 0.84rem; font-weight: 800; color: #fff;">1. 사주 원국 정밀 진단</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem;">선천 기질 · 4주 8글자 · 4대 유통</div>
      </button>

      <!-- 2단계: 100년 라이프사이클 궤적 & 영역 관제실 -->
      <button type="button" class="btn-select-life-stage" data-stage="stage-2"
        style="background: ${activeStage === 'stage-2' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.02)'}; border: 1.5px solid ${activeStage === 'stage-2' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 0.65rem 0.85rem; text-align: left; cursor: pointer; transition: all 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
          <span style="font-size: 0.68rem; font-weight: 800; color: #38bdf8;">STEP 02</span>
          <span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">ssid_chart</span>
        </div>
        <div style="font-size: 0.84rem; font-weight: 800; color: #fff;">2. 100년 궤적 & 9대 영역</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem;">0~100세 파동 · 영역별 신호등</div>
      </button>

      <!-- 3단계: 시간축 심층 인과 드릴다운실 -->
      <button type="button" class="btn-select-life-stage" data-stage="stage-3"
        style="background: ${activeStage === 'stage-3' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.02)'}; border: 1.5px solid ${activeStage === 'stage-3' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 0.65rem 0.85rem; text-align: left; cursor: pointer; transition: all 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
          <span style="font-size: 0.68rem; font-weight: 800; color: #38bdf8;">STEP 03 (클릭 드릴다운)</span>
          <span class="material-symbols-outlined" style="font-size: 16px; color: #38bdf8;">alt_route</span>
        </div>
        <div style="font-size: 0.84rem; font-weight: 800; color: #fff;">3. 대운 ➔ 세운 ➔ 월운 추적</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem;">10년 대운 ➔ 1년 세운 ➔ 12월 월운</div>
      </button>

      <!-- 4단계: B2B 패킷 & 결과지 품질 대조실 -->
      <button type="button" class="btn-select-life-stage" data-stage="stage-4"
        style="background: ${activeStage === 'stage-4' ? 'rgba(242, 202, 80, 0.12)' : 'rgba(255,255,255,0.02)'}; border: 1.5px solid ${activeStage === 'stage-4' ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 0.65rem 0.85rem; text-align: left; cursor: pointer; transition: all 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
          <span style="font-size: 0.68rem; font-weight: 800; color: var(--primary);">STEP 04</span>
          <span class="material-symbols-outlined" style="font-size: 16px; color: var(--primary);">compare_arrows</span>
        </div>
        <div style="font-size: 0.84rem; font-weight: 800; color: #fff;">4. 패킷 & 결과지 대조실</div>
        <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem;">AI 표준 패킷 · 기존 vs V2 비교</div>
      </button>

    </div>


    <!-- ======================================================== -->
    <!-- [대분류 1]: STEP 01. 사주 원국 정밀 진단실 (The Foundation) -->
    <!-- ======================================================== -->
    ${(activeStage === 'all' || activeStage === 'stage-1') ? `
      <div id="section-stage-1" style="background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        
        <!-- 대분류 1 헤더 (클릭 시 토글) -->
        <div class="btn-toggle-life-stage-header" data-stage="stage-1"
          style="padding: 1rem 1.25rem; background: rgba(255,255,255,0.02); border-bottom: ${isStage1Open ? '1px solid rgba(255,255,255,0.08)' : 'none'}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="background: #0284c7; color: #fff; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 4px;">STEP 01</span>
            <span class="material-symbols-outlined" style="font-size: 20px; color: #38bdf8;">grid_4x4</span>
            <h3 style="font-size: 1.02rem; font-weight: 800; color: #f8fafc; margin: 0;">사주 원국 정밀 진단실</h3>
            <span style="font-size: 0.76rem; color: #94a3b8; display: inline-block; margin-left: 0.4rem;">
              — 선천 기질, 오행 불균형, 신강약, 용신(무기), 4대 유통 통로 판정
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.72rem; color: #64748b; background: rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px;">소분류 3개</span>
            <span class="material-symbols-outlined" style="font-size: 20px; color: #94a3b8; transition: transform 0.2s ease; transform: ${isStage1Open ? 'rotate(180deg)' : 'rotate(0deg)'};">expand_more</span>
          </div>
        </div>

        <!-- 대분류 1 본문 (펼침 상태일 때만 노출) -->
        ${isStage1Open ? `
          <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem;">
            
            <!-- 인지 가이드 배너 -->
            <div style="background: rgba(56, 189, 248, 0.06); border-left: 3px solid #38bdf8; border-radius: 0 8px 8px 0; padding: 0.65rem 0.95rem; font-size: 0.78rem; color: #cbd5e1; line-height: 1.5;">
              <strong style="color: #38bdf8;">💡 [1단계에서 무엇을 보고 알 수 있나?]</strong><br/>
              사주의 기본 설계도입니다. 일간(나)의 기운이 강한지 약한지(<strong style="color: #fff;">신강/신약</strong>), 삶의 균형을 잡아주는 핵심 무기(<strong style="color: #fff;">용신·희신</strong>), 비어있는 기운(<strong style="color: #f87171;">공망</strong>), 그리고 재물과 관직으로 에너지가 흐르는 길(<strong style="color: #34d399;">4대 유통 통로</strong>)을 확인합니다.
            </div>

            <!-- [소분류 1-A & 1-B 그리드] -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1rem;">
              
              <!-- [소분류 1-A] 4주 8글자 사주 원국표 -->
              <div style="background: #0b0f19; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <strong style="font-size: 0.88rem; color: #dfe2f1; display: flex; align-items: center; gap: 0.35rem;">
                    <span style="color: #38bdf8; font-size: 0.74rem; font-weight: 800;">1-A</span>
                    사주 4주 8글자 만세력 & 통근·공망
                  </strong>
                  <span style="font-size: 0.72rem; color: #64748b;">뿌리(통근) 및 비어있는 기운(공망)</span>
                </div>

                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 0.82rem;">
                    <thead>
                      <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); font-size: 0.74rem;">
                        <th style="padding: 0.45rem;">구분</th>
                        <th style="padding: 0.45rem;">시주(時柱)</th>
                        <th style="padding: 0.45rem;">일주(日柱)</th>
                        <th style="padding: 0.45rem;">월주(月柱)</th>
                        <th style="padding: 0.45rem;">년주(年柱)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="color: #94a3b8; font-size: 0.72rem;">
                        <td style="padding: 0.35rem; font-weight: 700;">천간 십신</td>
                        <td>${natal.pillars[3].stemTenGod}</td>
                        <td style="color: var(--primary); font-weight: 800;">일간(나)</td>
                        <td>${natal.pillars[1].stemTenGod}</td>
                        <td>${natal.pillars[0].stemTenGod}</td>
                      </tr>
                      <tr style="font-size: 1.25rem; font-weight: 900; font-family: var(--font-serif); color: #fff;">
                        <td style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">천간</td>
                        <td style="padding: 0.35rem;">${natal.pillars[3].stem} <span style="font-size: 0.85rem; color: #94a3b8;">(${natal.pillars[3].stemHanja})</span></td>
                        <td style="padding: 0.35rem; color: var(--primary);">${natal.pillars[2].stem} <span style="font-size: 0.85rem; color: var(--primary);">(${natal.pillars[2].stemHanja})</span></td>
                        <td style="padding: 0.35rem;">${natal.pillars[1].stem} <span style="font-size: 0.85rem; color: #94a3b8;">(${natal.pillars[1].stemHanja})</span></td>
                        <td style="padding: 0.35rem;">${natal.pillars[0].stem} <span style="font-size: 0.85rem; color: #94a3b8;">(${natal.pillars[0].stemHanja})</span></td>
                      </tr>
                      <tr style="font-size: 1.25rem; font-weight: 900; font-family: var(--font-serif); color: #fff; border-top: 1px dashed rgba(255,255,255,0.06);">
                        <td style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">지지</td>
                        <td style="padding: 0.35rem;">${natal.pillars[3].branch} <span style="font-size: 0.85rem; color: #94a3b8;">(${natal.pillars[3].branchHanja})</span></td>
                        <td style="padding: 0.35rem; color: var(--primary);">${natal.pillars[2].branch} <span style="font-size: 0.85rem; color: var(--primary);">(${natal.pillars[2].branchHanja})</span></td>
                        <td style="padding: 0.35rem;">${natal.pillars[1].branch} <span style="font-size: 0.85rem; color: #94a3b8;">(${natal.pillars[1].branchHanja})</span></td>
                        <td style="padding: 0.35rem;">${natal.pillars[0].branch} <span style="font-size: 0.85rem; color: #94a3b8;">(${natal.pillars[0].branchHanja})</span></td>
                      </tr>
                      <tr style="color: #94a3b8; font-size: 0.72rem;">
                        <td style="padding: 0.35rem; font-weight: 700;">지지 십신</td>
                        <td>${natal.pillars[3].branchTenGod}</td>
                        <td style="color: var(--primary);">${natal.pillars[2].branchTenGod}</td>
                        <td>${natal.pillars[1].branchTenGod}</td>
                        <td>${natal.pillars[0].branchTenGod}</td>
                      </tr>
                      <tr style="color: #64748b; font-size: 0.68rem; border-top: 1px solid rgba(255,255,255,0.06);">
                        <td style="padding: 0.35rem;">지장간</td>
                        <td>${natal.pillars[3].hiddenStems.join(',') || '-'}</td>
                        <td>${natal.pillars[2].hiddenStems.join(',') || '-'}</td>
                        <td>${natal.pillars[1].hiddenStems.join(',') || '-'}</td>
                        <td>${natal.pillars[0].hiddenStems.join(',') || '-'}</td>
                      </tr>
                      <tr style="color: #cbd5e1; font-size: 0.72rem; border-top: 1px dashed rgba(255,255,255,0.06);">
                        <td style="padding: 0.35rem; font-weight: 700; color: #94a3b8;">12운성</td>
                        <td><span style="background: rgba(255,255,255,0.06); padding: 0.12rem 0.35rem; border-radius: 4px;">${natal.pillars[3].twelveStage}</span></td>
                        <td><span style="background: rgba(242,202,80,0.18); color: var(--primary); font-weight: 800; padding: 0.12rem 0.35rem; border-radius: 4px;">${natal.pillars[2].twelveStage}</span></td>
                        <td><span style="background: rgba(255,255,255,0.06); padding: 0.12rem 0.35rem; border-radius: 4px;">${natal.pillars[1].twelveStage}</span></td>
                        <td><span style="background: rgba(255,255,255,0.06); padding: 0.12rem 0.35rem; border-radius: 4px;">${natal.pillars[0].twelveStage}</span></td>
                      </tr>
                      <tr style="color: #94a3b8; font-size: 0.68rem; border-top: 1px dashed rgba(255,255,255,0.04);">
                        <td style="padding: 0.35rem;">공망/통근</td>
                        <td>${natal.pillars[3].isGongmang ? '<span style="color: #f87171; font-weight: 700;">★공망</span>' : '유효'} <span style="color: #64748b;">(${natal.pillars[3].rootingScore}점)</span></td>
                        <td><span style="color: var(--primary);">[기준]</span> <span style="color: #64748b;">(${natal.pillars[2].rootingScore}점)</span></td>
                        <td>${natal.pillars[1].isGongmang ? '<span style="color: #f87171; font-weight: 700;">★공망</span>' : '유효'} <span style="color: #64748b;">(${natal.pillars[1].rootingScore}점)</span></td>
                        <td>${natal.pillars[0].isGongmang ? '<span style="color: #f87171; font-weight: 700;">★공망</span>' : '유효'} <span style="color: #64748b;">(${natal.pillars[0].rootingScore}점)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- [소분류 1-B] 신강약 및 억부·조후 용신 체계 & 오행 분포 -->
              <div style="background: #0b0f19; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <strong style="font-size: 0.88rem; color: #dfe2f1; display: flex; align-items: center; gap: 0.35rem;">
                      <span style="color: #38bdf8; font-size: 0.74rem; font-weight: 800;">1-B</span>
                      신강약 판정 및 억부·조후 용신
                    </strong>
                    <span style="font-size: 0.72rem; color: #64748b;">삶의 균형과 핵심 무기</span>
                  </div>

                  <!-- 일간 및 신강약 배지 -->
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.8rem; background: rgba(0,0,0,0.35); border-radius: 8px; margin-bottom: 0.75rem;">
                    <div>
                      <span style="font-size: 0.72rem; color: var(--text-muted);">일간(나): </span>
                      <strong style="color: var(--primary); font-size: 0.95rem;">${natal.dayMaster.stem}${natal.dayMaster.element}(${natal.dayMaster.hanja})</strong>
                      <span style="font-size: 0.72rem; color: #94a3b8; margin-left: 0.25rem;">[${natal.dayMaster.nature}]</span>
                    </div>
                    <div>
                      <span style="font-size: 0.75rem; font-weight: 800; background: ${natal.strength.classification.includes('강') ? 'rgba(242,202,80,0.2)' : 'rgba(96,165,250,0.2)'}; color: ${natal.strength.classification.includes('강') ? 'var(--primary)' : '#60a5fa'}; padding: 0.2rem 0.55rem; border-radius: 4px;">
                        ${natal.strength.classification} (${natal.strength.score}점)
                      </span>
                    </div>
                  </div>

                  <!-- 용신 카드 -->
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.45rem; text-align: center; margin-bottom: 0.85rem;">
                    <div style="background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); padding: 0.45rem 0.2rem; border-radius: 6px;">
                      <div style="font-size: 0.65rem; color: #34d399; font-weight: 700;">용신(핵심)</div>
                      <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-top: 0.15rem;">${natal.yongshin.yongshin}</div>
                    </div>
                    <div style="background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.25); padding: 0.45rem 0.2rem; border-radius: 6px;">
                      <div style="font-size: 0.65rem; color: #60a5fa; font-weight: 700;">희신(보조)</div>
                      <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-top: 0.15rem;">${natal.yongshin.heeshin}</div>
                    </div>
                    <div style="background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); padding: 0.45rem 0.2rem; border-radius: 6px;">
                      <div style="font-size: 0.65rem; color: #f87171; font-weight: 700;">기신(방해)</div>
                      <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-top: 0.15rem;">${natal.yongshin.gishin}</div>
                    </div>
                    <div style="background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.25); padding: 0.45rem 0.2rem; border-radius: 6px;">
                      <div style="font-size: 0.65rem; color: #fb923c; font-weight: 700;">조후(온도)</div>
                      <div style="font-size: 0.85rem; font-weight: 800; color: #fff; margin-top: 0.15rem;">${natal.yongshin.johuYongshin}</div>
                    </div>
                  </div>
                </div>

                <!-- 오행 분포 바 -->
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                    <span>오행 정량 분포 (목·화·토·금·수)</span>
                    <span>최다: <strong style="color: var(--primary);">${natal.fiveElements.dominant}</strong> / 결핍: <strong style="color: #f87171;">${natal.fiveElements.lacking.join(',') || '없음'}</strong></span>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.35rem; text-align: center;">
                    ${[
                      { label: '목', val: natal.fiveElements.wood, color: '#94a3b8', bg: 'rgba(255,255,255,0.04)' },
                      { label: '화', val: natal.fiveElements.fire, color: '#94a3b8', bg: 'rgba(255,255,255,0.04)' },
                      { label: '토', val: natal.fiveElements.earth, color: '#94a3b8', bg: 'rgba(255,255,255,0.04)' },
                      { label: '금', val: natal.fiveElements.metal, color: '#94a3b8', bg: 'rgba(255,255,255,0.04)' },
                      { label: '수', val: natal.fiveElements.water, color: '#94a3b8', bg: 'rgba(255,255,255,0.04)' }
                    ].map(elem => {
                      const isDominant = natal.fiveElements.dominant === elem.label;
                      const borderStyle = isDominant ? '1px solid #f8fafc' : '1px solid transparent';
                      return `<div style="background: ${elem.bg}; border: ${borderStyle}; padding: 0.35rem; border-radius: 4px; font-size: 0.75rem; color: ${isDominant ? '#fff' : '#cbd5e1'}; font-weight: ${isDominant ? '800' : 'normal'};">
                        ${elem.label}: ${elem.val}${isDominant ? ' (최다)' : ''}
                      </div>`;
                    }).join('')}
                  </div>
                </div>
              </div>

            </div>

            <!-- [소분류 1-C] 생극제화 4대 유통 통로 & 4궁위 생애 환경 -->
            <div style="background: #0b0f19; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                <strong style="font-size: 0.88rem; color: #dfe2f1; display: flex; align-items: center; gap: 0.35rem;">
                  <span style="color: #38bdf8; font-size: 0.74rem; font-weight: 800;">1-C</span>
                  생극제화 4대 유통 통로 게이지 & 4궁위 생애 환경
                </strong>
                <span style="font-size: 0.72rem; color: #64748b;">에너지가 막힘없이 돈을 버는 길인가?</span>
              </div>

              <!-- 4대 유통 통로 게이지 -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                <!-- 식상생재 -->
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.65rem 0.85rem;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 0.3rem;">
                    <span style="color: #34d399; font-weight: 700;">식상생재 (재물 창출력)</span>
                    <span style="font-weight: 800; color: #fff;">${wh.deepStructure.flowChannels.shiksangSaengJae}점</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${wh.deepStructure.flowChannels.shiksangSaengJae}%; height: 100%; background: #34d399;"></div>
                  </div>
                </div>
                <!-- 재생관 -->
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.65rem 0.85rem;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 0.3rem;">
                    <span style="color: #60a5fa; font-weight: 700;">재생관 (사회적 성취)</span>
                    <span style="font-weight: 800; color: #fff;">${wh.deepStructure.flowChannels.jaeSaengGwan}점</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${wh.deepStructure.flowChannels.jaeSaengGwan}%; height: 100%; background: #60a5fa;"></div>
                  </div>
                </div>
                <!-- 관인상생 -->
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.65rem 0.85rem;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 0.3rem;">
                    <span style="color: #f2ca50; font-weight: 700;">관인상생 (명예·조직 안정)</span>
                    <span style="font-weight: 800; color: #fff;">${wh.deepStructure.flowChannels.gwanInSaeng}점</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${wh.deepStructure.flowChannels.gwanInSaeng}%; height: 100%; background: #f2ca50;"></div>
                  </div>
                </div>
                <!-- 비겁분산 -->
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.65rem 0.85rem;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.74rem; margin-bottom: 0.3rem;">
                    <span style="color: #f87171; font-weight: 700;">비겁분산 (재물 누수 위험)</span>
                    <span style="font-weight: 800; color: #fff;">${wh.deepStructure.flowChannels.biGeopBunsan}점</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${wh.deepStructure.flowChannels.biGeopBunsan}%; height: 100%; background: #f87171;"></div>
                  </div>
                </div>
              </div>

              <!-- 공망 & 4궁위 생애 주기 -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.85rem;">
                <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.85rem;">
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.3rem;">공망 판정</div>
                  <div style="font-size: 0.8rem; color: #dfe2f1; line-height: 1.45;">
                    - 일주 기준 공망: <strong style="color: var(--primary);">${wh.deepStructure.gongmang.dayBased.join('·')}</strong> / 년주 기준: <strong style="color: #94a3b8;">${wh.deepStructure.gongmang.yearBased.join('·')}</strong><br/>
                    - 원국 작용: <span style="color: ${wh.deepStructure.gongmang.affectedPillars.length > 0 ? '#f87171' : '#34d399'}; font-weight: 700;">${wh.deepStructure.gongmang.affectedPillars.join(', ') || '없음(온전함)'}</span>
                  </div>
                </div>

                <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.85rem;">
                  <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; margin-bottom: 0.3rem;">4궁위 주기 (시기별 환경)</div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem; font-size: 0.72rem;">
                    <div style="background: rgba(255,255,255,0.04); padding: 0.3rem; border-radius: 4px;">
                      <strong style="color: #94a3b8;">년주(0~19세)</strong>: ${wh.deepStructure.palaces.year.theme}
                    </div>
                    <div style="background: rgba(255,255,255,0.04); padding: 0.3rem; border-radius: 4px;">
                      <strong style="color: #94a3b8;">월주(20~39세)</strong>: ${wh.deepStructure.palaces.month.theme}
                    </div>
                    <div style="background: rgba(255,255,255,0.04); padding: 0.3rem; border-radius: 4px;">
                      <strong style="color: var(--primary);">일주(40~59세)</strong>: ${wh.deepStructure.palaces.day.theme}
                    </div>
                    <div style="background: rgba(255,255,255,0.04); padding: 0.3rem; border-radius: 4px;">
                      <strong style="color: #94a3b8;">시주(60세~)</strong>: ${wh.deepStructure.palaces.hour.theme}
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ` : ''}

      </div>
    ` : ''}


    <!-- ======================================================== -->
    <!-- [대분류 2]: STEP 02. 100년 라이프사이클 궤적 & 9대 영역 관제실 (The Life Arc) -->
    <!-- ======================================================== -->
    ${(activeStage === 'all' || activeStage === 'stage-2') ? `
      <div id="section-stage-2" style="background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        
        <!-- 대분류 2 헤더 (클릭 시 토글) -->
        <div class="btn-toggle-life-stage-header" data-stage="stage-2"
          style="padding: 1rem 1.25rem; background: rgba(255,255,255,0.02); border-bottom: ${isStage2Open ? '1px solid rgba(255,255,255,0.08)' : 'none'}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="background: #0284c7; color: #fff; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 4px;">STEP 02</span>
            <span class="material-symbols-outlined" style="font-size: 20px; color: #38bdf8;">ssid_chart</span>
            <h3 style="font-size: 1.02rem; font-weight: 800; color: #f8fafc; margin: 0;">100년 라이프사이클 & 9대 영역 관제실</h3>
            <span style="font-size: 0.76rem; color: #94a3b8; display: inline-block; margin-left: 0.4rem;">
              — 0~100세 인생 굴곡(황금기 vs 고비)과 9대 생활 영역(재물·직업·건강 등) 신호등 조망
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.72rem; color: #64748b; background: rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px;">소분류 3개</span>
            <span class="material-symbols-outlined" style="font-size: 20px; color: #94a3b8; transition: transform 0.2s ease; transform: ${isStage2Open ? 'rotate(180deg)' : 'rotate(0deg)'};">expand_more</span>
          </div>
        </div>

        <!-- 대분류 2 본문 (펼침 상태일 때만 노출) -->
        ${isStage2Open ? `
          <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem;">
            
            <!-- 인지 가이드 배너 -->
            <div style="background: rgba(56, 189, 248, 0.06); border-left: 3px solid #38bdf8; border-radius: 0 8px 8px 0; padding: 0.65rem 0.95rem; font-size: 0.78rem; color: #cbd5e1; line-height: 1.5;">
              <strong style="color: #38bdf8;">💡 [2단계에서 무엇을 보고 알 수 있나?]</strong><br/>
              0세부터 100세까지 내 인생의 전성기(Peak)와 침체기(Trough)가 언제 찾아오는지 그래프로 한눈에 보고, 재물운·직업운·건강운 등 9대 영역별 신호등 상태와 명리 요인(상충마살, 귀인 등)의 지식 해설을 파악합니다.
            </div>

            <!-- [소분류 2-A, 2-B, 2-C 통합 히어로 카드 렌더링] -->
            ${regularHeroCardHtml}

          </div>
        ` : ''}

      </div>
    ` : ''}


    <!-- ======================================================== -->
    <!-- [대분류 3]: STEP 03. 시간축 심층 인과 드릴다운실 (The Deep Dive) -->
    <!-- ======================================================== -->
    ${(activeStage === 'all' || activeStage === 'stage-3') ? `
      <div id="section-stage-3" style="background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        
        <!-- 대분류 3 헤더 (클릭 시 토글) -->
        <div class="btn-toggle-life-stage-header" data-stage="stage-3"
          style="padding: 1rem 1.25rem; background: rgba(255,255,255,0.02); border-bottom: ${isStage3Open ? '1px solid rgba(255,255,255,0.08)' : 'none'}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="background: #0284c7; color: #fff; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 4px;">STEP 03</span>
            <span class="material-symbols-outlined" style="font-size: 20px; color: #38bdf8;">alt_route</span>
            <h3 style="font-size: 1.02rem; font-weight: 800; color: #f8fafc; margin: 0;">시간축 심층 인과 드릴다운실 (대운 ➔ 세운 ➔ 월운)</h3>
            <span style="font-size: 0.76rem; color: #94a3b8; display: inline-block; margin-left: 0.4rem;">
              — 클릭하여 10년 대운 ➔ 1년 세운 ➔ 12개월 월운으로 사건 기전 추적
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.72rem; color: #64748b; background: rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px;">소분류 3개</span>
            <span class="material-symbols-outlined" style="font-size: 20px; color: #94a3b8; transition: transform 0.2s ease; transform: ${isStage3Open ? 'rotate(180deg)' : 'rotate(0deg)'};">expand_more</span>
          </div>
        </div>

        <!-- 대분류 3 본문 (펼침 상태일 때만 노출) -->
        ${isStage3Open ? `
          <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem;">
            
            <!-- 조작 프로세스 가이드 배너 -->
            <div style="background: rgba(2, 132, 199, 0.08); border: 1.5px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 0.85rem 1.15rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.65rem;">
              <div style="display: flex; align-items: center; gap: 0.65rem;">
                <span class="material-symbols-outlined" style="font-size: 22px; color: #38bdf8;">ads_click</span>
                <div style="font-size: 0.82rem; color: #e2e8f0; line-height: 1.45;">
                  <strong style="color: #38bdf8;">👉 [클릭 드릴다운 추천 순서]:</strong><br/>
                  <span style="color: #fff; font-weight: 700;">① 10개 대운 카드 중 하나 클릭</span> ➔ 
                  <span style="color: #fff; font-weight: 700;">② 아래 10년 세운표에서 특정 연도 행 클릭</span> ➔ 
                  <span style="color: #38bdf8; font-weight: 800;">③ 하단 12개월 월운 주기표와 지장간 인과 자동 전개!</span>
                </div>
              </div>
              <div style="font-size: 0.75rem; color: #94a3b8; background: rgba(0,0,0,0.3); padding: 0.3rem 0.65rem; border-radius: 6px;">
                현재 선택: <strong style="color: #f8fafc;">제${selectedDw.order}대운(${selectedDw.ganji})</strong> · <strong style="color: #38bdf8;">${curSewoon.year}년(${curSewoon.ganji}년)</strong>
              </div>
            </div>

            <!-- [소분류 3-A]: 10개 대운 파노라마 (10년 주기 조망) -->
            <div style="background: #0b0f19; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                <strong style="font-size: 0.88rem; color: #dfe2f1; display: flex; align-items: center; gap: 0.35rem;">
                  <span style="color: #38bdf8; font-size: 0.74rem; font-weight: 800;">3-A</span>
                  대운별 구체적 현황 (10개 대운 파노라마 — 카드 클릭 시 하위 세운 변경)
                </strong>
                <span style="font-size: 0.72rem; color: #64748b;">원하는 대운 카드를 클릭하세요</span>
              </div>

              <!-- 10개 대운 카드 그리드 -->
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.65rem;">
                ${renderDaewoonPanoramaCards(daewoon, currentOrder)}
              </div>
            </div>

            <!-- [소분류 3-B]: 선택 대운의 10년 세운 매트릭스 (1년 주기 조망) -->
            <div style="background: #0b0f19; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 1.15rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                <strong style="font-size: 0.88rem; color: #dfe2f1; display: flex; align-items: center; gap: 0.35rem;">
                  <span style="color: #38bdf8; font-size: 0.74rem; font-weight: 800;">3-B</span>
                  제${selectedDw.order}대운(${selectedDw.ganji}) (${selectedDw.startYear}~${selectedDw.endYear}) 10년 세운 상세 매트릭스
                </strong>
                <span style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;">★ 연도 행을 클릭하면 하단 12개월 월운이 즉시 연동됩니다</span>
              </div>

              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8rem; color: #e2e8f0;">
                  <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.12); color: #94a3b8; font-size: 0.73rem;">
                      <th style="padding: 0.5rem;">연도</th>
                      <th style="padding: 0.5rem;">간지</th>
                      <th style="padding: 0.5rem;">십신</th>
                      <th style="padding: 0.5rem;">12운성</th>
                      <th style="padding: 0.5rem;">계단</th>
                      <th style="padding: 0.5rem;">판정</th>
                      <th style="padding: 0.5rem;">하강 요인</th>
                      <th style="padding: 0.5rem;">상승 요인</th>
                      <th style="padding: 0.5rem; text-align: center;">선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderSewoonMatrixTable(dwSewoon, selectedYear)}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- [소분류 3-C]: 선택 연도의 12개월(월운) 정밀 주기표 및 지장간 충돌 기전 (1개월 주기 조망) -->
            <div style="background: #0b0f19; border: 1.5px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 1.15rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <strong style="font-size: 0.88rem; color: #dfe2f1; display: flex; align-items: center; gap: 0.35rem;">
                    <span style="color: #38bdf8; font-size: 0.74rem; font-weight: 800;">3-C</span>
                    ${curSewoon.year}년 (${curSewoon.ganji}년) 12개월(월운) 정밀 주기표 & 지장간 인과 산식
                  </strong>
                  <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 0.2rem;">
                    1월부터 12월까지의 월별 길흉 궤적과 "몇 월에 계약하고, 몇 월에 조심해야 하는가?"의 타이밍을 확인합니다.
                  </div>
                </div>

                <span style="font-size: 0.75rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 0.25rem 0.6rem; border-radius: 6px;">
                  기준: ${curSewoon.year}년
                </span>
              </div>

              <!-- 12개월 주기표 렌더링 -->
              <div style="margin-top: 0.5rem;">
                ${render12MonthsCycleView(wh, curSewoon.year, false)}
              </div>

              <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem;">
                ${render12MonthsExplanationArea(wh, curSewoon.year)}
              </div>
            </div>

          </div>
        ` : ''}

      </div>
    ` : ''}


    <!-- ======================================================== -->
    <!-- [대분류 4]: STEP 04. B2B 패킷 & 결과지 품질 대조실 (Verification & Export) -->
    <!-- ======================================================== -->
    ${(activeStage === 'all' || activeStage === 'stage-4') ? `
      <div id="section-stage-4" style="background: #0f172a; border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        
        <!-- 대분류 4 헤더 (클릭 시 토글) -->
        <div class="btn-toggle-life-stage-header" data-stage="stage-4"
          style="padding: 1rem 1.25rem; background: rgba(255,255,255,0.02); border-bottom: ${isStage4Open ? '1px solid rgba(255,255,255,0.08)' : 'none'}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="background: var(--primary); color: #1c1500; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 4px;">STEP 04</span>
            <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">compare_arrows</span>
            <h3 style="font-size: 1.02rem; font-weight: 800; color: #f8fafc; margin: 0;">B2B 근거 패킷 & 결과지 품질 대조실</h3>
            <span style="font-size: 0.76rem; color: #94a3b8; display: inline-block; margin-left: 0.4rem;">
              — AI 표준 JSON 패킷 덤프 & [기존 vs V2 백세인생 팩트 연동] Side-by-Side 비교
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.72rem; color: #64748b; background: rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px;">소분류 2개</span>
            <span class="material-symbols-outlined" style="font-size: 20px; color: #94a3b8; transition: transform 0.2s ease; transform: ${isStage4Open ? 'rotate(180deg)' : 'rotate(0deg)'};">expand_more</span>
          </div>
        </div>

        <!-- 대분류 4 본문 (펼침 상태일 때만 노출) -->
        ${isStage4Open ? `
          <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem;">
            
            <!-- 인지 가이드 배너 -->
            <div style="background: rgba(242, 202, 80, 0.08); border-left: 3px solid var(--primary); border-radius: 0 8px 8px 0; padding: 0.65rem 0.95rem; font-size: 0.78rem; color: #cbd5e1; line-height: 1.5;">
              <strong style="color: var(--primary);">💡 [4단계에서 무엇을 보고 알 수 있나?]</strong><br/>
              외부 AI 및 파트너사에 전달되는 문장 없는 순수 팩트 패킷(<strong style="color: #fff;">Saju Evidence Packet v1</strong>)의 정합성을 검증하고, 실제 고객에게 서비스되는 결과지가 백세인생 팩트와 결합되었을 때 문맥과 디테일이 어떻게 극대화되는지 나란히 대조합니다.
            </div>

            <!-- [소분류 4-A]: [B2B / AI 표준] Saju Evidence Packet v1 (JSON 아코디언) -->
            <div style="background: #0b0f19; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 1.15rem;">
              <details>
                <summary style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <span style="font-size: 0.74rem; font-weight: 800; color: #38bdf8;">4-A</span>
                    <span class="material-symbols-outlined" style="font-size: 18px;">dataset</span>
                    [B2B / AI 표준] Saju Evidence Packet v1 (문장 없는 순수 팩트 데이터 JSON 프리뷰)
                  </div>
                  <span style="font-size: 0.72rem; color: #64748b;">클릭하여 JSON 펼치기</span>
                </summary>
                <div style="margin-top: 0.85rem; padding: 1rem; background: #070a13; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; max-height: 320px; overflow-y: auto;">
                  <pre style="margin: 0; font-family: monospace; font-size: 0.73rem; color: #7dd3fc; white-space: pre-wrap;">${JSON.stringify(buildEvidencePacket(wh, { wolwoonYears: [curSewoon.year] }), null, 2)}</pre>
                </div>
              </details>
            </div>

            <!-- [소분류 4-B]: 기존 결과지 vs V2 백세인생 연동 결과지 Side-by-Side 대조 -->
            <div id="section-report-comparison" style="background: #0b0f19; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <strong style="font-size: 0.95rem; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 0.4rem;">
                    <span style="color: var(--primary); font-size: 0.76rem; font-weight: 800;">4-B</span>
                    [품질 검증 안전망] 기존 결과지 vs V2 백세인생 팩트 연동 결과지 나란히 대조
                  </strong>
                  <p style="font-size: 0.78rem; color: #94a3b8; margin: 0.25rem 0 0; line-height: 1.45;">
                    기존 서술 문체의 유려함은 100% 보존하면서, 뜬구름 잡는 일반론 자리에 백세인생의 100년 대운과 2026년 축오해(지장간 정계충), 12개월 최고/최저 시기가 어떻게 구체적으로 주입되었는지 양쪽을 직접 대조할 수 있습니다.
                  </p>
                </div>
                <span style="font-size: 0.74rem; color: #94a3b8; background: rgba(255,255,255,0.06); padding: 0.2rem 0.55rem; border-radius: 4px;">
                  대표님 승인 전까지 실제 배포 없음 (Zero-Risk)
                </span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-top: 1rem;">
                <!-- 좌측: 기존 원본 결과지 -->
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 1.15rem; max-height: 520px; overflow-y: auto;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.45rem;">
                    <strong style="font-size: 0.85rem; color: #94a3b8;">[A. 기존 원본 무료 결과지]</strong>
                    <span style="font-size: 0.7rem; color: #64748b;">일반 템플릿 서술</span>
                  </div>
                  <div style="font-size: 0.8rem; line-height: 1.7; color: #cbd5e1;">
                    ${renderNarrativeReport(getFreeReportMarkdown(extractReportContext(appState.getState())))}
                  </div>
                </div>

                <!-- 우측: V2 백세인생 팩트 주입 결과지 -->
                <div style="background: rgba(56, 189, 248, 0.04); border: 1.5px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 1.15rem; max-height: 520px; overflow-y: auto;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(56, 189, 248, 0.3); padding-bottom: 0.45rem;">
                    <strong style="font-size: 0.85rem; color: #38bdf8;">[B. V2 백세인생 정밀 팩트 연동 결과지]</strong>
                    <span style="font-size: 0.7rem; color: #38bdf8; font-weight: 700;">대운수·축오해·월별 타이밍 보강</span>
                  </div>
                  <div style="font-size: 0.8rem; line-height: 1.7; color: #e2e8f0;">
                    ${renderNarrativeReport(getEnrichedFreeReportMarkdown(appState.getState(), wh))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ` : ''}

      </div>
    ` : ''}

  </div>
  `;
}

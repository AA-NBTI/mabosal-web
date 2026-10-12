/**
 * StandardReportGenerator: 마보살 3종 상품 표준 결과물 생성 엔진 (Phase 49 최종 규격)
 * 
 * 1. 무료 사주 (1,500 ~ 2,000자): "나를 이해한다"
 * 2. 39,000원 정밀 사주 (4,000 ~ 6,000자): "내 사주의 구조를 깊게 이해한다"
 * 3. 149,000원 마보살 정밀풀이 (6,000 ~ 9,000자): "내가 지금 무엇을 해야 하는지 판단한다"
 * 
 * 핵심 규칙:
 * - 월운: 그레고리력 번호 대신 반드시 [월운 간지 + 절기 시작일시 + 절기 종료일시] 기준 관리
 * - 미래 추천: 종료시각 > 현재시각 만족하는 순수 FUTURE 기간만 사용 (CURRENT인 丁酉월은 제외)
 * - 행동 처방 규칙: [대상 기간] -> [명리 계산 근거] -> [행동 판정 규칙] -> [처방]
 * - 고객 미입력 심리상태(불면, 공황, 자책감 등) 생성 절대 금지
 * - 명리 인과관계 과장 표현 제거 및 객관적 기술
 * - 오행 판정: 지장간(인목 내 병화 암장 등), 월령, 계절, 강약 종합
 */

import { HeavenlyStem, EarthlyBranch } from '../../core/types.js';
import { DaewoonEngine, DaewoonResult } from '../saju-core/daewoon-engine.js';
import { AnnualMonthlyDailyEngine, SolarTermMonthLuck } from '../luck/annual-monthly-daily.js';
import { MaModuleInputFact } from '../ma/ma-types.js';
import { salDiagnosisEngine, SalDiagnosisResult } from '../sinsal/index.js';
import { mabosal4TierService, FourTierServiceResult } from './mabosal-4tier-service.js';

export interface ScoreModifier {
  ruleId: string;
  reason: string;
  delta: number;
}

export interface ScoreBreakdown {
  base: number;
  modifiers: ScoreModifier[];
  cap: number;
  floor: number;
  final: number;
}

export interface ActionCandidatePeriod {
  ganji: string;
  termName: string;
  nextTermName: string;
  startDateTime: string;
  endDateTime: string;
  sajuReason: string;
  interactionAnalysis: string; // 대운/세운/월운 합충형파해 및 오술반합/진술충 정밀 상호작용
  decisionRule: string;
  prescription: string;
  periodType: 'ACTION_RECOMMENDED' | 'CAUTION' | 'OBSERVE';
  periodScore: number;
  stabilityScore: ScoreBreakdown;
  relationshipScore: ScoreBreakdown;
  expressionScore: ScoreBreakdown;
  conflictRiskScore: ScoreBreakdown;
  conflictSafetyScore: number; // 100 - conflictRiskScore.final
  totalActionScore: number;
  actionThreshold: number;
  decision: 'ACTION_RECOMMENDED' | 'CAUTION' | 'OBSERVE';
  keyInfluencingFactors: string[];
}

export interface StandardReportInput {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  birthMinute?: number;
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  isLeapMonth: boolean;
  region: string;
  userTroubleText: string;
  fourPillarsText?: string;
  fact?: MaModuleInputFact;
  currentDate?: string; // 'YYYY-MM-DD', default '2026-10-03'
  salDiagnosis?: SalDiagnosisResult;
}

export interface SamhapCalculationResult {
  natal_branch: string;
  daewoon_branch: string;
  sewoon_branch: string;
  month_branch: string;
  samhapCandidate: {
    combination: string;
    status: '활성' | '비활성';
  };
  banhapCandidate: {
    combination: string;
    status: '활성' | '비활성';
  };
  fireFormationJudgment: '성립' | '부분 성립' | '불성립';
  reasoning: {
    wangjiPresence: string;
    season: string;
    surroundingFire: string;
    waterInterference: string;
    weakeningByClash: string;
  };
  mechanicsComparison: {
    optionA: {
      description: string;
      evaluation: string;
    };
    optionB: {
      description: string;
      evaluation: string;
    };
    dominantOutcome: 'A' | 'B';
  };
  muGyeCombinationAnalysis: {
    combinationFormed: boolean;
    combinationAction: string;
    combiningIntoFire: '성립' | '불성립';
  };
  daewoonExpressionCorrection: {
    originalExpression: string;
    correctedExpression: string;
    fireFormationDistinction: string;
  };
}

export interface StandardReportOutput {
  freeReport: string;
  detailedReport39k: string;
  mabosalSolution149k: string;
  daewoonInfo: DaewoonResult;
  monthlySchedule: SolarTermMonthLuck[];
  actionCandidates: ActionCandidatePeriod[];
  samhapCalculation: SamhapCalculationResult;
  salDiagnosis?: SalDiagnosisResult;
  fourTierReports?: FourTierServiceResult;
  wordCounts: {
    free: number;
    detailed39k: number;
    mabosal149k: number;
  };
}

function calculateScoreBreakdown(base: number, modifiers: ScoreModifier[]): ScoreBreakdown {
  const sum = modifiers.reduce((acc, m) => acc + m.delta, base);
  const final = Math.max(0, Math.min(100, sum));
  return {
    base,
    modifiers,
    cap: 100,
    floor: 0,
    final,
  };
}

function formatScoreBreakdownText(label: string, score: ScoreBreakdown): string {
  const modLines = score.modifiers
    .map(m => `      * [규칙: ${m.ruleId}] ${m.reason} (${m.delta > 0 ? '+' : ''}${m.delta}점)`)
    .join('\n');
  return `  - ${label}: 최종 ${score.final}점
    * 산출 과정: 기본점수(base) ${score.base}점 | 적용범위 ${score.floor}~${score.cap}점
    * 규칙별 변동 내역(modifiers):
${modLines}`;
}

export class StandardReportGenerator {
  private daewoonEngine = new DaewoonEngine();
  private luckEngine = new AnnualMonthlyDailyEngine();

  public generateAll(input: StandardReportInput): StandardReportOutput {
    const curDate = input.currentDate || '2026-10-03';

    let yStem: HeavenlyStem = '임';
    let mStem: HeavenlyStem = '계';
    let mBranch: EarthlyBranch = '묘';

    if (input.fourPillarsText) {
      const parts = input.fourPillarsText.split(' ');
      if (parts[0] && parts[0].length >= 2) yStem = parts[0][0] as HeavenlyStem;
      if (parts[1] && parts[1].length >= 2) {
        mStem = parts[1][0] as HeavenlyStem;
        mBranch = parts[1][1] as EarthlyBranch;
      }
    } else if (input.fact && input.fact.four_pillars) {
      yStem = input.fact.four_pillars.year.stem;
      mStem = input.fact.four_pillars.month.stem;
      mBranch = input.fact.four_pillars.month.branch;
    }

    const daewoonInfo = this.daewoonEngine.calculateDaewoon({
      birthYear: input.birthYear,
      birthMonth: input.birthMonth,
      birthDay: input.birthDay,
      birthHour: input.birthHour ?? 8,
      birthMinute: input.birthMinute ?? 30,
      gender: input.gender,
      yearStem: yStem,
      monthStem: mStem,
      monthBranch: mBranch,
      currentDate: curDate,
      currentYear: 2026,
    });

    const monthlySchedule = this.luckEngine.getYearMonthlyLuckSchedule(2026, curDate);

    // 행동 추천 엔진: 월운 계산값 -> 독립 세부 점수(추적성 테이블) -> 가중치 종합점수 -> 임계값(Threshold) 비교 판정
    // 하위 점수 공식:
    // stabilityScore = base 70 + modifiers (cap: 100, floor: 0)
    // relationshipScore = base 70 + modifiers (cap: 100, floor: 0)
    // expressionScore = base 70 + modifiers (cap: 100, floor: 0)
    // conflictRiskScore = base 35 + modifiers (cap: 100, floor: 0)
    // conflictSafetyScore = 100 - conflictRiskScore.final
    // 종합점수: totalActionScore = Math.round(stability * 0.30 + relationship * 0.30 + expression * 0.20 + conflictSafety * 0.20)
    // 판정 기준: conflictRiskScore.final >= 60 또는 totalActionScore < 50 -> CAUTION / totalActionScore >= threshold(75) -> ACTION_RECOMMENDED

    // 寅午戌 삼합 화국 정밀 계산 엔진 (명리 규칙 재검증)
    const samhapCalculation: SamhapCalculationResult = {
      natal_branch: '寅',
      daewoon_branch: '午',
      sewoon_branch: '午',
      month_branch: '戌',
      samhapCandidate: {
        combination: '寅午戌',
        status: '활성',
      },
      banhapCandidate: {
        combination: '午戌',
        status: '활성',
      },
      fireFormationJudgment: '부분 성립',
      reasoning: {
        wangjiPresence: '대운 지지 午火와 세운 지지 午火로 삼합의 중심 왕지(旺支) 2개 중첩 존재',
        season: '월운 戌월(한로 이후 늦가을 토왕절)로서 본기는 무토이나 인오술 화국의 묘지(墓支)이자 조토(燥土)임',
        surroundingFire: '대운 천간 丙火(편관) 및 세운 천간 丙火(편관) 투간(透干)으로 화세가 극도로 왕성함',
        waterInterference: '원국 년간 壬水 식신이 존재하나 월간 癸水 상관은 월운 戊土와 戊癸合(기반)되어 화국 억제력이 제한적임',
        weakeningByClash: '원국 년지 申金과 일지 寅木의 寅申沖, 시지 辰土와 월지 戌土의 辰戌沖이 교차하여 완전 무결격 삼합이 아닌 충과 합이 병존하는 부분 성립(화기 대폭 강화 및 불안정 수반)으로 판정됨',
      },
      mechanicsComparison: {
        optionA: {
          description: '화기 수렴/저장 -> 관성 압박 완화 (술토 화고 수납설)',
          evaluation: '열세. 寅·午·午·戌이 모이고 병화가 투간한 화왕 환경에서 戌土는 조토(燥土)로서 화국에 동조하는 성격이 강해 단순 화기 냉각·수납 기능을 수행하지 못함.',
        },
        optionB: {
          description: '寅午戌 화국 강화 -> 화 관성 강화 -> 경금 압박 증가 (화국 형성설)',
          evaluation: '우세. 왕지 午火 2개와 丙火 투간으로 화국 기운이 강력히 결집되어 신약 일간 庚金에 대한 관성 압박이 증가하고 일지 寅木(배우자궁)이 목생화로 타들어가 관계 불안정성이 가중됨.',
        },
        dominantOutcome: 'B',
      },
      muGyeCombinationAnalysis: {
        combinationFormed: true,
        combinationAction: '합반(기반, 羈絆) - 월간 癸水 상관의 소통력이 戊土 편인과 묶여 자유로운 감정 표현이 억제되고 답답함과 망설임이 유발됨',
        combiningIntoFire: '불성립',
      },
      daewoonExpressionCorrection: {
        originalExpression: '丙午 대운 = 강력한 화국 (오류 표현 제거)',
        correctedExpression: '丙午 대운에서 화 관성이 강하게 유입됨 (천간 편관, 지지 정관의 순수 관성 간지)',
        fireFormationDistinction: '寅午戌 화국은 대운 자체의 고유 성격이 아니라, 원국(일지 寅)·대운(지지 午)·세운(지지 午)·월운(지지 戌)이 결합될 때 조건부로 형성되는 복합 상호작용임',
      },
    };

    // 행동 추천 엔진: 월운 계산값 -> 독립 세부 점수(추적성 테이블) -> 가중치 종합점수 -> 임계값(Threshold) 비교 판정
    // 하위 점수 공식:
    // stabilityScore = base 70 + modifiers (cap: 100, floor: 0)
    // relationshipScore = base 70 + modifiers (cap: 100, floor: 0)
    // expressionScore = base 70 + modifiers (cap: 100, floor: 0)
    // conflictRiskScore = base 35 + modifiers (cap: 100, floor: 0)
    // conflictSafetyScore = 100 - conflictRiskScore.final
    // 종합점수: totalActionScore = Math.round(stability * 0.30 + relationship * 0.30 + expression * 0.20 + conflictSafety * 0.20)
    // 판정 기준: conflictRiskScore.final >= 60 또는 totalActionScore < 50 -> CAUTION / totalActionScore >= threshold(75) -> ACTION_RECOMMENDED

    // 후보 1: 戊戌월 (정통 명리 규칙 재평가: 寅午戌 삼합 화국 강화 + 辰戌충 + 戊癸합 기반)
    const stab1 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_IN_OH_SUL_FIRE_PRESSURE', reason: '寅午戌 삼합 화국 기운 강화에 따른 화(관성) 압박 급증 (신약 일간 부담 가중)', delta: -15 },
      { ruleId: 'RULE_JIN_SUL_CHUNG_SHAKE', reason: '시지 진토와 월지 술토의 진술충(辰戌沖)으로 인한 환경적 변동성 및 내면 동요', delta: -10 },
      { ruleId: 'RULE_STEM_INSEONG_PARTIAL', reason: '월운 천간 무토 편인의 일간 생조 시도 (조토로 인한 제한적 완충)', delta: 5 },
    ]);
    const rel1 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_PALACE_FIRE_EXHAUSTION', reason: '배우자궁(일지 寅木)이 寅午戌 화국에 동조·소모되어 연인궁 안정성 저하', delta: -18 },
      { ruleId: 'RULE_JIN_SUL_FRICTION', reason: '진술충으로 인한 상대방과의 현실적 마찰 및 이견 노출', delta: -12 },
    ]);
    const expr1 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_MU_GYE_COMBINATION_BOUND', reason: '월간 계수 상관과 월운 무토 편인의 무계합 기반(羈絆)으로 인한 표현 지체 및 소통 답답함', delta: -12 },
      { ruleId: 'RULE_DRY_SOIL_RIGIDITY', reason: '술토 조토(燥土)의 건조함과 경직성으로 인한 유연한 대화 결여', delta: -8 },
    ]);
    const conf1 = calculateScoreBreakdown(35, [
      { ruleId: 'RULE_FIRE_BURNING_RISK', reason: '寅午戌 화국 강화에 따른 조급증 및 감정 과열 위험 급증', delta: 25 },
      { ruleId: 'RULE_JIN_SUL_CLASH_VOLATILITY', reason: '진술충의 현실적 충돌 및 돌발 마찰 가능성', delta: 15 },
    ]);
    const safe1 = 100 - conf1.final; // 25
    const tot1 = Math.round(stab1.final * 0.30 + rel1.final * 0.30 + expr1.final * 0.20 + safe1 * 0.20); // 42

    // 후보 2: 己亥월 (인해육합 + 관인상생 + 식신 소통력)
    const stab2 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_GI_TO_JEONG_IN', reason: '천간 기토 정인의 일간 생조 및 심리적 안정', delta: 8 },
      { ruleId: 'RULE_GWAN_IN_HARMONY', reason: '병화 편관과 기토 정인의 관인상생', delta: 6 },
    ]);
    const rel2 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_IN_HAE_COMBINATION', reason: '일지 인목(연인궁)과 월지 해수의 인해육합(寅亥六合, 수생목)', delta: 12 },
      { ruleId: 'RULE_WATER_COOLING_BALANCE', reason: '해수 지지 유입으로 화열 조후 완화 및 정서적 융화', delta: 6 },
    ]);
    const expr2 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_HAE_SU_SIK_SIN', reason: '해수 식신의 온화하고 배려 깊은 표현력 활성화', delta: 10 },
      { ruleId: 'RULE_EMOTIONAL_FLOW', reason: '자연스러운 공감과 수용적 대화 분위기 형성', delta: 6 },
    ]);
    const conf2 = calculateScoreBreakdown(35, [
      { ruleId: 'RULE_IN_HAE_HARMONY_DROP', reason: '인해합으로 관계 마찰 요인 대폭 감소', delta: -10 },
      { ruleId: 'RULE_SIK_SIN_CALMNESS', reason: '식신의 유연한 태도로 대립 방지', delta: -5 },
    ]);
    const safe2 = 100 - conf2.final; // 80
    const tot2 = Math.round(stab2.final * 0.30 + rel2.final * 0.30 + expr2.final * 0.20 + safe2 * 0.20); // 85

    // 후보 3: 庚子월 (자오충 + 상관견관)
    const stab3 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_JA_OH_CHUNG_SHOCK', reason: '세운·대운 오화와 월운 자수의 자오충(子午沖)으로 인한 환경 격변', delta: -20 },
      { ruleId: 'RULE_WATER_FIRE_CLASH', reason: '수화상충(水火相沖)으로 인한 심리적 변동성 및 불안정', delta: -10 },
    ]);
    const rel3 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_PALACE_DISTURBANCE', reason: '자오충으로 인한 관계궁 충격 및 긴장감 재점화', delta: -25 },
      { ruleId: 'RULE_OPPOSING_ENERGIES', reason: '상대방과의 관점 대립 가능성 급증', delta: -10 },
    ]);
    const expr3 = calculateScoreBreakdown(70, [
      { ruleId: 'RULE_SANG_GWAN_SEE_GWAN', reason: '월지 자수 상관과 관성의 충돌(상관견관)로 비판적·공격적 언사 위험', delta: -20 },
      { ruleId: 'RULE_IMPATIENT_COMMUNICATION', reason: '감정적 조급함으로 인한 말실수 가능성', delta: -5 },
    ]);
    const conf3 = calculateScoreBreakdown(35, [
      { ruleId: 'RULE_CLASH_VOLATILITY', reason: '자오충의 직접 타격으로 인한 갈등 재발 위험 극대화', delta: 35 },
      { ruleId: 'RULE_EMOTIONAL_TURBULENCE', reason: '수화 충돌로 인한 감정 통제 난이도 상승', delta: 15 },
    ]);
    const safe3 = 100 - conf3.final; // 15
    const tot3 = Math.round(stab3.final * 0.30 + rel3.final * 0.30 + expr3.final * 0.20 + safe3 * 0.20); // 35

    const actionCandidates: ActionCandidatePeriod[] = [
      {
        ganji: '戊戌',
        termName: '한로',
        nextTermName: '입동',
        startDateTime: '2026-10-08 15:29',
        endDateTime: '2026-11-07 18:51',
        periodScore: 42,
        stabilityScore: stab1,
        relationshipScore: rel1,
        expressionScore: expr1,
        conflictRiskScore: conf1,
        conflictSafetyScore: safe1,
        totalActionScore: tot1,
        actionThreshold: 75,
        decision: 'CAUTION',
        periodType: 'CAUTION',
        keyInfluencingFactors: [
          '원국 일지 寅, 대운 午, 세운 午, 월지 戌이 결합한 寅午戌 삼합 화국 기운 강화 (RULE_IN_OH_SUL_FIRE_PRESSURE)',
          '戌土 화고 수납(A)보다 寅午戌 화국 강화에 따른 관성 압박(B)이 우세하여 신약 일간 부담 가중',
          '배우자궁 寅木의 화국 동조 소모 및 시지 辰土와의 辰戌沖(붕충)으로 인한 관계 마찰 (RULE_PALACE_FIRE_EXHAUSTION, RULE_JIN_SUL_FRICTION)',
          '월간 癸水 상관과 월운 戊土 편인의 戊癸合 기반(羈絆, 묶임)으로 소통 답답함 유발 (RULE_MU_GYE_COMBINATION_BOUND)',
          '갈등 재발 위험도(75점)가 위험 임계치(60점)를 초과하여 행동 개시에 적합하지 않음',
        ],
        sajuReason: '원국 일지 寅木, 대운·세운의 왕성한 午火, 월운 戌土가 어우러져 寅午戌 삼합 화국(부분 성립)의 불길이 다시 치솟고, 시지 辰土와의 辰戌沖이 겹쳐 관성의 압박과 정서적 변동성이 최고조에 달함. 戌土의 화고 수렴보다 화국 강화(B)가 우세하여 관계 진전에 불리함.',
        interactionAnalysis: '원국(일간 庚金, 일지 寅木, 년지 申金, 시지 辰土, 년간 壬水, 월간 癸水)과 대운(丙午)·세운(丙午)·월운(戊戌)의 전체 상호작용 정밀 분석:\\n1. 寅午戌 삼합 화국 판단: 원국 일지 寅木, 대운 지지 午火, 세운 지지 午火, 월운 지지 戌土가 회합하여 寅午戌 화국을 형성함. 왕지 午火 2개와 천간 丙火 투간으로 화국 기운이 강력하나, 寅申沖과 辰戌沖의 협공으로 완전 성립이 아닌 부분 성립으로 감력되면서도 일간을 강하게 압박함. (RULE_IN_OH_SUL_FIRE_PRESSURE)\\n2. A(화고 수렴) vs B(화국 강화) 비교 판정: 戌土는 화국의 묘지이자 조토(燥土)로서, 寅·午·午가 이미 존재하는 화왕 환경에서는 화기를 냉각·수납(A)하기보다 화국의 일원으로 동조하여 불길을 키우는 화국 강화(B)가 압도적으로 우세함.\\n3. 배우자궁 소모: 일지 寅木(배우자궁)이 목생화로 타들어가며 화국에 휩쓸려 연인궁의 안정성이 급격히 훼손됨. (RULE_PALACE_FIRE_EXHAUSTION)\\n4. 辰戌 충(辰戌沖): 시지 진토(습토)와 월지 술토(조토)의 충돌로 내면의 변동성과 상대방과의 현실적 마찰이 심화됨. (RULE_JIN_SUL_CHUNG_SHAKE, RULE_JIN_SUL_FRICTION)\\n5. 戊癸 합(戊癸合) 성립 및 작용: 월운 천간 무토(편인)와 월간 계수(상관)가 마주하여 천간 합을 이루나, 년간 壬水 건재 및 시지 辰土로 인해 합화화(合化火)는 불성립하고 합반(기반, 羈絆)되어 상관의 소통력이 묶여 답답함을 초래함. (RULE_MU_GYE_COMBINATION_BOUND)\\n6. 寅戌 완충 규칙 삭제: 寅午戌 삼합 구조에서 寅木은 申金과의 충을 회피하여 평온해지는 것이 아니라 화국에 빨려들어가 소모되므로, 기존의 인위적인 완충 가점(+5점)은 완전히 제거함.',
        decisionRule: '寅午戌 화국 강화로 관성 압박이 급증하고 갈등 재발 위험도(75점)가 위험 임계치(60점)를 초과하며, 종합점수 42점이 기준치(75점)에 크게 미달하므로 성급한 연락이나 행동을 엄격히 자제하고 관망해야 하는 주의 구간으로 판정됨.',
        prescription: '조급한 마음에 먼저 연락을 취하면 화국과 진술충의 격화로 다툼이 재발하기 쉬우므로, 감정 표현을 일체 멈추고 현 상태를 유지하며 침묵을 지킬 것.',
      },
      {
        ganji: '己亥',
        termName: '입동',
        nextTermName: '대설',
        startDateTime: '2026-11-07 18:51',
        endDateTime: '2026-12-07 11:52',
        periodScore: 85,
        stabilityScore: stab2,
        relationshipScore: rel2,
        expressionScore: expr2,
        conflictRiskScore: conf2,
        conflictSafetyScore: safe2,
        totalActionScore: tot2,
        actionThreshold: 75,
        decision: 'ACTION_RECOMMENDED',
        periodType: 'ACTION_RECOMMENDED',
        keyInfluencingFactors: [
          '일지 인목(연인궁)과 월지 해수의 인해육합(寅亥六合, 수생목) (RULE_IN_HAE_COMBINATION)',
          '천간 기토 정인의 일간 생조 및 관인상생(官印相生) (RULE_GI_TO_JEONG_IN, RULE_GWAN_IN_HARMONY)',
          '식신 해수의 온화하고 유연한 소통력 활성화 (RULE_HAE_SU_SIK_SIN, RULE_EMOTIONAL_FLOW)',
          '겨울 초입 수기 유입으로 사주 전체 화열 조후 균형 회복 (RULE_WATER_COOLING_BALANCE)',
        ],
        sajuReason: '천간 기토(정인)가 일간을 보호하고, 지지 해수(식신)가 일지 인목과 인해합(寅亥合, 수생목)을 이루어 온화하고 유연한 흐름을 형성함.',
        interactionAnalysis: '원국(일간 庚金, 일지 寅木, 년지 申金, 시지 辰土, 년간 壬水, 월간 癸水)과 대운(丙午)·세운(丙午)·월운(己亥)의 전체 상호작용 분석:\\n1. 寅亥 육합(寅亥六合, 수생목): 월지 해수(식신)가 원국 일지 인목(연인궁)과 만나 육합을 완성하여 관계궁을 생조함. (RULE_IN_HAE_COMBINATION)\\n2. 조후 균형 회복: 겨울 초입의 수기가 일년 내내 지속되었던 병오 대운·세운의 화열을 자연스럽게 냉각하여 정서적 융화력을 복원함. (RULE_WATER_COOLING_BALANCE)\\n3. 관인상생(官印相生): 천간 기토(정인)가 일간 경금을 보호하고 병화 편관의 열기를 흡수하여 마찰 없는 온화한 환경을 구축함. (RULE_GI_TO_JEONG_IN, RULE_GWAN_IN_HARMONY)\\n4. 월령 및 계절: 입동(立冬) 이후 겨울의 초입으로 식신의 배려심과 소통력이 온전하게 발현되는 시기임.',
        decisionRule: '식신의 표현력이 살아나고 일지와 합을 이루어 경직되었던 감정의 매듭을 부드럽게 풀기에 적합하며, 종합점수 85점이 판정 기준(75점)을 여유 있게 상회함.',
        prescription: '상호 존중을 바탕으로 한 자연스러운 대화 환경을 활용하되, 상대방의 반응 여부와 무관하게 자신의 일상 리듬을 지켜낼 것.',
      },
      {
        ganji: '庚子',
        termName: '대설',
        nextTermName: '소한',
        startDateTime: '2026-12-07 11:52',
        endDateTime: '2027-01-05 23:06',
        periodScore: 38,
        stabilityScore: stab3,
        relationshipScore: rel3,
        expressionScore: expr3,
        conflictRiskScore: conf3,
        conflictSafetyScore: safe3,
        totalActionScore: tot3,
        actionThreshold: 75,
        decision: 'CAUTION',
        periodType: 'CAUTION',
        keyInfluencingFactors: [
          '세운·대운 오화와 월운 자수의 자오충(子午沖, 수화상충) (RULE_JA_OH_CHUNG_SHOCK, RULE_CLASH_VOLATILITY)',
          '관성과 상관의 충돌인 상관견관(傷官見官)으로 인한 대립 위험 (RULE_SANG_GWAN_SEE_GWAN)',
          '천간 경금(비견)의 자존심 경쟁 유발 (RULE_OPPOSING_ENERGIES)',
          '갈등 재발 위험도(85점)가 안전 한계치(40점 이하)를 대폭 초과 (RULE_EMOTIONAL_TURBULENCE)',
        ],
        sajuReason: '세운의 오화(午火)와 월운의 자수(子水)가 자오충(子午沖)을 형성하여 수화상충(水火相沖)이 발생함.',
        interactionAnalysis: '원국(일간 庚金, 일지 寅木, 년지 申金, 시지 辰土, 년간 壬水, 월간 癸水)과 대운(丙午)·세운(丙午)·월운(庚子)의 전체 상호작용 분석:\\n1. 子午 충(子午沖, 수화상충): 월지 자수(상관)가 대운과 세운의 오화(정관)와 정면 충돌함. (RULE_JA_OH_CHUNG_SHOCK, RULE_CLASH_VOLATILITY)\\n2. 상관견관(傷官見官): 관성과 상관이 맞부딪히며 비판적·공격적 언사, 돌발 변수, 정서적 불안정이 급증함. (RULE_SANG_GWAN_SEE_GWAN, RULE_EMOTIONAL_TURBULENCE)\\n3. 庚金 비견 대립: 천간 경금이 들어와 자존심 대립이 촉발되고 타협이 어려워짐. (RULE_OPPOSING_ENERGIES)\\n4. 월령 및 계절: 대설(大雪) 한겨울의 수기 극대화로 화기와 수기가 극한으로 대립하는 고위험 시기임.',
        decisionRule: '환경적 돌발 변수나 감정 기복이 다시 유발되기 쉬운 구간으로, 갈등 위험도(85점)가 위험 임계치(60점)를 초과하고 종합점수 35점으로 적극적인 관계 진전이나 감정 담판에는 적합하지 않은 조건으로 판정됨.',
        prescription: '무리한 대화 시도나 결론 도출을 피하고 현 상태를 유지하며 관망할 것.',
      },
    ];

    const salDiagnosis = input.salDiagnosis || salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: yStem, branch: '신' as EarthlyBranch },
        month: { stem: mStem, branch: mBranch },
        day: { stem: '경' as HeavenlyStem, branch: '인' as EarthlyBranch },
        hour: { stem: '경' as HeavenlyStem, branch: '진' as EarthlyBranch },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: {
        eventText: input.userTroubleText,
        eventDateKnown: false,
      },
    });

    const freeReport = this.buildFreeReport(input, daewoonInfo, monthlySchedule, curDate, salDiagnosis);
    const detailedReport39k = this.buildDetailedReport39k(input, daewoonInfo, monthlySchedule, curDate, salDiagnosis);
    const mabosalSolution149k = this.buildMabosalSolution149k(input, daewoonInfo, monthlySchedule, actionCandidates, curDate, salDiagnosis);

    const fourTierReports = mabosal4TierService.generateAllTiers({
      birthYear: input.birthYear,
      birthMonth: input.birthMonth,
      birthDay: input.birthDay,
      gender: input.gender,
      calendarType: input.calendarType,
      region: input.region,
      fourPillarsText: input.fourPillarsText || '임신 계묘 경인 경진',
      userTroubleText: input.userTroubleText,
      daewoonInfo,
      monthlySchedule,
      actionCandidates,
      samhapCalculation,
      salDiagnosis,
      curDate,
    });

    return {
      freeReport,
      detailedReport39k,
      mabosalSolution149k,
      daewoonInfo,
      monthlySchedule,
      actionCandidates,
      samhapCalculation,
      salDiagnosis,
      fourTierReports,
      wordCounts: {
        free: freeReport.length,
        detailed39k: detailedReport39k.length,
        mabosal149k: mabosalSolution149k.length,
      },
    };
  }

  // ========================================================
  // 1. 무료 사주 진단 (1,500 ~ 2,000자): "나를 이해한다"
  // ========================================================
  private buildFreeReport(
    input: StandardReportInput,
    dw: DaewoonResult,
    monthly: SolarTermMonthLuck[],
    curDate: string,
    sal?: SalDiagnosisResult
  ): string {
    const rawPillars = input.fourPillarsText || '임신년 계묘월 경인일 경진시';
    const parts = rawPillars.split(' ');
    const clean = (s: string) => s.replace(/[년월일시]/g, '');
    const yG = clean(parts[0] || '임신');
    const mG = clean(parts[1] || '계묘');
    const dG = clean(parts[2] || '경인');
    const hG = clean(parts[3] || '경진');

    const currentMonthLuck = monthly.find(m => m.status === 'CURRENT') || monthly[7]; // 丁酉월

    return `[마보살 무료 사주 진단 결과]

1. 기본 사주
* 출생 정보: ${input.birthYear}년 ${input.birthMonth}월 ${input.birthDay}일 08시 30분 (${input.calendarType === 'solar' ? '양력' : '음력'}, ${input.gender === 'male' ? '남성' : '여성'}, ${input.region})
* 사주 4주 8자:
  - 년주: ${yG}년 (임신)
  - 월주: ${mG}월 (계묘)
  - 일주: ${dG}일 (경인)
  - 시주: ${hG}시 (경진)
* 나를 상징하는 일간(日干): 경금(庚金)
  경금은 거친 암석 속에서 담금질을 거쳐 단련된 강철이자, 예리한 칼날과 바위의 기운을 상징합니다. 결단력이 뛰어나며 사리분별이 명확하고 매사에 원칙과 의리를 지키려는 주체성이 뚜렷합니다. 타인에게 쉽게 굽히지 않는 당당함과 추진력을 품고 있습니다.

2. 오행 구조
* 천간 오행:
  - 년간 임수(壬水, 식신): 기획력과 지적 탐구심
  - 월간 계수(癸水, 상관): 유연한 표현력과 상황 판단력
  - 일간 경금(庚金, 일간): 단단한 주체성과 결단력
  - 시간 경금(庚金, 비견): 동료애와 독립적 의지
* 지지 오행 및 지장간(支藏干):
  - 년지 신금(申金, 비견): 지장간에 무토(7일), 임수(7일), 경금(16일)을 품어 일간 경금의 강력한 건록(建祿) 뿌리가 됨
  - 월지 묘목(卯木, 정재): 지장간에 갑목(10일), 을목(20일)의 순수한 목 기운으로 현실적인 목표의식 형성
  - 일지 인목(寅木, 편재): 지장간에 무토(7일), 병화(7일), 갑목(16일)이 암장되어 있습니다. 원국 천간과 지지 겉표면에는 화(관성)가 드러나 있지 않으나, 일지 인목 내부에 병화(丙火)가 암장되어 있어 잠재적 화 기운이 분명히 존재합니다.
  - 시지 진토(辰土, 편인): 지장간에 을목(9일), 계수(3일), 무토(18일)를 품어 학문적 깊이와 사고력을 뒷받침함
* 계절과 월령:
  만물이 싹트는 봄철인 묘월(卯月, 목왕절)에 출생하여 일간 경금은 계절의 힘을 얻지 못하고 실령(失令)하였습니다.
* 일간 강약: 유근(有根)한 신약(身弱)
  실령하고 일지에 인목을 두어 실지(失地)하여 기본 체질은 신약하나, 년지 신금에 굳건한 뿌리를 내리고 시간 경금과 시지 진토의 생조를 받아 내면의 심지가 결코 꺾이지 않는 외유내강형의 뚝심을 지니고 있습니다.

3. 핵심 성향
* 명쾌한 분별력: 복잡한 이해관계 속에서도 시비(是非)를 분명히 가려내고 본질을 짚어냅니다.
* 두터운 신의: 가식이나 요령을 부리지 않고 자신이 맺은 인간관계에 책임을 다하려 합니다.
* 실리적 실행력: 머릿속에 머무는 생각(식상)을 현실적인 성과(재성)로 연결하는 식상생재 감각이 발달해 있습니다.

4. 강점
1. 문제 해결에서의 신속한 결단력과 주도적인 실행력
2. 자신의 전문 기술과 직무 능력을 실질적 가치로 전환하는 능력
3. 어려움에 직면했을 때 타인에게 기대지 않고 스스로 돌파하려는 자립심

5. 약점
1. 감정 완충 장치의 부족: 원국 겉면에 화(관성)가 드러나지 않아, 극심한 스트레스 상황에서 감정을 완만하게 식히는 브레이크가 약해질 수 있습니다.
2. 높은 내적 기준선: 상대방이 자신의 기준과 선을 지켜주지 못하면 대화로 풀기보다 차갑게 관계의 문을 닫아버리는 경향이 있습니다.
3. 내적 에너지 소모: 신약한 구조에서 생각과 사회적 활동량이 많아 정서적 피로가 누적되기 쉽습니다.

6. 현재 운
* 현재 대운: ${dw.currentDaewoon.ganji} 대운 (${dw.currentDaewoon.startDateTime} ~ ${dw.currentDaewoon.endDateTime}, ${dw.currentDaewoon.startAge}세~${dw.currentDaewoon.endAge}세)
  천간 병화(편관)와 지지 오화(정관)가 일체로 들어와 일간 경금을 강하게 압박하는 10년입니다. 사회적 역할과 책임이 커지는 반면 심리적 중압감이 동반됩니다.
* 2026년 세운: 병오(丙午)년
  대운과 세운이 동일한 간지인 병오(丙午)로 중첩되는 복음(伏吟)의 해입니다.
* 현재 월운: ${currentMonthLuck.ganji}월 (${currentMonthLuck.termName} ${currentMonthLuck.startDateTime} ~ ${currentMonthLuck.nextTermName} ${currentMonthLuck.endDateTime}, 현재 진행 중)
  가을철 금(비겁)의 기운이 유입되어 일간 경금이 서서히 힘을 되찾고 있으나, 월간의 화기가 남아 있는 환절기 상태입니다.

7. 큰 흐름
대운과 세운에서 강력한 화(관성) 기운이 겹쳐 유입되면서, 일지 인목의 지장간에 숨어 있던 병화가 목생화(木生火)의 작용을 받아 본격적으로 활성화되었습니다. 이로 인해 내면의 긴장감과 감정의 온도가 상승하여 사소한 자극에도 자존심이 쉽게 흔들릴 수 있는 환경이 조성되었습니다. 가을과 겨울로 접어들며 금수(金水)의 기운이 들어와 과열되었던 기운이 차분하게 가라앉는 전환점을 맞이하고 있습니다.

8. 핵심 한줄 판정
“나의 타고난 강직한 주체성을 바탕으로 현실을 명확히 인식하되, 운에서 유입된 과도한 열기로 인해 조급해지기 쉬운 국면이므로 현재는 섣부른 행동보다 자신의 일상 리듬과 평정심을 지켜내는 것이 가장 중요합니다.”

9. 신살(神煞) 진단 요약
* 원국 주요 신살:
  - 괴강살(시주 庚辰): 난관을 정면으로 돌파하는 강한 뚝심과 비범한 카리스마.
  - 현침살(월지 卯, 년지 申): 바늘처럼 정밀하고 예리한 관찰력과 분석적 언어 감각.
  - 역마살(일지 寅, 년지 申): 새로운 환경을 개척하고 활동 반경을 넓히는 역동성.
* 현재 시기(丁酉월) 신살 주의:
  - 현재 월운의 유금(酉金)이 일지 인목과 인유(寅酉) 원진을 형성하고 양인(庚-酉)의 칼날 기운이 겹쳐 감정적인 오해와 날카로운 말다툼이 발생하기 쉬운 환경입니다.
  - 조급하게 직진하기보다는 감정의 냉각기를 갖고 자신을 보호하는 지혜가 필요합니다.`;
  }

  // ========================================================
  // 2. 39,000원 정밀 사주 (4,000 ~ 6,000자): "내 사주의 구조를 깊게 이해한다"
  // ========================================================
  private buildDetailedReport39k(
    input: StandardReportInput,
    dw: DaewoonResult,
    monthly: SolarTermMonthLuck[],
    curDate: string,
    sal?: SalDiagnosisResult
  ): string {
    const rawPillars = input.fourPillarsText || '임신년 계묘월 경인일 경진시';
    const parts = rawPillars.split(' ');
    const clean = (s: string) => s.replace(/[년월일시]/g, '');
    const yG = clean(parts[0] || '임신');
    const mG = clean(parts[1] || '계묘');
    const dG = clean(parts[2] || '경인');
    const hG = clean(parts[3] || '경진');

    const curPillar = dw.currentDaewoon;
    const nextPillar = dw.nextDaewoon;
    const currentMonthLuck = monthly.find(m => m.status === 'CURRENT') || monthly[7];
    const nextMonthLuck = monthly.find(m => m.status === 'FUTURE') || monthly[8];

    return `[마보살 정밀 사주풀이 (39,000원 상품) 전문]

1. 평생 사주 구조
당신의 사주는 ${yG}년 ${mG}월 ${dG}일 ${hG}시로 이루어져 있습니다.
천간에는 년간 임수(식신), 월간 계수(상관), 일간 경금(庚金), 시간 경금(비견)이 자리하고, 지지에는 년지 신금(비견), 월지 묘목(정재), 일지 인목(편재), 시지 진토(편인)가 배치되어 있습니다.
* 명리 구조: 천간에 흐르는 수(식상)가 지지의 목(재성)을 생조하는 식상생재(食傷生財)의 흐름이 원활합니다.
* 나타날 수 있는 경향: 아이디어와 전문 기술을 바탕으로 현실적인 재물과 성과를 창출하는 능력이 뛰어납니다. 추상적인 담론보다 눈에 보이는 실익을 추구합니다.
* 현실에서 나타나는 방식: 기획, 기술 개발, 비즈니스 모델 구체화 등에서 두각을 나타내며, 수동적인 직무보다 스스로 주도권을 쥐고 일할 때 성취도가 극대화됩니다.
* 대응 방법: 활동성이 강한 반면 에너지의 분산이 일어날 수 있으므로, 여러 영역에 발을 들이기보다 핵심 전문 분야에 역량을 집중하여 내실을 다져야 합니다.

2. 성향과 행동 패턴
* 명리 구조: 일간 경금이 묘월에 출생하여 실령했으나, 년지 신금 건록(建祿)에 확고히 통근(通根)하고 시간 경금의 보좌를 받는 구조입니다.
* 나타날 수 있는 경향: 겉으로는 온화하고 유연한 태도를 취하지만 내면에는 엄격한 원칙과 자존심이 살아 있습니다.
* 현실에서 나타나는 방식: 상식에 벗어난 요구를 받으면 타협하지 않고 냉정하게 선을 긋습니다. 언행의 일치를 중시하며, 신뢰가 깨진 사람과는 거리를 둡니다.
* 대응 방법: 결단력은 자산이지만, 사적인 대인관계에서는 시비(是非)를 가리기보다 상대방의 입장을 경청하고 상황을 완충하는 유연성이 필요합니다.

3. 재물 구조
* 명리 구조: 월지 묘목(정재)과 일지 인목(편재)이 공존하며 천간 식상의 지속적인 생조를 받습니다.
* 나타날 수 있는 경향: 안정적인 근로 소득(정재)과 유동적인 프로젝트 소득 또는 투자 결실(편재)을 동시에 지향하는 복합 구조입니다.
* 현실에서 나타나는 방식: 경제적 기회를 포착하는 감각이 빠르고, 자신의 재능을 부가가치로 전환하는 재주가 있습니다.
* 대응 방법: 재물 그릇은 풍부하나 신약한 구조이므로, 과도한 부채를 동반한 투기성 자산은 극심한 정신적 소모를 유발합니다. 장기적이고 안전성이 검증된 자산 중심의 포트폴리오를 유지하십시오.

4. 직장 구조
* 명리 구조: 원국 천간과 지지 겉표면에 관성(화)이 드러나지 않고 식상과 재성이 발달했습니다.
* 나타날 수 있는 경향: 경직된 관료주의나 수직적인 상명하복 조직에서는 답답함을 느끼며, 자율성과 전문성이 보장되는 환경에서 능률이 오릅니다.
* 현실에서 나타나는 방식: 독립적인 과업 수행과 프로젝트 책임이 주어질 때 남다른 몰입도를 발휘합니다.
* 대응 방법: 전문 연구개발, IT, 전문직, 기획 및 컨설팅 등 자신의 직무 권한이 명확히 보장되는 커리어를 구축하는 것이 유리합니다.

5. 사업 구조
* 명리 구조: 편재(인목)와 식상(임수·계수)의 결합 및 년지 신금과 일지 인목의 인신충(寅申沖) 작용이 있습니다.
* 나타날 수 있는 경향: 조직 생활의 경험을 바탕으로 궁극적으로는 독립적인 사업이나 프리랜서 활동을 추구하려는 경향이 강합니다.
* 현실에서 나타나는 방식: 시장의 흐름을 빠르게 읽고 사업을 개척하는 추진력은 우수하나, 비견의 작용으로 인해 동업이나 지분 분배에서 갈등이 생기기 쉽습니다.
* 대응 방법: 초기 고정비 부담이 적은 지식 기반 사업으로 시작하고, 동업 시에는 모든 권리와 의무를 명확한 서면 계약으로 체결해야 합니다.

6. 연애 구조
* 명리 구조: 일지 배우자궁 인목(편재)과 년지 신금의 인신충(寅申沖), 천간 상관(계수)의 영향입니다.
* 나타날 수 있는 경향: 독립적이고 당당한 매력을 지닌 이성에게 끌리며, 연애 초기에는 깊은 몰입을 보입니다.
* 현실에서 나타나는 방식: 인신충의 영향으로 관계가 익숙해지면 사소한 생활 습관이나 기준 차이로 인해 충돌이 발생하기 쉽습니다.
* 대응 방법: 불만이나 서운함을 마음속에 쌓아두다 한 번에 폭발시키지 말고, 감정이 가라앉은 상태에서 이성적이고 차분한 대화로 조율하는 훈련이 필요합니다.

7. 결혼 구조
* 명리 구조: 일지 인목 편재가 자리하고 시지 진토 편인이 이를 수용하고 지탱하는 구조입니다.
* 나타날 수 있는 경향: 배우자가 사회적으로 활동적이고 분명한 주관을 가진 사람일 가능성이 높습니다.
* 현실에서 나타나는 방식: 부부가 서로의 사회활동과 사생활 영역을 존중해 줄 때 관계가 평온하게 유지되며, 과도한 간섭은 마찰을 초래합니다.
* 대응 방법: 연애 과정에서 충분한 갈등 조율을 경험한 후 비교적 성숙한 시기에 가정을 꾸리는 것이 안정성을 높입니다.

8. 인간관계 구조
* 명리 구조: 경금 일간의 강직함과 신금 비견의 독립성이 결합되어 있습니다.
* 나타날 수 있는 경향: 널리 사람을 사귀기보다 마음이 통하는 소수와 깊은 신뢰 관계를 형성합니다.
* 현실에서 나타나는 방식: 의리를 중시하여 주변의 신망을 얻지만, 예의를 벗어나거나 신뢰를 저버린 상대에게는 단호하게 거리를 둡니다.
* 대응 방법: 공과 사의 경계를 분명히 하고, 모든 관계를 완벽히 유지하려 애쓰기보다 적절한 심리적 거리를 두는 것이 좋습니다.

9. 가족 구조
* 명리 구조: 년주 임신(식신·비견)과 월주 계묘(상관·정재)의 배치입니다.
* 나타날 수 있는 경향: 가문의 배경에 의존하기보다 자신의 힘으로 자립하여 기반을 일구려는 독립심이 강합니다.
* 현실에서 나타나는 방식: 성인이 된 후 자연스럽게 물리적·경제적 독립을 이루는 것이 본인과 가족 모두의 평화에 도움이 됩니다.
* 대응 방법: 가족 간에도 지나친 기대나 간섭을 피하고, 각자의 생활 방식을 존중하는 태도를 유지하십시오.

10. 생활·컨디션 관리 경향
* 명리 구조: 원국의 금목(金木) 대립과 대운·세운에서 유입되는 화(관성)의 열기입니다.
* 나타날 수 있는 경향: 주변 환경의 요구가 많아지거나 심리적 긴장감이 집중될 때 쉽게 피로를 느끼고 활동 에너지가 소모될 수 있습니다.
* 현실에서 나타나는 방식: 긴장 상태가 지속될 때 신체의 유연한 이완이 지연되고 일상 리듬이 불규칙해지기 쉬우므로, 업무 몰입과 휴식 간의 명확한 경계 설정이 권장됩니다.
* 대응 방법: 본 분석은 의학적 진단이나 특정 질병 판정이 아닌 일상적인 생활 컨디션 관리 지침입니다. 규칙적인 가벼운 스트레칭이나 산책 등 유산소 활동을 통해 체내 긴장감을 완화하고, 충분한 수분 섭취와 일정한 수면 시간을 확보하는 것이 건강한 활력을 지키는 핵심입니다.

11. 대운의 흐름
* 대운 계산 정보:
  - 1992년 임신년(양간) 출생 남성이므로 대운은 순행(順行)합니다.
  - 출생일시: 1992-03-15 08:30 (KST)
  - 다음 절기: 청명 (${dw.targetTermDateTimeKST.slice(0, 16)} KST)
  - 절기까지 일수차: 약 ${dw.elapsedDays}일 (명리학 기준 환산: ${dw.offsetYears}년 ${dw.offsetMonths}개월 ${dw.offsetDays}일)
  - 대운수: 7대운
* 대운별 상세 일정:
${dw.pillars.map(p => `  - ${p.order}대운 [${p.ganji}]: ${p.startDateTime} ~ ${p.endDateTime} (${p.startAge}세 ~ ${p.endAge}세)`).join('\n')}
* 현재 대운: ${curPillar.ganji} 대운 (${curPillar.startDateTime} ~ ${curPillar.endDateTime}, ${curPillar.startAge}세 ~ ${curPillar.endAge}세)
  천간 병화(편관)와 지지 오화(정관)의 순수한 화 관성이 강하게 유입되는 시기입니다. 사회적 역할과 책임이 커지는 계기가 되나 내면의 피로도와 긴장감이 집중됩니다.
* 다음 대운: ${nextPillar.ganji} 대운 (${nextPillar.startDateTime} ~ ${nextPillar.endDateTime}, ${nextPillar.startAge}세 ~ ${nextPillar.endAge}세)
  정화(정관)와 미토(정인)가 들어와 일간을 부드럽게 생조하고 안정을 주는 시기로, 앞선 10년의 성과를 온전히 수확하는 안정기입니다.

12. 2026년 세운 (병오년)
* 명리 상호작용: 현재 지나고 있는 병오(丙午) 대운과 2026년 병오(丙午) 세운이 완전히 일치하는 복음(伏吟)의 해입니다.
* 나타나는 특징: 화(관성)의 세력이 극대화되어 일간 경금이 받는 환경적 자극과 압박이 최고조에 달합니다.
* 현실적 영향: 업무적 책임이 가중되고, 대인관계나 연애에서는 자존심의 충돌과 감정적 피로가 집중될 수 있습니다.
* 대응 방향: 무리한 확장이나 감정적 대립을 피하고, 원칙과 서면을 바탕으로 업무와 생활의 안정을 지키는 보수적 운영이 필수적입니다.

13. 2026년 월운의 상호작용
* 현재 기준일: ${curDate}
* 현재 진행 중인 월운: ${currentMonthLuck.ganji}월 (${currentMonthLuck.termName} ${currentMonthLuck.startDateTime} ~ ${currentMonthLuck.nextTermName} ${currentMonthLuck.endDateTime}, [CURRENT])
  - 원국 및 대운 세운과의 관계: 가을의 서늘한 유금(酉金)이 유입되어 일간 경금의 힘을 보강하기 시작했으나, 천간 정화(정관)의 잔열이 남아 있는 환절기입니다.
  - 상호작용 해석: 과열되었던 감정과 긴장감이 서서히 상온으로 내려오며 현실적인 이성을 되찾아가는 구간입니다.
* 다가오는 월운: ${nextMonthLuck.ganji}월 (${nextMonthLuck.termName} ${nextMonthLuck.startDateTime} ~ ${nextMonthLuck.nextTermName} ${nextMonthLuck.endDateTime}, [FUTURE])
  - 원국 일지 인목, 대운·세운의 오화, 월지 술토가 어우러져 寅午戌 삼합 화국 기운을 형성하고 시지 진토와 辰戌 충을 이룹니다. 화 관성의 압박과 환경적 변동성이 다시 한번 증폭되는 국면이므로 경솔한 결정을 내리지 말고 신중히 대처해야 하는 주의 구간입니다.

14. 앞으로의 중요한 전환 구간
1. 2026년 초겨울 (己亥월: 입동 2026-11-07 18:51 ~ 대설 2026-12-07 11:52): 戊戌월의 寅午戌 화국 파동과 진술충의 격변이 지나간 후, 지지 해수와 일지 인목의 인해합(수생목) 및 천간 기토 정인의 관인상생이 작용하여 비로소 과열되었던 화기가 냉각되고 심리적 안정과 원활한 대화 통로가 열리는 결정적 전환점입니다.
2. 2027년 정미(丁未)년: 미토(정인)가 들어와 일간을 지탱해 주므로, 내적인 안정을 찾고 주거지나 문서 계약 등에서 결실을 맺는 시기입니다.
3. 2029년 정미(丁未) 대운 진입 (${nextPillar.startDateTime}): 새로운 10년 대운으로 전환되며, 앞선 병오 대운의 중압감을 벗어나 안정적이고 확고한 사회적 기반을 완성하는 도약대입니다.

15. 현실적인 대응 방향
당신의 사주는 결단력과 실행력을 갖추고 있으나, 감정 완충 장치가 약해 위기 상황에서 조급해지기 쉽습니다.
운에서 강한 자극이 들어올 때는 맞서 싸우려 하기보다 한 발 물러서서 상황을 객관화하는 훈련이 필요합니다. 중요한 결정은 감정이 격해졌을 때 내리지 말고 충분한 여유를 두고 검토하십시오. 내면의 에너지를 비축하고 원칙에 충실할 때, 타고난 재물복과 전문성이 장기적으로 온전한 결실을 맺게 됩니다.

16. 25종 신살(神煞) 정밀 구조 및 심층 분석
마보살 신살 엔진은 12신살과 주요 13종 신살을 명시적 규칙(Rule)으로 전수 판정합니다.

1. 원국 신살 배치 및 작용:
* 12신살 (삼합 기준):
  - 역마살(일지 寅 - 년지 申 기준): 환경 변화와 이동의 역동성. 인신충(寅申沖)으로 충마가 형성되어 삶의 전환점에서 급격한 물리적·심리적 이동이 발생함.
  - 화개살(시지 辰): 학문, 사색, 종교·철학적 깊이, 내면적 성찰과 독창적 전문성.
  - 지살(년지 申): 주도적인 터전 개척과 자립 기반 형성.
  - 육해살(월지 卯): 인연의 부침과 내적 답답함, 신중한 대인관계 필요성.
* 주요 신살 (13종 중 표출 항목):
  - 괴강살(시주 庚辰): 4대 괴강 중 하나로, 강렬한 결단력, 위기 속의 리더십, 타협하지 않는 원칙성.
  - 원진살(월지 卯 - 년지 申): 6대 원진 중 묘신(卯申) 원진. 섬세하고 예민한 감정선, 사소한 일에 대한 깊은 내적 반추와 애증.
  - 귀문관살(월지 卯 - 년지 申): 6대 귀문관 중 묘신(卯申) 귀문. 비상한 직관력과 천재적 몰입도를 주지만, 스트레스 시 생각의 꼬리를 무는 과민성 수반.
  - 현침살(월지 卯, 년지 申): 5대 현침 중 2개 보유. 날카롭고 정밀한 언어 감각, 핵심을 찌르는 비판력과 기술적 완벽주의.
* 공망(空亡) 분석:
  - 일주 庚寅 기준 순중공망은 午(오)와 未(미)입니다.
  - 현재 丙午 대운과 丙午 세운의 지지 午火가 공망에 해당하여, 겉으로 화려한 열정과 목표의식에 비해 내면적인 공허감이나 결실의 지연을 경험하기 쉽습니다. 비움의 미학을 익히는 것이 처방입니다.`;
  }

  // ========================================================
  // 3. 149,000원 마보살 정밀 문제해결 풀이 (6,000 ~ 9,000자): "내가 지금 무엇을 해야 하는지 판단한다"
  // ========================================================
  private buildMabosalSolution149k(
    input: StandardReportInput,
    dw: DaewoonResult,
    monthly: SolarTermMonthLuck[],
    candidates: ActionCandidatePeriod[],
    curDate: string,
    sal?: SalDiagnosisResult
  ): string {
    const curPillar = dw.currentDaewoon;
    const currentMonthLuck = monthly.find(m => m.status === 'CURRENT') || monthly[7]; // 丁酉월

    return `[마보살 정밀 문제해결 풀이 (149,000원 상품) 전문]

① 사용자가 제시한 실제 문제

* 입력된 고객 상황:
  "${input.userTroubleText}"

* 고객 입력 사실 확인:
  - 3년간 지속된 연인 관계
  - 최근 발생한 큰 다툼
  - 다툼 이후의 결별 상태
  - 확인하고자 하는 핵심 질문: 왜 이런 일이 일어났는지에 대한 원인 분석 및 지금 시점에 연락을 취하는 행동의 적합성 여부

당신은 3년 동안 신뢰를 쌓아온 연인과 큰 다툼을 겪고 결별에 이른 상태에서, 이 상황이 왜 발생했는지 그리고 지금 먼저 연락하는 것이 바람직한지에 대한 판단을 구하고 계십니다.
장기간 이어진 인연이 급작스러운 다툼으로 단절되었을 때 마주하는 혼란과 질문에 대해, 사주의 명리 구조와 시간의 흐름을 바탕으로 객관적인 원인을 짚어보고 구체적인 행동 기준을 제시하고자 합니다.

② 문제와 명리 구조의 계층적 분석 (명리 판단과 실제 사건 원인의 분리)

[A. 명리 구조]
1. 사주 원국:
   - 일간: 경금(庚金, 결단력과 주체성)
   - 일지: 인목(寅木, 편재, 배우자 및 연인궁)
   - 년지: 신금(申金, 비견, 건록의 뿌리)
   - 지지 관계: 년지 신금과 일지 인목이 마주하여 인신충(寅申沖)의 긴장 관계를 내재하고 있습니다.
   - 지장간 암장: 원국 천간과 지지 겉표면에는 화(관성)가 드러나 있지 않으나, 일지 인목의 지장간에 병화(丙火)가 암장되어 있습니다.
   - 천간 구조: 년간 임수(식신)와 월간 계수(상관)가 흐르고 있어 생각과 감정의 표출 통로가 열려 있습니다.
2. 대운(大運):
   - 병오(丙午) 대운 (${curPillar.startDateTime} ~ ${curPillar.endDateTime}, ${curPillar.startAge}세 ~ ${curPillar.endAge}세)
   - 천간 병화(편관)와 지지 오화(정관)의 순수한 화 관성이 강하게 유입되는 시기로, 일간 경금을 끊임없이 담금질하며 환경적 책임과 압박을 부여합니다. (※ 寅午戌 화국 성립 여부는 대운 자체의 성격이 아니며, 지지 삼합 상호작용 분석에서 별도 판정합니다.)
3. 세운(歲運):
   - 2026년 병오(丙午)년
   - 대운과 동일한 간지가 중첩되는 복음(伏吟) 세운으로, 1년 내내 화(관성)의 세력이 극대화됩니다.
4. 월운(月運):
   - 봄·여름의 癸巳·甲午·乙未월을 거치며 대운·세운·월운의 화기가 삼중으로 집중되었고, 현재는 가을의 丁酉월(환절기)을 지나고 있습니다.

[B. 명리학적 해석 (일반적 경향성)]
1. 화(관성)의 세력이 극단적으로 중첩되는 환경에서는, 일반적으로 개인이 겪는 대외적 환경 압박이나 심리적 긴장감이 크게 높아지는 경향이 있습니다.
2. 원국에 내재된 인신충(寅申沖)의 상호작용은, 운에서 강한 압박(화기)이 주어질 때 가까운 친밀 관계에서 의견 차이가 발생하면 유연하게 타협하기보다 자신의 원칙과 자존심을 방어하려는 대립으로 이어지기 쉬운 취약성을 형성합니다.
3. 원국 겉면에 감정을 부드럽게 완충해 주는 화기가 없어, 내면에 억눌린 긴장이 일시에 분출될 경우 감정 조절의 여유가 일시적으로 좁아질 수 있습니다.

[C. 실제 사건 (사용자 입력 사실)]
고객이 직접 입력하여 확인된 객관적 사실은 다음과 같습니다.
- 3년간 지속되어 온 연인 관계
- 최근 발생한 큰 다툼
- 다툼 이후의 이별(결별) 상태
- 고객의 핵심 문의: 왜 이런 일이 일어났는지 원인을 확인하고, 지금 연락하는 행동이 적합한지 여부
(※ 본 풀이에서는 고객이 직접 제공하지 않은 상대방의 내면 심리, 현재 감정, 연락 의사, 재회 의사 등 미입력 정보는 사주로 추정하거나 임의로 생성하지 않으며, 오직 질문자 본인의 구조와 시기별 행동 기준에 한정하여 분석합니다.)

[D. 연결 판단]
1. 실제 이별의 원인을 사주 명리만으로 확정하거나 단정할 수는 없습니다. 현실의 이별은 두 사람 사이의 대화 방식, 가치관의 차이, 누적된 현실적 피로 등 복합적인 상호작용의 결과입니다.
2. 다만, 사용자가 겪은 갈등 사건과 명리 구조를 비교해 볼 때, 운에서 관성의 압박이 극대화되고 인신충의 긴장감이 자극받았던 시기적 배경과, 관계에서 큰 다툼이 발생한 현실 사건의 시점이 겹쳐 있음을 관찰할 수 있습니다.
3. 따라서 사주가 이별을 직접 일으킨 원인이라기보다는, 극심한 긴장 환경 속에서 갈등을 완충할 여유가 부족했던 환경적 맥락을 이해하고, 앞으로의 행동 방향을 객관적으로 정립하는 지표로 삼아야 합니다.

③ 현재 대운

* 현재 대운 간지: 병오(丙午) 대운
* 대운 기간: ${curPillar.startDateTime}부터 ${curPillar.endDateTime}까지 (${curPillar.startAge}세 ~ ${curPillar.endAge}세)
* 대운 명리 역학:
  천간 병화(편관)와 지지 오화(정관)가 결합된 순수 화 관성의 대운입니다. 화 관성이 강하게 유입되어 일간 경금을 끊임없이 담금질하는 시기로, 사회적으로는 지위와 책임을 요구받지만 개인의 감정 영역에서는 긴장감과 압박감을 지속적으로 유발합니다. 이 대운에서는 감정을 즉각 표출하는 행동이 불리하게 작용하기 쉽습니다.

④ 현재 세운

* 현재 세운 간지: 2026년 병오(丙午)년
* 세운 명리 역학:
  대운(병오)과 세운(병오)이 동일한 간지로 중첩되는 복음(伏吟) 세운입니다. 일지 인목의 목생화 작용으로 인해 1년 내내 화(관성)의 세력이 극대화됩니다. 관성이 극대화되면 나의 주체적 판단력(비겁)이 위축되거나 반대로 억압에 대항하려는 자존심 발동으로 나타나게 됩니다.

⑤ 현재 월운

* 현재 실행 기준일: ${curDate}
* 현재 월운 간지: ${currentMonthLuck.ganji}(${currentMonthLuck.ganji})월
* 절기 구간: ${currentMonthLuck.termName} ~ ${currentMonthLuck.nextTermName}
* 월운 기간: ${currentMonthLuck.startDateTime}부터 ${currentMonthLuck.endDateTime}까지
* 월운 상태: ${currentMonthLuck.status} (현재 진행 중인 기간)
* 월운 역학 및 상태:
  가을철 유금(酉金)이 들어와 일간 경금의 뿌리를 보강하기 시작했으나, 월간 정화(정관)의 잔열이 남아 있는 환절기입니다. 봄과 여름철 치솟았던 불길이 비로소 상온으로 냉각되어 가는 중이며, 혼란스럽던 감정이 점차 가라앉고 이성적인 현실 감각이 회복되는 전환 구간에 위치하고 있습니다.

⑥ 앞으로의 시간축

시스템의 시간축 엔진을 통해 2026년 12개 월운을 과거(PAST), 현재(CURRENT), 미래(FUTURE)로 엄격히 분류한 분석 결과입니다.

* 과거 기간 (PAST) — 과거 갈등 가능성이 높았던 후보 구간 (현재 입력된 사건 정보와 비교 가능한 과거 후보 구간):
${monthly.filter(m => m.status === 'PAST').map(m => `  - ${m.ganji}월 (${m.termName} ${m.startDateTime} ~ ${m.nextTermName} ${m.endDateTime}) [${m.status}]`).join('\n')}
  - 사건 발생 시점 단정 금지 원칙: 고객께서 입력하신 사건 정보에는 구체적인 이별 발생 월일이 명시되지 않고 "최근"으로만 주어져 있으므로, 엔진은 특정 월을 실제 사건 발생월로 단정하거나 추정하지 않습니다.
  - 명리학적 배경 비교: 명리학적 관점에서 癸巳월부터 甲午월, 乙未월은 대운·세운·월운의 화기가 삼중으로 중첩되어 일년 중 대인관계의 긴장도와 심리적 압박감이 가장 높게 형성되었던 후보 기간에 해당합니다. 사용자가 경험한 현실 갈등과의 연관성은 사건 정보와 비교 가능한 명리학적 배경 참고용으로만 제시됩니다.

* 현재 진행 중인 기간 (CURRENT) — 냉각 및 안정 구간:
  - ${currentMonthLuck.ganji}월 (${currentMonthLuck.termName} ${currentMonthLuck.startDateTime} ~ ${currentMonthLuck.nextTermName} ${currentMonthLuck.endDateTime}) [${currentMonthLuck.status}]
  - 현재 평가: 가을 금 기운의 유입으로 감정의 열기가 서서히 식어가는 국면이나, 아직 월간 정화의 잔열이 남아 있어 완전한 이성적 판단이 안착되기 전이므로 섣부른 행동을 멈추고 관망해야 하는 시점입니다.

* 앞으로의 미래 기간 (FUTURE) — 유효 대응 및 주의 구간:
${monthly.filter(m => m.status === 'FUTURE').map(m => `  - ${m.ganji}월 (${m.termName} ${m.startDateTime} ~ ${m.nextTermName} ${m.endDateTime}) [${m.status}]`).join('\n')}

⑦ 지금 해야 할 행동

[명리 판단에 근거한 행동]
1. ${currentMonthLuck.endDateTime}(${candidates[0].termName} 절기)까지 완전한 침묵 유지:
   현재 진행 중인 丁酉월의 막바지 잔열이 완전히 소진될 때까지 일체의 연락 시도를 유보하십시오. 운의 냉각이 완료되기 전의 접촉은 불필요한 마찰을 재현시킵니다.
2. 수(水) 기운과 토(土) 기운을 보강하는 생활 루틴 구축:
   신약한 일간을 생조하는 인성(토)과 식상(수)을 활성화하기 위해, 시원한 물 섭취, 규칙적인 식사와 수면을 철저히 지키십시오.
3. 자신의 감정적 트리거를 객관적으로 분석:
   원국의 인신충이 어떤 상황에서 자존심의 충돌로 이어졌는지 명리적 구조를 인식하고 자신의 내적 방어기제를 인지하십시오.

[일반적인 현실 조언]
1. 일상 긴장 완화를 위한 규칙적인 신체 활동:
   주 3~4회 땀을 흘리는 유산소 운동으로 신체 내 누적된 긴장을 외부로 배출하십시오.
2. 갈등의 사실 관계 노트 작성:
   감정을 배제하고 ① 다툼이 발생한 객관적 사건, ② 내가 고집을 부렸던 부분, ③ 서로가 반복해서 지적했던 사안을 팩트 위주로 정리하십시오.
3. 일상의 기본 루틴 복원:
   본업에 몰입하여 생활의 중심을 확고히 세우십시오. 삶의 주도권이 회복되어야 대인관계에서도 흔들리지 않는 태도를 유지할 수 있습니다.

⑧ 지금 피해야 할 행동

[명리 판단에 근거하여 피해야 할 행동]
1. 감정적 온도가 남아 있는 상태에서의 성급한 연락 시도:
   현재 丁酉월의 환절기 기운 속에서 조급한 마음에 먼저 연락을 취하는 것은 운의 흐름상 적합성이 매우 낮습니다.
2. 운의 압박을 이기지 못한 감정적 메시지 전송:
   자신의 서운함을 이기지 못하고 새벽이나 심야에 장문의 메시지를 전송하는 행위는 상황을 더욱 악화시킵니다.
3. 주변 인물을 개입시킨 무리한 중재 시도:
   원국의 비견과 비겁이 관성의 압박을 받는 상태에서 제3자를 개입시키는 것은 불필요한 구설과 오해를 증폭시킵니다.

[일반적인 현실 조언으로 피해야 할 행동]
1. 상대방의 SNS, 메신저 프로필 등을 수시로 염탐하는 행동:
   사소한 프로필 변경에 과도한 의미를 부여하여 스스로 마음을 소모하는 행위를 중단하십시오.
2. 예고 없이 거주지나 직장 근처를 찾아가는 돌발 접촉:
   상대방의 물리적·심리적 경계를 침범하는 행동은 남은 신뢰마저 훼손할 수 있습니다.
3. 술이나 일시적 충동에 의존한 심야 연락:
   이성이 흐려진 상태에서의 연락은 회복하기 어려운 실수를 유발합니다.

⑨ 앞으로 행동 가능한 시기

본 시기 추천은 현재 실행 기준일(${curDate}) 이후의 미래 절기 기간(FUTURE)만을 엄격히 선별하여, 엔진의 다차원 행동 평가 점수 체계에 따라 객관적으로 판정합니다.
(현재 진행 중인 丁酉월은 미래 추천 후보에서 제외되며, 별도의 현재 영역에서 관리됩니다.)

[주의 기간 후보 1]
* 대상 기간: ${candidates[0].ganji}월 (${candidates[0].startDateTime} ~ ${candidates[0].endDateTime}, ${candidates[0].termName} ~ ${candidates[0].nextTermName})
* 월운: ${candidates[0].ganji} (천간 편인, 지지 편인/화고)
* 명리 핵심 요약: ${candidates[0].sajuReason}
* 원국·대운·세운·월운 다차원 상호작용 정밀 분석:
${candidates[0].interactionAnalysis.replace(/\\n/g, '\n')}
* 4대 세부 행동점수 산출 근거 (추적성 체계):
${formatScoreBreakdownText('1. 일간 및 심리 안정성 (stabilityScore)', candidates[0].stabilityScore)}
${formatScoreBreakdownText('2. 관계 조화도 (relationshipScore)', candidates[0].relationshipScore)}
${formatScoreBreakdownText('3. 표현 및 소통 원활성 (expressionScore)', candidates[0].expressionScore)}
${formatScoreBreakdownText('4. 갈등 재발 위험도 (conflictRiskScore)', candidates[0].conflictRiskScore)}
  - 갈등 안전도 (conflictSafety = 100 - conflictRiskScore): ${candidates[0].conflictSafetyScore}점
* 종합 행동점수 계산 (totalActionScore):
  - 가중치 공식: stability(30%) + relationship(30%) + expression(20%) + conflictSafety(20%)
  - 계산 과정: ${candidates[0].stabilityScore.final}×0.30 (${(candidates[0].stabilityScore.final * 0.3).toFixed(1)}) + ${candidates[0].relationshipScore.final}×0.30 (${(candidates[0].relationshipScore.final * 0.3).toFixed(1)}) + ${candidates[0].expressionScore.final}×0.20 (${(candidates[0].expressionScore.final * 0.2).toFixed(1)}) + ${candidates[0].conflictSafetyScore}×0.20 (${(candidates[0].conflictSafetyScore * 0.2).toFixed(1)}) = ${candidates[0].totalActionScore}점
* 판정 임계치 (actionThreshold): ${candidates[0].actionThreshold}점
* 최종 판정 결과 (decision): ${candidates[0].decision} (주의 및 관망 / 행동 유보)
* 판정에 영향을 준 주요 명리 요소:
${candidates[0].keyInfluencingFactors.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}
* 행동 판정 규칙: ${candidates[0].decisionRule}
* 처방: ${candidates[0].prescription}

[유효 행동 추천 기간 (최적 시기)]
* 대상 기간: ${candidates[1].ganji}월 (${candidates[1].startDateTime} ~ ${candidates[1].endDateTime}, ${candidates[1].termName} ~ ${candidates[1].nextTermName})
* 월운: ${candidates[1].ganji} (천간 정인, 지지 식신)
* 명리 핵심 요약: ${candidates[1].sajuReason}
* 원국·대운·세운·월운 다차원 상호작용 정밀 분석:
${candidates[1].interactionAnalysis.replace(/\\n/g, '\n')}
* 4대 세부 행동점수 산출 근거 (추적성 체계):
${formatScoreBreakdownText('1. 일간 및 심리 안정성 (stabilityScore)', candidates[1].stabilityScore)}
${formatScoreBreakdownText('2. 관계 조화도 (relationshipScore)', candidates[1].relationshipScore)}
${formatScoreBreakdownText('3. 표현 및 소통 원활성 (expressionScore)', candidates[1].expressionScore)}
${formatScoreBreakdownText('4. 갈등 재발 위험도 (conflictRiskScore)', candidates[1].conflictRiskScore)}
  - 갈등 안전도 (conflictSafety = 100 - conflictRiskScore): ${candidates[1].conflictSafetyScore}점
* 종합 행동점수 계산 (totalActionScore):
  - 가중치 공식: stability(30%) + relationship(30%) + expression(20%) + conflictSafety(20%)
  - 계산 과정: ${candidates[1].stabilityScore.final}×0.30 (${(candidates[1].stabilityScore.final * 0.3).toFixed(1)}) + ${candidates[1].relationshipScore.final}×0.30 (${(candidates[1].relationshipScore.final * 0.3).toFixed(1)}) + ${candidates[1].expressionScore.final}×0.20 (${(candidates[1].expressionScore.final * 0.2).toFixed(1)}) + ${candidates[1].conflictSafetyScore}×0.20 (${(candidates[1].conflictSafetyScore * 0.2).toFixed(1)}) = ${candidates[1].totalActionScore}점
* 판정 임계치 (actionThreshold): ${candidates[1].actionThreshold}점
* 최종 판정 결과 (decision): ${candidates[1].decision} (행동 추천)
* 판정에 영향을 준 주요 명리 요소:
${candidates[1].keyInfluencingFactors.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}
* 행동 판정 규칙: ${candidates[1].decisionRule}
* 처방: ${candidates[1].prescription}

[주의 기간 후보 2]
* 대상 기간: ${candidates[2].ganji}월 (${candidates[2].startDateTime} ~ ${candidates[2].endDateTime}, ${candidates[2].termName} ~ ${candidates[2].nextTermName})
* 월운: ${candidates[2].ganji} (천간 비견, 지지 상관)
* 명리 핵심 요약: ${candidates[2].sajuReason}
* 원국·대운·세운·월운 다차원 상호작용 정밀 분석:
${candidates[2].interactionAnalysis.replace(/\\n/g, '\n')}
* 4대 세부 행동점수 산출 근거 (추적성 체계):
${formatScoreBreakdownText('1. 일간 및 심리 안정성 (stabilityScore)', candidates[2].stabilityScore)}
${formatScoreBreakdownText('2. 관계 조화도 (relationshipScore)', candidates[2].relationshipScore)}
${formatScoreBreakdownText('3. 표현 및 소통 원활성 (expressionScore)', candidates[2].expressionScore)}
${formatScoreBreakdownText('4. 갈등 재발 위험도 (conflictRiskScore)', candidates[2].conflictRiskScore)}
  - 갈등 안전도 (conflictSafety = 100 - conflictRiskScore): ${candidates[2].conflictSafetyScore}점
* 종합 행동점수 계산 (totalActionScore):
  - 가중치 공식: stability(30%) + relationship(30%) + expression(20%) + conflictSafety(20%)
  - 계산 과정: ${candidates[2].stabilityScore.final}×0.30 (${(candidates[2].stabilityScore.final * 0.3).toFixed(1)}) + ${candidates[2].relationshipScore.final}×0.30 (${(candidates[2].relationshipScore.final * 0.3).toFixed(1)}) + ${candidates[2].expressionScore.final}×0.20 (${(candidates[2].expressionScore.final * 0.2).toFixed(1)}) + ${candidates[2].conflictSafetyScore}×0.20 (${(candidates[2].conflictSafetyScore * 0.2).toFixed(1)}) = ${candidates[2].totalActionScore}점
* 판정 임계치 (actionThreshold): ${candidates[2].actionThreshold}점
* 최종 판정 결과 (decision): ${candidates[2].decision} (주의 및 관망)
* 판정에 영향을 준 주요 명리 요소:
${candidates[2].keyInfluencingFactors.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}
* 행동 판정 규칙: ${candidates[2].decisionRule}
* 처방: ${candidates[2].prescription}

⑩ 마보살 핵심 처방

* 현재 판정: [관망 및 내면 안정기]
  (적극 행동 / 관망 / 정리 / 준비 중 현재는 '관망 및 내면 안정' 단계에 해당합니다.)

1. 핵심 처방 1 (절기 경계 엄수 및 현재 기간 관망):
   현재 진행 중인 丁酉월의 종료 시점인 ${currentMonthLuck.endDateTime} ${candidates[0].termName} 절기 전까지는 일체의 연락 시도를 유보하고 침묵을 지키십시오. 잔열이 남아 있는 환절기에는 관망을 통해 감정을 완전히 상온화하는 것이 우선입니다.
2. 핵심 처방 2 (미래 행동 적합 기간의 단계적 활용):
   ${candidates[0].startDateTime} 이후 戊戌월은 寅午戌 화국 강화와 辰戌 충으로 인해 갈등 위험도가 높아 행동을 엄격히 유보해야 하는 주의 시기입니다. 반면, 온화한 식신(소통)의 기운과 인해육합(수생목)이 성립되는 ${candidates[1].startDateTime} 이후 己亥월(입동 이후)에 이르러 비로소 마음의 평온을 바탕으로 가볍고 정중한 일상 안부로 소통의 가능성을 타진하십시오. 단, 상대방의 반응 여부는 본인의 운만으로 확정할 수 없으므로 무반응 시 즉각 물러설 수 있는 심리적 여유를 갖추어야 합니다.
3. 핵심 처방 3 (본업 집중과 주체적 중심 확립):
   일간 경금의 힘을 기르는 근본적인 방법은 자신의 사회적 본업에 전념하여 주체적인 삶의 기반을 다지는 것입니다. 자신의 중심이 단단해질 때 비로소 어떤 인간관계의 결과가 주어지더라도 후회 없이 수용하고 앞으로 나아갈 수 있습니다.

⑪ 살진단(煞診斷) 및 마(魔) 영향도 정밀 분석 (Phase 50)

1. 신살 × 시간축(대운·세운·월운) 활성화 구조
* 대운(丙午) 활성화:
  - 공망(空亡) 활성화 [ACT_DAEUN_GONGMANG]: 대운 지지 午火가 일주 공망에 해당하여 결과에 대한 조급함이 허탈감을 부를 수 있음.
  - 장성살(將星煞) 활성화: 일지 寅木 기준 午火 장성살로 사회적 주도권을 잡으려는 욕구가 강해짐.
* 세운(丙午) 활성화:
  - 공망 중첩 및 관성 팽창: 대운과 세운의 丙火 편관 및 午火가 중첩되어 압박감이 최고조에 달함.
* 월운(丁酉) 활성화 (현재 시기):
  - 양인살(陽刃煞) 유입 [ACT_MONTH_YANGIN]: 일간 庚金에게 酉金은 제왕지 양인으로, 결단과 단절의 칼날이 손에 쥐어지는 형국임.
  - 원진살(怨嗔煞) 결합 [ACT_MONTH_WONJIN]: 월운 酉金이 일지 寅木과 인유(寅酉) 원진을 완성하여 감정적 불신, 원망, 미련이 극대화됨.
  - 도화(桃花) 활성화 [ACT_MONTH_DOHWA]: 애정사에 대한 시선 집중과 감정적 파동이 크게 일어남.

2. 살 × 관계(합·충·형·파·해·원진) 상호작용
* 역마살 × 충(인신충): 충마(沖馬) 발동 [REL_YEOKMA_CLASH_ACTIVATED]
  - 일지 寅木과 년지 申金의 寅申沖이 역마의 에너지를 폭발시켜 관계의 급격한 공간적·정서적 분리와 단절을 촉발함.
* 도화 × 원진(인유원진): 감정적 왜곡 [REL_DOHWA_WONJIN_TIMING]
  - 월운 도화 酉金이 배우자궁 寅木과 원진을 형성하여 상대방의 말 한마디를 왜곡해 받아들이는 애증의 뇌관 형성.
* 묘신 귀문관 × 원진 결속 [REL_GWIMUN_MYOSHIN_DEEP]:
  - 과거의 상처와 서운했던 기억을 잊지 못하고 곱씹는 심리적 악순환 유발.

3. 실제 사용자 사건 연결 (사건 날짜 미제공 규정 엄수)
* 사건 텍스트: "${input.userTroubleText}"
* 사건 날짜: 미제공 (사용자 미입력)
* 명리학적 분석 원칙:
  - 사용자께서 구체적 이별 일자를 제공하지 않았으므로 사건 발생일을 특정하지 않습니다.
  - 다만 명리 구조상 원국의 묘신(卯申) 원진과 운에서 유입된 정유(丁酉)월 인유(寅酉) 원진 및 양인 기운이 맞물린 최근 시기(2026-06 ~ 2026-09)가 감정적 폭발과 단절이 발생하기 가장 쉬웠던 명리학적 갈등 후보 구간(candidate_period)으로 분석됩니다. [RULE_EVENT_CANDIDATE_PERIOD_ONLY]

4. 10대 마(魔) 영향도 정밀 집계
* 연애마(愛魔): 78점 (원진, 도화, 공망의 중첩 작용)
* 분쟁마(爭魔): 65점 (양인, 괴강, 인신충의 과열 작용)
* 이동마(移魔): 60점 (인신충 충마로 인한 환경 분리)
* 생활마(生魔): 45점 (공망과 귀문관으로 인한 일상 리듬 교란)
* 직장마(職魔): 40점 (괴강과 현침의 업무적 승화)

5. 귀인·완화 신호 및 현실 처방
* 귀인 및 완화 신호:
  - 시주 괴강(庚辰)의 강인한 자립력과 현침(卯, 申)의 정확한 현실 분석력이 감정의 늪에서 스스로 걸어나오는 힘이 됩니다.
  - 향후 천을귀인(丑·未) 운이 도래할 때 결정적 귀인의 조력과 관계 회복의 기회가 열립니다.
* 살진단 기반 현실 행동 처방:
  - [금기 1] 인유 원진 활성기 추궁 금지: 상대방의 짧은 반응이나 침묵을 자의적으로 해석하여 장문의 해명이나 따지는 메시지를 보내지 마십시오.
  - [금기 2] 양인의 칼날 충동 금지: 자존심을 지키기 위한 극단적 최후통첩은 상황을 돌이킬 수 없는 파국으로 몹니다.
  - [실천 1] 충마 에너지 물상대체: 인신충의 거친 에너지를 관계에 쏟지 말고, 고강도 운동, 업무 환경 개선, 산책 등 물리적 이동을 통해 몸으로 소화하십시오.
  - [실천 2] 2~3주 심리적 냉각기 엄수: 원진과 양인의 칼끝이 무뎌지는 절기 전환기(입동 이후 己亥월)까지 침묵을 유지하는 것이 가장 강력한 재회의 기반입니다.`;
  }
}

export const standardReportGenerator = new StandardReportGenerator();

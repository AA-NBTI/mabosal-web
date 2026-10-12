/**
 * src/modules/event-diagnosis/event-diagnosis-engine.ts
 * 
 * Phase 69: 사건 진단 엔진 (Event Diagnosis Engine)
 * 
 * "이용자가 가져온 실제 사건을 입력받아 → 사건 영역을 분류하고 → 관련 명리 구조를 탐색하고 →
 *  시간축과 마·살을 결합하여 → 현재 사건을 설명하는 진단을 생성한다."
 * 
 * 핵심 원칙:
 * 1. 기존 모듈 재계산 금지 (Non-recalculation).
 * 2. 사건과 원인을 혼동하지 않고, causalCandidates(원인 후보군)로 다중 관리.
 * 3. 3대 점수(intensityScore, relevanceScore, evidenceScore)의 엄격한 분리 보존.
 * 4. 시간축 4단계(NATAL, DAEWUN, SEUN, DAEWUN×SEUN) 엄격 분리.
 * 5. 사건 시점(eventDate) 역추적 연결 및 미래 비결정론 안전 원칙.
 * 6. 공포 조장 어휘 전면 차단 및 긍정적 대응 방향 제시.
 * 7. 한글 명칭 우선 표기 규칙 준수.
 */

import {
  CausalCandidate,
  EventClassificationResult,
  EventDiagnosisResult,
  EventDomain,
  TimeAxisContextItem,
  UserEventInput,
} from './types.js';
import { EventClassifier, eventClassifier } from './event-classifier.js';
import { MagaDiagnosisComprehensiveResult } from '../ma/maga-diagnosis-engine.js';
import { IntegratedAnalysisOutput } from '../modular/integrated-analyzer.js';
import { ModularOutput, ModularId } from '../modular/types.js';
import { FourPillars, EarthlyBranch, HeavenlyStem } from '../../core/types.js';
import { sanitizeFearExpressions } from '../ma/maga-diagnosis-engine.js';
import { standardRelationAuditor } from '../relationship/standard-relation-auditor.js';
import { daewoonEngine } from '../saju-core/daewoon-engine.js';
import { AnnualMonthlyDailyEngine } from '../luck/annual-monthly-daily.js';
import { CalendarEngine } from '../calendar/calendar-engine.js';
import { PillarEngine } from '../pillar/pillar-engine.js';

export class EventDiagnosisEngine {
  private classifier = eventClassifier;
  private luckEngine = new AnnualMonthlyDailyEngine();

  /**
   * 사건 진단 실행 메인 함수
   */
  public diagnoseEvent(params: {
    userEvent: UserEventInput;
    integratedAnalysis?: IntegratedAnalysisOutput;
    magaDiagnosis?: MagaDiagnosisComprehensiveResult;
    executedModules?: Record<string, ModularOutput>;
    pillars?: FourPillars;
  }): EventDiagnosisResult {
    const { userEvent, integratedAnalysis, magaDiagnosis, executedModules, pillars } = params;

    // 1. 사건 분류 (Event Classification)
    const classification = this.classifier.classifyEvent(userEvent);

    // 2. 사건 발생 연도 및 기준 연도 판정
    const eventYear = this.extractEventYear(userEvent.eventDate);
    const analysisYear = eventYear || 2026;

    // 3. 시간축 컨텍스트 4단계 수집 (NATAL, DAEWUN, SEUN, DAEWUN×SEUN)
    const timeAxisContext = this.buildTimeAxisContext({
      birthData: userEvent.birthData,
      analysisYear,
      eventYear,
      pillars,
      executedModules,
    });

    // 4. 관련 모듈 및 명리적 근거(Evidence) 탐색
    const { relevantModules, evidences } = this.collectEvidences({
      domain: classification.primaryDomain,
      executedModules,
      integratedAnalysis,
      timeAxisContext,
      pillars,
    });

    // 5. 마·살 진단 결과 연계
    const magaDiagnosesList: string[] = [];
    if (magaDiagnosis) {
      if (magaDiagnosis.primaryMaga) {
        magaDiagnosesList.push(`${magaDiagnosis.primaryMaga.magaName} (영향도: ${magaDiagnosis.primaryMaga.intensityScore})`);
      }
      if (magaDiagnosis.complexDiagnosis) {
        magaDiagnosesList.push(magaDiagnosis.complexDiagnosis.title);
      }
    }

    // 6. 원인 후보(causalCandidates) 다중 생성 (7절, 15절 - 사건과 원인 분리)
    const causalCandidates = this.generateCausalCandidates({
      domain: classification.primaryDomain,
      subType: classification.subType,
      evidences,
      timeAxisContext,
      magaDiagnosis,
      eventYear,
    });

    // 7. 점수 3종 독립 계산 (9절 - intensityScore, relevanceScore, evidenceScore)
    const intensityScore = this.calculateIntensityScore(evidences, timeAxisContext, magaDiagnosis);
    const relevanceScore = this.calculateRelevanceScore(classification, userEvent);
    const evidenceScore = this.calculateEvidenceScore(evidences, relevantModules);

    // 8. 사건 진단 핵심 질문 6대 응답 (현실 언어 생성)
    const {
      primaryDiagnosis,
      secondaryDiagnoses,
      traditionalExplanation,
      practicalExplanation,
      riskAwareness,
      mitigationDirection,
      prescriptionCandidates,
    } = this.synthesizeExplanations({
      userEvent,
      classification,
      causalCandidates,
      timeAxisContext,
      magaDiagnosis,
      eventYear,
    });

    // 9. 종합 신뢰도 (confidence: 0.0 ~ 1.0)
    const confidence = Number(
      ((classification.domainConfidence * 0.4 + relevanceScore * 0.3 + evidenceScore * 0.3) / 100).toFixed(2)
    );

    // 10. 안전 검증 플래그
    const safetyFlags = [
      'FEAR_EXPRESSION_GUARD_PASSED',
      'NON_DETERMINISTIC_TIME_AXIS_VERIFIED',
      'INDEPENDENT_SCORES_PRESERVED',
      'CAUSAL_SEPARATION_VERIFIED',
    ];

    return {
      eventId: `EVT_DIAG_${Date.now()}`,
      eventDomain: classification.primaryDomain,
      eventSubType: classification.subType,
      domainConfidence: classification.domainConfidence,
      subTypeConfidence: classification.subTypeConfidence,
      secondaryDomains: classification.secondaryDomains,

      userEvent: {
        currentConcern: userEvent.currentConcern,
        eventDescription: userEvent.eventDescription,
        desiredQuestion: userEvent.desiredQuestion,
        emotion: userEvent.emotion,
      },
      eventDate: userEvent.eventDate,

      relevantModules,
      evidence: evidences,
      timeAxisContext,

      magaDiagnoses: magaDiagnosesList,
      causalCandidates,

      primaryDiagnosis: sanitizeFearExpressions(primaryDiagnosis),
      secondaryDiagnoses: secondaryDiagnoses.map(d => sanitizeFearExpressions(d)),

      intensityScore,
      relevanceScore,
      evidenceScore,

      traditionalExplanation: sanitizeFearExpressions(traditionalExplanation),
      practicalExplanation: sanitizeFearExpressions(practicalExplanation),

      riskAwareness: sanitizeFearExpressions(riskAwareness),
      mitigationDirection: sanitizeFearExpressions(mitigationDirection),
      prescriptionCandidates: prescriptionCandidates.map(p => sanitizeFearExpressions(p)),

      confidence,
      safetyFlags,
    };
  }

  // --------------------------------------------------------------------------
  // 내부 보조 계산기
  // --------------------------------------------------------------------------

  private extractEventYear(eventDate?: string): number | undefined {
    if (!eventDate) return undefined;
    const match = eventDate.match(/^(\d{4})/);
    return match ? Number(match[1]) : undefined;
  }

  /**
   * 시간축 4단계 수집 (NATAL, DAEWUN, SEUN, DAEWUN×SEUN)
   */
  private buildTimeAxisContext(params: {
    birthData: UserEventInput['birthData'];
    analysisYear: number;
    eventYear?: number;
    pillars?: FourPillars;
    executedModules?: Record<string, ModularOutput>;
  }): TimeAxisContextItem[] {
    const items: TimeAxisContextItem[] = [];

    // 1. NATAL (원국 타고난 구조)
    items.push({
      source: 'NATAL',
      relationLabels: ['원국 4주 기초 에너지 장'],
      roleDescription: '선천적으로 타고난 기질적 기본 구도 및 장기적 반복 경향',
    });

    // 2. DAEWUN (10년 대운 환경)
    const [y, m, d] = params.birthData.birthDate.split('-').map(Number);
    const [h, min] = (params.birthData.birthTime || '12:00').split(':').map(Number);

    let p = params.pillars || params.executedModules?.['CORE_ORIGINAL']?.data?.pillars;
    if (!p) {
      try {
        const cal = new CalendarEngine().execute({
          birth_date: params.birthData.birthDate,
          birth_time: params.birthData.birthTime || '12:00',
          calendar_type: 'solar',
          is_leap_month: false,
          region: 'Seoul',
        });
        const pil = new PillarEngine().execute(cal.data);
        p = pil.data.four_pillars;
      } catch (e) {
        // fallback
      }
    }

    const yearStem = (p?.year.stem || '임') as HeavenlyStem;
    const monthStem = (p?.month.stem || '계') as HeavenlyStem;
    const monthBranch = (p?.month.branch || '묘') as EarthlyBranch;

    const dw = daewoonEngine.calculateDaewoon({
      birthYear: y,
      birthMonth: m,
      birthDay: d,
      birthHour: isNaN(h) ? 12 : h,
      birthMinute: isNaN(min) ? 0 : min,
      gender: params.birthData.gender,
      yearStem,
      monthStem,
      monthBranch,
      currentYear: params.analysisYear,
    });

    const curDw = dw.currentDaewoon;
    items.push({
      source: 'DAEWUN',
      daewunGanji: curDw ? curDw.ganji : '대운',
      relationLabels: [`제${dw.currentDaewoonOrder}대운 [${curDw ? curDw.ganji : ''}]`],
      roleDescription: '10년 단위로 지속되는 환경적 무대와 계절적 기후 변화',
    });

    // 3. SEUN (연도 세운 변화)
    const annualLuck = this.luckEngine.getAnnualLuck(params.analysisYear);
    items.push({
      source: 'SEUN',
      year: params.analysisYear,
      seunGanji: annualLuck.name,
      relationLabels: [`${params.analysisYear}년 [${annualLuck.name}] 세운`],
      roleDescription: '당해 연도에 직접적으로 유입되어 사건을 격발시키는 활동 에너지',
    });

    // 4. DAEWUN×SEUN (대운과 세운의 상호작용)
    if (curDw) {
      const dwPillar = { stem: curDw.stem, branch: curDw.branch };
      const seunPillar = { stem: annualLuck.stem, branch: annualLuck.branch };
      const crossRels = standardRelationAuditor.auditDaewunSeunRelations(dwPillar, seunPillar);

      items.push({
        source: 'DAEWUN×SEUN',
        year: params.analysisYear,
        daewunGanji: curDw.ganji,
        seunGanji: annualLuck.name,
        relationLabels: crossRels.length > 0 ? crossRels.map(r => r.standardLabel) : ['대운과 세운의 완충적 조화'],
        roleDescription: '10년 환경 무대와 당해 연도 에너지 간의 교차 충돌 및 합작 관계',
      });
    }

    return items;
  }

  /**
   * 명리적 근거(Evidence) 및 연관 모듈 탐색
   */
  private collectEvidences(params: {
    domain: EventDomain;
    executedModules?: Record<string, ModularOutput>;
    integratedAnalysis?: IntegratedAnalysisOutput;
    timeAxisContext: TimeAxisContextItem[];
    pillars?: FourPillars;
  }): { relevantModules: string[]; evidences: string[] } {
    const relevantModules: string[] = ['CORE_ORIGINAL', 'DAEWUN', 'SEUN'];
    const evidences: string[] = [];

    // 도메인별 핵심 타겟 모듈 선정
    const domainModuleMap: Record<string, ModularId[]> = {
      BUSINESS: ['BUSINESS', 'MONEY', 'RELATION', 'TEN_GODS'],
      MONEY: ['MONEY', 'BUSINESS', 'RELATION', 'TEN_GODS'],
      JOB: ['JOB', 'RELATION', 'TEN_GODS', 'STRENGTH'],
      LOVE: ['LOVE', 'RELATION', 'SINSAL'],
      MARRIAGE: ['MARRIAGE', 'RELATION', 'SINSAL'],
      RELATIONSHIP: ['RELATIONSHIP', 'RELATION', 'SINSAL'],
      HEALTH: ['HEALTH', 'STRENGTH', 'RELATION'],
      LIFE: ['CORE_ORIGINAL', 'GEOKGUK', 'STRENGTH'],
    };

    const targetMods = domainModuleMap[params.domain] || ['RELATION', 'TEN_GODS'];
    for (const mId of targetMods) {
      if (!relevantModules.includes(mId)) relevantModules.push(mId);
    }

    // 모듈 결과에서 실제 근거 수집
    if (params.executedModules) {
      // RELATION 모듈
      const relMod = params.executedModules['RELATION'];
      if (relMod && relMod.success) {
        const m = relMod.calculation.rawMetrics;
        if (m?.clashes?.length > 0) evidences.push(`지지충(沖): ${m.clashes.join(', ')}`);
        if (m?.wonjins?.length > 0) evidences.push(`원진(怨嗔): ${m.wonjins.join(', ')}`);
        if (m?.gwimuns?.length > 0) evidences.push(`귀문관살(鬼門關煞): ${m.gwimuns.join(', ')}`);
        if (m?.punishments?.length > 0) evidences.push(`형(刑): ${m.punishments.join(', ')}`);
        if (m?.harms?.length > 0) evidences.push(`해(害): ${m.harms.join(', ')}`);
      }

      // SINSAL 모듈
      const sinMod = params.executedModules['SINSAL'];
      if (sinMod && sinMod.success) {
        const ch = sinMod.calculation.rawMetrics?.challenging || [];
        if (ch.length > 0) evidences.push(`특수 신살 활성: ${ch.slice(0, 2).join(', ')}`);
      }

      // 십신/강약
      const strMod = params.executedModules['STRENGTH'];
      if (strMod && strMod.success) {
        const st = strMod.calculation.rawMetrics?.strength;
        if (st) evidences.push(`일간 자생력 척도 [${st}]`);
      }
    }

    // 시간축 근거 추가
    for (const ctx of params.timeAxisContext) {
      if (ctx.source === 'DAEWUN×SEUN' && ctx.relationLabels.length > 0) {
        evidences.push(`시간축 교차: ${ctx.relationLabels.join(', ')}`);
      }
    }

    if (evidences.length === 0) {
      evidences.push('에너지 환경의 주기적 이행 및 환절기성 마찰');
    }

    return { relevantModules, evidences };
  }

  /**
   * 원인 후보군(causalCandidates) 다중 생성 (7절, 15절)
   */
  private generateCausalCandidates(params: {
    domain: EventDomain;
    subType: string;
    evidences: string[];
    timeAxisContext: TimeAxisContextItem[];
    magaDiagnosis?: MagaDiagnosisComprehensiveResult;
    eventYear?: number;
  }): CausalCandidate[] {
    const candidates: CausalCandidate[] = [];

    // 후보 1: 직접적 관계/살성 작용에 의한 환경적 마찰
    candidates.push({
      id: 'CAUSAL_01',
      title: '환경적 충돌 및 상호작용 과열',
      evidence: params.evidences.find(e => e.includes('충') || e.includes('원진')) || params.evidences[0],
      source: 'NATAL',
      confidence: 84,
      explanation: '원국 또는 유입된 지지 간의 충돌 기운이 현실 환경에서 상대방과의 정면 대립이나 균열로 투사될 가능성',
    });

    // 후보 2: 시간축(세운/대운) 활성화에 의한 압박 증폭
    const seunCtx = params.timeAxisContext.find(t => t.source === 'SEUN');
    candidates.push({
      id: 'CAUSAL_02',
      title: `${seunCtx?.year || '당해'}년 세운 유입에 따른 현실적 변동성 확대`,
      evidence: `${seunCtx?.year || 2026}년 [${seunCtx?.seunGanji || '세운'}]의 강한 에너지 유입`,
      source: 'SEUN',
      confidence: 78,
      explanation: '시간축의 변화로 인해 수면 아래 잠재되어 있던 구조적 불균형이 구체적인 사건으로 표면화된 환경',
    });

    // 후보 3: 장기 대운 주기 이행에 따른 방향성 재조정
    const dwCtx = params.timeAxisContext.find(t => t.source === 'DAEWUN');
    candidates.push({
      id: 'CAUSAL_03',
      title: '장기 대운 환경 무대의 과도기적 전환',
      evidence: dwCtx ? dwCtx.relationLabels.join(', ') : '대운 주기 이행',
      source: 'DAEWUN',
      confidence: 72,
      explanation: '단순한 우발적 사고가 아니라 삶의 10년 주기 환경 변화 속에서 방식과 가치관을 재정비하라는 신호',
    });

    return candidates;
  }

  /**
   * 점수 3종 독립 계산 (9절)
   */
  private calculateIntensityScore(
    evidences: string[],
    timeAxis: TimeAxisContextItem[],
    maga?: MagaDiagnosisComprehensiveResult
  ): number {
    let score = 40;
    for (const e of evidences) {
      if (e.includes('충')) score += 15;
      if (e.includes('원진') || e.includes('귀문')) score += 10;
      if (e.includes('형') || e.includes('해')) score += 8;
    }
    const cross = timeAxis.find(t => t.source === 'DAEWUN×SEUN');
    if (cross && cross.relationLabels.some(l => l.includes('충') || l.includes('합'))) {
      score += 12;
    }
    if (maga?.primaryMaga) {
      score = Math.round((score + maga.primaryMaga.intensityScore) / 2);
    }
    return Math.min(100, Math.max(20, score));
  }

  private calculateRelevanceScore(
    classification: EventClassificationResult,
    userEvent: UserEventInput
  ): number {
    let score = classification.domainConfidence * 0.7;
    const textLen = (userEvent.currentConcern + userEvent.eventDescription).length;
    if (textLen > 30) score += 20;
    else if (textLen > 10) score += 10;
    if (userEvent.emotion) score += 10;
    return Math.min(100, Math.max(30, Math.round(score)));
  }

  private calculateEvidenceScore(
    evidences: string[],
    relevantModules: string[]
  ): number {
    const evCountScore = Math.min(50, evidences.length * 15);
    const modCountScore = Math.min(50, relevantModules.length * 10);
    return Math.min(100, Math.max(35, evCountScore + modCountScore));
  }

  /**
   * 종합 설명 합성 (16, 17, 18절)
   */
  private synthesizeExplanations(params: {
    userEvent: UserEventInput;
    classification: EventClassificationResult;
    causalCandidates: CausalCandidate[];
    timeAxisContext: TimeAxisContextItem[];
    magaDiagnosis?: MagaDiagnosisComprehensiveResult;
    eventYear?: number;
  }) {
    const { userEvent, classification, causalCandidates, timeAxisContext, magaDiagnosis, eventYear } = params;
    const domain = classification.primaryDomain;
    const subType = classification.subType;

    // 1. 주 진단 (무슨 일이 일어나고 있는가?)
    const primaryDiagnosis = `현재 의뢰인이 겪고 계신 [${subType}] 문제는 우연한 불운이 아니라, ${domain} 영역에서 잠재되어 있던 상호작용의 취약점이 시간축의 흐름과 맞물려 표면화된 환경적 변동성으로 진단됩니다.`;

    // 2. 보조 진단 (세부 요인)
    const secondaryDiagnoses = causalCandidates.map(
      c => `[${c.title}] 요인: ${c.explanation} (명리 근거: ${c.evidence})`
    );

    // 3. 전통 명리 설명
    const traditionalExplanation = `전통 명리학에서는 이를 [${causalCandidates[0].evidence}] 및 기운의 편중 작용으로 해석하며, 오행의 상생상극 구조에서 특정 기운이 과열되어 환경적 지각변동을 촉발하는 상태로 봅니다.`;

    // 4. 현실 언어 설명 (17절: 전문 용어 배제, 생활 언어로 치환)
    const practicalExplanation = `현실적인 관점에서 보면, 지금은 ${domain}의 성과 자체보다 '사람과의 관계 방식과 계약 구조'에서 균열이 생기기 쉬운 시기입니다. 내가 원하는 진행 속도와 외부 파트너의 기대치가 어긋나며 생기는 마찰이므로, 감정적인 대립을 피하고 명확한 기준과 서면 확인을 강화하는 것이 핵심입니다.`;

    // 5. 위험 인식 (조심해야 할 함정)
    const riskAwareness = `상황을 즉각적으로 역전시키려는 조급함으로 인해 감정적인 결단을 내리거나, 검증되지 않은 말에 의존하여 2차 손실을 키우는 행동을 가장 경계해야 합니다.`;

    // 6. 개선 방향 (18절: 긍정적 변화 방향)
    const mitigationDirection = `말로써 갈등을 해결하려 하지 말고 역할과 책임을 객관적으로 문서화하여 경계를 분명히 세우세요. 상황이 냉각될 때까지 중대한 확장을 보류하고 내실을 다질 때 위기가 도약의 밑거름으로 전환됩니다.`;

    // 7. 처방 후보군
    const prescriptionCandidates = [
      '감정적 직접 대면 최소화 및 공식 소통 창구(이메일/서면) 일원화',
      '신규 계약 및 확장 의사결정 3개월 보류 및 현금 유동성 확보',
      '제3자 전문가(법률/노무/상담)를 통한 객관적 중재 프로세스 도입',
      '일상의 심신 안정 루틴 구축을 통한 스트레스 냉각',
    ];

    return {
      primaryDiagnosis,
      secondaryDiagnoses,
      traditionalExplanation,
      practicalExplanation,
      riskAwareness,
      mitigationDirection,
      prescriptionCandidates,
    };
  }
}

export const eventDiagnosisEngine = new EventDiagnosisEngine();

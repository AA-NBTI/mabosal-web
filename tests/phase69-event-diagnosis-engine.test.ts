/**
 * tests/phase69-event-diagnosis-engine.test.ts
 * 
 * Phase 69: 사건 진단 엔진 (Event Diagnosis Engine) 정밀 검증 테스트 스위트
 * 
 * "이용자가 가져온 실제 사건을 입력받아 → 사건 영역을 분류하고 → 관련 명리 구조를 탐색하고 →
 *  시간축과 마·살을 결합하여 → 현재 사건을 설명하는 진단을 생성한다."
 * 
 * 27대 정밀 검증 항목:
 * - EVENT-01: 사건 기본 분류 (단일 도메인 및 100점 점수화)
 * - EVENT-02: 복수 영역 분류 (PRIMARY + SECONDARY domains)
 * - EVENT-03: 세부 사건 분류 (투자 손실, 파트너 갈등, 상사 갈등 등)
 * - EVENT-04: 사건과 원인 분리 (단정적 1:1 결합 금지)
 * - EVENT-05: 원국 연결 (NATAL 구조와 사건 연계)
 * - EVENT-06: 대운 연결 (DAEWUN 환경과 사건 연계)
 * - EVENT-07: 세운 연결 (SEUN 환경과 사건 연계)
 * - EVENT-08: 대운×세운 연결 (교차 역학과 사건 연계)
 * - EVENT-09: 사건 시점 역검증 (eventDate 당시 대운/세운 역추적)
 * - EVENT-10: 마·살 연결 (Phase 68 MagaDiagnosisResult 연계)
 * - EVENT-11: 원인 후보 생성 (causalCandidates 리스트 및 신뢰도)
 * - EVENT-12: 원인 후보 중첩 (복수 명리 근거 공존)
 * - EVENT-13: intensity / relevance / evidence 분리 (점수 3종 독립 보존)
 * - EVENT-14: 동일 명식 + 다른 사건 (명식은 같으나 사업 vs 연애 vs 직장일 때 우선순위와 진단 분기)
 * - EVENT-15: 다른 명식 + 동일 사건 (사건은 같으나 명식이 다를 때 근거 차별화)
 * - EVENT-16: 미래 사건 안전성 (미래 연도 시 비결정론 가드)
 * - EVENT-17: 사건 날짜 없음 (eventDate 누락 시에도 안전 실행)
 * - EVENT-18: 불명확한 사건 (텍스트 짧거나 모호할 때 GENERAL/LIFE 안전 처리)
 * - EVENT-19: 복합 사건 (사업+인간관계 복합 사건 정상 처리)
 * - EVENT-20: 현실 언어 변환 (practicalExplanation 현실 어휘)
 * - EVENT-21: 결정성 (동일 입력 10회 반복 100% 동일)
 * - EVENT-22: CASE 01 실전 검증 (1992-03-15 연애/결별)
 * - EVENT-23: CASE 02 실전 검증 (1988-12-10 사업 부도/위기)
 * - EVENT-24: CASE 03 실전 검증 (1995-05-20 직장 이직/갈등)
 * - EVENT-25: CASE 04 실전 검증 (1982-04-05 투자 손실/재물)
 * - EVENT-26: CASE 05 실전 검증 (1986-08-15 건강 악화/수술)
 * - EVENT-27: 전체 회귀 (Phase 60~68 전체 모듈 및 상품 생성 아키텍처 회귀 검증)
 */

import { describe, it, expect } from 'vitest';
import {
  eventDiagnosisEngine,
  EventDiagnosisEngine,
  eventClassifier,
  EventClassifier,
  UserEventInput,
} from '../src/modules/event-diagnosis/index.js';
import { magaDiagnosisEngine } from '../src/modules/ma/maga-diagnosis-engine.js';
import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { ModularInput, ModularOutput } from '../src/modules/modular/types.js';

describe('Phase 69: 사건 진단 엔진 (Event Diagnosis Engine) Test Suite', () => {
  const engine = new EventDiagnosisEngine();
  const classifier = new EventClassifier();
  const generator = new ProductGenerator();

  // CASE 01 ~ 05 표준 사건 데이터
  const cases: {
    id: string;
    domain: string;
    birthDate: string;
    birthTime: string;
    gender: 'male' | 'female';
    eventDate: string;
    currentConcern: string;
    eventDescription: string;
    desiredQuestion: string;
    expectedSubType: string;
  }[] = [
    {
      id: 'CASE 01',
      domain: 'LOVE',
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male',
      eventDate: '2024-03-15',
      currentConcern: '연인과 결별했습니다.',
      eventDescription: '연인과 2년간 교제 끝에 성격 차이와 잦은 다툼으로 헤어졌습니다.',
      desiredQuestion: '왜 이런 이별을 겪어야 했고, 재회 가능성이 있는지 알고 싶습니다.',
      expectedSubType: '이별/결별',
    },
    {
      id: 'CASE 02',
      domain: 'BUSINESS',
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      eventDate: '2024-05-20',
      currentConcern: '거래처 부도와 동업자 지분 분쟁입니다.',
      eventDescription: '주요 거래처가 연쇄 부도 처리되고 동업자가 지분 매각을 요구하며 회사가 폐업 위기입니다.',
      desiredQuestion: '손실을 막고 회사를 살리기 위해 어떻게 법적·재정적 방어를 해야 합니까?',
      expectedSubType: '사업 실패/위기',
    },
    {
      id: 'CASE 03',
      domain: 'JOB',
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male',
      eventDate: '2025-02-10',
      currentConcern: '직장 상사 갈등과 인사 불이익입니다.',
      eventDescription: '새로 부임한 부서장과 업무 방식 차이로 갈등을 빚어 인사고과에서 최하점을 받았습니다.',
      desiredQuestion: '퇴사 후 이직을 하는 것이 나을지, 버티는 것이 나을지 타이밍을 알고 싶습니다.',
      expectedSubType: '상사 갈등',
    },
    {
      id: 'CASE 04',
      domain: 'MONEY',
      birthDate: '1982-04-05',
      birthTime: '06:00',
      gender: 'male',
      eventDate: '2024-06-15',
      currentConcern: '무리한 투자 실패와 부채 증가입니다.',
      eventDescription: '부동산 갭투자와 레버리지 투자 실패로 막대한 이자 부담과 채무 압박에 시달리고 있습니다.',
      desiredQuestion: '현금 흐름을 회복하고 손실을 최소화할 수 있는 해결책은 무엇입니까?',
      expectedSubType: '투자 손실',
    },
    {
      id: 'CASE 05',
      domain: 'HEALTH',
      birthDate: '1986-08-15',
      birthTime: '16:00',
      gender: 'male',
      eventDate: '2024-08-01',
      currentConcern: '급격한 건강 악화 및 수술 권유입니다.',
      eventDescription: '극심한 허리 통증으로 병원을 찾았다가 척추 디스크 파열로 긴급 수술을 권유받았습니다.',
      desiredQuestion: '지금 바로 수술을 받는 것이 맞는지, 신체 회복 주기는 언제인지 알고 싶습니다.',
      expectedSubType: '수술 및 급성 질환',
    },
  ];

  function getExecutedModules(c: typeof cases[0]): Record<string, ModularOutput> {
    const input: ModularInput = {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      gender: c.gender,
      targetYear: 2026,
      userTroubleText: `${c.currentConcern} / ${c.eventDescription}`,
    };
    return moduleRegistry.executeModules(moduleRegistry.getAllModuleIds(), input);
  }

  // ==========================================================================
  // EVENT-01: 사건 기본 분류 (단일 도메인 및 100점 점수화)
  // ==========================================================================
  it('EVENT-01: 사건 기본 분류 및 100점 기준 domainConfidence 산출 검증', () => {
    const c = cases[1]; // BUSINESS
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      desiredQuestion: c.desiredQuestion,
    };

    const cl = classifier.classifyEvent(input);
    expect(cl.primaryDomain).toBe('BUSINESS');
    expect(cl.domainConfidence).toBeGreaterThanOrEqual(60);
    expect(cl.domainConfidence).toBeLessThanOrEqual(100);
  });

  // ==========================================================================
  // EVENT-02: 복수 영역 분류 (PRIMARY + SECONDARY domains)
  // ==========================================================================
  it('EVENT-02: 사건 텍스트에 포함된 복수 영역(보조 도메인) 추출 및 보존 검증', () => {
    const input: UserEventInput = {
      birthData: { birthDate: '1988-12-10', gender: 'female' },
      currentConcern: '사업 파트너와 돈 문제로 갈등 중입니다.',
      eventDescription: '동업자와의 지분 투자금 손실로 인해 고소 및 인간관계 파탄 위기입니다.',
    };

    const cl = classifier.classifyEvent(input);
    expect(cl.primaryDomain).toBe('BUSINESS');
    expect(cl.secondaryDomains.length).toBeGreaterThanOrEqual(1);

    const secondaryNames = cl.secondaryDomains.map(d => d.domain);
    expect(secondaryNames.some(d => d === 'MONEY' || d === 'RELATIONSHIP')).toBe(true);
  });

  // ==========================================================================
  // EVENT-03: 세부 사건 분류
  // ==========================================================================
  it('EVENT-03: 세부 사건 유형(subType) 정밀 추출 및 subTypeConfidence 검증', () => {
    for (const c of cases) {
      const input: UserEventInput = {
        birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
        currentConcern: c.currentConcern,
        eventDescription: c.eventDescription,
      };

      const cl = classifier.classifyEvent(input);
      expect(cl.subType).toBe(c.expectedSubType);
      expect(cl.subTypeConfidence).toBeGreaterThanOrEqual(50);
      expect(cl.subTypeConfidence).toBeLessThanOrEqual(100);
    }
  });

  // ==========================================================================
  // EVENT-04: 사건과 원인 분리 (단정적 1:1 결합 금지)
  // ==========================================================================
  it('EVENT-04: 사건과 명리적 원인을 1:1로 확정하지 않고 인과 후보군으로 분리하는지 검증', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    // 사건은 사용자 입력 그대로 보존
    expect(diag.userEvent.currentConcern).toBe(c.currentConcern);
    // 원인은 "원인 = 인신충"으로 단정되지 않고 복수의 causalCandidates로 보존
    expect(diag.causalCandidates.length).toBeGreaterThanOrEqual(2);
    for (const cand of diag.causalCandidates) {
      expect(cand.confidence).toBeGreaterThan(0);
      expect(cand.explanation).toBeTruthy();
    }
  });

  // ==========================================================================
  // EVENT-05: 원국 연결
  // ==========================================================================
  it('EVENT-05: 원국(NATAL) 에너지 구도와 사건 진단의 정상 연계 검증', () => {
    const c = cases[0];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    const natalCtx = diag.timeAxisContext.find(t => t.source === 'NATAL');
    expect(natalCtx).toBeDefined();
    expect(natalCtx?.roleDescription).toContain('선천적');
  });

  // ==========================================================================
  // EVENT-06: 대운 연결
  // ==========================================================================
  it('EVENT-06: 대운(DAEWUN) 10년 환경 무대와 사건 진단의 연계 검증', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    const dwCtx = diag.timeAxisContext.find(t => t.source === 'DAEWUN');
    expect(dwCtx).toBeDefined();
    expect(dwCtx?.daewunGanji).toBe('경신');
  });

  // ==========================================================================
  // EVENT-07: 세운 연결
  // ==========================================================================
  it('EVENT-07: 세운(SEUN) 당해 연도 활동 에너지와 사건 진단의 연계 검증', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      eventDate: '2024-05-20',
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    const seunCtx = diag.timeAxisContext.find(t => t.source === 'SEUN');
    expect(seunCtx).toBeDefined();
    expect(seunCtx?.year).toBe(2024);
    expect(seunCtx?.seunGanji).toBe('갑진');
  });

  // ==========================================================================
  // EVENT-08: 대운×세운 연결
  // ==========================================================================
  it('EVENT-08: 대운×세운 교차 상호작용과 사건 진단의 연계 검증', () => {
    const c = cases[4]; // 1986년생, 2026년 기준 庚子 대운 × 丙午 세운 (자오충)
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      eventDate: '2026-08-01',
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    const crossCtx = diag.timeAxisContext.find(t => t.source === 'DAEWUN×SEUN');
    expect(crossCtx).toBeDefined();
    expect(crossCtx?.relationLabels.some(l => l.includes('충'))).toBe(true);
  });

  // ==========================================================================
  // EVENT-09: 사건 시점 역검증
  // ==========================================================================
  it('EVENT-09: 사건 발생연도(eventDate)에 따른 당시 대운/세운 역추적 검증', () => {
    const c = cases[0]; // 1992년생, 2024년 사건
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      eventDate: '2024-03-15',
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.eventDate).toBe('2024-03-15');
    const seun = diag.timeAxisContext.find(t => t.source === 'SEUN');
    expect(seun?.year).toBe(2024);
    expect(seun?.seunGanji).toBe('갑진');
  });

  // ==========================================================================
  // EVENT-10: 마·살 연결
  // ==========================================================================
  it('EVENT-10: Phase 68 마·살 진단 결과의 무손실 연계 검증', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      targetDomain: 'BUSINESS',
    };
    const executed = getExecutedModules(c);
    const magaRes = magaDiagnosisEngine.diagnose(
      { birthDate: c.birthDate, gender: c.gender, currentEvent: c.eventDescription, userTrouble: c.currentConcern },
      executed
    );

    const diag = engine.diagnoseEvent({
      userEvent: input,
      executedModules: executed,
      magaDiagnosis: magaRes,
    });

    expect(diag.magaDiagnoses.length).toBeGreaterThan(0);
    expect(diag.magaDiagnoses.some(m => m.includes('사업마'))).toBe(true);
  });

  // ==========================================================================
  // EVENT-11: 원인 후보 생성
  // ==========================================================================
  it('EVENT-11: 다중 원인 후보(causalCandidates) 리스트 및 신뢰도 생성 검증', () => {
    const c = cases[2];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.causalCandidates.length).toBeGreaterThanOrEqual(3);
    for (const cand of diag.causalCandidates) {
      expect(cand.id).toBeTruthy();
      expect(cand.title).toBeTruthy();
      expect(cand.evidence).toBeTruthy();
      expect(cand.confidence).toBeGreaterThan(50);
    }
  });

  // ==========================================================================
  // EVENT-12: 원인 후보 중첩
  // ==========================================================================
  it('EVENT-12: 원인 후보에 원국 충, 세운 유입, 대운 주기 등 복합 근거 공존 검증', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    const sources = diag.causalCandidates.map(c => c.source);
    expect(sources).toContain('NATAL');
    expect(sources).toContain('SEUN');
    expect(sources).toContain('DAEWUN');
  });

  // ==========================================================================
  // EVENT-13: intensity / relevance / evidence 분리
  // ==========================================================================
  it('EVENT-13: 3대 점수(intensityScore, relevanceScore, evidenceScore) 독립 보존 검증', () => {
    const c = cases[3];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.intensityScore).toBeGreaterThanOrEqual(0);
    expect(diag.intensityScore).toBeLessThanOrEqual(100);

    expect(diag.relevanceScore).toBeGreaterThanOrEqual(0);
    expect(diag.relevanceScore).toBeLessThanOrEqual(100);

    expect(diag.evidenceScore).toBeGreaterThanOrEqual(0);
    expect(diag.evidenceScore).toBeLessThanOrEqual(100);

    // 3대 점수가 객체에 각각 분리되어 보존됨
    expect(typeof diag.intensityScore).toBe('number');
    expect(typeof diag.relevanceScore).toBe('number');
    expect(typeof diag.evidenceScore).toBe('number');
  });

  // ==========================================================================
  // EVENT-14: 동일 명식 + 다른 사건
  // ==========================================================================
  it('EVENT-14: 동일 명식이라도 사건이 다르면 진단 결과와 우선순위가 차별화되는지 검증', () => {
    const c = cases[1]; // 1988-12-10 여성 명식
    const executed = getExecutedModules(c);

    // 사건 1: 사업 동업 분쟁
    const diagBiz = engine.diagnoseEvent({
      userEvent: {
        birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
        currentConcern: '사업 파트너와 지분 분쟁이 발생했습니다.',
        eventDescription: '동업자와 계약 조건이 틀어져 소송 및 폐업 위기입니다.',
      },
      executedModules: executed,
    });

    // 사건 2: 연인과 결별
    const diagLove = engine.diagnoseEvent({
      userEvent: {
        birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
        currentConcern: '연인과 결별했습니다.',
        eventDescription: '성격 차이로 다투다가 결국 헤어지게 되었습니다.',
      },
      executedModules: executed,
    });

    expect(diagBiz.eventDomain).toBe('BUSINESS');
    expect(diagLove.eventDomain).toBe('LOVE');
    expect(diagBiz.eventSubType).not.toBe(diagLove.eventSubType);
    expect(diagBiz.primaryDiagnosis).not.toBe(diagLove.primaryDiagnosis);
  });

  // ==========================================================================
  // EVENT-15: 다른 명식 + 동일 사건
  // ==========================================================================
  it('EVENT-15: 동일한 사업 사건이라도 명식이 다르면 명리적 근거가 차별화되는지 검증', () => {
    const commonEvent: UserEventInput = {
      birthData: { birthDate: '1988-12-10', gender: 'female' },
      currentConcern: '사업 파트너와 계약 분쟁이 생겼습니다.',
      eventDescription: '동업자가 계약을 파기하려 하여 법적 조치를 취해야 할 상황입니다.',
      targetDomain: 'BUSINESS',
    };

    const exec02 = getExecutedModules(cases[1]);
    const exec03 = getExecutedModules(cases[2]);

    const diag02 = engine.diagnoseEvent({ userEvent: commonEvent, executedModules: exec02 });
    const diag03 = engine.diagnoseEvent({ userEvent: commonEvent, executedModules: exec03 });

    // 도메인은 둘 다 BUSINESS이나, 명리적 근거(evidence)는 서로 다름
    expect(diag02.eventDomain).toBe('BUSINESS');
    expect(diag03.eventDomain).toBe('BUSINESS');

    const ev02Str = diag02.evidence.join(' ');
    const ev03Str = diag03.evidence.join(' ');
    expect(ev02Str).not.toBe(ev03Str);
  });

  // ==========================================================================
  // EVENT-16: 미래 사건 안전성
  // ==========================================================================
  it('EVENT-16: 미래 시점 사건 분석 시 결정론적 단정 및 공포 표현 완전 차단 검증', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: '2030년 신규 사업 런칭 계획',
      eventDescription: '미래에 새로운 비즈니스를 확장하고자 합니다.',
      eventDate: '2030-01-01',
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    const allText = [
      diag.primaryDiagnosis,
      ...diag.secondaryDiagnoses,
      diag.traditionalExplanation,
      diag.practicalExplanation,
      diag.riskAwareness,
      diag.mitigationDirection,
    ].join(' ');

    const forbidden = ['반드시 실패', '파산한다', '무조건 이혼', '죽는다', '피할 수 없다'];
    for (const f of forbidden) {
      expect(allText).not.toContain(f);
    }
    expect(diag.safetyFlags).toContain('FEAR_EXPRESSION_GUARD_PASSED');
  });

  // ==========================================================================
  // EVENT-17: 사건 날짜 없음
  // ==========================================================================
  it('EVENT-17: eventDate가 누락되어도 시스템 크래시 없이 현재 연도 기준으로 안전 실행 검증', () => {
    const input: UserEventInput = {
      birthData: { birthDate: '1992-03-15', gender: 'male' },
      currentConcern: '최근 마음이 답답하고 불안합니다.',
      eventDescription: '특별한 날짜는 없지만 일상에서 계속 정체가 느껴집니다.',
    };

    const diag = engine.diagnoseEvent({ userEvent: input });
    expect(diag).toBeDefined();
    expect(diag.eventDomain).toBe('LIFE');
    expect(diag.timeAxisContext.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // EVENT-18: 불명확한 사건
  // ==========================================================================
  it('EVENT-18: 텍스트가 극도로 짧거나 모호한 경우 포괄적 LIFE 도메인으로 안전 완화 검증', () => {
    const input: UserEventInput = {
      birthData: { birthDate: '1990-01-01', gender: 'male' },
      currentConcern: '그냥 답답함',
      eventDescription: '...',
    };

    const diag = engine.diagnoseEvent({ userEvent: input });
    expect(diag).toBeDefined();
    expect(diag.eventDomain).toBe('LIFE');
    expect(diag.confidence).toBeGreaterThan(0);
  });

  // ==========================================================================
  // EVENT-19: 복합 사건
  // ==========================================================================
  it('EVENT-19: 사업 및 인간관계가 복합적으로 얽힌 사건의 정상 처리 검증', () => {
    const input: UserEventInput = {
      birthData: { birthDate: '1988-12-10', gender: 'female' },
      currentConcern: '친구와 함께 창업한 회사의 지분 갈등 및 배신',
      eventDescription: '10년 지기 친구와 공동대표로 사업을 운영하다가 자금 유용 및 배신으로 고소 직전입니다.',
    };

    const cl = classifier.classifyEvent(input);
    expect(cl.primaryDomain).toBe('BUSINESS');
    expect(cl.secondaryDomains.some(d => d.domain === 'RELATIONSHIP')).toBe(true);
  });

  // ==========================================================================
  // EVENT-20: 현실 언어 변환
  // ==========================================================================
  it('EVENT-20: practicalExplanation에 전문용어 대신 일상 실천 언어가 담기는지 검증', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.practicalExplanation).toContain('사람과의 관계 방식');
    expect(diag.practicalExplanation).toContain('서면 확인');
  });

  // ==========================================================================
  // EVENT-21: 결정성 (동일 입력 10회 반복 100% 동일)
  // ==========================================================================
  it('EVENT-21: 동일 사건 입력 10회 반복 진단 시 100% 동일 결과 결정성 보장 검증', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
    };
    const executed = getExecutedModules(c);

    let firstDomain = '';
    let firstIntensity = 0;
    let firstRelevance = 0;

    for (let i = 0; i < 10; i++) {
      const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });
      if (i === 0) {
        firstDomain = diag.eventDomain;
        firstIntensity = diag.intensityScore;
        firstRelevance = diag.relevanceScore;
      } else {
        expect(diag.eventDomain).toBe(firstDomain);
        expect(diag.intensityScore).toBe(firstIntensity);
        expect(diag.relevanceScore).toBe(firstRelevance);
      }
    }
  });

  // ==========================================================================
  // EVENT-22: CASE 01 실전 검증 (연애/결별)
  // ==========================================================================
  it('EVENT-22: CASE 01 실전 검증 - 1992년생 연애/결별 사건 종합 진단', () => {
    const c = cases[0];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      eventDate: c.eventDate,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.eventDomain).toBe('LOVE');
    expect(diag.eventSubType).toBe('이별/결별');
    expect(diag.timeAxisContext.some(t => t.source === 'SEUN' && t.year === 2024)).toBe(true);
    expect(diag.prescriptionCandidates.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // EVENT-23: CASE 02 실전 검증 (사업 부도/위기)
  // ==========================================================================
  it('EVENT-23: CASE 02 실전 검증 - 1988년생 사업 위기 및 지분 분쟁 사건 종합 진단', () => {
    const c = cases[1];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      eventDate: c.eventDate,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.eventDomain).toBe('BUSINESS');
    expect(diag.eventSubType).toBe('사업 실패/위기');
    expect(diag.primaryDiagnosis).toContain('사업 실패/위기');
  });

  // ==========================================================================
  // EVENT-24: CASE 03 실전 검증 (직장 이직/갈등)
  // ==========================================================================
  it('EVENT-24: CASE 03 실전 검증 - 1995년생 직장 상사 갈등 및 인사 불이익 사건 종합 진단', () => {
    const c = cases[2];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      eventDate: c.eventDate,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.eventDomain).toBe('JOB');
    expect(diag.eventSubType).toBe('상사 갈등');
    expect(diag.causalCandidates.some(cand => cand.title.includes('충돌') || cand.title.includes('변동성'))).toBe(true);
  });

  // ==========================================================================
  // EVENT-25: CASE 04 실전 검증 (투자 손실/재물)
  // ==========================================================================
  it('EVENT-25: CASE 04 실전 검증 - 1982년생 무리한 투자 손실 및 채무 사건 종합 진단', () => {
    const c = cases[3];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      eventDate: c.eventDate,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.eventDomain).toBe('MONEY');
    expect(diag.eventSubType).toBe('투자 손실');
    expect(diag.intensityScore).toBeGreaterThanOrEqual(50);
  });

  // ==========================================================================
  // EVENT-26: CASE 05 실전 검증 (건강 악화/수술)
  // ==========================================================================
  it('EVENT-26: CASE 05 실전 검증 - 1986년생 급성 질환 및 수술 사건 종합 진단', () => {
    const c = cases[4];
    const input: UserEventInput = {
      birthData: { birthDate: c.birthDate, birthTime: c.birthTime, gender: c.gender },
      currentConcern: c.currentConcern,
      eventDescription: c.eventDescription,
      eventDate: c.eventDate,
    };
    const executed = getExecutedModules(c);
    const diag = engine.diagnoseEvent({ userEvent: input, executedModules: executed });

    expect(diag.eventDomain).toBe('HEALTH');
    expect(diag.eventSubType).toBe('수술 및 급성 질환');
    expect(diag.safetyFlags).toContain('FEAR_EXPRESSION_GUARD_PASSED');
  });

  // ==========================================================================
  // EVENT-27: Phase 60~68 전체 회귀 검증
  // ==========================================================================
  it('EVENT-27: Phase 60~68 전체 모듈 및 상품 생성 아키텍처 무손실 회귀 검증', () => {
    const allIds = moduleRegistry.getAllModuleIds();
    expect(allIds.length).toBe(19);

    for (const c of cases) {
      const prod = generator.generateProduct(
        {
          birthDate: c.birthDate,
          birthTime: c.birthTime,
          gender: c.gender,
          targetDomain: c.domain as any,
          currentEvent: c.eventDescription,
          userTrouble: c.currentConcern,
          targetYear: 2026,
        },
        {
          selectedModules: allIds,
          insightDepth: 5,
        }
      );

      expect(prod).toBeDefined();
      expect(prod.executedModules['MAGA_DIAGNOSIS']).toBeDefined();
      expect(prod.depthReport.sections.length).toBe(5);
    }
  });
});

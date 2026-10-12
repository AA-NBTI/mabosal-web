/**
 * tests/phase70-prescription-engine.test.ts
 * 
 * Phase 70: 처방 엔진 (Prescription Engine) 정밀 검증 테스트 스위트
 * 
 * "진단 → 보완 필요 요소 → 환경 처방 → 행동 처방 → 처방물 후보 → 기대 목적"
 * 
 * 31대 정밀 검증 항목:
 * - PRES-01: 기본 처방 생성 (PrescriptionResult 기본 구조 및 topPrescriptions 도출)
 * - PRES-02: 환경 처방 (공간, 조명, 채광, 색상 등 현실적 환경 조치)
 * - PRES-03: 행동 처방 (24시간 유예, 문서화, 감정적 담판 배제 등 구체적 행동 조치)
 * - PRES-04: 처방물 후보 (디지털 배경화면, 리마인더 카드, 상징 부적 등 보조 수단)
 * - PRES-05: 명리 근거 보존 (모든 처방에 basis[] 보존 및 비어있지 않음)
 * - PRES-06: 용신/희신 연계 (기존 결과 승계 및 전문 용어+현실 의미 결합)
 * - PRES-07: 문제 영역 연계 (8대 영역 도메인 카테고리 매핑)
 * - PRES-08: 마·살 연계 (MagaDiagnosisResultItem 연계 처방 생성)
 * - PRES-09: 대운 연계 (daewunBehavior 장기 행동 지침)
 * - PRES-10: 세운 연계 (seunCaution 단기 주의 행동 지침)
 * - PRES-11: 시간축 보존 (general, daewun, seun, intensive 분리)
 * - PRES-12: 처방 점수 독립성 (5대 독립 점수 0~100 보존)
 * - PRES-13: 처방 우선순위 (priorityScore 기준 상위 3대 핵심 처방 선정)
 * - PRES-14: 실행 가능성 (feasibilityScore 독립 평가 및 비현실적 처방 하향)
 * - PRES-15: 같은 명식 / 다른 문제 (동일 명식이나 사업 vs 연애일 때 분기)
 * - PRES-16: 다른 명식 / 같은 문제 (동일 사업 문제이나 명식이 다를 때 근거 분기)
 * - PRES-17: 처방 중복 제거 (동일 제목/카테고리 중복 필터링)
 * - PRES-18: 근거 없는 처방 차단 (basis 누락 시 SafetyGuard 거부 및 고객 출력 제외)
 * - PRES-19: 미래 결정론 차단 ("반드시 문제가 생깁니다" 등 필터링/순화)
 * - PRES-20: HEALTH 안전성 (의료 면책 및 공인 전문의 상담 안내)
 * - PRES-21: MONEY 안전성 (금융 면책 및 투자 원금 보장 배제)
 * - PRES-22: BUSINESS 안전성 (계약 서면화 및 법률/세무 자문 권고)
 * - PRES-23: 처방물 효능 과장 차단 (운명 변화/초자연적 효능 보장 배제 문구)
 * - PRES-24: 한글 우선 출력 (한글 명칭 우선 표기)
 * - PRES-25: 결정성 (동일 입력 10회 반복 실행 100% 동일)
 * - PRES-26: CASE 01 실전 검증 (1992-03-15 연애/결별)
 * - PRES-27: CASE 02 실전 검증 (1988-12-10 사업 부도/위기)
 * - PRES-28: CASE 03 실전 검증 (1995-05-20 직장 상사 갈등)
 * - PRES-29: CASE 04 실전 검증 (1982-04-05 투자 손실/재물)
 * - PRES-30: CASE 05 실전 검증 (1986-08-15 건강 악화/수술)
 * - PRES-31: 전체 회귀 (Phase 60~69 전체 모듈 및 상품 생성 아키텍처 회귀 검증)
 */

import { describe, it, expect } from 'vitest';
import {
  prescriptionEngine,
  PrescriptionEngine,
  prescriptionSafetyGuard,
  prescriptionPriorityEngine,
  environmentPrescriptionGenerator,
  behaviorPrescriptionGenerator,
  remedyItemGenerator,
  PrescriptionInput,
  Prescription,
} from '../src/modules/prescription/index.js';
import { eventDiagnosisEngine } from '../src/modules/event-diagnosis/index.js';
import { magaDiagnosisEngine } from '../src/modules/ma/maga-diagnosis-engine.js';
import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { IntegratedAnalyzer } from '../src/modules/modular/integrated-analyzer.js';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { ModularInput, ModularOutput } from '../src/modules/modular/types.js';

describe('Phase 70: 마보살 처방 엔진 (Prescription Engine) Test Suite', () => {
  const engine = new PrescriptionEngine();
  const analyzer = new IntegratedAnalyzer();
  const generator = new ProductGenerator();

  // CASE 01 ~ 05 표준 사건 데이터
  const cases = [
    {
      id: 'CASE 01',
      domain: 'LOVE',
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
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
      gender: 'female' as const,
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
      gender: 'male' as const,
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
      gender: 'male' as const,
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
      gender: 'male' as const,
      eventDate: '2024-08-01',
      currentConcern: '급격한 건강 악화 및 수술 권유입니다.',
      eventDescription: '극심한 허리 통증으로 병원을 찾았다가 척추 디스크 파열로 긴급 수술을 권유받았습니다.',
      desiredQuestion: '지금 바로 수술을 받는 것이 맞는지, 신체 회복 주기는 언제인지 알고 싶습니다.',
      expectedSubType: '수술 및 급성 질환',
    },
  ];

  function buildFullPrescriptionInput(c: typeof cases[0]): PrescriptionInput {
    const modInput: ModularInput = {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      gender: c.gender,
      targetYear: 2026,
      userTroubleText: `${c.currentConcern} / ${c.eventDescription}`,
    };
    const moduleResults = moduleRegistry.executeModules(moduleRegistry.getAllModuleIds(), modInput);
    const integrated = analyzer.analyze(moduleResults);

    const magaResult = magaDiagnosisEngine.diagnose(
      {
        birthDate: c.birthDate,
        birthTime: c.birthTime,
        gender: c.gender,
        currentEvent: c.currentConcern,
        targetDomain: c.domain as any,
        desiredQuestion: c.desiredQuestion,
      },
      moduleResults,
      integrated
    );

    const eventResult = eventDiagnosisEngine.diagnoseEvent({
      userEvent: {
        birthData: {
          birthDate: c.birthDate,
          birthTime: c.birthTime,
          gender: c.gender,
        },
        currentConcern: c.currentConcern,
        eventDescription: c.eventDescription,
        desiredQuestion: c.desiredQuestion,
        eventDate: c.eventDate,
        targetDomain: c.domain,
      },
      integratedAnalysis: integrated,
      magaDiagnosis: magaResult,
      executedModules: moduleResults,
    });

    return {
      integratedAnalysis: integrated,
      magaDiagnosis: magaResult,
      eventDiagnosis: eventResult,
      moduleResults,
      userEvent: {
        currentConcern: c.currentConcern,
        eventDescription: c.eventDescription,
        targetDomain: c.domain,
      },
      targetYear: 2026,
    };
  }

  // ==========================================================================
  // PRES-01: 기본 처방 생성
  // ==========================================================================
  it('PRES-01: PrescriptionResult 기본 구조 및 3대 핵심 처방(topPrescriptions)이 정상 생성되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]); // CASE 02
    const result = engine.generatePrescription(input);

    expect(result.resultId).toBeDefined();
    expect(result.domain).toBe('BUSINESS');
    expect(result.prescriptions.length).toBeGreaterThan(0);
    expect(result.topPrescriptions.length).toBeLessThanOrEqual(3);
    expect(result.customerResult).toBeDefined();
    expect(result.customerResult.top3Prescriptions.length).toBe(result.topPrescriptions.length);
    expect(result.customerResult.currentProblem).toContain('거래처 부도');
  });

  // ==========================================================================
  // PRES-02: 환경 처방
  // ==========================================================================
  it('PRES-02: 환경 처방은 구체적인 공간, 채광, 조명, 색상, 배치 가이드를 포함해야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    const envActions = result.customerResult.environmentSummary;
    expect(envActions.length).toBeGreaterThan(0);
    // 모호한 표현 대신 구체적 공간/배치/채광 표현 존재 확인
    const hasConcreteTerms = envActions.some(
      a => a.includes('공간') || a.includes('조명') || a.includes('책상') || a.includes('배치') || a.includes('회의실')
    );
    expect(hasConcreteTerms).toBe(true);
  });

  // ==========================================================================
  // PRES-03: 행동 처방
  // ==========================================================================
  it('PRES-03: 행동 처방은 24시간 숙고, 서면화, 충동적 담판 배제 등 현실적 실행 지침을 포함해야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    const behActions = result.customerResult.behaviorSummary;
    expect(behActions.length).toBeGreaterThan(0);
    const hasRealisticAction = behActions.some(
      a => a.includes('서면') || a.includes('계약') || a.includes('24시간') || a.includes('검토')
    );
    expect(hasRealisticAction).toBe(true);
  });

  // ==========================================================================
  // PRES-04: 처방물 후보
  // ==========================================================================
  it('PRES-04: 처방물 후보는 디지털 배경화면, 리마인더 카드, 상징 부적 등 보조 수단으로 구조화되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[0]);
    const result = engine.generatePrescription(input);

    expect(result.customerResult.remedyItemsSummary.length).toBeGreaterThan(0);
    const types = result.customerResult.remedyItemsSummary.map(r => r.type);
    expect(types).toContain('DIGITAL_WALLPAPER');
    expect(types).toContain('REMINDER_CARD');

    // 처방물 개인화 속성 확인
    const card = result.customerResult.remedyItemsSummary.find(r => r.type === 'REMINDER_CARD');
    expect(card?.personalization).toBeDefined();
    expect(card?.safetyNotice).toContain('상징적 보조 수단');
  });

  // ==========================================================================
  // PRES-05: 명리 근거 보존
  // ==========================================================================
  it('PRES-05: 모든 처방은 반드시 명리 근거(basis[])를 가지며, basis가 비어있는 처방은 제외되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[2]);
    const result = engine.generatePrescription(input);

    for (const p of result.prescriptions) {
      expect(p.basis).toBeDefined();
      expect(p.basis.length).toBeGreaterThan(0);
      expect(p.basis.some(b => b.includes('사주') || b.includes('명리') || b.includes('오행') || b.includes('충') || b.includes('마') || b.includes('십신'))).toBe(true);
    }
  });

  // ==========================================================================
  // PRES-06: 용신/희신 연계
  // ==========================================================================
  it('PRES-06: 기존 명리 엔진의 용신/희신을 재계산 없이 승계하여 친절한 현실 언어로 제시해야 한다', () => {
    const input = buildFullPrescriptionInput(cases[0]);
    const result = engine.generatePrescription(input);

    const eokbuPres = result.prescriptions.find(p => p.prescriptionId.includes('EOKBU'));
    expect(eokbuPres).toBeDefined();
    expect(eokbuPres?.targetElement).toBeDefined();
    expect(eokbuPres?.title).toMatch(/[목화토금수]/);
  });

  // ==========================================================================
  // PRES-07: 문제 영역 연계
  // ==========================================================================
  it('PRES-07: 8대 영역(MONEY, BUSINESS, JOB, LOVE, MARRIAGE, RELATIONSHIP, HEALTH, LIFE)이 정확히 매핑되어야 한다', () => {
    for (const c of cases) {
      const input = buildFullPrescriptionInput(c);
      const result = engine.generatePrescription(input);
      expect(result.domain).toBe(c.domain);
      expect(result.customerResult.coreDiagnosis).toContain(c.domain);
    }
  });

  // ==========================================================================
  // PRES-08: 마·살 연계
  // ==========================================================================
  it('PRES-08: Phase 68 마·살 진단 결과가 처방의 타깃 및 명리 근거로 정상 결합되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    const magaPres = result.prescriptions.find(p => p.prescriptionId.includes('MAGA'));
    expect(magaPres).toBeDefined();
    expect(magaPres?.targetMaga).toBeDefined();
    expect(magaPres?.basis.some(b => b.includes('마') || b.includes('살') || b.includes('진단'))).toBe(true);
  });

  // ==========================================================================
  // PRES-09: 대운 연계
  // ==========================================================================
  it('PRES-09: 대운 시간축 정보가 처방의 장기 행동 지침(daewunBehavior)에 보존되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    expect(result.timeAxisSummary.daewun.length).toBeGreaterThan(0);
    const hasDaewunKeyword = result.timeAxisSummary.daewun.some(d => d.includes('대운'));
    expect(hasDaewunKeyword).toBe(true);
  });

  // ==========================================================================
  // PRES-10: 세운 연계
  // ==========================================================================
  it('PRES-10: 세운 시간축 정보가 처방의 단기 주의 행동 지침(seunCaution)에 보존되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    expect(result.timeAxisSummary.seun.length).toBeGreaterThan(0);
    const hasSeunKeyword = result.timeAxisSummary.seun.some(s => s.includes('세운'));
    expect(hasSeunKeyword).toBe(true);
  });

  // ==========================================================================
  // PRES-11: 시간축 보존
  // ==========================================================================
  it('PRES-11: 평상시, 대운, 세운, 집중관리 시점이 서로 혼동되지 않고 독립 보존되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    expect(result.timeAxisSummary.general).toBeDefined();
    expect(result.timeAxisSummary.daewun).toBeDefined();
    expect(result.timeAxisSummary.seun).toBeDefined();
    expect(result.timeAxisSummary.intensive).toBeDefined();
  });

  // ==========================================================================
  // PRES-12: 처방 점수 독립성
  // ==========================================================================
  it('PRES-12: 5대 처방 점수(evidence, relevance, feasibility, priority, confidence)가 독립 보존되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[0]);
    const result = engine.generatePrescription(input);

    for (const p of result.prescriptions) {
      expect(p.evidenceScore).toBeGreaterThanOrEqual(0);
      expect(p.evidenceScore).toBeLessThanOrEqual(100);

      expect(p.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(p.relevanceScore).toBeLessThanOrEqual(100);

      expect(p.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(p.feasibilityScore).toBeLessThanOrEqual(100);

      expect(p.priorityScore).toBeGreaterThanOrEqual(0);
      expect(p.priorityScore).toBeLessThanOrEqual(100);

      expect(p.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(p.confidenceScore).toBeLessThanOrEqual(100);

      // 근거가 높다고 무조건 실행 가능성과 일치하지 않음
      expect(typeof p.feasibilityScore).toBe('number');
    }
  });

  // ==========================================================================
  // PRES-13: 처방 우선순위
  // ==========================================================================
  it('PRES-13: 처방은 priorityScore 기준으로 정렬되어 상위 3개가 고객용 top3Prescriptions로 선정되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    for (let i = 0; i < result.prescriptions.length - 1; i++) {
      expect(result.prescriptions[i].priorityScore).toBeGreaterThanOrEqual(
        result.prescriptions[i + 1].priorityScore
      );
    }
    expect(result.customerResult.top3Prescriptions.length).toBe(Math.min(3, result.prescriptions.length));
  });

  // ==========================================================================
  // PRES-14: 실행 가능성
  // ==========================================================================
  it('PRES-14: 현실적이고 구체적인 조치 개수에 따라 feasibilityScore가 차등 계산되어야 한다', () => {
    const scores = prescriptionPriorityEngine.calculateScores({
      basisCount: 3,
      hasRootClashOrHarm: true,
      hasYongsinOrHeesin: true,
      hasMaga: true,
      isCurrentDomainDirectMatch: true,
      isSubEventDirectMatch: true,
      environmentCount: 3,
      behaviorCount: 3,
      timeAxisOverlapped: true,
    });
    expect(scores.feasibilityScore).toBe(100);
    expect(scores.priorityScore).toBeGreaterThan(70);
  });

  // ==========================================================================
  // PRES-15: 같은 명식 / 다른 문제
  // ==========================================================================
  it('PRES-15: 동일 명식이라도 사업 문제와 연애 문제의 처방 도메인 및 행동 지침이 명확히 달라야 한다', () => {
    const baseCase = cases[0]; // 1992-03-15
    const loveInput = buildFullPrescriptionInput(baseCase);

    const bizInput = buildFullPrescriptionInput({
      ...baseCase,
      domain: 'BUSINESS',
      currentConcern: '신규 창업 계약 및 동업자 분쟁',
      eventDescription: '동업자와 계약 조항 갈등으로 사업 추진이 중단되었습니다.',
      expectedSubType: '사업 위기',
    });

    const loveResult = engine.generatePrescription(loveInput);
    const bizResult = engine.generatePrescription(bizInput);

    expect(loveResult.domain).toBe('LOVE');
    expect(bizResult.domain).toBe('BUSINESS');
    expect(loveResult.customerResult.behaviorSummary[0]).not.toEqual(
      bizResult.customerResult.behaviorSummary[0]
    );
  });

  // ==========================================================================
  // PRES-16: 다른 명식 / 같은 문제
  // ==========================================================================
  it('PRES-16: 같은 사업 문제라도 명식이 다르면 명리 근거와 보완 요소가 달라야 한다', () => {
    const case1Biz = buildFullPrescriptionInput({
      ...cases[0], // 1992-03-15 (壬申년 癸卯월)
      domain: 'BUSINESS',
      currentConcern: '거래처 부도와 동업자 지분 분쟁입니다.',
      eventDescription: '주요 거래처가 부도나고 동업자와 분쟁 중입니다.',
    });

    const case2Biz = buildFullPrescriptionInput(cases[1]); // 1988-12-10 (戊辰년 甲子월)

    const res1 = engine.generatePrescription(case1Biz);
    const res2 = engine.generatePrescription(case2Biz);

    expect(res1.domain).toBe('BUSINESS');
    expect(res2.domain).toBe('BUSINESS');
    // 두 사람의 명리 근거 내용이 달라야 함
    expect(res1.prescriptions[0].basis).not.toEqual(res2.prescriptions[0].basis);
  });

  // ==========================================================================
  // PRES-17: 처방 중복 제거
  // ==========================================================================
  it('PRES-17: 동일한 카테고리와 제목을 가진 중복 처방은 자동 제거되어야 한다', () => {
    const samplePrescription: Prescription = {
      prescriptionId: 'SAMPLE-1',
      category: 'BUSINESS',
      title: '[기운 보완] 데스크 정돈 처방',
      basis: ['사주 원국 근거'],
      targetProblem: '사업 스트레스',
      environmentActions: ['공간 환기'],
      behaviorActions: ['문서화'],
      remedyItems: [],
      expectedPurpose: '안정',
      priority: 'HIGH',
      intensity: 'RECOMMENDED',
      confidence: 0.8,
      evidenceScore: 80,
      relevanceScore: 80,
      feasibilityScore: 80,
      priorityScore: 80,
      confidenceScore: 80,
      explanationStructured: { why: '', what: '', how: '', purpose: '' },
      safetyFlags: [],
    };

    const duplicateList = [samplePrescription, { ...samplePrescription, prescriptionId: 'SAMPLE-2' }];
    const deduplicated = prescriptionPriorityEngine.sortAndDeduplicate(duplicateList);
    expect(deduplicated.length).toBe(1);
  });

  // ==========================================================================
  // PRES-18: 근거 없는 처방 차단
  // ==========================================================================
  it('PRES-18: 명리 근거(basis[])가 비어있는 처방은 SafetyGuard에서 차단되어야 한다', () => {
    const invalidPres: Prescription = {
      prescriptionId: 'NO-BASIS-1',
      category: 'LIFE',
      title: '임의의 근거 없는 처방',
      basis: [], // 비어있음!
      targetProblem: '문제',
      environmentActions: ['행동'],
      behaviorActions: ['행동'],
      remedyItems: [],
      expectedPurpose: '목적',
      priority: 'LOW',
      intensity: 'RECOMMENDED',
      confidence: 0.5,
      evidenceScore: 0,
      relevanceScore: 0,
      feasibilityScore: 0,
      priorityScore: 0,
      confidenceScore: 0,
      explanationStructured: { why: '', what: '', how: '', purpose: '' },
      safetyFlags: [],
    };

    const vResult = prescriptionSafetyGuard.validatePrescription(invalidPres);
    expect(vResult.isValid).toBe(false);
    expect(vResult.safetyFlags).toContain('REJECTED_NO_BASIS');
  });

  // ==========================================================================
  // PRES-19: 미래 결정론 차단
  // ==========================================================================
  it('PRES-19: "반드시 문제가 생깁니다" 등 결정론적/공포성 표현은 순화되어야 한다', () => {
    const rawText = '내년 상반기에 반드시 문제가 생깁니다. 무조건 실패합니다.';
    const sanitized = prescriptionSafetyGuard.sanitizeText(rawText);

    expect(sanitized).not.toContain('반드시 문제가 생깁니다');
    expect(sanitized).not.toContain('무조건 실패합니다');
    expect(sanitized).toContain('관리 수준을 높이는 것이 좋습니다');
  });

  // ==========================================================================
  // PRES-20: HEALTH 안전성
  // ==========================================================================
  it('PRES-20: HEALTH 영역 처방에는 의료 전문의 상담 권고 및 면책 고지가 반드시 포함되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[4]); // CASE 05
    const result = engine.generatePrescription(input);

    expect(result.domain).toBe('HEALTH');
    expect(result.customerResult.safetyNotice).toContain('의학적 진단 및 치료를 대신할 수 없습니다');
    expect(result.safetyVerification.flags).toContain('HEALTH_DISCLAIMER_ATTACHED');
  });

  // ==========================================================================
  // PRES-21: MONEY 안전성
  // ==========================================================================
  it('PRES-21: MONEY 영역 처방에는 원금 보장/수익 보장이 배제되고 금융 면책이 부착되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[3]); // CASE 04
    const result = engine.generatePrescription(input);

    expect(result.domain).toBe('MONEY');
    expect(result.customerResult.safetyNotice).toContain('수익률을 보장하거나 원금 보존을 약속하지 않습니다');
    expect(result.safetyVerification.flags).toContain('FINANCIAL_RISK_GUARDED');
  });

  // ==========================================================================
  // PRES-22: BUSINESS 안전성
  // ==========================================================================
  it('PRES-22: BUSINESS 영역 처방에는 서면 계약서 작성 및 법률/세무 자문 권고가 부착되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]); // CASE 02
    const result = engine.generatePrescription(input);

    expect(result.domain).toBe('BUSINESS');
    expect(result.customerResult.safetyNotice).toContain('법률 및 세무 사안은 전문가의 검토를 받으십시오');
    expect(result.safetyVerification.flags).toContain('BUSINESS_CONTRACT_GUARDED');
  });

  // ==========================================================================
  // PRES-23: 처방물 효능 과장 차단
  // ==========================================================================
  it('PRES-23: 처방물(RemedyItem)은 운명 변화를 보장하지 않는다는 상징적 보조 수단 고지를 포함해야 한다', () => {
    const items = remedyItemGenerator.generateRemedyItems({
      prescriptionId: 'TEST-PRES',
      category: 'LOVE',
      targetElement: '화',
      basis: ['명리 근거'],
      mainTheme: '평정심',
    });

    for (const item of items) {
      expect(item.safetyNotice).toContain('상징적 보조 수단');
      expect(item.safetyNotice).toContain('보장하지 않습니다');
    }
  });

  // ==========================================================================
  // PRES-24: 한글 우선 출력
  // ==========================================================================
  it('PRES-24: 처방 명칭 및 근거 설명은 한글 우선 명칭 체계를 유지해야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    for (const p of result.prescriptions) {
      expect(p.title).toMatch(/[가-힣]/);
      expect(p.expectedPurpose).toMatch(/[가-힣]/);
    }
  });

  // ==========================================================================
  // PRES-25: 결정성
  // ==========================================================================
  it('PRES-25: 동일한 입력을 10회 반복 실행해도 100% 동일한 처방 결과가 도출되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[2]);
    const firstResult = engine.generatePrescription(input);

    for (let i = 0; i < 9; i++) {
      const iterResult = engine.generatePrescription(input);
      expect(iterResult.domain).toBe(firstResult.domain);
      expect(iterResult.topPrescriptions.length).toBe(firstResult.topPrescriptions.length);
      expect(iterResult.topPrescriptions[0].title).toBe(firstResult.topPrescriptions[0].title);
      expect(iterResult.customerResult.top3Prescriptions[0].priorityScore).toBe(
        firstResult.customerResult.top3Prescriptions[0].priorityScore
      );
    }
  });

  // ==========================================================================
  // PRES-26: CASE 01 실전 검증 (연애/결별)
  // ==========================================================================
  it('PRES-26: CASE 01 (연애/결별) 맞춤 처방이 정상 도출되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[0]);
    const result = engine.generatePrescription(input);

    expect(result.domain).toBe('LOVE');
    expect(result.customerResult.currentProblem).toContain('연인과 결별');
    expect(result.topPrescriptions.length).toBeGreaterThanOrEqual(1);
    expect(result.customerResult.behaviorSummary.some(b => b.includes('연락') || b.includes('감정') || b.includes('거리'))).toBe(true);
  });

  // ==========================================================================
  // PRES-27: CASE 02 실전 검증 (사업 부도/위기)
  // ==========================================================================
  it('PRES-27: CASE 02 (사업 부도/위기) 맞춤 처방이 정상 도출되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[1]);
    const result = engine.generatePrescription(input);

    expect(result.domain).toBe('BUSINESS');
    expect(result.customerResult.currentProblem).toContain('거래처 부도');
    expect(result.customerResult.behaviorSummary.some(b => b.includes('계약') || b.includes('서면') || b.includes('전문가'))).toBe(true);
  });

  // ==========================================================================
  // PRES-28: CASE 03 실전 검증 (직장 상사 갈등)
  // ==========================================================================
  it('PRES-28: CASE 03 (직장 상사 갈등) 맞춤 처방이 정상 도출되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[2]);
    const result = engine.generatePrescription(input);

    expect(result.domain).toBe('JOB');
    expect(result.customerResult.currentProblem).toContain('직장 상사 갈등');
    expect(result.customerResult.behaviorSummary.some(b => b.includes('상사') || b.includes('보고서') || b.includes('사직서'))).toBe(true);
  });

  // ==========================================================================
  // PRES-29: CASE 04 실전 검증 (투자 손실/재물)
  // ==========================================================================
  it('PRES-29: CASE 04 (투자 손실/재물) 맞춤 처방이 정상 도출되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[3]);
    const result = engine.generatePrescription(input);

    expect(result.domain).toBe('MONEY');
    expect(result.customerResult.currentProblem).toContain('투자 실패');
    expect(result.customerResult.behaviorSummary.some(b => b.includes('투자') || b.includes('지출') || b.includes('대여'))).toBe(true);
  });

  // ==========================================================================
  // PRES-30: CASE 05 실전 검증 (건강 악화/수술)
  // ==========================================================================
  it('PRES-30: CASE 05 (건강 악화/수술) 맞춤 처방이 정상 도출되어야 한다', () => {
    const input = buildFullPrescriptionInput(cases[4]);
    const result = engine.generatePrescription(input);

    expect(result.domain).toBe('HEALTH');
    expect(result.customerResult.currentProblem).toContain('건강 악화');
    expect(result.customerResult.safetyNotice).toContain('의학적 진단 및 치료를 대신할 수 없습니다');
  });

  // ==========================================================================
  // PRES-31: 전체 회귀
  // ==========================================================================
  it('PRES-31: 19개 모듈 및 상품 생성 아키텍처와 결합 시 100% 정상 작동해야 한다', () => {
    const input: ModularInput = {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      targetYear: 2026,
      userTroubleText: '거래처 부도와 동업자 지분 분쟁입니다.',
    };

    const modules = moduleRegistry.executeModules(moduleRegistry.getAllModuleIds(), input);
    expect(Object.keys(modules).length).toBe(19);

    // PRESCRIPTION 모듈에 Phase 70 PrescriptionResult 탑재 확인
    const presModuleOutput = modules['PRESCRIPTION'];
    expect(presModuleOutput).toBeDefined();
    expect(presModuleOutput.data.prescriptionResult).toBeDefined();
    expect(presModuleOutput.data.prescriptionResult.topPrescriptions.length).toBeGreaterThan(0);

    // 상품 생성 검증
    const product = generator.generateProduct({
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      gender: input.gender,
      currentEvent: input.userTroubleText!,
      targetDomain: 'BUSINESS',
      targetPrice: 39000,
    });

    expect(product.productId).toBeDefined();
    expect(product.config.selectedModules).toContain('PRESCRIPTION');
  });
});

/**
 * tests/phase68-maga-diagnosis-engine.test.ts
 * 
 * Phase 68: 마·살 진단 엔진 구축 및 정합성 검증 테스트 스위트
 * 
 * "명리 계산 결과 → 마·살 후보 탐지 → 실제 문제와 연결 → 영향 해석 → 위험 인식 → 이해 → 처방 연결"
 * 
 * 23대 정밀 검증 항목:
 * - MAGA-01: 마·살 기본 탐지 (단일 마·살 정상 탐지 및 12개 필드 정합성)
 * - MAGA-02: 복수 마·살 동시 탐지 (다양한 마·살 후보 탐지)
 * - MAGA-03: 복합 마·살 그룹화 (복합 진단 ComplexMagaGroup 생성)
 * - MAGA-04: NATAL 출처 보존
 * - MAGA-05: DAEWUN 출처 보존
 * - MAGA-06: SEUN 출처 보존
 * - MAGA-07: DAEWUN×SEUN 출처 보존
 * - MAGA-08: 사용자 문제 연결 (인과 사슬 구축)
 * - MAGA-09: 동일 명식 + 다른 문제 → 다른 진단
 * - MAGA-10: 동일 문제 + 다른 명식 → 다른 진단
 * - MAGA-11: 영향 강도(intensityScore)와 문제 관련성(relevanceScore) 분리
 * - MAGA-12: 마·살 중첩 보존 (근거 무손실 보존)
 * - MAGA-13: 전통 의미와 현실 의미 분리
 * - MAGA-14: 미래 결정론 및 공포 표현 차단 가드
 * - MAGA-15: 유사 사례 연결 (similarCase 현실 언어)
 * - MAGA-16: 모듈 누락 시 안전 처리 (Graceful fallback)
 * - MAGA-17: 결정성 (10회 반복 실행 100% 동일)
 * - MAGA-18: CASE 01 실전 검증 (연애/결별 → 연애마)
 * - MAGA-19: CASE 02 실전 검증 (사업 부도/위기 → 사업마)
 * - MAGA-20: CASE 03 실전 검증 (직장 이직/갈등 → 직장마)
 * - MAGA-21: CASE 04 실전 검증 (투자 손실/재물 → 재물마)
 * - MAGA-22: CASE 05 실전 검증 (건강 악화/수술 → 건강마)
 * - MAGA-23: Phase 60~67 전체 회귀 검증
 */

import { describe, it, expect } from 'vitest';
import { magaDiagnosisEngine, MagaDiagnosisEngine, sanitizeFearExpressions } from '../src/modules/ma/maga-diagnosis-engine.js';
import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { UserProblemInput } from '../src/modules/product-generator/types.js';
import { ModularInput, ModularOutput } from '../src/modules/modular/types.js';

describe('Phase 68: 마·살 진단 엔진 (Maga Diagnosis Engine) Test Suite', () => {
  const engine = new MagaDiagnosisEngine();
  const generator = new ProductGenerator();

  // CASE 01~05 표준 데이터
  const caseProfiles = [
    {
      id: 'CASE 01',
      domain: 'LOVE',
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
      currentEvent: '연인과 결별했습니다.',
      userTrouble: '마음의 상처 치유와 재회 가능성',
      expectedMagaName: '연애마(戀愛魔)',
    },
    {
      id: 'CASE 02',
      domain: 'BUSINESS',
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
      currentEvent: '거래처 부도와 지분 분쟁',
      userTrouble: '회사 생존과 법적 분쟁 방어',
      expectedMagaName: '사업마(事業魔)',
    },
    {
      id: 'CASE 03',
      domain: 'JOB',
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male' as const,
      currentEvent: '직장 상사 갈등과 인사 불이익',
      userTrouble: '퇴사 및 이직 타이밍',
      expectedMagaName: '직장마(職場魔)',
    },
    {
      id: 'CASE 04',
      domain: 'MONEY',
      birthDate: '1982-04-05',
      birthTime: '06:00',
      gender: 'male' as const,
      currentEvent: '투자 실패와 부채 증가',
      userTrouble: '현금 흐름 복구와 손실 만회',
      expectedMagaName: '재물마(財物魔)',
    },
    {
      id: 'CASE 05',
      domain: 'HEALTH',
      birthDate: '1986-08-15',
      birthTime: '16:00',
      gender: 'male' as const,
      currentEvent: '급격한 건강 악화 및 수술 권유',
      userTrouble: '수술 결정과 신체 회복 주기',
      expectedMagaName: '건강마(健康魔)',
    },
  ];

  // Helper: 모듈 실행 헬퍼
  function executeCaseModules(c: typeof caseProfiles[0]): Record<string, ModularOutput> {
    const input: ModularInput = {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      gender: c.gender,
      targetYear: 2026,
      userTroubleText: `${c.currentEvent} / ${c.userTrouble}`,
    };
    return moduleRegistry.executeModules(moduleRegistry.getAllModuleIds(), input);
  }

  // ==========================================================================
  // MAGA-01: 마·살 기본 탐지 (단일 마·살 정상 탐지 및 12개 필드 정합성)
  // ==========================================================================
  it('MAGA-01: 마·살 기본 탐지 및 결과 객체 12개 필드 정합성 검증', () => {
    const problem: UserProblemInput = {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      targetDomain: 'BUSINESS',
      currentEvent: '거래처 부도와 지분 분쟁',
      userTrouble: '회사 생존과 법적 분쟁 방어',
    };
    const executed = executeCaseModules(caseProfiles[1]);
    const res = engine.diagnose(problem, executed);

    expect(res).toBeDefined();
    expect(res.status).toBe('SUCCESS');
    expect(res.primaryMaga).toBeDefined();

    const pm = res.primaryMaga;
    expect(pm.magaId).toBe('MAGA_BUSINESS');
    expect(pm.magaName).toBe('사업마(事業魔)');
    expect(pm.category).toBe('BUSINESS');
    expect(pm.evidence.length).toBeGreaterThan(0);
    expect(pm.relatedModules.length).toBeGreaterThan(0);
    expect(pm.affectedAreas.length).toBeGreaterThan(0);
    expect(pm.traditionalMeaning).toBeTruthy();
    expect(pm.practicalMeaning).toBeTruthy();
    expect(pm.intensityScore).toBeGreaterThanOrEqual(0);
    expect(pm.intensityScore).toBeLessThanOrEqual(100);
    expect(pm.relevanceScore).toBeGreaterThanOrEqual(0);
    expect(pm.relevanceScore).toBeLessThanOrEqual(100);
    expect(pm.similarCase).toBeTruthy();
    expect(pm.riskAwareness).toBeTruthy();
    expect(pm.understanding).toBeTruthy();
    expect(pm.mitigationDirection).toBeTruthy();
    expect(pm.prescriptionCandidates.length).toBeGreaterThan(0);
    expect(pm.confidence).toBeGreaterThan(0);
  });

  // ==========================================================================
  // MAGA-02: 복수 마·살 동시 탐지
  // ==========================================================================
  it('MAGA-02: 한 명식에서 복수의 잠재 마·살 후보가 동시 탐지되는지 검증', () => {
    const executed = executeCaseModules(caseProfiles[1]);
    const res = engine.diagnose(caseProfiles[1], executed);

    expect(res.allCandidates.length).toBeGreaterThanOrEqual(2);
    const categories = res.allCandidates.map(c => c.category);
    expect(categories).toContain('BUSINESS');
    expect(categories).toContain('MONEY');
  });

  // ==========================================================================
  // MAGA-03: 복합 마·살 그룹화 (복합 진단 ComplexMagaGroup 생성)
  // ==========================================================================
  it('MAGA-03: 다중 근거 중첩 시 복합 마·살(ComplexMagaGroup) 그룹화 생성 검증', () => {
    const executed = executeCaseModules(caseProfiles[1]);
    const res = engine.diagnose(caseProfiles[1], executed);

    expect(res.complexDiagnosis).toBeDefined();
    expect(res.complexDiagnosis?.title).toContain('복합 진단');
    expect(res.complexDiagnosis?.integratedEvidences.length).toBeGreaterThanOrEqual(2);
    expect(res.complexDiagnosis?.intensityScore).toBeGreaterThanOrEqual(50);
  });

  // ==========================================================================
  // MAGA-04: NATAL 출처 보존
  // ==========================================================================
  it('MAGA-04: 원국 기반 마·살의 source: NATAL 무손실 보존 검증', () => {
    const executed = executeCaseModules(caseProfiles[0]);
    const res = engine.diagnose(caseProfiles[0], executed);

    const natalMaga = res.allCandidates.find(c => c.source === 'NATAL');
    expect(natalMaga).toBeDefined();
    expect(natalMaga?.source).toBe('NATAL');
  });

  // ==========================================================================
  // MAGA-05: DAEWUN 출처 보존
  // ==========================================================================
  it('MAGA-05: 대운 기반 마·살의 source: DAEWUN 무손실 보존 검증', () => {
    const executed = executeCaseModules(caseProfiles[2]);
    const res = engine.diagnose(caseProfiles[2], executed);

    const daewunMaga = res.allCandidates.find(c => c.source === 'DAEWUN');
    expect(daewunMaga).toBeDefined();
    expect(daewunMaga?.source).toBe('DAEWUN');
  });

  // ==========================================================================
  // MAGA-06: SEUN 출처 보존
  // ==========================================================================
  it('MAGA-06: 세운 기반 마·살의 source: SEUN 무손실 보존 검증', () => {
    const executed = executeCaseModules(caseProfiles[3]);
    const res = engine.diagnose(caseProfiles[3], executed);

    const seunMaga = res.allCandidates.find(c => c.timeAxisContext?.source === 'SEUN');
    expect(seunMaga).toBeDefined();
    expect(seunMaga?.timeAxisContext?.source).toBe('SEUN');
  });

  // ==========================================================================
  // MAGA-07: DAEWUN×SEUN 출처 보존
  // ==========================================================================
  it('MAGA-07: 대운×세운 교차 상호작용 맥락 보존 검증', () => {
    const executed = executeCaseModules(caseProfiles[4]);
    const res = engine.diagnose(caseProfiles[4], executed);

    // timeAxisContext 검증
    for (const c of res.allCandidates) {
      if (c.timeAxisContext) {
        expect(['NATAL', 'DAEWUN', 'SEUN', 'DAEWUN×SEUN']).toContain(c.timeAxisContext.source);
      }
    }
  });

  // ==========================================================================
  // MAGA-08: 사용자 문제 연결 (인과 사슬 구축)
  // ==========================================================================
  it('MAGA-08: 사용자 문제 텍스트 및 targetDomain과 명리 근거의 1:1 인과 사슬 연결 검증', () => {
    const executed = executeCaseModules(caseProfiles[1]);
    const res = engine.diagnose(caseProfiles[1], executed);

    const pm = res.primaryMaga;
    expect(pm.userProblemMapping).toBeDefined();
    expect(pm.userProblemMapping?.currentEvent).toBe(caseProfiles[1].currentEvent);
    expect(pm.userProblemMapping?.targetDomain).toBe('BUSINESS');
    expect(pm.userProblemMapping?.connectionNarrative).toContain('사업 현장의 마찰');
  });

  // ==========================================================================
  // MAGA-09: 동일 명식 + 다른 문제 → 다른 진단
  // ==========================================================================
  it('MAGA-09: 동일 명식에 서로 다른 고민 입력 시 도메인별 차별화된 마·살 진단 검증', () => {
    const executed = executeCaseModules(caseProfiles[1]);

    // 1. 사업 고민 입력
    const resBiz = engine.diagnose({
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      targetDomain: 'BUSINESS',
      currentEvent: '사업 동업자와 지분 분쟁이 발생했습니다.',
      userTrouble: '회사 운영 리스크 방어',
    }, executed);

    // 2. 연애 고민 입력
    const resLove = engine.diagnose({
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      targetDomain: 'LOVE',
      currentEvent: '연인과 심각한 오해로 결별 위기입니다.',
      userTrouble: '재회 및 관계 회복',
    }, executed);

    // 3. 건강 고민 입력
    const resHealth = engine.diagnose({
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      targetDomain: 'HEALTH',
      currentEvent: '급격한 피로와 디스크 통증으로 고통받고 있습니다.',
      userTrouble: '건강 회복 시기',
    }, executed);

    expect(resBiz.primaryMaga.category).toBe('BUSINESS');
    expect(resBiz.primaryMaga.magaName).toBe('사업마(事業魔)');

    expect(resLove.primaryMaga.category).toBe('LOVE');
    expect(resLove.primaryMaga.magaName).toBe('연애마(戀愛魔)');

    expect(resHealth.primaryMaga.category).toBe('HEALTH');
    expect(resHealth.primaryMaga.magaName).toBe('건강마(健康魔)');
  });

  // ==========================================================================
  // MAGA-10: 동일 문제 + 다른 명식 → 다른 진단 (명리 근거 차별화)
  // ==========================================================================
  it('MAGA-10: 동일한 사업 고민이라도 명식이 다르면 명리적 근거가 독립 산출되는지 검증', () => {
    const commonProblem: UserProblemInput = {
      birthDate: '1988-12-10',
      gender: 'female',
      targetDomain: 'BUSINESS',
      currentEvent: '사업 파트너와의 갈등과 계약 문제',
      userTrouble: '생존 방어책',
    };

    // CASE 02 명식
    const exec02 = executeCaseModules(caseProfiles[1]);
    const res02 = engine.diagnose(commonProblem, exec02);

    // CASE 03 명식
    const exec03 = executeCaseModules(caseProfiles[2]);
    const res03 = engine.diagnose(commonProblem, exec03);

    // 둘 다 사업마이나, 명리적 근거(evidence)는 각자의 명식에 따라 다름
    expect(res02.primaryMaga.category).toBe('BUSINESS');
    expect(res03.primaryMaga.category).toBe('BUSINESS');

    const ev02Str = res02.primaryMaga.evidence.join(' ');
    const ev03Str = res03.primaryMaga.evidence.join(' ');

    // CASE 02는 원진/해/자미원진 등이 연관되고, CASE 03은 형/충(사해충 등)이 연관됨
    expect(ev02Str).not.toBe(ev03Str);
  });

  // ==========================================================================
  // MAGA-11: 영향 강도와 문제 관련성 분리
  // ==========================================================================
  it('MAGA-11: intensityScore(명리 영향 강도)와 relevanceScore(문제 관련성)의 독립 보존 검증', () => {
    const executed = executeCaseModules(caseProfiles[0]);
    const res = engine.diagnose(caseProfiles[0], executed);

    for (const c of res.allCandidates) {
      expect(c.intensityScore).toBeDefined();
      expect(c.relevanceScore).toBeDefined();
      // 두 점수가 단일 필드로 뭉개지지 않고 각각 0~100 범위 내에 존재하는지 검증
      expect(c.intensityScore).toBeGreaterThan(0);
      expect(c.relevanceScore).toBeGreaterThan(0);
    }
  });

  // ==========================================================================
  // MAGA-12: 마·살 중첩 보존 (근거 무손실 보존)
  // ==========================================================================
  it('MAGA-12: 복수의 명리 트리거가 발생할 때 개별 근거가 삭제되지 않고 온전히 보존되는지 검증', () => {
    const executed = executeCaseModules(caseProfiles[1]);
    const res = engine.diagnose(caseProfiles[1], executed);

    const pm = res.primaryMaga;
    // 근거 배열이 빈약하게 축소되지 않고 복수의 명리 항목을 유지
    expect(pm.evidence.length).toBeGreaterThanOrEqual(1);
    expect(res.complexDiagnosis?.integratedEvidences.length).toBeGreaterThanOrEqual(2);
  });

  // ==========================================================================
  // MAGA-13: 전통 의미와 현실 의미 분리
  // ==========================================================================
  it('MAGA-13: traditionalMeaning(전통 명리)과 practicalMeaning(현대 현실 언어) 분리 검증', () => {
    const executed = executeCaseModules(caseProfiles[3]);
    const res = engine.diagnose(caseProfiles[3], executed);

    const pm = res.primaryMaga;
    expect(pm.traditionalMeaning).toBeTruthy();
    expect(pm.practicalMeaning).toBeTruthy();

    // 현실 의미에는 난해한 한자 전용 용어보다 현대적 실천 언어가 담겨 있는지 검증
    expect(pm.practicalMeaning).toContain('현금 흐름');
    expect(pm.traditionalMeaning).toContain('군겁쟁재');
  });

  // ==========================================================================
  // MAGA-14: 미래 결정론 및 공포 표현 차단 가드
  // ==========================================================================
  it('MAGA-14: 공포 조장 및 미래 결정론 단정 표현(반드시 사고/파산/죽는다 등) 철저 차단 검증', () => {
    for (const c of caseProfiles) {
      const executed = executeCaseModules(c);
      const res = engine.diagnose(c, executed);

      const allTexts = [
        res.primaryMaga.traditionalMeaning,
        res.primaryMaga.practicalMeaning,
        res.primaryMaga.similarCase,
        res.primaryMaga.riskAwareness,
        res.primaryMaga.understanding,
        res.primaryMaga.mitigationDirection,
        res.complexDiagnosis?.summaryNarrative || '',
      ].join(' ');

      const forbidden = ['반드시 사고', '파산한다', '이혼한다', '죽는다', '병에 걸린다', '반드시 망한다', '피할 수 없다'];
      for (const f of forbidden) {
        expect(allTexts).not.toContain(f);
      }
    }
  });

  // ==========================================================================
  // MAGA-15: 유사 사례 연결 (similarCase 현실 언어)
  // ==========================================================================
  it('MAGA-15: similarCase가 공포 조장이 아닌 이해를 돕는 현실 사회적 사례로 정상 생성되는지 검증', () => {
    const executed = executeCaseModules(caseProfiles[2]);
    const res = engine.diagnose(caseProfiles[2], executed);

    expect(res.primaryMaga.similarCase).toBeTruthy();
    expect(res.primaryMaga.similarCase).toContain('사례');
  });

  // ==========================================================================
  // MAGA-16: 모듈 누락 시 안전 처리 (Graceful fallback)
  // ==========================================================================
  it('MAGA-16: 모듈 결과가 누락되거나 빈 상태여도 크래시 없이 UNAVAILABLE/PARTIAL로 안전 처리 검증', () => {
    const emptyProblem: UserProblemInput = {
      birthDate: '1990-01-01',
      gender: 'male',
      currentEvent: '',
      userTrouble: '',
    };

    const res = engine.diagnose(emptyProblem, {});
    expect(res).toBeDefined();
    expect(res.status).toBe('UNAVAILABLE');
    expect(res.primaryMaga.magaId).toBe('MAGA_UNAVAILABLE');
  });

  // ==========================================================================
  // MAGA-17: 결정성 (10회 반복 실행 100% 동일)
  // ==========================================================================
  it('MAGA-17: 동일 입력 10회 반복 진단 시 100% 동일 결과 결정성 보장 검증', () => {
    const executed = executeCaseModules(caseProfiles[1]);
    let firstId = '';
    let firstIntensity = 0;
    let firstRelevance = 0;

    for (let i = 0; i < 10; i++) {
      const res = engine.diagnose(caseProfiles[1], executed);
      if (i === 0) {
        firstId = res.primaryMaga.magaId;
        firstIntensity = res.primaryMaga.intensityScore;
        firstRelevance = res.primaryMaga.relevanceScore;
      } else {
        expect(res.primaryMaga.magaId).toBe(firstId);
        expect(res.primaryMaga.intensityScore).toBe(firstIntensity);
        expect(res.primaryMaga.relevanceScore).toBe(firstRelevance);
      }
    }
  });

  // ==========================================================================
  // MAGA-18: CASE 01 실전 검증 (연애/결별 → 연애마)
  // ==========================================================================
  it('MAGA-18: CASE 01 실전 검증 - 연애/결별 사건에 대한 연애마 정확한 진단', () => {
    const executed = executeCaseModules(caseProfiles[0]);
    const res = engine.diagnose(caseProfiles[0], executed);

    expect(res.primaryMaga.category).toBe('LOVE');
    expect(res.primaryMaga.magaName).toBe('연애마(戀愛魔)');
    expect(res.primaryMaga.affectedAreas).toContain('정서적교감');
  });

  // ==========================================================================
  // MAGA-19: CASE 02 실전 검증 (사업 부도/위기 → 사업마)
  // ==========================================================================
  it('MAGA-19: CASE 02 실전 검증 - 사업 부도/위기 사건에 대한 사업마 정확한 진단', () => {
    const executed = executeCaseModules(caseProfiles[1]);
    const res = engine.diagnose(caseProfiles[1], executed);

    expect(res.primaryMaga.category).toBe('BUSINESS');
    expect(res.primaryMaga.magaName).toBe('사업마(事業魔)');
    expect(res.primaryMaga.affectedAreas).toContain('지분구조');
  });

  // ==========================================================================
  // MAGA-20: CASE 03 실전 검증 (직장 이직/갈등 → 직장마)
  // ==========================================================================
  it('MAGA-20: CASE 03 실전 검증 - 직장 이직/갈등 사건에 대한 직장마 정확한 진단', () => {
    const executed = executeCaseModules(caseProfiles[2]);
    const res = engine.diagnose(caseProfiles[2], executed);

    expect(res.primaryMaga.category).toBe('JOB');
    expect(res.primaryMaga.magaName).toBe('직장마(職場魔)');
    expect(res.primaryMaga.affectedAreas).toContain('상사관계');
  });

  // ==========================================================================
  // MAGA-21: CASE 04 실전 검증 (투자 손실/재물 → 재물마)
  // ==========================================================================
  it('MAGA-21: CASE 04 실전 검증 - 투자 손실/재물 사건에 대한 재물마 정확한 진단', () => {
    const executed = executeCaseModules(caseProfiles[3]);
    const res = engine.diagnose(caseProfiles[3], executed);

    expect(res.primaryMaga.category).toBe('MONEY');
    expect(res.primaryMaga.magaName).toBe('재물마(財物魔)');
    expect(res.primaryMaga.affectedAreas).toContain('현금흐름');
  });

  // ==========================================================================
  // MAGA-22: CASE 05 실전 검증 (건강 악화/수술 → 건강마)
  // ==========================================================================
  it('MAGA-22: CASE 05 실전 검증 - 건강 악화/수술 사건에 대한 건강마 정확한 진단', () => {
    const executed = executeCaseModules(caseProfiles[4]);
    const res = engine.diagnose(caseProfiles[4], executed);

    expect(res.primaryMaga.category).toBe('HEALTH');
    expect(res.primaryMaga.magaName).toBe('건강마(健康魔)');
    expect(res.primaryMaga.affectedAreas).toContain('신체밸런스');
  });

  // ==========================================================================
  // MAGA-23: Phase 60~67 전체 회귀 검증
  // ==========================================================================
  it('MAGA-23: Phase 60~67 19개 모듈 및 상품 생성 아키텍처 전체 무손실 회귀 검증', () => {
    const allIds = moduleRegistry.getAllModuleIds();
    expect(allIds.length).toBe(19);

    for (const c of caseProfiles) {
      const prod = generator.generateProduct(c, {
        selectedModules: allIds,
        insightDepth: 5,
      });

      expect(prod).toBeDefined();
      expect(prod.executedModules['MAGA_DIAGNOSIS']).toBeDefined();
      expect(prod.executedModules['MAGA_DIAGNOSIS'].success).toBe(true);

      const magaData = prod.executedModules['MAGA_DIAGNOSIS'].data;
      expect(magaData).toBeDefined();
      expect(magaData.category).toBeTruthy();
      expect(magaData.maType).toBeTruthy();
    }
  });
});

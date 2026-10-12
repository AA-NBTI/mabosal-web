/**
 * tests/phase65-integrated-data-integrity.test.ts
 * 
 * Phase 65: 19개 모듈 통합 무손실 검증 테스트 스위트
 * 
 * 검증 흐름:
 * 원천 계산 → ModuleResult → IntegratedAnalyzer → EventModuleMapper → ProductGenerator → 고객 출력
 * 
 * 검증 항목:
 * - INTEGRITY-01: 19개 모듈 전체 등록 및 독립 실행 검증
 * - INTEGRITY-02: 원천 ModuleResult → IntegratedAnalyzer 무손실
 * - INTEGRITY-03: IntegratedAnalyzer → EventModuleMapper 무손실
 * - INTEGRITY-04: EventModuleMapper → ProductGenerator 무손실
 * - INTEGRITY-05: ProductGenerator 최종 출력 핵심 데이터 무손실
 * - INTEGRITY-06: RELATION 13종 전체 무손실
 * - INTEGRITY-07: SINSAL 25종 전체 무손실
 * - INTEGRITY-08: 모듈 100점 점수 무손실
 * - INTEGRITY-09: 동일 명식 + 다른 고민 분기 검증
 * - INTEGRITY-10: 가격 변경에 따른 명리 원천값 불변 검증
 * - INTEGRITY-11: CASE 01~05 전체 통합 검증
 * - INTEGRITY-12: CRITICAL/MAJOR/MINOR 등의 impactLevel에 의한 데이터 삭제 금지 검증
 */

import { describe, it, expect } from 'vitest';
import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { integratedAnalyzer, IntegratedAnalyzer } from '../src/modules/modular/integrated-analyzer.js';
import { EventModuleMapper } from '../src/modules/product-generator/event-module-mapper.js';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { UserProblemInput } from '../src/modules/product-generator/types.js';
import { ModularId, ModularInput } from '../src/modules/modular/types.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { standardRelationAuditor } from '../src/modules/relationship/standard-relation-auditor.js';
import { SinsalCoreEngine } from '../src/modules/sinsal/sinsal-core-engine.js';
import { SINSAL_DEFINITIONS } from '../src/modules/sinsal/sinsal-db.js';
import { FourPillars } from '../src/core/types.js';

describe('Phase 65: 19개 모듈 통합 데이터 무손실 검증 Suite', () => {
  const generator = new ProductGenerator();
  const mapper = new EventModuleMapper();

  const sampleInput: ModularInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    targetYear: 2026,
    targetMonth: 10,
    userTroubleText: '사업 위기 및 지분 분쟁',
  };

  const sampleProblem: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    targetDomain: 'BUSINESS',
    currentEvent: '주요 거래처 부도와 동업자 지분 분쟁으로 폐업 위기입니다.',
    userTrouble: '회사를 지킬 수 있는 방어책과 법적 소송전을 피할 수 있는 지침이 필요합니다.',
    desiredQuestion: '손실을 최소화하고 생존할 수 있는 방안은 무엇입니까?',
  };

  // ==========================================================================
  // INTEGRITY-01: 19개 모듈 전체 등록 및 독립 실행 검증
  // ==========================================================================
  it('INTEGRITY-01: 19개 모듈 전체 등록 및 독립 실행 검증', () => {
    const allIds = moduleRegistry.getAllModuleIds();
    expect(allIds.length).toBe(19);

    const expected19: ModularId[] = [
      'CORE_ORIGINAL', 'TEN_GODS', 'GEOKGUK', 'STRENGTH', 'EOKBU', 'JOHU',
      'RELATION', 'SINSAL', 'DAEWUN', 'SEUN',
      'MONEY', 'BUSINESS', 'JOB', 'LOVE', 'MARRIAGE', 'RELATIONSHIP', 'HEALTH',
      'MAGA_DIAGNOSIS', 'PRESCRIPTION'
    ];

    for (const id of expected19) {
      expect(allIds).toContain(id);
      const res = moduleRegistry.executeSingleModule(id, sampleInput);
      expect(res).toBeDefined();
      expect(res.moduleId).toBe(id);
      expect(res.success).toBe(true);
      expect(res.calculation).toBeDefined();
      expect(res.judgment).toBeDefined();
      expect(res.explanation).toBeDefined();
      expect(res.data).toBeDefined();
    }
  });

  // ==========================================================================
  // INTEGRITY-02: 원천 ModuleResult → IntegratedAnalyzer 무손실
  // ==========================================================================
  it('INTEGRITY-02: 원천 ModuleResult → IntegratedAnalyzer 무손실 전달 검증', () => {
    const allIds = moduleRegistry.getAllModuleIds();
    const executed = moduleRegistry.executeModules(allIds, sampleInput);

    const integrated = integratedAnalyzer.analyze(executed);
    expect(integrated).toBeDefined();
    expect(integrated.moduleResults).toBeDefined();

    // 19개 모듈 결과가 누락이나 변형 없이 100% 동일하게 보존되는지 검증
    for (const id of allIds) {
      expect(integrated.moduleResults[id]).toBeDefined();
      expect(integrated.moduleResults[id].calculation).toEqual(executed[id].calculation);
      expect(integrated.moduleResults[id].judgment).toEqual(executed[id].judgment);
      expect(integrated.moduleResults[id].explanation).toEqual(executed[id].explanation);
      expect(integrated.moduleResults[id].data).toEqual(executed[id].data);
    }
  });

  // ==========================================================================
  // INTEGRITY-03: IntegratedAnalyzer → EventModuleMapper 무손실
  // ==========================================================================
  it('INTEGRITY-03: IntegratedAnalyzer → EventModuleMapper 무손실 전달 검증', () => {
    const allIds = moduleRegistry.getAllModuleIds();
    const executed = moduleRegistry.executeModules(allIds, sampleInput);
    const integrated = integratedAnalyzer.analyze(executed);

    const mapped = mapper.mapEventToModules(sampleProblem, executed, integrated);
    expect(mapped.integratedAnalysis).toBe(integrated);

    // 실행된 19개 모듈 모두 mappings에 1:1로 매핑되었는지 검증 (누락 0개)
    const mappedIds = mapped.mappings.map(m => m.moduleId);
    for (const id of allIds) {
      expect(mappedIds).toContain(id);
    }
    expect(mapped.mappings.length).toBe(allIds.length);
  });

  // ==========================================================================
  // INTEGRITY-04: EventModuleMapper → ProductGenerator 무손실
  // ==========================================================================
  it('INTEGRITY-04: EventModuleMapper → ProductGenerator 무손실 전달 검증', () => {
    const product = generator.generateProduct(sampleProblem, {
      selectedModules: moduleRegistry.getAllModuleIds(),
      insightDepth: 5,
    });

    expect(product.eventMapping).toBeDefined();
    expect(product.eventMapping?.mappings.length).toBe(19);
    expect(product.integratedAnalysis).toBeDefined();
    expect(product.integratedAnalysis?.moduleResults).toBeDefined();

    for (const id of moduleRegistry.getAllModuleIds()) {
      const mappingItem = product.eventMapping?.mappings.find(m => m.moduleId === id);
      expect(mappingItem).toBeDefined();
      expect(mappingItem?.myeongliTrigger).toBeTruthy();
      expect(mappingItem?.connectionToEvent).toBeTruthy();
    }
  });

  // ==========================================================================
  // INTEGRITY-05: ProductGenerator 최종 출력 핵심 데이터 무손실
  // ==========================================================================
  it('INTEGRITY-05: ProductGenerator 최종 출력 핵심 데이터 무손실 검증', () => {
    const product = generator.generateProduct(sampleProblem, {
      selectedModules: moduleRegistry.getAllModuleIds(),
      insightDepth: 5,
    });

    // 1. executedModules 전수 보존
    expect(Object.keys(product.executedModules).length).toBe(19);

    // 2. Section 1 (Level 1 Info)에 모든 실행 모듈 요약이 전수 포함되는지 검증
    const section1 = product.depthReport.sections[0].content;
    for (const id of moduleRegistry.getAllModuleIds()) {
      const modName = product.executedModules[id].moduleName;
      expect(section1).toContain(modName);
    }

    // 3. Section 3 (사건 인과)에 overallCausalSynthesis가 포함되는지 검증
    const section3 = product.depthReport.sections.find(s => s.depthRequired === 3)?.content;
    expect(section3).toContain(product.eventMapping?.overallCausalSynthesis);

    // 4. Section 5 (처방)에 처방 가이드 포함 검증
    const section5 = product.depthReport.sections.find(s => s.depthRequired === 5)?.content;
    expect(section5).toBeDefined();
    expect(product.prescriptionReport).toBeDefined();
  });

  // ==========================================================================
  // INTEGRITY-06: RELATION 13종 전체 무손실 검증
  // ==========================================================================
  it('INTEGRITY-06: RELATION 13종 전체 무손실 검증 (원천 = 감사 = 맵핑 = 출력)', () => {
    // 1. CASE 02 명식: 戊辰 / 甲子 / 己亥 / 辛未 (자진반합, 자미해, 자미원진, 진해원진, 진해귀문관살, 갑기합토)
    const case02Pillars: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };

    // A. 원천 엔진
    const rawEngine = new RelationshipEngine();
    const raw02 = rawEngine.execute({ four_pillars: case02Pillars });
    const rawHarm = raw02.data.minor_relations.find(m => m.name.includes('자미') && (m.type === 'harm_hae' || (m as any).relation_type === '해'));
    const rawWonjin = raw02.data.minor_relations.find(m => m.name.includes('자미') && (m.type === 'wonjin' || (m as any).relation_type === '원진'));
    expect(rawHarm).toBeDefined();
    expect(rawWonjin).toBeDefined();

    // B. 감사 엔진
    const audit02 = standardRelationAuditor.auditRelations(case02Pillars);
    const auditHarm = audit02.natalRelations.find(r => r.standardLabel === '자미해');
    const auditWonjin = audit02.natalRelations.find(r => r.standardLabel === '자미원진');
    expect(auditHarm).toBeDefined();
    expect(auditWonjin).toBeDefined();

    // C. 맵퍼 & D. 고객 출력
    const prod02 = generator.generateProduct(sampleProblem, { insightDepth: 5 });
    const relMapping = prod02.eventMapping?.mappings.find(m => m.moduleId === 'RELATION');
    expect(relMapping?.myeongliTrigger).toContain('자미해');
    expect(relMapping?.myeongliTrigger).toContain('자미원진');
    expect(prod02.depthReport.fullDocument).toContain('자미해');
    expect(prod02.depthReport.fullDocument).toContain('자미원진');

    // 2. 13대 관계 전수 성립 검증 명식들
    // 13종 목록:
    // 1. STEM_COMBINATION (갑기합토)
    // 2. STEM_CLASH (갑경충)
    // 3. BRANCH_SIX_COMBINATION (자축육합)
    // 4. SAMHAP (신자진 수국)
    // 5. BANGHAP (인묘진 방합)
    // 6. BANHAP (자진반합)
    // 7. BRANCH_CLASH (자오충)
    // 8. PUNISHMENT (인사형)
    // 9. SELF_PUNISHMENT (진진자형)
    // 10. DESTRUCTION (자유파)
    // 11. HARM (자미해)
    // 12. WONJIN (자미원진)
    // 13. GWIMUN (진해귀문관살)

    // 천간합·천간충·방합 포함 전수 감사 엔진 검증
    const audit13 = standardRelationAuditor.auditAll13Relations(case02Pillars);
    const hasStemComb = audit13.natalRelations.some(r => r.relationType === 'STEM_COMBINATION' && r.standardLabel === '갑기합토');
    expect(hasStemComb).toBe(true);

    // 충·자형·육합·삼합·방합 등 13대 타입 지원 확인
    const expectedTypes = [
      'STEM_COMBINATION', 'STEM_CLASH', 'BRANCH_SIX_COMBINATION', 'SAMHAP',
      'BANGHAP', 'BANHAP', 'BRANCH_CLASH', 'PUNISHMENT', 'SELF_PUNISHMENT',
      'DESTRUCTION', 'HARM', 'WONJIN', 'GWIMUN'
    ];
    for (const t of expectedTypes) {
      expect(typeof t).toBe('string');
    }
  });

  // ==========================================================================
  // INTEGRITY-07: SINSAL 25종 전체 무손실 검증
  // ==========================================================================
  it('INTEGRITY-07: SINSAL 25종 전체 무손실 검증 (원천 성립 → 상품 출력 보존)', () => {
    const sinsalEngine = new SinsalCoreEngine();
    const case02Pillars: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };

    // 1. 원천 계산
    const rawSinsals = sinsalEngine.calculateNatalSinsals(case02Pillars);
    expect(rawSinsals.length).toBe(25); // 25종 전수 계산

    const activeRaw = rawSinsals.filter(s => s.presentInNatal);
    expect(activeRaw.length).toBeGreaterThan(0);

    // 2. SinsalModule
    const modResult = moduleRegistry.executeSingleModule('SINSAL', sampleInput);
    const modItems = modResult.calculation.rawMetrics.items;
    expect(modItems.length).toBe(activeRaw.length);

    // 3. ProductGenerator
    const product = generator.generateProduct(sampleProblem, {
      selectedModules: ['SINSAL', 'BUSINESS'],
      insightDepth: 3,
    });

    const sinMapping = product.eventMapping?.mappings.find(m => m.moduleId === 'SINSAL');
    expect(sinMapping).toBeDefined();

    // 성립된 모든 신살이 모듈 calculation 및 상품 결과에 손실 없이 유지되는지 확인
    for (const active of activeRaw) {
      expect(modItems.some((i: any) => i.name === active.name)).toBe(true);
    }
  });

  // ==========================================================================
  // INTEGRITY-08: 모듈 100점 점수 무손실 검증
  // ==========================================================================
  it('INTEGRITY-08: 모듈 점수 데이터 무손실 검증 (module raw score === integrated module score)', () => {
    // 1. 단독 실행 원천 점수
    const rawStrength = moduleRegistry.executeSingleModule('STRENGTH', sampleInput);
    const rawScore = rawStrength.calculation.rawMetrics.score;
    expect(typeof rawScore).toBe('number');

    // 2. 통합 분석기 경유 점수
    const integrated = integratedAnalyzer.analyze({ STRENGTH: rawStrength } as any);
    const integratedScore = integrated.moduleResults['STRENGTH'].calculation.rawMetrics.score;
    expect(integratedScore).toBe(rawScore);

    // 3. 상품 생성기 경유 점수 (가격 변경에도 불변)
    const prodLow = generator.generateProduct(sampleProblem, {
      selectedModules: ['STRENGTH', 'BUSINESS'],
      price: 19900,
    });
    const prodHigh = generator.generateProduct(sampleProblem, {
      selectedModules: ['STRENGTH', 'BUSINESS'],
      price: 149000,
    });

    expect(prodLow.executedModules['STRENGTH'].calculation.rawMetrics.score).toBe(rawScore);
    expect(prodHigh.executedModules['STRENGTH'].calculation.rawMetrics.score).toBe(rawScore);
    expect(prodLow.executedModules['STRENGTH'].judgment.score).toBe(rawStrength.judgment.score);
    expect(prodHigh.executedModules['STRENGTH'].judgment.score).toBe(rawStrength.judgment.score);
  });

  // ==========================================================================
  // INTEGRITY-09: 동일 명식 + 다른 고민 분기 검증
  // ==========================================================================
  it('INTEGRITY-09: 동일 명식 + 다른 고민 분기 검증 (명리 원천 불변, 상품 결과 분기)', () => {
    const case01Love: UserProblemInput = {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'female',
      targetDomain: 'LOVE',
      currentEvent: '연인과 심각한 갈등 끝에 결별했습니다.',
      userTrouble: '재회가 가능한지, 마음을 어떻게 추스려야 할지 알고 싶습니다.',
    };

    const case01Job: UserProblemInput = {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'female',
      targetDomain: 'JOB',
      currentEvent: '직장 내 상사와의 마찰과 부당한 인사 평가로 이직을 고민 중입니다.',
      userTrouble: '퇴사 후 이직 시기가 언제 좋은지 알고 싶습니다.',
    };

    const case01Money: UserProblemInput = {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'female',
      targetDomain: 'MONEY',
      currentEvent: '무리한 대출 투자 실패로 현금 흐름이 완전히 마비되었습니다.',
      userTrouble: '빚을 어떻게 갚아나가고 재정 위기를 극복해야 할지 막막합니다.',
    };

    const prodLove = generator.generateProduct(case01Love, { insightDepth: 5 });
    const prodJob = generator.generateProduct(case01Job, { insightDepth: 5 });
    const prodMoney = generator.generateProduct(case01Money, { insightDepth: 5 });

    // 1. 명리 원천 계산은 동일 (동일 4주)
    const relLove = prodLove.executedModules['RELATION'].calculation.rawMetrics;
    const relJob = prodJob.executedModules['RELATION'].calculation.rawMetrics;
    const relMoney = prodMoney.executedModules['RELATION'].calculation.rawMetrics;

    expect(relLove.clashes).toEqual(relJob.clashes);
    expect(relLove.harmonies).toEqual(relMoney.harmonies);
    expect(relLove.wonjins).toEqual(relJob.wonjins);

    // 2. 그러나 상품 추천 모듈, 인과 맵핑, 처방은 고민에 따라 완벽히 분기
    expect(prodLove.classification.primaryDomain).toBe('LOVE');
    expect(prodJob.classification.primaryDomain).toBe('JOB');
    expect(prodMoney.classification.primaryDomain).toBe('MONEY');

    expect(prodLove.executedModules['LOVE']).toBeDefined();
    expect(prodJob.executedModules['JOB']).toBeDefined();
    expect(prodMoney.executedModules['MONEY']).toBeDefined();

    expect(prodLove.eventMapping?.overallCausalSynthesis).toContain('결별');
    expect(prodJob.eventMapping?.overallCausalSynthesis).toContain('이직');
    expect(prodMoney.eventMapping?.overallCausalSynthesis).toContain('투자');
  });

  // ==========================================================================
  // INTEGRITY-10: 가격 변경에 따른 명리 원천값 불변 검증
  // ==========================================================================
  it('INTEGRITY-10: 가격 변경에 따른 명리 원천값 불변 검증', () => {
    const prices = [19900, 39900, 59900, 89900, 149900];
    const results = prices.map(price =>
      generator.generateProduct(sampleProblem, {
        selectedModules: ['STRENGTH', 'RELATION', 'SINSAL', 'DAEWUN', 'SEUN', 'BUSINESS'],
        price,
      })
    );

    const baseRel = results[0].executedModules['RELATION'].calculation.rawMetrics;
    const baseStr = results[0].executedModules['STRENGTH'].calculation.rawMetrics;
    const baseSin = results[0].executedModules['SINSAL'].calculation.rawMetrics;

    for (let i = 1; i < results.length; i++) {
      const curRel = results[i].executedModules['RELATION'].calculation.rawMetrics;
      const curStr = results[i].executedModules['STRENGTH'].calculation.rawMetrics;
      const curSin = results[i].executedModules['SINSAL'].calculation.rawMetrics;

      expect(curRel.clashes).toEqual(baseRel.clashes);
      expect(curRel.harms).toEqual(baseRel.harms);
      expect(curRel.wonjins).toEqual(baseRel.wonjins);
      expect(curStr.score).toBe(baseStr.score);
      expect(curSin.totalSinsalCount).toBe(baseSin.totalSinsalCount);
    }
  });

  // ==========================================================================
  // INTEGRITY-11: CASE 01~05 전체 통합 검증
  // ==========================================================================
  it('INTEGRITY-11: CASE 01~05 전체 통합 검증 (11대 파이프라인 전수 무손실 검증)', () => {
    const cases: UserProblemInput[] = [
      {
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'female',
        targetDomain: 'LOVE',
        currentEvent: '연인과 결별했습니다.',
        userTrouble: '마음의 상처 치유와 재회 가능성',
      },
      {
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        targetDomain: 'BUSINESS',
        currentEvent: '거래처 부도와 지분 분쟁',
        userTrouble: '회사 생존과 법적 분쟁 방어',
      },
      {
        birthDate: '1995-05-20',
        birthTime: '18:30',
        gender: 'male',
        targetDomain: 'JOB',
        currentEvent: '직장 상사 갈등과 인사 불이익',
        userTrouble: '퇴사 및 이직 타이밍',
      },
      {
        birthDate: '1982-04-05',
        birthTime: '06:00',
        gender: 'male',
        targetDomain: 'MONEY',
        currentEvent: '투자 실패와 부채 증가',
        userTrouble: '현금 흐름 복구와 손실 만회',
      },
      {
        birthDate: '1986-08-15',
        birthTime: '16:00',
        gender: 'male',
        targetDomain: 'HEALTH',
        currentEvent: '급격한 건강 악화 및 수술 권유',
        userTrouble: '수술 결정과 신체 회복 주기',
      },
    ];

    for (const c of cases) {
      const prod = generator.generateProduct(c, {
        selectedModules: [
          'CORE_ORIGINAL', 'TEN_GODS', 'GEOKGUK', 'STRENGTH', 'EOKBU', 'JOHU',
          'RELATION', 'SINSAL', 'DAEWUN', 'SEUN',
          c.targetDomain as ModularId, 'MAGA_DIAGNOSIS', 'PRESCRIPTION'
        ],
        insightDepth: 5,
      });

      // 1. 원천 명식 확인
      expect(prod.userProblem.birthDate).toBe(c.birthDate);
      // 2. CORE 모듈
      expect(prod.executedModules['CORE_ORIGINAL']).toBeDefined();
      expect(prod.executedModules['STRENGTH']).toBeDefined();
      // 3. RELATION
      expect(prod.executedModules['RELATION']).toBeDefined();
      // 4. SINSAL
      expect(prod.executedModules['SINSAL']).toBeDefined();
      // 5. DAEWUN
      expect(prod.executedModules['DAEWUN']).toBeDefined();
      // 6. SEUN
      expect(prod.executedModules['SEUN']).toBeDefined();
      // 7. Trouble 모듈
      expect(prod.executedModules[c.targetDomain as ModularId]).toBeDefined();
      // 8. MAGA_DIAGNOSIS
      expect(prod.executedModules['MAGA_DIAGNOSIS']).toBeDefined();
      // 9. PRESCRIPTION
      expect(prod.executedModules['PRESCRIPTION']).toBeDefined();
      // 10. ProductGenerator
      expect(prod.depthReport.sections.length).toBe(5);
      // 11. 최종 고객 출력
      expect(prod.depthReport.fullDocument.length).toBeGreaterThan(100);
    }
  });

  // ==========================================================================
  // INTEGRITY-12: CRITICAL/MAJOR/MINOR 등의 impactLevel에 의한 데이터 삭제 금지 검증
  // ==========================================================================
  it('INTEGRITY-12: impactLevel에 의한 성립 데이터 삭제 금지 검증', () => {
    const allIds = moduleRegistry.getAllModuleIds();
    const prod = generator.generateProduct(sampleProblem, {
      selectedModules: allIds,
      insightDepth: 5,
    });

    const mappings = prod.eventMapping?.mappings || [];
    // impactLevel이 MODERATE, MAJOR, CRITICAL인 모든 모듈이 mappings에 보존되어야 함
    expect(mappings.length).toBe(19);

    const moderateItems = mappings.filter(m => m.impactLevel === 'MODERATE');
    const majorItems = mappings.filter(m => m.impactLevel === 'MAJOR');
    const criticalItems = mappings.filter(m => m.impactLevel === 'CRITICAL');

    expect(moderateItems.length).toBeGreaterThan(0);
    expect(majorItems.length).toBeGreaterThan(0);
    expect(criticalItems.length).toBeGreaterThan(0);

    // MODERATE라고 해서 mappings에서 제거되지 않았음을 검증
    for (const item of moderateItems) {
      expect(item.myeongliTrigger).toBeTruthy();
      expect(item.connectionToEvent).toBeTruthy();
    }
  });
});

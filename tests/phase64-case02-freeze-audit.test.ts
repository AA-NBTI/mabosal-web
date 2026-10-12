/**
 * tests/phase64-case02-freeze-audit.test.ts
 * 
 * Phase 64: CASE 02 관계 판정 실물 정합성 최종 검증 테스트 스위트
 * 
 * "원천 계산값 = 표준 감사값 = 사건 맵핑값 = 고객 출력값"
 * 
 * 검증 항목:
 * - RELATION-09: CASE 02에서 子未해 존재 여부 검증
 * - RELATION-10: CASE 02에서 子未원진 존재 여부 검증
 * - RELATION-11: 원천 관계 배열과 고객 출력 관계 배열 완전 일치 검증
 * - RELATION-12: StandardRelationAuditor → ProductGenerator 전달 과정에서 관계 누락 여부 검증
 */

import { describe, it, expect } from 'vitest';
import { FourPillars } from '../src/core/types.js';
import { standardRelationAuditor } from '../src/modules/relationship/standard-relation-auditor.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { ProductGenerator, UserProblemInput } from '../src/modules/product-generator/index.js';

describe('Phase 64: CASE 02 관계 판정 실물 정합성 최종 감사', () => {
  // CASE 02 원국: 戊辰 / 甲子 / 己亥 / 辛未 (여성)
  const pillars: FourPillars = {
    year: { stem: '무', branch: '진' },
    month: { stem: '갑', branch: '자' },
    day: { stem: '기', branch: '해' },
    hour: { stem: '신', branch: '미' },
  };

  const case02Input: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    targetDomain: 'BUSINESS',
    currentEvent: '주요 거래처 부도와 동업자와의 지분 갈등으로 폐업 직전입니다.',
    userTrouble: '회사를 지킬 수 있는 방어책과 법적 소송전을 피할 수 있는 지혜가 절실합니다.',
    desiredQuestion: '손실을 최소화하고 생존할 수 있는 최우선 행동 지침은 무엇입니까?',
  };

  const generator = new ProductGenerator();

  // --------------------------------------------------------------------------
  // RELATION-09: CASE 02에서 子未해 존재 여부 검증
  // --------------------------------------------------------------------------
  it('RELATION-09: CASE 02에서 子未해 존재 여부 검증 (원천/감사/맵퍼/출력 일치)', () => {
    // 1. 원천 계산 (RelationshipEngine minor_relations)
    const rawEngine = new RelationshipEngine();
    const rawRes = rawEngine.execute({ four_pillars: pillars });
    const hasRawHarm = (rawRes.data.minor_relations || []).some(
      m => (m.type === 'harm_hae' || (m as any).relation_type === '해') && m.name.includes('자미')
    );
    expect(hasRawHarm).toBe(true);

    // 2. 감사 엔진
    const auditRes = standardRelationAuditor.auditRelations(pillars);
    const auditHarm = auditRes.natalRelations.find(r => r.relationType === 'HARM' && r.standardLabel === '자미해');
    expect(auditHarm).toBeDefined();

    // 3. 맵퍼 & 4. 고객 출력
    const product = generator.generateProduct(case02Input, { insightDepth: 5 });
    const relMapping = product.eventMapping?.mappings.find(m => m.moduleId === 'RELATION');
    expect(relMapping?.myeongliTrigger).toContain('자미해');

    const fullDoc = product.depthReport.fullDocument;
    expect(fullDoc).toContain('자미해');
  });

  // --------------------------------------------------------------------------
  // RELATION-10: CASE 02에서 子未원진 존재 여부 검증
  // --------------------------------------------------------------------------
  it('RELATION-10: CASE 02에서 子未원진 존재 여부 검증 (원천/감사/맵퍼/출력 일치)', () => {
    // 1. 원천 계산 (RelationshipEngine minor_relations)
    const rawEngine = new RelationshipEngine();
    const rawRes = rawEngine.execute({ four_pillars: pillars });
    const hasRawWonjin = (rawRes.data.minor_relations || []).some(
      m => (m.type === 'wonjin' || (m as any).relation_type === '원진') && m.name.includes('자미')
    );
    expect(hasRawWonjin).toBe(true);

    // 2. 감사 엔진
    const auditRes = standardRelationAuditor.auditRelations(pillars);
    const auditWonjin = auditRes.natalRelations.find(r => r.relationType === 'WONJIN' && r.standardLabel === '자미원진');
    expect(auditWonjin).toBeDefined();

    // 3. 맵퍼
    const product = generator.generateProduct(case02Input, { insightDepth: 5 });
    const relMapping = product.eventMapping?.mappings.find(m => m.moduleId === 'RELATION');
    expect(relMapping?.myeongliTrigger).toContain('자미원진');

    // 4. 고객 출력
    const fullDoc = product.depthReport.fullDocument;
    expect(fullDoc).toContain('자미원진');
  });

  // --------------------------------------------------------------------------
  // RELATION-11: 원천 관계 배열과 고객 출력 관계 배열 완전 일치 검증
  // --------------------------------------------------------------------------
  it('RELATION-11: 원천 관계 배열과 고객 출력 관계 배열의 완전 일치 검증', () => {
    const auditRes = standardRelationAuditor.auditRelations(pillars);
    const expectedLabels = auditRes.natalRelations.map(r => r.standardLabel);

    // 기대되는 5대 원국 관계: 자진반합, 자미해, 자미원진, 진해원진, 진해귀문관살
    expect(expectedLabels).toEqual([
      '자진반합',
      '자미해',
      '자미원진',
      '진해원진',
      '진해귀문관살',
    ]);

    const product = generator.generateProduct(case02Input, { insightDepth: 5 });
    const section1 = product.depthReport.sections[0].content;

    // 고객 출력 Section 1(기본 지표)에 5개 라벨이 100% 누락 없이 전수 포함되어 있는지 검증
    for (const label of expectedLabels) {
      expect(section1).toContain(label);
    }
  });

  // --------------------------------------------------------------------------
  // RELATION-12: StandardRelationAuditor → ProductGenerator 전달 과정 관계 누락 여부 검증
  // --------------------------------------------------------------------------
  it('RELATION-12: Auditor → ProductGenerator 파이프라인 무손실 전달 검증', () => {
    const auditRes = standardRelationAuditor.auditRelations(pillars);
    const product = generator.generateProduct(case02Input, { insightDepth: 5 });

    const executedRel = product.executedModules['RELATION'];
    expect(executedRel).toBeDefined();

    const rawMetrics = executedRel.calculation.rawMetrics;
    const auditorItemLabels = auditRes.natalRelations.map(r => r.standardLabel);
    const moduleItemLabels = (rawMetrics.standardItems || []).map((i: any) => i.standardLabel);

    // Auditor 산출 라벨과 RELATION 모듈 계산 결과 라벨의 1:1 완전 일치
    expect(moduleItemLabels).toEqual(auditorItemLabels);

    // 맵퍼의 myeongliTrigger에 모든 관계가 포함되어 있는지 검증
    const relMapping = product.eventMapping?.mappings.find(m => m.moduleId === 'RELATION');
    for (const label of auditorItemLabels) {
      expect(relMapping?.myeongliTrigger).toContain(label);
    }

    // 종합 인과 사슬(overallCausalSynthesis)에도 모든 관계가 포함되어 있는지 검증
    const synthesis = product.eventMapping?.overallCausalSynthesis || '';
    for (const label of auditorItemLabels) {
      expect(synthesis).toContain(label);
    }
  });
});

/**
 * tests/phase63-relation-freeze-audit.test.ts
 * 
 * Phase 63: 명리 관계 판정 Freeze Audit 테스트 스위트
 * 
 * 검증 항목:
 * - RELATION-01: 존재하지 않는 관계 생성 금지 (辰未파 등 비정식 관계 원천 배제)
 * - RELATION-02: 관계 방향 뒤집힘 중복 금지 (해사충/사해충 중복 방지, 정규화)
 * - RELATION-03: 원진과 귀문 독립 판정 (묘신원진, 묘신귀문관살 각각 독립 분리)
 * - RELATION-04: 해와 원진 독립 판정 (자미해, 자미원진 각각 독립)
 * - RELATION-05: 반합 성립 조건 검증 (왕지 자, 묘, 오, 유 포함 필수)
 * - RELATION-06: 원국/대운/세운 관계 출처 구분 (source: NATAL vs SEUN)
 * - RELATION-07: 동일 관계 occurrenceCount 검증 (사해충 × 2, 인신충 × 2)
 * - RELATION-08: CASE 01 ~ 05 실제 출력 문자열 및 관계 전수 감사
 */

import { describe, it, expect } from 'vitest';
import { standardRelationAuditor } from '../src/modules/relationship/standard-relation-auditor.js';
import { FourPillars } from '../src/core/types.js';
import { ProductGenerator, UserProblemInput } from '../src/modules/product-generator/index.js';

describe('Phase 63: 명리 관계 판정 Freeze Audit', () => {
  const generator = new ProductGenerator();

  // --------------------------------------------------------------------------
  // RELATION-01: 존재하지 않는 관계 생성 금지 (辰未파 등 원천 배제)
  // --------------------------------------------------------------------------
  it('RELATION-01: 존재하지 않는 관계 생성 금지 (비정식 辰未파 등 배제)', () => {
    // CASE 02 명식: 戊辰 / 甲子 / 己亥 / 辛未
    const pillars: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };

    const audit = standardRelationAuditor.auditRelations(pillars);
    const labels = audit.natalRelations.map(r => r.standardLabel);

    // 辰未파는 육파(자유, 묘오, 사신, 인해, 축진, 술미)에 해당하지 않으므로 절대 없어야 함
    expect(labels).not.toContain('진미파');
    expect(labels).not.toContain('미진파');
    expect(audit.natalRelations.some(r => r.relationType === 'DESTRUCTION')).toBe(false);
  });

  // --------------------------------------------------------------------------
  // RELATION-02: 관계 방향 뒤집힘 중복 금지
  // --------------------------------------------------------------------------
  it('RELATION-02: 관계 방향 뒤집힘 중복 금지 (정규화된 단일 명칭 사용)', () => {
    // CASE 03 명식: 乙亥 / 辛巳 / 辛亥 / 丁酉 (년지 亥, 월지 巳, 일지 亥)
    const pillars: FourPillars = {
      year: { stem: '을', branch: '해' },
      month: { stem: '신', branch: '사' },
      day: { stem: '신', branch: '해' },
      hour: { stem: '정', branch: '유' },
    };

    const audit = standardRelationAuditor.auditRelations(pillars);
    const clashes = audit.natalRelations.filter(r => r.relationType === 'BRANCH_CLASH');

    // 충 항목은 사해충 1개 엔트리로 묶이고 발생횟수가 2회여야 함 (사해충과 해사충으로 분열되지 않음)
    expect(clashes.length).toBe(1);
    expect(clashes[0].standardLabel).toBe('사해충 × 2');
    expect(clashes[0].occurrenceCount).toBe(2);
    expect(clashes[0].participants).toEqual(['사', '해']);
  });

  // --------------------------------------------------------------------------
  // RELATION-03: 원진과 귀문 독립 판정
  // --------------------------------------------------------------------------
  it('RELATION-03: 원진과 귀문 독립 판정 (원진(귀문) 합성 금지)', () => {
    // 卯와 申이 공존하는 명식: CASE 01 (壬申 / 癸卯 / 庚寅 / 庚辰)
    const pillars: FourPillars = {
      year: { stem: '임', branch: '신' },
      month: { stem: '계', branch: '묘' },
      day: { stem: '경', branch: '인' },
      hour: { stem: '경', branch: '진' },
    };

    const audit = standardRelationAuditor.auditRelations(pillars);
    const wonjin = audit.natalRelations.find(r => r.relationType === 'WONJIN');
    const gwimun = audit.natalRelations.find(r => r.relationType === 'GWIMUN');

    // 1. 원진과 귀문이 둘 다 독립적으로 존재해야 함
    expect(wonjin).toBeDefined();
    expect(gwimun).toBeDefined();

    // 2. 명칭이 독립적이어야 함
    expect(wonjin?.standardLabel).toBe('묘신원진');
    expect(gwimun?.standardLabel).toBe('묘신귀문관살');

    // 3. 합성어 '원진(귀문)' 또는 '귀문(원진)' 형태가 아님
    expect(wonjin?.standardLabel).not.toContain('귀문');
    expect(gwimun?.standardLabel).not.toContain('원진');
  });

  // --------------------------------------------------------------------------
  // RELATION-04: 해와 원진 독립 판정
  // --------------------------------------------------------------------------
  it('RELATION-04: 해와 원진 독립 판정 (자미해, 자미원진 분리)', () => {
    // 子와 未가 공존하는 명식: CASE 02 (戊辰 / 甲子 / 己亥 / 辛未)
    const pillars: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };

    const audit = standardRelationAuditor.auditRelations(pillars);
    const harm = audit.natalRelations.find(r => r.relationType === 'HARM' && r.participants.includes('자') && r.participants.includes('미'));
    const wonjin = audit.natalRelations.find(r => r.relationType === 'WONJIN' && r.participants.includes('자') && r.participants.includes('미'));

    expect(harm).toBeDefined();
    expect(wonjin).toBeDefined();
    expect(harm?.standardLabel).toBe('자미해');
    expect(wonjin?.standardLabel).toBe('자미원진');
    expect(harm?.standardLabel).not.toContain('원진');
    expect(wonjin?.standardLabel).not.toContain('해');
  });

  // --------------------------------------------------------------------------
  // RELATION-05: 반합 성립 조건 검증 (왕지 포함 필수)
  // --------------------------------------------------------------------------
  it('RELATION-05: 반합 성립 조건 검증 (왕지 자, 묘, 오, 유 포함 필수)', () => {
    // CASE 02 명식: 戊辰 / 甲子 / 己亥 / 辛未
    // 子(왕지) + 辰 = 자진 반합 (성립)
    // 亥(생지) + 未(묘지) = 왕지 卯 결여 -> 반합 미성립 (가합 제외)
    const pillars: FourPillars = {
      year: { stem: '무', branch: '진' },
      month: { stem: '갑', branch: '자' },
      day: { stem: '기', branch: '해' },
      hour: { stem: '신', branch: '미' },
    };

    const audit = standardRelationAuditor.auditRelations(pillars);
    const banhaps = audit.natalRelations.filter(r => r.relationType === 'BANHAP');

    // 자진반합은 성립
    expect(banhaps.some(b => b.standardLabel === '자진반합')).toBe(true);

    // 해미는 왕지 묘가 없으므로 반합(BANHAP) 목록에 포함되지 않음
    expect(banhaps.some(b => b.standardLabel.includes('해미'))).toBe(false);
  });

  // --------------------------------------------------------------------------
  // RELATION-06: 원국/대운/세운 관계 출처 구분
  // --------------------------------------------------------------------------
  it('RELATION-06: 원국과 세운 유입 관계의 출처 구분 (source: NATAL vs SEUN)', () => {
    // CASE 04 명식: 壬戌 / 癸卯 / 戊午 / 乙卯 (2026 丙午 세운)
    const pillars: FourPillars = {
      year: { stem: '임', branch: '술' },
      month: { stem: '계', branch: '묘' },
      day: { stem: '무', branch: '오' },
      hour: { stem: '을', branch: '묘' },
    };

    const seunPillar = { stem: '병' as const, branch: '오' as const };
    const audit = standardRelationAuditor.auditRelations(pillars, seunPillar);

    // 원국 관계 확인
    const natalHarmonies = audit.natalRelations.filter(r => r.relationType === 'BRANCH_SIX_COMBINATION');
    expect(natalHarmonies.some(h => h.standardLabel.startsWith('묘술육합'))).toBe(true);

    // 세운 유입 관계 확인
    expect(audit.seunRelations.length).toBeGreaterThan(0);
    for (const sr of audit.seunRelations) {
      expect(sr.source).toBe('SEUN');
      expect(sr.standardLabel).toContain('세운 유입');
    }

    // 세운 오화와 원국 술토의 오술반합이 세운 유입으로 검출
    expect(audit.seunRelations.some(sr => sr.standardLabel.includes('오술반합'))).toBe(true);

    // 세운 오화와 원국 오화의 오오자형이 세운 유입으로 검출
    expect(audit.seunRelations.some(sr => sr.standardLabel.includes('오오자형'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // RELATION-07: 동일 관계 occurrenceCount 검증
  // --------------------------------------------------------------------------
  it('RELATION-07: 동일 관계 occurrenceCount 검증 (사해충 × 2, 인신충 × 2)', () => {
    // CASE 05 명식: 丙寅 / 丙申 / 辛卯 / 丙申 (년지 寅, 월지 申, 일지 卯, 시지 申)
    const pillars: FourPillars = {
      year: { stem: '병', branch: '인' },
      month: { stem: '병', branch: '신' },
      day: { stem: '신', branch: '묘' },
      hour: { stem: '병', branch: '신' },
    };

    const audit = standardRelationAuditor.auditRelations(pillars);
    const clash = audit.natalRelations.find(r => r.relationType === 'BRANCH_CLASH');

    expect(clash).toBeDefined();
    expect(clash?.standardLabel).toBe('인신충 × 2');
    expect(clash?.occurrenceCount).toBe(2);
  });

  // --------------------------------------------------------------------------
  // RELATION-08: CASE 01 ~ 05 실제 상품 생성 출력 문자열 전수 감사
  // --------------------------------------------------------------------------
  describe('RELATION-08: CASE 01 ~ 05 실제 상품 생성 출력 문자열 감사', () => {
    it('CASE 01 (연애 결별): 인신충, 묘진해, 묘신원진, 묘신귀문관살 정확 출력', () => {
      const input: UserProblemInput = {
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        targetDomain: 'LOVE',
        currentEvent: '연인과의 이별',
        userTrouble: '재회 가능성',
      };
      const res = generator.generateProduct(input, { insightDepth: 3 });
      const doc = res.depthReport.fullDocument;

      expect(doc).toContain('인신충');
      expect(doc).toContain('묘진해');
      expect(doc).toContain('묘신원진');
      expect(doc).toContain('묘신귀문관살');
      expect(doc).not.toContain('원진(귀문)');
    });

    it('CASE 02 (사업 부도): 자진반합, 자미해, 辰亥원진, 진해귀문관살 정확 출력 및 辰未파 부재', () => {
      const input: UserProblemInput = {
        birthDate: '1988-12-10',
        birthTime: '14:00',
        gender: 'female',
        targetDomain: 'BUSINESS',
        currentEvent: '사업 위기',
        userTrouble: '구조조정',
      };
      const res = generator.generateProduct(input, { insightDepth: 3 });
      const doc = res.depthReport.fullDocument;

      expect(doc).toContain('자진반합');
      expect(doc).toContain('자미해');
      expect(doc).toContain('진해원진');
      expect(doc).toContain('진해귀문관살');
      expect(doc).not.toContain('진미파');
      expect(doc).not.toContain('미진파');
      expect(doc).not.toContain('辰未파');
    });

    it('CASE 03 (직장 갈등): 사해충 × 2, 해해자형 정확 출력', () => {
      const input: UserProblemInput = {
        birthDate: '1995-05-20',
        birthTime: '18:30',
        gender: 'male',
        targetDomain: 'JOB',
        currentEvent: '직장 상사 갈등',
        userTrouble: '이직 시기',
      };
      const res = generator.generateProduct(input, { insightDepth: 3 });
      const doc = res.depthReport.fullDocument;

      expect(doc).toContain('사해충 × 2');
      expect(doc).toContain('해해자형');
      expect(doc).not.toContain('해사충'); // 뒤집힌 중복 명칭 부재
    });

    it('CASE 04 (투자 손실): 묘술육합, 묘오파 정확 출력', () => {
      const input: UserProblemInput = {
        birthDate: '1982-04-05',
        birthTime: '06:00',
        gender: 'male',
        targetDomain: 'MONEY',
        currentEvent: '투자 손실',
        userTrouble: '자산 관리',
      };
      const res = generator.generateProduct(input, { insightDepth: 3 });
      const doc = res.depthReport.fullDocument;

      expect(doc).toContain('묘술육합');
      expect(doc).toContain('묘오파');
    });

    it('CASE 05 (수술/건강): 인신충 × 2, 묘신원진, 묘신귀문관살 정확 출력', () => {
      const input: UserProblemInput = {
        birthDate: '1986-08-15',
        birthTime: '16:00',
        gender: 'male',
        targetDomain: 'HEALTH',
        currentEvent: '수술 권유',
        userTrouble: '건강 회복',
      };
      const res = generator.generateProduct(input, { insightDepth: 5 });
      const doc = res.depthReport.fullDocument;

      expect(doc).toContain('인신충 × 2');
      expect(doc).toContain('묘신원진');
      expect(doc).toContain('묘신귀문관살');
      expect(res.prescriptionReport).toBeDefined();
    });
  });
});

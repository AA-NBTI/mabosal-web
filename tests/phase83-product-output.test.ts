/**
 * test/modules/phase83-product-output.test.ts
 *
 * Phase 83 — 4단계 상품 출력 구조 및 기본 결과 생성 기반 구축 검증 테스트
 *
 * 검증 항목:
 * 1. 4단계 상품 출력 구조 및 섹션 수 규격 검증
 *    - 무료: 8개 섹션
 *    - 유료: 11개 섹션
 *    - 상충·마살 추가: 9개 섹션
 *    - 프리미엄: 24개 섹션
 * 2. 공통 결과 데이터 1회 계산 및 상품별 공유 검증 (재계산 없음)
 * 3. 기본 점수 무결성: 근거 없는 항목은 NOT_AVAILABLE (임의 숫자 생성 금지)
 * 4. 고객 노출 화면에서 내부 엔진 용어 및 AI 키워드 노출 차단 검증
 * 5. 섹션 순서 및 고유 ID 중복 누락 없음 검증
 */

import { describe, it, expect } from 'vitest';
import {
  generateAllProductOutputs,
  PRODUCT_SECTION_IDS,
  INTERNAL_TERM_PATTERNS,
  CommonCaseInput,
} from '../src/modules/product-output/index.js';

describe('Phase 83 — 4단계 상품 출력 구조 및 무결성 검증', () => {
  const sampleCase: CommonCaseInput = {
    solarBirthDate: '1988-05-20',
    birthTime: '14:30',
    gender: 'male',
    calendarType: 'solar',
    birthRegion: '서울',
    coreTrouble: '직장에서 상사의 부당한 지시 번복과 팀 내 R&R 모호함으로 심한 스트레스를 받고 있습니다.',
    desiredQuestion: '올해 하반기에 이직을 추진해야 할지, 아니면 현재 부서에서 버티는 것이 유리할까요?',
    occupation: 'IT 서비스 기획자',
    currentSituation: '팀장 교체 후 6개월간 업무 방향이 수시로 바뀌고 성과 평가에 불안감이 큽니다.',
    relationshipSituation: '상사와 잦은 이견으로 대화가 단절된 상태입니다.',
    financialSituation: '이직 준비 기간 6개월 정도를 버틸 수 있는 비상금은 확보되어 있습니다.',
    healthLifeSituation: '만성 피로와 수면 부족이 지속되고 있습니다.',
    additionalContext: '이전 직장에서도 상사와의 소통 마찰로 퇴사한 경험이 있어 제 패턴인지 궁금합니다.',
    targetYear: 2026,
    targetMonth: 10,
    flowYears: [2026, 2027, 2028],
  };

  const productSet = generateAllProductOutputs(sampleCase);

  it('1. 4단계 상품의 섹션 수 및 ID 순서가 정확히 일치해야 한다', () => {
    // 무료: 8개 섹션
    expect(productSet.free.sections.length).toBe(8);
    expect(productSet.free.sections.map((s) => s.id)).toEqual(PRODUCT_SECTION_IDS.FREE);

    // 유료: 11개 섹션
    expect(productSet.paid.sections.length).toBe(11);
    expect(productSet.paid.sections.map((s) => s.id)).toEqual(PRODUCT_SECTION_IDS.PAID);

    // 상충·마살: 9개 섹션
    expect(productSet.conflictMalSal.sections.length).toBe(9);
    expect(productSet.conflictMalSal.sections.map((s) => s.id)).toEqual(PRODUCT_SECTION_IDS.CONFLICT_MALSAL);

    // 프리미엄: 24개 섹션
    expect(productSet.premium.sections.length).toBe(24);
    expect(productSet.premium.sections.map((s) => s.id)).toEqual(PRODUCT_SECTION_IDS.PREMIUM);
  });

  it('2. 공통 결과 데이터는 단 1회 생성되어 모든 상품에 공유되어야 한다', () => {
    expect(productSet.common).toBeDefined();
    expect(productSet.common.input.coreTrouble).toBe(sampleCase.coreTrouble);
    expect(productSet.common.pillars).toBeDefined();
    expect(productSet.common.pillars.day.stem).toBe('을'); // 1988-05-20 을축일
    expect(productSet.common.yearFlows.length).toBe(3);
    expect(productSet.common.yearFlows[0].year).toBe(2026);
    expect(productSet.common.yearFlows[1].year).toBe(2027);
    expect(productSet.common.yearFlows[2].year).toBe(2028);
  });

  it('3. 기본 점수는 산출 근거가 있는 항목만 수치를 갖고, 근거 없는 항목은 NOT_AVAILABLE이어야 한다', () => {
    const scores = productSet.common.scores;
    expect(scores).toBeDefined();

    // 일간 강약 또는 현재 이슈 점수는 계산된 값이어야 함
    expect(scores.currentIssue.status).toBe('COMPUTED');
    expect(typeof scores.currentIssue.value).toBe('number');

    // 엔진에 별도 산출 로직이 없는 overall, career, money 등은 임의 숫자가 아닌 NOT_AVAILABLE 이어야 함
    expect(scores.overall.status).toBe('NOT_AVAILABLE');
    expect(scores.overall.value).toBeNull();
    expect(scores.career.status).toBe('NOT_AVAILABLE');
    expect(scores.career.value).toBeNull();
    expect(scores.money.status).toBe('NOT_AVAILABLE');
    expect(scores.money.value).toBeNull();
    expect(scores.relationship.status).toBe('NOT_AVAILABLE');
    expect(scores.relationship.value).toBeNull();
  });

  it('4. 고객 화면 출력 내용에 내부 엔진 용어나 AI 키워드가 노출되지 않아야 한다', () => {
    const allProducts = [
      productSet.free,
      productSet.paid,
      productSet.conflictMalSal,
      productSet.premium,
    ];

    for (const prod of allProducts) {
      for (const sec of prod.sections) {
        for (const block of sec.blocks) {
          // block.text 검증
          if (block.text) {
            for (const pattern of INTERNAL_TERM_PATTERNS) {
              expect(block.text).not.toMatch(pattern);
            }
          }
          // block.items 검증
          if (block.items) {
            for (const item of block.items) {
              for (const pattern of INTERNAL_TERM_PATTERNS) {
                expect(item).not.toMatch(pattern);
              }
            }
          }
          // block.rows 검증
          if (block.rows) {
            for (const row of block.rows) {
              for (const pattern of INTERNAL_TERM_PATTERNS) {
                expect(row.value).not.toMatch(pattern);
              }
            }
          }
          // block.table 검증
          if (block.table) {
            for (const r of block.table.rows) {
              for (const cell of r) {
                for (const pattern of INTERNAL_TERM_PATTERNS) {
                  expect(cell).not.toMatch(pattern);
                }
              }
            }
          }
        }
      }
    }
  });

  it('5. 각 상품의 섹션 번호가 1부터 순차적으로 매겨져야 하며 중복이 없어야 한다', () => {
    const allProducts = [
      productSet.free,
      productSet.paid,
      productSet.conflictMalSal,
      productSet.premium,
    ];

    for (const prod of allProducts) {
      const numbers = prod.sections.map((s) => s.no);
      const expected = Array.from({ length: prod.sections.length }, (_, i) => i + 1);
      expect(numbers).toEqual(expected);

      const idSet = new Set(prod.sections.map((s) => s.id));
      expect(idSet.size).toBe(prod.sections.length);
    }
  });

  it('6. 사용자의 핵심 고민과 질문이 누락 없이 상품 결과에 연결되어야 한다', () => {
    // 무료
    const freeQ = productSet.free.sections.find((s) => s.id === 'free.question');
    expect(freeQ).toBeDefined();
    const freeQText = freeQ?.blocks.find((b) => b.label === '내가 입력한 질문')?.text;
    expect(freeQText).toContain('이직');

    // 프리미엄
    const premQ = productSet.premium.sections.find((s) => s.id === 'prem.question');
    expect(premQ).toBeDefined();
    const premQText = premQ?.blocks.find((b) => b.label === '확인할 핵심 질문')?.text;
    expect(premQText).toContain('이직');
  });
});

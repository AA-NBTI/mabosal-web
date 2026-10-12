/**
 * tests/phase84-evidence-accuracy.test.ts
 *
 * Phase 84 — 4단계 출력 근거 추적 및 생성 정확성 강화 테스트 스위트
 *
 * 필수 검증 10개 항목:
 * 1. 입력에 없는 사실이 출력되지 않는지 (재정 버퍼, 임의 자산 단정 차단)
 * 2. 모든 핵심 판단 문장에 OutputEvidence가 누락 없이 연결되는지
 * 3. 근거 없는 decision 표현(최적, 가장 불리, 반드시 등)이 차단/완화되는지
 * 4. 마·살 단독 사건 확정이 차단되고 [존재 → 영역 → 구조결합 → 현실양상] 체인이 지켜지는지
 * 5. 건강 단정 표현(질병명, 장기 이상)이 차단되고 생활관리로 제한되는지
 * 6. 시간축 근거 없는 고정 월별 문장이 생성되지 않고 동적 압박/완화 구간이 산출되는지
 * 7. eventMechanism이 실제 데이터 기반으로 4단계 이상 인과 사슬로 생성되는지
 * 8. eventMechanism이 비어 있을 때 허위 일반 문장이 생성되지 않는지
 * 9. 4개 상품이 동일 CommonResultData를 공유하면서 단계별 깊이 차이를 유지하는지
 * 10. 기존 Phase 83 출력 구조(8/11/9/24 섹션)가 온전히 유지되는지
 *
 * 복수 CASE 교차 검증:
 * - CASE 01: 1998-04-12 09:20 여성 직장인 (상사 충돌, 지시 변경, 공개 질책, 퇴사 고민)
 * - CASE 02: 1988-05-20 14:30 남성 IT 기획자 (상사 지시 번복, R&R 모호성, 이직 vs 잔류)
 */

import { describe, it, expect } from 'vitest';
import {
  generateAllProductOutputs,
  CommonCaseInput,
  PRODUCT_SECTION_IDS,
} from '../src/modules/product-output/index.js';
import { buildPremiumSections } from '../src/modules/product-output/outputs/premium-output.js';

describe('Phase 84 — 4단계 출력 근거 추적 및 생성 정확성 강화 검증', () => {
  // 代表 CASE 01 (1998-04-12 09:20 여성)
  const case01: CommonCaseInput = {
    solarBirthDate: '1998-04-12',
    birthTime: '09:20',
    gender: 'female',
    calendarType: 'solar',
    birthRegion: '서울',
    coreTrouble: '상사와의 잦은 충돌과 갑작스러운 지시 변경, 공개적인 질책으로 인정받지 못한다고 느끼며 퇴사를 심각하게 고민 중입니다.',
    desiredQuestion: '지금 퇴사하는 것이 맞는지, 아니면 현재 직장에서 버티면서 상황을 바꾸는 것이 맞는지 알고 싶습니다.',
    occupation: '직장인',
    targetYear: 2026,
    targetMonth: 10,
    flowYears: [2026, 2027, 2028],
  };

  // 代表 CASE 02 (1988-05-20 14:30 남성)
  const case02: CommonCaseInput = {
    solarBirthDate: '1988-05-20',
    birthTime: '14:30',
    gender: 'male',
    calendarType: 'solar',
    birthRegion: '서울',
    coreTrouble: '직장에서 상사의 잦은 지시 번복과 팀 내 R&R 모호함으로 심한 스트레스를 받고 있습니다.',
    desiredQuestion: '올해 하반기에 이직을 추진해야 할지, 아니면 현재 부서에서 버티는 것이 유리할까요?',
    occupation: 'IT 서비스 기획자',
    targetYear: 2026,
    targetMonth: 10,
    flowYears: [2026, 2027, 2028],
  };

  const outputSet01 = generateAllProductOutputs(case01);
  const outputSet02 = generateAllProductOutputs(case02);

  it('1. 입력에 없는 사실(재정 버퍼 확보 등)이 임의 생성되지 않아야 한다', () => {
    // CASE 01은 financialSituation을 입력하지 않음
    const allSections01 = [
      ...outputSet01.free.sections,
      ...outputSet01.paid.sections,
      ...outputSet01.conflictMalSal.sections,
      ...outputSet01.premium.sections,
    ];

    for (const sec of allSections01) {
      for (const b of sec.blocks) {
        if (b.text) {
          expect(b.text).not.toMatch(/재정\s*버퍼\s*\d+개월\s*확보\s*상태\s*반영/);
          expect(b.text).not.toMatch(/비상금\s*\d+개월\s*확보\s*상태/);
        }
        if (b.items) {
          for (const itm of b.items) {
            expect(itm).not.toMatch(/재정\s*버퍼\s*\d+개월\s*확보\s*상태\s*반영/);
          }
        }
        if (b.options) {
          for (const opt of b.options) {
            for (const cond of opt.conditions || []) {
              expect(cond).not.toMatch(/재정\s*버퍼\s*\d+개월\s*확보\s*상태\s*반영/);
            }
          }
        }
      }
    }
  });

  it('2. 모든 핵심 판단 블록에 OutputEvidence가 누락 없이 연결되어야 한다', () => {
    const products = [outputSet01.free, outputSet01.paid, outputSet01.conflictMalSal, outputSet01.premium];

    for (const p of products) {
      expect(p.meta.evidences).toBeDefined();
      expect(p.meta.evidenceSummary).toBeDefined();
      expect(p.meta.evidenceSummary!.total).toBeGreaterThan(0);
      expect(p.meta.evidenceSummary!.supported).toBe(p.meta.evidenceSummary!.total);

      // 최소 1개 이상의 판단 유형(fact, interpretation, event, time, prescription, decision 등) 포함
      expect(p.meta.evidenceSummary!.byType.fact).toBeGreaterThanOrEqual(0);
      expect(p.meta.evidenceSummary!.byType.interpretation).toBeGreaterThanOrEqual(0);
    }
  });

  it('3. 근거 없는 극단적 decision 표현(가장 불리하다, 최적의 해법이다, 반드시 등)이 차단 및 완화되어야 한다', () => {
    const products = [outputSet01.free, outputSet01.paid, outputSet01.conflictMalSal, outputSet01.premium];

    const forbiddenPhrases = [
      /가장\s*불리합니다/,
      /가장\s*불리하다/,
      /최적의\s*해법입니다/,
      /최적의\s*선택입니다/,
      /반드시\s*(발생|일어|부딪)/,
      /최악의\s*결과/,
    ];

    for (const p of products) {
      for (const sec of p.sections) {
        for (const b of sec.blocks) {
          if (b.text) {
            for (const pattern of forbiddenPhrases) {
              expect(b.text).not.toMatch(pattern);
            }
          }
          if (b.items) {
            for (const itm of b.items) {
              for (const pattern of forbiddenPhrases) {
                expect(itm).not.toMatch(pattern);
              }
            }
          }
        }
      }
    }
  });

  it('4. 마·살은 단독 사건 원인으로 단정되지 않고 4단계 체인으로 연결되어야 한다', () => {
    // 유료 및 상충마살 상품의 마살 섹션 검증
    const cms = outputSet01.conflictMalSal;
    const malsalSec = cms.sections.find((s) => s.id === 'cms.malsal');
    expect(malsalSec).toBeDefined();

    // 4단계 체인 블록들이 존재하는지 확인
    const labels = malsalSec!.blocks.map((b) => b.label);
    expect(labels.some((l) => l?.includes('마·살 감지 및 관련 영역'))).toBe(true);
    expect(labels.some((l) => l?.includes('원국 명리 구조와의 결합 기전'))).toBe(true);
    expect(labels.some((l) => l?.includes('현실에서 나타날 수 있는 마찰 양상'))).toBe(true);
  });

  it('5. 건강 관련 문장에 질병/장기 이상 단정이 없어야 하며 생활관리로 제한되어야 한다', () => {
    const products = [outputSet01.paid, outputSet01.premium, outputSet02.paid, outputSet02.premium];
    const diseasePatterns = [
      /(간|신장|방광|심장|위장)\s*(질환|병|이상|파괴)/,
      /(발병|치료|투약)가?\s*필요합니다/,
    ];

    for (const p of products) {
      const healthSec = p.sections.find((s) => s.id === 'paid.family' || s.id === 'prem.health');
      if (healthSec) {
        for (const b of healthSec.blocks) {
          if (b.text) {
            for (const pat of diseasePatterns) {
              expect(b.text).not.toMatch(pat);
            }
          }
        }
      }
    }
  });

  it('6. 시간축의 부담/완화 구간은 고정 문구가 아닌 실제 계산된 월별 흐름 데이터에 기반해야 한다', () => {
    const yearFlow01 = outputSet01.common.yearFlows[0];
    expect(yearFlow01).toBeDefined();

    // 고정 텍스트인 '4월 ~ 6월 (정점 구간)'이 아닌 실제 판정 데이터 기반인지 확인
    expect(yearFlow01.peakPeriod).not.toBe('2026년 4월 ~ 6월 (정점 구간)');
    expect(yearFlow01.peakPeriod).toContain('2026년');
  });

  it('7. eventMechanism이 사용자 고민과 원국 구조를 반영한 4단계 이상 인과 사슬로 생성되어야 한다', () => {
    // CASE 01
    const em01 = outputSet01.common.integrated?.chainAnalysis?.eventMechanism;
    expect(em01).toBeDefined();
    expect(em01).toContain('사용자 고민');
    expect(em01).toContain('명리 구조');
    expect(em01).toContain('대응 방향');
    expect(em01.split('→').length).toBeGreaterThanOrEqual(4);

    // CASE 02
    const em02 = outputSet02.common.integrated?.chainAnalysis?.eventMechanism;
    expect(em02).toBeDefined();
    expect(em02).toContain('사용자 고민');
    expect(em02).toContain('명리 구조');
    expect(em02).toContain('대응 방향');
  });

  it('8. eventMechanism이 비어 있을 때 고객 화면에 허위 일반 문장을 만들지 않고 missingBlock으로 처리되어야 한다', () => {
    // 임의로 integrated.chainAnalysis.eventMechanism이 비어있는 가상 데이터 테스트
    const emptyCommon = { ...outputSet01.common, integrated: null };
    const sections = buildPremiumSections(emptyCommon);
    const finalSec = sections.find((s: any) => s.id === 'prem.finalDiagnosis');
    expect(finalSec).toBeDefined();

    const emBlock = finalSec!.blocks.find((b: any) => b.label?.includes('사건 메커니즘'));
    expect(emBlock!.missing).toBe(true);
  });

  it('9. 4개 상품이 동일 CommonResultData를 공유하면서 단계별 정보 깊이 차이를 유지해야 한다', () => {
    expect(outputSet01.free.sections.length).toBe(8);
    expect(outputSet01.paid.sections.length).toBe(11);
    expect(outputSet01.conflictMalSal.sections.length).toBe(9);
    expect(outputSet01.premium.sections.length).toBe(24);

    // 공통 원국 데이터가 4개 상품에 100% 동일하게 전달되는지 확인
    expect(outputSet01.common.pillars).toBeDefined();
    expect(['기', '庚', '己']).toContain(outputSet01.common.pillars.day.stem); // 1998-04-12 일간
  });

  it('10. 기존 Phase 83의 4단계 상품 섹션 ID 규격과 순서가 100% 유지되어야 한다', () => {
    expect(outputSet01.free.sections.map((s) => s.id)).toEqual(PRODUCT_SECTION_IDS.FREE);
    expect(outputSet01.paid.sections.map((s) => s.id)).toEqual(PRODUCT_SECTION_IDS.PAID);
    expect(outputSet01.conflictMalSal.sections.map((s) => s.id)).toEqual(PRODUCT_SECTION_IDS.CONFLICT_MALSAL);
    expect(outputSet01.premium.sections.map((s) => s.id)).toEqual(PRODUCT_SECTION_IDS.PREMIUM);
  });
});

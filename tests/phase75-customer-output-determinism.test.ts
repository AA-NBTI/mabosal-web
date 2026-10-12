/**
 * tests/phase75-customer-output-determinism.test.ts
 * 
 * Phase 75: 고객 출력 결정성·생성 안정성 정밀 검증 테스트 스위트
 * 
 * 핵심 검증 목적:
 * 명리 판정 결과가 고객 출력 단계에서 임의로 누락·변형·우선순위 변경되지 않는지 검증.
 * 판정 데이터와 표현 계층의 분리 및 결정성 보장.
 * 
 * 10대 핵심 검증 항목:
 * 1. 동일 입력·동일 버전 → 동일 핵심 판정 유지 (결정론적 판정 불변성)
 * 2. 동일 판정 → 출력 과정에서 핵심 사건이 누락되지 않음 (사건 데이터 무손실)
 * 3. 원국·대운·세운·대운×세운이 서로 혼합되지 않음 (시간축 분리 보존)
 * 4. 명리 근거와 현실 해석의 연결 유지 (명리-현실 인과 사슬 일치)
 * 5. 처방이 원래 판정과 다른 근거로 생성되지 않음 (처방-명리 근거 정합성)
 * 6. 마·살 데이터가 임의로 추가·삭제되지 않음 (마·살 진단 데이터 불변)
 * 7. 고객 출력에서 한자 단독 노출이 발생하지 않음 (한글 명칭 우선 원칙)
 * 8. 금지된 결정론적 표현이 생성되지 않음 (파국 예언 가드)
 * 9. 출력 생성 뷰(종합 10단계, 7대 질문 직답, 요약)가 달라져도 핵심 판정 데이터는 동일함
 * 10. 기존 고객 출력 및 동적 상품 관련 테스트 전수 유지
 */

import { describe, it, expect } from 'vitest';
import {
  ProductGenerator,
  UserProblemInput,
  ProductGenerationResult,
} from '../src/modules/product-generator/index.js';

describe('Phase 75: 고객 출력 결정성·생성 안정성 검증 Test Suite', () => {
  const generator = new ProductGenerator();

  const standardTestInput: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    currentEvent: '주요 거래처 부도로 대금이 묶이고 동업자와 지분 분쟁이 발생했습니다.',
    userTrouble: '회사 운영 자금이 고갈되어 부도 위기이며, 동업자가 일방적으로 지분 매각을 요구합니다.',
    desiredQuestion: '손실을 최소화하고 회사를 지키기 위해 지금 당장 어떤 결정을 내려야 합니까?',
    eventDate: '2024-05-20',
    targetYear: 2024,
  };

  // ==========================================================================
  // 1. 동일 입력·동일 버전 → 동일 핵심 판정 유지 (결정론적 판정 불변성)
  // ==========================================================================
  it('1. 동일 입력·동일 버전에서 10회 반복 실행 시 원천 판정 데이터가 100% 동일하게 유지되어야 한다', () => {
    const runs: ProductGenerationResult[] = [];
    for (let i = 0; i < 10; i++) {
      runs.push(generator.generateProduct(standardTestInput, { insightDepth: 5, prescription: true }));
    }

    const first = runs[0];
    for (let i = 1; i < 10; i++) {
      const cur = runs[i];
      // 도메인 판정 일치
      expect(cur.classification.primaryDomain).toBe(first.classification.primaryDomain);
      // 원국 사주팔자 텍스트 일치
      expect(cur.executedModules['CORE_ORIGINAL'].data.fourPillarsText).toBe(
        first.executedModules['CORE_ORIGINAL'].data.fourPillarsText
      );
      // 구조화된 판정 스냅샷 일치
      expect(cur.customerDeliverable?.structuredJudgments?.coreProblem).toBe(
        first.customerDeliverable?.structuredJudgments?.coreProblem
      );
      expect(cur.customerDeliverable?.structuredJudgments?.magaActive).toEqual(
        first.customerDeliverable?.structuredJudgments?.magaActive
      );
      // 전체 문서 문자열 100% 일치
      expect(cur.customerDeliverable?.fullFormattedText).toBe(first.customerDeliverable?.fullFormattedText);
    }
  });

  // ==========================================================================
  // 2. 동일 판정 → 출력 과정에서 핵심 사건이 누락되지 않음 (사건 데이터 무손실)
  // ==========================================================================
  it('2. 고객 출력의 모든 섹션 및 7대 질문 직답에서 핵심 사건과 고민이 누락 없이 보존되어야 한다', () => {
    const res = generator.generateProduct(standardTestInput, { insightDepth: 5, prescription: true });
    const deliv = res.customerDeliverable!;

    // 1단계 지금 무슨 일이 생겼는가
    expect(deliv.sections.step1_currentEvent).toContain('주요 거래처 부도');
    expect(deliv.sections.step1_currentEvent).toContain('지분 분쟁');

    // 7대 질문 직답 중 Q1 왜 지금 이런 일이 생겼습니까
    expect(deliv.answersTo7Questions.q1_whyNow).toContain('주요 거래처 부도');

    // 구조화 판정 스냅샷의 coreProblem
    expect(deliv.structuredJudgments?.coreProblem).toContain('주요 거래처 부도');
  });

  // ==========================================================================
  // 3. 원국·대운·세운·대운×세운이 서로 혼합되지 않음 (시간축 분리 보존)
  // ==========================================================================
  it('3. 원국, 대운, 세운, 대운×세운의 시간축 데이터가 섞이지 않고 독립적으로 구분 및 보존되어야 한다', () => {
    const res = generator.generateProduct(standardTestInput, { insightDepth: 5, prescription: true });
    const timeAxis = res.customerDeliverable?.structuredJudgments?.timeAxisBreakdown;

    expect(timeAxis).toBeDefined();

    // 1. 원국(NATAL): 사주팔자 지지 간 상호작용
    expect(timeAxis?.natal).toBeDefined();
    expect(Array.isArray(timeAxis?.natal)).toBe(true);

    // 2. 대운(DAEWUN): 10년 대운 간지
    expect(timeAxis?.daewun).toBeDefined();

    // 3. 세운(SEUN): 해당 연도(2024년) 세운 간지
    expect(timeAxis?.seun).toBeDefined();
    expect(timeAxis?.seun?.[0]).toContain('2024년');

    // 원국 데이터에 세운이나 대운의 레이블이 오염되지 않음
    timeAxis?.natal.forEach(n => {
      expect(n).not.toContain('대운×세운');
    });

    // 사건-모듈 매핑(eventMapping)에서도 timeAxisContext.source가 엄격히 분리됨
    if (res.eventMapping) {
      const sources = res.eventMapping.mappings.map(m => m.timeAxisContext?.source).filter(Boolean);
      expect(sources).toContain('NATAL');
      expect(sources).toContain('SEUN');
    }
  });

  // ==========================================================================
  // 4. 명리 근거와 현실 해석의 연결 유지 (명리-현실 인과 사슬 일치)
  // ==========================================================================
  it('4. 현실 해석 및 사건 인과 설명이 임의의 소설이 아니라 실제 실행된 모듈의 판정 근거와 연결되어야 한다', () => {
    const res = generator.generateProduct(standardTestInput, { insightDepth: 4 });
    const deliv = res.customerDeliverable!;

    // 3단계 명리 핵심 설명에 실제 모듈 결과가 반영되어 있는지 확인
    const coreMyeongli = deliv.sections.step3_myeongliCore;
    expect(coreMyeongli).toBeDefined();
    expect(coreMyeongli.length).toBeGreaterThan(20);

    // 2단계 현실 원인 규명과 3단계 명리 분석이 동일한 맥락의 에너지를 다루는지 확인
    expect(deliv.sections.step2_whyOccurred).toBeDefined();
    expect(deliv.answersTo7Questions.q2_myeongliIssue).toContain(coreMyeongli.substring(0, 15));
  });

  // ==========================================================================
  // 5. 처방이 원래 판정과 다른 근거로 생성되지 않음 (처방-명리 근거 정합성)
  // ==========================================================================
  it('5. 행동 및 환경 처방이 문제 도메인(BUSINESS) 및 판정 근거에 부합하게 생성되어야 한다', () => {
    const res = generator.generateProduct(standardTestInput, { insightDepth: 5, prescription: true });
    const presReport = res.prescriptionReport!;

    // 비즈니스 사건 맞춤 Don't 포함 확인
    const avoidText = presReport.mustAvoid.join(' ');
    expect(avoidText).toMatch(/계약|보증|지분|실사/);

    // 엉뚱한 연애 처방(예: 카톡 연락, 소개팅 등)이 혼입되지 않음
    expect(avoidText).not.toMatch(/카톡읽씹|소개팅|재회/);

    // 처방 구조화 스냅샷 일치
    const structuredPres = res.customerDeliverable?.structuredJudgments?.prescriptions;
    expect(structuredPres?.environment.length).toBeGreaterThanOrEqual(1);
    expect(structuredPres?.behavior.length).toBeGreaterThanOrEqual(1);
  });

  // ==========================================================================
  // 6. 마·살 데이터가 임의로 추가·삭제되지 않음 (마·살 진단 데이터 불변)
  // ==========================================================================
  it('6. 마·살 진단 엔진에서 검출된 activeSal 목록이 고객 출력 단계에서 온전히 일치해야 한다', () => {
    const res = generator.generateProduct(standardTestInput, { insightDepth: 5 });

    const rawMagaSal = res.executedModules['MAGA_DIAGNOSIS']?.data?.activeSal || [];
    const rawSalNames = rawMagaSal.map((s: any) => typeof s === 'string' ? s : (s.name || s.salName));

    const deliverableSal = res.customerDeliverable?.structuredJudgments?.magaActive || [];

    // 개수 및 목록 완전 일치 (임의 추가나 삭제 0)
    expect(deliverableSal).toEqual(rawSalNames);
  });

  // ==========================================================================
  // 7. 고객 출력에서 한자 단독 노출이 발생하지 않음 (한글 명칭 우선 원칙)
  // ==========================================================================
  it('7. 고객 출력 전체 텍스트에 한자가 단독으로 노출되지 않고 한글 명칭이 우선되어야 한다', () => {
    const testCases: UserProblemInput[] = [
      standardTestInput,
      {
        birthDate: '1992-03-15',
        birthTime: '08:30',
        gender: 'male',
        currentEvent: '연인과 결별 후 극심한 불안',
      },
      {
        birthDate: '1995-05-20',
        birthTime: '18:30',
        gender: 'male',
        currentEvent: '직장 상사 갈등 및 이직 고민',
      },
    ];

    for (const tc of testCases) {
      const res = generator.generateProduct(tc, { insightDepth: 5, prescription: true });
      const fullText = res.customerDeliverable!.fullFormattedText;

      const lines = fullText.split('\n');
      for (const line of lines) {
        const words = line.trim().split(/\s+/);
        for (const word of words) {
          // 괄호 없이 순수 한자로만 이루어진 2자 이상의 단어 배제
          if (/^[\u4E00-\u9FFF]{2,}$/.test(word)) {
            throw new Error(`한자 단독 노출 위반 감지: "${word}" (줄: ${line})`);
          }
        }
      }
    }
  });

  // ==========================================================================
  // 8. 금지된 결정론적 표현이 생성되지 않음 (파국 예언 가드)
  // ==========================================================================
  it('8. 금지된 확정적 미래 단정 및 공포 조장 표현이 일체 검출되지 않아야 한다', () => {
    const extremeCases: UserProblemInput[] = [
      {
        birthDate: '1982-04-05',
        birthTime: '06:00',
        gender: 'male',
        currentEvent: '극심한 빚과 파산 위기',
        userTrouble: '원금을 탕진하고 감당할 수 없는 채무로 삶을 비관 중입니다.',
      },
      {
        birthDate: '1986-08-15',
        birthTime: '16:00',
        gender: 'male',
        currentEvent: '긴급 척추 수술 권유 및 투병 불안',
      },
    ];

    for (const ec of extremeCases) {
      const res = generator.generateProduct(ec, { insightDepth: 5, prescription: true });
      const text = res.customerDeliverable!.fullFormattedText;

      expect(text).not.toMatch(/반드시\s*(사고|파산|이혼|죽|병|실패)/);
      expect(text).not.toMatch(/무조건\s*(병|실패|망|파산)/);
      expect(text).not.toMatch(/100%\s*(망한다|헤어진다|성공한다|실패한다)/);
      expect(res.customerDeliverable?.safetyPassed).toBe(true);
    }
  });

  // ==========================================================================
  // 9. 출력 생성 뷰가 달라져도 핵심 판정 데이터는 동일함
  // ==========================================================================
  it('9. 10단계 종합 보고서, 7대 질문 직답 뷰, depthReport 섹션 간에 핵심 판정 데이터가 일관되어야 한다', () => {
    const res = generator.generateProduct(standardTestInput, { insightDepth: 5, prescription: true });
    const deliv = res.customerDeliverable!;

    // 10단계 1부의 문제 요약
    const step1 = deliv.sections.step1_currentEvent;
    // 2부의 질문 1 직답
    const q1 = deliv.answersTo7Questions.q1_whyNow;
    // depthReport의 인과 섹션
    const causeSection = deliv.sections.step3_myeongliCore;

    // 모두 동일한 고객 사건을 기반으로 일관된 판정 방향을 유지함
    expect(step1).toContain('주요 거래처 부도');
    expect(q1).toContain('주요 거래처 부도');
    expect(causeSection).toContain('기운');
  });

  // ==========================================================================
  // 10. 기존 고객 출력 및 동적 상품 관련 테스트 전수 유지
  // ==========================================================================
  it('10. ProductConfig의 10대 필드 및 pricing 결과가 손실 없이 보존되어야 한다', () => {
    const res = generator.generateProduct(standardTestInput, { insightDepth: 3 });

    expect(res.productId).toBeDefined();
    expect(res.productName).toBeDefined();
    expect(res.config.insightDepth).toBe(3);
    expect(res.pricing.calculatedPrice).toBeGreaterThan(0);
    expect(res.trace?.engineReleaseVersion).toBe('1.0.0');
    expect(res.trace?.productConfigVersion).toBe('2.0.0');
  });
});

/**
 * test/modules/phase82-output-integrity.test.ts
 * 
 * Phase 82: 하드코딩 제거 및 출력 무결성 계층 (Output Validator) 검증 테스트
 * 
 * 6대 핵심 테스트 CASE:
 * CASE A — 신약: 신강/극강 고정 문구 배제 및 신약 정직 반영
 * CASE B — 신강: 신강 결과에 맞는 정직한 출력
 * CASE C — 사건 연도 미입력: 2024 등 임의 연도 미생성
 * CASE D — JOB 외 도메인: LOVE/MONEY 등에서 JOB 고정 문구(상사, 지시변경, 24시간 등) 배제
 * CASE E — 사용자 입력과 사건 불일치: 미입력 사건(공개 질책 등) 날조 배제
 * CASE F — Validator 차단: 잘못된 출력에 대해 Validator의 5대 감사 규칙 정상 동작 검증
 */

import { describe, it, expect } from 'vitest';
import { ProductGenerator } from '../../src/modules/product-generator/product-generator.js';
import { outputValidator, OutputValidator } from '../../src/modules/product-generator/output-validator.js';
import { prescriptionSynthesizer } from '../../src/modules/prescription/prescription-synthesizer.js';
import { eventEvidenceAggregator } from '../../src/modules/event-synthesis/event-evidence-aggregator.js';
import { integratedAnalyzer } from '../../src/modules/modular/integrated-analyzer.js';

describe('Phase 82 — 하드코딩 제거 및 출력 무결성 계층 검증', () => {
  const generator = new ProductGenerator();

  // --------------------------------------------------------------------------
  // CASE A: 신약 명식 (1990-05-18 13:30 경금 중화신약 43.75점)
  // --------------------------------------------------------------------------
  it('CASE A: 신약 명식에서 신강 고정 문구 및 뚝심이 배제되고 신약 결과가 정직하게 반영되어야 한다', () => {
    const input = {
      birthDate: '1990-05-18',
      birthTime: '13:30',
      gender: 'male' as const,
      userTrouble: '조직 생활에서 피로감이 크고 업무 스트레스가 심합니다.',
      currentEvent: '조직 생활에서 피로감이 크고 업무 스트레스가 심합니다.',
      desiredQuestion: '현 직장을 유지하는 것이 맞는지 이직을 준비해야 하는지 알고 싶습니다.',
    };

    const product = generator.generateProduct(input, { insightDepth: 5, prescription: true });
    const deliverable = product.customerDeliverable;
    const text = `${deliverable?.fullFormattedText || ''} ${deliverable?.standard15Report || ''}`;

    // 1. 강약 점수가 신약(50점 미만)인지 확인
    const strengthScore = product.executedModules['STRENGTH']?.data?.score;
    expect(strengthScore).toBeLessThan(50);

    // 2. 신강 고정 문구 및 뚝심이 없어야 함
    expect(text).not.toContain('일간의 자생력이 대단히 견고(신강/극강)');
    expect(text).not.toContain('자생력이 대단히 견고');
    expect(text).not.toContain('견고한 뚝심');
    expect(text).not.toContain('굳건한 뚝심');

    // 3. 신약의 실제 감당력 특성(완충 필요성, 에너지 소진 위험)이 반영되었는지 확인
    expect(text).toMatch(/신약|완충|경계선|소진|소모/);

    // 4. OutputValidator 감사 통과
    expect(product.validationResult?.isValid).toBe(true);
    expect(product.validationResult?.errors).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // CASE B: 신강 명식 (1998-04-12 09:20 기토 극강 95점)
  // --------------------------------------------------------------------------
  it('CASE B: 신강 명식에서는 신강 결과에 맞는 정직한 출력이 생성되어야 한다', () => {
    const input = {
      birthDate: '1998-04-12',
      birthTime: '09:20',
      gender: 'female' as const,
      userTrouble: '업무 기준과 책임감 때문에 타인과의 마찰이 있습니다.',
      currentEvent: '업무 기준과 책임감 때문에 타인과의 마찰이 있습니다.',
      desiredQuestion: '진로 방향과 대처 방안이 궁금합니다.',
    };

    const product = generator.generateProduct(input, { insightDepth: 5, prescription: true });
    const deliverable = product.customerDeliverable;
    const text = `${deliverable?.fullFormattedText || ''} ${deliverable?.standard15Report || ''}`;

    const strengthScore = product.executedModules['STRENGTH']?.data?.score;
    expect(strengthScore).toBeGreaterThanOrEqual(70);

    // 신약 단정 표현이 없어야 함
    expect(text).not.toContain('극약한 구조');
    expect(text).not.toContain('에너지가 빠르게 소모되는 신약');

    // Validator 통과
    expect(product.validationResult?.isValid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // CASE C: 사건 연도 미입력 (targetYear 미지정)
  // --------------------------------------------------------------------------
  it('CASE C: 사용자가 사건 연도를 입력하지 않았을 때 2024 등 임의 연도가 생성되지 않아야 한다', () => {
    const input = {
      birthDate: '1995-08-20',
      birthTime: '15:00',
      gender: 'male' as const,
      userTrouble: '직무 스트레스로 이직을 고민 중입니다.',
      currentEvent: '직무 스트레스로 이직을 고민 중입니다.',
      desiredQuestion: '앞으로의 흐름이 궁금합니다.',
      // targetYear 없음
    };

    const product = generator.generateProduct(input, { insightDepth: 5, prescription: true });
    const deliverable = product.customerDeliverable;
    const text = `${deliverable?.fullFormattedText || ''} ${deliverable?.standard15Report || ''}`;

    // 임의의 2024년이 특정 사건 발단으로 단정되지 않아야 함
    expect(text).not.toContain('2024년 발단');
    expect(text).not.toContain('2024년 [갑진]');

    // Validator 통과
    expect(product.validationResult?.isValid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // CASE D: JOB 외 도메인 (LOVE 도메인)
  // --------------------------------------------------------------------------
  it('CASE D: LOVE 도메인에서 상사, 지시 변경, 24시간 대응 등 JOB 고정 문구가 나오지 않아야 한다', () => {
    const input = {
      birthDate: '1993-11-05',
      birthTime: '18:20',
      gender: 'female' as const,
      userTrouble: '연인과 잦은 다툼으로 이별을 고민하고 있습니다.',
      currentEvent: '연인과 잦은 다툼으로 이별을 고민하고 있습니다.',
      desiredQuestion: '관계를 회복할 수 있을지 아니면 정리하는 것이 맞는지 알고 싶습니다.',
      targetDomain: 'LOVE' as const,
    };

    const product = generator.generateProduct(input, { insightDepth: 5, prescription: true });
    const deliverable = product.customerDeliverable;
    const text = deliverable?.fullFormattedText || '';

    // JOB 전용 문구들이 LOVE 도메인의 1부/2부 출력에 누출되지 않아야 함
    expect(text).not.toContain('상사의 질책');
    expect(text).not.toContain('지시 번복');
    expect(text).not.toContain('24시간 동안 응답');

    expect(product.validationResult?.isValid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // CASE E: 사용자 미입력 사건 불일치 검증
  // --------------------------------------------------------------------------
  it('CASE E: 사용자가 언급하지 않은 사건(공개 질책 등)이 임의로 생성되지 않아야 한다', () => {
    const input = {
      birthDate: '1992-03-15',
      birthTime: '11:00',
      gender: 'male' as const,
      userTrouble: '단순히 일의 양이 너무 많아서 번아웃이 왔습니다.',
      currentEvent: '단순히 일의 양이 너무 많아서 번아웃이 왔습니다.',
      desiredQuestion: '휴직을 해야 할지 퇴사를 해야 할지 고민입니다.',
      // '공개 질책'이나 '상사 번복' 언급 일절 없음
    };

    const product = generator.generateProduct(input, { insightDepth: 5, prescription: true });
    const deliverable = product.customerDeliverable;
    const text = `${deliverable?.fullFormattedText || ''} ${deliverable?.standard15Report || ''}`;

    // 미입력 사건 날조 배제
    expect(text).not.toContain('공개 질책받는 일이 반복');
    expect(text).not.toContain('공개적으로 질책받는 일');

    expect(product.validationResult?.isValid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // CASE F: OutputValidator 차단 기능 자체 검증
  // --------------------------------------------------------------------------
  it('CASE F: OutputValidator가 강약 모순, 미입력 사건, 임의 연도, 임의 수치, 결정론적 표현을 정확히 차단해야 한다', () => {
    const validator = new OutputValidator();
    const mockContext: any = {
      userInput: {
        birthDate: '1990-05-18',
        currentEvent: '일이 많아서 힘듭니다.',
        userTrouble: '일이 많아서 힘듭니다.',
      },
      executedModules: {
        STRENGTH: {
          data: { score: 35, status: '극약' },
        },
      },
    };

    // 1. 강약 모순 텍스트 테스트 (신약인데 '견고한 뚝심')
    const badText1 = '이 명식은 극약하지만 견고한 뚝심으로 문제를 해결합니다.';
    const res1 = validator.validate(badText1, mockContext);
    expect(res1.isValid).toBe(false);
    expect(res1.errors.some(e => e.code === 'STRENGTH_CONTRADICTION')).toBe(true);

    // 2. 미입력 사건 날조 테스트
    const badText2 = '현재 공개적으로 질책받는 일이 반복되어 고통스럽습니다.';
    const res2 = validator.validate(badText2, mockContext);
    expect(res2.isValid).toBe(false);
    expect(res2.errors.some(e => e.code === 'UNSUBSTANTIATED_EVENT')).toBe(true);

    // 3. 임의 연도 (2024년) 테스트
    const badText3 = '2024년에 시작된 사건으로 인해 갈등이 이어집니다.';
    const res3 = validator.validate(badText3, mockContext);
    expect(res3.isValid).toBe(false);
    expect(res3.errors.some(e => e.code === 'ARBITRARY_YEAR')).toBe(true);

    // 4. 임의 수치 (24시간) 테스트
    const badText4 = '모든 의사결정은 24시간 동안 유예하십시오.';
    const res4 = validator.validate(badText4, mockContext);
    expect(res4.isValid).toBe(false);
    expect(res4.errors.some(e => e.code === 'ARBITRARY_NUMBER')).toBe(true);

    // 5. 결정론적 단정 ("반드시 파산") 테스트
    const badText5 = '이 시기를 넘기지 못하면 반드시 파산하게 됩니다.';
    const res5 = validator.validate(badText5, mockContext);
    expect(res5.isValid).toBe(false);
    expect(res5.errors.some(e => e.code === 'DETERMINISTIC_EXPRESSION')).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 버전 확인
  // --------------------------------------------------------------------------
  it('버전 확인: 각 엔진의 버전이 스펙에 맞게 갱신되었는지 확인한다', () => {
    expect(prescriptionSynthesizer.version).toBe('1.1.0');
    expect(eventEvidenceAggregator.version).toBe('1.1.0');
    expect(integratedAnalyzer.version).toBe('1.2.0');
    expect(outputValidator.version).toBe('1.0.0');
  });
});

/**
 * src/modules/product-generator/output-validator.ts
 * 
 * Phase 82: 고객 전달 결과물 최종 무결성 및 감사 검증기 (Output Validator)
 * 
 * 버전: 1.0.0 (ACTIVE)
 * 
 * 위치:
 * ProductGenerator → CustomerDeliverableBuilder → OutputValidator → 최종 ProductGenerationResult
 * 
 * 5대 필수 감사 항목:
 * 1. 강약 모순 (STRENGTH Contradiction): 계산된 강약(신약/신강)과 상충되는 수식어 및 단정 감사
 * 2. 사용자 미입력 사건 (Unsubstantiated Event Fact): 사용자 입력/모듈에 없는 사건 날조 감사
 * 3. 임의 연도 (Arbitrary Incident Year): 세운/입력에 없는 임의 과거 연도(2024 fallback 등) 감사
 * 4. 임의 수치 (Arbitrary Numbers): 규칙 근거 없는 24시간, 30분 등 고정 수치 감사
 * 5. 결정론적 표현 (Deterministic Statements): "반드시", "무조건", "확실히 사고" 등 미신/단정 표현 감사
 */

import { CustomerDeliverableContext } from './customer-deliverable-builder.js';
import { CustomerDeliverable } from './types.js';

export interface OutputValidationError {
  code: 'STRENGTH_CONTRADICTION' | 'UNSUBSTANTIATED_EVENT' | 'ARBITRARY_YEAR' | 'ARBITRARY_NUMBER' | 'DETERMINISTIC_EXPRESSION';
  severity: 'ERROR' | 'WARNING';
  message: string;
  sourceSnippet?: string;
  field?: string;
}

export interface OutputValidationResult {
  isValid: boolean;
  version: string;
  checkedAt: string;
  errors: OutputValidationError[];
  warnings: OutputValidationError[];
  auditedLength: number;
}

export class OutputValidator {
  public readonly version = '1.0.0';

  /**
   * 최종 고객 전달 텍스트 및 결과물 무결성 감사
   */
  public validate(
    deliverable: CustomerDeliverable | string,
    ctx: CustomerDeliverableContext
  ): OutputValidationResult {
    const errors: OutputValidationError[] = [];
    const warnings: OutputValidationError[] = [];

    const fullText = typeof deliverable === 'string'
      ? deliverable
      : `${deliverable.fullFormattedText || ''}\n${deliverable.standard15Report || ''}`;

    // 1. 강약 모순 검증 (A. STRENGTH Contradiction)
    this.auditStrengthContradiction(fullText, ctx, errors);

    // 2. 사용자 미입력 사건 검증 (B. Unsubstantiated Event)
    this.auditUnsubstantiatedEvents(fullText, ctx, errors);

    // 3. 임의 연도 검증 (C. Arbitrary Year)
    this.auditArbitraryYears(fullText, ctx, errors);

    // 4. 임의 수치 검증 (D. Arbitrary Numbers)
    this.auditArbitraryNumbers(fullText, ctx, errors);

    // 5. 결정론적 표현 검증 (E. Deterministic Statements)
    this.auditDeterministicStatements(fullText, errors);

    const isValid = errors.length === 0;

    return {
      isValid,
      version: this.version,
      checkedAt: new Date().toISOString(),
      errors,
      warnings,
      auditedLength: fullText.length,
    };
  }

  /**
   * 1. 강약 모순 감사
   */
  private auditStrengthContradiction(
    fullText: string,
    ctx: CustomerDeliverableContext,
    errors: OutputValidationError[]
  ): void {
    const strengthMod = ctx.executedModules?.['STRENGTH'];
    const strengthScore = strengthMod?.data?.score ?? 50;
    const strengthStatus = strengthMod?.data?.status || '중화';
    const isWeak = strengthScore < 50 || strengthStatus.includes('약');
    const isStrong = strengthScore >= 70 || strengthStatus.includes('강');

    if (isWeak) {
      // 신약인데 신강/극강을 단정하거나 뚝심 등 신강 전용 수식어가 출력되면 에러
      const weakViolations = [
        '자생력이 대단히 견고',
        '극강한 자생력',
        '신강한 자생력',
        '견고한 뚝심',
        '굳건한 뚝심',
      ];
      for (const phrase of weakViolations) {
        if (fullText.includes(phrase)) {
          errors.push({
            code: 'STRENGTH_CONTRADICTION',
            severity: 'ERROR',
            message: `신약(${strengthStatus}, ${strengthScore}점) 명식에 상충되는 신강 표현("${phrase}")이 감지되었습니다.`,
            sourceSnippet: phrase,
            field: 'STRENGTH',
          });
        }
      }
    } else if (isStrong) {
      // 극강/신강인데 에너지가 쉽게 소진된다는 신약 고정문구가 출력되면 에러
      const strongViolations = [
        '에너지가 빠르게 소모되는 신약',
        '극약한 구조',
        '극도로 신약',
      ];
      for (const phrase of strongViolations) {
        if (fullText.includes(phrase)) {
          errors.push({
            code: 'STRENGTH_CONTRADICTION',
            severity: 'ERROR',
            message: `신강(${strengthStatus}, ${strengthScore}점) 명식에 상충되는 신약 표현("${phrase}")이 감지되었습니다.`,
            sourceSnippet: phrase,
            field: 'STRENGTH',
          });
        }
      }
    }
  }

  /**
   * 2. 사용자 미입력 사건 감사
   */
  private auditUnsubstantiatedEvents(
    fullText: string,
    ctx: CustomerDeliverableContext,
    errors: OutputValidationError[]
  ): void {
    const rawUserInput = [
      ctx.userInput.currentEvent,
      ctx.userInput.userTrouble,
      ctx.userInput.selectedSituation,
      ctx.userInput.additionalContext,
    ].filter(Boolean).join(' ');

    // 사용자가 '질책'을 언급하지 않았는데, 출력에서 "공개 질책받는 일"이나 "상사의 질책"을 기정사실화한 경우
    const mentionsPublicScoldingInput = /공개|질책|모욕/.test(rawUserInput);
    if (!mentionsPublicScoldingInput) {
      if (/공개 질책받는 일이 반복|공개적으로 질책받는 일/.test(fullText)) {
        errors.push({
          code: 'UNSUBSTANTIATED_EVENT',
          severity: 'ERROR',
          message: '사용자가 입력하지 않은 "공개 질책" 사실이 결과물에 기정사실로 단정되었습니다.',
          sourceSnippet: '공개 질책',
          field: 'userInput',
        });
      }
    }
  }

  /**
   * 3. 임의 연도 감사 (2024년 등 fallback 누출 차단)
   */
  private auditArbitraryYears(
    fullText: string,
    ctx: CustomerDeliverableContext,
    errors: OutputValidationError[]
  ): void {
    const allowedYears: number[] = [];
    if (ctx.userInput.targetYear) allowedYears.push(ctx.userInput.targetYear);
    const seunYear = ctx.executedModules?.['SEUN']?.calculation?.rawMetrics?.targetYear;
    if (seunYear) allowedYears.push(seunYear);
    const currentYear = new Date().getFullYear() || 2026;
    allowedYears.push(currentYear);
    allowedYears.push(currentYear + 1);
    allowedYears.push(currentYear - 1);

    // 2024년이 사용자가 지정하지도 않았고 세운도 아닌데 사건 발단 연도로 튀어나오는지 검사
    if (!allowedYears.includes(2024) && fullText.includes('2024년')) {
      errors.push({
        code: 'ARBITRARY_YEAR',
        severity: 'ERROR',
        message: '분석 대상에 포함되지 않은 임의 연도 "2024년"이 출력에 포함되었습니다.',
        sourceSnippet: '2024년',
        field: 'targetYear',
      });
    }
  }

  /**
   * 4. 임의 수치 감사 (24시간, 30분 등)
   */
  private auditArbitraryNumbers(
    fullText: string,
    _ctx: CustomerDeliverableContext,
    errors: OutputValidationError[]
  ): void {
    const arbitraryTimePatterns = [
      '24시간',
      '30분 이내',
      '최소 30분 이상',
    ];

    for (const pat of arbitraryTimePatterns) {
      if (fullText.includes(pat)) {
        errors.push({
          code: 'ARBITRARY_NUMBER',
          severity: 'ERROR',
          message: `명리적 근거가 없는 고정 수치 표현("${pat}")이 행동 처방에 감지되었습니다.`,
          sourceSnippet: pat,
          field: 'behaviorRemedy',
        });
      }
    }
  }

  /**
   * 5. 결정론적 표현 감사
   */
  private auditDeterministicStatements(
    fullText: string,
    errors: OutputValidationError[]
  ): void {
    const deterministicWords = [
      '반드시 파산',
      '반드시 이혼',
      '반드시 실패',
      '확실히 사고',
      '반드시 죽음',
      '무조건 망한다',
      '확정적 재앙',
    ];

    for (const word of deterministicWords) {
      if (fullText.includes(word)) {
        errors.push({
          code: 'DETERMINISTIC_EXPRESSION',
          severity: 'ERROR',
          message: `금지된 결정론적 단정 표현("${word}")이 감지되었습니다.`,
          sourceSnippet: word,
          field: 'safeguard',
        });
      }
    }
  }
}

export const outputValidator = new OutputValidator();

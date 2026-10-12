/**
 * src/modules/modular/base-modular-engine.ts
 * 
 * Phase 60: 독립 모듈 기본 추상 엔진 (Base Modular Engine)
 * 
 * 파이프라인: Input → Calculation → Judgment → Explanation → Output
 * 원칙:
 * 1. 다른 모듈의 선행 결과 없이도 단독 실행(Standalone) 100% 가능
 * 2. 독립 상품화 및 단독 결과 저장/조회/포맷팅 지원
 * 3. OCP(Open-Closed Principle): 신규 모듈 추가 시 기존 모듈 코드 수정 불필요
 */

import { CalendarEngine } from '../calendar/calendar-engine.js';
import { PillarEngine } from '../pillar/pillar-engine.js';
import { FourPillars } from '../../core/types.js';
import { ModularId, ModuleCategory, ModularInput, ModularOutput } from './types.js';

export abstract class BaseModularEngine<TResult = any> {
  public abstract readonly moduleId: ModularId;
  public abstract readonly moduleName: string;
  public abstract readonly category: ModuleCategory;
  public abstract readonly version: string;
  public abstract readonly defaultPrice: number;

  private static calendarEngine = new CalendarEngine();
  private static pillarEngine = new PillarEngine();

  /**
   * 단독 실행 파이프라인 엔트리포인트:
   * Input → Calculation → Judgment → Explanation → Output
   */
  public execute(input: ModularInput): ModularOutput<TResult> {
    const pillars = this.ensurePillars(input);

    // 1. Calculation (순수 계산)
    const calculation = this.calculate(input, pillars);

    // 2. Judgment (명리학적 판정)
    const judgment = this.judge(input, pillars, calculation);

    // 3. Explanation (고객용 자연어 해설)
    const explanation = this.explain(input, pillars, calculation, judgment);

    // 4. Output (최종 표준 모듈 결과 패키징)
    const data = this.buildOutputData(calculation, judgment, explanation);

    return {
      moduleId: this.moduleId,
      moduleName: this.moduleName,
      category: this.category,
      version: this.version,
      success: true,
      calculation,
      judgment,
      explanation,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 선행 모듈이 없어도 스스로 4주 간지를 안전하게 도출 (독립성 보장)
   */
  protected ensurePillars(input: ModularInput): FourPillars {
    if (input.contextData?.four_pillars) {
      return input.contextData.four_pillars;
    }
    const isMissingTime = input.isUnknownTime === true || input.birthTime === null || input.birthTime === '';
    const cal = BaseModularEngine.calendarEngine.execute({
      birth_date: input.birthDate,
      birth_time: isMissingTime ? null : (input.birthTime || '12:00'),
      calendar_type: input.calendarType || 'solar',
      is_leap_month: input.isLeapMonth || false,
      region: input.region || 'Seoul',
    });
    const pil = BaseModularEngine.pillarEngine.execute(cal.data);
    return pil.data.four_pillars;
  }

  // 서브클래스에서 구현할 4단계 생명주기
  protected abstract calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'];
  protected abstract judge(
    input: ModularInput,
    pillars: FourPillars,
    calculation: ModularOutput['calculation']
  ): ModularOutput['judgment'];
  protected abstract explain(
    input: ModularInput,
    pillars: FourPillars,
    calculation: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'];
  protected abstract buildOutputData(
    calculation: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ): TResult;
}

/**
 * 마보살 엔진 모듈 기본 추상 클래스
 * 
 * 원칙:
 * 1. 각 모듈은 독립적으로 INPUT → PROCESS → OUTPUT 이 가능해야 함
 * 2. 특정 모듈이 실패하거나 없어도 전체 엔진은 중단되지 않음 (status: unavailable)
 * 3. 메타데이터(module_id, module_version, rule_version, confidence) 필수 제공
 */

import { EngineResult, ModuleMetadata, ModuleStatus } from './types.js';

export abstract class BaseEngineModule<TInput, TOutput> {
  protected abstract readonly moduleId: string;
  protected abstract readonly moduleVersion: string;
  protected abstract readonly ruleVersion: string;
  protected abstract readonly inputSchemaName: string;
  protected abstract readonly outputSchemaName: string;

  /**
   * 모듈의 기본 신뢰도 (0~100)
   */
  protected defaultConfidence: number = 100.0;

  /**
   * 모듈의 메타데이터 조회
   */
  public getMetadata(status: ModuleStatus = 'active', confidence?: number): ModuleMetadata {
    return {
      module_id: this.moduleId,
      module_version: this.moduleVersion,
      rule_version: this.ruleVersion,
      input_schema: this.inputSchemaName,
      output_schema: this.outputSchemaName,
      status,
      confidence: confidence ?? this.defaultConfidence,
    };
  }

  /**
   * 입력 유효성 검사 (서브클래스에서 구현)
   */
  protected abstract validateInput(input: TInput): { isValid: boolean; reason?: string };

  /**
   * 모듈의 핵심 처리 로직 (서브클래스에서 구현)
   */
  protected abstract processInternal(input: TInput): {
    data: TOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  };

  /**
   * 모듈 비가용 시 반환할 기본(fallback) 데이터
   */
  protected abstract getFallbackData(input: TInput, errorReason: string): TOutput;

  /**
   * 실행 엔트리포인트 (안전 실행 래퍼)
   */
  public execute(input: TInput): EngineResult<TOutput> {
    try {
      const validation = this.validateInput(input);
      if (!validation.isValid) {
        return {
          metadata: this.getMetadata('degraded', 0),
          data: this.getFallbackData(input, validation.reason ?? 'Input validation failed'),
          notes: [`입력 유효성 검사 실패: ${validation.reason}`],
        };
      }

      const result = this.processInternal(input);
      return {
        metadata: this.getMetadata('active', result.confidence),
        data: result.data,
        spec_gaps: result.spec_gaps,
        notes: result.notes,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // 특정 모듈 장애 시 status=unavailable로 처리하여 전체 엔진 중단 방지
      return {
        metadata: this.getMetadata('unavailable', 0),
        data: this.getFallbackData(input, errorMessage),
        notes: [`모듈 실행 중 예외 발생 (엔진 격리 처리): ${errorMessage}`],
      };
    }
  }
}

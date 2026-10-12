/**
 * Phase 8: Ma Module Engine (21개 마 총괄 오케스트레이션 엔진)
 * 
 * 모듈 원칙:
 * INPUT (SignalOutput) → PROCESS → OUTPUT (MaModuleEngineOutput)
 * 20개 표준 마 + 21번 확장 슬롯을 독립 관리하며,
 * 특정 마의 오류나 추가/제거가 다른 마의 결과에 전혀 영향을 주지 않습니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { Score5Axis, TimeDependencyInfo } from '../../core/types.js';
import { SignalOutput } from '../signal/signal-engine.js';
import { ExtensionSlotMaModule } from './extension-slot.js';
import { IMaModule, MaId, MaModuleContext, MaResult } from './ma-types.js';
import {
  AccidentMaModule,
  AssetMaModule,
  BusinessMaModule,
  CareerMaModule,
  ChildrenMaModule,
  DocumentMaModule,
  ExamMaModule,
  FamilyMaModule,
  FameMaModule,
  GossipMaModule,
  HealthMaModule,
  HomeMaModule,
  LegalMaModule,
  MarriageMaModule,
  MovementMaModule,
  NobleMaModule,
  ParentsMaModule,
  RomanceMaModule,
  SocialMaModule,
  WealthMaModule,
} from './standard-ma-modules.js';

export interface MaModuleEngineInput {
  signals: SignalOutput;
  targetDateStr?: string;
}

export interface MaModuleEngineOutput {
  ma_results: Record<string, MaResult>;
  ranked_mas: MaResult[];
  top_ma: MaResult;
  bottom_ma: MaResult;
  registered_count: number;
  time_dependency: TimeDependencyInfo;
}

export class MaModuleEngine extends BaseEngineModule<MaModuleEngineInput, MaModuleEngineOutput> {
  protected readonly moduleId = 'ma_module_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'MaModuleEngineInput';
  protected readonly outputSchemaName = 'MaModuleEngineOutput';

  private registry = new Map<MaId, IMaModule>();

  constructor() {
    super();
    this.registerStandardModules();
  }

  /**
   * 1~20번 표준 마 및 21번 기본 확장 슬롯 등록
   */
  private registerStandardModules(): void {
    const modules: IMaModule[] = [
      new WealthMaModule(),
      new BusinessMaModule(),
      new CareerMaModule(),
      new AssetMaModule(),
      new SocialMaModule(),
      new RomanceMaModule(),
      new MarriageMaModule(),
      new FamilyMaModule(),
      new ChildrenMaModule(),
      new ParentsMaModule(),
      new HealthMaModule(),
      new AccidentMaModule(),
      new GossipMaModule(),
      new DocumentMaModule(),
      new LegalMaModule(),
      new MovementMaModule(),
      new ExamMaModule(),
      new FameMaModule(),
      new NobleMaModule(),
      new HomeMaModule(),
      new ExtensionSlotMaModule(),
    ];

    for (const mod of modules) {
      this.registry.set(mod.maId, mod);
    }
  }

  /**
   * 모듈 동적 등록 (확장 슬롯 또는 신규 마)
   */
  public registerModule(module: IMaModule): void {
    this.registry.set(module.maId, module);
  }

  /**
   * 모듈 동적 제거 (모듈 삭제 격리 테스트 지원)
   */
  public unregisterModule(maId: MaId): boolean {
    return this.registry.delete(maId);
  }

  public getModule(maId: MaId): IMaModule | undefined {
    return this.registry.get(maId);
  }

  protected validateInput(input: MaModuleEngineInput): { isValid: boolean; reason?: string } {
    if (!input || !input.signals) {
      return { isValid: false, reason: 'MaModuleEngineInput signals 필드가 누락되었습니다.' };
    }
    return { isValid: true };
  }

  protected processInternal(input: MaModuleEngineInput): {
    data: MaModuleEngineOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const notes: string[] = [];
    const spec_gaps: string[] = [];
    const context: MaModuleContext = {
      signals: input.signals,
      targetDateStr: input.targetDateStr,
    };

    const results: Record<string, MaResult> = {};
    const resultList: MaResult[] = [];

    // 각 마 모듈을 개별 try-catch로 격리 실행하여, 하나의 마 실패가 전체를 중단시키지 않음
    for (const [id, mod] of this.registry.entries()) {
      try {
        const res = mod.calculate(context);
        results[id] = res;
        resultList.push(res);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        notes.push(`[격리] ${mod.koreanName}(${id}) 계산 오류: ${errMsg}`);
        const fallbackRes: MaResult = {
          ma_id: id,
          korean_name: mod.koreanName,
          order: mod.order,
          score_5axis: { intensity: 0, pressure: 0, opportunity: 0, volatility: 0, mitigation: 0 },
          presentation_score: 0,
          presentation_band: '산출 불가 (격리됨)',
          breakdown: {},
          notes: [`계산 오류 격리: ${errMsg}`],
        };
        results[id] = fallbackRes;
        resultList.push(fallbackRes);
      }
    }

    // 종합 점수 기준 내림차순 정렬
    const ranked = [...resultList].sort((a, b) => b.presentation_score - a.presentation_score);
    const topMa = ranked[0];
    const bottomMa = ranked[ranked.length - 1];

    const data: MaModuleEngineOutput = {
      ma_results: results,
      ranked_mas: ranked,
      top_ma: topMa,
      bottom_ma: bottomMa,
      registered_count: this.registry.size,
      time_dependency: input.signals.time_dependency,
    };

    return {
      data,
      confidence: input.signals.time_dependency.is_missing_hour ? 80.0 : 100.0,
      spec_gaps: spec_gaps.length > 0 ? spec_gaps : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  protected getFallbackData(input: MaModuleEngineInput, errorReason: string): MaModuleEngineOutput {
    const dummyMa: MaResult = {
      ma_id: 'ma_wealth',
      korean_name: '재물마',
      order: 1,
      score_5axis: { intensity: 0, pressure: 0, opportunity: 0, volatility: 0, mitigation: 0 },
      presentation_score: 0,
      presentation_band: '산출 불가',
      breakdown: {},
      notes: [errorReason],
    };
    return {
      ma_results: { ma_wealth: dummyMa },
      ranked_mas: [dummyMa],
      top_ma: dummyMa,
      bottom_ma: dummyMa,
      registered_count: 0,
      time_dependency: { requires_hour: true, time_dependency: 100, is_missing_hour: true, notes: errorReason },
    };
  }
}

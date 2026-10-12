/**
 * ExtensionSlotMaModule: 21번 확장 슬롯 모듈
 * 
 * 원칙:
 * 1. 신규 마(Ma)를 동적으로 등록/확장할 수 있습니다.
 * 2. 신규 마를 추가하거나 제거해도 기존 1~20번 마의 계산 결과는 0.01점도 변하지 않습니다.
 */

import { BaseMaModule } from './base-ma-module.js';
import { IMaModule, MaId, MaModuleContext, MaResult } from './ma-types.js';

export type CustomMaCalculator = (context: MaModuleContext) => {
  presentationScore: number;
  intensity: number;
  pressure: number;
  opportunity: number;
  volatility: number;
  mitigation: number;
  breakdown: Record<string, number>;
  notes: string[];
};

export class ExtensionSlotMaModule extends BaseMaModule {
  public readonly maId: MaId;
  public readonly koreanName: string;
  public readonly order: number;
  private customCalculator?: CustomMaCalculator;

  constructor(
    customId: string = 'ma_extension_slot',
    customName: string = '확장 슬롯 (커스텀 마)',
    order: number = 21,
    calculator?: CustomMaCalculator
  ) {
    super();
    this.maId = customId;
    this.koreanName = customName;
    this.order = order;
    this.customCalculator = calculator;
  }

  public setCalculator(calculator: CustomMaCalculator): void {
    this.customCalculator = calculator;
  }

  public calculate(context: MaModuleContext): MaResult {
    if (this.customCalculator) {
      const custom = this.customCalculator(context);
      const score = Math.max(0, Math.min(100, Math.round(custom.presentationScore * 100) / 100));
      return {
        ma_id: this.maId,
        korean_name: this.koreanName,
        order: this.order,
        score_5axis: this.build5Axis(
          custom.intensity,
          custom.pressure,
          custom.opportunity,
          custom.volatility,
          custom.mitigation
        ),
        presentation_score: score,
        presentation_band: this.getPresentationBand(score),
        breakdown: custom.breakdown,
        notes: custom.notes,
      };
    }

    // 기본 확장 슬롯 (활성 계산기 미등록 시 기본 중립 점수)
    const base = context.signals.axis5_baseline;
    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: base,
      presentation_score: base.intensity,
      presentation_band: this.getPresentationBand(base.intensity),
      breakdown: { 베이스강도: base.intensity },
      notes: ['확장 슬롯이 대기 상태입니다. 새로운 마 모듈을 독립 장착할 수 있습니다.'],
    };
  }
}

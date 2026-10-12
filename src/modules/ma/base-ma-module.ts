/**
 * BaseMaModule: 마 모듈 추상 기본 클래스
 */

import { Score5Axis } from '../../core/types.js';
import { IMaModule, MaId, MaModuleContext, MaResult } from './ma-types.js';

export abstract class BaseMaModule implements IMaModule {
  public abstract readonly maId: MaId;
  public abstract readonly koreanName: string;
  public abstract readonly order: number;

  public abstract calculate(context: MaModuleContext): MaResult;

  /**
   * 10점 단위 판정 라벨 헬퍼 (출력 단계에서만 사용)
   */
  protected getPresentationBand(score: number): string {
    const s = Math.max(0, Math.min(100, score));
    if (s >= 90) return '90점대 (극대/매우 강함)';
    if (s >= 80) return '80점대 (강한 작용)';
    if (s >= 70) return '70점대 (유의미한 강도)';
    if (s >= 60) return '60점대 (다소 활성)';
    if (s >= 50) return '50점대 (보통/평이)';
    if (s >= 40) return '40점대 (다소 정체)';
    if (s >= 30) return '30점대 (약한 편)';
    if (s >= 20) return '20점대 (미약)';
    return '10점대 이하 (잠재 상태)';
  }

  /**
   * 5대 축 빌더 헬퍼
   */
  protected build5Axis(
    intensity: number,
    pressure: number,
    opportunity: number,
    volatility: number,
    mitigation: number
  ): Score5Axis {
    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v * 100) / 100));
    return {
      intensity: clamp(intensity),
      pressure: clamp(pressure),
      opportunity: clamp(opportunity),
      volatility: clamp(volatility),
      mitigation: clamp(mitigation),
    };
  }
}

/**
 * MissingHourEngine: 출생시간 미상(hour=null) 정밀 처리 및 시간 의존도 평가 모듈
 * 
 * 원칙:
 * 1. 출생시간 미상이라고 임의의 시간을 절대 주입하지 않습니다.
 * 2. 시간이 불필요한 분석(연·월·일 3기둥 기반)은 100% 정상 수행합니다.
 * 3. 출생시간 영향이 큰 영역(자녀궁, 말년운, 결핍 오행 보충 등)을 사용자 친화적으로 식별합니다.
 */

import { FiveElementsAnalysis } from '../saju-core/five-elements.js';
import { DayMasterStrengthResult } from '../saju-core/strength-engine.js';

export interface MissingHourAssessment {
  isMissingHour: boolean;
  timeDependencyScore: number; // 0 ~ 100 (시간에 따라 전체 해석이 얼마나 흔들리는지)
  confidence: number;          // 0 ~ 100 (시간 미상 시 최대 75~80)
  sensitiveAreas: {
    areaName: string;
    reason: string;
    impactLevel: 'high' | 'medium' | 'low';
  }[];
  userGuidanceMessage: string;
}

export class MissingHourEngine {
  public assess(
    isMissingHour: boolean,
    strength: DayMasterStrengthResult,
    elements: FiveElementsAnalysis
  ): MissingHourAssessment {
    if (!isMissingHour) {
      return {
        isMissingHour: false,
        timeDependencyScore: 0.0,
        confidence: 100.0,
        sensitiveAreas: [],
        userGuidanceMessage: '출생시간이 온전히 반영되어 4기둥 전체가 확정되었습니다.',
      };
    }

    const sensitiveAreas: MissingHourAssessment['sensitiveAreas'] = [
      {
        areaName: '자녀마 및 말년운 (시주 궁위)',
        reason: '시주는 자녀궁과 46세 이후 인생 후반부 거처를 관장하므로 시주에 따라 결과 차이가 큽니다.',
        impactLevel: 'high',
      },
    ];

    // 중화 부근(45~55점)이면 시주 1글자에 따라 신강/신약이 뒤바뀔 수 있으므로 시간 의존성 극대화
    let timeDependency = 50.0;
    if (strength.totalStrengthScore >= 42.0 && strength.totalStrengthScore <= 58.0) {
      timeDependency += 25.0;
      sensitiveAreas.push({
        areaName: '일간 강약 (신강/신약 분기점)',
        reason: `현재 3주 기준 일간 점수(${strength.totalStrengthScore}점)가 중화 경계에 있어, 시주의 비겁/인성 여부에 따라 신강·신약 판정이 반전될 수 있습니다.`,
        impactLevel: 'high',
      });
    }

    // 결핍 오행이 있는 경우 시주에서 보충될 가능성
    if (elements.missingElements.length > 0) {
      timeDependency += 10.0;
      sensitiveAreas.push({
        areaName: `오행 결핍 보완 (${elements.missingElements.join(', ')})`,
        reason: `현재 원국에 [${elements.missingElements.join(', ')}] 오행이 드러나지 않았으며, 출생 시주의 간지에서 보충될 가능성이 있습니다.`,
        impactLevel: 'medium',
      });
    }

    const finalTimeDependency = Math.min(100.0, timeDependency);
    // 시간 미상 시 사주 4주 중 1주 결손이므로 신뢰도 상한을 80.0으로 제한
    const confidence = Math.max(50.0, Math.min(80.0, Math.round((100.0 - finalTimeDependency * 0.35) * 100) / 100));

    const highImpactAreas = sensitiveAreas.filter(a => a.impactLevel === 'high').map(a => a.areaName).join(', ');
    const userGuidanceMessage =
      `사주는 연주·월주·일주·시주의 네 기둥으로 구성됩니다. 현재는 출생시간을 제외한 세 기둥을 기준으로 분석했으며, 일부 영역은 시주에 따라 결과가 달라질 수 있습니다.\n` +
      `현재 결과에서 출생시간의 영향이 큰 영역은 [${highImpactAreas || '자녀궁/말년운'}]입니다.`;

    return {
      isMissingHour: true,
      timeDependencyScore: finalTimeDependency,
      confidence,
      sensitiveAreas,
      userGuidanceMessage,
    };
  }
}

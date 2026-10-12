/**
 * Phase 11: Taste Module (맛 모듈 총괄 엔진)
 * 
 * 모듈 원칙:
 * 1. INPUT (Engine Result + TasteType) → PROCESS → OUTPUT (TasteOutput)
 * 2. 지시서 제10원칙 준수: 맛은 계산 결과를 절대 변경하지 않음 (Engine Result = 동일).
 * 3. 달라지는 것은 오직 표현 강도, 어조, 경고 수위, 문체 템플릿입니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';
import { StyledExpressionSet, TasteOutput, TasteProfile, TasteType } from './taste-types.js';

export interface TasteInput {
  tasteType?: TasteType;
  maOutput: MaModuleEngineOutput;
}

export class TasteEngine extends BaseEngineModule<TasteInput, TasteOutput<MaModuleEngineOutput>> {
  protected readonly moduleId = 'taste_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'TasteInput';
  protected readonly outputSchemaName = 'TasteOutput';

  private profiles = new Map<TasteType, TasteProfile>();

  constructor() {
    super();
    this.registerStandardProfiles();
  }

  private registerStandardProfiles(): void {
    const standard: TasteProfile[] = [
      {
        tasteId: 'mild',
        koreanName: '순한맛',
        directnessLevel: 1,
        empathyLevel: 5,
        cautionIntensity: 2,
        speechStyle: '따뜻하고 부드러운 위로와 격려, 긍정적 가능성에 집중하는 문체',
      },
      {
        tasteId: 'standard',
        koreanName: '보통맛',
        directnessLevel: 3,
        empathyLevel: 3,
        cautionIntensity: 3,
        speechStyle: '균형 잡힌 시각, 명확하고 친절하면서도 객관적인 정통 명리 문체',
      },
      {
        tasteId: 'spicy',
        koreanName: '매운맛',
        directnessLevel: 5,
        empathyLevel: 1,
        cautionIntensity: 5,
        speechStyle: '날카로운 팩트 폭격, 뼈때리는 현실 직시와 엄중한 경고의 문체',
      },
      {
        tasteId: 'cold',
        koreanName: '냉정한맛',
        directnessLevel: 4,
        empathyLevel: 1,
        cautionIntensity: 4,
        speechStyle: '감정을 완전히 배제하고 오직 확률과 데이터 인과율로만 설명하는 건조한 문체',
      },
      {
        tasteId: 'realistic',
        koreanName: '현실적인맛',
        directnessLevel: 4,
        empathyLevel: 3,
        cautionIntensity: 4,
        speechStyle: '사주 이론을 현실 속 돈, 직장, 계약, 생활 습관으로 치환하는 실천적 문체',
      },
      {
        tasteId: 'bodhisattva',
        koreanName: '보살맛',
        directnessLevel: 2,
        empathyLevel: 4,
        cautionIntensity: 2,
        speechStyle: '자비롭고 선문답 같은 지혜로 인생의 흐름을 관조하게 이끄는 혜안의 문체',
      },
      {
        tasteId: 'direct',
        koreanName: '직설맛',
        directnessLevel: 5,
        empathyLevel: 2,
        cautionIntensity: 4,
        speechStyle: '미사여구 없이 핵심 결론과 해야 할 일만 단도직입적으로 꽂아주는 문체',
      },
    ];

    for (const p of standard) {
      this.profiles.set(p.tasteId, p);
    }
  }

  /**
   * 신규 맛 동적 등록 (확장 가능성 보장)
   */
  public registerCustomTaste(profile: TasteProfile): void {
    this.profiles.set(profile.tasteId, profile);
  }

  public getProfile(tasteType: TasteType): TasteProfile {
    return this.profiles.get(tasteType) || this.profiles.get('standard')!;
  }

  protected validateInput(input: TasteInput): { isValid: boolean; reason?: string } {
    if (!input || !input.maOutput) {
      return { isValid: false, reason: 'TasteInput maOutput 필드가 누락되었습니다.' };
    }
    return { isValid: true };
  }

  protected processInternal(input: TasteInput): {
    data: TasteOutput<MaModuleEngineOutput>;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const tasteId = input.tasteType || 'standard';
    const profile = this.getProfile(tasteId);
    const maOut = input.maOutput;
    const topMa = maOut.top_ma;

    // 맛에 따른 표현 템플릿 변환 (계산 수치는 절대 변경하지 않음)
    let title = '';
    let topMaComment = '';
    let cautionComment = '';
    let actionAdvice = '';

    const scoreStr = topMa.presentation_score.toFixed(2);
    const maName = topMa.korean_name;

    switch (profile.tasteId) {
      case 'mild':
        title = `따뜻한 마음으로 짚어보는 당신의 사주 흐름입니다.`;
        topMaComment = `현재 당신의 삶에서 가장 반짝이고 있는 기운은 [${maName}]입니다 (${scoreStr}점). 이 기운이 당신을 든든하게 받쳐주고 있으니 스스로를 믿으셔도 좋습니다.`;
        cautionComment = `조금 버거운 부분이 있더라도 그것은 지나가는 구름일 뿐입니다. 마음의 여유를 잃지 마세요.`;
        actionAdvice = `무리해서 속도를 내기보다는 스스로를 다독이며 한 걸음씩 나아가시길 권합니다.`;
        break;

      case 'spicy':
        title = `가식 없이 뼈때리는 마보살의 팩트 분석입니다.`;
        topMaComment = `지금 당신을 지배하고 흔드는 건 바로 [${maName}] (${scoreStr}점)입니다. 어설픈 핑계 대지 말고 이 현실부터 똑바로 직시하십시오.`;
        cautionComment = `방심하면 바로 발목 잡힙니다. 압박 요소를 안일하게 넘기다간 큰코다칩니다.`;
        actionAdvice = `당장 쓸데없는 욕심과 미련을 버리고, 가장 취약한 구멍부터 메우십시오.`;
        break;

      case 'cold':
        title = `객관적 지표에 기반한 명리학적 데이터 리포트입니다.`;
        topMaComment = `식별된 최상위 지표는 [${maName}]으로 정량 점수 ${scoreStr}점의 영향력을 가집니다.`;
        cautionComment = `통계적 변동성과 마찰 리스크 지표가 관측되므로 리스크 관리가 요구됩니다.`;
        actionAdvice = `감정적 판단을 배제하고 오직 확률적 우위가 확인된 방향으로만 자원을 배분하십시오.`;
        break;

      case 'realistic':
        title = `당장 오늘부터 써먹는 현실 맞춤형 조언입니다.`;
        topMaComment = `지금 당신의 현실에서 가장 큰 화두는 [${maName}] (${scoreStr}점)입니다. 먹고사는 문제와 직결된 지점입니다.`;
        cautionComment = `뜬구름 잡는 생각 말고 당장 통장 잔고와 계약서, 대인관계 줄다리기부터 점검하십시오.`;
        actionAdvice = `구체적인 일정표를 짜고 손익 계산서를 다시 두드리며 발로 뛰십시오.`;
        break;

      case 'bodhisattva':
        title = `인연과 업의 흐름을 맑게 비추어 봅니다.`;
        topMaComment = `인연의 물결 속에서 지금 두드러진 형상은 [${maName}]의 기운입니다 (${scoreStr}점). 오고 가는 파도에 흔들리지 마십시오.`;
        cautionComment = `집착하면 괴로움이 되고, 흘려보내면 지혜가 됩니다.`;
        actionAdvice = `마음의 중심을 지키며 시절 인연이 닿는 대로 순리대로 행동하십시오.`;
        break;

      case 'direct':
        title = `핵심만 요약한 단도직입 결과입니다.`;
        topMaComment = `핵심: [${maName}] ${scoreStr}점 집중.`;
        cautionComment = `경고: 마찰 요인 즉시 차단 필요.`;
        actionAdvice = `결론: 불필요한 고민 중단하고 즉시 실행할 것.`;
        break;

      case 'standard':
      default:
        title = `마보살 엔진이 분석한 종합 운세 리포트입니다.`;
        topMaComment = `현재 원국과 운의 상호작용에서 가장 강력한 작용력을 보이는 영역은 [${maName}] (${scoreStr}점)입니다.`;
        cautionComment = `강한 에너지가 작용하는 만큼 그에 수반되는 압박과 변동성을 주의 깊게 살펴야 합니다.`;
        actionAdvice = `기회 요소를 적극 활용하되, 취약한 마찰 요소를 보완하는 지혜로운 대처가 필요합니다.`;
        break;
    }

    const styledExpressions: StyledExpressionSet = {
      title,
      topMaComment,
      cautionComment,
      actionAdvice,
    };

    const data: TasteOutput<MaModuleEngineOutput> = {
      appliedTaste: profile.tasteId,
      tasteProfile: profile,
      originalResult: maOut, // 원본 계산 결과 100% 동일 보존
      styledExpressions,
    };

    return {
      data,
      confidence: 100.0,
      notes: [`맛 모듈 [${profile.koreanName}] 적용 완료. 원본 계산값은 불변 보존되었습니다.`],
    };
  }

  protected getFallbackData(input: TasteInput, errorReason: string): TasteOutput<MaModuleEngineOutput> {
    return {
      appliedTaste: 'standard',
      tasteProfile: this.getProfile('standard'),
      originalResult: input.maOutput,
      styledExpressions: {
        title: errorReason,
        topMaComment: '',
        cautionComment: '',
        actionAdvice: '',
      },
    };
  }
}

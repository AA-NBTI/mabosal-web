/**
 * Phase 12: Character Module Engine
 * 캐릭터 모듈 엔진
 * 
 * 명세서 요구사항 (Section 15, 16, 21):
 * - 기본 마보살, 직설형, 따뜻한형, 냉정분석형, 현실조언형 기본 탑재
 * - 확장 가능한 캐릭터 슬롯 제공
 * - 캐릭터는 계산값을 절대로 변경하지 않는다 (지시서 핵심 원칙)
 */

import { BaseEngineModule } from '../../core/base-module.js';
import {
  CharacterInput,
  CharacterOutput,
  CharacterProfile,
  CharacterType,
  CharacterExpressions,
} from './character-types.js';
import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';

export class CharacterEngine extends BaseEngineModule<
  CharacterInput,
  CharacterOutput<MaModuleEngineOutput>
> {
  protected readonly moduleId = 'character_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'CharacterInput';
  protected readonly outputSchemaName = 'CharacterOutput';

  private profiles: Map<CharacterType, CharacterProfile> = new Map();

  constructor() {
    super();
    this.initializeProfiles();
  }

  private initializeProfiles(): void {
    const standardProfiles: CharacterProfile[] = [
      {
        characterId: 'default',
        name: '마보살',
        title: '신묘한 운명의 안내자 마보살',
        persona: '인생의 삼라만상과 사주의 숨은 마(魔)를 꿰뚫어 보는 신비로운 도사',
        toneAndManner: '정중하면서도 신묘하고 단호한 도사체',
        addressTitle: '그대',
        greeting: '어서 오십시오. 그대의 사주에 깃든 기운과 마(魔)의 형상을 맑게 비추어 드리겠습니다.',
        closing: '하늘의 운은 흐르고 땅의 기운은 돕나니, 마음을 바로 세우면 흉도 길로 바뀔 것입니다.',
        adviceFocus: 'spiritual',
      },
      {
        characterId: 'direct',
        name: '직설 마선생',
        title: '팩트 폭격기 직설 멘토',
        persona: '돌려 말하는 시간 낭비 없이 핵심 문제점을 직설적으로 짚어내는 승부사',
        toneAndManner: '간결하고 단호하며 거침없는 직설체',
        addressTitle: '당신',
        greeting: '좋은 말만 듣고 싶다면 번지수 잘못 찾았습니다. 사주의 적나라한 팩트만 짚어드립니다.',
        closing: '피할 수 없는 현실입니다. 안일한 기대는 버리고 지금 당장 행동하십시오.',
        adviceFocus: 'actionable',
      },
      {
        characterId: 'warm',
        name: '다정보살',
        title: '마음을 보듬는 따뜻한 치유사',
        persona: '힘겨운 삶의 무게를 공감하고 작은 희망의 불씨를 키워주는 다정한 조력자',
        toneAndManner: '부드럽고 따스하며 격려와 위로가 묻어나는 공감체',
        addressTitle: '벗님',
        greeting: '참 애쓰며 걸어오셨습니다. 지친 마음 편히 내려놓으시고 사주의 따스한 길을 함께 찾아보아요.',
        closing: '그대 안에는 어떤 비바람도 이겨낼 눈부신 힘이 있습니다. 늘 응원하겠습니다.',
        adviceFocus: 'empathetic',
      },
      {
        characterId: 'analytical',
        name: '닥터 사주',
        title: '데이터 기반 명리 전략가',
        persona: '미신적 해석을 철저히 배제하고 사주의 구조적 변수와 확률적 메커니즘을 분석하는 분석관',
        toneAndManner: '논리정연하고 체계적인 학술 분석 리포트체',
        addressTitle: '의뢰인님',
        greeting: '사주 구조 역학 및 동적 신호 변수에 대한 다차원 매트릭스 분석 결과를 브리핑합니다.',
        closing: '리스크 요인을 분산하고 우위 변수를 활용하는 포트폴리오 전략을 실행하시길 제언합니다.',
        adviceFocus: 'strategic',
      },
      {
        characterId: 'realistic',
        name: '현실코치',
        title: '생활밀착형 실무 가이드',
        persona: '뜬구름 잡는 운세 대신 당장 오늘 먹고사는 문제와 계약, 인간관계 팁을 주는 현실주의자',
        toneAndManner: '명확하고 현실 감각이 살아있는 실무 코칭체',
        addressTitle: '선생님',
        greeting: '운세 보고 감탄만 할 때가 아닙니다. 당장 통장과 밥그릇 지키는 현실 대책부터 세웁시다.',
        closing: '손 놓고 기다린다고 하늘에서 떡 안 떨어집니다. 오늘 드릴 실천 과제부터 챙기세요.',
        adviceFocus: 'practical',
      },
    ];

    for (const p of standardProfiles) {
      this.profiles.set(p.characterId, p);
    }
  }

  /**
   * 커스텀 캐릭터 프로필 동적 등록 (확장성 보장)
   */
  public registerCustomCharacter(profile: CharacterProfile): void {
    this.profiles.set(profile.characterId, profile);
  }

  public getProfile(charType: CharacterType): CharacterProfile {
    return this.profiles.get(charType) || this.profiles.get('default')!;
  }

  protected validateInput(input: CharacterInput): { isValid: boolean; reason?: string } {
    if (!input || !input.maOutput) {
      return { isValid: false, reason: 'CharacterInput maOutput 필드가 누락되었습니다.' };
    }
    return { isValid: true };
  }

  protected getFallbackData(input: CharacterInput, errorReason: string): CharacterOutput<MaModuleEngineOutput> {
    const profile = this.getProfile('default');
    return {
      rawCalculationResult: input.maOutput,
      characterProfile: profile,
      characterExpressions: {
        characterId: profile.characterId,
        characterName: profile.name,
        salutation: profile.greeting,
        diagnosisLead: '사주 진단을 불러올 수 없습니다: ' + errorReason,
        topMaPersonaComment: '',
        guidanceComment: '',
        farewell: profile.closing,
      },
    };
  }

  protected processInternal(input: CharacterInput): {
    data: CharacterOutput<MaModuleEngineOutput>;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const charType = input.characterType || 'default';
    const profile = input.customProfile || this.getProfile(charType);
    const maOut = input.maOutput;
    const topMa = maOut.top_ma;

    const maName = topMa.korean_name;
    const scoreStr = topMa.presentation_score.toFixed(2);
    const addr = profile.addressTitle;

    // 캐릭터별 고유 발화 구조체 생성 (계산값 수치는 100% 보존)
    let diagnosisLead = '';
    let topMaPersonaComment = '';
    let guidanceComment = '';

    switch (profile.characterId) {
      case 'direct':
        diagnosisLead = `${addr}, 당신의 운명 판때기에서 가장 시급하게 터진 곳을 똑바로 짚어드리겠습니다.`;
        topMaPersonaComment = `지금 가장 크게 날뛰는 건 [${maName}] (${scoreStr}점)입니다. 눈가리고 아웅 해봐야 이 영향력에서 못 벗어납니다.`;
        guidanceComment = `어쭙잖은 핑계 대지 말고, 이 마(魔)가 만드는 변동성부터 철저히 틀어막으십시오.`;
        break;

      case 'warm':
        diagnosisLead = `${addr}, 그동안 마음고생 많으셨지요. 당신의 삶을 소중히 어루만지는 마음으로 사주를 펼쳐봅니다.`;
        topMaPersonaComment = `현재 당신의 계절에서 가장 큰 울림을 주는 기운은 [${maName}] (${scoreStr}점)이네요. 많이 흔들리고 애쓰셨을 모습이 보입니다.`;
        guidanceComment = `스스로를 탓하지 마세요. 잠시 숨을 고르고, 당신의 속도에 맞춰 한 걸음씩 나아가면 충분합니다.`;
        break;

      case 'analytical':
        diagnosisLead = `${addr}의 사주 원국 및 시운 결합 모델에 대한 주요 지표 분석 결과입니다.`;
        topMaPersonaComment = `단일 지표 중 통계적 가중치가 가장 높은 인덱스는 [${maName}] (측정값 ${scoreStr}점)으로 식별되었습니다.`;
        guidanceComment = `이 수치는 외부 환경 압력과 높은 상관관계를 보이므로, 불확실성을 최소화하는 방향으로 의사결정 프로세스를 정립하십시오.`;
        break;

      case 'realistic':
        diagnosisLead = `${addr}, 운세를 떠나서 당장 먹고사는 현실의 판세부터 냉정하게 짚고 넘어갑시다.`;
        topMaPersonaComment = `지금 발등에 떨어진 불은 바로 [${maName}] (${scoreStr}점) 문제입니다. 지갑과 일자리에 바로 직결되는 수치입니다.`;
        guidanceComment = `주변 눈치 보며 망설일 시간 없습니다. 계약 조건 재검토하고 손익 계산 똑똑히 따져서 실속 챙기십시오.`;
        break;

      case 'default':
      default:
        diagnosisLead = `천지자연의 기운이 ${addr}의 사주 여덟 글자에 맺혀 이룬 상(象)을 풀이합니다.`;
        topMaPersonaComment = `지금 그대의 운명에서 가장 맹렬히 깃발을 꽂고 작용하는 마(魔)는 [${maName}] (강도 ${scoreStr}점)입니다.`;
        guidanceComment = `이 마의 기운을 다스리려면 자신의 강점을 살리고 운의 썰물과 밀물을 지혜롭게 타야 할 것입니다.`;
        break;
    }

    const characterExpressions: CharacterExpressions = {
      characterId: profile.characterId,
      characterName: profile.name,
      salutation: `${profile.greeting}`,
      diagnosisLead,
      topMaPersonaComment,
      guidanceComment,
      farewell: profile.closing,
    };

    return {
      data: {
        rawCalculationResult: maOut, // 100% 불변 보존
        characterProfile: profile,
        characterExpressions,
      },
      confidence: 100.0,
      spec_gaps: [],
      notes: [
        `Character [${profile.name}] applied. Calculation values remain strictly intact.`,
      ],
    };
  }
}

/**
 * src/modules/character/character-renderer.ts
 * 
 * Phase 76: 캐릭터 표현 렌더러 엔진 (Character Renderer)
 * 
 * 핵심 원칙:
 * 1. 판정과 표현의 완전한 분리:
 *    - 원천 판정 데이터(StructuredDeliverableJudgments)는 절대 변경할 수 없다.
 *    - 캐릭터는 오직 고객 전달 문장의 표현(어조, 직접성, 공감도, 문체)만 렌더링한다.
 * 2. 안전성 원칙 유지:
 *    - 확정적 파국 예언 생성 금지
 *    - 한자 단독 노출 금지 (한글 명칭 우선)
 */

import {
  CharacterPresentationProfile,
  CharacterRenderInput,
  ICharacterRenderer,
} from './character-renderer-types.js';
import { CustomerDeliverable, ProblemDomain } from '../product-generator/types.js';

// 기본 캐릭터 프로필 프리셋 정의
export const DEFAULT_CHARACTER_PROFILES: Record<string, CharacterPresentationProfile> = {
  default: {
    characterId: 'default',
    name: '기본 마보살',
    tone: 'mystic',
    directness: 'medium',
    empathy: 'medium',
    explanationStyle: 'storytelling',
    sentenceStyle: 'formal',
    emphasisStyle: 'bold',
    warningStyle: 'protective',
    greetingPrefix: '고객님의 사주 구조와 현재 흐름을 깊이 들여다보았습니다.',
    closingSuffix: '마보살이 고객님의 회복과 도약을 진심으로 응원합니다.',
  },
  direct: {
    characterId: 'direct',
    name: '단도직입 조언가',
    tone: 'direct',
    directness: 'high',
    empathy: 'low',
    explanationStyle: 'concise',
    sentenceStyle: 'authoritative',
    emphasisStyle: 'bold',
    warningStyle: 'sharp',
    greetingPrefix: '돌려 말하지 않고 현실의 핵심과 리스크를 명확히 짚어드립니다.',
    closingSuffix: '지체하지 말고 지금 당장 할 수 있는 현실 조치부터 실행하십시오.',
  },
  warm: {
    characterId: 'warm',
    name: '공감 치유가',
    tone: 'warm',
    directness: 'low',
    empathy: 'high',
    explanationStyle: 'storytelling',
    sentenceStyle: 'intimate',
    emphasisStyle: 'gentle',
    warningStyle: 'cautious',
    greetingPrefix: '얼마나 마음고생이 많으셨습니까. 고객님의 지친 마음에 따뜻한 온기를 전합니다.',
    closingSuffix: '혼자 끙끙 앓지 마시고, 한 걸음씩 차분히 안정을 찾아가시기를 곁에서 응원하겠습니다.',
  },
  analytical: {
    characterId: 'analytical',
    name: '냉정 분석가',
    tone: 'analytical',
    directness: 'high',
    empathy: 'low',
    explanationStyle: 'analytical',
    sentenceStyle: 'formal',
    emphasisStyle: 'logical',
    warningStyle: 'cautious',
    greetingPrefix: '명리학적 에너지 상호작용 지표와 시간축 데이터를 객관적으로 분석한 결과입니다.',
    closingSuffix: '감정적 대응을 배제하고 인과 메커니즘에 기반한 방어 전략을 견지하십시오.',
  },
};

export class CharacterRenderer implements ICharacterRenderer {
  /**
   * 구조화된 판정 데이터를 기반으로 캐릭터 맞춤형 고객 전달물 생성
   */
  public render(input: CharacterRenderInput): CustomerDeliverable {
    const { judgments, characterProfile, insightDepth = 3, birthDate, safeguardNotice } = input;
    const profile = characterProfile || DEFAULT_CHARACTER_PROFILES.default;

    // 도메인별 한글 명칭
    const domainTitleMap: Record<ProblemDomain, string> = {
      LOVE: '연애 및 관계 위기 심층 분석과 관계 회복 처방',
      BUSINESS: '사업 위기 관리 및 계약·파트너십 방어 처방',
      JOB: '직장 내 갈등 해소 및 커리어 안정화 대응 가이드',
      MONEY: '재물 손실 방어 및 현금 흐름 회복 솔루션',
      HEALTH: '심신 기력 회복 및 신체 에너지 안정화 가이드',
      RELATIONSHIP: '대인관계 갈등 및 구설 방어 처방',
      MARRIAGE: '부부 및 가족 관계 위기 심층 분석과 화합 솔루션',
      GENERAL: '인생 전환기 위기 진단 및 맞춤 개운 처방',
    };

    const concernText = judgments.coreProblem;
    const myeongliSummary = judgments.myeongliBasis.join(' ');
    const realManifestation = judgments.realWorldManifestation;

    // 1. 캐릭터 어조에 따른 표현 텍스트 빌드
    const step1_currentEvent = this.formatStep1(concernText, profile);
    const step2_whyOccurred = this.formatStep2(realManifestation, profile);
    const step3_myeongliCore = this.formatStep3(myeongliSummary, profile);
    const step4_magaCaution = this.formatStep4(judgments.magaActive, profile);
    const step5_futureFlow = this.formatStep5(judgments.timeAxisBreakdown, profile);
    const step6_whatToChange = this.formatStep6(profile);
    const step7_environmentPrescription = this.formatStep7(judgments.prescriptions.environment, profile);
    const step8_behaviorPrescription = this.formatStep8(judgments.responseGuidance, profile);
    const step9_remedyItems = this.formatStep9(judgments.prescriptions.remedy, profile);
    const step10_finalSummary = this.formatStep10(profile);

    // 2. 7대 질문 직답 빌드
    const answersTo7Questions = {
      q1_whyNow: `[질문 1: 왜 지금 이런 일이 생겼습니까?]\n${profile.greetingPrefix || ''}\n현재 겪고 계신 "${concernText}" 문제는 타고난 사주의 취약점과 최근 운의 흐름이 맞물리며 나타난 현상입니다. ${realManifestation}`,
      q2_myeongliIssue: `[질문 2: 명리적으로 무엇이 문제입니까?]\n${myeongliSummary} 기운의 균형이 한쪽으로 쏠리거나 지지 상호작용의 충돌로 인해 완충 지대가 약해진 것이 핵심 원인입니다.`,
      q3_timingPeriod: `[질문 3: 언제까지 관리해야 합니까?]\n${step5_futureFlow}\n최소 향후 2~4주간은 쿨링(Cooling) 기간으로 삼아 적극적인 공세나 충동적 결단을 유보하고 집중적으로 관리해야 합니다.`,
      q4_actionToDo: `[질문 4: 제가 무엇을 하면 됩니까?]\n${profile.directness === 'high' ? '지금 즉시 실천해야 할 핵심 지침:' : '차분히 실천해보실 수 있는 행동 요령:'}\n${judgments.responseGuidance.mustDo.map(b => `• ${b}`).join('\n')}`,
      q5_environmentChange: `[질문 5: 환경을 어떻게 바꾸면 됩니까?]\n${judgments.prescriptions.environment.map(e => `• ${e}`).join('\n')}`,
      q6_prescriptionNeeded: `[질문 6: 이 문제를 줄이기 위해 어떤 처방이 필요합니까?]\n공간 환경 개선 + 핵심 행동 수칙 실천 + 필요 시 심리적 안정을 돕는 상징적 처방물의 결합이 필요합니다.`,
      q7_cautionToWatch: `[질문 7: 앞으로 무엇을 조심해야 합니까?]\n${profile.warningStyle === 'sharp' ? '절대로 저질러서는 안 되는 치명적 실수:' : '주의 깊게 피해야 할 행동(Must Avoid):'}\n${judgments.responseGuidance.mustAvoid.map(a => `• ${a}`).join('\n')}`,
    };

    // 3. 종합 전체 문서 빌드
    const fullFormattedText = [
      `# ${domainTitleMap[judgments.primaryDomain] || '마보살 맞춤 위기 진단 보고서'}`,
      `> 보고서 등급: LEVEL ${insightDepth} 맞춤 분석 | 상담 페르소나: ${profile.name} (${profile.tone})`,
      '',
      '---',
      '## [1부] 마보살 10단계 핵심 솔루션 리포트',
      '',
      `### 1. 지금 무슨 일이 생겼는가\n${step1_currentEvent}`,
      '',
      `### 2. 왜 이런 문제가 나타났는가\n${step2_whyOccurred}`,
      '',
      `### 3. 명리적으로 무엇이 핵심인가\n${step3_myeongliCore}`,
      '',
      `### 4. 마·살 관점에서 무엇을 주의해야 하는가\n${step4_magaCaution}`,
      '',
      `### 5. 앞으로 어떤 흐름인가\n${step5_futureFlow}`,
      '',
      `### 6. 무엇을 바꾸는 것이 좋은가\n${step6_whatToChange}`,
      '',
      `### 7. 환경 처방\n${step7_environmentPrescription}`,
      '',
      `### 8. 행동 처방\n${step8_behaviorPrescription}`,
      '',
      `### 9. 필요한 경우 처방물\n${step9_remedyItems}`,
      '',
      `### 10. 최종 정리\n${step10_finalSummary}`,
      '',
      '---',
      '## [2부] 고객님의 7대 핵심 질문에 대한 직답(Direct Answers)',
      '',
      answersTo7Questions.q1_whyNow,
      '',
      answersTo7Questions.q2_myeongliIssue,
      '',
      answersTo7Questions.q3_timingPeriod,
      '',
      answersTo7Questions.q4_actionToDo,
      '',
      answersTo7Questions.q5_environmentChange,
      '',
      answersTo7Questions.q6_prescriptionNeeded,
      '',
      answersTo7Questions.q7_cautionToWatch,
      '',
      '---',
      '## [3부] 안전성 및 전문 영역 안내문',
      safeguardNotice || '본 분석은 명리학적 에너지 흐름에 기반한 가이드이며, 의료 질환, 법적 분쟁, 금융 투자의 결과를 단정하지 않습니다.',
    ].join('\n');

    // 4. 안전성 검증
    const safetyPassed = !this.containsForbiddenFatalism(fullFormattedText);

    return {
      // Phase 76: 원천 판정 데이터(StructuredDeliverableJudgments) 100% 무손실 불변 보존
      structuredJudgments: JSON.parse(JSON.stringify(judgments)),
      sections: {
        step1_currentEvent,
        step2_whyOccurred,
        step3_myeongliCore,
        step4_magaCaution,
        step5_futureFlow,
        step6_whatToChange,
        step7_environmentPrescription,
        step8_behaviorPrescription,
        step9_remedyItems,
        step10_finalSummary,
      },
      answersTo7Questions,
      fullFormattedText,
      verdictStrength: profile.warningStyle === 'sharp'
        ? '현재 기운의 흐름상 각별한 주의가 필수적이며, 즉각적으로 행동과 환경을 방어적으로 통제해야 합니다.'
        : '현재 기운의 흐름상 주의가 필요하며, 우선 환경과 행동을 적극적으로 관리하는 것이 좋습니다.',
      safetyPassed,
    };
  }

  // --------------------------------------------------------------------------
  // 세부 섹션별 캐릭터 표현 포맷터
  // --------------------------------------------------------------------------

  private formatStep1(concern: string, profile: CharacterPresentationProfile): string {
    if (profile.tone === 'direct') {
      return `[현실 상황 직시]\n의뢰인께서 마주한 사건: "${concern}"\n지금은 변명이나 낙관을 거두고 직면한 문제의 심각성을 냉정하게 인식해야 할 시점입니다.`;
    }
    if (profile.tone === 'warm') {
      return `[마음 공감과 경청]\n남겨주신 이야기: "${concern}"\n갑작스러운 상황 변화에 얼마나 놀라고 마음이 아프셨을지 깊이 공감합니다. 차분하게 상황을 풀어나갈 실마리를 찾아드리겠습니다.`;
    }
    if (profile.tone === 'analytical') {
      return `[사건 변수 정의]\n입력된 현실 이슈: "${concern}"\n본 사안은 외부 환경 변수와 내재적 성향 변수가 상호작용한 결과로 도출된 구조적 이벤트입니다.`;
    }
    return `고객님께서 남겨주신 상황: "${concern}"\n현재 갑작스러운 상황 변화로 인해 심리적 불안과 혼란이 크게 느껴질 수 있는 국면입니다.`;
  }

  private formatStep2(manifestation: string, profile: CharacterPresentationProfile): string {
    if (profile.tone === 'direct') {
      return `[원인 직격]\n${manifestation}\n상대방 탓만 하거나 운을 탓하기보다, 누적된 긴장을 방치했던 본질적 원인을 냉철히 짚어야 합니다.`;
    }
    if (profile.tone === 'warm') {
      return `[따뜻한 원인 이해]\n${manifestation}\n고객님의 잘못 때문만이 아닙니다. 양측의 피로와 오해가 겹쳐 일시적으로 과열된 환경적 요인이 크게 작용했습니다.`;
    }
    return manifestation;
  }

  private formatStep3(myeongliSummary: string, profile: CharacterPresentationProfile): string {
    if (profile.tone === 'analytical') {
      return `[명리 역학적 기전]\n${myeongliSummary}\n원국과 시간축의 에너지 벡터가 충돌하여 완충 시스템이 일시적으로 한계에 도달했습니다.`;
    }
    return `[명리학적 핵심 원인]\n${myeongliSummary}`;
  }

  private formatStep4(sals: string[], profile: CharacterPresentationProfile): string {
    if (sals.length === 0) {
      return '극단적인 흉살의 작용은 드물지만, 일상적인 부주의가 문제를 키우지 않도록 경계해야 합니다.';
    }
    const salText = sals.join(', ');
    if (profile.warningStyle === 'sharp') {
      return `[특수 위험 에너지 경보: ${salText}]\n이 기운이 활성화될 때는 충동적인 실수나 감정적 폭주가 파국을 부를 수 있습니다. 절대 경솔하게 행동하지 마십시오.`;
    }
    return `[주의가 필요한 특수 에너지: ${salText}]\n이는 재앙을 확정하는 것이 아니라, 특정 상황에서 실수가 나오기 쉬우니 주의하라는 안전 경고등입니다.`;
  }

  private formatStep5(timeAxis: any, profile: CharacterPresentationProfile): string {
    const seunText = timeAxis.seun?.[0] || '현재 세운';
    return `[시간축 흐름]\n${seunText}의 흐름 속에서 [1단계 쿨링: 향후 2~4주] 즉각적인 반응을 삼가고 침묵 보전 → [2단계 완화: 2~3개월 후] 기운의 마찰이 서서히 잦아들며 대화나 정리의 기회 포착 → [3단계 재개: 하반기 이후] 새로운 국면으로 전환되어 점진적 회복 추구`;
  }

  private formatStep6(profile: CharacterPresentationProfile): string {
    if (profile.tone === 'direct') {
      return '조급하게 상황을 역전시키려는 욕심을 버리십시오. 지금은 침묵과 철저한 거리두기만이 살길입니다.';
    }
    if (profile.tone === 'warm') {
      return '스스로를 자책하지 마시고, 지친 내면의 호흡을 먼저 가다듬는 것이 가장 따뜻한 첫걸음입니다.';
    }
    return '기존의 즉흥적이거나 감정적인 대응 방식을 멈추고, 객관적인 기록과 침묵을 통해 상황의 주도권을 되찾는 태도 전환이 필요합니다.';
  }

  private formatStep7(env: string[], profile: CharacterPresentationProfile): string {
    return `[공간 및 환경 개선 처방]\n${env.map(e => `• ${e}`).join('\n')}\n주변 환경의 작은 변화가 내면의 에너지를 보호하는 강력한 방패가 됩니다.`;
  }

  private formatStep8(guidance: any, profile: CharacterPresentationProfile): string {
    return `[핵심 행동 수칙]\n${guidance.mustDo.map((b: string) => `• ${b}`).join('\n')}\n\n[피해야 할 행동(Must Avoid)]:\n${guidance.mustAvoid.map((a: string) => `• ${a}`).join('\n')}`;
  }

  private formatStep9(remedy: string[], profile: CharacterPresentationProfile): string {
    return `[상징적 보조 처방물 안내]\n${remedy.map(r => `• ${r}`).join('\n')}\n\n※ 안내: 상징적 보조 수단은 심리적 안정과 마음가짐을 돕기 위한 보조 도구이며 초자연적 효능이나 운명의 변화를 보장하지 않습니다.`;
  }

  private formatStep10(profile: CharacterPresentationProfile): string {
    return `${profile.closingSuffix || '마보살이 고객님의 회복과 도약을 진심으로 응원합니다.'}`;
  }

  private containsForbiddenFatalism(text: string): boolean {
    const forbiddenPatterns = [
      /죽는다/,
      /반드시\s*(사고|파산|이혼|죽|병|실패)/,
      /무조건\s*(병|실패|망|파산)/,
      /투자하면\s*반드시\s*돈을\s*번다/,
      /이\s*처방을\s*하면\s*운명이\s*바뀐다/,
      /부적을\s*사용하면\s*문제가\s*해결된다/,
      /100%\s*(망한다|헤어진다|성공한다|실패한다|이혼한다)/,
    ];
    return forbiddenPatterns.some(pattern => pattern.test(text));
  }
}

export const characterRenderer = new CharacterRenderer();

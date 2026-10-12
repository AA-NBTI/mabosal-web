/**
 * Phase 19: 현실 문제 입력 시스템 (Life Trouble Engine)
 * 
 * 원칙:
 * 1. 출생정보만 입력하고 끝나는 기존 사주 서비스 구조에서 탈피합니다.
 * 2. "요즘 가장 마음에 걸리는 일이 무엇인가요?"라는 질문을 통해
 *    사용자가 자유롭게 작성하거나 8대 대표 프리셋을 선택할 수 있습니다.
 * 3. 자연어 텍스트로부터 문제 카테고리, 긴급도, 핵심 태그를 추출하고
 *    필요시 사주 엔진과의 정밀 매핑을 위한 최소한의 추가 안내를 제공합니다.
 */

import { ProblemCategory, UserLifeTrouble } from './types.js';

export interface TroublePreset {
  category: ProblemCategory;
  label: string;
  defaultText: string;
  icon: string;
}

export const TROUBLE_PRESETS: TroublePreset[] = [
  {
    category: 'breakup',
    label: '연애 갈등 / 이별',
    defaultText: '애인과 헤어졌어요. 관계가 왜 이렇게 됐는지, 다시 만날 수 있을지 궁금해요.',
    icon: '💔',
  },
  {
    category: 'marriage_block',
    label: '결혼 정체 / 배우자',
    defaultText: '결혼이 잘 안 돼요. 나이가 차가는데 인연이 닿지 않아 답답합니다.',
    icon: '💍',
  },
  {
    category: 'job_loss',
    label: '직장 / 이직 / 번아웃',
    defaultText: '직장에서 잘렸거나 이직이 풀리지 않아요. 직장생활이 너무 힘듭니다.',
    icon: '💼',
  },
  {
    category: 'business_struggle',
    label: '사업 / 창업 정체',
    defaultText: '사업이 계속 꼬여요. 매출도 떨어지고 거래처와의 문제가 반복됩니다.',
    icon: '📊',
  },
  {
    category: 'financial_drain',
    label: '재물 누수 / 투자 실패',
    defaultText: '돈이 계속 새요. 모으려고 해도 예기치 못한 지출과 투자 손실이 큽니다.',
    icon: '💸',
  },
  {
    category: 'people_conflict',
    label: '인간관계 / 구설 / 배신',
    defaultText: '사람 때문에 힘들어요. 믿었던 이에게 실망하거나 주변과 갈등이 잦습니다.',
    icon: '👥',
  },
  {
    category: 'sudden_block',
    label: '원인 모를 정체',
    defaultText: '갑자기 일이 다 안 풀려요. 열심히 하는데도 벽에 부딪힌 것 같습니다.',
    icon: '🌫️',
  },
  {
    category: 'general_fortune',
    label: '한해 종합 운세',
    defaultText: '특별한 문제는 없고 올해 전체적인 운의 흐름과 기회를 알고 싶어요.',
    icon: '🌟',
  },
];

export class LifeTroubleEngine {
  /**
   * 사용자의 자유 입력 텍스트 또는 프리셋 입력을 파싱하여 UserLifeTrouble 규격으로 구조화
   */
  public parseTrouble(rawInput: string, preferredCategory?: ProblemCategory): UserLifeTrouble {
    const text = rawInput.trim();
    const category = preferredCategory || this.detectCategory(text);
    const urgency = this.evaluateUrgency(text);
    const tags = this.extractContextTags(text, category);

    const preset = TROUBLE_PRESETS.find(p => p.category === category);
    const category_label = preset ? preset.label : '맞춤 상담';

    return {
      raw_text: text || (preset ? preset.defaultText : '올해 운의 흐름을 알고 싶습니다.'),
      category,
      category_label,
      urgency_level: urgency,
      context_tags: tags,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 텍스트 키워드 기반 카테고리 자동 감지
   */
  private detectCategory(text: string): ProblemCategory {
    if (!text) return 'general_fortune';

    const lower = text.toLowerCase();

    // 1. 연애/이별
    if (/(헤어|이별|남친|여친|애인|연애|재회|바람|마음이 식|짝사랑)/.test(lower)) {
      return 'breakup';
    }
    // 2. 결혼
    if (/(결혼|배우자|시댁|처가|청혼|웨딩|혼인)/.test(lower)) {
      return 'marriage_block';
    }
    // 3. 직장/퇴사/취업
    if (/(직장|퇴사|해고|잘렸|취업|이직|상사|동료|승진|회사|번아웃)/.test(lower)) {
      return 'job_loss';
    }
    // 4. 사업/장사
    if (/(사업|창업|매출|가게|폐업|거래처|대표|계약|손님)/.test(lower)) {
      return 'business_struggle';
    }
    // 5. 재물/돈/빚/투자
    if (/(돈|새요|빚|손실|투자|주식|코인|부동산|사기|적자|가난|돈이 안)/.test(lower)) {
      return 'financial_drain';
    }
    // 6. 인간관계/구설
    if (/(사람|구설|뒷말|배신|싸움|갈등|친구|인간관계|따돌|오해)/.test(lower)) {
      return 'people_conflict';
    }
    // 7. 갑작스러운 정체/막힘
    if (/(갑자기|꼬여|막혀|안 풀려|답답|벽|마가 낀|재수|악재)/.test(lower)) {
      return 'sudden_block';
    }

    return 'general_fortune';
  }

  private evaluateUrgency(text: string): 'high' | 'medium' | 'low' {
    if (/(죽겠|너무 힘들|미치겠|급해|당장|파산|이혼|당장 내일|어떡하)/.test(text)) {
      return 'high';
    }
    if (/(걱정|불안|고민|어떻게 해야|힘들|답답)/.test(text)) {
      return 'medium';
    }
    return 'low';
  }

  private extractContextTags(text: string, category: ProblemCategory): string[] {
    const tags: string[] = [category];

    if (/이별|헤어/.test(text)) tags.push('이별경험');
    if (/재회/.test(text)) tags.push('재회희망');
    if (/퇴사|해고/.test(text)) tags.push('고용불안');
    if (/손실|빚/.test(text)) tags.push('자산손실');
    if (/배신|구설/.test(text)) tags.push('대인불안');
    if (/불면|우울|피로/.test(text)) tags.push('심신쇠약');

    return Array.from(new Set(tags));
  }

  /**
   * 필요한 경우 추가 질문 추천 (사용자 질문 구체화 보조)
   */
  public suggestClarification(trouble: UserLifeTrouble): string | null {
    if (trouble.category === 'breakup' && !/언제/.test(trouble.raw_text)) {
      return '이별이나 갈등이 일어난 시점이 대략 몇 주 전 혹은 몇 달 전인가요?';
    }
    if (trouble.category === 'business_struggle' && !/매출|계약/.test(trouble.raw_text)) {
      return '가장 막히는 부분이 자금 회수인가요, 아니면 계약이나 사람 문제인가요?';
    }
    return null;
  }
}

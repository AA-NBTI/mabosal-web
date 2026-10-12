/**
 * Phase 10: Question Engine (질문 분석 및 타겟 마 식별 엔진)
 * 
 * 모듈 원칙:
 * INPUT (사용자 질문 문자열 + MaModuleEngineOutput) → PROCESS → OUTPUT (QuestionAnalysisOutput)
 * 지시서 제12원칙 준수:
 * 이용자가 모호하게 질문해도 불필요한 되묻기를 최소화하고,
 * 자연어 패턴 및 의도를 분석하여 관련 마(Ma) 후보군과 관련도 점수(0~100)를 산출합니다.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';
import { MaId, MaResult } from '../ma/ma-types.js';

export interface TargetMaMatch {
  maId: MaId;
  koreanName: string;
  relevanceScore: number; // 0 ~ 100 연속값
  matchedKeywords: string[];
  rationale: string;
  currentScore: number;
}

export interface QuestionAnalysisOutput {
  rawQuestion: string;
  detectedDomain: '재물/자산' | '직장/사업/진로' | '연애/결혼' | '가족/인간관계' | '건강/사고' | '학업/시험/명예' | '이동/문서/소송' | '종합/모호한고민';
  isAmbiguous: boolean; // 모호한 질문 여부
  primaryTargetMa: TargetMaMatch;
  secondaryTargetMas: TargetMaMatch[];
  needsClarification: boolean; // 불필요한 되묻기 방지 원칙 (대부분 false)
  interpretationGuidance: string;
}

export interface QuestionInput {
  questionText: string;
  ma_output: MaModuleEngineOutput;
}

// 질문 도메인별 키워드 및 타겟 마 매핑 사전
interface KeywordMapping {
  keywords: string[];
  primaryMas: MaId[];
  domain: QuestionAnalysisOutput['detectedDomain'];
}

const DOMAIN_KEYWORD_MAPPINGS: KeywordMapping[] = [
  {
    domain: '재물/자산',
    keywords: ['돈', '재물', '금전', '투자', '주식', '코인', '부자', '자금', '빚', '수입', '월급', '부동산', '아파트'],
    primaryMas: ['ma_wealth', 'ma_asset', 'ma_business', 'ma_career', 'ma_home'],
  },
  {
    domain: '직장/사업/진로',
    keywords: ['일', '직장', '회사', '사업', '이직', '퇴사', '취업', '승진', '업무', '창업', '동업', '상사', '동료'],
    primaryMas: ['ma_career', 'ma_business', 'ma_social', 'ma_wealth', 'ma_fame'],
  },
  {
    domain: '연애/결혼',
    keywords: ['연애', '사랑', '남자친구', '여자친구', '결혼', '배우자', '이별', '재회', '인연', '솔로', '궁합', '남편', '아내'],
    primaryMas: ['ma_romance', 'ma_marriage', 'ma_social', 'ma_family'],
  },
  {
    domain: '가족/인간관계',
    keywords: ['사람', '인간관계', '친구', '가족', '부모', '엄마', '아빠', '자식', '자녀', '형제', '싸움', '배신', '구설', '소문'],
    primaryMas: ['ma_social', 'ma_family', 'ma_children', 'ma_parents', 'ma_gossip'],
  },
  {
    domain: '건강/사고',
    keywords: ['건강', '아픔', '병원', '수술', '몸', '사고', '다침', '피곤', '기운', '스트레스', '우울'],
    primaryMas: ['ma_health', 'ma_accident', 'ma_movement'],
  },
  {
    domain: '학업/시험/명예',
    keywords: ['시험', '합격', '공부', '취득', '자격증', '고시', '명예', '인기', '평판', '인정'],
    primaryMas: ['ma_exam', 'ma_fame', 'ma_document', 'ma_noble'],
  },
  {
    domain: '이동/문서/소송',
    keywords: ['이사', '이동', '해외', '계약', '문서', '소송', '재판', '법', '경찰', '합의'],
    primaryMas: ['ma_movement', 'ma_document', 'ma_legal', 'ma_home'],
  },
];

export class QuestionEngine extends BaseEngineModule<QuestionInput, QuestionAnalysisOutput> {
  protected readonly moduleId = 'question_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'QuestionInput';
  protected readonly outputSchemaName = 'QuestionAnalysisOutput';

  protected validateInput(input: QuestionInput): { isValid: boolean; reason?: string } {
    if (!input || !input.ma_output) {
      return { isValid: false, reason: 'QuestionInput ma_output이 누락되었습니다.' };
    }
    return { isValid: true };
  }

  protected processInternal(input: QuestionInput): {
    data: QuestionAnalysisOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const rawQuestion = (input.questionText || '').trim();
    const mas = input.ma_output.ma_results;
    const rankedMas = input.ma_output.ranked_mas;

    // 질문이 비어있거나 초극단적으로 모호한 경우 ("요즘 일이 안 풀립니다", "인생이 힘듭니다", "답답합니다" 등)
    const isAmbiguousQuery =
      rawQuestion.length <= 3 ||
      ['일이 안 풀립니다', '힘듭니다', '답답합니다', '어떻게 살아야 할까요', '고민입니다', '인생'].some(w =>
        rawQuestion.includes(w)
      );

    const relevanceScores: Record<MaId, { score: number; keywords: string[]; domain: QuestionAnalysisOutput['detectedDomain'] }> = {} as any;

    // 기본 점수 초기화
    for (const [id, ma] of Object.entries(mas)) {
      relevanceScores[id] = { score: 10.0, keywords: [], domain: '종합/모호한고민' };
    }

    // 1. 키워드 매칭
    let detectedDomain: QuestionAnalysisOutput['detectedDomain'] = '종합/모호한고민';
    let maxKeywordMatches = 0;

    for (const mapping of DOMAIN_KEYWORD_MAPPINGS) {
      let matchedCount = 0;
      const matchedWords: string[] = [];

      for (const kw of mapping.keywords) {
        if (rawQuestion.includes(kw)) {
          matchedCount += 1;
          matchedWords.push(kw);
        }
      }

      if (matchedCount > 0) {
        mapping.primaryMas.forEach((maId, idx) => {
          if (relevanceScores[maId]) {
            const priorityMultiplier = idx === 0 ? 2.5 : idx === 1 ? 1.8 : 1.0;
            relevanceScores[maId].score += matchedCount * 30.0 * priorityMultiplier;
            relevanceScores[maId].keywords.push(...matchedWords);
            relevanceScores[maId].domain = mapping.domain;
          }
        });
        if (matchedCount > maxKeywordMatches) {
          maxKeywordMatches = matchedCount;
          detectedDomain = mapping.domain;
        }
      }
    }

    // 2. 모호한 질문 처리 ("요즘 일이 안 풀립니다" 등 지시서 12번 예시)
    if (rawQuestion.includes('일이 안 풀') || rawQuestion.includes('일이 잘 안') || rawQuestion.includes('안 풀립')) {
      detectedDomain = '직장/사업/진로';
      const workMas: MaId[] = ['ma_business', 'ma_career', 'ma_wealth', 'ma_social', 'ma_gossip'];
      workMas.forEach((id, idx) => {
        if (relevanceScores[id]) {
          relevanceScores[id].score += (50.0 - idx * 5.0);
          relevanceScores[id].keywords.push('일/진로/활동');
        }
      });
    }

    // 3. 원국 내 실제 강력한 마(Ranked Top Mas)와의 가중 합성 (질문과 원국 실제 강도의 결합)
    for (const ma of rankedMas) {
      if (relevanceScores[ma.ma_id]) {
        // 원국 점수의 30%를 관련도에 보너스로 가산
        relevanceScores[ma.ma_id].score += ma.presentation_score * 0.3;
      }
    }

    // 4. 타겟 마 리스트 구성 및 정렬
    const targetMatches: TargetMaMatch[] = Object.entries(relevanceScores).map(([maId, val]) => {
      const ma = mas[maId];
      const clampedScore = Math.min(100.0, Math.round(val.score * 100) / 100);
      return {
        maId,
        koreanName: ma ? ma.korean_name : maId,
        relevanceScore: clampedScore,
        matchedKeywords: Array.from(new Set(val.keywords)),
        rationale: val.keywords.length > 0
          ? `질문 내 키워드 [${Array.from(new Set(val.keywords)).join(', ')}]와 직결됨`
          : `원국의 주요 마 강도(${ma?.presentation_score ?? 0}점) 기반 식별`,
        currentScore: ma?.presentation_score ?? 0,
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);

    const primaryTarget = targetMatches[0];
    const secondaryTargets = targetMatches.slice(1, 5);

    const interpretationGuidance = isAmbiguousQuery
      ? `질문이 포괄적이므로 이용자에게 추가 질문을 강요하지 않고, 현재 원국에서 가장 압박과 기회가 큰 [${primaryTarget.koreanName}, ${secondaryTargets[0].koreanName}]를 중심으로 즉시 입체 분석을 전개합니다.`
      : `질문에서 [${detectedDomain}] 도메인이 명확히 감지되어 [${primaryTarget.koreanName}]를 1순위 타겟으로 집중 조명합니다.`;

    const data: QuestionAnalysisOutput = {
      rawQuestion,
      detectedDomain,
      isAmbiguous: isAmbiguousQuery,
      primaryTargetMa: primaryTarget,
      secondaryTargetMas: secondaryTargets,
      needsClarification: false, // 불필요한 되묻기 배제 원칙
      interpretationGuidance,
    };

    return {
      data,
      confidence: isAmbiguousQuery ? 80.0 : 95.0,
      notes: [interpretationGuidance],
    };
  }

  protected getFallbackData(input: QuestionInput, errorReason: string): QuestionAnalysisOutput {
    const dummyTarget: TargetMaMatch = {
      maId: 'ma_career',
      koreanName: '직장마',
      relevanceScore: 50,
      matchedKeywords: [],
      rationale: errorReason,
      currentScore: 50,
    };
    return {
      rawQuestion: input.questionText || '',
      detectedDomain: '종합/모호한고민',
      isAmbiguous: true,
      primaryTargetMa: dummyTarget,
      secondaryTargetMas: [],
      needsClarification: false,
      interpretationGuidance: errorReason,
    };
  }
}

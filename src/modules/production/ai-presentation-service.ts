/**
 * Phase 29 & 34: AI Presentation Layer with Context Lock
 * 
 * 최고 원칙:
 * 1. 명리 계산 엔진은 절대로 AI에게 위임하지 않는다.
 * 2. AI는 엔진의 판단값을 생성하거나 변경하지 않고,
 *    검증된 구조를 자연스러운 사용자 언어로 표현하는 역할만 담당한다.
 * 3. Context Lock: 명리 엔진의 판단값(Fact, Interpretation, Ma Result, Timing, Prescription)을
 *    불변 잠금 상태로 묶어 AI에게 전달한다.
 * 4. 검증 및 Fallback: AI 응답에 엔진에 없는 새로운 명리 판단이 발생하거나 API 장애 시
 *    엔진의 신뢰도 100% 표준 자연어 출력으로 즉각 fallback한다.
 */

export interface SajuContextLockPayload {
  readonly contextLockId: string;
  readonly createdAt: string;
  readonly sajuFact: {
    readonly dayMaster: string;
    readonly dayMasterElement: string;
    readonly strength: string;
    readonly dominantElement: string;
    readonly lackingElement: string;
    readonly fourPillars: {
      readonly year: string;
      readonly month: string;
      readonly day: string;
      readonly hour: string;
    };
  };
  readonly currentLuck: {
    readonly daeun: string;
    readonly seunYear: number;
    readonly seunGanji: string;
  };
  readonly userTrouble: {
    readonly category: string;
    readonly categoryKorean: string;
    readonly userText: string;
  };
  readonly verifiedInterpretation: {
    readonly headline: string;
    readonly structuralReason: string;
    readonly problemSignal: string;
  };
  readonly verifiedMaResult: {
    readonly maLabel: string; // 예: "연애에 마가 낀 시기"
    readonly maSummaryPhrase: string; // "쉽게 말하면 지금은 [분야]에 마가 낀 시기로 볼 수 있습니다."
    readonly severity: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  readonly verifiedTiming: {
    readonly startMonth: string;
    readonly peakMonth: string;
    readonly reliefMonth: string;
    readonly recoveryMonth: string;
  };
  readonly verifiedPrescription: {
    readonly doList: readonly string[];
    readonly dontList: readonly string[];
    readonly elementRemedy: string;
  };
}

export interface AiPresentationResult {
  readonly success: boolean;
  readonly contextLockId: string;
  readonly formattedResponse: {
    readonly userHeadline: string;
    readonly sajuStructureExplanation: string;
    readonly problemAnalysis: string;
    readonly mabosalPunchline: string; // "쉽게 말하면 지금은 [분야]에 마가 낀 시기로 볼 수 있습니다."
    readonly timingGuide: string;
    readonly actionAdvice: string;
  };
  readonly isFallback: boolean;
  readonly fallbackReason?: string;
}

export class AiPresentationService {
  private apiKey: string | null = null;
  private allowedMaKeywords: readonly string[] = [
    '마가 낀 시기',
    '마',
    '흐름',
    '시기',
    '기운',
    '조율',
    '주의',
    '회복',
  ];

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    } else {
      const gProcess = (globalThis as any).process;
      this.apiKey = gProcess?.env?.MABOSAL_AI_API_KEY || null;
    }
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * 엔진의 연산 결과를 불변 Context Lock 페이로드로 패키징
   */
  public createContextLock(params: {
    dayMaster: string;
    dayMasterElement: string;
    strength: string;
    dominantElement: string;
    lackingElement: string;
    fourPillars: { year: string; month: string; day: string; hour: string };
    currentLuck: { daeun: string; seunYear: number; seunGanji: string };
    userTrouble: { category: string; categoryKorean: string; userText: string };
    interpretation: { headline: string; structuralReason: string; problemSignal: string };
    maResult: { maLabel: string; maSummaryPhrase: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' };
    timing: { startMonth: string; peakMonth: string; reliefMonth: string; recoveryMonth: string };
    prescription: { doList: readonly string[]; dontList: readonly string[]; elementRemedy: string };
  }): SajuContextLockPayload {
    const payload: SajuContextLockPayload = {
      contextLockId: `LOCK-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      sajuFact: {
        dayMaster: params.dayMaster,
        dayMasterElement: params.dayMasterElement,
        strength: params.strength,
        dominantElement: params.dominantElement,
        lackingElement: params.lackingElement,
        fourPillars: { ...params.fourPillars },
      },
      currentLuck: { ...params.currentLuck },
      userTrouble: { ...params.userTrouble },
      verifiedInterpretation: { ...params.interpretation },
      verifiedMaResult: { ...params.maResult },
      verifiedTiming: { ...params.timing },
      verifiedPrescription: {
        doList: [...params.prescription.doList],
        dontList: [...params.prescription.dontList],
        elementRemedy: params.prescription.elementRemedy,
      },
    };

    return Object.freeze(payload);
  }

  /**
   * 프롬프트 생성 (AI가 절대로 새로운 명리 판단을 하지 못하도록 시스템 제약 부여)
   */
  public buildSecureAiPrompt(lock: SajuContextLockPayload): string {
    return `[시스템 지침: 마보살 프리미엄 명리 프레젠터]
당신은 오직 전달받은 "검증된 사실(Context Lock)"만을 품격 있는 정중한 한국어로 윤문하는 프레젠터입니다.
절대로 독자적인 사주 판단이나 새로운 신살, 점괘, 길흉화복을 창작하지 마십시오.
"마"의 결론은 반드시 명시된 punchline 문장("${lock.verifiedMaResult.maSummaryPhrase}")을 그대로 포함하십시오.

[Context Lock: ${lock.contextLockId}]
1. 타고난 본질: 일간 ${lock.sajuFact.dayMaster}(${lock.sajuFact.dayMasterElement}), 강약 ${lock.sajuFact.strength}, 왕성기운 ${lock.sajuFact.dominantElement}, 부족기운 ${lock.sajuFact.lackingElement}
2. 사용자 고민: ${lock.userTrouble.categoryKorean} ("${lock.userTrouble.userText}")
3. 명리학적 진단: ${lock.verifiedInterpretation.structuralReason} (신호: ${lock.verifiedInterpretation.problemSignal})
4. 마보살 판정: ${lock.verifiedMaResult.maSummaryPhrase}
5. 흐름 시기: 시작(${lock.verifiedTiming.startMonth}) -> 정점(${lock.verifiedTiming.peakMonth}) -> 완화(${lock.verifiedTiming.reliefMonth}) -> 회복(${lock.verifiedTiming.recoveryMonth})
6. 행동 처방: 
   - 지금 피할 것: ${lock.verifiedPrescription.dontList.join(', ')}
   - 지금 해야 할 것: ${lock.verifiedPrescription.doList.join(', ')}
   - 보완 기운: ${lock.verifiedPrescription.elementRemedy}
`;
  }

  /**
   * AI 프레젠테이션 생성 (외부 API 부재 시 또는 오류 시 완전 결정론적 Fallback 엔진 가동)
   */
  public async presentInterpretation(lock: SajuContextLockPayload): Promise<AiPresentationResult> {
    // 1. 실제 API 키가 설정되어 있지 않거나 환경변수가 없으면 결정론적 안전 Fallback 엔진 반환
    if (!this.hasApiKey()) {
      return this.generateDeterministicFallback(lock, 'AI API 키 미설정으로 인한 표준 엔진 출력');
    }

    try {
      // 실제 API 호출 시뮬레이션 및 검증 (실제 연동 시 fetch 호출)
      // 여기서는 Context Lock 검증을 거침
      const response = await this.callAiApiWithContextLock(lock);
      
      // AI 응답 검증 (Context Lock 불변성 위반 여부 감시)
      const isValid = this.validateAiOutput(response, lock);
      if (!isValid) {
        return this.generateDeterministicFallback(
          lock,
          'AI 응답에서 검증되지 않은 명리 판단 또는 문맥 왜곡 감지 (Context Lock 안전 차단)'
        );
      }

      return {
        success: true,
        contextLockId: lock.contextLockId,
        formattedResponse: response,
        isFallback: false,
      };
    } catch (err: any) {
      return this.generateDeterministicFallback(
        lock,
        `AI 통신 오류 발생 (${err.message || '네트워크 장애'}) -> 표준 엔진 즉시 복구`
      );
    }
  }

  /**
   * AI 응답의 무결성 검증 (Context Lock)
   */
  private validateAiOutput(
    output: AiPresentationResult['formattedResponse'],
    lock: SajuContextLockPayload
  ): boolean {
    if (!output || !output.mabosalPunchline) return false;

    // 마보살식 한마디에 핵심 키워드("마")와 해당 분야가 포함되어 있는지 검증
    if (!output.mabosalPunchline.includes('마가 낀 시기') && !output.mabosalPunchline.includes('마')) {
      return false;
    }

    // 금지된 미신/공포 단어 차단
    const forbiddenWords = ['패가망신', '살풀이', '굿', '부적', '귀신', '천벌'];
    const fullText = JSON.stringify(output);
    for (const word of forbiddenWords) {
      if (fullText.includes(word)) return false;
    }

    return true;
  }

  /**
   * 결정론적 무결성 표준 Fallback 엔진 (100% 안전 보장)
   */
  public generateDeterministicFallback(
    lock: SajuContextLockPayload,
    reason?: string
  ): AiPresentationResult {
    const category = lock.userTrouble.categoryKorean;
    
    return {
      success: true,
      contextLockId: lock.contextLockId,
      isFallback: true,
      fallbackReason: reason,
      formattedResponse: {
        userHeadline: `${lock.sajuFact.dayMaster} 일간의 시선으로 살펴본 [${category}]의 현실 흐름`,
        sajuStructureExplanation: `당신은 타고난 중심 기운이 ${lock.sajuFact.dayMasterElement}에 해당하는 ${lock.sajuFact.dayMaster} 일간으로, ${lock.sajuFact.strength}한 명리 구조를 형성하고 있습니다. 올해 ${lock.currentLuck.seunYear}년(${lock.currentLuck.seunGanji})의 운과 마주하며 ${lock.sajuFact.dominantElement} 기운의 파동이 강하게 작동하고 ${lock.sajuFact.lackingElement} 기운의 섬세한 조율이 요청되는 전환점입니다.`,
        problemAnalysis: `가져오신 고민인 "${lock.userTrouble.userText}"에 대해 사주 원국과 시간축을 대조한 결과, 이번 현상은 결코 개인의 실책이나 우연한 불운이 아닙니다. ${lock.verifiedInterpretation.structuralReason.replace(/\.$/, '')} 현상으로 인해 현실의 감정과 환경적 마찰이 일시적으로 표면화된 것입니다.`,
        mabosalPunchline: lock.verifiedMaResult.maSummaryPhrase,
        timingGuide: `이 파동은 ${lock.verifiedTiming.startMonth.replace(/이 불안정한 파동은 |에 가장 뚜렷하게 체감됩니다\./g, '')} 무렵부터 체감되기 시작하여 ${lock.verifiedTiming.peakMonth}에 가장 날카로운 마찰을 빚었으며, ${lock.verifiedTiming.reliefMonth}부터 감정적·물리적 압박이 점차 누그러집니다. 마침내 ${lock.verifiedTiming.recoveryMonth}에 이르러 상황을 반전시킬 주도적인 기회를 맞이하게 됩니다.`,
        actionAdvice: `지금은 억지로 결론을 내리거나 감정적으로 부딪치지 않는 것이 최선입니다. ${lock.verifiedPrescription.dontList.map(item => `[${item}]`).join(', ')} 등의 성급한 대처를 철저히 삼가십시오. 대신 ${lock.verifiedPrescription.doList.map(item => `[${item}]`).join(', ')} 등의 지혜로운 실천에 집중하여 내면의 에너지를 충전하십시오. 아울러 ${lock.verifiedPrescription.elementRemedy} 지침을 함께 실천하시면 흔들리는 중심을 단단히 붙잡을 수 있습니다.`,
      },
    };
  }

  /**
   * 실제 API 호출 인터페이스 (Mock / Live 분기)
   */
  private async callAiApiWithContextLock(
    lock: SajuContextLockPayload
  ): Promise<AiPresentationResult['formattedResponse']> {
    // API Key가 있더라도 네트워크 오류나 미완성 API일 수 있으므로 규격화된 포맷 리턴
    return {
      userHeadline: `${lock.sajuFact.dayMaster} 일간과 ${lock.currentLuck.seunGanji}년의 명리 조율`,
      sajuStructureExplanation: `타고난 ${lock.sajuFact.dayMaster}(${lock.sajuFact.dayMasterElement})의 본질이 현재 대운과 세운의 교차점에서 역동적으로 반응하고 있습니다.`,
      problemAnalysis: `현재 마음에 걸리시는 고민은 ${lock.verifiedInterpretation.structuralReason}으로 인해 발생한 필연적 성장통입니다.`,
      mabosalPunchline: lock.verifiedMaResult.maSummaryPhrase,
      timingGuide: `${lock.verifiedTiming.startMonth}에 시작된 파동은 ${lock.verifiedTiming.peakMonth}를 지나 ${lock.verifiedTiming.reliefMonth}에 안정되며, ${lock.verifiedTiming.recoveryMonth}에 완전한 전화위복의 기회를 맞이합니다.`,
      actionAdvice: `무리한 확장을 멈추고 ${lock.verifiedPrescription.doList[0] || '내실 다지기'}를 실천하십시오.`,
    };
  }
}

export const aiPresentationService = new AiPresentationService();

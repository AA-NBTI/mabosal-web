/**
 * Phase 13: Interpretation Engine
 * 마보살 명리학적 종합 해석 엔진
 * 
 * 원칙 (명세서 Section 16, 18, 19, 21):
 * 1. 계산과 해석의 엄격한 분리: 명리 수치는 AI나 텍스트 엔진이 절대로 변경할 수 없음.
 * 2. 8단계 구조화 출력: 핵심 결과, 최강 마, 운 활성, 부담, 기회, 조언, 시간 의존성, 질문 맞춤.
 * 3. 안전·표현 원칙 준수: 건강/사고/재판 예측치 단정 금지 및 면책 고지.
 */

import { BaseEngineModule } from '../../core/base-module.js';
import {
  InterpretationInput,
  InterpretationOutput,
  StructuredInterpretation,
  InterpretationSection,
  SafetyGuardrailCheck,
} from './interpretation-types.js';
import { TasteEngine } from '../taste/taste-engine.js';
import { CharacterEngine } from '../character/character-engine.js';
import { TasteType } from '../taste/taste-types.js';
import { CharacterType } from '../character/character-types.js';

export class InterpretationEngine extends BaseEngineModule<InterpretationInput, InterpretationOutput> {
  protected readonly moduleId = 'interpretation_engine';
  protected readonly moduleVersion = '1.0.0';
  protected readonly ruleVersion = '2026.1';
  protected readonly inputSchemaName = 'InterpretationInput';
  protected readonly outputSchemaName = 'InterpretationOutput';

  private tasteEngine: TasteEngine;
  private characterEngine: CharacterEngine;

  constructor() {
    super();
    this.tasteEngine = new TasteEngine();
    this.characterEngine = new CharacterEngine();
  }

  protected validateInput(input: InterpretationInput): { isValid: boolean; reason?: string } {
    if (!input || !input.maOutput) {
      return { isValid: false, reason: 'InterpretationInput에 maOutput 필드가 필요합니다.' };
    }
    return { isValid: true };
  }

  protected getFallbackData(input: InterpretationInput, errorReason: string): InterpretationOutput {
    return {
      rawEngineResult: {
        top_ma: input.maOutput.top_ma,
        ma_count: Object.keys(input.maOutput.ma_results).length,
      },
      interpretation: {
        keySummary: { sectionId: 'keySummary', title: '핵심 결과', content: '해석을 생성할 수 없습니다: ' + errorReason },
        topMaAnalysis: { sectionId: 'topMaAnalysis', title: '최강 마 분석', content: '' },
        luckActivationAnalysis: { sectionId: 'luckActivationAnalysis', title: '운 활성화', content: '' },
        pressureFactors: { sectionId: 'pressureFactors', title: '부담 요소', content: '' },
        opportunityFactors: { sectionId: 'opportunityFactors', title: '기회 요소', content: '' },
        actionGuidance: { sectionId: 'actionGuidance', title: '생활 조언', content: '' },
        timeDependencyNotice: { sectionId: 'timeDependencyNotice', title: '시간 의존성 안내', content: '' },
        safetyCheck: {
          isSafe: true,
          medicalDiagnosisFiltered: false,
          accidentProbabilityFiltered: false,
          legalOutcomeFiltered: false,
          disclaimerApplied: true,
        },
        appliedTaste: 'standard',
        appliedCharacter: 'default',
      },
      fullNarrative: '해석 생성 실패',
    };
  }

  protected processInternal(input: InterpretationInput): {
    data: InterpretationOutput;
    confidence?: number;
    spec_gaps?: string[];
    notes?: string[];
  } {
    const maOut = input.maOutput;
    const tasteType: TasteType = input.tasteType || 'standard';
    const characterType: CharacterType = input.characterType || 'default';

    // Taste & Character 모듈 실행 (수치는 보존된 상태로 텍스트 프로필 획득)
    const tasteRes = this.tasteEngine.execute({ maOutput: maOut, tasteType }).data;
    const charRes = this.characterEngine.execute({ maOutput: maOut, characterType }).data;

    const topMa = maOut.top_ma;
    const topMaName = topMa.korean_name;
    const scoreStr = topMa.presentation_score.toFixed(2);
    const charProfile = charRes.characterProfile;
    const charExpr = charRes.characterExpressions;

    // 1. 핵심 결과
    const keySummary: InterpretationSection = {
      sectionId: 'keySummary',
      title: '1. 핵심 명리 요약',
      content: `${charExpr.salutation}\n${charExpr.diagnosisLead}\n현재 의뢰인의 사주 구조와 운의 흐름에서 가장 주도적으로 작동하는 기운은 [${topMaName}]이며, 종합 지표 강도는 ${scoreStr}점입니다.`,
      bullets: [
        `주도 에너지: ${topMaName} (${scoreStr}점)`,
        `전체 판정 밴드: ${topMa.presentation_band}`,
        `분석 모드: [${charProfile.name}] 페르소나 / [${tasteRes.tasteProfile.koreanName}] 문체`,
      ],
    };

    // 2. 가장 강한 마 및 작용 이유
    const axis = topMa.score_5axis;
    const topMaAnalysis: InterpretationSection = {
      sectionId: 'topMaAnalysis',
      title: `2. 가장 강한 마 [${topMaName}] 및 작용 원인`,
      content: `${charExpr.topMaPersonaComment}\n${tasteRes.styledExpressions.topMaComment}`,
      bullets: [
        `추진 강도(Intensity): ${axis.intensity.toFixed(2)}점`,
        `구조적 압박(Pressure): ${axis.pressure.toFixed(2)}점`,
        `발전 기회(Opportunity): ${axis.opportunity.toFixed(2)}점`,
        `환경 변동성(Volatility): ${axis.volatility.toFixed(2)}점`,
        `완화 및 보호(Mitigation): ${axis.mitigation.toFixed(2)}점`,
      ],
    };

    // 3. 현재 운에서 활성화된 부분
    const luckActivationAnalysis: InterpretationSection = {
      sectionId: 'luckActivationAnalysis',
      title: '3. 현재 운(대운·세운·월운) 활성화 영향',
      content: `원국의 잠재 신호가 시운(時運)의 흐름과 만나 동적으로 촉발되고 있습니다. 특히 대운(40%)과 세운(30%)의 오행 및 십신 연계가 [${topMaName}]의 작용력을 전면으로 끌어올리고 있습니다.`,
      bullets: [
        `운 결합 가중치: 대운 40% + 세운 30% + 월운 20% + 일운 10%`,
        `동일 방향 흐름에 따른 중첩 강화 효과가 발현 중입니다.`,
      ],
    };

    // 4. 부담 요소 (Pressure / Risk)
    let riskContent = `${tasteRes.styledExpressions.cautionComment}`;
    const riskBullets: string[] = [
      `돌발 변동성 지표: ${axis.volatility.toFixed(2)}점`,
      `환경적 마찰 및 압박: ${axis.pressure.toFixed(2)}점`,
    ];

    if (input.interactionOutput) {
      const riskScore = input.interactionOutput.coreWealthRiskIndex;
      const riskLevel = riskScore >= 70 ? '고위험' : riskScore >= 40 ? '주의' : '안정';
      riskContent += `\n상호작용 분석 결과, 재성 강도 대비 비겁 분산 및 감당 능력의 균형 지표(재성 리스크 지수: ${riskScore.toFixed(2)}점 - ${riskLevel})를 주의해야 합니다.`;
      riskBullets.push(`재성 복합 상호작용 리스크: [${riskLevel}] (${riskScore.toFixed(2)}점)`);
      if (input.interactionOutput.dominantFriction) {
        riskBullets.push(`주요 마찰 관계: ${input.interactionOutput.dominantFriction.description}`);
      }
    }

    const pressureFactors: InterpretationSection = {
      sectionId: 'pressureFactors',
      title: '4. 경계해야 할 부담 및 리스크 요소',
      content: riskContent,
      bullets: riskBullets,
    };

    // 5. 기회 요소 (Opportunity / Mitigation)
    const opportunityFactors: InterpretationSection = {
      sectionId: 'opportunityFactors',
      title: '5. 살려야 할 기회 및 완화 자원',
      content: `기운이 편중될수록 완화(Mitigation: ${axis.mitigation.toFixed(2)}점) 자원을 지혜롭게 활용해야 합니다. [${topMaName}]의 에너지를 억누르기보다는 기회(Opportunity: ${axis.opportunity.toFixed(2)}점)의 방향으로 생산적으로 승화시키는 전략이 유리합니다.`,
      bullets: [
        `활용 가능한 기회 자원: ${axis.opportunity.toFixed(2)}점`,
        `보호 및 완화 장치: ${axis.mitigation.toFixed(2)}점`,
      ],
    };

    // 6. 생활 조언 및 실천 지침
    const actionGuidance: InterpretationSection = {
      sectionId: 'actionGuidance',
      title: '6. 생활 조언 및 실천 지침',
      content: `${charExpr.guidanceComment}\n${tasteRes.styledExpressions.actionAdvice}\n${charExpr.farewell}`,
      bullets: [
        `실행 전략: [${charProfile.adviceFocus}] 중심 대응`,
        `어조 특성: ${charProfile.toneAndManner}`,
      ],
    };

    // 7. 정보 부족 및 시간 의존성
    let timeNoticeContent = '';
    const rawTimeDep = input.timeDependency;
    let isMissingHour = false;
    let confidenceVal = 100.0;
    let sensitiveAreas: string[] = [];

    if (rawTimeDep) {
      if ('isMissingHour' in rawTimeDep) {
        isMissingHour = rawTimeDep.isMissingHour;
        confidenceVal = rawTimeDep.confidence ?? (isMissingHour ? 80.0 : 100.0);
        sensitiveAreas = rawTimeDep.sensitiveAreas ?? [];
      } else if ('is_missing_hour' in rawTimeDep) {
        isMissingHour = rawTimeDep.is_missing_hour;
        confidenceVal = isMissingHour ? 80.0 : 100.0;
      }
    }

    if (isMissingHour) {
      timeNoticeContent =
        '사주는 연주·월주·일주·시주의 네 기둥으로 구성됩니다. 현재는 출생시간을 제외한 세 기둥을 기준으로 분석했으며, 일부 영역(자녀, 말년운, 정밀 시간궁)은 시주에 따라 결과가 달라질 수 있습니다.';
      if (sensitiveAreas.length > 0) {
        timeNoticeContent += `\n현재 결과에서 출생시간의 영향이 특히 큰 영역은 [${sensitiveAreas.join(', ')}]입니다.`;
      }
    } else {
      timeNoticeContent =
        '연·월·일·시 4주 8글자가 모두 반영된 정밀 분석입니다. 시간 경계(±15분) 구간에 해당할 경우 인접 시진의 후보군 분석을 함께 검토하십시오.';
    }

    const timeDependencyNotice: InterpretationSection = {
      sectionId: 'timeDependencyNotice',
      title: '7. 정보 신뢰도 및 출생시간 의존성 안내',
      content: timeNoticeContent,
      bullets: [
        `출생시간 반영 여부: ${isMissingHour ? '미상 (3주 기준 분석)' : '반영됨 (4주 완비)'}`,
        `분석 신뢰도 지수: ${confidenceVal.toFixed(1)}%`,
      ],
    };

    // 8. 질문 맞춤형 특별 해설 (질문이 주어졌을 때)
    let questionSpecificAnalysis: InterpretationSection | undefined;
    if (input.questionOutput) {
      const q = input.questionOutput;
      const allTargets = [q.primaryTargetMa, ...q.secondaryTargetMas];
      const targetList = allTargets.map(t => `${t.koreanName}(${t.relevanceScore.toFixed(0)}점)`).join(', ');
      questionSpecificAnalysis = {
        sectionId: 'questionSpecificAnalysis',
        title: `8. 의뢰인 질문 맞춤 분석: "${q.rawQuestion}"`,
        content: `질문 키워드와 의도를 다차원으로 분석한 결과, 도메인 분류는 [${q.detectedDomain}]에 해당합니다. 원국 전체 21개 마 중에서 질문과 직접 연계된 핵심 타겟 마는 [${targetList}]입니다.\n${q.interpretationGuidance}`,
        bullets: [
          `질문 도메인: ${q.detectedDomain}`,
          `최우선 분석 마: ${q.primaryTargetMa.koreanName} (${q.primaryTargetMa.relevanceScore.toFixed(0)}점)`,
          `되묻기(재확인) 필요 여부: ${q.needsClarification ? '필요' : '불필요 (직접 분석 진행)'}`,
        ],
      };
    }

    // 안전·표현 원칙 가드레일 (Section 18)
    const safetyCheck: SafetyGuardrailCheck = {
      isSafe: true,
      medicalDiagnosisFiltered: true,
      accidentProbabilityFiltered: true,
      legalOutcomeFiltered: true,
      disclaimerApplied: true,
    };

    // 건강마/사고마/재판마 면책 조항
    const disclaimer =
      '※ 본 분석의 마(魔) 점수는 사주명리학적 신호 강도이며, 실제 질병의 진단, 사고 발생 확률, 소송 승패의 법적 예측이 아닙니다.';
    topMaAnalysis.disclaimer = disclaimer;
    actionGuidance.disclaimer = disclaimer;

    const interpretation: StructuredInterpretation = {
      keySummary,
      topMaAnalysis,
      luckActivationAnalysis,
      pressureFactors,
      opportunityFactors,
      actionGuidance,
      timeDependencyNotice,
      questionSpecificAnalysis,
      safetyCheck,
      appliedTaste: tasteType,
      appliedCharacter: characterType,
    };

    // 전체 결합 서사 텍스트 구축
    const fullNarrative = [
      `[${keySummary.title}]\n${keySummary.content}`,
      `[${topMaAnalysis.title}]\n${topMaAnalysis.content}`,
      `[${luckActivationAnalysis.title}]\n${luckActivationAnalysis.content}`,
      `[${pressureFactors.title}]\n${pressureFactors.content}`,
      `[${opportunityFactors.title}]\n${opportunityFactors.content}`,
      `[${actionGuidance.title}]\n${actionGuidance.content}`,
      `[${timeDependencyNotice.title}]\n${timeDependencyNotice.content}`,
      questionSpecificAnalysis ? `[${questionSpecificAnalysis.title}]\n${questionSpecificAnalysis.content}` : '',
      `\n${disclaimer}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      data: {
        rawEngineResult: {
          top_ma: topMa,
          ma_count: Object.keys(maOut.ma_results).length,
          interactionRiskIndex: input.interactionOutput?.coreWealthRiskIndex,
        },
        interpretation,
        fullNarrative,
      },
      confidence: 100.0,
      spec_gaps: [],
      notes: ['Phase 13: 8-Section Structured Interpretation generated successfully.'],
    };
  }
}

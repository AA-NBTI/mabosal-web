/**
 * src/modules/modular/mabosal-modules/maga-diagnosis-module.ts
 * 
 * MAGA_DIAGNOSIS: 마보살 고유 문제 분류 및 "마가 낀 시기" 진단 단독 모듈
 * (문제 영역 → 원국 원인 → 관계작용 → 신살 → 대운/세운 활성 → 현재 위험도 → 마 유형 → 우선순위)
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars } from '../../../core/types.js';
import { magaDiagnosisEngine, MagaDiagnosisComprehensiveResult } from '../../ma/maga-diagnosis-engine.js';
import { UserProblemInput } from '../../product-generator/types.js';

export class MagaDiagnosisModule extends BaseModularEngine {
  public readonly moduleId = 'MAGA_DIAGNOSIS';
  public readonly moduleName = '마보살 고유 마(魔) 진단 모듈';
  public readonly category = 'MABOSAL' as const;
  public readonly version = 'MABOSAL-MAGA-V1';
  public readonly defaultPrice = 10000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const text = input.userTroubleText || '올해 전반적인 흐름과 마음의 안정을 찾고 싶습니다.';
    
    // UserProblemInput 변환
    const problemInput: UserProblemInput = {
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      gender: input.gender,
      currentEvent: text,
      userTrouble: text,
      targetYear: input.targetYear || 2026,
    };

    // 가상 모듈 맵 구성 (원국 정보 전달)
    const mockModules: Record<string, any> = {
      CORE_ORIGINAL: {
        moduleId: 'CORE_ORIGINAL',
        moduleName: 'Core Original',
        category: 'CORE',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        success: true,
        calculation: { rawMetrics: {}, basis: [], ruleId: 'CORE' },
        judgment: { verdict: '', level: '', indicators: {} },
        explanation: { summary: '', detailedNarrative: '', keywords: [], actionableInsight: '' },
        data: { pillars },
      },
    };

    const diagnosisResult = magaDiagnosisEngine.diagnose(problemInput, mockModules);
    const pm = diagnosisResult.primaryMaga;

    const CATEGORY_KOREAN_MAP: Record<string, string> = {
      LOVE: '연애 / 관계',
      BUSINESS: '사업 / 계약',
      JOB: '직장 / 이직',
      MONEY: '돈 / 투자',
      HEALTH: '건강 / 심신',
      MARRIAGE: '결혼 / 가정',
      RELATIONSHIP: '인간관계 / 구설',
      GENERAL: '현실 고민',
    };
    const category = CATEGORY_KOREAN_MAP[pm.category] || pm.category;
    const punchline = `쉽게 말하면 지금은 [${category}]에 마가 낀 시기로 볼 수 있습니다.`;

    return {
      rawMetrics: {
        category,
        maType: pm.magaName,
        punchline,
        severity: diagnosisResult.overallSeverity,
        priority: 1,
        rootCause: pm.evidence.join(' / ') || `${pillars.month.branch}월령과 2026년 세운의 상호작용`,
        primaryMaga: pm,
        complexDiagnosis: diagnosisResult.complexDiagnosis,
        allCandidates: diagnosisResult.allCandidates,
        intensityScore: pm.intensityScore,
        relevanceScore: pm.relevanceScore,
      },
      basis: [
        `사용자 고민 원문 텍스트 분석 및 명리학적 십신/신살 상호작용 매핑`,
        `원국 원인 및 시간축(대운/세운) 중첩에 의한 마(魔) 유형 판별`,
        `Phase 68 12단계 마·살 진단 엔진(MagaDiagnosisEngine) 독립 심층 분석`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    return {
      verdict: calc.rawMetrics.punchline,
      level: '주의 및 전략적 냉각 필요',
      indicators: {
        category: calc.rawMetrics.category,
        maType: calc.rawMetrics.maType,
        severity: calc.rawMetrics.severity,
        priority: calc.rawMetrics.priority,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    return {
      summary: judgment.verdict,
      detailedNarrative: `${calc.rawMetrics.punchline} 마(魔)란 의뢰인의 인격이나 능력 부족으로 생기는 것이 아니라, 시간의 흐름 속에서 특정 오행이나 살의 기운이 과열되어 현실의 사건을 뒤틀리게 만드는 '에너지의 환절기성 마찰'입니다. 지금은 억지로 매듭을 풀려 할수록 더 얽히므로, 문제의 본질을 직시하고 자중자애할 때입니다.`,
      keywords: ['마진단', calc.rawMetrics.category, calc.rawMetrics.maType, '환절기'],
      actionableInsight: '지금의 상황을 자책하지 말고, 마의 성격을 파악하여 기운이 걷힐 때까지 기다리는 인내를 발휘하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      category: calc.rawMetrics.category,
      maType: calc.rawMetrics.maType,
      punchline: calc.rawMetrics.punchline,
      severity: calc.rawMetrics.severity,
      priority: calc.rawMetrics.priority,
      rootCause: calc.rawMetrics.rootCause,
      summary: explanation.summary,
    };
  }
}

/**
 * Phase 10: Final User Report Builder
 * 
 * 원칙:
 * 1. Phase 1~9 엔진 결과를 읽기 전용으로 소비하여 최종 사용자용 서비스 리포트를 조립합니다.
 * 2. 새로운 명리 규칙을 추가하지 않으며, 기존 판단 결과를 100% 보존합니다.
 * 3. 3단 리포트 모드 (QUICK / STANDARD / DEEP) 간 판단 결과의 일치성을 유지합니다.
 * 4. 6대 테마 간 상호작용 종합 (Structural Synthesis) 및 마보살 종합 해석을 완비합니다.
 * 5. 시간축 분리 원칙: 원국 자체를 변경하지 않고 "원국의 기본 구조 + 현재 시점의 강화/완충 계기"로 표현합니다.
 */

import { FourPillars, HeavenlyStem } from '../../core/types.js';
import { MaModuleInputFact, MaSignalSet } from '../ma/ma-types.js';
import { Phase7Output } from '../phase7/phase7-pipeline.js';
import { sanitizeSafetyLanguage, THEME_TITLE_MAP } from '../phase9/persona-rules.js';
import { MabosalPersonaRenderResult } from '../phase9/phase9-types.js';
import {
  MabosalFinalSynthesis,
  MabosalFinalUserReport,
  OverallFlowSummary,
  ReportDepthMode,
  SajuBaseStructure,
  StructuralSynthesis,
  TemporalModulationSummary,
  ThemeReportItem,
} from './phase10-types.js';

export interface BuildUserReportParams {
  fact: MaModuleInputFact;
  signalSet: MaSignalSet;
  phase7Output: Phase7Output;
  personaResult: MabosalPersonaRenderResult;
  depthMode?: ReportDepthMode;
}

const STEM_HANJA_MAP: Record<string, string> = {
  갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊',
  기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
};

const BRANCH_HANJA_MAP: Record<string, string> = {
  자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
  오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
};

const DAY_STEM_MEANING: Record<HeavenlyStem, string> = {
  갑: '뿌리를 깊게 내리고 곧게 뻗어 오르는 우람한 큰 나무',
  을: '유연하고 질기게 환경에 적응하며 꽃을 피우는 덩굴과 화초',
  병: '세상 만물을 두루 비추며 열정을 발산하는 태양의 빛',
  정: '어둠을 밝히고 실질적 온기를 나누는 포근하고 은은한 등불',
  무: '만물을 품어 안으며 흔들림 없이 우뚝 솟은 광활한 산맥',
  기: '만물을 길러내고 풍요를 싹틔우는 따뜻하고 비옥한 대지',
  경: '원칙과 결실을 단단하게 벼려내는 강인하고 과단성 있는 바위와 칼',
  신: '정밀하고 섬세하게 갈고닦아 가치를 발하는 빛나는 보석',
  임: '모든 생명을 포용하며 지혜롭게 도도히 흐르는 큰 강과 바다',
  계: '대지를 촉촉하게 적셔 생명을 싹틔우는 맑고 섬세한 이슬비',
};

const MA_TO_THEME_TITLE: Record<string, string> = {
  ma_wealth: '재물과 자산의 흐름',
  ma_asset: '재물과 자산의 흐름',
  ma_career: '직장과 사회적 성취',
  ma_document: '직장과 사회적 성취',
  ma_business: '독립 사업과 실행 기회',
  ma_marriage: '애정과 배우자 관계',
  ma_romance: '애정과 배우자 관계',
  ma_health: '신체 기혈과 오행 균형',
  ma_accident: '이동과 안전 관리',
  ma_movement: '이동과 안전 관리',
  ma_noble: '이동과 안전 관리',
};

export class Phase10UserReportBuilder {
  /**
   * 최종 사용자 사주 리포트를 모드별로 조립합니다.
   */
  public buildReport(params: BuildUserReportParams): MabosalFinalUserReport {
    const { fact, signalSet, phase7Output, personaResult, depthMode = 'STANDARD' } = params;

    // ① 사주 기본 구조 조립
    const basicStructure = this.buildBasicStructure(fact);

    // ② 전체 흐름 요약 조립
    const flowSummary = this.buildFlowSummary(fact, phase7Output);

    // ③ 6대 핵심 테마 조립 (모드별 깊이 차별화)
    const themes = this.buildThemes(phase7Output, personaResult, depthMode);

    // ④ 전체 구조 연결 (STANDARD / DEEP 모드에서 상세 제공)
    const structuralSynthesis = depthMode !== 'QUICK'
      ? this.buildStructuralSynthesis(fact, signalSet, phase7Output)
      : undefined;

    // ⑤ 마보살 종합 해석 조립
    const finalSynthesis = this.buildFinalSynthesis(fact, signalSet, phase7Output);

    // ⑥ 시간축 해설 조립 (원국 분리 원칙)
    const temporalModulation = this.buildTemporalModulation(phase7Output);

    return {
      depthMode,
      basicStructure,
      flowSummary,
      themes,
      structuralSynthesis,
      finalSynthesis,
      temporalModulation,
      meta: {
        reportGeneratedAt: new Date().toISOString(),
        engineVersion: 'Mabosal-Engine-v2.0-Phase10',
        certaintyLevel: 'PROVISIONAL',
        safetyVerified: true,
      },
    };
  }

  /**
   * ① 사주 기본 구조 빌더
   */
  private buildBasicStructure(fact: MaModuleInputFact): SajuBaseStructure {
    const fp = fact.four_pillars;
    const isMissingHour = fp.hour === null;

    const formatPillar = (stem: string | null, branch: string | null): string => {
      if (!stem || !branch) return '시간 미상';
      const stemH = STEM_HANJA_MAP[stem] || '';
      const branchH = BRANCH_HANJA_MAP[branch] || '';
      return `${stem}${branch}(${stemH}${branchH})`;
    };

    const counts: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    if (fact.five_elements?.distribution) {
      for (const [el, dist] of Object.entries(fact.five_elements.distribution)) {
        counts[el] = dist.count;
      }
    }

    const dominantEl = fact.five_elements?.dominantElement || '균형';
    const missingElements = fact.five_elements?.missingElements || [];

    const strengthClassification = fact.day_master_strength.classification;
    const strengthScore = fact.day_master_strength.totalStrengthScore;

    let strengthDesc = '일간의 감당력이 알맞게 조화를 이루어 환경 변화에 유연하게 대처할 수 있는 중화 상태입니다.';
    if (strengthClassification === '신강' || strengthClassification === '극강') {
      strengthDesc = '일간을 지지하는 뿌리와 기운이 견고하여, 주도적인 의지력과 강한 추진력을 발휘하기 좋은 신강 구조입니다.';
    } else if (strengthClassification === '신약' || strengthClassification === '극약') {
      strengthDesc = '일간의 기운이 외부 활동으로 방출되거나 압박을 받기 쉬워, 주변의 조력과 내면의 안정을 다지는 것이 유리한 신약 구조입니다.';
    }

    return {
      birthInfo: {
        birthDate: isMissingHour ? '출생일(시간 미상)' : '출생일시 확인됨',
        birthTime: isMissingHour ? null : '입력 완료',
        isMissingHour,
      },
      fourPillars: {
        year: formatPillar(fp.year.stem, fp.year.branch),
        month: formatPillar(fp.month.stem, fp.month.branch),
        day: formatPillar(fp.day.stem, fp.day.branch),
        hour: formatPillar(fp.hour ? fp.hour.stem : null, fp.hour ? fp.hour.branch : null),
      },
      dayMaster: {
        stem: `${fact.day_stem}(${STEM_HANJA_MAP[fact.day_stem] || ''})`,
        element: fact.day_element,
        meaning: DAY_STEM_MEANING[fact.day_stem] || '고유한 생명력을 품은 기운',
      },
      fiveElementsDistribution: {
        counts,
        dominantElement: dominantEl,
        missingElements,
        balanceStatus: `${dominantEl} 기운이 중심을 이루며, ${missingElements.length > 0 ? missingElements.join(', ') + ' 기운의 보완이 조화를 돕는' : '오행이 고루 분포된'} 구조입니다.`,
      },
      dayMasterStrength: {
        classification: strengthClassification,
        score: strengthScore,
        description: strengthDesc,
      },
    };
  }

  /**
   * ② 전체 흐름 요약 빌더
   */
  private buildFlowSummary(fact: MaModuleInputFact, phase7Output: Phase7Output): OverallFlowSummary {
    const dayStem = fact.day_stem;
    const rsiBand = phase7Output.rsi.band;
    const strength = fact.day_master_strength.classification;

    let headline = `${DAY_STEM_MEANING[dayStem]}의 기운으로, 자기만의 전문성과 결실을 다져가는 사주`;
    let keyTendency = `일간 ${dayStem}의 본질을 지니고 태어나 기본적으로 책임감과 실질적 가치를 중요하게 여깁니다.`;

    if (strength === '신강' || strength === '극강') {
      headline = `강건한 추진력과 주도적 결실을 이끌어내는 당당한 기상의 사주`;
      keyTendency = `어려움 앞에서도 물러서지 않는 독립심과 개척 정신이 삶의 주요 동력으로 작용합니다.`;
    } else if (strength === '극약' || strength === '신약') {
      headline = `섬세한 감각과 조화로운 관계를 통해 기회를 만들어가는 지혜로운 사주`;
      keyTendency = `무리한 정면 승부보다는 유연한 환경 적응과 내면의 완충력을 키울 때 더욱 빛을 발합니다.`;
    }

    let rsiExplanation = '사주 구조 전반의 구심점이 비교적 평온하여 장기적 역량을 차분하게 축적하기 좋은 국면입니다.';
    if (rsiBand === 'BALANCED_TENSION') {
      rsiExplanation = '건전한 긴장감과 성장 기회가 공존하여, 역동적인 도약의 발판으로 승화시키기 좋은 활성 국면입니다.';
    } else if (rsiBand === 'TURBULENT') {
      rsiExplanation = '외부 환경의 변동성이 높고 상호 마찰이 있을 수 있으니, 무리한 확장보다는 보수적 안정이 필요한 국면입니다.';
    } else if (rsiBand === 'LATENT') {
      rsiExplanation = '기운이 겉으로 급격히 격발되기보다 내면에 차분히 축적되어 다음 기회를 준비하는 잠복 국면입니다.';
    }

    return {
      headline,
      keyTendency,
      rsiBandStatus: {
        band: rsiBand,
        userExplanation: rsiExplanation,
      },
    };
  }

  /**
   * ③ 6대 핵심 테마 빌더 (모드별 차별화)
   */
  private buildThemes(
    phase7Output: Phase7Output,
    personaResult: MabosalPersonaRenderResult,
    depthMode: ReportDepthMode
  ): ThemeReportItem[] {
    const items: ThemeReportItem[] = [];

    for (const rendered of personaResult.orderedThemes) {
      const baseItem: ThemeReportItem = {
        theme: rendered.theme,
        title: rendered.title,
        summary: rendered.summary,
        certaintyDescription: rendered.certainty,
      };

      if (depthMode === 'QUICK') {
        baseItem.actionableCaution = rendered.caution;
      } else if (depthMode === 'STANDARD') {
        baseItem.evidence = rendered.evidence;
        baseItem.structuralInterpretation = rendered.interpretation;
        baseItem.actionableCaution = rendered.caution;
      } else if (depthMode === 'DEEP') {
        baseItem.evidence = rendered.evidence;
        baseItem.structuralInterpretation = rendered.interpretation;
        baseItem.actionableCaution = rendered.caution;
        baseItem.deepFactDetails = {
          pillarsInvolved: [...rendered.rawNode.factReferences.pillarsInvolved],
          tenGods: [...rendered.rawNode.factReferences.tenGods],
          signals: [...rendered.rawNode.derivedFromSignals],
          rawVerdict: rendered.rawNode.primaryVerdict,
        };
      }

      items.push(baseItem);
    }

    return items;
  }

  /**
   * ④ 전체 구조 연결 (Structural Synthesis)
   */
  private buildStructuralSynthesis(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    phase7Output: Phase7Output
  ): StructuralSynthesis {
    const srs = phase7Output.secondRelationships;

    const amplifiedAreas: string[] = [];
    const conflictingAreas: string[] = [];
    const mitigatedAreas: string[] = [];
    const dualManagementAreas: string[] = [];

    for (const r of srs) {
      if (r.action === 'AMPLIFIED') {
        amplifiedAreas.push(`${r.targetModuleId}: 기회와 자원의 상호 증폭 작용`);
      } else if (r.action === 'CONFLICTING') {
        conflictingAreas.push(`${r.targetModuleId}: 구조적 마찰 및 주의 요망`);
      } else if (r.action === 'MITIGATED') {
        mitigatedAreas.push(`${r.targetModuleId}: 귀인 및 지혜를 통한 충돌 완충`);
      } else if (r.action === 'TRANSFERRED') {
        dualManagementAreas.push(`${r.targetModuleId}: 유동 기운의 실물 자산 전이 및 균형 관리`);
      }
    }

    // 원국 지지 충돌 및 과부하 신호 반영
    if (fact.branch_clashes.length > 0) {
      conflictingAreas.push(`지지 충돌(${fact.branch_clashes.map(c => c.name).join(', ')}): 환경적 변동성과 마찰 주의`);
    }
    for (const ob of signalSet.overburdenedSignals) {
      conflictingAreas.push(`${ob.koreanName}: 기운의 집중 및 과부하 압박 완충 필요`);
    }

    // 기본 관계가 없을 경우 테마 기반 상호작용 도출
    if (amplifiedAreas.length === 0) {
      amplifiedAreas.push('전문 역량과 직무 자격의 안정적인 상호 보완');
    }
    if (dualManagementAreas.length === 0) {
      dualManagementAreas.push('사회적 활동 기회와 개인적 휴식 리듬의 동시 관리');
    }

    let synthesisNote =
      '6개 테마는 독립된 것이 아니라 서로 영향을 주고받습니다. ' +
      '강화되는 영역은 성장의 동력으로 삼고, 긴장이 있는 영역은 완충 요인을 활용해 지혜롭게 다스릴 때 삶의 균형이 완성됩니다.';

    return {
      amplifiedAreas,
      conflictingAreas,
      mitigatedAreas,
      dualManagementAreas,
      synthesisNote,
    };
  }

  /**
   * ⑤ 마보살 종합 해석 빌더
   */
  private buildFinalSynthesis(
    fact: MaModuleInputFact,
    signalSet: MaSignalSet,
    phase7Output: Phase7Output
  ): MabosalFinalSynthesis {
    const dayStem = fact.day_stem;
    const rsiBand = phase7Output.rsi.band;
    const strength = fact.day_master_strength.classification;

    let coreStructureVerdict =
      `이 사주는 일간 ${dayStem}의 고유한 결실 의지와 [${rsiBand}] 안정도가 어우러져, ` +
      `단기적인 요행보다 꾸준한 자기 관리와 전문성 축적으로 인생의 큰 틀을 세워가는 구조입니다.`;

    if (signalSet.signals['ma_business']?.activation.state === 'DOMINANT') {
      coreStructureVerdict =
        `이 사주는 식상생재의 유연한 기회 포착력과 일간의 감당력이 결합되어, ` +
        `독자적인 전문성을 현실적인 비즈니스와 시장 가치로 전환해 낼 수 있는 능동적 구조입니다.`;
    } else if (signalSet.signals['ma_career']?.activation.state === 'DOMINANT') {
      coreStructureVerdict =
        `이 사주는 관인상생의 신뢰도와 공인된 자격을 바탕으로, ` +
        `안정된 조직 체계 속에서 자신의 권한과 전문 가치를 인정받으며 성장해 가는 정통적 구조입니다.`;
    }

    const lifeStrategy =
      `운명은 정해진 대로 흘러가는 것이 아니라 나의 현명한 선택과 태도로 완성됩니다. ` +
      `강한 기운은 겸손하게 세상과 조화시키고, 부족한 기운은 서두르지 않고 지혜롭게 채워가십시오. ` +
      `성공의 순간에는 유동성을 비축하고, 정체의 순간에는 내면의 배움을 채우는 것이 최선의 삶의 전략입니다.`;

    const closingBlessing =
      `하늘의 운은 흐르고 땅의 기운은 돕나니, 그대 스스로 중심을 바로 세우면 어떠한 파도도 도약의 기회가 될 것입니다. ` +
      `마보살이 그대의 현명하고 평온한 여정을 온 마음으로 응원합니다.`;

    return {
      coreStructureVerdict: sanitizeSafetyLanguage(coreStructureVerdict),
      lifeStrategy: sanitizeSafetyLanguage(lifeStrategy),
      closingBlessing: sanitizeSafetyLanguage(closingBlessing),
    };
  }

  /**
   * ⑥ 시간축 보조 설명 빌더 (원국 비간섭 원칙)
   */
  private buildTemporalModulation(phase7Output: Phase7Output): TemporalModulationSummary | undefined {
    const timeSignals = phase7Output.timeModulatorSignals || [];
    if (timeSignals.length === 0) return undefined;

    const descriptions = timeSignals.map(ts => {
      let scopeKorean = '대운(10년 흐름)';
      if (ts.timeScope === 'SEWOON') scopeKorean = '세운(1년 흐름)';
      else if (ts.timeScope === 'WOLWOON') scopeKorean = '월운(한 달 흐름)';

      const maIdStr = String(ts.targetModuleId);
      const themeTitle = MA_TO_THEME_TITLE[maIdStr] || '해당 삶의 영역';

      return {
        timeScope: ts.timeScope,
        targetThemeTitle: themeTitle,
        modulationEffect: `${scopeKorean}의 영향으로 원국의 잠재성이 현재 시점에서 감응 및 촉발되는 환경적 계기가 주어집니다: ${ts.description}`,
      };
    });

    return {
      hasActiveTimeSignals: true,
      timeScopeDescriptions: descriptions,
      temporalDisclaimer:
        '시간축의 운은 사주 원국 자체를 변조하지 않으며, 현재 시점에서 원국의 기운이 세상과 만나는 환경적 파도를 의미합니다.',
    };
  }
}

/**
 * Phase 9: Mabosal Persona Engine
 * 
 * 원칙:
 * 1. 복잡한 명리 계산값을 사람이 이해하기 쉬운 언어로 풀어주는 지혜로운 해석자 페르소나.
 * 2. 6대 Theme 전체를 일관된 톤앤매너로 통합 렌더링.
 * 3. 확실성 격리 검증 및 원천 InterpretationNode 무결성 보존.
 */

import { MaModuleInputFact, MaSignalSet } from '../ma/ma-types.js';
import { InterpretationTheme } from '../phase6/phase6-types.js';
import { Phase7Output } from '../phase7/phase7-pipeline.js';
import { NaturalLanguageRenderer, RenderContext } from './natural-language-renderer.js';
import { MabosalPersonaRenderResult, RenderedThemeInterpretation } from './phase9-types.js';

export const THEME_RENDER_ORDER: InterpretationTheme[] = [
  'CAREER_ORGANIZATION',
  'WEALTH_FLOW',
  'BUSINESS_VENTURE',
  'RELATIONSHIP_BOND',
  'HEALTH_EQUILIBRIUM',
  'SAFETY_MOVEMENT',
];

export class MabosalPersonaEngine {
  private renderer = new NaturalLanguageRenderer();

  /**
   * Phase 7의 6대 테마 완성 산출물을 마보살 페르소나 자연어로 최종 렌더링합니다.
   */
  public renderAll(
    phase7Output: Phase7Output,
    fact?: MaModuleInputFact,
    signalSet?: MaSignalSet
  ): MabosalPersonaRenderResult {
    const context: RenderContext = {
      fact,
      signalSet,
      rsi: phase7Output.rsi,
    };

    const themeMap = {} as Record<InterpretationTheme, RenderedThemeInterpretation>;
    const orderedThemes: RenderedThemeInterpretation[] = [];

    // 1. 6대 테마 순서대로 렌더링 수행
    for (const theme of THEME_RENDER_ORDER) {
      const node = phase7Output.interpretations.find(n => n.theme === theme);
      if (node) {
        const rendered = this.renderer.renderNode(node, context);
        themeMap[theme] = rendered;
        orderedThemes.push(rendered);
      }
    }

    // 2. 만약 순서 목록 외에 추가 노드가 존재할 경우 보존
    for (const node of phase7Output.interpretations) {
      if (!themeMap[node.theme]) {
        const rendered = this.renderer.renderNode(node, context);
        themeMap[node.theme] = rendered;
        orderedThemes.push(rendered);
      }
    }

    // 3. 총평 인사 및 인생 조화 조언 조립 (마보살 페르소나: 따뜻하고 지혜로운 안내자)
    const rsiBand = phase7Output.rsi.band;
    const dayStrength = fact?.day_master_strength.classification || '균형';

    const overviewGreeting =
      `반갑습니다. 마보살입니다. 당신의 사주에 깃든 고유한 기운과 오행의 흐름을 맑게 비추어 드리겠습니다. ` +
      `사주는 정해진 운명의 족쇄가 아니라, 나 자신을 온전히 이해하고 삶의 파도를 지혜롭게 타기 위한 나침반입니다.`;

    let overallToneAndAdvice =
      `현재 당신의 전체적인 사주 안정성 구조는 [${rsiBand}] 상태로 분석됩니다. ` +
      `일간의 기운(${dayStrength})을 바탕으로, 강한 영역은 세상과 조화롭게 나누고 비어 있는 영역은 조급하지 않게 채워가실 때 ` +
      `가장 평온하고 주도적인 삶의 성취를 이루실 수 있을 것입니다.`;

    if (rsiBand === 'BALANCED_TENSION') {
      overallToneAndAdvice += ' 역동적인 도전과 성장의 기운이 함께하므로, 차분한 호흡으로 완급을 조절하시기 바랍니다.';
    } else if (rsiBand === 'TURBULENT') {
      overallToneAndAdvice += ' 주변 환경의 변화가 빠르게 다가올 수 있으니, 무리한 확장보다는 내실을 단단히 다지는 것이 지혜롭습니다.';
    } else if (rsiBand === 'SERENE') {
      overallToneAndAdvice += ' 기초 토대가 비교적 평온하고 안정적이니, 장기적인 비전을 세우고 꾸준히 역량을 축적하기 좋은 국면입니다.';
    } else if (rsiBand === 'LATENT') {
      overallToneAndAdvice += ' 기운이 겉으로 크게 격발되기보다 내면에 축적되어 있는 시기이므로, 일상의 기초 리듬을 충실히 지키십시오.';
    }

    // 4. 확실성 계층 격리 검증 (모든 렌더링된 노드가 원천 certainty를 온전히 보존하는지)
    const certaintyIsolationVerified = orderedThemes.every(
      t => t.rawNode.certainty === 'PROVISIONAL' || t.rawNode.certainty === 'OPEN'
    );

    return {
      overviewGreeting,
      themeInterpretations: themeMap,
      orderedThemes,
      overallToneAndAdvice,
      certaintyIsolationVerified,
    };
  }
}

/**
 * Phase 9: Natural Language Renderer
 * 
 * 원칙:
 * 1. InterpretationNode의 판단 결과를 변조하지 않고, 사람이 이해하기 쉬운 자연어로 렌더링합니다.
 * 2. 4단계 구조 [한줄 결론 → 근거 → 관계·구조 해석 → 현실적 조언]을 엄격히 준수합니다.
 * 3. ISS-P8-001 (SAFETY_MOVEMENT 충 다발 가중 주의) 반영.
 * 4. ISS-P8-002 (HEALTH_EQUILIBRIUM 오행 맞춤형 서술 및 의료 단정 배제) 반영.
 * 5. 저신호(Low-Signal) 안전 방어 (근거 부족 시 억지 해석 금지, 제한적 표현 적용).
 */

import { MaModuleInputFact, MaSignalSet } from '../ma/ma-types.js';
import { InterpretationNode, InterpretationTheme, RSIAssessment } from '../phase6/phase6-types.js';
import {
  explainSajuTerms,
  formatCertaintyToNaturalLanguage,
  sanitizeSafetyLanguage,
  THEME_TITLE_MAP,
} from './persona-rules.js';
import { RenderedThemeInterpretation } from './phase9-types.js';

export interface RenderContext {
  fact?: MaModuleInputFact;
  signalSet?: MaSignalSet;
  rsi?: RSIAssessment;
}

export class NaturalLanguageRenderer {
  /**
   * 단일 InterpretationNode를 자연어 해석 노드로 렌더링합니다.
   */
  public renderNode(node: InterpretationNode, context: RenderContext = {}): RenderedThemeInterpretation {
    const { fact, signalSet, rsi } = context;

    const title = THEME_TITLE_MAP[node.theme] || '사주 심층 분석';
    const certainty = formatCertaintyToNaturalLanguage(node.certainty);

    // 원천 추적 메타데이터 보존
    const sourceReferences = {
      pillars: [...node.factReferences.pillarsInvolved],
      tenGods: [...node.factReferences.tenGods],
      signals: [...node.derivedFromSignals],
    };

    // 테마별 특화 렌더링 분기
    switch (node.theme) {
      case 'SAFETY_MOVEMENT':
        return this.renderSafetyMovement(node, title, certainty, sourceReferences, fact, signalSet, rsi);

      case 'HEALTH_EQUILIBRIUM':
        return this.renderHealthEquilibrium(node, title, certainty, sourceReferences, fact, signalSet, rsi);

      case 'BUSINESS_VENTURE':
        return this.renderBusinessVenture(node, title, certainty, sourceReferences, fact, signalSet, rsi);

      case 'WEALTH_FLOW':
        return this.renderWealthFlow(node, title, certainty, sourceReferences, fact, signalSet, rsi);

      case 'CAREER_ORGANIZATION':
        return this.renderCareerOrganization(node, title, certainty, sourceReferences, fact, signalSet, rsi);

      case 'RELATIONSHIP_BOND':
        return this.renderRelationshipBond(node, title, certainty, sourceReferences, fact, signalSet, rsi);

      default:
        return this.renderDefaultNode(node, title, certainty, sourceReferences);
    }
  }

  /**
   * SAFETY_MOVEMENT (이동과 안전 관리) 렌더링
   * [ISS-P8-001 반영]: ACTIVE + 충 다발 조건 시 주의 수준 자연어 가중 반영
   */
  private renderSafetyMovement(
    node: InterpretationNode,
    title: string,
    certainty: string,
    sourceReferences: any,
    fact?: MaModuleInputFact,
    signalSet?: MaSignalSet,
    rsi?: RSIAssessment
  ): RenderedThemeInterpretation {
    const clashes = fact?.branch_clashes || [];
    const accidentSig = signalSet?.signals['ma_accident'];
    const nobleSig = signalSet?.signals['ma_noble'];

    const hasClashes = clashes.length > 0;
    const isAccidentActive = accidentSig?.activation.state === 'ACTIVE' || accidentSig?.activation.state === 'DOMINANT';
    const hasNobleMitigation = nobleSig?.activation.isActivated || node.structure.relationshipAndRSIImpact.activeSecondRelationships.length > 0;

    let summary = node.structure.conclusion;
    let evidence = `사주 원국의 지지 충돌 요인(${clashes.map(c => c.name).join(', ') || '무'}) 및 안전 관련 기운을 바탕으로 분석된 결과입니다.`;
    let interpretation = `안정성 지수(${rsi?.band || node.structure.relationshipAndRSIImpact.rsiBand}) 환경 속에서 일상의 물리적 장력 분산 여부를 점검합니다.`;
    let caution = node.structure.actionableCaution.guideline;

    // [ISS-P8-001 대응]: 지지 충돌이 존재하고 사고마가 ACTIVE 이상인 경우
    if (hasClashes && isAccidentActive) {
      summary = '활동적인 이동과 환경적 변화가 잦은 시기로, 겹치는 일정과 이동 동선에 세심한 주의가 요구되는 국면입니다.';
      evidence = `원국 지지에서 ${clashes.map(c => c.name).join('과 ')}의 충돌 기운이 작용하고, 이동과 긴장을 나타내는 신호가 활성화되어 있어 환경적 변동성이 체감될 수 있습니다.`;
      interpretation = hasNobleMitigation
        ? '부딪치는 기운이 존재하지만, 이를 완충해 주는 귀인과 완화 요인이 함께 작용하여 신중하게 움직인다면 큰 마찰 없이 조화롭게 넘길 수 있는 구조입니다.'
        : '급격한 일정 변경이나 무리한 동선 겹침이 긴장을 유발할 수 있으므로, 매사 여유 시간을 두고 한 템포 차분하게 조율하는 것이 안전한 방편입니다.';
      caution = '장거리 야간 운전이나 위험한 물리적 활동은 일정을 분산하여 여유 있게 진행하시고, 사전 안전 점검을 생활화하십시오. (사고 발생을 예언하거나 확정하는 것이 아니며 일상 주의 수준의 지침입니다.)';
    }

    return {
      theme: node.theme,
      title,
      summary: sanitizeSafetyLanguage(explainSajuTerms(summary)),
      evidence: sanitizeSafetyLanguage(explainSajuTerms(evidence)),
      interpretation: sanitizeSafetyLanguage(explainSajuTerms(interpretation)),
      caution: sanitizeSafetyLanguage(explainSajuTerms(caution)),
      sourceReferences,
      certainty,
      provisionalNote: node.provisionalNote,
      rawNode: node,
    };
  }

  /**
   * HEALTH_EQUILIBRIUM (신체 기혈과 오행 균형) 렌더링
   * [ISS-P8-002 반영]: 오행 과다/결핍/일간 강약 맞춤형 서술 및 의료 단정 금지
   */
  private renderHealthEquilibrium(
    node: InterpretationNode,
    title: string,
    certainty: string,
    sourceReferences: any,
    fact?: MaModuleInputFact,
    signalSet?: MaSignalSet,
    rsi?: RSIAssessment
  ): RenderedThemeInterpretation {
    const dayStrength = fact?.day_master_strength.classification || '중화';
    const dominantEl = fact?.five_elements?.dominantElement || '균형';
    const missingEl = fact?.five_elements?.missingElements?.length
      ? fact?.five_elements.missingElements.join(', ')
      : (fact?.five_elements?.weakestElement || '무');

    let summary = node.structure.conclusion;
    let evidence = `일간(${fact?.day_stem || '본원'})의 기초 감당력(${dayStrength})과 오행 분포(최강:${dominantEl}, 결핍·최약:${missingEl})를 바탕으로 분석된 기혈 순환 지표입니다.`;
    let interpretation = `신체 에너지의 조화도(${rsi?.band || node.structure.relationshipAndRSIImpact.rsiBand})를 바탕으로 기혈 항상성의 완충 리듬을 점검합니다.`;
    let caution = node.structure.actionableCaution.guideline;

    // [ISS-P8-002 대응]: 오행 맞춤형 서술 분기
    if (dayStrength === '극약' || dayStrength === '신약') {
      summary = `기초 체력의 소모가 빠르고 ${dominantEl} 기운의 편중이 체감될 수 있어, 무리한 활동보다는 충전과 이완 리듬이 중심이 되어야 하는 시기입니다.`;
      evidence = `일간의 세력이 다소 약화된 상태에서 ${dominantEl} 기운이 강하고 ${missingEl} 기운이 결여되어, 특정 계절이나 과로 시 피로도가 집중될 수 있는 명리 구조입니다.`;
      interpretation = '부족한 기운을 채우고 과도한 설기(에너지 방출)를 완충하기 위해, 규칙적인 수면과 심신의 안정을 최우선으로 두는 것이 오행의 균형을 돕습니다.';
    } else if (dayStrength === '극강' || dayStrength === '신강') {
      summary = `일간의 신체 감당력이 탄탄하여 활동 에너지가 왕성하나, 지나친 과열이나 불필요한 긴장 축적을 조율해야 하는 흐름입니다.`;
      evidence = `일간을 지지하는 세력이 충분하여 회복 탄력성은 우수하나, ${dominantEl} 오행의 에너지가 한곳으로 몰릴 때 순환 정체가 일어날 수 있습니다.`;
      interpretation = '넘치는 활력을 건전한 유산소 운동이나 생산적 활동으로 자연스럽게 발산하여, 오행의 울체(답답함)를 풀어주는 것이 건강 유지에 이롭습니다.';
    }

    return {
      theme: node.theme,
      title,
      summary: sanitizeSafetyLanguage(explainSajuTerms(summary)),
      evidence: sanitizeSafetyLanguage(explainSajuTerms(evidence)),
      interpretation: sanitizeSafetyLanguage(explainSajuTerms(interpretation)),
      caution: sanitizeSafetyLanguage(explainSajuTerms(caution)),
      sourceReferences,
      certainty,
      provisionalNote: node.provisionalNote,
      rawNode: node,
    };
  }

  /**
   * BUSINESS_VENTURE (독립 사업과 실행 기회) 렌더링
   * 저신호 처리 포함
   */
  private renderBusinessVenture(
    node: InterpretationNode,
    title: string,
    certainty: string,
    sourceReferences: any,
    fact?: MaModuleInputFact,
    signalSet?: MaSignalSet,
    rsi?: RSIAssessment
  ): RenderedThemeInterpretation {
    const businessSig = signalSet?.signals['ma_business'];
    const isLowSignal = !businessSig || businessSig.activation.state === 'DORMANT' || node.derivedFromSignals.length === 0;

    let summary = node.structure.conclusion;
    let evidence = `사업마(${businessSig?.activation.state || '미작동'}) 신호와 일간 감당력을 결합하여 독립적 실행력을 검토한 결과입니다.`;
    let interpretation = `시장 환경의 변동성(${rsi?.band || node.structure.relationshipAndRSIImpact.rsiBand}) 속에서 사업 자원의 유통성과 위험 관리 균형을 분석합니다.`;
    let caution = node.structure.actionableCaution.guideline;

    if (isLowSignal) {
      summary = '현재 사주 구조만으로는 이 영역을 강하게 판단하기 어려우며, 기존 기반을 안정적으로 지키는 것이 지혜로운 시기입니다.';
      evidence = '사주 원국에서 독립적인 대규모 사업 실행 신호가 두드러지지 않고 잠복해 있어, 무리한 확장 동력은 아직 성숙하지 않았습니다.';
      interpretation = '외부 시장의 변동에 휩쓸리기보다는, 이미 검증된 전문 지식이나 본업의 기반을 다지는 것이 안전한 전략입니다.';
      caution = '고위험 독자 창업이나 무리한 차입 투자를 지양하고, 본업에 충실하며 미래의 기회를 위한 준비 자금을 비축하십시오.';
    }

    return {
      theme: node.theme,
      title,
      summary: sanitizeSafetyLanguage(explainSajuTerms(summary)),
      evidence: sanitizeSafetyLanguage(explainSajuTerms(evidence)),
      interpretation: sanitizeSafetyLanguage(explainSajuTerms(interpretation)),
      caution: sanitizeSafetyLanguage(explainSajuTerms(caution)),
      sourceReferences,
      certainty,
      provisionalNote: node.provisionalNote,
      rawNode: node,
    };
  }

  /**
   * WEALTH_FLOW (재물과 자산의 흐름) 렌더링
   */
  private renderWealthFlow(
    node: InterpretationNode,
    title: string,
    certainty: string,
    sourceReferences: any,
    fact?: MaModuleInputFact,
    signalSet?: MaSignalSet,
    rsi?: RSIAssessment
  ): RenderedThemeInterpretation {
    const wealthSig = signalSet?.signals['ma_wealth'];
    const assetSig = signalSet?.signals['ma_asset'];

    const summary = node.structure.conclusion;
    const evidence = `재물마(${wealthSig?.activation.state || '통상'})와 자산마(${assetSig?.activation.state || '잠복'})의 상호작용 및 원국 재성 투간 상태를 바탕으로 분석되었습니다.`;
    const interpretation = `안정성 지표(${rsi?.band || node.structure.relationshipAndRSIImpact.rsiBand}) 하에서 유동 현금 흐름이 실물 자산으로 안착되는 순환성을 검토합니다.`;
    const caution = node.structure.actionableCaution.guideline;

    return {
      theme: node.theme,
      title,
      summary: sanitizeSafetyLanguage(explainSajuTerms(summary)),
      evidence: sanitizeSafetyLanguage(explainSajuTerms(evidence)),
      interpretation: sanitizeSafetyLanguage(explainSajuTerms(interpretation)),
      caution: sanitizeSafetyLanguage(explainSajuTerms(caution)),
      sourceReferences,
      certainty,
      provisionalNote: node.provisionalNote,
      rawNode: node,
    };
  }

  /**
   * CAREER_ORGANIZATION (직장과 사회적 성취) 렌더링
   */
  private renderCareerOrganization(
    node: InterpretationNode,
    title: string,
    certainty: string,
    sourceReferences: any,
    fact?: MaModuleInputFact,
    signalSet?: MaSignalSet,
    rsi?: RSIAssessment
  ): RenderedThemeInterpretation {
    const careerSig = signalSet?.signals['ma_career'];
    const docSig = signalSet?.signals['ma_document'];

    const summary = node.structure.conclusion;
    const evidence = `직장마(${careerSig?.activation.state || '통상'}) 및 문서마(${docSig?.activation.state || '잠복'})의 결합과 관성(조직) 기운의 안착도를 토대로 평가되었습니다.`;
    const interpretation = `조직 내 직무 권한과 전문 자격의 지속성을 ${rsi?.band || node.structure.relationshipAndRSIImpact.rsiBand} 안정도 맥락에서 조망합니다.`;
    const caution = node.structure.actionableCaution.guideline;

    return {
      theme: node.theme,
      title,
      summary: sanitizeSafetyLanguage(explainSajuTerms(summary)),
      evidence: sanitizeSafetyLanguage(explainSajuTerms(evidence)),
      interpretation: sanitizeSafetyLanguage(explainSajuTerms(interpretation)),
      caution: sanitizeSafetyLanguage(explainSajuTerms(caution)),
      sourceReferences,
      certainty,
      provisionalNote: node.provisionalNote,
      rawNode: node,
    };
  }

  /**
   * RELATIONSHIP_BOND (애정과 배우자 관계) 렌더링
   */
  private renderRelationshipBond(
    node: InterpretationNode,
    title: string,
    certainty: string,
    sourceReferences: any,
    fact?: MaModuleInputFact,
    signalSet?: MaSignalSet,
    rsi?: RSIAssessment
  ): RenderedThemeInterpretation {
    const marriageSig = signalSet?.signals['ma_marriage'];

    const summary = node.structure.conclusion;
    const evidence = `배우자궁(일지)의 안착 상태와 결혼마(${marriageSig?.activation.state || '통상'}) 신호를 바탕으로 동반자적 유대감을 조명하였습니다.`;
    const interpretation = `관계의 구조적 지지력(${rsi?.band || node.structure.relationshipAndRSIImpact.rsiBand})을 확인하여 정서적 안정과 소통의 방향을 제시합니다.`;
    const caution = node.structure.actionableCaution.guideline;

    return {
      theme: node.theme,
      title,
      summary: sanitizeSafetyLanguage(explainSajuTerms(summary)),
      evidence: sanitizeSafetyLanguage(explainSajuTerms(evidence)),
      interpretation: sanitizeSafetyLanguage(explainSajuTerms(interpretation)),
      caution: sanitizeSafetyLanguage(explainSajuTerms(caution)),
      sourceReferences,
      certainty,
      provisionalNote: node.provisionalNote,
      rawNode: node,
    };
  }

  /**
   * 기본 노드 렌더링 폴백
   */
  private renderDefaultNode(
    node: InterpretationNode,
    title: string,
    certainty: string,
    sourceReferences: any
  ): RenderedThemeInterpretation {
    return {
      theme: node.theme,
      title,
      summary: sanitizeSafetyLanguage(explainSajuTerms(node.structure.conclusion)),
      evidence: sanitizeSafetyLanguage(explainSajuTerms(node.structure.basis.facts.join(', '))),
      interpretation: sanitizeSafetyLanguage(explainSajuTerms(node.structure.relationshipAndRSIImpact.impactSummary)),
      caution: sanitizeSafetyLanguage(explainSajuTerms(node.structure.actionableCaution.guideline)),
      sourceReferences,
      certainty,
      provisionalNote: node.provisionalNote,
      rawNode: node,
    };
  }
}

/**
 * src/modules/modular/core-modules/relation-module.ts
 * 
 * RELATION: 지지 합·충·형·파·해·원진 상호작용 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars } from '../../../core/types.js';
import { RelationshipEngine } from '../../relationship/relationship-engine.js';
import { MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';

import { standardRelationAuditor, StandardRelationItem } from '../../relationship/standard-relation-auditor.js';

export class RelationModule extends BaseModularEngine {
  public readonly moduleId = 'RELATION';
  public readonly moduleName = '지지 합충형파해 관계 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.RELATION;
  public readonly defaultPrice = 7000;

  private relEngine = new RelationshipEngine();

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    // 1. 기존 RelationshipEngine 계산 (하위 호환 유지)
    const res = this.relEngine.execute({ four_pillars: pillars });
    
    // 2. Phase 63 표준 관계 판정 감사 엔진 적용 (정규화, 독립판정, 비정식관계 배제)
    const auditRes = standardRelationAuditor.auditRelations(pillars);
    const standardItems = auditRes.natalRelations;

    const clashes = standardItems.filter(i => i.relationType === 'BRANCH_CLASH').map(i => i.standardLabel);
    const sixHarmonies = standardItems.filter(i => i.relationType === 'BRANCH_SIX_COMBINATION').map(i => i.standardLabel);
    const samhaps = standardItems.filter(i => i.relationType === 'SAMHAP').map(i => i.standardLabel);
    const banhaps = standardItems.filter(i => i.relationType === 'BANHAP').map(i => i.standardLabel);
    const punishments = standardItems.filter(i => i.relationType === 'PUNISHMENT').map(i => i.standardLabel);
    const selfPunishments = standardItems.filter(i => i.relationType === 'SELF_PUNISHMENT').map(i => i.standardLabel);
    const destructions = standardItems.filter(i => i.relationType === 'DESTRUCTION').map(i => i.standardLabel);
    const harms = standardItems.filter(i => i.relationType === 'HARM').map(i => i.standardLabel);
    const wonjins = standardItems.filter(i => i.relationType === 'WONJIN').map(i => i.standardLabel);
    const gwimuns = standardItems.filter(i => i.relationType === 'GWIMUN').map(i => i.standardLabel);

    const harmonies = [...sixHarmonies, ...samhaps, ...banhaps];

    const stemCombinations = (res.data.stem_relations || [])
      .filter(s => s.type === 'stem_combination')
      .map(s => s.name);
    const stemClashes = (res.data.stem_relations || [])
      .filter(s => s.type === 'stem_clash')
      .map(s => s.name);
    const banghaps = (res.data.branch_harmonies || [])
      .filter(h => h.harmonySubType === 'DIRECTIONAL_HARMONY')
      .map(h => h.name);

    return {
      rawMetrics: {
        standardItems,
        clashes,
        harmonies,
        sixHarmonies,
        samhaps,
        banhaps,
        banghaps,
        punishments,
        selfPunishments,
        destructions,
        harms,
        wonjins,
        gwimuns,
        stemCombinations,
        stemClashes,
        totalClashesCount: clashes.length,
        totalHarmoniesCount: harmonies.length,
      },
      basis: [
        `원국 4주 지지 간 Phase 63 13대 표준 독립 관계 판정 감사 적용`,
        `충: ${clashes.join(', ') || '없음'}, 육합/삼합/반합: ${harmonies.join(', ') || '없음'}`,
        `원진: ${wonjins.join(', ') || '없음'}, 귀문관살: ${gwimuns.join(', ') || '없음'} (독립 분리 판정)`,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    const m = calc.rawMetrics;
    const isDynamic = m.clashes.length > 0 || m.punishments.length > 0;
    const verdict = isDynamic
      ? `충·형의 작용이 내재되어 환경 변화와 전환점이 뚜렷한 역동형 구조`
      : `합의 기운이 우세하거나 큰 충돌 없이 온화하게 조화를 이루는 안정형 구조`;

    return {
      verdict,
      level: isDynamic ? '변화/역동' : '안정/화합',
      indicators: {
        clashes: m.clashes,
        harmonies: m.harmonies,
        samhaps: m.samhaps,
        punishments: m.punishments,
        harms: m.harms,
        wonjins: m.wonjins,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const m = calc.rawMetrics;
    const clText = m.clashes.length > 0 ? `충(${m.clashes.join(', ')})이 있어 결단과 변화를 촉진합니다.` : '원국 내 직접 충돌이 없습니다.';
    const hmText = [...m.harmonies, ...m.samhaps].length > 0 ? `합(${[...m.harmonies, ...m.samhaps].join(', ')})이 있어 친화력과 결합의 힘이 있습니다.` : '합 작용이 독립적입니다.';

    const activeList = [
      ...m.clashes,
      ...m.harmonies,
      ...m.punishments,
      ...m.selfPunishments,
      ...m.destructions,
      ...m.harms,
      ...m.wonjins,
      ...m.gwimuns,
    ];
    const relDetails = activeList.length > 0 ? ` [성립 관계: ${activeList.join(', ')}]` : '';

    return {
      summary: `지지 상호작용 분석 결과: ${judgment.verdict}${relDetails}`,
      detailedNarrative: `지지의 관계는 삶의 사건이 일어나는 물리적 환경과 인간관계의 결합 방식을 나타냅니다. ${clText} ${hmText} 충과 형은 낡은 것을 깨뜨리고 도약하는 기회가 되며, 합은 협력과 유대의 디딤돌이 됩니다.`,
      keywords: ['합충형파해', ...activeList],
      actionableInsight: m.clashes.length > 0
        ? '충이 작용하는 시기에는 성급한 대립을 피하고, 환경 변화를 도약의 발판으로 승화시키세요.'
        : '안정적인 환경 속에서 꾸준한 성과를 쌓아가는 지속성을 유지하세요.',
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      standardItems: calc.rawMetrics.standardItems,
      clashes: calc.rawMetrics.clashes,
      harmonies: calc.rawMetrics.harmonies,
      sixHarmonies: calc.rawMetrics.sixHarmonies,
      samhaps: calc.rawMetrics.samhaps,
      banhaps: calc.rawMetrics.banhaps,
      banghaps: calc.rawMetrics.banghaps,
      punishments: calc.rawMetrics.punishments,
      selfPunishments: calc.rawMetrics.selfPunishments,
      destructions: calc.rawMetrics.destructions,
      harms: calc.rawMetrics.harms,
      wonjins: calc.rawMetrics.wonjins,
      gwimuns: calc.rawMetrics.gwimuns,
      stemCombinations: calc.rawMetrics.stemCombinations,
      stemClashes: calc.rawMetrics.stemClashes,
      summary: explanation.summary,
    };
  }
}

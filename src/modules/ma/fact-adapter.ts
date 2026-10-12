/**
 * Ma Fact Adapter (Phase 5)
 * 
 * 원칙:
 * 1. Phase 1~4의 모든 확정 데이터(FourPillars, SajuCoreOutput, RelationshipOutput)를
 *    취합하여 Phase 5 표준 인터페이스인 MaModuleInputFact로 변환합니다.
 * 2. Zero-Gender Leakage: 어댑터 및 생성된 Fact 객체에는 'gender' 필드가 존재하지 않습니다.
 * 3. PROVISIONAL 가드: RuleCertainty 또는 EvidenceLevel이 PROVISIONAL인 규칙/상호작용은
 *    핵심 Activation 판정에 참여할 수 없도록 엄격히 차단하는 유틸리티를 제공합니다.
 */

import { FourPillars, TimeDependencyInfo } from '../../core/types.js';
import { RelationshipOutput } from '../relationship/relationship-engine.js';
import { SajuCoreOutput } from '../saju-core/saju-core-engine.js';
import {
  EvidenceLevel,
  MaActivationEvaluation,
  MaModuleInputFact,
  RuleCertainty,
  SignalInteractionRecord,
} from './ma-types.js';
import { SpouseProfile, SpouseProfileAdapter } from './spouse-model.js';

export interface CreateMaInputFactParams {
  fourPillars: FourPillars;
  sajuCore: SajuCoreOutput;
  relationship: RelationshipOutput;
  spouseProfile?: SpouseProfile;
  timeDependency?: TimeDependencyInfo;
}

export class MaFactAdapter {
  /**
   * Phase 1~4 출력을 결합하여 Phase 5 MaModuleInputFact를 생성합니다.
   * 성별(gender) 파라미터는 일절 받지 않으며, 결과 객체에도 포함되지 않습니다.
   */
  public static createInputFact(params: CreateMaInputFactParams): MaModuleInputFact {
    const { fourPillars, sajuCore, relationship, spouseProfile, timeDependency } = params;

    const defaultProfile: SpouseProfile = spouseProfile ?? {
      profileType: 'traditional_male',
    };

    const spouse_facts = SpouseProfileAdapter.createSpouseFactLayer({
      fourPillars,
      sajuCore,
      relationship,
      profile: defaultProfile,
    });

    const time_dependency: TimeDependencyInfo =
      timeDependency ??
      sajuCore.time_dependency ??
      relationship.time_dependency ?? {
        requires_hour: false,
        time_dependency: fourPillars.hour === null ? 50 : 20,
        is_missing_hour: fourPillars.hour === null,
        notes: '기본 시간 의존도',
      };

    return {
      four_pillars: fourPillars,
      day_stem: sajuCore.day_stem,
      day_element: sajuCore.day_element,
      five_elements: sajuCore.five_elements,
      ten_gods: sajuCore.ten_gods,
      day_master_strength: sajuCore.day_master_strength,
      rootings: sajuCore.rootings,
      emergences: sajuCore.emergences,
      palaces: sajuCore.palaces,
      flow_channels: sajuCore.flow_channels,
      stem_relations: relationship.stem_relations,
      branch_harmonies: relationship.branch_harmonies,
      branch_clashes: relationship.branch_clashes,
      branch_punishments: relationship.branch_punishments,
      minor_relations: relationship.minor_relations,
      interactions: relationship.interactions,
      spouse_facts,
      time_dependency,
    };
  }

  /**
   * PROVISIONAL 차단 가드:
   * RuleCertainty가 PROVISIONAL 또는 OPEN인 규칙은 핵심 Activation 판정에 사용할 수 없습니다.
   * 오직 CONFIRMED, PHASE5_CONFIRMED 규칙만 핵심 활성화 경로에서 허용됩니다.
   */
  public static isActivationRuleAllowed(certainty: RuleCertainty): boolean {
    return certainty === 'CONFIRMED' || certainty === 'PHASE5_CONFIRMED';
  }

  /**
   * PROVISIONAL 상호작용 차단 가드:
   * EvidenceLevel이 PROVISIONAL인 상호작용은 핵심 활성화 상태(State) 변경에 영향을 주지 못합니다.
   */
  public static isInteractionAllowedForActivation(evidence: EvidenceLevel): boolean {
    return evidence === 'CONFIRMED' || evidence === 'DERIVED';
  }

  /**
   * 안전한 ActivationEvaluation 생성자:
   * PROVISIONAL 등급의 조건으로 ACTIVE/DOMINANT/OVERBURDENED를 판정하려고 시도할 경우,
   * 이를 방어하고 DORMANT 또는 TRIGGERED로 제한하거나 차단합니다.
   */
  public static validateActivationEvaluation(evaluation: MaActivationEvaluation): MaActivationEvaluation {
    if (!this.isActivationRuleAllowed(evaluation.certainty)) {
      if (evaluation.state === 'DOMINANT' || evaluation.state === 'OVERBURDENED' || evaluation.state === 'ACTIVE') {
        return {
          ...evaluation,
          state: 'TRIGGERED', // PROVISIONAL 규칙은 최대 TRIGGERED까지만 허용
          isActivated: true,
          inhibitingFactors: [
            ...evaluation.inhibitingFactors,
            `PROVISIONAL/OPEN 규칙(${evaluation.certainty})은 핵심 Activation(ACTIVE/DOMINANT/OVERBURDENED) 진입이 차단되었습니다.`,
          ],
        };
      }
    }
    return evaluation;
  }
}

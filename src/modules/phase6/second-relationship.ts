/**
 * Second Relationship Layer Engine (Phase 6)
 * 
 * 원칙:
 * 1. Phase 5 Signal 간의 2차 연쇄 작용(Amplified, Conflicting, Mitigated, Transferred)을 도출합니다.
 * 2. 원본 MaSignalSet의 ActivationState는 절대 임의 변경하지 않습니다 (isAppliedToCoreState: false).
 * 3. 확정도(certainty) 및 증거 수준(evidenceLevel)은 초기 PROVISIONAL로 엄격 격리합니다.
 */

import { MaSignalSet } from '../ma/ma-types.js';
import {
  SecondRelationshipAction,
  SecondRelationshipMatch,
} from './phase6-types.js';

export interface SecondRelationshipRule {
  id: string;
  sourceModuleId: string;
  targetModuleId: string;
  action: SecondRelationshipAction;
  affectedAxis: 'pressure' | 'opportunity' | 'volatility' | 'mitigation';
  condition: (signalSet: MaSignalSet) => boolean;
  primaryBasis: string[];
  description: string;
}

export class SecondRelationshipEngine {
  private rules: SecondRelationshipRule[] = [
    // 1. Amplified (강화): 문서마(인성) → 직장마(정관) 기회 확장
    {
      id: 'sr_doc_career_amplified',
      sourceModuleId: 'ma_document',
      targetModuleId: 'ma_career',
      action: 'AMPLIFIED',
      affectedAxis: 'opportunity',
      condition: (set) => {
        const doc = set.signals['ma_document'];
        const career = set.signals['ma_career'];
        return doc !== undefined && career !== undefined && doc.activation.isActivated && career.activation.isActivated;
      },
      primaryBasis: ['관인상생', '인성 자격 및 문서의 사회적 공인'],
      description: '문서마의 활성이 직장마의 기회(opportunity)를 순방향으로 증폭',
    },

    // 2. Conflicting (충돌): 구설마(상관) ↔ 직장마(정관) 마찰 가중
    {
      id: 'sr_gossip_career_conflicting',
      sourceModuleId: 'ma_gossip',
      targetModuleId: 'ma_career',
      action: 'CONFLICTING',
      affectedAxis: 'pressure',
      condition: (set) => {
        const gossip = set.signals['ma_gossip'];
        const career = set.signals['ma_career'];
        return gossip !== undefined && career !== undefined && gossip.activation.isActivated && career.activation.isActivated;
      },
      primaryBasis: ['상관견관', '언행 구설과 조직 규율의 정면 마찰'],
      description: '구설마의 활성이 직장마의 구조적 압박(pressure)을 가중',
    },

    // 3. Mitigated (완화): 귀인마(천을귀인) → 사고마 충격 흡수
    {
      id: 'sr_noble_accident_mitigated',
      sourceModuleId: 'ma_noble',
      targetModuleId: 'ma_accident',
      action: 'MITIGATED',
      affectedAxis: 'mitigation',
      condition: (set) => {
        const noble = set.signals['ma_noble'];
        const accident = set.signals['ma_accident'];
        return noble !== undefined && accident !== undefined && noble.activation.isActivated && accident.activation.isActivated;
      },
      primaryBasis: ['천을귀인 제액', '조력자에 의한 재액 완충'],
      description: '귀인마의 활성이 사고마의 완충 탄력성(mitigation)을 극대화하여 충격 흡수',
    },

    // 4. Transferred (전이): 사업마(식상생재) → 자산마(토 사묘고지) 가치 보존 전이
    {
      id: 'sr_business_asset_transferred',
      sourceModuleId: 'ma_business',
      targetModuleId: 'ma_asset',
      action: 'TRANSFERRED',
      affectedAxis: 'opportunity',
      condition: (set) => {
        const business = set.signals['ma_business'];
        const asset = set.signals['ma_asset'];
        return business !== undefined && asset !== undefined && business.activation.isActivated && asset.activation.isActivated;
      },
      primaryBasis: ['식상생재 유통', '유동 이익의 고정 자산 창고화'],
      description: '사업마의 성취 에너지가 자산마로 흘러들어가 장기 보존 가치로 전이',
    },
  ];

  /**
   * 원본 MaSignalSet을 기반으로 2차 관계 연쇄 목록을 검출합니다.
   * 원본 MaSignalSet 객체 및 내부 상태는 절대 수정되지 않습니다.
   */
  public evaluate(signalSet: MaSignalSet): SecondRelationshipMatch[] {
    const matches: SecondRelationshipMatch[] = [];

    for (const rule of this.rules) {
      if (rule.condition(signalSet)) {
        const src = signalSet.signals[rule.sourceModuleId];
        const tgt = signalSet.signals[rule.targetModuleId];
        const derivedFromFacts = [
          ...(src?.referencedFacts.relationshipsUsed ?? []),
          ...(tgt?.referencedFacts.relationshipsUsed ?? []),
          ...(src?.referencedFacts.tenGods ?? []),
          ...(tgt?.referencedFacts.tenGods ?? []),
        ];

        matches.push({
          id: rule.id,
          sourceModuleId: rule.sourceModuleId,
          targetModuleId: rule.targetModuleId,
          signalsInvolved: [rule.sourceModuleId, rule.targetModuleId],
          action: rule.action,
          evidenceLevel: 'PROVISIONAL', // 초기 상태: PROVISIONAL
          certainty: 'PROVISIONAL',     // 초기 상태: PROVISIONAL
          phaseOrigin: 'PHASE_6',
          primaryBasis: [...rule.primaryBasis],
          derivedFromFacts: Array.from(new Set(derivedFromFacts)),
          affectedAxis: rule.affectedAxis,
          description: rule.description,
          isAppliedToCoreState: false, // 원본 불변 플래그
        });
      }
    }

    return matches;
  }
}

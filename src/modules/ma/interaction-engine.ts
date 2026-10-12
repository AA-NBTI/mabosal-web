/**
 * Ma Interaction Engine (Phase 5 STEP 2)
 * 
 * Ma 신호 간의 상호작용(Interaction) 평가 및 증거 수준(EvidenceLevel) 관리 엔진
 * 
 * 원칙:
 * 1. 반드시 CONFIRMED / DERIVED / PROVISIONAL evidenceLevel을 유지합니다.
 * 2. PROVISIONAL 상호작용은 핵심 Activation 상태(state)를 변경하지 못하도록 엄격히 격리합니다.
 * 3. 5대 Axis의 독립성을 훼손하지 않으며 상호작용 결과를 투명하게 기록합니다.
 */

import {
  EvidenceLevel,
  MaId,
  MaSignalEntity,
  SignalInteractionRecord,
} from './ma-types.js';

export interface InteractionRule {
  id: string;
  sourceModuleId: MaId;
  targetModuleId: MaId;
  interactionType: 'AMPLIFIED' | 'MITIGATED' | 'CONFLICTING' | 'DRAINED';
  evidenceLevel: EvidenceLevel;
  affectedAxis: 'pressure' | 'opportunity' | 'volatility' | 'mitigation';
  condition: (signals: Map<string, MaSignalEntity>) => boolean;
  description: string;
}

export class MaInteractionEngine {
  private rules: InteractionRule[] = [
    // 1. 직장 + 문서 (관인상생): 고전 근거 충분하나 Ma 단위 확장은 DERIVED
    {
      id: 'career_document_synergy',
      sourceModuleId: 'ma_document',
      targetModuleId: 'ma_career',
      interactionType: 'AMPLIFIED',
      evidenceLevel: 'DERIVED',
      affectedAxis: 'opportunity',
      condition: (signals) => {
        const career = signals.get('ma_career');
        const doc = signals.get('ma_document');
        return (
          career !== undefined &&
          doc !== undefined &&
          career.activation.isActivated &&
          doc.activation.isActivated
        );
      },
      description: '문서마(인성)와 직장마(관성)의 관인상생 시너지로 사회적 공인 및 기회 확대',
    },

    // 2. 구설 + 직장 (상관견관): 고전 근거 충분하나 Ma 단위 확장은 DERIVED
    {
      id: 'gossip_career_conflict',
      sourceModuleId: 'ma_gossip',
      targetModuleId: 'ma_career',
      interactionType: 'CONFLICTING',
      evidenceLevel: 'DERIVED',
      affectedAxis: 'pressure',
      condition: (signals) => {
        const career = signals.get('ma_career');
        const gossip = signals.get('ma_gossip');
        return (
          career !== undefined &&
          gossip !== undefined &&
          career.activation.isActivated &&
          gossip.activation.isActivated
        );
      },
      description: '구설마(상관)와 직장마(관성)의 상관견관 대치로 인한 조직 내 마찰 및 압박 가중',
    },

    // 3. 사고 + 귀인 (천을귀인 완충): 고전 근거 충분하나 Ma 단위 확장은 DERIVED
    {
      id: 'accident_noble_mitigation',
      sourceModuleId: 'ma_noble',
      targetModuleId: 'ma_accident',
      interactionType: 'MITIGATED',
      evidenceLevel: 'DERIVED',
      affectedAxis: 'mitigation',
      condition: (signals) => {
        const accident = signals.get('ma_accident');
        const noble = signals.get('ma_noble');
        return (
          accident !== undefined &&
          noble !== undefined &&
          accident.activation.isActivated &&
          noble.activation.isActivated
        );
      },
      description: '귀인마(천을귀인)의 직접 개입으로 사고마의 충격 및 불안정성 완충',
    },

    // 4. 자산 + 재물 (자산 창고화): 실무적 해석 경향에 기반한 PROVISIONAL (핵심 판정 미개입)
    {
      id: 'wealth_asset_accumulation',
      sourceModuleId: 'ma_wealth',
      targetModuleId: 'ma_asset',
      interactionType: 'AMPLIFIED',
      evidenceLevel: 'PROVISIONAL',
      affectedAxis: 'opportunity',
      condition: (signals) => {
        const wealth = signals.get('ma_wealth');
        const asset = signals.get('ma_asset');
        return (
          wealth !== undefined &&
          asset !== undefined &&
          wealth.activation.isActivated &&
          asset.activation.isActivated
        );
      },
      description: '유동 재물의 고정 자산(부동산/문서) 창고 안착 경향 (보조적 해석)',
    },

    // 5. 연애 + 사업 (도화 매력의 대중 영업 전환): 실무적 해석 경향에 기반한 PROVISIONAL (핵심 판정 미개입)
    {
      id: 'romance_business_charisma',
      sourceModuleId: 'ma_romance',
      targetModuleId: 'ma_business',
      interactionType: 'AMPLIFIED',
      evidenceLevel: 'PROVISIONAL',
      affectedAxis: 'opportunity',
      condition: (signals) => {
        const romance = signals.get('ma_romance');
        const business = signals.get('ma_business');
        return (
          romance !== undefined &&
          business !== undefined &&
          romance.activation.isActivated &&
          business.activation.isActivated
        );
      },
      description: '도화 매력의 대중 비즈니스 호감도 전환 경향 (보조적 해석)',
    },
  ];

  /**
   * 신호 맵 간의 모든 유효 상호작용 기록을 도출합니다.
   */
  public evaluateInteractions(signals: Map<string, MaSignalEntity>): SignalInteractionRecord[] {
    const records: SignalInteractionRecord[] = [];

    for (const rule of this.rules) {
      if (rule.condition(signals)) {
        records.push({
          sourceModuleId: rule.sourceModuleId,
          targetModuleId: rule.targetModuleId,
          interactionType: rule.interactionType,
          evidenceLevel: rule.evidenceLevel,
          description: rule.description,
          affectedAxis: rule.affectedAxis,
        });
      }
    }

    return records;
  }

  /**
   * 상호작용 레코드를 기반으로 대상 신호의 축 또는 메타데이터를 안전하게 반영합니다.
   * PROVISIONAL 등급의 상호작용은 핵심 활성화 상태(activation.state)를 절대 변경하지 못합니다.
   */
  public applyInteractions(
    signals: Map<string, MaSignalEntity>,
    interactions: SignalInteractionRecord[]
  ): void {
    for (const record of interactions) {
      // PROVISIONAL은 상태 변경 불개입
      if (record.evidenceLevel === 'PROVISIONAL') {
        continue;
      }

      const target = signals.get(record.targetModuleId);
      if (!target) continue;

      // DERIVED / CONFIRMED 레벨의 완충 효과 반영
      if (record.interactionType === 'MITIGATED' && record.affectedAxis === 'mitigation') {
        target.qualitativeAxis.mitigation = 'VERY_HIGH';
        target.activation.mitigatingFactors.push(record.description);
      } else if (record.interactionType === 'CONFLICTING' && record.affectedAxis === 'pressure') {
        if (target.qualitativeAxis.pressure === 'LOW') {
          target.qualitativeAxis.pressure = 'MODERATE';
        } else if (target.qualitativeAxis.pressure === 'MODERATE') {
          target.qualitativeAxis.pressure = 'HIGH';
        }
        target.activation.inhibitingFactors.push(record.description);
      } else if (record.interactionType === 'AMPLIFIED' && record.affectedAxis === 'opportunity') {
        if (target.qualitativeAxis.opportunity === 'MODERATE') {
          target.qualitativeAxis.opportunity = 'HIGH';
        }
      }
    }
  }
}

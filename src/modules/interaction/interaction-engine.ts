/**
 * InteractionEngine: 마(Ma) 간 상호작용 분석 모듈
 * 
 * 원칙:
 * 개별 마의 계산값은 변경하지 않고, 마 간의 복합 상호작용 신호(시너지, 마찰, 리스크)를
 * 0~100 연속값의 구조화된 데이터로 추출합니다.
 * 
 * 명세서 6번 핵심 산식:
 * 재성 강도 × 감당 부족 × 비겁 분산
 */

import { MaModuleEngineOutput } from '../ma/ma-module-engine.js';
import { MaResult } from '../ma/ma-types.js';

export interface MaInteractionPair {
  sourceMaId: string;
  sourceMaName: string;
  targetMaId: string;
  targetMaName: string;
  interactionType: 'synergy' | 'friction' | 'trigger' | 'mitigation';
  interactionScore: number; // 0 ~ 100 연속값
  description: string;
}

export interface InteractionOutput {
  coreWealthRiskIndex: number; // 명세서 핵심: 재성강도 × 감당부족 × 비겁분산 (0~100)
  interactionPairs: MaInteractionPair[];
  dominantSynergy: MaInteractionPair | null;
  dominantFriction: MaInteractionPair | null;
}

export class InteractionEngine {
  public analyze(maOutput: MaModuleEngineOutput): InteractionOutput {
    const mas = maOutput.ma_results;
    const getScore = (id: string) => mas[id]?.presentation_score ?? 50.0;
    const getAxis = (id: string) => mas[id]?.score_5axis;

    const wealthScore = getScore('ma_wealth');
    const businessScore = getScore('ma_business');
    const careerScore = getScore('ma_career');
    const gossipScore = getScore('ma_gossip');
    const fameScore = getScore('ma_fame');
    const romanceScore = getScore('ma_romance');
    const marriageScore = getScore('ma_marriage');
    const docScore = getScore('ma_document');
    const legalScore = getScore('ma_legal');
    const moveScore = getScore('ma_movement');
    const accidentScore = getScore('ma_accident');
    const nobleScore = getScore('ma_noble');

    const wealthAxis = getAxis('ma_wealth');

    // 1. 명세서 6번 핵심 상호작용: 재성 강도 × 감당 부족 × 비겁 분산
    // 재성 강도 (0~1.0), 감당 부족 (1.0 - 감당력/100), 비겁 분산 (0~1.0)
    const wealthIntensity = (wealthScore / 100.0);
    const capacityDeficit = Math.max(0, 1.0 - (wealthAxis ? (wealthAxis.mitigation + wealthAxis.opportunity) / 200 : 0.5));
    const dispersionRatio = (wealthAxis ? wealthAxis.pressure / 100 : 0.4);

    const rawCoreRisk = wealthIntensity * capacityDeficit * dispersionRatio * 100.0 * 2.5;
    const coreWealthRiskIndex = Math.min(100.0, Math.round(rawCoreRisk * 100) / 100);

    const pairs: MaInteractionPair[] = [];

    // 2. 재물마 ↔ 사업마 (시너지 및 무리한 확장 압박)
    const wealthBizScore = (wealthScore * 0.5) + (businessScore * 0.5);
    pairs.push({
      sourceMaId: 'ma_wealth',
      sourceMaName: '재물마',
      targetMaId: 'ma_business',
      targetMaName: '사업마',
      interactionType: businessScore > wealthScore + 20 ? 'friction' : 'synergy',
      interactionScore: Math.round(wealthBizScore * 100) / 100,
      description: businessScore > wealthScore + 20
        ? '사업 욕구에 비해 재정적 기반이 다소 부족하여 자금 회전 압박 주의'
        : '자금력과 사업 실행력 간의 균형적 시너지 형성',
    });

    // 3. 직장마 ↔ 구설마 (직장 내 대인 마찰/시비)
    const careerFrictionScore = (careerScore * 0.4) + (gossipScore * 0.6);
    if (gossipScore >= 55.0) {
      pairs.push({
        sourceMaId: 'ma_career',
        sourceMaName: '직장마',
        targetMaId: 'ma_gossip',
        targetMaName: '구설마',
        interactionType: 'friction',
        interactionScore: Math.round(careerFrictionScore * 100) / 100,
        description: '조직 활동 중 언행과 대인관계에서 구설/시비 마찰 주의',
      });
    }

    // 4. 직장마 ↔ 명예마 (조직 승진 및 공적 위상 상승)
    const fameSynergyScore = (careerScore * 0.5) + (fameScore * 0.5);
    pairs.push({
      sourceMaId: 'ma_career',
      sourceMaName: '직장마',
      targetMaId: 'ma_fame',
      targetMaName: '명예마',
      interactionType: 'synergy',
      interactionScore: Math.round(fameSynergyScore * 100) / 100,
      description: '직무 전문성과 사회적 공적 인지도의 동반 상승 기운',
    });

    // 5. 연애마 ↔ 결혼마 (단기 호감 vs 장기 결합성)
    const loveGap = Math.abs(romanceScore - marriageScore);
    pairs.push({
      sourceMaId: 'ma_romance',
      sourceMaName: '연애마',
      targetMaId: 'ma_marriage',
      targetMaName: '결혼마',
      interactionType: loveGap >= 25 ? 'friction' : 'synergy',
      interactionScore: Math.round((100 - loveGap) * 100) / 100,
      description: romanceScore > marriageScore + 20
        ? '연애의 설렘은 강하나 제도적 결합(결혼)으로의 전환에는 신중함 요구'
        : '연애의 진전이 자연스럽게 안정적 가정 형성으로 연계되는 흐름',
    });

    // 6. 문서마 ↔ 재판마 (계약 분쟁 vs 권리 방어)
    if (legalScore >= 50.0) {
      pairs.push({
        sourceMaId: 'ma_document',
        sourceMaName: '문서마',
        targetMaId: 'ma_legal',
        targetMaName: '재판마',
        interactionType: docScore >= legalScore ? 'mitigation' : 'friction',
        interactionScore: Math.round(((docScore + legalScore) / 2) * 100) / 100,
        description: docScore >= legalScore
          ? '확실한 문서와 계약 검증이 법적 시비를 방어하는 방패 역할 수행'
          : '계약서 조항 미비로 인한 법적 다툼 가능성에 철저한 검토 필요',
      });
    }

    // 7. 이동마 ↔ 사고마 (급격한 이동에 따른 변동/안전 신호)
    if (moveScore >= 60.0 && accidentScore >= 50.0) {
      pairs.push({
        sourceMaId: 'ma_movement',
        sourceMaName: '이동마',
        targetMaId: 'ma_accident',
        targetMaName: '사고마',
        interactionType: 'trigger',
        interactionScore: Math.round(((moveScore + accidentScore) / 2) * 100) / 100,
        description: '장거리 이동, 출장, 운전 시 각별한 주의와 여유 있는 일정 요구',
      });
    }

    // 8. 귀인마의 전반적 완화 작용
    if (nobleScore >= 65.0) {
      pairs.push({
        sourceMaId: 'ma_noble',
        sourceMaName: '귀인마',
        targetMaId: 'ma_career',
        targetMaName: '직장/사업 전반',
        interactionType: 'mitigation',
        interactionScore: nobleScore,
        description: '위기나 갈등 국면에서 조력자와 윗사람의 지원으로 난관 극복',
      });
    }

    const synergies = pairs.filter(p => p.interactionType === 'synergy' || p.interactionType === 'mitigation');
    const frictions = pairs.filter(p => p.interactionType === 'friction' || p.interactionType === 'trigger');

    const dominantSynergy = synergies.sort((a, b) => b.interactionScore - a.interactionScore)[0] || null;
    const dominantFriction = frictions.sort((a, b) => b.interactionScore - a.interactionScore)[0] || null;

    return {
      coreWealthRiskIndex,
      interactionPairs: pairs,
      dominantSynergy,
      dominantFriction,
    };
  }
}

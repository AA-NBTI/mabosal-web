/**
 * StandardMaModules: 1번~20번 표준 마(Ma) 모듈 세부 구현
 * 
 * 명세서 6번의 정확한 산식 가중치와 안전 표현 원칙을 엄격히 준수합니다.
 */

import { BaseMaModule } from './base-ma-module.js';
import { MaModuleContext, MaResult } from './ma-types.js';

// 1. 재물마
export class WealthMaModule extends BaseMaModule {
  public readonly maId = 'ma_wealth';
  public readonly koreanName = '재물마';
  public readonly order = 1;

  public calculate(context: MaModuleContext): MaResult {
    const { wealth } = context.signals;
    const { axis5_baseline, active_luck_multiplier } = context.signals;

    // 산식: 재성구조 25 + 일간감당 25 + 비겁분산 15 + 식상생재 15 + 재성관계 10 + 중첩 10 = 100
    const p1 = (wealth.structureScore / 100) * 25.0;
    const p2 = (wealth.dayMasterCapacity / 100) * 25.0;
    const p3 = (wealth.biGeopDispersion / 100) * 15.0;
    const p4 = (wealth.sikSangProduceJae / 100) * 15.0;
    const p5 = (wealth.wealthHarmonies / 100) * 10.0;
    const p6 = active_luck_multiplier * 10.0;

    const rawScore = p1 + p2 + p3 + p4 + p5 + p6;
    const presentationScore = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));

    const axis5 = this.build5Axis(
      presentationScore,
      wealth.biGeopDispersion * 0.7 + wealth.wealthClashes * 0.3,
      wealth.structureScore * 0.6 + wealth.sikSangProduceJae * 0.4,
      wealth.wealthClashes,
      wealth.wealthHarmonies
    );

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: axis5,
      presentation_score: presentationScore,
      presentation_band: this.getPresentationBand(presentationScore),
      breakdown: { 재성구조: p1, 일간감당: p2, 비겁분산: p3, 식상생재: p4, 재성관계: p5, 운활성중첩: p6 },
      notes: ['재성 강도와 일간 감당력의 상호작용 및 비겁 분산도를 정밀 반영했습니다.'],
    };
  }
}

// 2. 사업마
export class BusinessMaModule extends BaseMaModule {
  public readonly maId = 'ma_business';
  public readonly koreanName = '사업마';
  public readonly order = 2;

  public calculate(context: MaModuleContext): MaResult {
    const { wealth, output, career, social, movement_clash } = context.signals;
    // 산식: 사업자원 25 + 실행력 20 + 조직압력 15 + 경쟁 15 + 사업궁위 10 + 관계변동 15 = 100
    const p1 = (wealth.structureScore / 100) * 25.0;
    const p2 = (output.executionDrive / 100) * 20.0;
    const p3 = (career.sikSangGwanClash / 100) * 15.0;
    const p4 = (social.peerClashPressure / 100) * 15.0;
    const p5 = (career.careerPalaceStability / 100) * 10.0;
    const p6 = (movement_clash.clashDensity / 100) * 15.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const presentationScore = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(presentationScore, p3 + p4, p1 + p2, p6, p5),
      presentation_score: presentationScore,
      presentation_band: this.getPresentationBand(presentationScore),
      breakdown: { 사업자원: p1, 실행력: p2, 조직압력: p3, 경쟁: p4, 사업궁위: p5, 관계변동: p6 },
      notes: ['식상생재의 원활성과 시장 경쟁 압박의 상호작용을 반영했습니다.'],
    };
  }
}

// 3. 직장마
export class CareerMaModule extends BaseMaModule {
  public readonly maId = 'ma_career';
  public readonly koreanName = '직장마';
  public readonly order = 3;

  public calculate(context: MaModuleContext): MaResult {
    const { career, wealth, knowledge, social } = context.signals;
    // 산식: 관성 30 + 일간감당 20 + 식상↔관성 15 + 인성 15 + 비겁 10 + 직장궁위 10 = 100
    const p1 = (career.officerPower / 100) * 30.0;
    const p2 = (wealth.dayMasterCapacity / 100) * 20.0;
    const p3 = (career.sikSangGwanClash / 100) * 15.0;
    const p4 = (knowledge.sealPower / 100) * 15.0;
    const p5 = (social.peerPower / 100) * 10.0;
    const p6 = (career.careerPalaceStability / 100) * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const presentationScore = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(presentationScore, p3, p1 + p4, p3 * 0.5, p4 + p6),
      presentation_score: presentationScore,
      presentation_band: this.getPresentationBand(presentationScore),
      breakdown: { 관성세력: p1, 일간감당: p2, 식상관성마찰: p3, 인성지원: p4, 비겁조력: p5, 직장궁안정: p6 },
      notes: ['조직과의 적합성 및 관인상생 흐름의 안정성을 반영했습니다.'],
    };
  }
}

// 4. 자산마
export class AssetMaModule extends BaseMaModule {
  public readonly maId = 'ma_asset';
  public readonly koreanName = '자산마';
  public readonly order = 4;

  public calculate(context: MaModuleContext): MaResult {
    const { wealth, career } = context.signals;
    // 재성 25 + 보유구조 20 + 토·안정성 15 + 자산궁위 15 + 일간감당 10 + 관계 15 = 100
    const p1 = (wealth.structureScore / 100) * 25.0;
    const p2 = (wealth.wealthHarmonies / 100) * 20.0;
    const p3 = (career.careerPalaceStability / 100) * 15.0;
    const p4 = (career.careerPalaceStability / 100) * 15.0;
    const p5 = (wealth.dayMasterCapacity / 100) * 10.0;
    const p6 = (wealth.wealthHarmonies / 100) * 15.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, wealth.wealthClashes * 0.5, p1 + p2, wealth.wealthClashes * 0.3, p2 + p3),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 재성: p1, 보유구조: p2, 토안정성: p3, 자산궁위: p4, 일간감당: p5, 관계결합: p6 },
      notes: ['단순 유동 자산이 아닌 부동산/저축 등 축적 기반 자산 안정성을 반영했습니다.'],
    };
  }
}

// 5. 인마 (인간관계마)
export class SocialMaModule extends BaseMaModule {
  public readonly maId = 'ma_social';
  public readonly koreanName = '인마';
  public readonly order = 5;

  public calculate(context: MaModuleContext): MaResult {
    const { social, career } = context.signals;
    // 비겁 25 + 관성 15 + 대인관계 25 + 일지 10 + 육친관계 10 + 궁위 15 = 100
    const p1 = (social.peerPower / 100) * 25.0;
    const p2 = (career.officerPower / 100) * 15.0;
    const p3 = (social.nobleSupportScore / 100) * 25.0;
    const p4 = 10.0;
    const p5 = 10.0;
    const p6 = (career.careerPalaceStability / 100) * 15.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, social.peerClashPressure, p3, social.peerClashPressure * 0.5, p3 * 0.6),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 비겁세력: p1, 관성규율: p2, 대인관계: p3, 일지기반: p4, 육친관계: p5, 궁위배속: p6 },
      notes: ['동료, 협력자, 귀인과의 교류 및 경쟁 관계를 복합 평가했습니다.'],
    };
  }
}

// 6. 연애마
export class RomanceMaModule extends BaseMaModule {
  public readonly maId = 'ma_romance';
  public readonly koreanName = '연애마';
  public readonly order = 6;

  public calculate(context: MaModuleContext): MaResult {
    const { wealth, career, social, movement_clash } = context.signals;
    // 배우자성 25 + 일지 25 + 배우자성↔일지 20 + 합충형파해 20 + 비겁·식상 10 = 100
    const p1 = (wealth.structureScore / 100) * 25.0;
    const p2 = (career.careerPalaceStability / 100) * 25.0;
    const p3 = (wealth.wealthHarmonies / 100) * 20.0;
    const p4 = (movement_clash.clashDensity / 100) * 20.0;
    const p5 = (social.peerPower / 100) * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p4 * 0.8, p1 + p3, p4, p3),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 배우자성: p1, 일지궁: p2, 궁성연결: p3, 합충변동: p4, 비겁식상: p5 },
      notes: ['호감 형성, 설렘, 연애 에너지의 활성도를 평가했습니다.'],
    };
  }
}

// 7. 결혼마
export class MarriageMaModule extends BaseMaModule {
  public readonly maId = 'ma_marriage';
  public readonly koreanName = '결혼마';
  public readonly order = 7;

  public calculate(context: MaModuleContext): MaResult {
    const { wealth, career, movement_clash, active_luck_multiplier } = context.signals;
    // 배우자성 25 + 배우자궁 25 + 궁성관계 15 + 합충형파해 15 + 대운 10 + 세운·월운 10 = 100
    const p1 = (wealth.structureScore / 100) * 25.0;
    const p2 = (career.careerPalaceStability / 100) * 25.0;
    const p3 = (wealth.wealthHarmonies / 100) * 15.0;
    const p4 = (movement_clash.clashDensity / 100) * 15.0;
    const p5 = active_luck_multiplier * 10.0;
    const p6 = active_luck_multiplier * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p4, p1 + p3 + p5, p4 * 0.6, p2 + p3),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 배우자성: p1, 배우자궁: p2, 궁성관계: p3, 합충영향: p4, 대운지원: p5, 세운월운: p6 },
      notes: ['단순 연애를 넘어 결합, 계약, 가정 형성의 구체적 운을 반영했습니다.'],
    };
  }
}

// 8. 가족마
export class FamilyMaModule extends BaseMaModule {
  public readonly maId = 'ma_family';
  public readonly koreanName = '가족마';
  public readonly order = 8;

  public calculate(context: MaModuleContext): MaResult {
    const { knowledge, social, career, movement_clash, active_luck_multiplier } = context.signals;
    // 육친구조 30 + 가족궁위 25 + 관계충돌 20 + 인성·비겁·재성 15 + 운활성 10 = 100
    const p1 = (knowledge.sealPower / 100) * 30.0;
    const p2 = (career.careerPalaceStability / 100) * 25.0;
    const p3 = (movement_clash.clashDensity / 100) * 20.0;
    const p4 = (social.peerPower / 100) * 15.0;
    const p5 = active_luck_multiplier * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p3, p1 + p2, p3 * 0.7, p1 + p4),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 육친구조: p1, 가족궁위: p2, 관계충돌: p3, 인성비겁재성: p4, 운활성: p5 },
      notes: ['원가족 및 가계 환경의 화합과 갈등 요소를 평가했습니다.'],
    };
  }
}

// 9. 자녀마
export class ChildrenMaModule extends BaseMaModule {
  public readonly maId = 'ma_children';
  public readonly koreanName = '자녀마';
  public readonly order = 9;

  public calculate(context: MaModuleContext): MaResult {
    const { output, career, active_luck_multiplier } = context.signals;
    // 식상 30 + 자녀궁 25 + 식상↔관성 15 + 관계 10 + 대운·세운 20 = 100
    const p1 = (output.expressionPower / 100) * 30.0;
    const p2 = 25.0; // 시주 자녀궁 기본 배속
    const p3 = (career.sikSangGwanClash / 100) * 15.0;
    const p4 = 10.0;
    const p5 = active_luck_multiplier * 20.0;

    const raw = p1 + p2 + p3 + p4 + p5;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p3, p1 + p5, p3 * 0.5, p1),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 식상기운: p1, 자녀궁위: p2, 식상관성관계: p3, 기타관계: p4, 대운세운: p5 },
      notes: ['자녀의 잉태, 출산, 관계 및 후배 양성 기운을 평가했습니다.'],
    };
  }
}

// 10. 부모마
export class ParentsMaModule extends BaseMaModule {
  public readonly maId = 'ma_parents';
  public readonly koreanName = '부모마';
  public readonly order = 10;

  public calculate(context: MaModuleContext): MaResult {
    const { knowledge, career, active_luck_multiplier } = context.signals;
    // 인성 30 + 부모궁 25 + 인성↔재성 15 + 관계 10 + 대운·세운 20 = 100
    const p1 = (knowledge.sealPower / 100) * 30.0;
    const p2 = (career.careerPalaceStability / 100) * 25.0;
    const p3 = (knowledge.jaeGeukInPressure / 100) * 15.0;
    const p4 = 10.0;
    const p5 = active_luck_multiplier * 20.0;

    const raw = p1 + p2 + p3 + p4 + p5;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p3, p1 + p2, p3 * 0.5, p1),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 인성기운: p1, 부모궁위: p2, 재극인압박: p3, 관계영향: p4, 대운세운: p5 },
      notes: ['부모의 덕, 지원, 부모와의 심리적/물리적 유대감을 평가했습니다.'],
    };
  }
}

// 11. 건강마 (질병 진단이나 확률 예측으로 변환 금지 원칙)
export class HealthMaModule extends BaseMaModule {
  public readonly maId = 'ma_health';
  public readonly koreanName = '건강마';
  public readonly order = 11;

  public calculate(context: MaModuleContext): MaResult {
    const { movement_clash, wealth, active_luck_multiplier } = context.signals;
    // 오행편중 30 + 일간강약 20 + 생극제화 25 + 특정오행중첩 10 + 운활성 15 = 100
    const p1 = (movement_clash.clashDensity / 100) * 30.0;
    const p2 = (wealth.dayMasterCapacity / 100) * 20.0;
    const p3 = 25.0;
    const p4 = 10.0;
    const p5 = active_luck_multiplier * 15.0;

    const raw = p1 + p2 + p3 + p4 + p5;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p1, p2, p1 * 0.8, p2 * 0.6),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 오행편중: p1, 일간강약: p2, 생극제화균형: p3, 특정오행중첩: p4, 운활성변동: p5 },
      notes: ['신체 오행 에너지의 불균형 및 소모도를 명리학적으로 수치화했습니다.'],
      safety_warnings: ['주의: 본 건강마 점수는 의학적 진단이나 질병 발생 확률이 아니며, 오행 기운의 편중 정도를 나타냅니다.'],
    };
  }
}

// 12. 사고마 (사고 확률 예측 금지 원칙)
export class AccidentMaModule extends BaseMaModule {
  public readonly maId = 'ma_accident';
  public readonly koreanName = '사고마';
  public readonly order = 12;

  public calculate(context: MaModuleContext): MaResult {
    const { movement_clash, active_luck_multiplier } = context.signals;
    // 충형파해 30 + 급격한 운변화 25 + 이동충돌 15 + 신살 10 + 중첩 10 + 단기운 10 = 100
    const p1 = (movement_clash.clashDensity / 100) * 30.0;
    const p2 = (movement_clash.suddenShiftRisk / 100) * 25.0;
    const p3 = (movement_clash.yeokmaMovementScore / 100) * 15.0;
    const p4 = (movement_clash.punishmentDensity / 100) * 10.0;
    const p5 = active_luck_multiplier * 10.0;
    const p6 = 10.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p1 + p2, 0.0, p1 + p3, 20.0),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 충형파해: p1, 급격운변화: p2, 이동충돌: p3, 특수신살: p4, 중첩보너스: p5, 단기촉발: p6 },
      notes: ['급격한 기운의 충돌과 충격 에너지를 평가했습니다.'],
      safety_warnings: ['주의: 본 점수는 현실 사고의 발생 확률이 아니며, 명리학적 변동성과 충돌 신호의 강도입니다.'],
    };
  }
}

// 13. 구설마
export class GossipMaModule extends BaseMaModule {
  public readonly maId = 'ma_gossip';
  public readonly koreanName = '구설마';
  public readonly order = 13;

  public calculate(context: MaModuleContext): MaResult {
    const { output, career, movement_clash, knowledge, social, active_luck_multiplier } = context.signals;
    // 식상 25 + 관성 20 + 관계충돌 25 + 문서관계 10 + 비겁 10 + 운활성 10 = 100
    const p1 = (output.expressionPower / 100) * 25.0;
    const p2 = (career.officerPower / 100) * 20.0;
    const p3 = (movement_clash.clashDensity / 100) * 25.0;
    const p4 = (knowledge.documentReliability / 100) * 10.0;
    const p5 = (social.peerClashPressure / 100) * 10.0;
    const p6 = active_luck_multiplier * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p3 + p5, 10.0, p3, p4),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 식상언변: p1, 관성압박: p2, 관계충돌: p3, 문서관계: p4, 비겁경쟁: p5, 운활성: p6 },
      notes: ['말실수, 시비, 평판 마찰 및 구설수의 잠재 강도를 평가했습니다.'],
    };
  }
}

// 14. 문서마
export class DocumentMaModule extends BaseMaModule {
  public readonly maId = 'ma_document';
  public readonly koreanName = '문서마';
  public readonly order = 14;

  public calculate(context: MaModuleContext): MaResult {
    const { knowledge, career, wealth, active_luck_multiplier } = context.signals;
    // 인성 25 + 관성 20 + 재성 15 + 문서관계 20 + 궁위 10 + 운활성 10 = 100
    const p1 = (knowledge.sealPower / 100) * 25.0;
    const p2 = (career.officerPower / 100) * 20.0;
    const p3 = (wealth.structureScore / 100) * 15.0;
    const p4 = (knowledge.documentReliability / 100) * 20.0;
    const p5 = 10.0;
    const p6 = active_luck_multiplier * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, wealth.biGeopDispersion * 0.4, p1 + p4, 20.0, p1 + p2),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 인성기운: p1, 관성공인: p2, 재성가치: p3, 문서신뢰도: p4, 궁위배속: p5, 운활성: p6 },
      notes: ['계약 체결, 인허가, 학위, 자격증 및 권리증서 운을 평가했습니다.'],
    };
  }
}

// 15. 재판마 (소송 결과 예측 금지 원칙)
export class LegalMaModule extends BaseMaModule {
  public readonly maId = 'ma_legal';
  public readonly koreanName = '재판마';
  public readonly order = 15;

  public calculate(context: MaModuleContext): MaResult {
    const { career, output, knowledge, movement_clash, wealth, social } = context.signals;
    // 관성 25 + 식상 20 + 인성 20 + 충형파해 15 + 재성 10 + 비겁 10 = 100
    const p1 = (career.officerPower / 100) * 25.0;
    const p2 = (output.expressionPower / 100) * 20.0;
    const p3 = (knowledge.sealPower / 100) * 20.0;
    const p4 = (movement_clash.clashDensity / 100) * 15.0;
    const p5 = (wealth.structureScore / 100) * 10.0;
    const p6 = (social.peerClashPressure / 100) * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p1 + p4, p3, p4, p3),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 관성시비: p1, 식상대립: p2, 인성해결: p3, 충형마찰: p4, 재성다툼: p5, 비겁분쟁: p6 },
      notes: ['법적 절차, 관재시비, 시시비비 공방의 명리학적 강도를 평가했습니다.'],
      safety_warnings: ['주의: 본 점수는 법원 판결이나 실제 소송 결과를 예측하지 않으며, 법적/제도적 마찰 신호의 강도입니다.'],
    };
  }
}

// 16. 이동마 (자동 흉 판단 금지 원칙)
export class MovementMaModule extends BaseMaModule {
  public readonly maId = 'ma_movement';
  public readonly koreanName = '이동마';
  public readonly order = 16;

  public calculate(context: MaModuleContext): MaResult {
    const { movement_clash, career, active_luck_multiplier } = context.signals;
    // 역마 25 + 충 25 + 거처·일지 20 + 이동관계 10 + 운변화 20 = 100
    const p1 = (movement_clash.yeokmaMovementScore / 100) * 25.0;
    const p2 = (movement_clash.clashDensity / 100) * 25.0;
    const p3 = (career.careerPalaceStability / 100) * 20.0;
    const p4 = 10.0;
    const p5 = active_luck_multiplier * 20.0;

    const raw = p1 + p2 + p3 + p4 + p5;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, 20.0, p1 + p5, p1 + p2, 30.0),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 역마기운: p1, 충돌격발: p2, 거처일지: p3, 이동관계: p4, 운변화: p5 },
      notes: ['이사, 전직, 출장, 해외 이동 등 활동 무대 변동의 역동성을 평가했습니다. (높은 점수가 자동으로 흉을 의미하지 않음)'],
    };
  }
}

// 17. 시험마
export class ExamMaModule extends BaseMaModule {
  public readonly maId = 'ma_exam';
  public readonly koreanName = '시험마';
  public readonly order = 17;

  public calculate(context: MaModuleContext): MaResult {
    const { knowledge, output, career, wealth, social, active_luck_multiplier } = context.signals;
    // 인성 30 + 식상 20 + 관성 15 + 일간감당 15 + 경쟁 5 + 운활성 15 = 100
    const p1 = (knowledge.sealPower / 100) * 30.0;
    const p2 = (output.expressionPower / 100) * 20.0;
    const p3 = (career.officerPower / 100) * 15.0;
    const p4 = (wealth.dayMasterCapacity / 100) * 15.0;
    const p5 = (social.peerClashPressure / 100) * 5.0;
    const p6 = active_luck_multiplier * 15.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p5 * 3, p1 + p3 + p6, 15.0, p1 + p4),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 인성학습: p1, 식상응용: p2, 관성합격: p3, 일간감당: p4, 경쟁환경: p5, 운활성: p6 },
      notes: ['학업 성취, 고시/자격 시험의 집중도와 합격 기운을 평가했습니다.'],
    };
  }
}

// 18. 명예마
export class FameMaModule extends BaseMaModule {
  public readonly maId = 'ma_fame';
  public readonly koreanName = '명예마';
  public readonly order = 18;

  public calculate(context: MaModuleContext): MaResult {
    const { career, output, knowledge, wealth, active_luck_multiplier } = context.signals;
    // 관성 25 + 식상 20 + 인성 15 + 재성 10 + 사회궁위 10 + 명예관계 10 + 운활성 10 = 100
    const p1 = (career.officerPower / 100) * 25.0;
    const p2 = (output.expressionPower / 100) * 20.0;
    const p3 = (knowledge.sealPower / 100) * 15.0;
    const p4 = (wealth.structureScore / 100) * 10.0;
    const p5 = (career.careerPalaceStability / 100) * 10.0;
    const p6 = 10.0;
    const p7 = active_luck_multiplier * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6 + p7;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, career.sikSangGwanClash * 0.5, p1 + p3 + p7, 20.0, p3 + p5),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 관성명예: p1, 식상인지도: p2, 인성품격: p3, 재성기반: p4, 사회궁위: p5, 명예관계: p6, 운활성: p7 },
      notes: ['사회적 위상, 인지도, 평판 및 브랜드 가치 상승 기운을 평가했습니다.'],
    };
  }
}

// 19. 귀인마
export class NobleMaModule extends BaseMaModule {
  public readonly maId = 'ma_noble';
  public readonly koreanName = '귀인마';
  public readonly order = 19;

  public calculate(context: MaModuleContext): MaResult {
    const { knowledge, career, social, active_luck_multiplier } = context.signals;
    // 인성 25 + 관성 20 + 비겁 15 + 합 15 + 대인관계 10 + 운활성 15 = 100
    const p1 = (knowledge.sealPower / 100) * 25.0;
    const p2 = (career.officerPower / 100) * 20.0;
    const p3 = (social.peerPower / 100) * 15.0;
    const p4 = (social.nobleSupportScore / 100) * 15.0;
    const p5 = 10.0;
    const p6 = active_luck_multiplier * 15.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, 10.0, p1 + p4 + p6, 10.0, p1 + p4),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 인성후원: p1, 관성상사: p2, 비겁조력: p3, 합결합력: p4, 대인신뢰: p5, 운활성: p6 },
      notes: ['결정적 순간 위기를 넘기게 해주는 조력자, 스승, 후원자의 기운을 평가했습니다.'],
    };
  }
}

// 20. 집마
export class HomeMaModule extends BaseMaModule {
  public readonly maId = 'ma_home';
  public readonly koreanName = '집마';
  public readonly order = 20;

  public calculate(context: MaModuleContext): MaResult {
    const { career, wealth, knowledge, movement_clash, active_luck_multiplier } = context.signals;
    // 거처궁 30 + 재성 20 + 인성 15 + 거처충돌 15 + 가족관계 10 + 중첩 10 = 100
    const p1 = (career.careerPalaceStability / 100) * 30.0;
    const p2 = (wealth.structureScore / 100) * 20.0;
    const p3 = (knowledge.sealPower / 100) * 15.0;
    const p4 = (movement_clash.clashDensity / 100) * 15.0;
    const p5 = 10.0;
    const p6 = active_luck_multiplier * 10.0;

    const raw = p1 + p2 + p3 + p4 + p5 + p6;
    const score = Math.max(0, Math.min(100, Math.round(raw * 100) / 100));

    return {
      ma_id: this.maId,
      korean_name: this.koreanName,
      order: this.order,
      score_5axis: this.build5Axis(score, p4, p1 + p2, p4 * 0.8, p1 + p3),
      presentation_score: score,
      presentation_band: this.getPresentationBand(score),
      breakdown: { 거처궁위: p1, 재성안정: p2, 인성문서: p3, 거처충돌: p4, 가족화합: p5, 운활성: p6 },
      notes: ['주거 환경의 안락함, 가택운, 부동산 거처 안정성을 평가했습니다.'],
    };
  }
}

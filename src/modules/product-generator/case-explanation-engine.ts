/**
 * src/modules/product-generator/case-explanation-engine.ts
 * 
 * Phase 61: 마보살 전용 사건 설명 프로토콜 엔진 (Case Explanation Engine)
 * 
 * 마·살 또는 위험 작용을 다룰 때 다음 8단계 프로토콜을 구현:
 * GENERAL MEANING → SIMILAR REAL-WORLD CASE → RISK AWARENESS →
 * UNDERSTANDING → PERSONAL APPLICATION → MITIGATION → PRESCRIPTION → STABILIZATION
 * 
 * 원칙:
 * - 미래 사건을 단정적으로 예언하지 않는다.
 * - 일반화된 사회적/현실적 사례를 통해 명리적 메커니즘을 객관적으로 이해시킨다.
 * - 의료/법률/투자 단정 배제 가드를 엄격히 준수한다.
 */

import { CaseExplanationProtocol, ProblemDomain, UserProblemInput } from './types.js';
import { ModularId, ModularOutput } from '../modular/types.js';

export class CaseExplanationEngine {
  /**
   * 문제 도메인과 모듈 실행 결과를 바탕으로 8단계 사건 설명 프로토콜 생성
   */
  public generateProtocol(
    domain: ProblemDomain,
    input: UserProblemInput,
    executedModules: Record<ModularId, ModularOutput>
  ): CaseExplanationProtocol {
    switch (domain) {
      case 'LOVE':
        return this.buildLoveProtocol(input, executedModules);
      case 'BUSINESS':
        return this.buildBusinessProtocol(input, executedModules);
      case 'JOB':
        return this.buildJobProtocol(input, executedModules);
      case 'MONEY':
        return this.buildMoneyProtocol(input, executedModules);
      case 'HEALTH':
        return this.buildHealthProtocol(input, executedModules);
      case 'RELATIONSHIP':
      case 'MARRIAGE':
      case 'GENERAL':
      default:
        return this.buildGeneralProtocol(domain, input, executedModules);
    }
  }

  // --------------------------------------------------------------------------
  // 도메인별 8단계 프로토콜 빌더
  // --------------------------------------------------------------------------

  private getConciseReference(input: UserProblemInput, defaultTerm: string): string {
    if (input.selectedSituation && input.selectedSituation.trim().length > 0) {
      return `[${input.selectedSituation.trim()}]`;
    }
    const raw = (input.currentEvent || input.userTrouble || '').trim();
    if (!raw || raw.length > 30) {
      return defaultTerm;
    }
    return `"${raw}"`;
  }

  private buildLoveProtocol(
    input: UserProblemInput,
    modules: Record<ModularId, ModularOutput>
  ): CaseExplanationProtocol {
    return {
      generalMeaning:
        '명리학에서 배우자궁(일지)의 충(沖)이나 원진(怨嗔), 또는 화열(火熱)한 세운의 충돌은 상대방과의 소통 에너지가 급격히 과열되어 사소한 오해가 결별이나 연락 두절로 비화되는 현상을 의미합니다.',
      similarRealWorldCase:
        '수많은 상담 사례에서 서로 깊이 사랑하던 연인들이 특정 시기에 "성격 차이"라며 돌연 헤어지는 경우가 많습니다. 이는 상대가 싫어져서라기보다, 양측의 감정 필터가 일시적으로 왜곡되어 작은 단어 하나에도 극심한 거부감을 느끼는 심리적 과열기(Burnout)에 진입했기 때문입니다.',
      riskAwareness:
        '이 시기에 가장 치명적인 착각은 "진심 어린 장문의 글로 설득하면 상대가 돌아올 것"이라는 조급함입니다. 불붙은 장작에 부채질을 하면 불길만 거세질 뿐이며, 자존심 대결이나 추궁은 영구적 단절을 부릅니다.',
      understanding:
        '기운의 작용 기전상 현재는 두 사람 사이의 완충 지대가 사라진 무방비 상태입니다. 상대방의 차가운 침묵이나 밀어냄은 당신에 대한 미움이 아니라 자신을 보호하려는 방어기제입니다.',
      personalApplication:
        `사용자님의 상황(${this.getConciseReference(input, '현재 연애 및 관계 고민')}) 역시 이와 동일한 에너지 충돌의 궤적을 밟고 있습니다. 원국과 세운의 마찰이 관계의 취약점을 집중 공격하고 있는 형국입니다.`,
      mitigation:
        '최우선 리스크 완화책은 "완전한 침묵과 거리 두기"입니다. 최소 2~4주간 일체의 연락을 중단하고 상대방과 자신의 감정 온도가 식을 수 있는 물리적·심리적 안전 거리를 확보해야 합니다.',
      prescription:
        '1) 모든 SNS 염탐 및 간접 연락 금지. 2) 상대의 반응에 일희일비하지 말고 자신의 일상 루틴 회복에 집중. 3) 감정이 가라앉은 쿨링 피리어드 이후 담백하고 부담 없는 안부로 재접근 시도.',
      stabilization:
        '인연의 끈은 억지로 당긴다고 이어지지 않습니다. 지금의 단절을 영원한 파국으로 받아들이지 말고, 왜곡된 에너지가 정상 궤도로 복귀하는 정화의 시간으로 삼으십시오.',
    };
  }

  private buildBusinessProtocol(
    input: UserProblemInput,
    modules: Record<ModularId, ModularOutput>
  ): CaseExplanationProtocol {
    return {
      generalMeaning:
        '사업에서 칠살이나 충·형의 작용은 기존의 사업 방식이나 계약 관계의 누적된 긴장감이 표면화되는 시기로, 무리한 사세 확장보다는 질서 있는 내부 정비와 계약 관계 재검토가 필요한 국면을 의미합니다.',
      similarRealWorldCase:
        '시장 환경 변화나 파트너십 이견으로 인해 현금 흐름이 경색되거나 계약상 마찰을 겪는 기업·스타트업·자영업 사례가 많습니다. 이는 과도한 낙관주의를 버리고 냉정한 계약/회계 검토를 요구하는 계기가 됩니다.',
      riskAwareness:
        '"조금만 버티면 다 해결될 것"이라는 감정적 기대나 즉흥적 대응은 법적·재정적 리스크를 키웁니다. 분쟁 시 감정싸움으로 비화되지 않도록 철저한 문서화가 필수적입니다.',
      understanding:
        '명리학상 공격적인 확장보다 손실 관리와 보수적인 대응에 무게를 두는 해석이 적합합니다. 다만 실제 법률 소송 및 경영 판단은 법률·세무 전문가의 검토를 거쳐 독립적으로 수행되어야 합니다.',
      personalApplication:
        `사용자님의 사업 상황(${this.getConciseReference(input, '현재의 사업 및 계약 상황')})은 명리상 내부 결속과 계약 관계의 투명성을 엄격히 다져야 할 시기임을 시사합니다.`,
      mitigation:
        '고정비를 점검하고, 파트너 및 거래처와의 이해관계는 감정이 아닌 객관적 계약 서류를 기준으로 차분히 조율하십시오.',
      prescription:
        '1) 신규 확장 및 무리한 계약 체결 보류. 2) 공식 회계/법률 전문가 자문을 통한 리스크 실사. 3) 상호 합의에 기반한 단계적 대안 모색.',
      stabilization:
        '위기는 곧 체질 개선의 기회이기도 합니다. 무리수를 두지 않고 원칙을 지킬 때 기업과 개인의 지속 가능성이 확보됩니다.',
    };
  }

  private buildJobProtocol(
    input: UserProblemInput,
    modules: Record<ModularId, ModularOutput>
  ): CaseExplanationProtocol {
    return {
      generalMeaning:
        '직장운에서 상관견관(傷官見官)이나 지지 충(沖), 역마(驛馬)의 발동은 조직의 룰에 대한 반발심과 상사와의 불화, 그리고 이직 충동이 통제하기 어려울 정도로 솟구치는 전환기를 의미합니다.',
      similarRealWorldCase:
        '직장에서 인정받던 유능한 팀장이 상사와의 노선 갈등이나 인사 불이익에 격분하여 대책 없이 사표를 던지고 나온 뒤 긴 공백기와 재정적 곤경을 겪는 사례가 빈번합니다. 감정이 이성을 앞설 때 조직 내 고립이 발생합니다.',
      riskAwareness:
        '충동적인 사직서 제출이나 공개적인 상사 비판은 조직 사회에서 가장 큰 레퍼런스 손실을 초래합니다. "나가면 어디든 갈 데가 있겠지"라는 안일한 생각은 치명적 오판이 될 수 있습니다.',
      understanding:
        '내면의 명예욕과 표현 욕구가 조직이라는 규격화된 틀과 정면 충돌하고 있는 상태입니다. 이는 내 역량의 부족이 아니라 조직과의 주파수 불일치에서 기인합니다.',
      personalApplication:
        `사용자님의 직장 고민(${this.getConciseReference(input, '현재의 직장 및 진로 고민')})은 조직 내 에너지 역학이 재편되는 과정에서 발생한 진통입니다.`,
      mitigation:
        '감정적 대응을 100% 절제하고, 모든 업무 지시와 피드백을 문서화하여 객관적 실적 데이터를 확보하십시오. 이직은 반드시 다음 오퍼를 확정한 후 진행해야 합니다.',
      prescription:
        '1) 현 직장에서의 최소한의 프로페셔널 태도 유지. 2) 퇴근 후 포트폴리오 정비 및 외부 네트워크 가동. 3) 내부 분쟁에 제3자 편들기 절대 금지.',
      stabilization:
        '직장은 자아실현의 유일한 장소가 아닙니다. 감정을 분리하고 생계와 경력의 발판으로 차분히 활용하십시오.',
    };
  }

  private buildMoneyProtocol(
    input: UserProblemInput,
    modules: Record<ModularId, ModularOutput>
  ): CaseExplanationProtocol {
    return {
      generalMeaning:
        '재물운에서 겁재나 충·파의 작용은 현금 흐름의 변동성이 확대되는 시기로, 공격적인 자산 증식보다는 자산의 안전한 방어와 손실 최소화가 권장되는 명리학적 기류를 의미합니다.',
      similarRealWorldCase:
        '조급한 마음에 무리한 레버리지나 고수익 유혹에 편승했다가 자산 변동성에 노출되는 사회적 사례가 많습니다. 탐욕과 불안이 이성적인 자산 관리를 방해하는 전형적 상황입니다.',
      riskAwareness:
        '"이번 한 번으로 손실을 모두 만회하겠다"는 식의 추격 매수나 물타기(추가 차입)는 리스크를 기하급수적으로 키울 뿐입니다. 손실 발생 가능성을 인정하고 보수적으로 선을 긋는 태도가 요구됩니다.',
      understanding:
        '명리학상 공격적인 확장보다 손실 관리와 보수적인 대응에 무게를 두는 해석이 적합합니다. 다만 실제 금융 투자 및 자산 처분 결정은 금융 전문가의 조언을 받아 독립적으로 판단해야 합니다.',
      personalApplication:
        `사용자님의 상황(${this.getConciseReference(input, '현재의 재물 및 현금 흐름 상황')})에 대해, 지금은 무리하게 상황을 역전시키려 하기보다 자산 누수 요인을 점검하고 지출을 통제하는 방어적 운용이 절실한 시점입니다.`,
      mitigation:
        '고위험 투자 활동을 자제하고 유동성 및 현금 보유 비중을 안정적으로 확보하십시오. 비공식 금전 거래나 보증은 엄격히 차단해야 합니다.',
      prescription:
        '1) 필수 생계비 중심의 고정 지출 긴축. 2) 무리한 추가 대출 및 파생 투자 중단. 3) 공인된 재무 전문가와의 자산 방어 상담 검토.',
      stabilization:
        '자산의 굴곡은 긴 인생의 한 주기일 뿐입니다. 지금 원금을 지키고 자중하면, 다음 안정기에 다시 기회를 모색할 수 있습니다.',
    };
  }

  private buildHealthProtocol(
    input: UserProblemInput,
    modules: Record<ModularId, ModularOutput>
  ): CaseExplanationProtocol {
    return {
      generalMeaning:
        '명리학에서 오행의 편중이나 특정 신살·충의 중첩은 신체적 에너지의 소모와 피로가 누적되기 쉬운 기후적·에너지적 취약기를 의미합니다. 단, 이는 명리학적 에너지 관점의 주의 신호일 뿐, 특정 질환의 발병이나 수술의 성패를 예단하는 것이 아닙니다.',
      similarRealWorldCase:
        '업무 과중과 심리적 압박감 속에서 몸이 보내는 휴식 신호를 간과하여 일시적인 기력 쇠진이나 건강상 불안을 겪는 경우가 빈번합니다.',
      riskAwareness:
        '명리학적 해석을 의학적 진단과 혼동하거나 민간요법에 의존하여 정규 의료기관의 진료를 소홀히 하는 것은 매우 위험합니다. 건강 이상 징후는 오직 의료 전문가의 진단과 처방을 따라야 합니다.',
      understanding:
        '명리상 해당 시기에 신체적 부담이나 소모를 주의하는 해석이 가능하지만, 실제 질환의 원인 규명과 치료 여부는 전적으로 의료진의 판단 영역입니다. 명리는 심신을 무리하게 몰아붙이지 말라는 생활 태도의 가이드라인을 제공합니다.',
      personalApplication:
        `사용자님의 상황(${this.getConciseReference(input, '현재의 심신 상태')})과 관련하여, 현재는 활동 반경을 넓히기보다 몸과 마음의 휴식을 최우선으로 챙기며 의료진과의 상담을 통해 차분히 건강을 점검해야 할 시기입니다.`,
      mitigation:
        '전문의의 정밀 검진과 소견을 철저히 신뢰하고 따르며, 수면과 영양 섭취를 규칙적으로 유지하십시오.',
      prescription:
        '1) 전문 의료기관 방문 및 전문의와의 상세 상담. 2) 과로와 극심한 스트레스 환경으로부터의 한 걸음 물러섬. 3) 가벼운 심호흡과 휴식으로 긴장 이완.',
      stabilization:
        '불안감에 휩쓸리지 마십시오. 현대 의학의 도움과 함께 자신의 일상 템포를 늦추는 것이 심신의 안정을 되찾는 가장 안전한 길입니다.',
    };
  }

  private buildGeneralProtocol(
    domain: ProblemDomain,
    input: UserProblemInput,
    modules: Record<ModularId, ModularOutput>
  ): CaseExplanationProtocol {
    return {
      generalMeaning:
        '삶의 순환 주기에서 마(魔)와 살(煞)의 작용은 인생의 거친 파도가 몰아치는 시기로, 자신의 중심을 잡지 못하면 주변 환경에 휘둘려 큰 혼란을 겪게 되는 국면을 의미합니다.',
      similarRealWorldCase:
        '예기치 못한 주변의 변화나 사건으로 인해 심리적 공황과 방향성 상실을 겪으며, 주변 사람들과의 불화가 연쇄적으로 터지는 일반화된 위기 상황입니다.',
      riskAwareness:
        '조급하게 상황을 역전시키려 무리수를 두는 것이 가장 큰 함정입니다. 흐린 물은 가만히 두어야 맑아집니다.',
      understanding:
        '기운의 작용 기전상 영원하지 않으며 밀물과 썰물처럼 반드시 주기를 가집니다. 지금의 시련은 불필요한 군더더기를 털어내라는 자연의 신호입니다.',
      personalApplication:
        `사용자님의 사건(${this.getConciseReference(input, '현재 마주하신 사건')})은 삶의 중요한 분기점에서 맞닥뜨린 정화의 관문입니다.`,
      mitigation:
        '모든 중요한 결정의 시점을 뒤로 미루고, 일상의 안정적인 루틴을 지키는 데 주력하십시오.',
      prescription:
        '1) 감정적 발언과 즉흥적 결단 멈추기. 2) 신뢰할 수 있는 멘토와의 냉정한 상황 점검. 3) 내면의 평정을 위한 휴식 확보.',
      stabilization:
        '태풍의 한가운데서 가장 안전한 곳은 태풍의 눈입니다. 요동치는 외부 상황에 반응하지 말고 내면의 평정을 유지하십시오.',
    };
  }
}

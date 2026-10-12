/**
 * src/modules/product-generator/problem-classifier.ts
 * 
 * Phase 61: 사건 / 문제 분류 엔진 (Event / Problem Classifier)
 * 
 * 사용자의 실제 사건, 주 고민, 원하는 질문을 정밀 분석하여
 * 문제 도메인, 긴급도, 핵심 이슈 키워드를 도출하고
 * 필요한 최적 모듈 세트를 동적으로 추천한다.
 */

import { ProblemClassification, ProblemDomain, UserProblemInput } from './types.js';
import { ModularId } from '../modular/types.js';

export class EventProblemClassifier {
  /**
   * 사용자 입력을 바탕으로 사건/문제를 분류하고 적합한 모듈 목록을 추천
   */
  public classify(input: UserProblemInput): ProblemClassification {
    const textCorpus = `${input.currentEvent || ''} ${input.userTrouble || ''} ${input.desiredQuestion || ''}`.toLowerCase();

    // 1. 도메인 판별 (지정값 우선, 없으면 텍스트 분석)
    const detectedDomain = input.targetDomain || this.detectPrimaryDomain(textCorpus);
    const secondaryDomains = this.detectSecondaryDomains(textCorpus, detectedDomain);

    // 2. 긴급도 판별
    const urgencyLevel = this.detectUrgency(textCorpus);

    // 3. 핵심 이슈 키워드 추출
    const keyIssues = this.extractKeyIssues(textCorpus, detectedDomain);

    // 4. 모듈 추천 (문제 중심 조합 알고리즘)
    const recommendedModules = this.recommendModules(detectedDomain, secondaryDomains, textCorpus, urgencyLevel);

    const summaryNote = `[${detectedDomain}] 도메인 중심 위기 분류: 긴급도 [${urgencyLevel}], 핵심 이슈: ${keyIssues.join(', ')}`;

    return {
      primaryDomain: detectedDomain,
      secondaryDomains,
      urgencyLevel,
      keyIssues,
      recommendedModules,
      summaryNote,
    };
  }

  /**
   * 주 도메인 판별
   */
  private detectPrimaryDomain(corpus: string): ProblemDomain {
    if (/헤어|이별|결별|연인|연애|재회|애인|남친|여친|바람|마음식|카톡읽씹/.test(corpus)) return 'LOVE';
    if (/부도|사업|폐업|창업|계약|가맹|투자유치|대표|파트너|동업|지분|법인/.test(corpus)) return 'BUSINESS';
    if (/이직|퇴사|승진|직장|회사|상사|팀장|보직|인사고과|부서/.test(corpus)) return 'JOB';
    if (/투자|손실|사기|빚|대출|돈|재물|현금|주식|코인|부동산|탕진|채무/.test(corpus)) return 'MONEY';
    if (/배우자|결혼|시댁|처가|이혼|가정|양육|부부|가족|부모|자식|형제|집안|어머니|아버지/.test(corpus)) return 'MARRIAGE';
    if (/인간관계|친구|배신|구설|따돌림|동료|시비|싸움/.test(corpus)) return 'RELATIONSHIP';
    if (/수술|병원|질병|건강|암|우울|공황|사고|입원|통증|디스크/.test(corpus)) return 'HEALTH';
    return 'GENERAL';
  }

  /**
   * 보조 연계 도메인 판별 (복합 고민 무손실 다중 탐지)
   */
  private detectSecondaryDomains(corpus: string, primary: ProblemDomain): ProblemDomain[] {
    const secondaries: ProblemDomain[] = [];
    if (primary !== 'LOVE' && /연애|이별|헤어|연인|애인|결별/.test(corpus)) secondaries.push('LOVE');
    if (primary !== 'BUSINESS' && /사업|동업|파트너|계약/.test(corpus)) secondaries.push('BUSINESS');
    if (primary !== 'MONEY' && /돈|빚|손실|금전|투자/.test(corpus)) secondaries.push('MONEY');
    if (primary !== 'RELATIONSHIP' && /사람|동료|친구|갈등|배신|구설/.test(corpus)) secondaries.push('RELATIONSHIP');
    if (primary !== 'JOB' && /직장|일|업무|회사|이직|퇴사/.test(corpus)) secondaries.push('JOB');
    if (primary !== 'MARRIAGE' && /가족|부모|자식|결혼|배우자|집안/.test(corpus)) secondaries.push('MARRIAGE');
    if (primary !== 'HEALTH' && /피로|스트레스|건강|잠|병원|통증/.test(corpus)) secondaries.push('HEALTH');
    return secondaries;
  }

  /**
   * 긴급도 판별
   */
  private detectUrgency(corpus: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (/갑자기|무너|파산|부도|이혼|수술|절체절명|끝났|극단적|극심|위태/.test(corpus)) return 'HIGH';
    if (/고민|갈등|불안|흔들|답답|정체|손해/.test(corpus)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 핵심 이슈 키워드 추출
   */
  private extractKeyIssues(corpus: string, domain: ProblemDomain): string[] {
    const issues: string[] = [];
    if (/파트너|동업/.test(corpus)) issues.push('동업 및 파트너십 갈등');
    if (/급작스런 손실|돈이 새|재물 손실/.test(corpus)) issues.push('급격한 현금 누수');
    if (/연락두절|이별|헤어짐/.test(corpus)) issues.push('관계 단절 및 급격한 소통 붕괴');
    if (/소송|구설|비난/.test(corpus)) issues.push('대인 구설 및 법적 리스크');
    if (/수술|병고|입원/.test(corpus)) issues.push('신체 및 기력의 급격한 쇠약');

    if (issues.length === 0) {
      issues.push(`${domain} 영역의 에너지 불균형`);
    }
    return issues;
  }

  /**
   * 사건·문제에 따른 맞춤 모듈 세트 추천
   * (지시서 7절, 8절 예시와 일치하는 유연한 조합)
   */
  public recommendModules(
    primary: ProblemDomain,
    secondary: ProblemDomain[],
    corpus: string,
    urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  ): ModularId[] {
    const modules = new Set<ModularId>();

    // 1. 도메인별 현실 고민 모듈 배정
    if (primary === 'LOVE') modules.add('LOVE');
    else if (primary === 'BUSINESS') modules.add('BUSINESS');
    else if (primary === 'JOB') modules.add('JOB');
    else if (primary === 'MONEY') modules.add('MONEY');
    else if (primary === 'MARRIAGE') modules.add('MARRIAGE');
    else if (primary === 'RELATIONSHIP') modules.add('RELATIONSHIP');
    else if (primary === 'HEALTH') modules.add('HEALTH');

    for (const sec of secondary) {
      if (sec === 'LOVE') modules.add('LOVE');
      else if (sec === 'BUSINESS') modules.add('BUSINESS');
      else if (sec === 'JOB') modules.add('JOB');
      else if (sec === 'MONEY') modules.add('MONEY');
      else if (sec === 'MARRIAGE') modules.add('MARRIAGE');
      else if (sec === 'RELATIONSHIP') modules.add('RELATIONSHIP');
      else if (sec === 'HEALTH') modules.add('HEALTH');
    }

    // 2. 사주 원국 및 관계/작용 필수 연계 (명리 7대 코어 모듈 기본 실행)
    modules.add('CORE_ORIGINAL'); // 사주 원국 팔자 기본
    modules.add('STRENGTH');      // 일간 강약 및 환경 감당력
    modules.add('GEOKGUK');       // 사회적 격국 및 성취 틀
    modules.add('RELATION');      // 합충형파해
    modules.add('SINSAL');        // 살·귀인

    // 3. 시간축 필수 연계
    modules.add('DAEWUN');
    modules.add('SEUN');

    // 4. 긴급 위기이거나 구조적 질문인 경우 원국, 격국, 강약 및 마 진단 추가
    if (urgency === 'HIGH' || /왜|이유|원인|사주|근본/.test(corpus)) {
      modules.add('CORE_ORIGINAL');
      modules.add('MAGA_DIAGNOSIS');
    }

    // 5. 사업 전면 위기 또는 복합 파탄 사례
    if (primary === 'BUSINESS' && urgency === 'HIGH') {
      modules.add('GEOKGUK');
      modules.add('STRENGTH');
      modules.add('MONEY');
      modules.add('PRESCRIPTION');
    }

    // 6. 처방이나 해결책을 원하거나 긴급 위기일 때 행동 처방 추가
    if (urgency === 'HIGH' || /대응|해결|어떻게|대처|처방|방법|수술|넘길|알고|방안|조언/.test(corpus)) {
      modules.add('PRESCRIPTION');
    }

    return Array.from(modules);
  }
}

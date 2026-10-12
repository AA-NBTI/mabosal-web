/**
 * src/modules/prescription/prescription-synthesizer.ts
 * 
 * PrescriptionSynthesizer (Version 1.0.0)
 * 
 * 목적:
 * "토 과다 = 수/금 + 24시간 + 서면" 식의 획일적인 처방을 개선하여,
 * 원천 명리 근거 + 통합 사건 판단 + 사용자 현실 고민 + 시간축 흐름을 종합한
 * 다차원 맞춤 처방(환경·행동·의사결정·실행 일정)을 생성한다.
 * 
 * 파이프라인:
 * 명리 근거 → 현재 문제 → 보완 목적 → 환경 처방 → 행동 처방 → 의사결정 분석 → 실행 순서
 */

import { FourPillars } from '../../core/types.js';
import { ModularId, ModularOutput } from '../modular/types.js';
import { ProblemDomain, UserProblemInput } from '../product-generator/types.js';
import { AggregatedEventEvidenceResult } from '../event-synthesis/event-evidence-aggregator.js';
import { TimeAxisJudgment } from '../time-axis/time-axis-judgment-engine.js';

export interface DecisionOptionAnalysis {
  optionName: string;
  pros: string;
  risks: string;
  realityCheckConditions: string[];
}

import { protocolRegistry } from './protocols/registry.js';
import { DialogueScriptItem, EmailTemplateItem, OrgCultureCriteria } from './protocols/types.js';

export interface PrescriptionSynthesisResult {
  version: '1.0.0';
  domain: ProblemDomain;
  myeongliBasisRationale: string;
  currentIssueFocus: string;
  remedyObjective: string;
  environmentRemedy: {
    spaceGuidance: string;
    colorTones: string[];
    direction: string;
    materials: string[];
    lightingAndAtmosphere: string;
    lifestyleEnvironment: string;
    activityEnvironment: string;
  };
  behaviorRemedy: {
    corePrinciples: string[];
    mustDoRules: string[];
    mustAvoidRules: string[];
    communicationProtocol: string;
  };
  decisionAnalysis: {
    optionA_maintain: DecisionOptionAnalysis;
    optionB_move: DecisionOptionAnalysis;
    timeAxisAlignment: string;
    firstPriorityAction: string;
  };
  executionRoadmap: {
    priorities: string[];
    shortTermPlan: string[];  // 오늘 ~ 2주간
    midTermPlan: string[];    // 2주 ~ 3개월
    actionChecklist: string[];
    symbolicRemedies: Array<{ title: string; purpose: string; disclaimer: string }>;
  };
  protocolResult?: {
    protocolId: string;
    protocolTitle: string;
    dialogueScript: DialogueScriptItem;
    emailTemplate: EmailTemplateItem;
    orgCultureCriteria: OrgCultureCriteria;
  };
}

export class PrescriptionSynthesizer {
  public readonly version = '1.1.0';

  /**
   * 명리 근거, 사건 통합 증거, 시간축 판단을 융합하여 맞춤 처방 체계 생성
   */
  public synthesize(params: {
    pillars: FourPillars;
    userProblem: UserProblemInput;
    domain: ProblemDomain;
    evidenceResult: AggregatedEventEvidenceResult;
    timeAxis: TimeAxisJudgment;
    executedModules: Record<ModularId, ModularOutput>;
  }): PrescriptionSynthesisResult {
    const { pillars, userProblem, domain, evidenceResult, timeAxis, executedModules } = params;

    // 1. 명리 근거 및 보완 목적 (STRENGTH 모듈 실제 결과 기반 동적 생성)
    const strengthMod = executedModules['STRENGTH'];
    const strengthScore = strengthMod?.data?.score ?? strengthMod?.calculation?.rawMetrics?.score ?? 50;
    const strengthStatus = strengthMod?.data?.status || strengthMod?.judgment?.verdict || '중화';
    const isStrong = strengthScore >= 70 || strengthStatus.includes('강');
    const isWeak = strengthScore < 50 || strengthStatus.includes('약');

    let myeongliBasisRationale = '';
    if (isStrong) {
      myeongliBasisRationale = `일간의 자생력이 견고한 구조(${strengthStatus}, ${strengthScore}점)로 주관과 자립심이 뚜렷하여 외부 압박에 쉽게 흔들리지 않는 장점이 있으나, 조직 내 환경적 변화 및 규율적 긴장 속에서 정면 대립으로 인한 피로도가 누적되기 쉬운 구조입니다.`;
    } else if (isWeak) {
      myeongliBasisRationale = `일간의 세력에 비해 관성·재성의 환경 압박이 큰 신약 구조(${strengthStatus}, ${strengthScore}점)로, 책임감과 완결성 기준은 높으나 주변 환경의 요구와 마찰에 에너지가 빠르게 소진(번아웃)될 수 있어 무작정 버티기보다 확실한 경계선과 완충 장치가 필요한 구조입니다.`;
    } else {
      myeongliBasisRationale = `일간의 세력과 환경이 비교적 균형을 이루는 중화 구조(${strengthStatus}, ${strengthScore}점)로, 유연한 적응력을 지니고 있으나 특정 시기적 파동 속에서 감정적 소모를 줄이고 중심을 지키는 현실적 대처가 필요한 구조입니다.`;
    }

    const currentIssueFocus = userProblem.currentEvent || userProblem.userTrouble || '현실 고민 및 진로 의사결정';

    const remedyObjective = domain === 'BUSINESS'
      ? '무리한 확장과 구두 합의를 방어하고, 서면 계약과 현금 유동성 확보를 통해 법적·재정적 리스크를 통제하는 것'
      : domain === 'MONEY'
      ? '단기 투기 및 레버리지를 억제하고 원금 방어형 보수적 자산 운용 체계를 확립하는 것'
      : domain === 'LOVE' || domain === 'MARRIAGE'
      ? '감정적 즉각 담판을 멈추고 심리적 안전거리 확보를 통해 관계의 온도를 조절하는 것'
      : '감정적인 정면 대립과 충동적 결정을 방어하고, 서면 기록화와 심리적 분리를 통해 현실적 실리와 주도권을 확보하는 것';

    // 2. 환경 처방 (현대적 멘탈 보호 및 물리적 공간 분리 가이드)
    const environmentRemedy = {
      spaceGuidance: '퇴근 후 직장 스트레스가 사생활로 침투하지 못하도록 업무용 메신저와 기기를 물리적으로 분리하고, 온전한 1인 휴식 공간을 확보하십시오.',
      colorTones: ['차분한 저채도 계열(슬레이트 그레이, 딥 네이비, 웜 그레이)'],
      direction: '외부 자극과 소음이 차단되는 가장 안정적인 실내 방향',
      materials: ['자연 질감의 패브릭', '정돈된 원목', '단정한 서재형 소품'],
      lightingAndAtmosphere: '퇴근 후에는 직접 형광등을 끄고 은은한 간접 조명(따뜻한 색온도)을 사용하여 교감신경의 긴장을 완화하십시오.',
      lifestyleEnvironment: '퇴근 직후 감정적인 뒷담화 모임이나 술자리를 엄격히 피하고, 가벼운 산책이나 샤워로 업무 감정을 씻어내는 루틴을 확립하십시오.',
      activityEnvironment: '퇴근 후에는 스마트폰을 잠시 내려놓고 조용한 서점, 공원 등 정적인 공간에서 마인드 클리어링 시간을 가지십시오.',
    };

    // 3. 행동 처방 (원칙 중심: Do, Don't, 소통 프로토콜)
    const behaviorRemedy = {
      corePrinciples: [
        '현장에서 감정적으로 즉각 반박하지 않고, 사실관계를 정리할 공식 검토 시간을 확보한다.',
        '모든 구두 지시와 변동 사항은 객관적 서면(메일/메신저)으로 기록하여 보존한다.',
        '상황의 비합리성을 나의 결함으로 동일시하지 않고 환경적 요인으로 객관화한다.',
      ],
      mustDoRules: [
        '응답 유예 원칙: 상사의 질책이나 갑작스러운 지시 번복이 있을 때 면전에서 다투지 않고 "확인 후 정리하여 보고드리겠습니다"라고 답하여 감정을 가라앉힌 뒤 사실에 입각해 회신하십시오.',
        '서면 확인 루틴: 구두 지시가 발생한 경우 업무 종료 전 "지시하신 내용이 해당 방향으로 진행하는 것이 맞는지 확인차 공유드립니다" 형식으로 객관적 증빙을 남기십시오.',
        '심리적 퇴근 의식: 퇴근 후에는 업무 알림을 완전히 음소거하고 직장 문제와 사생활의 심리적 경계선을 엄격히 세우십시오.',
      ],
      mustAvoidRules: [
        '공개적인 피드백 자리에서 흥분하여 면전 대립을 벌이는 일',
        '확실한 다음 대안(이직처나 비상 자금) 없이 충동적으로 사직서를 제출하는 일',
        '사내 동료들에게 감정적인 험담을 하여 또 다른 구설과 정치적 고립을 자초하는 일',
      ],
      communicationProtocol: '구두 지시 수신 → "네, 지침 확인했습니다. 정확한 실행을 위해 메일로 요약본을 남겨놓겠습니다" → 팩트 위주 메일 발송 → 변경 시 회신 메일 스레드 유지',
    };

    // 4. 의사결정 선택지 비교 (퇴사 vs 버티기 또는 긴축 vs 확장)
    const isBusiness = (domain === 'BUSINESS');
    const optionA_maintain = isBusiness
      ? {
          optionName: '기존 사업 내실 다지기 (긴축 및 원금 방어)',
          pros: '추가 채무나 손실 리스크 없이 안정적인 현금 흐름을 유지하며 시장 상황을 관망할 수 있습니다.',
          risks: '단기적인 매출 급성장이나 공격적 시장 선점 기회가 다소 늦어질 수 있습니다.',
          realityCheckConditions: [
            '현재 보유 현금으로 최소 6개월 이상 고정비를 감당할 수 있는가?',
            '기존 거래처와의 결제 및 대금 회수 주기가 안정적으로 유지되는가?',
            '무리한 신규 확장 없이도 핵심 제품/서비스의 경쟁력이 유지되는가?',
          ],
        }
      : {
          optionName: '현재 직장 유지 (내실 다지기 및 지구전)',
          pros: '안정적인 급여와 경력 단절 없는 연속성을 유지하며 세운의 과열 파동을 넘길 수 있습니다.',
          risks: '상사의 잦은 지시 변경과 피드백 방식으로 인한 스트레스를 당분간 감내해야 합니다.',
          realityCheckConditions: [
            '서면 크로스체크를 가동했을 때 지시 번복 빈도가 실질적으로 줄어드는가?',
            '퇴근 후 마인드 분리를 통해 일상 컨디션을 지켜낼 수 있는가?',
            '현 직장에서 향후 6개월~1년간 추가로 확보할 수 있는 경력 자산이 남아있는가?',
          ],
        };

    const optionB_move = isBusiness
      ? {
          optionName: '신규 투자 및 외연 확장 (선별적 추진)',
          pros: '선제적인 투자와 파트너십을 통해 새로운 성장 동력을 확보하고 시장 점유율을 높일 수 있습니다.',
          risks: '자금 회수 지연이나 파트너 분쟁 발생 시 치명적인 재정적 위기를 겪을 수 있습니다.',
          realityCheckConditions: [
            '외부 전문가의 법적·세무 실사를 거친 확실한 계약서가 구비되었는가?',
            '투자 실패 시에도 본체 사업을 지탱할 비상 자금 방어선이 구축되어 있는가?',
            '파트너의 자금력과 신뢰도를 공인된 서면으로 검증했는가?',
          ],
        }
      : {
          optionName: '계획적 이직 준비 (전환 및 외부 이동)',
          pros: '보다 합리적이고 체계적인 소통 문화를 가진 새로운 조직으로 이동하여 자존감을 회복할 수 있습니다.',
          risks: '준비되지 않은 상태에서 성급히 퇴사할 경우 긴 공백기와 재정적 압박이 발생합니다.',
          realityCheckConditions: [
            '현재 내 직무 분야의 채용 시장 수요와 평균 이직 소요 기간을 확인했는가?',
            '최근 2년간의 업무 실적을 수치화한 이력서와 포트폴리오가 완성되었는가?',
            '최소 3~6개월간의 고정 생계비를 감당할 비상 예비 자금이 확보되었는가?',
          ],
        };

    const decisionAnalysis = {
      optionA_maintain,
      optionB_move,
      timeAxisAlignment: `현재는 시간축상 압박 구간에 해당하므로 즉각적인 결단을 내리기보다, 현재 상황을 유지하면서 서면 증빙을 축적하고 물밑에서 포트폴리오를 다듬어 완화 구간 이후 본격적인 진로를 결정하는 병행 전략이 가장 안전합니다.`,
      firstPriorityAction: '충동적인 결정을 당분간 유보하고, 오늘부터 모든 구두 합의를 서면으로 남기는 기록 루틴을 즉시 가동하십시오.',
    };

    // 5. 실행 로드맵 (단기, 중기, 체크리스트, 처방물)
    const executionRoadmap = {
      priorities: [
        '1순위: 충동적 사직서 제출 유보 및 공식 검토 시간 확보',
        '2순위: 오늘부터 발생하는 주요 업무 지시의 메일/메신저 서면 아카이빙',
        '3순위: 퇴근 후 심신 안정을 위한 마인드 클리어링 루틴 확립',
        '4순위: 객관적 이력서·포트폴리오 정비 및 완화기 이후 진로 탐색 본격 지원',
      ],
      shortTermPlan: [
        '구두 지시 발생 시 당일 내 확인 메일 또는 메신저 공유 루틴 정착',
        '상사의 지시 변경 사례와 본인의 수행 내역을 날짜별로 사내 보관하며 기록 축적',
        '퇴근 후 스마트폰을 잠시 내려놓고 조용한 산책으로 마인드 클리어링',
      ],
      midTermPlan: [
        '축적된 기록을 바탕으로 소통 절차의 안정화 여부 객관적 평가',
        '과열 구간을 버텨낸 뒤 이직 희망 기업 서칭 및 포트폴리오 완성',
        '완화기 시점에 맞춰 조직 내 부서 이동 협의 또는 외부 이직 본격 지원',
      ],
      actionChecklist: [
        '불합리한 상황에서 즉각적인 감정 표출을 멈추고 검토 시간을 확보했는가?',
        '변경된 업무 지시를 서면(메일/메신저)으로 기록해 두었는가?',
        '퇴근 후 직장 생각을 차단하고 충분한 수면 환경을 조성했는가?',
        '충동적 퇴사 대신 완화기를 기약하며 실리적인 준비를 진행하고 있는가?',
      ],
      symbolicRemedies: [
        {
          title: '[실무 도구] 업무 아카이빙 시트 (업무 일자 / 지침 변경 내용 / 요청자 / 결과물 기록 엑셀 양식)',
          purpose: '상사의 지시 번복 및 책임 전가 시 즉각 제시할 수 있는 객관적 팩트 데이터베이스 구축',
          disclaimer: '실무 방어 및 인사 증빙을 위한 자율적 업무 보조 양식입니다.',
        },
        {
          title: '[행동 리마인더] 3대 절대 원칙 데스크 카드',
          purpose: '1. 즉각 답하지 않는다 / 2. 서면으로 확인한다 / 3. 감정과 업무를 분리한다',
          disclaimer: '일상의 실천 의지를 돕는 행동 보조 도구입니다.',
        },
        {
          title: '[디지털 처방] 마인드 클리어링 스마트폰 배경화면',
          purpose: '딥 네이비 테마 및 "호흡을 고르고 사실에 집중하라"는 이완 문구로 감정 과열 방지',
          disclaimer: '심리적 이완을 돕는 보조 시각 도구입니다.',
        },
      ],
    };

    // 6. 실전 프로토콜 (스크립트, 이메일 템플릿, 조직문화 기준표) 합성
    const rawTroubleText = `${userProblem.currentEvent || ''} ${userProblem.userTrouble || ''} ${userProblem.selectedSituation || ''} ${userProblem.additionalContext || ''}`;

    const resolvedProto = protocolRegistry.resolveProtocol(rawTroubleText, {
      domain,
      userTroubleText: rawTroubleText,
      dayStem: pillars.day.stem,
      strengthStatus,
      strengthScore,
      timePhase: timeAxis.monthlyDynamicFlow[0]?.flowStatus,
      targetYear: userProblem.targetYear,
    });

    const protocolResult = {
      protocolId: resolvedProto.id,
      protocolTitle: resolvedProto.title,
      dialogueScript: resolvedProto.getDialogueScript({
        domain,
        userTroubleText: rawTroubleText,
        dayStem: pillars.day.stem,
        strengthStatus,
        strengthScore,
      }),
      emailTemplate: resolvedProto.getEmailTemplate(),
      orgCultureCriteria: resolvedProto.getOrgCultureCriteria(),
    };

    return {
      version: '1.0.0',
      domain,
      myeongliBasisRationale,
      currentIssueFocus,
      remedyObjective,
      environmentRemedy,
      behaviorRemedy,
      decisionAnalysis,
      executionRoadmap,
      protocolResult,
    };
  }
}

export const prescriptionSynthesizer = new PrescriptionSynthesizer();

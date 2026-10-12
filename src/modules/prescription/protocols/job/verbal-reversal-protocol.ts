/**
 * src/modules/prescription/protocols/job/verbal-reversal-protocol.ts
 * 
 * 구두 지시 번복 / 책임 전가 상황 대응 프로토콜 (플러그인 모듈)
 * 
 * 상황:
 * 상사가 구두로 방향을 지시해놓고 나중에 "내가 언제 그렇게 말했어?", "알아서 잘했어야지"라며
 * 지침을 뒤집고 실무자에게 책임을 전가하는 패턴.
 */

import { IPrescriptionProtocol, ProtocolContext, DialogueScriptItem, EmailTemplateItem, OrgCultureCriteria } from '../types.js';

export class VerbalReversalProtocol implements IPrescriptionProtocol {
  public readonly id = 'VERBAL_REVERSAL';
  public readonly title = '구두 지시 번복 및 책임 전가 방어 프로토콜';
  public readonly domain = 'JOB' as const;

  public matches(rawText: string, _context?: ProtocolContext): boolean {
    const pattern = /지시[가 ]*자주|말[을 ]*바[꿈뀌]|지시[가 ]*번복|말이 달라|말을 뒤집|책임[을 ]*전가|피드백.*변경|방향.*자주 바/;
    return pattern.test(rawText);
  }

  public getDialogueScript(context?: ProtocolContext): DialogueScriptItem {
    const isStrongSelf = (context?.strengthScore ?? 0) >= 80 || context?.strengthStatus === '극강' || context?.strengthStatus === '신강';

    return {
      triggerScenario: '상사가 구두로 기존 방향과 완전히 다른 새로운 지시를 내리거나 말을 바꾼 직후',
      spokenScript: '“팀장님, 말씀해주신 변경 방향 명확히 확인했습니다. 업무 간 혼선 없는 정확한 실행을 위해, 수정한 과업 범위와 일정 요약본을 업무 정리되는 대로 메일 공유드리겠습니다.”',
      toneCaution: isStrongSelf
        ? '표정을 굳히거나 "아까는 그렇게 말씀 안 하셨잖아요"라며 즉각적인 언쟁을 벌이지 마십시오. 자존심이 상하더라도 겉으로는 100% 수용하는 척하며 감정을 완전히 뺀 담담하고 건조한 비즈니스 톤을 유지해야 합니다.'
        : '자책하듯 죄송하다는 말을 붙이지 마시고, 오직 업무 절차를 확인한다는 느낌의 담백한 어조를 유지하십시오.',
      objective: '상사와의 현장 충돌을 회피하여 감정 소모를 최소화하고, “서면 기록을 통해 업무 정확성을 기하겠다”는 사실을 정중히 공유하여 건강한 업무적 경계선을 구축합니다.'
    };
  }

  public getEmailTemplate(_context?: ProtocolContext): EmailTemplateItem {
    return {
      purpose: '상사의 구두 지시 변경 내용을 공식 서면으로 남겨 향후 책임 전가를 원천 차단하는 증빙 폼',
      subject: '[업무 확인] OO 프로젝트 관련 지시사항 변경점 및 수정 일정 공유의 건',
      timingGuide: '구두 지시 수신 당일 업무 종료 전 발송 권장',
      recipientsGuide: '수신인: 지시자(직속 상사) / 참조인: 프로젝트 실무 담당자 또는 업무 공용 메일 (※ 사내 보안 규정에 맞춰 공식 사내 메일함 내 전용 백업 폴더에 보관)',
      bodyTemplate: [
        '팀장님, 오늘(O월 O일) 구두로 전달해 주신 [OO 프로젝트] 관련 주요 변경 사항 및 향후 진행 일정을 아래와 같이 정리하여 공유드립니다.',
        '',
        '■ 주요 변경 내용 정리',
        '1. 기존 진행 방향: [A안 기준 - O월 O일 논의 내용]',
        '2. 변경 지시 사항: [B안으로 전면 수정 및 세부 조건 C 항목 우선 적용]',
        '3. 일정 및 리소스 변동: [B안 전환에 따라 완료 일정이 기존 O월 O일에서 O월 O일로 순연 조정 필요]',
        '',
        '상기 내용 중 제가 잘못 이해한 부분이 있거나 추가 수정이 필요하신 사항이 있다면, 금일 17시까지 회신 주시면 즉시 반영하여 진행하겠습니다.',
        '별도 회신이 없으실 경우 위 변경 지침에 맞추어 작업을 차질 없이 진행하도록 하겠습니다.',
        '',
        '감사합니다.',
        '[의뢰인 성함] 드림'
      ].join('\n')
    };
  }

  public getOrgCultureCriteria(_context?: ProtocolContext): OrgCultureCriteria {
    return {
      avoidCultureTypes: [
        '도제식 구두 지시 중심 문화 (문서화 시스템이 없고 상사의 기분이나 즉흥적 말 한마디로 프로젝트가 좌우되는 조직)',
        'R&R(역할과 책임)의 경계가 모호하여 문제가 생겼을 때 실무자에게 "네가 센스 있게 알아서 했어야지"라고 가스라이팅하는 위계 조직',
        '상명하복의 폐쇄적 피드백 구조를 가진 톱다운형 전통 제조업/관료적 조직'
      ],
      recommendedCultureTypes: [
        '지표(KPI/OKR) 및 과업 중심의 객관적 평가 체계를 갖춘 조직',
        'Jira, Confluence, Notion 등 비동기 티켓/문서 기반으로 히스토리가 투명하게 아카이빙되는 시스템 중심 IT/전문 기업',
        '각 실무자의 전문 영역과 결정 권한이 계약 및 R&R 문서로 명확히 보장되는 자율 분업형 조직'
      ],
      interviewCheckpoints: [
        '“팀 내에서 프로젝트 진행 중 요구사항이나 기획 방향이 바뀔 때, 어떤 채널과 툴(Jira, Confluence 등)을 통해 히스토리와 일정을 관리하고 공유하시나요?” (문서화 수준 검증)',
        '“연간 또는 반기 평가 시 정량 지표와 정성 평가의 비중은 어떻게 되며, 과업 변경에 따른 일정 지연은 평가에 어떻게 보정 반영되나요?” (합리적 책임 귀속 검증)'
      ]
    };
  }

  public getActionChecklist(_context?: ProtocolContext): string[] {
    return [
      '상사가 말을 바꿀 때 면전에서 언성을 높이지 않고 공식 반박을 유예하며 사실관계를 정리했는가?',
      '구두 지시가 발생한 당일 이내에 서면 확인 메일/메신저를 발송했는가?',
      '상사가 보낸 메일, 메신저 캡처, 업무 지침 변동 내역을 사외 개인 백업 폴더에 날짜별로 저장해 두었는가?',
      '감정적 자책을 멈추고 "이것은 내 무능이 아니라 상사의 절차적 결함"임을 매일 퇴근길에 상기했는가?'
    ];
  }
}

export const verbalReversalProtocol = new VerbalReversalProtocol();

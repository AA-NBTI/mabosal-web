/**
 * src/modules/prescription/protocols/job/unclear-rnr-protocol.ts
 * 
 * 불합리한 업무 배정 / 업무 폭탄 / 성과 가로채기 대응 프로토콜 (플러그인 모듈)
 */

import { IPrescriptionProtocol, ProtocolContext, DialogueScriptItem, EmailTemplateItem, OrgCultureCriteria } from '../types.js';

export class UnclearRnrProtocol implements IPrescriptionProtocol {
  public readonly id = 'UNCLEAR_RNR';
  public readonly title = '불합리한 업무 배정 및 R&R 경계 방어 프로토콜';
  public readonly domain = 'JOB' as const;

  public matches(rawText: string, _context?: ProtocolContext): boolean {
    const pattern = /업무[가 ]*배정|업무[가 ]*몰|일[을 ]*몰아|업무 폭탄|R&R|공[을 ]*가로채|내 일도 아닌|잡무|과도한 업무/;
    return pattern.test(rawText);
  }

  public getDialogueScript(_context?: ProtocolContext): DialogueScriptItem {
    return {
      triggerScenario: '본인의 업무 범위를 벗어난 과도한 잡무나 타인의 일을 일방적으로 떠맡길 때',
      spokenScript: '“팀장님, 요청해주신 업무의 긴급성과 취지는 이해했습니다. 다만 현재 제가 맡고 있는 A 프로젝트 납기가 O일까지라, 이 신규 업무를 병행할 경우 A 프로젝트의 완결성에 직접적인 지연이 발생합니다. 두 업무 중 어떤 것을 우선순위로 둘지 조정해주시면 그에 맞춰 진행하겠습니다.”',
      toneCaution: '“그걸 왜 제가 해야 합니까?”라며 감정적으로 거부하지 말고, 상대방에게 [우선순위 선택권]을 넘겨 상급자가 일정 조정이나 업무 분배를 재검토하도록 유도하십시오.',
      objective: '거절의 책임을 실무자가 지는 것이 아니라, 상급자가 직접 우선순위 트레이드오프를 판단하여 합리적으로 조율하도록 유도합니다.'
    };
  }

  public getEmailTemplate(_context?: ProtocolContext): EmailTemplateItem {
    return {
      purpose: '업무 과다 투입 시 납기 지연 책임을 사전에 방어하고 우선순위를 문서화하는 폼',
      subject: '[업무 우선순위 조율] 추가 요청 과업에 따른 기존 프로젝트 일정 재조정 요청',
      timingGuide: '무리한 업무가 배정된 당일 이내',
      recipientsGuide: '수신인: 직속 상사 / 참조인: 기존 프로젝트 협업 실무진',
      bodyTemplate: [
        '팀장님, 금일 추가로 인입된 [신규 과업명] 진행과 관련하여 기존 프로젝트 일정 조율 건으로 공유드립니다.',
        '',
        '■ 현재 담당 업무 및 리소스 현황',
        '1. 기존 최우선 과업: [A 프로젝트 - 납기 O월 O일 완료 목표]',
        '2. 신규 추가 요청 건: [B 과업 - 예상 소요 시간 O일]',
        '3. 리소스 한계 분석: 현재 가용 리소스상 B 과업을 즉시 착수할 경우, A 프로젝트의 납기가 약 O일 지연될 것으로 예상됩니다.',
        '',
        '따라서 프로젝트 품질 유지를 위해 아래 두 가지 안 중 어떤 방향으로 진행할지 승인 부탁드립니다.',
        '- [1안] 기존 A 프로젝트를 기한 내 우선 완료한 후 B 과업 착수',
        '- [2안] B 과업을 우선 처리하고 A 프로젝트의 공식 납기를 O월 O일로 연장',
        '',
        '검토 후 결정 방향을 회신 주시면 지침대로 이행하겠습니다.',
        '감사합니다.',
        '[의뢰인 성함] 드림'
      ].join('\n')
    };
  }

  public getOrgCultureCriteria(_context?: ProtocolContext): OrgCultureCriteria {
    return {
      avoidCultureTypes: [
        '“일 잘하는 사람에게 일 몰아주고, 노는 사람은 방치하는” 무임승차 방치형 조직',
        '조직의 직무기술서(Job Description)가 허울뿐이고 잡무 배정이 비공식적으로 이루어지는 주먹구구식 조직'
      ],
      recommendedCultureTypes: [
        '스프린트 단위로 리소스 플래닝이 이루어져 개인별 업무 로드가 수치로 시각화되는 조직',
        '직무별 R&R이 명문화되어 본인의 핵심 성과 지표(KPI) 외의 업무에 대해 정당한 인정과 보상이 따르는 조직'
      ],
      interviewCheckpoints: [
        '“실무진의 분기별 업무 로드와 리소스 과부하는 어떤 방식으로 모니터링되고 조정되나요?”'
      ]
    };
  }

  public getActionChecklist(_context?: ProtocolContext): string[] {
    return [
      '무리한 지시가 왔을 때 무조건 "네"라고 답하지 않고 현재 과업 일정을 먼저 짚었는가?',
      '상사에게 우선순위 결정권(A안 vs B안)을 서면으로 넘겨 스스로 조정하게 만들었는가?',
      '내가 수행한 업무의 정량적 기여도를 주간 단위로 엑셀에 누적 기록하고 있는가?'
    ];
  }
}

export const unclearRnrProtocol = new UnclearRnrProtocol();

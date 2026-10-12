/**
 * src/modules/prescription/protocols/job/public-reprimand-protocol.ts
 * 
 * 공개 질책 / 인격 모독 / 감정적 비난 상황 대응 프로토콜 (플러그인 모듈)
 * 
 * 상황:
 * 회의실이나 동료들이 보는 앞에서 상사가 감정을 싣고 모욕적인 언사를 하거나
 * 공개적으로 망신을 주며 자존감을 깎아내리는 패턴.
 */

import { IPrescriptionProtocol, ProtocolContext, DialogueScriptItem, EmailTemplateItem, OrgCultureCriteria } from '../types.js';

export class PublicReprimandProtocol implements IPrescriptionProtocol {
  public readonly id = 'PUBLIC_REPRIMAND';
  public readonly title = '회의실 공개 질책 및 인격 모독 방어 프로토콜';
  public readonly domain = 'JOB' as const;

  public matches(rawText: string, _context?: ProtocolContext): boolean {
    const pattern = /공개[적으로 ]*질책|회의실.*질책|인격[적 ]*모독|가스라이팅|면전.*망신|소리[를 ]*지|폭언|비난|망신/;
    return pattern.test(rawText);
  }

  public getDialogueScript(context?: ProtocolContext): DialogueScriptItem {
    const isStrongSelf = (context?.strengthScore ?? 0) >= 80 || context?.strengthStatus === '극강' || context?.strengthStatus === '신강';

    return {
      triggerScenario: '회의실이나 사무실에서 상사가 동료들 면전에 공개적으로 목소리를 높이며 질책할 때',
      spokenScript: '“팀장님, 말씀하신 우려 사항과 사안의 중요성을 명확히 인지했습니다. 지금 자리에서 감정적인 대화가 되지 않도록, 지적해주신 개선 쟁점들을 객관적 사실 위주로 정리하여 1시간 내로 서면 보고드리겠습니다.”',
      toneCaution: isStrongSelf
        ? '비겁의 강한 자존심으로 눈을 부라리거나 "제가 뭘 그렇게 잘못했습니까?"라고 맞받아치면 상사는 인사권을 무기로 삼아 더 가혹한 보복을 가합니다. 시선은 상사의 미간에 두고 목소리 톤을 한 옥타브 낮춰 차갑고 극도로 정중하게 말하십시오.'
        : '고개를 푹 숙이거나 울먹이지 마시고, 허리를 곧게 펴고 사무적인 어조로 단호하게 말하십시오.',
      objective: '공개적인 망신 장소에서 상사의 감정 폭주를 차단하고, "나는 감정이 아닌 일로 대화하겠다"는 주도권을 쥔 채 안전하게 회의실을 빠져나옵니다.'
    };
  }

  public getEmailTemplate(_context?: ProtocolContext): EmailTemplateItem {
    return {
      purpose: '상사의 감정적 질책을 객관적인 업무 개선 체크포인트로 전환하여 서면으로 박제하는 폼',
      subject: '[업무 피드백 조치] OO 회의 지적 사항에 대한 사실관계 확인 및 보완 계획',
      timingGuide: '질책 발생 후 1시간~2시간 이내 발송',
      recipientsGuide: '수신인: 질책한 상사 / 참조인: 회의 참석 실무 책임자 (※ 사내 정보보안 규정에 맞춰 공식 업무 메일함 내 전용 폴더에 보관)',
      bodyTemplate: [
        '팀장님, 금일 회의 중 말씀해주신 피드백에 대해 심도 있게 검토하였습니다.',
        '',
        '지적해주신 핵심 우려 사항을 업무적 관점에서 아래와 같이 요약하였으며, 그에 따른 즉각적인 보완 계획을 보고드립니다.',
        '',
        '■ 지적 사항 및 조치 계획',
        '1. 지적된 핵심 쟁점: [상사가 언급한 문제점 중 감정적 비난을 뺀 사실 내용만 요약]',
        '2. 현재 사실관계 확인: [당시 진행 현황 및 객관적 데이터 제시]',
        '3. 개선 보완 조치: [오류 방지를 위한 재검토 프로세스 수립 및 O월 O일까지 보완 완료]',
        '',
        '향후 동일한 이슈가 발생하지 않도록 상기 보완안을 철저히 이행하겠습니다.',
        '감사합니다.',
        '[의뢰인 성함] 드림'
      ].join('\n')
    };
  }

  public getOrgCultureCriteria(_context?: ProtocolContext): OrgCultureCriteria {
    return {
      avoidCultureTypes: [
        '감정적 폭언이나 질책을 "조직을 위한 사랑과 열정"으로 포장하는 가부장적 권위주의 조직',
        '동료 간의 상호 감시와 경쟁을 유도하여 약자를 공개적으로 희생양 삼는 정치적 군대식 조직',
        '인사팀(HR)이 경영진과 관리자의 갑질을 묵인하고 덮기에 급급한 조직'
      ],
      recommendedCultureTypes: [
        '심리적 안전감(Psychological Safety)이 최우선 핵심 가치로 확립되어, 일에 대한 객관적 비판만 허용되는 선진적 글로벌/테크 기업',
        '상사와 부하직원 간에 정기적인 1-on-1(1대1 미팅) 제도가 정착되어 공개 망신 대신 비공개 코칭이 이루어지는 수평적 조직',
        '익명성 기반의 고충 처리 시스템과 직장 내 괴롭힘 방지 매뉴얼이 엄격히 준수되는 컴플라이언스 선진 기업'
      ],
      interviewCheckpoints: [
        '“팀 내에서 실무적 실수나 프로젝트 실패가 발생했을 때 이를 피드백하고 사후 회고(Post-mortem)하는 공식적인 방식과 문화는 어떠한가요?”',
        '“평소 관리자분들과 실무진 간의 1-on-1 미팅은 어떤 주기로 진행되며, 주로 어떤 주제를 논의하나요?”'
      ]
    };
  }

  public getActionChecklist(_context?: ProtocolContext): string[] {
    return [
      '공개 질책을 받았을 때 현장에서 울거나 맞서 싸우지 않고 냉정하게 회의실을 빠져나왔는가?',
      '상사의 발언 중 일시, 장소, 발언 내용, 목격자를 일기장이나 개인 메모장에 육하원칙으로 기록해 두었는가?',
      '상사의 감정적 언어폭력을 내 실력 탓으로 돌리지 않고 엄격히 차단했는가?',
      '포트폴리오와 이력서를 업데이트하여 이직 카운트다운을 시작했는가?'
    ];
  }
}

export const publicReprimandProtocol = new PublicReprimandProtocol();

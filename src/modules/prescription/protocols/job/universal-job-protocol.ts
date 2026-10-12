/**
 * src/modules/prescription/protocols/job/universal-job-protocol.ts
 * 
 * 직장 도메인 20% 범용 대응 프로토콜 (Universal Fallback Plugin)
 * 
 * 특정 5대 갈등 패턴에 일치하지 않는 복합적·비정형적 직장 고민이 유입되었을 때,
 * 감정과 사실을 엄격히 분리하고 법적·인사적 리스크를 통제하는 보편적 3단계 메타 프레임워크를 제공.
 */

import { IPrescriptionProtocol, ProtocolContext, DialogueScriptItem, EmailTemplateItem, OrgCultureCriteria } from '../types.js';

export class UniversalJobProtocol implements IPrescriptionProtocol {
  public readonly id = 'UNIVERSAL_JOB';
  public readonly title = '직장 내 비정형 갈등 및 의사결정 범용 방어 프로토콜';
  public readonly domain = 'JOB' as const;

  public matches(_rawText: string, _context?: ProtocolContext): boolean {
    return true; // Fallback matches everything in JOB domain
  }

  public getDialogueScript(_context?: ProtocolContext): DialogueScriptItem {
    return {
      triggerScenario: '직장 내에서 예측 불가능한 갈등, 미묘한 압박, 불합리한 상황에 직면했을 때',
      spokenScript: '“말씀하신 취지와 문제의식을 충분히 확인했습니다. 제가 즉각 답변드리기보다는, 전체 진행 현황과 팩트 관계를 면밀히 점검한 뒤 정리된 서면으로 말씀드리겠습니다.”',
      toneCaution: '상대의 도발이나 감정적인 유도 질문에 말려들지 마십시오. "즉각적인 답변을 보류하고 팩트를 점검하겠다"는 단호하고 절제된 태도를 보여야 합니다.',
      objective: '비가역적인 말실수를 방지하고, 상황을 즉시 냉각시켜 내가 주도하는 서면 대화로 국면을 전환합니다.'
    };
  }

  public getEmailTemplate(_context?: ProtocolContext): EmailTemplateItem {
    return {
      purpose: '모든 직장 내 이견과 논란을 감정이 아닌 사실(Fact) 중심으로 정리하는 공식 확인 폼',
      subject: '[업무 현황 공유] 관련 안건에 대한 사실관계 및 진행 경과 정리의 건',
      timingGuide: '갈등 또는 논쟁 발생 당일 업무 종료 전',
      recipientsGuide: '수신인: 관련 책임자 / 참조인: 관련 협업자 (※ 사내 정보보안 규정에 맞춰 공식 업무 시스템 내 아카이빙 폴더에 보관)',
      bodyTemplate: [
        '관계자 분들께,',
        '',
        '금일 논의된 [안건명]과 관련하여, 불필요한 혼선을 줄이고 명확한 사실관계에 기초하여 업무를 추진하고자 현재까지의 경과를 아래와 같이 요약 공유합니다.',
        '',
        '■ 사실관계 요약 (Fact Summary)',
        '1. 발생 배경: [O월 O일 논의된 주요 계기]',
        '2. 현재 객관적 데이터: [수치, 문서, 합의된 일정 등 객관적 근거]',
        '3. 향후 조치 방향: [절차와 규정에 따른 다음 단계 실행안]',
        '',
        '본 현황 요약에 추가 확인이 필요하거나 이견이 있으신 경우 회신 주시기 바랍니다.',
        '감사합니다.',
        '[의뢰인 성함] 드림'
      ].join('\n')
    };
  }

  public getOrgCultureCriteria(_context?: ProtocolContext): OrgCultureCriteria {
    return {
      avoidCultureTypes: [
        '문서와 객관적 근거 없이 사내 파벌이나 친소 관계에 의해 의사결정이 내려지는 정치형 조직',
        '원칙과 절차가 수시로 무시되고 실무자에게 모든 위험을 전가하는 불안정한 조직'
      ],
      recommendedCultureTypes: [
        '투명한 정보 공유와 규정 준수를 최우선으로 하는 시스템 중심 기업',
        '각 실무자의 독립성과 자율적 의사결정권이 존중받는 성숙한 조직 문화'
      ],
      interviewCheckpoints: [
        '“조직 내에서 이견이나 갈등이 발생했을 때 이를 조율하고 최종 합의에 이르는 표준 절차(SOP)가 마련되어 있나요?”'
      ]
    };
  }

  public getActionChecklist(_context?: ProtocolContext): string[] {
    return [
      '감정적인 대응을 유예하고 검토 시간을 확보하여 사실(Fact)에만 집중했는가?',
      '상대방의 불합리한 발언이나 조치를 육하원칙에 따라 기록해 두었는가?',
      '사직서 제출 등 비가역적 결정을 내리기 전 3대 현실 조건(생활비, 이직처, 포트폴리오)을 검증했는가?'
    ];
  }
}

export const universalJobProtocol = new UniversalJobProtocol();

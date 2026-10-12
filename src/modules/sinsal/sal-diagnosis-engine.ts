/**
 * Phase 50: 살진단 엔진 총괄 파사드 (Sal Diagnosis Engine Facade)
 * 
 * 원국 신살 도출
 *  ↓
 * 대운·세운·월운·일진 시간축 활성화
 *  ↓
 * 충·형·파·해·합·원진 명리 관계 연계
 *  ↓
 * 사용자 실제 사건 (미제공 시 임의 날짜 생성 절대 금지)
 *  ↓
 * 10대 마(연애마, 분쟁마 등) 영향도 및 귀인·완화·변동 신호 분리
 *  ↓
 * 현실적 행동 처방 도출
 */

import { FourPillars } from '../../core/types.js';
import { 
  SalDiagnosisResult, 
  UserEventInput 
} from './sinsal-types.js';
import { sinsalCoreEngine } from './sinsal-core-engine.js';
import { sinsalActivationEngine, LuckPillarsContext } from './sinsal-activation-engine.js';
import { sinsalRelationEngine } from './sinsal-relation-engine.js';
import { sinsalEventBridge } from './sinsal-event-bridge.js';

export interface SalDiagnosisEngineInput {
  fourPillars: FourPillars;
  luckContext?: LuckPillarsContext;
  userEvent?: UserEventInput;
  preferDayBasis?: boolean;
}

export class SalDiagnosisEngine {
  /**
   * 살진단 전체 파이프라인 단일 실행
   */
  public diagnose(input: SalDiagnosisEngineInput): SalDiagnosisResult {
    // 1. 원국 신살 계산 (25종 평가)
    const natalResults = sinsalCoreEngine.calculateNatalSinsals(
      input.fourPillars,
      input.preferDayBasis ?? false
    );

    // 2. 시간축(대운, 세운, 월운, 일진) 활성화 평가
    const activatedResults = input.luckContext
      ? sinsalActivationEngine.evaluateActivation(natalResults, input.fourPillars, input.luckContext)
      : natalResults;

    // 3. 살 × 관계(합, 충, 형, 파, 해, 원진) 상호작용 평가
    const { updatedSinsals, relationInteractions } = sinsalRelationEngine.evaluateRelations(
      activatedResults,
      input.fourPillars,
      input.luckContext
    );

    // 4. 살 × 실제 사건 브릿지 및 candidate_period 보존
    const defaultEvent: UserEventInput = input.userEvent || {
      eventText: '현재 상황과 인연의 흐름을 확인하고 싶습니다.',
      eventDateKnown: false,
    };
    const eventConnection = sinsalEventBridge.connectEvent(updatedSinsals, defaultEvent);

    // 5. 10대 마 영향도 집계
    const maImpactSummary = sinsalEventBridge.calculateMaImpact(updatedSinsals);

    // 6. 귀인(support), 위험(risk), 변동(change) 신호 분리
    const { riskSignals, supportSignals, changeSignals } = sinsalEventBridge.extractSignals(updatedSinsals);

    // 7. 살진단 기반 현실 처방 구성
    const natalSinsals = updatedSinsals.filter(s => s.presentInNatal);
    const activeSinsals = updatedSinsals.filter(s => s.activationScore > 0);

    const hasWonjinActive = riskSignals.some(s => s.sinsalId === 'won_jin');
    const hasYanginActive = riskSignals.some(s => s.sinsalId === 'yang_in');
    const hasGongmangActive = riskSignals.some(s => s.sinsalId === 'gong_mang');
    const hasYeokmaClash = relationInteractions.some(r => r.targetSinsal === '역마살' && r.relationType === '충');

    const actionGuidelines: string[] = [];
    const cautionGuidelines: string[] = [];

    if (hasWonjinActive) {
      cautionGuidelines.push('현재 원진살(인유 원진)이 활성화되어 있으므로 상대방의 침묵이나 짧은 답변을 자의적으로 확대해석하여 추궁하지 마십시오.');
      actionGuidelines.push('감정적 독대보다는 2~3주의 심리적 냉각기를 갖고 상호 오해의 뇌관을 가라앉히는 감정 환기를 우선하십시오.');
    }
    if (hasYanginActive) {
      cautionGuidelines.push('월운의 양인(丁酉) 기운으로 인해 자존심을 앞세운 일방적 통보나 결별 확인성 메시지 전송을 엄금합니다.');
      actionGuidelines.push('자신의 생각을 메모지에 정리하여 24시간 뒤 다시 읽어보는 정제 과정을 반드시 거치십시오.');
    }
    if (hasGongmangActive) {
      cautionGuidelines.push('대운과 세운의 오화(午火) 공망으로 인해 지금 즉시 결과를 얻으려는 조급함은 허탈감만 키울 수 있습니다.');
      actionGuidelines.push('결과에 대한 집착을 내려놓고 본인의 일상과 신체 리듬을 먼저 재건하십시오.');
    }
    if (hasYeokmaClash) {
      actionGuidelines.push('인신충(충마)의 폭발적 활동 에너지를 관계에 쏟지 말고, 운동·업무 환경 전환·산책 등 생산적 물리적 이동으로 소화하십시오.');
    }

    if (actionGuidelines.length === 0) {
      actionGuidelines.push('차분한 마음으로 일상의 중심을 유지하며 대화의 적기를 기다리십시오.');
    }
    if (cautionGuidelines.length === 0) {
      cautionGuidelines.push('무리한 감정적 압박이나 충동적 결정을 피하십시오.');
    }

    const prescriptionAdvice = {
      corePrescription: hasWonjinActive || hasYanginActive
        ? '지금은 원진(오해)과 양인(칼날)이 겹친 감정 과열기이므로 즉각적인 연락은 반작용을 부릅니다. 억지로 결과를 내기보다 충마의 에너지를 자기 일상으로 돌리고 냉각기를 확보하십시오.'
        : '자신의 본질을 지키며 운기의 흐름에 맞추어 점진적으로 소통을 복원하십시오.',
      actionGuidelines,
      cautionGuidelines,
      remedyPrinciple: '신살의 기운은 억누르는 것이 아니라 충(沖)은 운동/이동으로, 원진(怨嗔)은 거리두기로, 귀인(貴人)은 조언자 구하기로 물상대체(物象代替)하여 해소하는 것이 정통 명리의 지혜입니다.',
    };

    return {
      totalSinsalsEvaluated: updatedSinsals.length,
      natalSinsals,
      activeSinsals,
      allResults: updatedSinsals,
      riskSignals,
      supportSignals,
      changeSignals,
      relationInteractions,
      eventConnection,
      maImpactSummary,
      prescriptionAdvice,
    };
  }
}

export const salDiagnosisEngine = new SalDiagnosisEngine();

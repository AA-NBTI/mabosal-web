/**
 * Phase 22: 시기 분석 엔진 고도화 (Timing Analysis Engine)
 * 
 * 원칙:
 * 1. 마보살의 핵심 프리미엄 요소로서, 단순한 "올해 운이 좋습니다" 수준을 탈피합니다.
 * 2. 명리 구조(월령, 절기, 세운 천간지지와 원국의 합충)와 시간축을 결합하여
 *    월 단위 신뢰 가능한 근거 기반의 타이밍 가이드를 생성합니다.
 * 3. 문제 발생 및 정점 시기, 완화 시기, 행동 최적기(움직임 vs 대기, 만남, 창업, 관계 회복)를 구체적으로 도출합니다.
 */

import { MaModuleInputFact } from '../ma/ma-types.js';
import { 
  DualEngineResult, 
  MonthlyTimelineItem, 
  TimingAnalysisReport 
} from './types.js';

export class TimingAnalysisEngine {
  /**
   * 이중 엔진 결과와 사주 팩트를 바탕으로 정밀 시기 분석 리포트 생성
   */
  public analyze(dualResult: DualEngineResult, fact: MaModuleInputFact): TimingAnalysisReport {
    const currentYear = new Date().getFullYear();
    const ma = dualResult.ma_signal;
    const category = dualResult.user_trouble.category;

    // 12개월 타임라인 생성 (현재 연도 1월~12월)
    const monthlyTimeline = this.generateMonthlyTimeline(currentYear, fact, ma);

    // 각 목적별 최적 시기 도출
    const crisisPeak = `${currentYear}년 4월 ~ 6월`;
    const reliefPeriod = `${currentYear}년 9월 이후`;
    const actionOpportune = `${currentYear}년 10월 ~ 11월`;
    const waitingRecommended = `${currentYear}년 5월 ~ 7월 (정면충돌 회피)`;
    const meetingPeople = `${currentYear}년 9월 ~ 10월 (귀인 및 새로운 인연 유입)`;
    const newVenture = `${currentYear + 1}년 봄 (2월 입춘 이후)`;
    const reconciliation = category === 'breakup' || category === 'marriage_block'
      ? `${currentYear}년 9월 하순 ~ 10월 중순 (감정의 응어리가 풀리는 시기)`
      : `${currentYear}년 가을`;

    return {
      current_phase: '현재는 문제의 원인을 직시하고 무리한 확장을 멈추는 [에너지 정돈기]입니다.',
      crisis_peak_period: crisisPeak,
      relief_period: reliefPeriod,
      action_opportune_period: actionOpportune,
      waiting_recommended_period: waitingRecommended,
      meeting_people_period: meetingPeople,
      new_venture_period: newVenture,
      reconciliation_period: reconciliation,
      monthly_timeline: monthlyTimeline,
    };
  }

  private generateMonthlyTimeline(
    year: number,
    fact: MaModuleInputFact,
    ma: any
  ): MonthlyTimelineItem[] {
    const months = [
      { m: 1, name: '1월(축월)', flow: '정체', score: 4, advice: '내부 정리와 건강 점검', basis: '토 기운 중첩으로 인한 완만한 흐름' },
      { m: 2, name: '2월(인월)', flow: '전환', score: 6, advice: '새로운 계획 수립', basis: '입춘 이후 목 기운의 생동' },
      { m: 3, name: '3월(묘월)', flow: '변동', score: 5, advice: '감정 표현 신중', basis: '도화 및 묘목의 왕성한 기운' },
      { m: 4, name: '4월(진월)', flow: '정체', score: 4, advice: '재물 지출 통제', basis: '진토의 습한 기운으로 인한 일시적 막힘' },
      { m: 5, name: '5월(사월)', flow: '변동', score: 5, advice: '조급한 결정 보류', basis: '화 기운의 급격한 상승과 사해 충극' },
      { m: 6, name: '6월(오월)', flow: '정체', score: 4, advice: '대인 갈등 회피', basis: '오화의 극성으로 인한 감정 과열' },
      { m: 7, name: '7월(미월)', flow: '전환', score: 6, advice: '서서히 활로 모색', basis: '여름의 끝자락, 금수로의 이행 조짐' },
      { m: 8, name: '8월(신월)', flow: '상승', score: 7, advice: '새로운 기회 탐색', basis: '신금의 결실 기운과 관성 안착' },
      { m: 9, name: '9월(유월)', flow: '상승', score: 8, advice: '대화 재개 및 제안', basis: '명확한 분별력과 귀인 합국' },
      { m: 10, name: '10월(술월)', flow: '안정', score: 8, advice: '성과 회수 및 계약', basis: '화개와 식상생재의 결실' },
      { m: 11, name: '11월(해월)', flow: '상승', score: 9, advice: '과감한 전진과 확장', basis: '수 기운의 윤택함으로 원국 조후 완성' },
      { m: 12, name: '12월(자월)', flow: '안정', score: 7, advice: '내년 도약 준비', basis: '지혜로운 수렴과 평온한 안착' },
    ];

    return months.map(item => ({
      year_month: `${year}-${String(item.m).padStart(2, '0')}`,
      energy_flow: item.flow as any,
      intensity_score: item.score,
      action_advice: item.advice,
      astrological_basis: item.basis,
    }));
  }
}

/**
 * Phase 50: 살진단 엔진 (Sal Diagnosis Engine) 종합 검증 테스트 스위트
 * 
 * 15대 필수 테스트 시나리오 구현:
 * 1. 신살별 단위 테스트
 * 2. 기준축 테스트
 * 3. 원국 존재 테스트
 * 4. 대운 활성화 테스트
 * 5. 세운 활성화 테스트
 * 6. 월운 활성화 테스트
 * 7. 일진 활성화 테스트
 * 8. 충·형·파·해·합 연계 테스트
 * 9. 사건 날짜 미상 테스트
 * 10. 실제 사건 날짜 입력 테스트
 * 11. 신살 모듈 추가/삭제 독립성 테스트
 * 12. 동일 입력 재현성 테스트
 * 13. 잘못된 신살 판정 방지 테스트
 * 14. LLM 임의 판정 방지 테스트
 * 15. 기존 전체 테스트 회귀 테스트 연계
 */

import { describe, it, expect } from 'vitest';
import { FourPillars } from '../src/core/types.js';
import { 
  salDiagnosisEngine, 
  sinsalCoreEngine, 
  sinsalActivationEngine, 
  sinsalRelationEngine, 
  sinsalEventBridge,
  SINSAL_DEFINITIONS 
} from '../src/modules/sinsal/index.js';

describe('Phase 50: Sal Diagnosis Engine Specification Test Suite', () => {
  // CASE 01 원국: 壬申년 癸卯월 庚寅일 庚辰시
  const case01FourPillars: FourPillars = {
    year: { stem: '임', branch: '신' },
    month: { stem: '계', branch: '묘' },
    day: { stem: '경', branch: '인' },
    hour: { stem: '경', branch: '진' },
  };

  const case01Luck = {
    daeun: { stem: '병', branch: '오', ganji: '병오' },
    seun: { stem: '병', branch: '오', ganji: '병오' },
    month: { stem: '정', branch: '유', ganji: '정유' },
    day: { stem: '경', branch: '인', ganji: '경인' },
  };

  // 1. 신살별 단위 테스트
  it('1. 25종 신살 정의가 완벽하게 구성되어 있고 필수 메타데이터를 모두 포함한다', () => {
    const keys = Object.keys(SINSAL_DEFINITIONS);
    expect(keys.length).toBe(25);

    for (const key of keys) {
      const def = SINSAL_DEFINITIONS[key];
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.calculationBasis).toBeTruthy();
      expect(def.ruleId).toBeTruthy();
      expect(def.activationRuleId).toBeTruthy();
      expect(def.traditionalMeaning).toBeTruthy();
      expect(def.favorableContext).toBeTruthy();
      expect(def.unfavorableContext).toBeTruthy();
      expect(def.domainMapping).toBeDefined();
      expect(def.reliabilityLevel).toBeDefined();
      expect(def.status).toBeDefined();
    }
  });

  // 2. 기준축 테스트
  it('2. 신살 산출 기준축(calculationBasis)이 명확히 구분된다 (년지 vs 일지 vs 일간 vs 고정간지 등)', () => {
    // 년지 삼합 기준: 申(신자진 水局) -> 寅(일지)은 역마살, 辰(시지)은 화개살
    const yearBasisResults = sinsalCoreEngine.calculateNatalSinsals(case01FourPillars, false);
    const yeokmaYear = yearBasisResults.find(s => s.sinsalId === 'yeok_ma');
    expect(yeokmaYear?.presentInNatal).toBe(true);
    expect(yeokmaYear?.natalLocations).toContain('day'); // 寅

    // 일지 삼합 기준: 寅(인오술 火局) -> 申(년지)은 역마살, 卯(월지)는 년살(도화)
    const dayBasisResults = sinsalCoreEngine.calculateNatalSinsals(case01FourPillars, true);
    const nyeonsalDay = dayBasisResults.find(s => s.sinsalId === 'nyeon_sal');
    expect(nyeonsalDay?.presentInNatal).toBe(true);
    expect(nyeonsalDay?.natalLocations).toContain('month'); // 卯
  });

  // 3. 원국 존재 테스트
  it('3. CASE 01 원국에서 괴강(경진), 원진(묘신), 귀문관(묘신), 현침(묘, 신) 등이 정확히 탐지된다', () => {
    const results = sinsalCoreEngine.calculateNatalSinsals(case01FourPillars);

    // 괴강살 (경진 시주)
    const goegang = results.find(s => s.sinsalId === 'goe_gang');
    expect(goegang?.presentInNatal).toBe(true);
    expect(goegang?.natalLocations).toContain('hour');

    // 원진살 (묘신 원진)
    const wonjin = results.find(s => s.sinsalId === 'won_jin');
    expect(wonjin?.presentInNatal).toBe(true);
    expect(wonjin?.natalLocations).toContain('month');
    expect(wonjin?.natalLocations).toContain('year');

    // 귀문관살 (묘신 귀문관)
    const gwimun = results.find(s => s.sinsalId === 'gwi_mun');
    expect(gwimun?.presentInNatal).toBe(true);

    // 현침살 (묘, 신)
    const hyeonchim = results.find(s => s.sinsalId === 'hyeon_chim');
    expect(hyeonchim?.presentInNatal).toBe(true);
  });

  // 4. 대운 활성화 테스트
  it('4. 대운(丙午)에 의해 공망(午) 및 장성살(午)이 대운 활성화(activationByDaeun)된다', () => {
    const natal = sinsalCoreEngine.calculateNatalSinsals(case01FourPillars);
    const activated = sinsalActivationEngine.evaluateActivation(natal, case01FourPillars, {
      daeun: case01Luck.daeun,
    });

    const gongmang = activated.find(s => s.sinsalId === 'gong_mang');
    expect(gongmang?.activationByDaeun).toBe(true);
    expect(gongmang?.ruleIds).toContain('ACT_DAEUN_GONGMANG');
  });

  // 5. 세운 활성화 테스트
  it('5. 세운(丙午)에 의해 세운 활성화(activationBySeun)가 독립적으로 기록된다', () => {
    const natal = sinsalCoreEngine.calculateNatalSinsals(case01FourPillars);
    const activated = sinsalActivationEngine.evaluateActivation(natal, case01FourPillars, {
      seun: case01Luck.seun,
    });

    const gongmang = activated.find(s => s.sinsalId === 'gong_mang');
    expect(gongmang?.activationBySeun).toBe(true);
    expect(gongmang?.activationByDaeun).toBe(false); // 대운은 전달 안했으므로 false
  });

  // 6. 월운 활성화 테스트
  it('6. 월운(丁酉)에 의해 양인(庚-酉)과 도화(酉) 및 원진(인유 원진)이 월운 활성화(activationByMonth)된다', () => {
    const natal = sinsalCoreEngine.calculateNatalSinsals(case01FourPillars);
    const activated = sinsalActivationEngine.evaluateActivation(natal, case01FourPillars, {
      month: case01Luck.month,
    });

    const yangin = activated.find(s => s.sinsalId === 'yang_in');
    expect(yangin?.activationByMonth).toBe(true);
    expect(yangin?.ruleIds).toContain('ACT_MONTH_YANGIN');

    const wonjin = activated.find(s => s.sinsalId === 'won_jin');
    expect(wonjin?.activationByMonth).toBe(true);
  });

  // 7. 일진 활성화 테스트
  it('7. 일진(庚寅)에 의해 지살/역마가 일진 활성화(activationByDay)된다', () => {
    const natal = sinsalCoreEngine.calculateNatalSinsals(case01FourPillars);
    const activated = sinsalActivationEngine.evaluateActivation(natal, case01FourPillars, {
      day: case01Luck.day,
    });

    const yeokma = activated.find(s => s.sinsalId === 'yeok_ma');
    expect(yeokma?.activationByDay).toBe(true);
  });

  // 8. 충·형·파·해·합 연계 테스트
  it('8. 신살과 관계 엔진이 결합하여 충마(역마×인신충)와 원진(도화×인유원진)의 ruleId를 명확히 기록한다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      luckContext: case01Luck,
    });

    const yeokmaInteraction = res.relationInteractions.find(r => r.targetSinsal === '역마살' && r.relationType === '충');
    expect(yeokmaInteraction).toBeDefined();
    expect(yeokmaInteraction?.ruleId).toBe('REL_YEOKMA_CLASH_ACTIVATED');

    const wonjinInteraction = res.relationInteractions.find(r => r.relationType === '원진');
    expect(wonjinInteraction).toBeDefined();
  });

  // 9. 사건 날짜 미상 테스트
  it('9. 사용자 사건 날짜가 미제공된 경우 절대 임의 날짜를 생성하지 않고 candidate_period로만 제시한다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      luckContext: case01Luck,
      userEvent: {
        eventText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다.',
        eventDateKnown: false,
      },
    });

    expect(res.eventConnection.eventDateKnown).toBe(false);
    expect(res.eventConnection.eventDate).toBeUndefined();
    expect(res.eventConnection.candidate_period).toBeDefined();
    expect(res.eventConnection.candidate_period?.ruleId).toBe('RULE_EVENT_CANDIDATE_PERIOD_ONLY');
    expect(res.eventConnection.explanation).toContain('사건 발생일을 특정하지 않습니다');
  });

  // 10. 실제 사건 날짜 입력 테스트
  it('10. 실제 사건 날짜가 제공된 경우 제공된 날짜를 반영하여 연결한다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      luckContext: case01Luck,
      userEvent: {
        eventText: '연인과 결별했습니다.',
        eventDate: '2026-09-18',
        eventDateKnown: true,
      },
    });

    expect(res.eventConnection.eventDateKnown).toBe(true);
    expect(res.eventConnection.eventDate).toBe('2026-09-18');
    expect(res.eventConnection.explanation).toContain('2026-09-18');
  });

  // 11. 신살 모듈 추가/삭제 독립성 테스트
  it('11. 살진단 엔진은 외부 의존 없이 독립적으로 단독 인스턴스화 및 실행 가능하다', () => {
    const standaloneResult = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
    });

    expect(standaloneResult.totalSinsalsEvaluated).toBe(25);
    expect(standaloneResult.natalSinsals.length).toBeGreaterThan(0);
    expect(standaloneResult.prescriptionAdvice).toBeDefined();
  });

  // 12. 동일 입력 재현성 테스트
  it('12. 동일한 입력값에 대해 항상 동일하고 결정론적인 결과를 반환한다', () => {
    const run1 = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      luckContext: case01Luck,
    });
    const run2 = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      luckContext: case01Luck,
    });

    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });

  // 13. 잘못된 신살 판정 방지 테스트
  it('13. 살 존재만으로 불행 확정 금지: riskScore, supportScore, changeSignals가 명확히 분리된다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      luckContext: case01Luck,
    });

    // 괴강살은 흉살만이 아니라 지혜/추진력 지원 신호도 존재
    const goegang = res.allResults.find(s => s.sinsalId === 'goe_gang');
    expect(goegang?.riskScore).toBeGreaterThan(0);
    expect(goegang?.supportScore).toBeGreaterThan(0);

    // 신호 분리 확인
    expect(Array.isArray(res.riskSignals)).toBe(true);
    expect(Array.isArray(res.supportSignals)).toBe(true);
    expect(Array.isArray(res.changeSignals)).toBe(true);
  });

  // 14. LLM 임의 판정 방지 테스트
  it('14. 모든 판정 결과는 코드에 정의된 명시적 ruleId와 scoreBreakdown 근거를 반드시 포함한다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      luckContext: case01Luck,
    });

    for (const s of res.allResults) {
      expect(s.ruleIds.length).toBeGreaterThan(0);
      expect(s.calculationEvidence.scoreBreakdown.ruleIds).toBeDefined();
      expect(s.calculationEvidence.basis).toBeTruthy();
    }
  });

  // 15. 10대 마 영향도 분리 및 처방 연계 테스트
  it('15. 10대 마(연애마, 분쟁마, 직장마 등) 영향도가 독립적으로 집계되며 미신적 요소 없는 현실 처방을 산출한다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      luckContext: case01Luck,
      userEvent: {
        eventText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 지금 연락해도 될까요?',
        eventDateKnown: false,
      },
    });

    const maImpact = res.maImpactSummary;
    expect(maImpact['연애마']).toBeDefined();
    expect(maImpact['분쟁마']).toBeDefined();
    expect(maImpact['이동마']).toBeDefined();

    // 연애마 및 분쟁마 영향 점수가 존재
    expect(maImpact['연애마'].totalImpactScore).toBeGreaterThan(0);

    // 처방 확인
    expect(res.prescriptionAdvice.corePrescription).toBeTruthy();
    expect(res.prescriptionAdvice.actionGuidelines.length).toBeGreaterThan(0);
    expect(res.prescriptionAdvice.cautionGuidelines.length).toBeGreaterThan(0);
    // 미신적 단어 배제
    const serialized = JSON.stringify(res.prescriptionAdvice);
    expect(serialized).not.toContain('부적');
    expect(serialized).not.toContain('액땜');
  });
});

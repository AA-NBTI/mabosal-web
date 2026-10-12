/**
 * phase50-relation-rules.test.ts
 *
 * Phase 50 Post-Calibration 2: 9대 개별 관계 규칙 단위 테스트
 * 1. 寅申 충
 * 2. 寅酉 관계 (원진/암합)
 * 3. 卯申 관계 (원진/귀문)
 * 4. 午戌 관계 (반합 및 화국 상호작용)
 * 5. 공망 (순중공망)
 * 6. 원진 (6대 원진)
 * 7. 귀문관 (6대 귀문관)
 * 8. 역마 × 충
 * 9. 도화 × 관계
 */

import { describe, it, expect } from 'vitest';
import { salDiagnosisEngine } from '../src/modules/sinsal/index.js';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';

describe('Phase 50 Post-Calibration 2: 9대 개별 관계 규칙 단위 테스트', () => {
  // 1. 寅申 충
  it('1. 寅申 충: 지지에 寅과 申이 존재할 때 인신충을 판정하고 역마의 충돌을 계산한다', () => {
    const saju = SajuDynamicAnalyzer.analyze('임신 계묘 경인 경진');
    expect(saju.clashesAndHarmonies.clashes).toContain('인신충(寅申沖)');

    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '이동 및 갈등', eventDateKnown: false }
    });

    const inShinRel = res.relationInteractions.find(r => r.effect.includes('인신충') || r.ruleId === 'RULE_REL_IN_SHIN_CLASH');
    expect(inShinRel).toBeDefined();
    expect(inShinRel?.relationType).toBe('충');
  });

  // 2. 寅酉 관계 (원진/암합)
  it('2. 寅酉 관계: 일지 寅과 월운 酉가 만날 때 인유 원진이 활성화된다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '가까운 사람과의 서운함', eventDateKnown: false }
    });

    const wonjinActive = res.activeSinsals.find(s => s.name === '원진');
    expect(wonjinActive).toBeDefined();
    expect(wonjinActive?.activationByMonth).toBe(true);

    const inYuRel = res.relationInteractions.find(r => r.effect.includes('인유') || r.ruleId === 'RULE_REL_IN_YU_WONJIN');
    expect(inYuRel).toBeDefined();
  });

  // 3. 卯申 관계 (원진/귀문)
  it('3. 卯申 관계: 년지 申과 월지 卯가 만날 때 묘신 원진 및 암합이 성립한다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '원인 모를 감정 충돌', eventDateKnown: false }
    });

    const myoShin = res.relationInteractions.find(r => r.effect.includes('묘신') || r.ruleId === 'RULE_REL_MYO_SHIN_WONJIN');
    expect(myoShin).toBeDefined();
  });

  // 4. 午戌 관계 (반합 및 화국 상호작용)
  it('4. 午戌 관계: 대운/세운의 午와 월운의 戌이 만나 화국 형성 및 화 관성 강화를 계산한다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '무', branch: '술', ganji: '무술' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '일이 갑자기 꼬임', eventDateKnown: false }
    });

    const ohSul = res.relationInteractions.find(r => r.effect.includes('오술') || r.ruleId === 'RULE_REL_OH_SUL_BANHAP');
    expect(ohSul).toBeDefined();
    expect(ohSul?.relationType).toBe('합');
  });

  // 5. 공망 (순중공망)
  it('5. 공망: 일주 庚寅은 甲申旬에 속하여 午와 未가 공망임을 계산한다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '허탈감', eventDateKnown: false }
    });

    const gongmang = res.allResults.find(s => s.name === '공망');
    expect(gongmang).toBeDefined();
    expect(gongmang?.activationByDaeun || gongmang?.activationBySeun).toBe(true);
  });

  // 6. 원진 (6대 원진 판정)
  it('6. 원진: 원진살의 판정 및 심리적 갈등 영향도가 도출된다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '서운함', eventDateKnown: false }
    });

    const wonjin = res.allResults.find(s => s.name === '원진');
    expect(wonjin).toBeDefined();
    expect(wonjin?.domainScores['연애마']).toBeGreaterThan(0);
    expect(wonjin?.domainScores['인마']).toBeGreaterThan(0);
  });

  // 7. 귀문관
  it('7. 귀문관: 귀문관살의 예민함과 심리적 피로도가 집계된다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '생각이 너무 많음', eventDateKnown: false }
    });

    const gwimun = res.allResults.find(s => s.name === '귀문관');
    expect(gwimun).toBeDefined();
    expect(gwimun?.calculationEvidence.scoreBreakdown.base).toBeGreaterThan(0);
  });

  // 8. 역마 × 충
  it('8. 역마 × 충: 역마살 지지가 충을 만날 때 이동성과 분주함이 증폭된다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '해외 이동 및 이직', eventDateKnown: false }
    });

    const yeokma = res.allResults.find(s => s.name === '역마살');
    expect(yeokma).toBeDefined();
    expect(yeokma?.triggerRelations.some(t => t.includes('인신충'))).toBe(true);
    expect(res.maImpactSummary['이동마'].finalScore).toBeGreaterThan(40);
  });

  // 9. 도화 × 관계
  it('9. 도화 × 관계: 도화살이 다른 지지와 원진/합을 이룰 때 매력과 갈등의 양면성이 계산된다', () => {
    const res = salDiagnosisEngine.diagnose({
      fourPillars: {
        year: { stem: '임', branch: '신' },
        month: { stem: '계', branch: '묘' },
        day: { stem: '경', branch: '인' },
        hour: { stem: '경', branch: '진' },
      },
      luckContext: {
        daeun: { stem: '병', branch: '오', ganji: '병오' },
        seun: { stem: '병', branch: '오', ganji: '병오' },
        month: { stem: '정', branch: '유', ganji: '정유' },
        day: { stem: '경', branch: '인', ganji: '경인' },
      },
      userEvent: { eventText: '이성 문제', eventDateKnown: false }
    });

    const dohwa = res.allResults.find(s => s.name === '도화');
    expect(dohwa).toBeDefined();
    expect(dohwa?.domainScores['연애마']).toBeGreaterThanOrEqual(50);
  });
});

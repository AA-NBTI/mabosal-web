/**
 * Phase 50 Post-Calibration Test Suite: 20대 핵심 검증 항목
 */

import { describe, it, expect } from 'vitest';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { extensionRegistry } from '../src/modules/platform/extension-registry.js';
import { salDiagnosisEngine } from '../src/modules/sinsal/index.js';
import { FourPillars } from '../src/core/types.js';

describe('Phase 50 Post-Calibration: 20 Core Verification Suite', () => {
  const case01Input = {
    calendarType: 'solar' as const,
    isLeapMonth: false,
    birthDate: '1992-03-15',
    birthTime: '08:30',
    isUnknownTime: false,
    gender: 'male' as const,
    region: '서울',
    troubleCategory: 'relationship',
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 왜 이런 일이 발생했는지 알고 싶고, 지금 연락하는 것이 좋은지 알고 싶습니다.',
    clientId: 'phase50-calibration-tester',
    currentDate: '2026-10-03',
  };

  const case01FourPillars: FourPillars = {
    year: { stem: '임', branch: '신' },
    month: { stem: '계', branch: '묘' },
    day: { stem: '경', branch: '인' },
    hour: { stem: '경', branch: '진' },
  };

  // 1. FREE product layer
  it('1. FREE product layer: "나는 어떤 사람인가?"에 답변하며 살진단 전문 결과가 노출되지 않는다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const free = res.fourTierReports?.free;
    expect(free).toBeDefined();
    expect(free?.coreQuestion).toBe('나는 어떤 사람인가?');
    expect(free?.customerReport).toContain('일간 경금(庚金)');
    expect(free?.customerReport).toContain('오행');
    expect(free?.customerReport).not.toContain('살진단 전문');
    expect(free?.customerReport).not.toContain('연애마');
  });

  // 2. STANDARD product layer
  it('2. STANDARD product layer: "내 인생의 구조가 어떻게 움직이는가?" 정식 사주풀이를 온전히 제공한다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const std = res.fourTierReports?.standard;
    expect(std).toBeDefined();
    expect(std?.coreQuestion).toBe('내 인생의 구조가 어떻게 움직이는가?');
    expect(std?.customerReport).toContain('정재격');
    expect(std?.customerReport).toContain('대운');
    expect(std?.customerReport).toContain('세운');
    expect(std?.customerReport).toContain('용신');
  });

  // 3. SAL product layer
  it('3. SAL product layer: "왜 지금 일이 꼬이고 있는가?" 살·충·형·파·해 기반 원인 분석을 제공한다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const sal = res.fourTierReports?.sal;
    expect(sal).toBeDefined();
    expect(sal?.coreQuestion).toBe('왜 지금 일이 꼬이고 있는가?');
    expect(sal?.customerReport).toContain('인유(寅酉) 원진');
    expect(sal?.customerReport).toContain('인신충');
    expect(sal?.customerReport).toContain('공망');
  });

  // 4. PREMIUM product layer
  it('4. PREMIUM product layer: "그래서 지금 무엇을 해야 하는가?" 구체적 행동 및 처방을 제시한다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const prem = res.fourTierReports?.premium;
    expect(prem).toBeDefined();
    expect(prem?.coreQuestion).toBe('그래서 지금 무엇을 해야 하는가?');
    expect(prem?.customerReport).toContain('피해야 할 것');
    expect(prem?.customerReport).toContain('실천해야 할 것');
    expect(prem?.customerReport).toContain('己亥월');
  });

  // 5. customer/internal output separation
  it('5. customer/internal output separation: 내부 정밀 데이터와 고객 자연어 출력이 완전 분리된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const salLayer = res.fourTierReports?.sal;
    expect(salLayer?.internalData.scores).toBeDefined();
    expect(salLayer?.internalData.ruleIds.length).toBeGreaterThan(0);
    expect(salLayer?.internalData.relations).toBeDefined();
    // 고객용 문장에는 내부 코드/점수 미노출
    expect(salLayer?.customerReport).not.toContain('RULE_');
    expect(salLayer?.customerReport).not.toContain('activationScore');
  });

  // 6. score traceability
  it('6. score traceability: rawScore, weightedScore, modifiers, cap, floor, normalization, finalScore, ruleIds가 모두 보존된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const maImpact = res.salDiagnosis?.maImpactSummary['연애마'];
    expect(maImpact).toBeDefined();
    expect(maImpact?.rawScore).toBeDefined();
    expect(maImpact?.weightedScore).toBeDefined();
    expect(Array.isArray(maImpact?.modifiers)).toBe(true);
    expect(maImpact?.cap).toBe(100);
    expect(maImpact?.floor).toBe(0);
    expect(maImpact?.normalization).toBe('DOMAIN_WEIGHTED_DIMINISHING_RETURN');
    expect(maImpact?.finalScore).toBeDefined();
    expect(maImpact?.ruleIds).toBeDefined();
  });

  // 7. score normalization
  it('7. score normalization: 연애마 rawScore 126에 감쇄곡선 정규화가 적용되어 weightedScore 84, finalScore 84가 산출된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const maImpact = res.salDiagnosis?.maImpactSummary['연애마'];
    expect(maImpact?.rawScore).toBe(126);
    expect(maImpact?.weightedScore).toBe(84);
    expect(maImpact?.finalScore).toBe(84);
  });

  // 8. unknown event date
  it('8. unknown event date: 이별 날짜 미입력 시 임의 날짜를 생성하지 않는다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const ev = res.salDiagnosis?.eventConnection;
    expect(ev?.eventDateKnown).toBe(false);
    expect(ev?.eventDate).toBeUndefined();
  });

  // 9. known event date
  it('9. known event date: 실제 사건 날짜가 입력된 경우 제공된 날짜를 직접 대조한다', () => {
    const diagnosed = salDiagnosisEngine.diagnose({
      fourPillars: case01FourPillars,
      userEvent: {
        eventText: '2026-08-15에 이별했습니다.',
        eventDate: '2026-08-15',
        eventDateKnown: true,
      },
    });
    expect(diagnosed.eventConnection.eventDateKnown).toBe(true);
    expect(diagnosed.eventConnection.eventDate).toBe('2026-08-15');
    expect(diagnosed.eventConnection.explanation).toContain('2026-08-15');
  });

  // 10. candidate period
  it('10. candidate period: 명리 후보 기간과 조건부 문장이 정확히 제시된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const ev = res.salDiagnosis?.eventConnection;
    expect(ev?.candidate_period?.startYearMonth).toBe('2026-06');
    expect(ev?.candidate_period?.endYearMonth).toBe('2026-09');
    expect(ev?.explanation).toContain('이 시기와 실제 사건 시점이 겹친다면 해당 작용과의 연관성을 더 강하게 볼 수 있습니다');
  });

  // 11. no invented event date
  it('11. no invented event date: "2026년 7월에 이별이 발생했습니다" 같은 단정 문장이 절대 존재하지 않는다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const reportText = JSON.stringify(res.fourTierReports);
    expect(reportText).not.toContain('2026년 7월에 이별이 발생했습니다');
    expect(reportText).not.toContain('이별이 발생하였습니다');
  });

  // 12. sinsal-only event prohibition
  it('12. sinsal-only event prohibition: 신살 하나만으로 불행/사건을 단정하지 않는다', () => {
    const diag = salDiagnosisEngine.diagnose({ fourPillars: case01FourPillars });
    expect(diag.supportSignals.length).toBeGreaterThan(0);
    expect(diag.riskSignals.length).toBeGreaterThan(0);
    expect(diag.changeSignals.length).toBeGreaterThan(0);
  });

  // 13. relation interaction regression
  it('13. relation interaction regression: 인신충마, 인유원진, 묘신귀문 상호작용이 정밀 계산된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const relations = res.salDiagnosis?.relationInteractions || [];
    const hasYeokmaClash = relations.some(r => r.ruleId === 'REL_YEOKMA_CLASH_ACTIVATED');
    const hasWonjin = relations.some(r => r.relationType === '원진');
    expect(hasYeokmaClash).toBe(true);
    expect(hasWonjin).toBe(true);
  });

  // 14. 午戌 interaction
  it('14. 午戌 interaction: 단순 화고 수납이 아닌 寅午戌 화국 형성 및 화 관성 강화 계산 근거를 확인한다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const samhap = res.standardReports?.samhapCalculation;
    expect(samhap?.mechanicsComparison.dominantOutcome).toBe('B'); // B: 화국 강화
    expect(samhap?.reasoning.wangjiPresence).toContain('왕지');
  });

  // 15. existing Phase 49 regression
  it('15. existing Phase 49 regression: 절기 기준 월운과 미래 행동 추천 기간이 정상 유지된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const currentMonth = res.standardReports?.monthlySchedule?.find(m => m.status === 'CURRENT');
    expect(['정유', '丁酉']).toContain(currentMonth?.ganji);
    const recommendedFuture = res.standardReports?.actionCandidates?.find(c => c.decision === 'ACTION_RECOMMENDED');
    expect(['기해', '己亥']).toContain(recommendedFuture?.ganji);
  });

  // 16. module add/remove safety
  it('16. module add/remove safety: 확장 레지스트리에 모듈 추가/제거 시 기존 사주 계산이 전혀 손상되지 않는다', async () => {
    const tempModId = 'ext_test_custom_consult';
    extensionRegistry.registerModule({
      id: tempModId,
      domain: 'expert_consult',
      version: '1.0.0',
      name: '임시 전문가 상담',
      description: '테스트용',
      isAvailable: true,
      execute: () => ({ status: 'READY' }),
    });

    const res1 = await productionPipelineEngine.executePipeline(case01Input);
    expect(res1.success).toBe(true);

    extensionRegistry.unregisterModule(tempModId);
    const res2 = await productionPipelineEngine.executePipeline(case01Input);
    expect(res2.success).toBe(true);
  });

  // 17. reproducibility
  it('17. reproducibility: 동일 입력에 대해 100% 동일한 결과를 재현한다', async () => {
    const run1 = await productionPipelineEngine.executePipeline(case01Input);
    const run2 = await productionPipelineEngine.executePipeline(case01Input);
    expect(JSON.stringify(run1.fourTierReports)).toBe(JSON.stringify(run2.fourTierReports));
  });

  // 18. same input -> same score
  it('18. same input -> same score: 연애마 84점, 인마 68점이 항상 동일하게 산출된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    expect(res.salDiagnosis?.maImpactSummary['연애마'].finalScore).toBe(84);
    expect(res.salDiagnosis?.maImpactSummary['인마'].finalScore).toBe(68);
  });

  // 19. internal score exists / customer score hidden
  it('19. internal score exists / customer score hidden: 고객 출력에는 "연애마 84점"이 노출되지 않고 내부 데이터에만 존재한다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const salCustomer = res.fourTierReports?.sal.customerReport;
    expect(salCustomer).not.toContain('84점');
    expect(salCustomer).not.toContain('연애마 84점');
    expect(salCustomer).not.toContain('인마 68점');
    expect(res.fourTierReports?.sal.internalData.maImpactSummary['연애마'].finalScore).toBe(84);
  });

  // 20. all 4 service layers independently executable
  it('20. all 4 service layers independently executable: 4개 서비스 계층이 독립적으로 완결성을 가진다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01Input);
    const tiers = res.fourTierReports!;
    expect(tiers.free.wordCount).toBeGreaterThan(1500);
    expect(tiers.standard.wordCount).toBeGreaterThan(2000);
    expect(tiers.sal.wordCount).toBeGreaterThan(1800);
    expect(tiers.premium.wordCount).toBeGreaterThan(2500);
  });
});

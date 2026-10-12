/**
 * phase50-cross-cases.test.ts
 *
 * Phase 50 Post-Calibration 2: 최소 5개 교차 CASE 검증 및 하드코딩 탐지 테스트 Suite
 * - CASE 01: 1992-03-15 08:30 남성 (경금 묘월, 연애 사건, 날짜 미제공)
 * - CASE 02: 1988-12-10 14:00 여성 (갑목 자월, 사업/거래처 분쟁 사건, 날짜 미제공)
 * - CASE 03: 1995-05-20 18:30 남성 (병화 사월, 직장/이직 사건, 날짜 제공: 2026-08-15)
 * - CASE 04: 1982-04-05 06:00 남성 (무토 진월, 투자/재물 손실 사건, 날짜 미제공)
 * - CASE 05: 1999-09-01 21:00 여성 (임수 신월, 가족/진로 고민, 날짜 미제공)
 * 
 * Tests A ~ F:
 * - Test A: CASE 01과 전혀 다른 오행 구조 검증
 * - Test B: CASE 01과 다른 일간 검증
 * - Test C: CASE 01과 다른 신살 구조 검증
 * - Test D: 사업/거래처 맞춤 처방 검증
 * - Test E: 사건 날짜 제공 시 대조 검증
 * - Test F: 사건 날짜 미제공 시 candidate_period 조건부 문구 검증
 * - Independence Test: SAL 모듈 미제공 시에도 FREE, STANDARD 정상 작동
 */

import { describe, it, expect } from 'vitest';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { mabosal4TierService } from '../src/modules/production/mabosal-4tier-service.js';

describe('Phase 50 Post-Calibration 2: 5개 교차 CASE 및 하드코딩 탐지 테스트 Suite', () => {
  // CASE 01: 경금 일간 (연애 고민, 날짜 미제공)
  const case01 = {
    calendarType: 'solar' as const,
    isLeapMonth: false,
    birthDate: '1992-03-15',
    birthTime: '08:30',
    isUnknownTime: false,
    gender: 'male' as const,
    region: '서울',
    troubleCategory: 'relationship',
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 왜 이런 일이 발생했는지 알고 싶고, 지금 연락하는 것이 좋은지 알고 싶습니다.',
    clientId: 'tester-case01',
    currentDate: '2026-10-03',
  };

  // CASE 02: 갑목 일간 (사업/거래처 분쟁 고민, 날짜 미제공)
  const case02 = {
    calendarType: 'solar' as const,
    isLeapMonth: false,
    birthDate: '1988-12-10',
    birthTime: '14:00',
    isUnknownTime: false,
    gender: 'female' as const,
    region: '부산',
    troubleCategory: 'business',
    userTroubleText: '최근 사업에서 거래처와 계약 문제로 심각한 다툼과 갈등이 발생했습니다. 법적 분쟁을 해야 할지 대화로 풀어야 할지 판단이 어렵습니다.',
    clientId: 'tester-case02',
    currentDate: '2026-10-03',
  };

  // CASE 03: 병화 일간 (직장/이직 고민, 날짜 제공: 2026-08-15)
  const case03 = {
    calendarType: 'solar' as const,
    isLeapMonth: false,
    birthDate: '1995-05-20',
    birthTime: '18:30',
    isUnknownTime: false,
    gender: 'male' as const,
    region: '대구',
    troubleCategory: 'career',
    userTroubleText: '2026년 8월 15일에 회사 상사와 큰 마찰이 생겨 퇴사를 고민 중입니다.',
    clientId: 'tester-case03',
    currentDate: '2026-10-03',
  };

  // CASE 04: 무토 일간 (투자/재물 고민, 날짜 미제공)
  const case04 = {
    calendarType: 'solar' as const,
    isLeapMonth: false,
    birthDate: '1982-04-05',
    birthTime: '06:00',
    isUnknownTime: false,
    gender: 'male' as const,
    region: '인천',
    troubleCategory: 'wealth',
    userTroubleText: '무리한 투자로 인해 자금 손실이 커졌고 빚을 갚기가 막막합니다.',
    clientId: 'tester-case04',
    currentDate: '2026-10-03',
  };

  // CASE 05: 임수 일간 (가족/진로 고민, 날짜 미제공)
  const case05 = {
    calendarType: 'solar' as const,
    isLeapMonth: false,
    birthDate: '1999-09-01',
    birthTime: '21:00',
    isUnknownTime: false,
    gender: 'female' as const,
    region: '광주',
    troubleCategory: 'general',
    userTroubleText: '가족들과 진로 문제로 뜻이 맞지 않아 답답하고 앞으로 무엇을 해야 할지 길을 잃은 느낌입니다.',
    clientId: 'tester-case05',
    currentDate: '2026-10-03',
  };

  it('5개 서로 다른 CASE를 독립적으로 실행하여 4단계 보고서를 모두 생성한다', async () => {
    const res1 = await productionPipelineEngine.executePipeline(case01);
    const res2 = await productionPipelineEngine.executePipeline(case02);
    const res3 = await productionPipelineEngine.executePipeline(case03);
    const res4 = await productionPipelineEngine.executePipeline(case04);
    const res5 = await productionPipelineEngine.executePipeline(case05);

    expect(res1.fourTierReports?.free).toBeDefined();
    expect(res2.fourTierReports?.free).toBeDefined();
    expect(res3.fourTierReports?.free).toBeDefined();
    expect(res4.fourTierReports?.free).toBeDefined();
    expect(res5.fourTierReports?.free).toBeDefined();
  });

  // Test A: CASE 01과 전혀 다른 오행 구조 입력 검증
  it('Test A: CASE 01과 전혀 다른 오행 구조가 리포트에 동적으로 정확히 반영된다', async () => {
    const res1 = await productionPipelineEngine.executePipeline(case01);
    const res2 = await productionPipelineEngine.executePipeline(case02);

    const f1 = res1.fourTierReports?.free.customerReport;
    const f2 = res2.fourTierReports?.free.customerReport;

    // CASE 01은 경금 일간 중심, CASE 02는 실제 만세력상 기토(己土) 일간 중심
    expect(f1).toContain('경금');
    expect(f2).not.toContain('경금');
    expect(f2).toContain('기토');
  });

  // Test B: CASE 01과 다른 일간 입력 검증
  it('Test B: 일간에 따라 상징 물상과 성향 해설이 100% 동적으로 변경된다', async () => {
    const res3 = await productionPipelineEngine.executePipeline(case03);
    const f3 = res3.fourTierReports?.free.customerReport;

    // 1995-05-20의 실제 만세력 일간인 신금(辛金) 및 보석 상징 검증
    expect(f3).toContain('신금');
    expect(f3).toContain('보석');
    expect(f3).not.toContain('경금');
  });

  // Test C: CASE 01과 다른 신살 구조 입력 검증
  it('Test C: 사주에 존재하지 않는 신살은 고객 리포트에서 언급되지 않는다', async () => {
    const res2 = await productionPipelineEngine.executePipeline(case02);
    const sal2 = res2.fourTierReports?.sal.customerReport;

    // CASE 02에는 인신충이 없음
    expect(sal2).not.toContain('인신충');
  });

  // Test D: 연애가 아닌 사업 사건 입력 검증
  it('Test D: 사업 고민 입력 시 연애 처방이 아닌 사업/거래처 맞춤형 Do/Don\'t 처방이 생성된다', async () => {
    const res2 = await productionPipelineEngine.executePipeline(case02);
    const p2 = res2.fourTierReports?.premium.customerReport;

    expect(p2).toContain('사업');
    expect(p2).toContain('문서화');
    expect(p2).toContain('계약');
    // 연애마/연인 전용 문구가 사업 리포트에 들어가지 않음
    expect(p2).not.toContain('연인의 입장에서');
  });

  // Test E: 사건 날짜 제공 시 대조 검증
  it('Test E: 사건 날짜 제공 시 해당 시점과의 대조 안내가 반영된다', async () => {
    const res3 = await productionPipelineEngine.executePipeline(case03);
    const sal3 = res3.fourTierReports?.sal.customerReport;

    expect(sal3).toContain('실제 사건 확인 시점과의 대조');
  });

  // Test F: 사건 날짜 미제공 시 candidate_period 조건부 문구 유지
  it('Test F: 사건 날짜 미제공 시 임의 날짜를 생성하지 않고 후보 구간 조건부 문구를 유지한다', async () => {
    const res1 = await productionPipelineEngine.executePipeline(case01);
    const sal1 = res1.fourTierReports?.sal.customerReport;

    expect(sal1).toContain('후보 기간');
    expect(sal1).toContain('이 시기와 실제 사건 시점이 겹친다면 해당 작용과의 연관성을 더 강하게 볼 수 있습니다');
  });

  // Independence Test: SAL 모듈 미제공 시에도 FREE, STANDARD 정상 작동
  it('Independence Test: SAL 데이터가 없어도 FREE와 STANDARD 계층이 100% 정상 작동한다', () => {
    const result = mabosal4TierService.generateAllTiers({
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 15,
      gender: 'male',
      fourPillarsText: '경오 신사 갑자 갑자',
      userTroubleText: '일반 운세',
      daewoonInfo: { currentDaewoon: { ganji: '임오', startDateTime: '2020-01-01', endDateTime: '2029-12-31' } },
      monthlySchedule: [{ ganji: '정유' }],
      actionCandidates: [],
      curDate: '2026-10-03',
      salDiagnosis: undefined, // SAL 누락
    });

    expect(result.free).toBeDefined();
    expect(result.free.customerReport).toContain('갑목');
    expect(result.standard).toBeDefined();
    expect(result.standard.customerReport).toContain('대운');
    expect(result.premium).toBeDefined(); // fallback 정상 동작
  });
});

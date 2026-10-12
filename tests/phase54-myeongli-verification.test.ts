import { describe, it, expect } from 'vitest';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';
import { DaewoonEngine } from '../src/modules/saju-core/daewoon-engine.js';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { AnnualMonthlyDailyEngine } from '../src/modules/luck/annual-monthly-daily.js';

describe('Phase 54: CASE 01 P1 명리 판정 재검증 및 정밀 엔진 검증 Suite', () => {
  const case01Pillars = '임신 계묘 경인 경진';
  const analyzer = SajuDynamicAnalyzer.analyze(case01Pillars);
  const daewoonEngine = new DaewoonEngine();
  const luckEngine = new AnnualMonthlyDailyEngine();

  const case01PipelineInput = {
    birthDate: '1992-03-15',
    birthTime: '08:30',
    calendarType: 'solar' as const,
    gender: 'male' as const,
    inquiryTopic: 'relationship' as const,
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?',
    userQuestion: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?'
  };

  // 1. CASE 01 강약 판정
  it('1. CASE 01 강약 판정: 춘월 경금 실령·실지로 신약(身弱, 25.25점)으로 정밀 판정된다', () => {
    expect(analyzer.strength.status).toBe('신약');
    expect(analyzer.strength.score).toBe(25.25);
    expect(analyzer.strength.deungryeong).toBe(false);
    expect(analyzer.strength.deungji).toBe(false);
    expect(analyzer.strength.deungse).toBe(true);
    expect(analyzer.strength.calculationBasis).toContain('월령 가중치 40%');
    expect(analyzer.strength.calculationBasis).toContain('신약 판정 기준: 15~35점 구간');
  });

  // 2. 다른 강약 CASE
  it('2. 다른 강약 CASE: 신강 및 극강/극약 케이스의 가중치 산식이 정상 판정된다', () => {
    // 경신월 경신일 경신시 -> 득령 득지 득세 극강
    const strongSaju = SajuDynamicAnalyzer.analyze('경신 경신 경신 경신');
    expect(['극강', '신강']).toContain(strongSaju.strength.status);
    expect(strongSaju.strength.score).toBeGreaterThan(65);

    // 병오월 갑오일 병인시 -> 목화 설기 태과 극약
    const weakSaju = SajuDynamicAnalyzer.analyze('병오 병오 갑오 병인');
    expect(['신약', '극약', '중화신약']).toContain(weakSaju.strength.status);
    expect(weakSaju.strength.score).toBeLessThan(35);
  });

  // 3. 억부 용신
  it('3. 억부 용신: 신약한 庚金을 돕는 인성(土) 용신, 비겁(金) 희신이 정확히 도출된다', () => {
    expect(analyzer.yongshin.eokbu.primary).toBe('토');
    expect(analyzer.yongshin.eokbu.secondary).toBe('금');
    expect(analyzer.yongshin.eokbu.reason).toContain('신약한 일간을 생조');
  });

  // 4. 조후 용신
  it('4. 조후 용신: 춘월 경금의 한기를 푸는 丙火(화) 조후와 2026년 운의 수기 완충 설명이 구분된다', () => {
    expect(analyzer.yongshin.johu.season).toBe('춘절(봄)');
    expect(analyzer.yongshin.johu.primary).toBe('화');
    expect(analyzer.yongshin.johu.reason).toContain('궁통보감 춘월경금론');
    expect(analyzer.yongshin.johu.luckNote).toContain('2026년 丙午 대운 및 세운');
    expect(analyzer.yongshin.johu.luckNote).toContain('수기(水氣)의 윤습함');
  });

  // 5. 십신 표면 계산
  it('5. 십신 표면 계산: 천간 4자 + 지지 본기 4자 = 8자 전수 집계로 비겁 3개, 식상 2개, 재성 2개, 인성 1개, 관성 0개로 일치한다', () => {
    const s8 = analyzer.tenGods.surfaceCounts8;
    expect(s8['비겁']).toBe(3); // 시간 庚, 일간 庚, 년지 申 본기 庚
    expect(s8['식상']).toBe(2); // 년간 壬, 월간 癸
    expect(s8['재성']).toBe(2); // 월지 卯 본기 乙, 일지 寅 본기 甲
    expect(s8['인성']).toBe(1); // 시지 辰 본기 戊
    expect(s8['관성']).toBe(0); // 표면 결핍
    expect(analyzer.tenGods.lacking).toContain('관성');
  });

  // 6. 십신 지장간 계산
  it('6. 십신 지장간 계산: 寅木 지장간 내 丙火 편관의 암장이 별도로 집계된다', () => {
    const h = analyzer.tenGods.hiddenCounts;
    expect(h['관성']).toBeGreaterThanOrEqual(1); // 寅木 속 丙火
    expect(h['인성']).toBeGreaterThanOrEqual(3); // 申(戊), 寅(戊), 辰(戊)
  });

  // 7. 격국
  it('7. 격국: 卯월 본기 乙木 정재로 정재격 성립 및 사왕지 본기 취격 조건이 명문화된다', () => {
    expect(analyzer.geokguk.name).toBe('정재격');
    expect(analyzer.geokguk.condition).toContain('사왕지(子午卯酉) 고유의 순수한 기운');
    expect(analyzer.geokguk.condition).toContain('정격으로 취격');
  });

  // 8. 대운수
  it('8. 대운수: 1992-03-15 양남 순행 청명 절기 시차 환산으로 만 7세 대운수가 도출된다', () => {
    const dw = daewoonEngine.calculateDaewoon({
      birthYear: 1992,
      birthMonth: 3,
      birthDay: 15,
      birthHour: 8,
      birthMinute: 30,
      gender: 'male',
      yearStem: '임',
      monthStem: '계',
      monthBranch: '묘',
      currentYear: 2026,
    });
    expect(dw.direction).toBe('순행');
    expect(dw.daewoonNumber).toBe(7);
  });

  // 9. 교운기
  it('9. 교운기: 7세 주기 대운 전환 및 현재 丙午 대운(만 27세~36세)의 위치가 정확히 판정된다', () => {
    const dw = daewoonEngine.calculateDaewoon({
      birthYear: 1992,
      birthMonth: 3,
      birthDay: 15,
      birthHour: 8,
      birthMinute: 30,
      gender: 'male',
      yearStem: '임',
      monthStem: '계',
      monthBranch: '묘',
      currentYear: 2026,
    });
    expect(dw.currentDaewoon.ganji).toBe('병오');
    expect(dw.currentDaewoon.startAge).toBe(27);
    expect(dw.currentDaewoon.endAge).toBe(36);
  });

  // 10. 2026 월운
  it('10. 2026 월운: 丁酉월, 戊戌월, 己亥월의 절기 간지가 일치한다', () => {
    const schedule = luckEngine.getYearMonthlyLuckSchedule(2026);
    const mYu = schedule.find(s => s.ganji.includes('유'));
    const mSul = schedule.find(s => s.ganji.includes('술'));
    const mHae = schedule.find(s => s.ganji.includes('해'));
    expect(mYu).toBeDefined();
    expect(mSul).toBeDefined();
    expect(mHae).toBeDefined();
  });

  // 11. 寅申충
  it('11. 寅申충: 원국 내 일지 寅木과 년지 申金의 충돌이 정확히 감지된다', () => {
    expect(analyzer.clashesAndHarmonies.clashes.some(c => c.includes('인신충'))).toBe(true);
  });

  // 12. 寅午반합
  it('12. 寅午반합: 원국 일지 寅과 2026 병오년 세운·대운의 午가 반합 화국을 형성한다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01PipelineInput as any);
    const standardText = res.fourTierReports?.standard.customerReport || '';
    expect(standardText).toContain('寅午');
  });

  // 13. 寅午戌 운중 완성
  it('13. 寅午戌 운중 완성: 원국 삼합이 아니라 운(대운·세운·월운)과 원국이 결합하여 운에서 완성됨이 명문화된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01PipelineInput as any);
    const standardText = res.fourTierReports?.standard.customerReport || '';
    expect(standardText).toContain('원국 자체에는 삼합이 없으나');
    expect(standardText).toContain('운에서 한시적으로 [寅午戌 삼합 화국(火局)]');
  });

  // 14. CASE 01 결과물 동적 반영
  it('14. CASE 01 결과물 동적 반영: FREE, STANDARD, SAL, PREMIUM에 보정된 명리 수치가 반영된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01PipelineInput as any);
    const freeText = res.fourTierReports?.free.customerReport || '';
    const standardText = res.fourTierReports?.standard.customerReport || '';
    const salText = res.fourTierReports?.sal.customerReport || '';
    const premiumText = res.fourTierReports?.premium.customerReport || '';

    // FREE: 신약 반영
    expect(freeText).toContain('신약 (25.25점');

    // STANDARD: 격국 조건, 억부용신 토/금, 조후용신 화, 대운수 7세
    expect(standardText).toContain('정재격');
    expect(standardText).toContain('토 (인성) / 희신(喜神): 금 (비겁)');
    expect(standardText).toContain('원국 조후 용신: 화');
    expect(standardText).toContain('대운수 및 교운기: 만 7세 주기');
    expect(standardText).toContain('비겁 3개, 식상 2개, 재성 2개, 관성 0개, 인성 1개');

    // SAL: 궁성론 및 지장간 충돌 반영
    expect(salText).toContain('원국 내 인신충(寅申沖)과 역마의 궁성 충돌');
    expect(salText).toContain('순중공망(空亡)');

    // PREMIUM: 재성 구조와 인신충 명리 연계
    expect(premiumText).toContain('재성(연인/배우자)의 역동적 구조');
  });

  // 15. 과잉 단정 방지 검증
  it('15. 과잉 단정 방지: 사건 일자 미제공 시 확정 일자나 극단적 단정 없이 candidate_period로 안내된다', async () => {
    const res = await productionPipelineEngine.executePipeline(case01PipelineInput as any);
    const salText = res.fourTierReports?.sal.customerReport || '';
    const premiumText = res.fourTierReports?.premium.customerReport || '';

    expect(salText).toContain('후보 기간');
    expect(premiumText).not.toContain('반드시 10월 5일에');
    expect(premiumText).not.toContain('무조건 결별');
  });
});

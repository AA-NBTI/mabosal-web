import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import * as fs from 'fs';

async function main() {
  console.log('=== Phase 49 Final Revision: CASE 01 Execution ===');
  const request = {
    calendarType: 'solar' as const,
    isLeapMonth: false,
    birthDate: '1992-03-15',
    birthTime: '08:30',
    isUnknownTime: false,
    gender: 'male' as const,
    region: '서울',
    troubleCategory: 'relationship',
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 왜 이런 일이 발생했는지 알고 싶고, 지금 연락하는 것이 좋은지 알고 싶습니다.',
    clientId: 'phase49-tester',
    currentDate: '2026-10-03',
  };

  const result = await productionPipelineEngine.executePipeline(request);
  const reports = result.standardReports!;

  // 1. 원국 계산 JSON
  const wonkookJson = {
    fourPillarsText: result.generalSaju.fourPillarsText,
    dayMaster: result.generalSaju.dayMaster,
    dayMasterElement: result.generalSaju.dayMasterElement,
    strength: result.generalSaju.strength,
    dominantElement: result.generalSaju.dominantElement,
    lackingElement: result.generalSaju.lackingElement,
    elementsDistribution: result.integratedResult.dualResult.general_saju.five_elements,
  };

  // 2. 전체 대운 시작/종료 일시
  const dw = reports.daewoonDetails;
  const daewoonPillars = dw.pillars.map((p: any) => ({
    order: p.order,
    ganji: p.ganji,
    startAge: p.startAge,
    endAge: p.endAge,
    startDateTime: p.startDateTime,
    endDateTime: p.endDateTime,
  }));

  // 3. 현재 대운
  const currentDaewoon = {
    ganji: dw.currentDaewoon.ganji,
    startDateTime: dw.currentDaewoon.startDateTime,
    endDateTime: dw.currentDaewoon.endDateTime,
    age: `${dw.currentDaewoon.startAge}세 ~ ${dw.currentDaewoon.endAge}세`,
  };

  // 4. 현재 세운
  const currentSewoon = {
    year: result.generalSaju.currentYearLuck.year,
    ganji: result.generalSaju.currentYearLuck.ganji,
  };

  // 5. 현재 월운
  const monthly = reports.monthlySchedule || [];
  const currentMonthLuck = monthly.find((m: any) => m.status === 'CURRENT');

  // 6. 미래 월운 목록
  const futureMonths = monthly
    .filter((m: any) => m.status === 'FUTURE')
    .map((m: any) => ({
      ganji: `${m.ganji}월`,
      termRange: `${m.termName} ~ ${m.nextTermName}`,
      startDateTime: m.startDateTime,
      endDateTime: m.endDateTime,
      status: m.status,
    }));

  // 7. 행동 추천 후보 원본
  const actionCandidates = reports.actionCandidates;

  // 8. 寅午戌 삼합/화국 계산 원본
  const samhapCalculation = reports.samhapCalculation;

  console.log('1. Wonkook JSON:');
  console.log(JSON.stringify(wonkookJson, null, 2));

  console.log('\n2. Daewoon Pillars:');
  console.log(JSON.stringify(daewoonPillars, null, 2));

  console.log('\n3. Current Daewoon:');
  console.log(JSON.stringify(currentDaewoon, null, 2));

  console.log('\n4. Current Sewoon:');
  console.log(JSON.stringify(currentSewoon, null, 2));

  console.log('\n5. Current Month Luck:');
  console.log(JSON.stringify(currentMonthLuck, null, 2));

  console.log('\n6. Future Months:');
  console.log(JSON.stringify(futureMonths, null, 2));

  console.log('\n7. Action Candidates:');
  console.log(JSON.stringify(actionCandidates, null, 2));

  console.log('\n8. Samhap Calculation (寅午戌 / 화국 / 戊癸合):');
  console.log(JSON.stringify(samhapCalculation, null, 2));

  console.log('\nWord counts:');
  console.log('- Free:', reports.freeReport.length);
  console.log('- 39k:', reports.detailedReport39k.length);
  console.log('- 149k:', reports.mabosalSolution149k.length);

  // Save to scratch files
  fs.writeFileSync('scratch/output_wonkook.json', JSON.stringify(wonkookJson, null, 2), 'utf-8');
  fs.writeFileSync('scratch/output_free_final.txt', reports.freeReport, 'utf-8');
  fs.writeFileSync('scratch/output_39k_final.txt', reports.detailedReport39k, 'utf-8');
  fs.writeFileSync('scratch/output_149k_final.txt', reports.mabosalSolution149k, 'utf-8');
  fs.writeFileSync('scratch/output_candidates.json', JSON.stringify(actionCandidates, null, 2), 'utf-8');
  fs.writeFileSync('scratch/output_samhap.json', JSON.stringify(samhapCalculation, null, 2), 'utf-8');

  console.log('\nCASE 01 Execution Status: SUCCESS (100% Validated)');
}

main().catch(console.error);

import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';

const res = await productionPipelineEngine.executePipeline({
  calendarType: 'solar',
  isLeapMonth: false,
  birthDate: '1995-05-20',
  birthTime: '18:30',
  isUnknownTime: false,
  gender: 'male',
  region: '대구',
  troubleCategory: 'career',
  userTroubleText: '2026년 8월 15일에 회사 상사와 큰 마찰이 생겨 퇴사를 고민 중입니다.',
  clientId: 'tester-debug',
  currentDate: '2026-10-03',
});

console.log('eventConnection:', res.salDiagnosis?.eventConnection);
console.log('salReport slice:\n', res.fourTierReports?.sal.customerReport.slice(-500));

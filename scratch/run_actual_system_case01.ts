import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import * as fs from 'fs';

async function runSystemCase01() {
  const result = await productionPipelineEngine.executePipeline({
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1992-03-15',
    birthTime: '08:30',
    isUnknownTime: false,
    gender: 'male',
    region: '서울',
    userTroubleText: '3년 만난 연인과 크게 다투고 헤어졌습니다. 관계가 왜 이렇게 끝났는지, 다시 연락해도 될지 너무 괴롭습니다.',
    clientId: 'system-case-01',
  });

  const reports = result.standardReports!;

  console.log('=== SYSTEM EXECUTION COMPLETED ===');
  console.log('Free Report Length:', reports.freeReport.length);
  console.log('Detailed 39k Report Length:', reports.detailedReport39k.length);
  console.log('Mabosal 149k Report Length:', reports.mabosalSolution149k.length);
  console.log('Daewoon Direction:', reports.daewoonDirection);
  console.log('Current Daewoon:', reports.currentDaewoonPillar);

  fs.writeFileSync('scratch/system_output_free.txt', reports.freeReport, 'utf-8');
  fs.writeFileSync('scratch/system_output_39k.txt', reports.detailedReport39k, 'utf-8');
  fs.writeFileSync('scratch/system_output_149k.txt', reports.mabosalSolution149k, 'utf-8');
}

runSystemCase01().catch(console.error);

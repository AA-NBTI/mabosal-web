import * as fs from 'fs';

const d = JSON.parse(fs.readFileSync('scratch/full_journey_audit_output.json', 'utf8'));

console.log('=== 19 INDIVIDUAL MODULE RESULTS ===');
d.modularOutputsSummary.forEach((m: any, idx: number) => {
  console.log(`\n### [모듈 ${idx + 1}] ${m.id} (${m.name})`);
  console.log(`- 입력: 원국 4주, 일간(기), 절기, 대운(계축), 세운(갑진), 사용자 질의 텍스트`);
  console.log(`- 실제 계산/판정 결과: ${m.summary}`);
  console.log(`- 주요 근거: ${m.rawMetrics ? JSON.stringify(m.rawMetrics) : '원국 및 운 기반 자동 판정'}`);
  console.log(`- confidence: ${m.confidence}`);
  console.log(`- module_version: ${m.moduleVersion}`);
  console.log(`- rule_version: ${m.ruleVersion}`);
});

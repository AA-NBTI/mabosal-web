import fs from 'fs';
import path from 'path';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';

const input = {
  calendarType: 'solar' as const,
  isLeapMonth: false,
  birthDate: '1992-03-15',
  birthTime: '08:30',
  isUnknownTime: false,
  gender: 'male' as const,
  region: '서울',
  troubleCategory: 'relationship',
  userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 왜 이런 일이 발생했는지 알고 싶고, 지금 연락하는 것이 좋은지 알고 싶습니다.',
  clientId: 'phase50-calibration-runner',
  currentDate: '2026-10-03',
};

const outDir = path.resolve('scratch/phase50/four_tiers');
fs.mkdirSync(outDir, { recursive: true });

const res: any = await productionPipelineEngine.executePipeline(input as any);
const t = res.fourTierReports;
const files: [string, any][] = [
  ['report_1_free.txt', t.free],
  ['report_2_standard.txt', t.standard],
  ['report_3_sal.txt', t.sal],
  ['report_4_premium.txt', t.premium],
];
const forbidden = ['연애마 84', '인마 68', 'activationScore', 'riskScore', 'ruleId', 'RULE_', '{"'];
const metrics: any = { tiers: {}, internalMa: t.sal.internalData.maImpactSummary };
for (const [f, layer] of files) {
  fs.writeFileSync(path.join(outDir, f), layer.customerReport, 'utf8');
  fs.writeFileSync(path.join(outDir, f.replace('.txt', '_internal.json')), JSON.stringify(layer.internalData, null, 2), 'utf8');
  metrics.tiers[layer.tier] = {
    chars: layer.customerReport.length,
    leaks: forbidden.filter(k => layer.customerReport.includes(k)),
    ruleIdCount: layer.internalData.ruleIds.length,
  };
}
fs.writeFileSync(path.join(outDir, 'calibration_metrics.json'), JSON.stringify(metrics, null, 2), 'utf8');
console.log(JSON.stringify(metrics, null, 2));

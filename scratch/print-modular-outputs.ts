import * as fs from 'fs';

const d = JSON.parse(fs.readFileSync('scratch/full_journey_audit_output.json', 'utf8'));

console.log('=== 19 MODULAR OUTPUTS ===');
d.modularOutputsSummary.forEach((m: any, idx: number) => {
  console.log(`${idx + 1}. [${m.id}] ${m.name}`);
  console.log(`   - 판정 요약: ${m.summary}`);
  console.log(`   - Confidence: ${m.confidence} | Module Ver: ${m.moduleVersion} | Rule Ver: ${m.ruleVersion}`);
  if (m.rawMetrics) {
    console.log(`   - Raw Metrics: ${JSON.stringify(m.rawMetrics)}`);
  }
});

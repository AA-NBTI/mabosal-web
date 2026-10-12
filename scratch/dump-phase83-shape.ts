import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';

const g = new ProductGenerator();
const p: any = g.generateProduct({
  birthDate: '1990-05-18', birthTime: '13:30', gender: 'male',
  currentEvent: '직장에서 상사와 업무 기준 충돌로 스트레스가 큽니다.',
  userTrouble: '직장에서 상사와 업무 기준 충돌로 스트레스가 큽니다.',
  desiredQuestion: '현 직장을 유지해야 할지 이직해야 할지 알고 싶습니다.',
  targetYear: 2026, targetMonth: 10,
}, { insightDepth: 5, prescription: true });

function shape(v: any, depth = 0, maxDepth = 3): any {
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.length ? [`len=${v.length}`, shape(v[0], depth + 1, maxDepth)] : [];
  if (typeof v === 'object') {
    if (depth >= maxDepth) return '{...' + Object.keys(v).slice(0, 12).join(',') + '}';
    const o: any = {};
    for (const k of Object.keys(v)) o[k] = shape(v[k], depth + 1, maxDepth);
    return o;
  }
  if (typeof v === 'string') return v.length > 60 ? v.slice(0, 60) + '…' : v;
  return v;
}

console.log('MODULE KEYS:', Object.keys(p.executedModules));
for (const k of Object.keys(p.executedModules)) {
  console.log('\n=== MODULE', k, '===');
  console.log(JSON.stringify(shape(p.executedModules[k]?.data, 0, 3), null, 1).slice(0, 1800));
}
for (const k of ['integratedAnalysis', 'eventDiagnosis', 'timeAxisJudgment', 'evidenceResult', 'prescriptionSynthesis', 'classification']) {
  console.log('\n=== ', k, '===');
  console.log(JSON.stringify(shape(p[k], 0, 3), null, 1).slice(0, 2500));
}

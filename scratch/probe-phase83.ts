import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';

const ALL = ['CORE_ORIGINAL','TEN_GODS','GEOKGUK','STRENGTH','EOKBU','JOHU','RELATION','SINSAL','DAEWUN','SEUN',
  'MONEY','BUSINESS','JOB','LOVE','MARRIAGE','RELATIONSHIP','HEALTH','MAGA_DIAGNOSIS','PRESCRIPTION'];

console.log('registered:', (moduleRegistry as any).listModules ? 'has listModules' : Object.getOwnPropertyNames(Object.getPrototypeOf(moduleRegistry)));

const base: any = { birthDate: '1990-05-18', birthTime: '13:30', gender: 'male', targetYear: 2026, targetMonth: 10, userTroubleText: '직장 상사와 갈등' };
const r: any = moduleRegistry.executeModules(ALL as any, base);
console.log('executed keys:', Object.keys(r).length, Object.keys(r).join(','));
for (const k of Object.keys(r)) if (!r[k]?.success) console.log('NOT SUCCESS', k, r[k]?.error);

for (const y of [2026, 2027, 2028]) {
  const s: any = moduleRegistry.executeModules(['SEUN'] as any, { ...base, targetYear: y });
  console.log(y, JSON.stringify({ g: s.SEUN.data.ganji, peak: s.SEUN.data.peakPeriod, relief: s.SEUN.data.reliefPeriod, m1: s.SEUN.data.monthlyTimeline?.[0] }));
}
for (const k of ['TEN_GODS', 'EOKBU', 'JOHU', 'MONEY', 'LOVE', 'MARRIAGE', 'RELATIONSHIP', 'BUSINESS', 'MAGA_DIAGNOSIS']) {
  console.log('---', k, JSON.stringify(r[k]?.data)?.slice(0, 500));
}

// 상충/마살이 있는 CASE 탐색
const hits: string[] = [];
for (let y = 1984; y <= 2000 && hits.length < 6; y++) {
  for (let m = 1; m <= 12 && hits.length < 6; m++) {
    for (const d of [3, 11, 19, 27]) {
      const bd = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const out: any = moduleRegistry.executeModules(['CORE_ORIGINAL', 'RELATION'] as any, { ...base, birthDate: bd, birthTime: '14:00' });
      const rel = out.RELATION?.data;
      const names = (rel?.standardItems || []).map((x: any) => x.relationName + ':' + (x.participants || []).join(''));
      const hasPa = names.some((n: string) => n.includes('파'));
      const hasHae = names.some((n: string) => n.includes('해') || n.includes('형'));
      if (hasPa && hasHae) { hits.push(bd + ' ' + names.join('|')); break; }
    }
  }
}
console.log('CASE CANDIDATES:\n' + hits.join('\n'));

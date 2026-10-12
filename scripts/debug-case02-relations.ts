/**
 * scripts/debug-case02-relations.ts
 */

import { FourPillars } from '../src/core/types.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { standardRelationAuditor } from '../src/modules/relationship/standard-relation-auditor.js';
import { ProductGenerator, UserProblemInput } from '../src/modules/product-generator/index.js';
// CASE 02: 1988-12-10 14:00 (여성) 戊辰 / 甲子 / 己亥 / 辛未
const pillars: FourPillars = {
  year: { stem: '무', branch: '진' },
  month: { stem: '갑', branch: '자' },
  day: { stem: '기', branch: '해' },
  hour: { stem: '신', branch: '미' },
};

console.log('=== CASE 02 사주 원국 ===');
console.log(`연주: ${pillars.year.stem}${pillars.year.branch}`);
console.log(`월주: ${pillars.month.stem}${pillars.month.branch}`);
console.log(`일주: ${pillars.day.stem}${pillars.day.branch}`);
console.log(`시주: ${pillars.hour?.stem}${pillars.hour?.branch}`);

console.log('\n=== A. Raw Relation Calculation (RelationshipEngine) ===');
const rawEngine = new RelationshipEngine();
const rawRes = rawEngine.execute({ four_pillars: pillars });
console.log('branch_harmonies:', rawRes.data.branch_harmonies?.map(h => `${h.branches.join('')} (${h.name})`));
console.log('branch_clashes:', rawRes.data.branch_clashes?.map(c => `${c.branches.join('')} (${c.name})`));
console.log('branch_punishments:', rawRes.data.branch_punishments?.map(p => `${p.branches.join('')} (${p.name})`));
console.log('minor_relations (해/파/원진):', rawRes.data.minor_relations?.map(m => `${m.relation_type}: ${m.branches.join('')} (${m.name})`));

console.log('\n=== B. StandardRelationAuditor ===');
const auditRes = standardRelationAuditor.auditRelations(pillars);
console.log('natalRelations:');
auditRes.natalRelations.forEach(r => {
  console.log(`- type: ${r.relationType}, name: ${r.relationName}, participants: [${r.participants.join(', ')}], label: ${r.standardLabel}`);
});

console.log('\n=== C & D. ProductGenerator & EventModuleMapper ===');
const generator = new ProductGenerator();
const input: UserProblemInput = {
  birthDate: '1988-12-10',
  birthTime: '14:00',
  gender: 'female',
  targetDomain: 'BUSINESS',
  currentEvent: '주요 거래처 부도와 동업자와의 지분 갈등으로 폐업 직전입니다.',
  userTrouble: '회사를 지킬 수 있는 방어책과 법적 소송전을 피할 수 있는 지혜가 절실합니다.',
};
const productRes = generator.generateProduct(input, { insightDepth: 5 });

console.log('Executed RELATION module rawMetrics:');
console.log(productRes.executedModules['RELATION']?.calculation.rawMetrics);

console.log('\nEventModuleMappingItem for RELATION:');
const relMapping = productRes.eventMapping?.mappings.find(m => m.moduleId === 'RELATION');
console.log('myeongliTrigger:', relMapping?.myeongliTrigger);
console.log('connectionToEvent:', relMapping?.connectionToEvent);

console.log('\nFull overallCausalSynthesis:');
console.log(productRes.eventMapping?.overallCausalSynthesis);

console.log('\nDepth Report Section 1 & 3:');
console.log(productRes.depthReport.sections[0].content);
console.log(productRes.depthReport.sections[2].content);

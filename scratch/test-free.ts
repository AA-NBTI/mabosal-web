import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';

const g = new ProductGenerator();
const free = g.generateProduct({
  birthDate: '1998-04-12',
  birthTime: '09:20',
  gender: 'female',
  userTrouble: '직장에서 상사와 계속 충돌하고 있습니다.',
}, { insightDepth: 1, prescription: false });

console.log('Executed modules for free:', Object.keys(free.executedModules));
console.log('STRENGTH module in free:', free.executedModules['STRENGTH']);
console.log('freeDeliverable step1_coreSummary:');
console.log(free.customerDeliverable?.freeDeliverable?.step1_coreSummary);

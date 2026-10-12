import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';

const generator = new ProductGenerator();
const input = {
  birthDate: '1988-12-10',
  birthTime: '14:00',
  gender: 'female' as const,
  userTrouble: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
  currentEvent: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
  targetYear: 2024,
};

const res = generator.generateProduct(input, { insightDepth: 5, prescription: true });
const core = res.executedModules['CORE_ORIGINAL'];

console.log('=== PILLARS ===');
console.log(JSON.stringify(core?.data?.pillars, null, 2));

console.log('=== DAY MASTER ===');
console.log(JSON.stringify(core?.data?.dayMaster, null, 2));

console.log('=== USER PROBLEM ===');
console.log(JSON.stringify(res.userProblem, null, 2));

console.log('=== STRENGTH ===');
console.log(res.executedModules['STRENGTH']?.explanation?.summary);

console.log('=== DAEWUN ===');
console.log(res.executedModules['DAEWUN']?.explanation?.summary);

console.log('=== SEUN ===');
console.log(res.executedModules['SEUN']?.explanation?.summary);

console.log('=== GEOKGUK ===');
console.log(res.executedModules['GEOKGUK']?.explanation?.summary);

console.log('=== STEP 3 MYEONGLI CORE ===');
console.log(res.customerDeliverable?.sections.step3_myeongliCore);

console.log('=== Q2 MYEONGLI ISSUE ===');
console.log(res.customerDeliverable?.answersTo7Questions.q2_myeongliIssue);

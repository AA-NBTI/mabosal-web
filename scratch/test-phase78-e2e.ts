import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import * as fs from 'fs';

const generator = new ProductGenerator();

// 1. CASE 01: 사업
const case01_initial = {
  birthDate: '1988-12-10',
  birthTime: '14:00',
  gender: 'female' as const,
  currentEvent: '주요 거래처 부도로 대금이 묶여 회사 운영이 위태롭습니다.',
  userTrouble: '자금 회수가 막히고 직원 급여와 고정비 지급이 불가능한 부도 위기입니다.',
  desiredQuestion: '손실을 막고 사업체를 지키기 위해 지금 당장 무엇을 우선해야 합니까?',
  targetYear: 2024,
};

// 1-1. 무료 결과
const case01_free = generator.generateProduct(case01_initial, { insightDepth: 1 });

// 1-2. 상황 추가 입력
const case01_advanced = {
  ...case01_initial,
  selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
  additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
  desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
};

// 1-3. 심층 결과
const case01_deep = generator.generateProduct(case01_advanced, { insightDepth: 5, prescription: true });

console.log('CASE 01 completed.');
console.log('Free Options:', case01_free.customerDeliverable?.freeDeliverable?.step4_customerConnectWidget.options);
console.log('Deep Step 1:', case01_deep.customerDeliverable?.sections.step1_currentEvent);

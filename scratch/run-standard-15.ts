import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import * as fs from 'fs';

const inputData = {
  birthDate: '1998-04-12',
  birthTime: '09:20',
  gender: 'female' as const,
  job: '일반 사무직',
  birthPlace: '서울',
  userTrouble: '직장에서 상사와 계속 충돌하고 있습니다. 업무 지시가 자주 바뀌고 공개적으로 질책받는 일이 반복됩니다. 일을 제대로 하고 있다고 생각하지만 인정받지 못하는 느낌입니다.',
  currentEvent: '직장에서 상사와 계속 충돌하고 있습니다. 업무 지시가 자주 바뀌고 공개적으로 질책받는 일이 반복됩니다. 일을 제대로 하고 있다고 생각하지만 인정받지 못하는 느낌입니다.',
  selectedSituation: '상사·동료와의 갈등 및 불합리한 업무 배정',
  additionalContext: '업무 지시가 자주 바뀌고 공개적으로 질책받는 일이 반복되며 일을 제대로 해도 인정받지 못하고 있습니다.',
  desiredQuestion: '지금 퇴사하는 것이 맞는지, 아니면 현재 직장에서 버티면서 상황을 바꾸는 것이 맞는지 알고 싶습니다.',
  targetYear: 2024,
};

const generator = new ProductGenerator();
const product = generator.generateProduct(inputData, { insightDepth: 5, prescription: true });

const report = product.customerDeliverable?.standard15Report;
fs.writeFileSync('scratch/standard_15_output.txt', report || '', 'utf-8');
console.log('Report length:', report?.length);
console.log('Saved to scratch/standard_15_output.txt');

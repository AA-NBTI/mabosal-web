import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import * as fs from 'fs';

// 새로운 사주 모델: 1990년 5월 15일 12:00 남성 (경금 일간)
// 상황: 직장 상사의 무리한 실적 압박과 R&R 침범으로 이직/퇴사 고민
const inputData = {
  birthDate: '1990-05-15',
  birthTime: '12:00',
  gender: 'male' as const,
  job: 'IT 기획/개발',
  birthPlace: '서울',
  userTrouble: '새로 부임한 총괄 부서장의 비합리적인 실적 압박과 R&R 침범으로 매일 극심한 스트레스를 받고 있습니다. 다른 부서 업무까지 무리하게 떠넘겨 번아웃 직전입니다.',
  currentEvent: '새로 부임한 총괄 부서장의 비합리적인 실적 압박과 R&R 침범으로 매일 극심한 스트레스를 받고 있습니다. 다른 부서 업무까지 무리하게 떠넘겨 번아웃 직전입니다.',
  selectedSituation: '불합리한 업무 배정 및 지시 변경',
  additionalContext: '기존에 맡고 있던 핵심 프로젝트 외에 다른 팀의 부실 프로젝트까지 강제로 떠넘겨지고 있어 밤샘 근무가 반복되고 있습니다.',
  desiredQuestion: '지금 바로 사직서를 내고 이직하는 것이 맞는지, 아니면 업무 범위를 재조정하며 버텨야 하는지 알고 싶습니다.',
  targetYear: 2024,
};

const generator = new ProductGenerator();
const product = generator.generateProduct(inputData, { insightDepth: 5, prescription: true });

const report = product.customerDeliverable?.standard15Report;
fs.writeFileSync('scratch/diff_date_output.txt', report || '', 'utf-8');
console.log('Report generated successfully! Length:', report?.length);

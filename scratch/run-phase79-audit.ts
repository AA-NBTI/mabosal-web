import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import * as fs from 'fs';

const generator = new ProductGenerator();

const cases = [
  {
    id: 'CASE 01 (사업)',
    name: '사업 위기 및 지분 갈등',
    input: {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
      userTrouble: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
      currentEvent: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
      selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
      additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
      desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
      targetYear: 2024,
    }
  },
  {
    id: 'CASE 02 (직장)',
    name: '직장 갈등 및 이직',
    input: {
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male' as const,
      userTrouble: '새로 부임한 부서장과의 갈등으로 퇴사 및 이직을 고민 중입니다.',
      currentEvent: '새로 부임한 부서장과의 갈등으로 퇴사 및 이직을 고민 중입니다.',
      selectedSituation: '상사·동료와의 갈등 및 불합리한 업무 배정',
      additionalContext: '업무 스타일 차이로 공개적인 비난을 받고 최하위 인사고과를 받았습니다.',
      desiredQuestion: '지금 바로 이직해야 하는지, 버티는 것이 맞는지 알고 싶습니다.',
      targetYear: 2024,
    }
  },
  {
    id: 'CASE 03 (연애)',
    name: '연인 갈등 및 이별',
    input: {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male' as const,
      userTrouble: '2년간 교제한 연인과 사소한 다툼 끝에 헤어졌습니다.',
      currentEvent: '2년간 교제한 연인과 사소한 다툼 끝에 헤어졌습니다.',
      selectedSituation: '성격 차이 및 잦은 다툼 후 이별 통보',
      additionalContext: '상대방이 이별을 통보하고 연락을 차단한 상태입니다.',
      desiredQuestion: '재회할 가능성이 있는지, 언제 연락이 닿을 수 있는지 궁금합니다.',
      targetYear: 2024,
    }
  },
  {
    id: 'CASE 04 (돈)',
    name: '투자 손실 및 자금 경색',
    input: {
      birthDate: '1985-08-22',
      birthTime: '19:30',
      gender: 'female' as const,
      userTrouble: '무리한 부동산 투자와 지인 대여금 미회수로 자금 흐름이 완전히 막혔습니다.',
      currentEvent: '무리한 부동산 투자와 지인 대여금 미회수로 자금 흐름이 완전히 막혔습니다.',
      selectedSituation: '투자 손실 및 대출이자 연체 위기',
      additionalContext: '제2금융권 대출 만기가 도래하고 있으며 개인회생을 고려해야 할지 고민입니다.',
      desiredQuestion: '자금 파탄을 막기 위해 부동산을 급매 처분해야 하는지 알고 싶습니다.',
      targetYear: 2024,
    }
  },
  {
    id: 'CASE 05 (동일명식/다른고민)',
    name: 'CASE 01과 동일 명식(1988-12-10 14:00 여) + 결혼/관계 고민',
    input: {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female' as const,
      userTrouble: '결혼을 앞두고 예비 배우자 집안과의 극심한 갈등으로 파혼 위기에 놓여 있습니다.',
      currentEvent: '결혼을 앞두고 예비 배우자 집안과의 극심한 갈등으로 파혼 위기에 놓여 있습니다.',
      selectedSituation: '양가 집안과의 가치관 및 혼수 갈등',
      additionalContext: '상대방 부모님이 일방적으로 결혼식 일정과 신혼집 명의 변경을 강요하고 있어 예비 배우자와도 대화가 단절되었습니다.',
      desiredQuestion: '이 결혼을 강행하는 것이 맞는지, 파혼하고 정리하는 것이 나은지 판단하고 싶습니다.',
      targetYear: 2024,
    }
  },
  {
    id: 'CASE 06 (다른명식/동일고민)',
    name: 'CASE 01과 다른 명식(1990-05-15 10:30 남) + CASE 01 동일 사업 고민',
    input: {
      birthDate: '1990-05-15',
      birthTime: '10:30',
      gender: 'male' as const,
      userTrouble: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
      currentEvent: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
      selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
      additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
      desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
      targetYear: 2024,
    }
  }
];

const results = cases.map(c => {
  const freeRes = generator.generateProduct(c.input, { insightDepth: 1, prescription: false });
  const deepRes = generator.generateProduct(c.input, { insightDepth: 5, prescription: true });
  return {
    id: c.id,
    name: c.name,
    input: c.input,
    freeDeliverableText: freeRes.customerDeliverable?.fullFormattedText,
    freeSections: freeRes.customerDeliverable?.freeDeliverable,
    deepDeliverableText: deepRes.customerDeliverable?.fullFormattedText,
    deepSections: deepRes.customerDeliverable?.sections,
    answersTo7Questions: deepRes.customerDeliverable?.answersTo7Questions,
    structuredJudgments: deepRes.customerDeliverable?.structuredJudgments,
    pillars: deepRes.executedModules['CORE_ORIGINAL']?.data?.pillars,
    dayMaster: deepRes.executedModules['CORE_ORIGINAL']?.data?.dayMaster,
    domain: deepRes.classification.primaryDomain,
  };
});

fs.writeFileSync('scratch/phase79_case_outputs.json', JSON.stringify(results, null, 2), 'utf-8');
console.log('Successfully generated scratch/phase79_case_outputs.json with 6 cases');

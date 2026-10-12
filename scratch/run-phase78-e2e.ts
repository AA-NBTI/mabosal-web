import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import * as fs from 'fs';

const generator = new ProductGenerator();

// ============================================================================
// CASE 01 — 사업 (BUSINESS)
// ============================================================================
const case01_initial = {
  birthDate: '1988-12-10',
  birthTime: '14:00',
  gender: 'female' as const,
  currentEvent: '주요 거래처 부도로 대금이 묶여 회사 운영이 위태롭습니다.',
  userTrouble: '자금 회수가 막히고 직원 급여와 고정비 지급이 불가능한 부도 위기입니다.',
  desiredQuestion: '손실을 막고 사업체를 지키기 위해 지금 당장 무엇을 우선해야 합니까?',
  targetYear: 2024,
};
const case01_free = generator.generateProduct(case01_initial, { insightDepth: 1 });
const case01_advanced = {
  ...case01_initial,
  selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
  additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
  desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
};
const case01_deep = generator.generateProduct(case01_advanced, { insightDepth: 5, prescription: true });

// ============================================================================
// CASE 02 — 직장 (JOB)
// ============================================================================
const case02_initial = {
  birthDate: '1995-05-20',
  birthTime: '18:30',
  gender: 'male' as const,
  currentEvent: '새로 부임한 부서장과의 갈등으로 퇴사 및 이직을 고민 중입니다.',
  userTrouble: '업무 스타일 차이로 공개적인 비난을 받고 인사고과에서 최하점을 받아 좌천 위기입니다.',
  desiredQuestion: '지금 바로 이직해야 하는지, 버티는 것이 맞는지 알고 싶습니다.',
  targetYear: 2025,
};
const case02_free = generator.generateProduct(case02_initial, { insightDepth: 1 });
const case02_advanced = {
  ...case02_initial,
  selectedSituation: '직장 상사와의 업무 방식 차이 및 인사 불이익',
  additionalContext: '다음 주에 인사위원회가 열려 원치 않는 지방 발령이 유력한 상태입니다.',
  desiredQuestion: '지방 발령을 거부하고 사직서를 내는 것이 사주상 유리한 타이밍입니까?',
};
const case02_deep = generator.generateProduct(case02_advanced, { insightDepth: 5, prescription: true });

// ============================================================================
// CASE 03 — 연애 (LOVE)
// ============================================================================
const case03_initial = {
  birthDate: '1992-03-15',
  birthTime: '08:30',
  gender: 'male' as const,
  currentEvent: '2년간 교제한 연인과 사소한 다툼 끝에 헤어졌습니다.',
  userTrouble: '상대방이 일방적으로 이별을 통보하고 모든 연락처를 차단했습니다.',
  desiredQuestion: '재회할 가능성이 있는지, 언제 연락이 닿을 수 있는지 궁금합니다.',
  targetYear: 2024,
};
const case03_free = generator.generateProduct(case03_initial, { insightDepth: 1 });
const case03_advanced = {
  ...case03_initial,
  selectedSituation: '사소한 다툼 후 일방적 결별 및 연락 차단',
  additionalContext: '어제 지인을 통해 상대방에게 새로운 이성이 생겼다는 소식을 전해 들었습니다.',
  desiredQuestion: '포기하고 새 인연을 준비해야 하는지, 한 번 더 연락을 시도해야 하는지 알려주세요.',
};
const case03_deep = generator.generateProduct(case03_advanced, { insightDepth: 5, prescription: true });

// ============================================================================
// CASE 04 — 돈 (MONEY)
// ============================================================================
const case04_initial = {
  birthDate: '1982-04-05',
  birthTime: '06:00',
  gender: 'male' as const,
  currentEvent: '무리한 레버리지 투자 실패로 막대한 빚을 졌습니다.',
  userTrouble: '원금을 모두 잃고 사채와 신용대출 상환 압박으로 일상생활이 불가능합니다.',
  desiredQuestion: '현금 흐름을 회복하고 개인파산을 막을 방법이 무엇인지 알고 싶습니다.',
  targetYear: 2024,
};
const case04_free = generator.generateProduct(case04_initial, { insightDepth: 1 });
const case04_advanced = {
  ...case04_initial,
  selectedSituation: '무리한 투자 실패 및 채무 압박',
  additionalContext: '다음 달까지 5,000만 원의 원리금을 막지 못하면 거주 중인 전세보증금 압류가 들어올 예정입니다.',
  desiredQuestion: '개인회생 신청을 지금 바로 진행해야 하는 타이밍입니까?',
};
const case04_deep = generator.generateProduct(case04_advanced, { insightDepth: 5, prescription: true });

// ============================================================================
// CASE 05 — 동일 명식 / 다른 고민 (1990-05-15 12:00 male)
// ============================================================================
const basePerson1990 = {
  birthDate: '1990-05-15',
  birthTime: '12:00',
  gender: 'male' as const,
  targetYear: 2024,
};
const case05_A = generator.generateProduct({
  ...basePerson1990,
  currentEvent: '연인과 결별 후 재회 고민',
  userTrouble: '결혼을 약속했던 연인이 갑자기 이별을 선언했습니다.',
  desiredQuestion: '다시 연락이 닿아 재회할 수 있을까요?',
}, { insightDepth: 5, prescription: true });

const case05_B = generator.generateProduct({
  ...basePerson1990,
  currentEvent: '스타트업 창업 및 투자 유치 난항',
  userTrouble: '시드 투자가 무산되고 공동 창업자가 이탈하려 합니다.',
  desiredQuestion: '사업을 계속 유지해야 합니까, 정리해야 합니까?',
}, { insightDepth: 5, prescription: true });

// ============================================================================
// CASE 06 — 다른 명식 / 동일 고민 (직장 상사 갈등 및 이직)
// ============================================================================
const commonTrouble = {
  currentEvent: '새로 부임한 부서장의 폭언과 인사상 불이익으로 퇴사를 결심했습니다.',
  userTrouble: '업무 방식을 강요당하고 고과에서 최하점을 받아 이직을 준비 중입니다.',
  desiredQuestion: '사직서를 바로 내고 이직하는 것이 맞습니까?',
  targetYear: 2025,
};
const case06_PersonA = generator.generateProduct({
  birthDate: '1988-12-10',
  birthTime: '14:00',
  gender: 'female',
  ...commonTrouble,
}, { insightDepth: 5, prescription: true });

const case06_PersonB = generator.generateProduct({
  birthDate: '1995-05-20',
  birthTime: '18:30',
  gender: 'male',
  ...commonTrouble,
}, { insightDepth: 5, prescription: true });

const outputSummary = {
  case01: {
    initial: case01_initial,
    freeDeliverableText: case01_free.customerDeliverable?.fullFormattedText,
    advancedInput: case01_advanced,
    deepDeliverableText: case01_deep.customerDeliverable?.fullFormattedText,
    structuredJudgments: case01_deep.customerDeliverable?.structuredJudgments,
  },
  case02: {
    initial: case02_initial,
    freeDeliverableText: case02_free.customerDeliverable?.fullFormattedText,
    advancedInput: case02_advanced,
    deepDeliverableText: case02_deep.customerDeliverable?.fullFormattedText,
  },
  case03: {
    initial: case03_initial,
    freeDeliverableText: case03_free.customerDeliverable?.fullFormattedText,
    advancedInput: case03_advanced,
    deepDeliverableText: case03_deep.customerDeliverable?.fullFormattedText,
  },
  case04: {
    initial: case04_initial,
    freeDeliverableText: case04_free.customerDeliverable?.fullFormattedText,
    advancedInput: case04_advanced,
    deepDeliverableText: case04_deep.customerDeliverable?.fullFormattedText,
  },
  case05: {
    dayStemA: case05_A.executedModules['CORE_ORIGINAL'].data.dayMaster.stem,
    dayStemB: case05_B.executedModules['CORE_ORIGINAL'].data.dayMaster.stem,
    domainA: case05_A.classification.primaryDomain,
    domainB: case05_B.classification.primaryDomain,
    eventA: case05_A.customerDeliverable?.sections.step1_currentEvent,
    eventB: case05_B.customerDeliverable?.sections.step1_currentEvent,
    presAvoidA: case05_A.prescriptionReport?.mustAvoid,
    presAvoidB: case05_B.prescriptionReport?.mustAvoid,
  },
  case06: {
    personA_Stem: case06_PersonA.executedModules['CORE_ORIGINAL'].data.dayMaster.stem,
    personB_Stem: case06_PersonB.executedModules['CORE_ORIGINAL'].data.dayMaster.stem,
    myeongliBasisA: case06_PersonA.customerDeliverable?.structuredJudgments?.myeongliBasis,
    myeongliBasisB: case06_PersonB.customerDeliverable?.structuredJudgments?.myeongliBasis,
    natalRelationsA: case06_PersonA.customerDeliverable?.structuredJudgments?.timeAxisBreakdown.natal,
    natalRelationsB: case06_PersonB.customerDeliverable?.structuredJudgments?.timeAxisBreakdown.natal,
  }
};

fs.writeFileSync('scratch/phase78_e2e_results.json', JSON.stringify(outputSummary, null, 2), 'utf-8');
console.log('Phase 78 E2E 6 Cases execution completed successfully!');

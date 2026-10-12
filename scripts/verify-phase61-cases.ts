/**
 * scripts/verify-phase61-cases.ts
 * 
 * CASE 01 ~ 05에 각각 다른 현실 문제를 입력하여
 * 동적 상품 생성 결과를 실물 출력하고, 상품별 완성도와 가격 적정성을 검증.
 */

import { ProductGenerator, UserProblemInput } from '../src/modules/product-generator/index.js';

const generator = new ProductGenerator();

const cases: { id: string; name: string; input: UserProblemInput; configPrice?: number; depth: 1 | 2 | 3 | 4 | 5 }[] = [
  {
    id: 'CASE 01',
    name: '연애 결별 / 재회 갈등',
    input: {
      birthDate: '1992-03-15',
      birthTime: '08:30',
      gender: 'male',
      targetDomain: 'LOVE',
      currentEvent: '오랜 연인에게서 갑작스런 이별 통보를 받았습니다.',
      userTrouble: '상대방의 마음이 왜 돌아섰는지, 재회가 가능한 시기와 대처법을 알고 싶습니다.',
      desiredQuestion: '왜 이 시점에 파국을 맞았으며 언제 다시 소통이 가능합니까?',
    },
    depth: 5,
  },
  {
    id: 'CASE 02',
    name: '사업 부도 / 파트너십 위기',
    input: {
      birthDate: '1988-12-10',
      birthTime: '14:00',
      gender: 'female',
      targetDomain: 'BUSINESS',
      currentEvent: '주요 거래처 부도와 동업자와의 지분 갈등으로 폐업 직전입니다.',
      userTrouble: '회사를 지킬 수 있는 방어책과 법적 소송전을 피할 수 있는 지혜가 절실합니다.',
      desiredQuestion: '손실을 최소화하고 생존할 수 있는 최우선 행동 지침은 무엇입니까?',
    },
    depth: 5,
  },
  {
    id: 'CASE 03',
    name: '직장 이직 / 승진 갈등',
    input: {
      birthDate: '1995-05-20',
      birthTime: '18:30',
      gender: 'male',
      targetDomain: 'JOB',
      currentEvent: '상사와의 노선 갈등과 인사 고과 불이익으로 매일 사표를 쓰고 싶습니다.',
      userTrouble: '지금 당장 충동적으로 퇴사해도 괜찮은지, 안전한 이직 시기가 언제인지 궁금합니다.',
      desiredQuestion: '언제 움직여야 내 커리어가 꺾이지 않습니까?',
    },
    depth: 4,
  },
  {
    id: 'CASE 04',
    name: '투자 손실 / 재물 위기',
    input: {
      birthDate: '1982-04-05',
      birthTime: '06:00',
      gender: 'male',
      targetDomain: 'MONEY',
      currentEvent: '지인의 권유로 무리한 레버리지 투자를 했다가 원금을 전액 날리고 빚 독촉에 시달립니다.',
      userTrouble: '손실을 메우려 물타기를 해야 할지, 파산 위기에서 벗어날 시기가 언제인지 막막합니다.',
      desiredQuestion: '재물 운의 저점이 언제 끝나며 현금 흐름을 어떻게 지켜야 합니까?',
    },
    depth: 5,
  },
  {
    id: 'CASE 05',
    name: '수술 / 건강 위기',
    input: {
      birthDate: '1986-08-15',
      birthTime: '16:00',
      gender: 'male',
      targetDomain: 'HEALTH',
      currentEvent: '원인 모를 급격한 기력 저하와 흉복부 통증으로 병원에서 큰 수술을 권유받았습니다.',
      userTrouble: '수술을 진행하는 것이 안전한지, 올해의 신체적 고비를 무사히 넘길 수 있을지 두렵습니다.',
      desiredQuestion: '신체 취약 장부와 에너지 회복 시기를 알고 싶습니다.',
    },
    depth: 5,
  },
];

console.log('================================================================================');
console.log('PHASE 61: CASE 01~05 실제 현실 고민 입력 기반 동적 상품 생성 검증');
console.log('================================================================================\n');

for (const c of cases) {
  const result = generator.generateProduct(c.input, {
    insightDepth: c.depth,
  });

  console.log(`[${c.id}] ${c.name}`);
  console.log(`- 상품명: ${result.productName} (ID: ${result.productId})`);
  console.log(`- 주 도메인: ${result.classification.primaryDomain} (긴급도: ${result.classification.urgencyLevel})`);
  console.log(`- 선택/실행된 모듈 (${result.config.selectedModules.length}개): ${result.config.selectedModules.join(', ')}`);
  console.log(`- 결과 깊이: ${result.depthReport.levelName}`);
  console.log(`- 산출 가격: ${result.pricing.calculatedPrice.toLocaleString()}원 (모듈비+깊이비+사례+처방 가산)`);
  console.log(`- 사건-명리 맵핑 요약:\n  ${result.eventMapping?.overallCausalSynthesis}`);
  if (result.caseProtocol) {
    console.log(`- 유사 현실 사례:\n  ${result.caseProtocol.similarRealWorldCase}`);
    console.log(`- 위험 인지(착각 방지):\n  ${result.caseProtocol.riskAwareness}`);
  }
  if (result.prescriptionReport) {
    console.log(`- 행동 처방:\n  Do: ${result.prescriptionReport.mustDo.slice(0, 2).join(' / ')}\n  Don't: ${result.prescriptionReport.mustAvoid.slice(0, 2).join(' / ')}`);
    console.log(`- 안전 가드: ${result.prescriptionReport.safeguardNotice}`);
  }
  console.log('--------------------------------------------------------------------------------\n');
}

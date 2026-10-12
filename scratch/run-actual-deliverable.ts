import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { MabosalService } from '../src/service/mabosal-service.js';
import * as fs from 'fs';

// Phase 74 Case 02 (사업 갈등)
const caseInput = {
  birthDate: '1988-12-10',
  birthTime: '14:00',
  gender: 'female' as const,
  userTrouble: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
  currentEvent: '주요 거래처 부도로 대금이 묶이고 동업자와 지분 분쟁이 발생했습니다. 회사 운영 자금이 고갈되어 부도 위기이며, 동업자가 일방적으로 지분 매각을 요구합니다.',
  desiredQuestion: '손실을 최소화하고 회사를 지키기 위해 지금 당장 어떤 결정을 내려야 합니까?',
  eventDate: '2024-05-20',
  targetYear: 2024,
};

const generator = new ProductGenerator();

// 1. Level 1 (무료 정보 / Information 단계)
const freeResult = generator.generateProduct(caseInput, { insightDepth: 1 });

// 2. Level 5 (심층 처방 및 전 영역 정밀 풀이)
const inDepthResult = generator.generateProduct(caseInput, { insightDepth: 5, prescription: true });

// 3. MabosalService (웹 프론트엔드 연동 서비스 출력)
const service = new MabosalService();
const serviceResult = service.analyze({
  birthDate: caseInput.birthDate,
  birthTime: caseInput.birthTime,
  gender: caseInput.gender,
  targetDate: caseInput.eventDate,
  question: caseInput.desiredQuestion,
});

const outputData = {
  input: caseInput,
  versions: {
    engineRelease: inDepthResult.trace?.engineReleaseVersion,
    ruleSpec: inDepthResult.trace?.ruleSpecVersion,
    moduleVersion: inDepthResult.trace?.moduleVersions ? inDepthResult.trace.moduleVersions['CORE_ORIGINAL'] : '1.0.0 FROZEN',
    productConfigVersion: inDepthResult.trace?.productConfigVersion,
    inputHash: inDepthResult.trace?.inputHash,
  },
  freeResult: {
    title: freeResult.depthReport.title,
    fullDocument: freeResult.depthReport.fullDocument,
    sections: freeResult.depthReport.sections,
    customerDeliverableText: freeResult.customerDeliverable?.fullFormattedText || null,
  },
  inDepthResult: {
    title: inDepthResult.depthReport.title,
    fullDocument: inDepthResult.depthReport.fullDocument,
    customerDeliverableText: inDepthResult.customerDeliverable?.fullFormattedText || null,
    answersTo7Questions: inDepthResult.customerDeliverable?.answersTo7Questions || null,
    sections: inDepthResult.customerDeliverable?.sections || null,
  },
  serviceResult: {
    pillarsTable: serviceResult.pillarsTable,
    dayMasterElement: serviceResult.dayMasterElement,
    dayMasterStrength: serviceResult.dayMasterStrength,
    sections: serviceResult.sections,
    questionAnswer: serviceResult.questionAnswer,
    narrativeText: serviceResult.narrativeText,
  }
};

fs.writeFileSync('scratch/deliverable_output.json', JSON.stringify(outputData, null, 2), 'utf-8');
console.log('Execution completed successfully. Saved to scratch/deliverable_output.json');

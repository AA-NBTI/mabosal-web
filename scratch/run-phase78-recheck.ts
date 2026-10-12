import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { renderBirthInputView, PRODUCTION_TROUBLE_PRESETS, KOREA_REGIONS } from '../src/frontend/components/views.js';
import * as fs from 'fs';

// 4. 사용할 실제 CASE
const caseInput = {
  birthDate: '1988-12-10',
  birthTime: '14:00',
  gender: 'female' as const,
  userTrouble: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
  currentEvent: '거래처 대금 체납과 동업자와의 지분 갈등으로 회사가 위태롭습니다.',
  targetYear: 2024,
};

const generator = new ProductGenerator();

// 1. 무료 분석 실행
const freeResult = generator.generateProduct(caseInput, { insightDepth: 1 });

// 2. 추가 상황 입력
const advancedInput = {
  ...caseInput,
  selectedSituation: '동업자·파트너와의 지분 및 정산 갈등',
  additionalContext: '거래처 부도 이후 동업자가 일방적으로 변호사를 대동하여 지분 포기 및 개인 연대보증을 요구하고 있습니다.',
  desiredQuestion: '지분 매각 압박에 응하지 않고 법적으로 회사를 방어할 수 있습니까?',
};

// 3. 심층 분석 실행
const deepResult = generator.generateProduct(advancedInput, { insightDepth: 5, prescription: true });

// 4. 최초 입력 폼 실물 HTML
const initialFormHtml = renderBirthInputView({
  calendarType: 'solar',
  isLeapMonth: false,
  gender: 'female',
  userTroubleText: caseInput.userTrouble,
} as any);

const fullOutput = {
  executionEnv: {
    engineRelease: deepResult.trace?.engineReleaseVersion,
    ruleSpec: deepResult.trace?.ruleSpecVersion,
    moduleVersion: deepResult.trace?.moduleVersions ? deepResult.trace.moduleVersions['CORE_ORIGINAL'] : '1.0.0 FROZEN',
    productConfigVersion: deepResult.trace?.productConfigVersion,
    inputHash: deepResult.trace?.inputHash,
    trace: deepResult.trace,
  },
  initialInput: caseInput,
  initialFormHtml,
  freeResult: {
    customerDeliverableText: freeResult.customerDeliverable?.fullFormattedText,
    depthReportDoc: freeResult.depthReport.fullDocument,
    freeDeliverable: freeResult.customerDeliverable?.freeDeliverable,
  },
  advancedInput: {
    selectedSituation: advancedInput.selectedSituation,
    additionalContext: advancedInput.additionalContext,
    desiredQuestion: advancedInput.desiredQuestion,
  },
  deepResult: {
    customerDeliverableText: deepResult.customerDeliverable?.fullFormattedText,
    depthReportDoc: deepResult.depthReport.fullDocument,
    sections: deepResult.customerDeliverable?.sections,
    answersTo7Questions: deepResult.customerDeliverable?.answersTo7Questions,
    structuredJudgments: deepResult.customerDeliverable?.structuredJudgments,
    executedModulesSummary: Object.entries(deepResult.executedModules).map(([k, v]) => ({
      id: k,
      name: v.moduleName,
      summary: v.explanation.summary,
    })),
  }
};

fs.writeFileSync('scratch/phase78_actual_deliverables.json', JSON.stringify(fullOutput, null, 2), 'utf-8');
console.log('Successfully saved to scratch/phase78_actual_deliverables.json');

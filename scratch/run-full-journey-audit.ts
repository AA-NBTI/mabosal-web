import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SignalEngine } from '../src/modules/signal/signal-engine.js';
import { MaModuleEngine } from '../src/modules/ma/ma-module-engine.js';
import { QuestionEngine } from '../src/modules/question/question-engine.js';
import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { IntegratedAnalyzer } from '../src/modules/modular/integrated-analyzer.js';
import { EventDiagnosisEngine } from '../src/modules/event-diagnosis/event-diagnosis-engine.js';
import { MagaDiagnosisEngine } from '../src/modules/ma/maga-diagnosis-engine.js';
import { PrescriptionEngine } from '../src/modules/prescription/prescription-engine.js';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';
import { EventProblemClassifier } from '../src/modules/product-generator/problem-classifier.js';
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

// 1. Calendar & Pillar Engine
const calendarEngine = new CalendarEngine();
const pillarEngine = new PillarEngine();
const calResult = calendarEngine.execute({
  birth_date: inputData.birthDate,
  birth_time: inputData.birthTime,
});
const pillarResult = pillarEngine.execute(calResult.data);

// 2. SajuCore, Relationship, Signal, Ma Engine, Question Engine
const sajuCoreEngine = new SajuCoreEngine();
const relationshipEngine = new RelationshipEngine();
const signalEngine = new SignalEngine();
const maEngine = new MaModuleEngine();
const questionEngine = new QuestionEngine();

const coreResult = sajuCoreEngine.execute(pillarResult.data);
const relResult = relationshipEngine.execute({ four_pillars: pillarResult.data.four_pillars });
const signalResult = signalEngine.execute({ saju_core: coreResult.data, relationship: relResult.data });
const maResult = maEngine.execute({ signals: signalResult.data });
const questionResult = questionEngine.execute({
  questionText: inputData.desiredQuestion,
  ma_output: maResult.data,
});

// 3. Modular Engine Registry (19개 모듈 전수 실행)
const modularInput = {
  birthDate: inputData.birthDate,
  birthTime: inputData.birthTime,
  calendarOutput: calResult.data,
  pillarOutput: pillarResult.data,
  gender: inputData.gender,
  targetYear: inputData.targetYear,
  userTroubleText: `${inputData.userTrouble} ${inputData.additionalContext} ${inputData.desiredQuestion}`,
};
const allModuleIds = moduleRegistry.getAllModuleIds();
const modularOutputs = moduleRegistry.executeModules(allModuleIds, modularInput);

// 4. Integrated Analyzer
const integratedAnalyzer = new IntegratedAnalyzer();
const integratedAnalysis = integratedAnalyzer.analyze(modularOutputs);

// 5. Problem Classifier
const classifier = new EventProblemClassifier();
const classification = classifier.classify({
  userTrouble: inputData.userTrouble,
  currentEvent: inputData.currentEvent,
  selectedSituation: inputData.selectedSituation,
  additionalContext: inputData.additionalContext,
  desiredQuestion: inputData.desiredQuestion,
});

// 6. Event Diagnosis Engine
const eventDiagnosisEngine = new EventDiagnosisEngine();
const eventDiagnosis = eventDiagnosisEngine.diagnoseEvent({
  userEvent: {
    birthData: {
      birthDate: inputData.birthDate,
      birthTime: inputData.birthTime,
      gender: inputData.gender,
    },
    currentConcern: inputData.currentEvent,
    eventDescription: `${inputData.userTrouble} ${inputData.additionalContext}`,
    desiredQuestion: inputData.desiredQuestion,
    targetDomain: classification.primaryDomain,
  },
  integratedAnalysis,
  executedModules: modularOutputs,
});

// 7. Maga Diagnosis Engine
const magaEngine = new MagaDiagnosisEngine();
const magaDiagnosis = magaEngine.diagnose({
  pillars: pillarResult.data.four_pillars,
  dayMaster: modularOutputs['CORE_ORIGINAL']?.data?.dayMaster,
  activeSal: modularOutputs['SINSAL']?.data?.activeSal || [],
  targetYear: inputData.targetYear,
});

// 8. Prescription Engine
const prescriptionEngine = new PrescriptionEngine();
const prescriptionResult = prescriptionEngine.generatePrescription({
  integratedAnalysis,
  eventDiagnosis,
  moduleResults: modularOutputs,
  pillars: pillarResult.data.four_pillars,
  userEvent: {
    currentConcern: inputData.currentEvent,
    eventDescription: inputData.userTrouble,
    targetDomain: classification.primaryDomain,
  },
  targetYear: inputData.targetYear,
});

// 9. Product Generator (최종 고객 출력 Level 1 및 Level 5)
const productGenerator = new ProductGenerator();
const freeProduct = productGenerator.generateProduct(inputData, { insightDepth: 1, prescription: false });
const deepProduct = productGenerator.generateProduct(inputData, { insightDepth: 5, prescription: true });

const fullAuditData = {
  rawCalculations: {
    calendar: calResult.data,
    pillar: pillarResult.data,
    coreOriginal: modularOutputs['CORE_ORIGINAL']?.data,
    strength: modularOutputs['STRENGTH']?.calculation?.rawMetrics,
    geokguk: modularOutputs['GEOKGUK']?.data,
    eokbu: modularOutputs['EOKBU']?.data,
    johu: modularOutputs['JOHU']?.data,
    relation: modularOutputs['RELATION']?.calculation?.rawMetrics,
    sinsal: modularOutputs['SINSAL']?.data,
    daewun: modularOutputs['DAEWUN']?.data,
    seun: modularOutputs['SEUN']?.data,
  },
  modularOutputsSummary: Object.entries(modularOutputs).map(([id, mod]) => ({
    id,
    name: mod.moduleName,
    summary: mod.explanation?.summary,
    confidence: mod.confidence,
    moduleVersion: mod.metadata?.moduleVersion,
    ruleVersion: mod.metadata?.ruleVersion,
    rawMetrics: mod.calculation?.rawMetrics,
  })),
  questionAnalysis: questionResult.data,
  classification,
  eventDiagnosis: {
    eventDomain: eventDiagnosis.eventDomain,
    eventSeverity: eventDiagnosis.eventSeverity,
    timingAnalysis: eventDiagnosis.timingAnalysis,
    myeongliCause: eventDiagnosis.causalChain,
    explanation: eventDiagnosis.explanation,
  },
  magaDiagnosis,
  prescription: {
    domain: prescriptionResult.domain,
    safetyDisclaimer: prescriptionResult.safeguardNotice,
    environmentSummary: prescriptionResult.customerResult?.environmentSummary,
    behaviorSummary: prescriptionResult.customerResult?.behaviorSummary,
    remedySummary: prescriptionResult.customerResult?.remedySummary,
    timingRoadmap: prescriptionResult.customerResult?.timingRoadmap,
  },
  integratedAnalysisSummary: {
    coreDiagnosis: integratedAnalysis.coreDiagnosis,
    dominantForces: integratedAnalysis.dominantForces,
    timingReport: integratedAnalysis.timingReport,
  },
  freeCustomerDeliverable: {
    fullText: freeProduct.customerDeliverable?.fullFormattedText,
    sections: freeProduct.customerDeliverable?.freeDeliverable,
  },
  deepCustomerDeliverable: {
    fullText: deepProduct.customerDeliverable?.fullFormattedText,
    sections: deepProduct.customerDeliverable?.sections,
    answersTo7Questions: deepProduct.customerDeliverable?.answersTo7Questions,
    structuredJudgments: deepProduct.customerDeliverable?.structuredJudgments,
  },
};

fs.writeFileSync('scratch/full_journey_audit_output.json', JSON.stringify(fullAuditData, null, 2), 'utf-8');
console.log('Successfully written to scratch/full_journey_audit_output.json');

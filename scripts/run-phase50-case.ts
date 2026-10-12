/**
 * Phase 50: 실제 CASE 실행 및 6대 결과물 추출 러너 스크립트
 */

import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const req = {
    calendarType: 'solar' as const,
    isLeapMonth: false,
    birthDate: '1992-03-15',
    birthTime: '08:30',
    isUnknownTime: false,
    gender: 'male' as const,
    region: '서울',
    troubleCategory: 'relationship',
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다.\n왜 이런 일이 발생했는지 알고 싶고,\n지금 연락하는 것이 좋은지 알고 싶습니다.',
    clientId: 'phase50-case-client',
    currentDate: '2026-10-03',
  };

  console.log('실제 ProductionPipelineEngine 실행 시작...');
  const res = await productionPipelineEngine.executePipeline(req);
  console.log('ProductionPipelineEngine 실행 완료!');

  const sal = res.salDiagnosis!;

  // A. 신살 계산: 전체 신살의 존재 및 위치
  const resultA = {
    totalEvaluated: sal.totalSinsalsEvaluated,
    natalSinsalsCount: sal.natalSinsals.length,
    natalSinsals: sal.natalSinsals.map(s => ({
      sinsalId: s.sinsalId,
      name: s.name,
      category: s.category,
      calculationBasis: s.calculationBasis,
      presentInNatal: s.presentInNatal,
      natalLocations: s.natalLocations,
      ruleIds: s.ruleIds,
      evidence: s.calculationEvidence,
    })),
    allSinsalsOverview: sal.allResults.map(s => ({
      sinsalId: s.sinsalId,
      name: s.name,
      category: s.category,
      presentInNatal: s.presentInNatal,
      natalLocations: s.natalLocations,
      basis: s.calculationBasis,
    })),
  };

  // B. 활성화: 대운·세운·월운·일진별 활성화
  const resultB = {
    timingPillarsContext: {
      daeun: '丙午 (병오, 35세~44세)',
      seun: '2026년 丙午 (병오)',
      month: '丁酉 (정유, 2026-09-08 ~ 2026-10-08 백로~한로)',
      day: '庚寅 (경인)',
    },
    activeSinsalsCount: sal.activeSinsals.length,
    activeSinsals: sal.activeSinsals.map(s => ({
      sinsalId: s.sinsalId,
      name: s.name,
      activationByDaeun: s.activationByDaeun,
      activationBySeun: s.activationBySeun,
      activationByMonth: s.activationByMonth,
      activationByDay: s.activationByDay,
      activationScore: s.activationScore,
      riskScore: s.riskScore,
      supportScore: s.supportScore,
      ruleIds: s.ruleIds,
      evidenceModifiers: s.calculationEvidence.scoreBreakdown.modifiers,
    })),
  };

  // C. 살 × 관계: 합·충·형·파·해·원진 등의 실제 작동 관계
  const resultC = {
    relationInteractionsCount: sal.relationInteractions.length,
    relationInteractions: sal.relationInteractions,
    sinsalTriggerRelations: sal.allResults
      .filter(s => s.triggerRelations.length > 0)
      .map(s => ({
        sinsalId: s.sinsalId,
        name: s.name,
        triggerRelations: s.triggerRelations,
        ruleIds: s.ruleIds,
      })),
  };

  // D. 사건 연결: 사용자 사건과 연결된 근거
  const resultD = {
    userEvent: {
      text: req.userTroubleText,
      dateProvided: false,
    },
    eventConnection: sal.eventConnection,
  };

  // E. 마 진단 영향: 각 신살이 어떤 마 분야에 얼마만큼 영향을 주었는지
  const resultE = {
    maImpactSummary: sal.maImpactSummary,
    signalsSeparation: {
      riskSignals: sal.riskSignals,
      supportSignals: sal.supportSignals,
      changeSignals: sal.changeSignals,
    },
  };

  // F. 3개 상품: 기존 상품 구조에 살진단이 실제 반영된 결과
  const resultF = {
    freeReport: {
      length: res.standardReports?.freeReport.length,
      sampleSnippet: res.standardReports?.freeReport.slice(-500),
      fullReport: res.standardReports?.freeReport,
    },
    detailedReport39k: {
      length: res.standardReports?.detailedReport39k.length,
      sampleSnippet: res.standardReports?.detailedReport39k.slice(-800),
      fullReport: res.standardReports?.detailedReport39k,
    },
    mabosalSolution149k: {
      length: res.standardReports?.mabosalSolution149k.length,
      sampleSnippet: res.standardReports?.mabosalSolution149k.slice(-1200),
      fullReport: res.standardReports?.mabosalSolution149k,
    },
  };

  const outputDir = path.resolve('scratch/phase50');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, 'resultA_sinsal_natal.json'), JSON.stringify(resultA, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'resultB_activation.json'), JSON.stringify(resultB, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'resultC_relations.json'), JSON.stringify(resultC, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'resultD_event_connection.json'), JSON.stringify(resultD, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'resultE_ma_impact.json'), JSON.stringify(resultE, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'resultF_products.json'), JSON.stringify({
    freeLength: resultF.freeReport.length,
    detailed39kLength: resultF.detailedReport39k.length,
    mabosal149kLength: resultF.mabosalSolution149k.length,
  }, null, 2), 'utf-8');

  fs.writeFileSync(path.join(outputDir, 'report_free.txt'), resultF.freeReport.fullReport || '', 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'report_39k.txt'), resultF.detailedReport39k.fullReport || '', 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'report_149k.txt'), resultF.mabosalSolution149k.fullReport || '', 'utf-8');

  console.log('결과 파일 저장 완료: scratch/phase50/');
}

run().catch(err => {
  console.error('실행 중 에러:', err);
  process.exit(1);
});

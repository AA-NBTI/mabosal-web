import fs from 'fs';
import path from 'path';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';

export interface Phase55Case {
  id: string;
  name: string;
  category: string;
  birthDate: string;
  birthTime: string;
  gender: 'male' | 'female';
  eventCategory: string;
  eventDate: string | null; // null for CASE J (no event)
  eventDescription: string;
  userTroubleText: string;
  userQuestion: string;
}

export const PHASE55_CASES: Phase55Case[] = [
  {
    id: 'CASE_A',
    name: '연애/결별',
    category: 'relationship',
    birthDate: '1993-11-20',
    birthTime: '15:30',
    gender: 'female',
    eventCategory: '연애 결별',
    eventDate: '2024-04-18',
    eventDescription: '2024-04-18 5년간 교제한 연인과 가치관 충돌로 최종 결별',
    userTroubleText: '오래 만난 연인과 최근 심각한 갈등 끝에 헤어졌습니다. 관계의 원인과 회복 가능성이 궁금합니다.',
    userQuestion: '오래 만난 연인과 최근 심각한 갈등 끝에 헤어졌습니다. 관계의 원인과 회복 가능성이 궁금합니다.'
  },
  {
    id: 'CASE_B',
    name: '결혼',
    category: 'relationship',
    birthDate: '1989-05-14',
    birthTime: '09:30',
    gender: 'male',
    eventCategory: '결혼 성사',
    eventDate: '2023-10-22',
    eventDescription: '2023-10-22 양가 축복 속에 정식 결혼식 거행',
    userTroubleText: '배우자와의 새로운 인생 출발을 앞두고 앞으로의 가정운과 부부 관계의 흐름이 궁금합니다.',
    userQuestion: '배우자와의 새로운 인생 출발을 앞두고 앞으로의 가정운과 부부 관계의 흐름이 궁금합니다.'
  },
  {
    id: 'CASE_C',
    name: '사업/폐업',
    category: 'business',
    birthDate: '1985-02-18',
    birthTime: '14:00',
    gender: 'male',
    eventCategory: '사업 폐업 및 동업 분쟁',
    eventDate: '2022-08-20',
    eventDescription: '2022-08-20 동업자와 정산 소송 후 법인 폐업 신고',
    userTroubleText: '동업자와의 극심한 정산 갈등으로 사업을 정리했습니다. 재기할 수 있는 시기와 방법을 알고 싶습니다.',
    userQuestion: '동업자와의 극심한 정산 갈등으로 사업을 정리했습니다. 재기할 수 있는 시기와 방법을 알고 싶습니다.'
  },
  {
    id: 'CASE_D',
    name: '직장/영전',
    category: 'career',
    birthDate: '1991-08-24',
    birthTime: '10:30',
    gender: 'male',
    eventCategory: '직장 이직 및 승진',
    eventDate: '2024-02-15',
    eventDescription: '2024-02-15 대기업 핵심 부서 총괄 팀장으로 영전 이직',
    userTroubleText: '직장에서 새로운 책임과 조직을 맡게 되었습니다. 제 역량을 극대화할 수 있는 커리어 방향이 궁금합니다.',
    userQuestion: '직장에서 새로운 책임과 조직을 맡게 되었습니다. 제 역량을 극대화할 수 있는 커리어 방향이 궁금합니다.'
  },
  {
    id: 'CASE_E',
    name: '재물/손실',
    category: 'wealth',
    birthDate: '1990-12-05',
    birthTime: '02:00',
    gender: 'male',
    eventCategory: '가상자산 투자 대규모 손실',
    eventDate: '2022-05-12',
    eventDescription: '2022-05-12 루나 코인 폭락 사태로 투자금의 80% 손실',
    userTroubleText: '무리한 투자로 막대한 자산 손실을 겪었습니다. 언제쯤 재물운이 안정되고 회복될 수 있을까요?',
    userQuestion: '무리한 투자로 막대한 자산 손실을 겪었습니다. 언제쯤 재물운이 안정되고 회복될 수 있을까요?'
  },
  {
    id: 'CASE_F',
    name: '사고/분쟁',
    category: 'accident',
    birthDate: '1987-07-16',
    birthTime: '17:30',
    gender: 'female',
    eventCategory: '교통사고 및 전치 8주 골절',
    eventDate: '2023-09-15',
    eventDescription: '2023-09-15 고속도로 3중 추돌 사고로 전치 8주 골절 입원',
    userTroubleText: '예기치 못한 큰 사고로 몸과 마음에 큰 충격을 받았습니다. 건강과 신변 안전의 흐름을 알고 싶습니다.',
    userQuestion: '예기치 못한 큰 사고로 몸과 마음에 큰 충격을 받았습니다. 건강과 신변 안전의 흐름을 알고 싶습니다.'
  },
  {
    id: 'CASE_G',
    name: '이사/이동',
    category: 'movement',
    birthDate: '1994-06-22',
    birthTime: '08:00',
    gender: 'male',
    eventCategory: '해외 지사 파견 및 이주',
    eventDate: '2025-02-28',
    eventDescription: '2025-02-28 싱가포르 아태본부 파견 발령 및 해외 이사',
    userTroubleText: '해외로 생활 터전을 옮기게 되었습니다. 낯선 환경에서의 적응과 이동운의 향방이 궁금합니다.',
    userQuestion: '해외로 생활 터전을 옮기게 되었습니다. 낯선 환경에서의 적응과 이동운의 향방이 궁금합니다.'
  },
  {
    id: 'CASE_H',
    name: '가족/상속',
    category: 'family',
    birthDate: '1980-03-28',
    birthTime: '12:00',
    gender: 'male',
    eventCategory: '모친 별세 및 상속 분쟁',
    eventDate: '2021-11-10',
    eventDescription: '2021-11-10 모친 별세 후 유산 분할 문제로 형제간 갈등 심화',
    userTroubleText: '가족 내에서 유산과 상속을 둘러싼 갈등이 격화되었습니다. 집안의 화합과 해결책을 구합니다.',
    userQuestion: '가족 내에서 유산과 상속을 둘러싼 갈등이 격화되었습니다. 집안의 화합과 해결책을 구합니다.'
  },
  {
    id: 'CASE_I',
    name: '건강사건',
    category: 'health',
    birthDate: '1983-10-12',
    birthTime: '20:30',
    gender: 'female',
    eventCategory: '급성 질환 응급 수술',
    eventDate: '2024-07-22',
    eventDescription: '2024-07-22 급성 복통으로 응급실 이송 후 담낭 절제 수술',
    userTroubleText: '갑작스러운 수술과 입원으로 건강에 큰 경각심을 가지게 되었습니다. 건강운의 회복 시기가 궁금합니다.',
    userQuestion: '갑작스러운 수술과 입원으로 건강에 큰 경각심을 가지게 되었습니다. 건강운의 회복 시기가 궁금합니다.'
  },
  {
    id: 'CASE_J',
    name: '사건없음',
    category: 'peaceful',
    birthDate: '1996-04-10',
    birthTime: '14:00',
    gender: 'female',
    eventCategory: '특별 사건 없음 (평온한 일상 유지)',
    eventDate: null,
    eventDescription: '2026년 하반기 기준 직장, 연애, 재물 등 특이 사건 없이 평온하고 안정된 일상 영위',
    userTroubleText: '특별한 위기나 고민은 없으나 전반적인 삶의 방향성과 내면의 강점을 점검하고 싶습니다.',
    userQuestion: '특별한 위기나 고민은 없으나 전반적인 삶의 방향성과 내면의 강점을 점검하고 싶습니다.'
  }
];

async function runPhase55Audit() {
  const outDir = 'scratch/phase55';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const auditResults: any[] = [];

  for (const c of PHASE55_CASES) {
    console.log(`Running pipeline for ${c.id} (${c.name})...`);

    // STEP 1: Execute pipeline
    const input: any = {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      calendarType: 'solar',
      gender: c.gender,
      inquiryTopic: c.category === 'peaceful' ? 'general' : (c.category as any),
      userTroubleText: c.userTroubleText,
      userQuestion: c.userQuestion,
      currentDate: '2026-10-03',
    };

    const res = await productionPipelineEngine.executePipeline(input);
    const reports = res.fourTierReports!;
    const fourPillarsText = res.generalSaju.fourPillarsText;
    const dynamicAnalysis = SajuDynamicAnalyzer.analyze(fourPillarsText);

    // Save individual tier reports
    const caseDir = path.join(outDir, c.id);
    if (!fs.existsSync(caseDir)) fs.mkdirSync(caseDir, { recursive: true });

    fs.writeFileSync(path.join(caseDir, 'free.txt'), reports.free.customerReport, 'utf-8');
    fs.writeFileSync(path.join(caseDir, 'standard.txt'), reports.standard.customerReport, 'utf-8');
    fs.writeFileSync(path.join(caseDir, 'sal.txt'), reports.sal.customerReport, 'utf-8');
    fs.writeFileSync(path.join(caseDir, 'premium.txt'), reports.premium.customerReport, 'utf-8');

    // STEP 2 & 3 & 4: Evaluate against 10 criteria
    const resultItem = {
      id: c.id,
      name: c.name,
      category: c.category,
      fourPillarsText,
      actualEvent: c.eventDescription,
      eventDate: c.eventDate,
      dayMaster: dynamicAnalysis.dayMaster.name,
      strength: dynamicAnalysis.strength.status,
      strengthScore: dynamicAnalysis.strength.score,
      geokguk: dynamicAnalysis.geokguk.name,
      eokbu: `${dynamicAnalysis.yongshin.eokbu.primary}/${dynamicAnalysis.yongshin.eokbu.secondary}`,
      johu: dynamicAnalysis.yongshin.johu.primary,
      tenGods: dynamicAnalysis.tenGods.surfaceCounts8,
      clashes: dynamicAnalysis.clashesAndHarmonies.clashes,
      harmonies: dynamicAnalysis.clashesAndHarmonies.harmonies,
      punishments: dynamicAnalysis.clashesAndHarmonies.punishments,
      wonjin: dynamicAnalysis.clashesAndHarmonies.wonjin,
      isNoEventCase: c.eventDate === null,
      reports: {
        freeLength: reports.free.customerReport.length,
        standardLength: reports.standard.customerReport.length,
        salLength: reports.sal.customerReport.length,
        premiumLength: reports.premium.customerReport.length,
      }
    };

    auditResults.push(resultItem);
  }

  fs.writeFileSync(path.join(outDir, 'phase55_audit_summary.json'), JSON.stringify(auditResults, null, 2), 'utf-8');
  console.log('Phase 55 10 Cases Audit Pipeline executed successfully.');
}

runPhase55Audit().catch(console.error);

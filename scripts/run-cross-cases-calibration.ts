import fs from 'fs';
import path from 'path';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';

async function main() {
  const outputDir = path.resolve('scratch/phase50/cross_cases_calib2');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const cases = [
    {
      id: 'CASE_01',
      title: '1992년생 庚金 정재격 (연애 결별, 날짜 미제공)',
      input: {
        birthDate: '1992-03-15',
        birthTime: '08:30',
        calendarType: 'solar' as const,
        gender: 'male' as const,
        inquiryTopic: 'relationship' as const,
        userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?',
        userQuestion: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?'
      }
    },
    {
      id: 'CASE_02',
      title: '1988년생 己土 정재격 (사업 분쟁, 날짜 2026-08-15 제공)',
      input: {
        birthDate: '1988-12-10',
        birthTime: '14:00',
        calendarType: 'solar' as const,
        gender: 'male' as const,
        inquiryTopic: 'business' as const,
        userTroubleText: '2026년 8월 15일에 믿었던 동업자와 지분 및 정산 문제로 크게 다투고 결별 위기입니다.',
        userQuestion: '2026년 8월 15일에 믿었던 동업자와 지분 및 정산 문제로 크게 다투고 결별 위기입니다.'
      }
    },
    {
      id: 'CASE_03',
      title: '1995년생 辛金 정관격 (직장 이직 갈등, 날짜 미제공)',
      input: {
        birthDate: '1995-05-20',
        birthTime: '18:30',
        calendarType: 'solar' as const,
        gender: 'female' as const,
        inquiryTopic: 'career' as const,
        userTroubleText: '상사와의 마찰로 퇴사를 고민 중인데 언제 이직하는 게 유리할까요?',
        userQuestion: '상사와의 마찰로 퇴사를 고민 중인데 언제 이직하는 게 유리할까요?'
      }
    },
    {
      id: 'CASE_04',
      title: '2000년생 庚金 편인격 (재물 투자 손실, 날짜 미제공)',
      input: {
        birthDate: '2000-01-25',
        birthTime: '06:10',
        calendarType: 'solar' as const,
        gender: 'male' as const,
        inquiryTopic: 'wealth' as const,
        userTroubleText: '무리한 투자로 빚을 지게 되었는데 손실을 메꿀 기회가 언제 올까요?',
        userQuestion: '무리한 투자로 빚을 지게 되었는데 손실을 메꿀 기회가 언제 올까요?'
      }
    },
    {
      id: 'CASE_05',
      title: '1985년생 丙火 편재격 (부부 갈등 및 이혼 위기, 날짜 2026-09-01 제공)',
      input: {
        birthDate: '1985-07-08',
        birthTime: '21:40',
        calendarType: 'solar' as const,
        gender: 'female' as const,
        inquiryTopic: 'relationship' as const,
        userTroubleText: '2026년 9월 1일 배우자와 별거를 시작했습니다. 관계 회복이 가능할까요?',
        userQuestion: '2026년 9월 1일 배우자와 별거를 시작했습니다. 관계 회복이 가능할까요?'
      }
    }
  ];

  console.log(`=== 교차 CASE 5건 파이프라인 실행 시작 ===`);

  for (const c of cases) {
    console.log(`\n▶ [${c.id}] ${c.title} 실행 중...`);
    const result = await productionPipelineEngine.executePipeline(c.input);

    const caseFolder = path.join(outputDir, c.id);
    if (!fs.existsSync(caseFolder)) fs.mkdirSync(caseFolder, { recursive: true });

    // 4단계 산출물 개별 저장
    const tiers = result.fourTierReports;
    if (tiers) {
      fs.writeFileSync(path.join(caseFolder, '01_FREE_REPORT.txt'), tiers.free.customerReport, 'utf8');
      fs.writeFileSync(path.join(caseFolder, '02_STANDARD_REPORT.txt'), tiers.standard.customerReport, 'utf8');
      fs.writeFileSync(path.join(caseFolder, '03_SAL_REPORT.txt'), tiers.sal.customerReport, 'utf8');
      fs.writeFileSync(path.join(caseFolder, '04_PREMIUM_REPORT.txt'), tiers.premium.customerReport, 'utf8');
    }

    // 파이프라인 계산 데이터 저장
    const evidenceData = {
      fourPillarsText: result.generalSaju?.fourPillarsText,
      dayMaster: result.generalSaju?.dayMaster,
      dayMasterElement: result.generalSaju?.dayMasterElement,
      salDiagnosis: result.salDiagnosis,
      standardReports: {
        samhapCalculation: result.standardReports?.samhapCalculation,
        actionCandidates: result.standardReports?.actionCandidates,
      }
    };
    fs.writeFileSync(path.join(caseFolder, 'pipeline_evidence.json'), JSON.stringify(evidenceData, null, 2), 'utf8');

    console.log(`  - 4개 상품 산출물 저장 완료: ${caseFolder}`);
    console.log(`  - 사주: ${result.generalSaju?.fourPillarsText}`);
    console.log(`  - 일간: ${result.generalSaju?.dayMaster} (${result.generalSaju?.dayMasterElement})`);
    console.log(`  - 활성 신살 수: ${result.salDiagnosis?.activeSinsals?.length || 0}`);
    console.log(`  - 관계 작용 수: ${result.salDiagnosis?.relationResults?.length || 0}`);
  }

  console.log(`\n=== 5개 CASE 산출물 생성 완료! 디렉토리: ${outputDir} ===`);
}

main().catch(console.error);

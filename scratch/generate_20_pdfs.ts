import * as fs from 'fs';
import * as path from 'path';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { mabosalPdfGenerator, PdfGenerationResult } from '../src/modules/output/mabosal-pdf-generator.js';

interface CaseRun {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  gender: 'male' | 'female';
  userTroubleText: string;
}

const cases: CaseRun[] = [
  {
    id: 'CASE 01',
    name: '연애/결별',
    birthDate: '1992-03-15',
    birthTime: '08:30',
    gender: 'male',
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?',
  },
  {
    id: 'CASE 02',
    name: '사업 부도/위기',
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    userTroubleText: '2026년 8월 15일에 믿었던 동업자와 지분 및 정산 문제로 크게 다투고 결별 위기입니다.',
  },
  {
    id: 'CASE 03',
    name: '직장 이직/승진 갈등',
    birthDate: '1995-05-20',
    birthTime: '18:30',
    gender: 'male',
    userTroubleText: '상사와의 마찰로 퇴사를 고민 중인데 언제 이직하는 게 유리할까요?',
  },
  {
    id: 'CASE 04',
    name: '투자 손실/재물 위기',
    birthDate: '1982-04-05',
    birthTime: '06:00',
    gender: 'male',
    userTroubleText: '무리한 투자로 빚을 지게 되었는데 손실을 메꿀 기회가 언제 올까요?',
  },
  {
    id: 'CASE 05',
    name: '수술/건강 위기',
    birthDate: '1986-08-15',
    birthTime: '16:00',
    gender: 'male',
    userTroubleText: '건강 악화와 갑작스러운 수술 일정으로 인해 회복 시기와 안정을 찾고 싶습니다.',
  },
];

async function generateAll20Pdfs() {
  const outputDir = path.resolve('artifacts', 'pdf');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results: PdfGenerationResult[] = [];

  for (const c of cases) {
    console.log(`Processing ${c.id} (${c.name})...`);
    const res = await productionPipelineEngine.executePipeline({
      calendarType: 'solar',
      isLeapMonth: false,
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      isUnknownTime: false,
      gender: c.gender,
      region: 'Seoul',
      userTroubleText: c.userTroubleText,
      currentDate: '2026-10-03',
    });

    const fourTiers = res.fourTierReports;
    if (!fourTiers) throw new Error(`Missing fourTierReports for ${c.id}`);

    const tierList: ('FREE' | 'STANDARD' | 'SAL' | 'PREMIUM')[] = ['FREE', 'STANDARD', 'SAL', 'PREMIUM'];

    for (const tier of tierList) {
      const layer = fourTiers[tier.toLowerCase() as keyof typeof fourTiers];
      const pdf = mabosalPdfGenerator.generateReportPdf(layer.customerReport, {
        title: layer.title,
        caseId: c.id,
        tier,
        fourPillarsText: res.generalSaju.fourPillarsText,
        generationDate: '2026-10-04 10:48 KST',
      });

      const outPath = path.join(outputDir, pdf.fileName);
      fs.writeFileSync(outPath, pdf.buffer);
      pdf.filePath = outPath;
      results.push(pdf);

      console.log(`  -> [${tier}] Generated: ${pdf.fileName} (${pdf.pageCount} pages, ${pdf.fileSizeBytes} bytes)`);
    }
  }

  console.log(`\n================================================`);
  console.log(`총 ${results.length}개 PDF 생성 완료!`);
  console.log(`저장 경로: ${outputDir}`);

  // 무결성 검증
  let allPass = true;
  for (const r of results) {
    if (r.fileSizeBytes < 1000) {
      console.error(`ERROR: ${r.fileName} file size too small (${r.fileSizeBytes} bytes)`);
      allPass = false;
    }
    if (r.pageCount < 1) {
      console.error(`ERROR: ${r.fileName} pageCount < 1`);
      allPass = false;
    }
    // PDF 헤더 및 트레일러 검증
    const content = fs.readFileSync(r.filePath!, 'latin1');
    if (!content.startsWith('%PDF-1.4')) {
      console.error(`ERROR: ${r.fileName} invalid PDF header`);
      allPass = false;
    }
    if (!content.includes('%%EOF')) {
      console.error(`ERROR: ${r.fileName} missing %%EOF trailer`);
      allPass = false;
    }
  }

  if (allPass) {
    console.log(`모든 20개 PDF 파일 구조 및 바이트 무결성 검증 PASS!`);
  } else {
    console.error(`PDF 검증 실패 항목 존재`);
  }
}

generateAll20Pdfs().catch(console.error);

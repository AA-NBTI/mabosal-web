import fs from 'fs';
import path from 'path';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';

async function main() {
  const outputDir = path.resolve('scratch/phase51/four_tiers');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const cases = [
    {
      id: 'case01',
      title: 'CASE 01 (1992-03-15 08:30 남, 연애 결별, 날짜 미제공)',
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
      id: 'case02',
      title: 'CASE 02 (1988-12-10 14:00 남, 사업 동업 분쟁, 2026-08-15 제공)',
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
      id: 'case03',
      title: 'CASE 03 (1995-05-20 18:30 여, 직장 이직 갈등, 날짜 미제공)',
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
      id: 'case04',
      title: 'CASE 04 (2000-01-25 06:10 남, 재물 투자 손실, 날짜 미제공)',
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
      id: 'case05',
      title: 'CASE 05 (1985-07-08 21:40 여, 부부 갈등, 2026-09-01 제공)',
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

  console.log(`=== Phase 51: 20개 실제 고객 결과물 생성 시작 ===\n`);

  for (const c of cases) {
    console.log(`▶ [${c.id.toUpperCase()}] ${c.title} 파이프라인 실행 중...`);
    const result = await productionPipelineEngine.executePipeline(c.input as any);
    const tiers = result.fourTierReports;

    if (!tiers) {
      throw new Error(`[${c.id}] fourTierReports 결과가 비어있습니다.`);
    }

    const freePath = path.join(outputDir, `${c.id}_free.txt`);
    const standardPath = path.join(outputDir, `${c.id}_standard.txt`);
    const salPath = path.join(outputDir, `${c.id}_sal.txt`);
    const premiumPath = path.join(outputDir, `${c.id}_premium.txt`);

    fs.writeFileSync(freePath, tiers.free.customerReport, 'utf8');
    fs.writeFileSync(standardPath, tiers.standard.customerReport, 'utf8');
    fs.writeFileSync(salPath, tiers.sal.customerReport, 'utf8');
    fs.writeFileSync(premiumPath, tiers.premium.customerReport, 'utf8');

    console.log(`  ✓ FREE: ${tiers.free.wordCount}자 -> ${path.basename(freePath)}`);
    console.log(`  ✓ STANDARD: ${tiers.standard.wordCount}자 -> ${path.basename(standardPath)}`);
    console.log(`  ✓ SAL: ${tiers.sal.wordCount}자 -> ${path.basename(salPath)}`);
    console.log(`  ✓ PREMIUM: ${tiers.premium.wordCount}자 -> ${path.basename(premiumPath)}`);
  }

  console.log(`\n=== 20개 결과물 생성 완료! (저장 위치: ${outputDir}) ===`);
}

main().catch(console.error);

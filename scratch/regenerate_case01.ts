import fs from 'fs';
import path from 'path';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';

async function main() {
  const backupDir = 'scratch/phase53_backup';
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const fourTiersDir = 'scratch/phase51/four_tiers';
  const tiers = ['free', 'standard', 'sal', 'premium'];
  for (const tier of tiers) {
    const src = path.join(fourTiersDir, 'case01_' + tier + '.txt');
    const dst = path.join(backupDir, 'case01_' + tier + '_before_phase54.txt');
    if (fs.existsSync(src)) fs.copyFileSync(src, dst);
  }

  const case01Input = {
    birthDate: '1992-03-15',
    birthTime: '08:30',
    calendarType: 'solar' as const,
    gender: 'male' as const,
    inquiryTopic: 'relationship' as const,
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?',
    userQuestion: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?'
  };

  const res = await productionPipelineEngine.executePipeline(case01Input as any);
  const reports = res.fourTierReports!;

  fs.writeFileSync(path.join(fourTiersDir, 'case01_free.txt'), reports.free.customerReport, 'utf-8');
  fs.writeFileSync(path.join(fourTiersDir, 'case01_standard.txt'), reports.standard.customerReport, 'utf-8');
  fs.writeFileSync(path.join(fourTiersDir, 'case01_sal.txt'), reports.sal.customerReport, 'utf-8');
  fs.writeFileSync(path.join(fourTiersDir, 'case01_premium.txt'), reports.premium.customerReport, 'utf-8');

  console.log('Successfully regenerated CASE 01 4-tier reports.');
}

main().catch(console.error);

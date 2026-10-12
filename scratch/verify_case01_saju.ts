import { MabosalIntegratedService } from '../src/modules/phase17_25/mabosal-integrated-service.js';
import { ProductionPipelineEngine } from '../src/modules/production/production-pipeline.js';

async function verifyCase01() {
  const service = new MabosalIntegratedService();
  const pipeline = new ProductionPipelineEngine();

  const birthInput = {
    calendar_type: 'solar' as const,
    is_leap_month: false,
    birth_year: 1992,
    birth_month: 3,
    birth_day: 15,
    birth_time: '08:30',
    is_time_unknown: false,
    birth_city: '서울',
    gender: 'male' as const,
  };

  const troubleText = '3년 만난 연인과 크게 다투고 헤어졌습니다. 관계가 왜 이렇게 끝났는지, 다시 연락해도 될지 너무 괴롭습니다.';

  const integrated = await service.analyze({
    birthInput,
    troubleText,
    tier: 'paid_mabosal_full',
  });

  const prod = await pipeline.executePipeline({
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1992-03-15',
    birthTime: '08:30',
    isUnknownTime: false,
    gender: 'male',
    region: '서울',
    userTroubleText: troubleText,
    clientId: 'case-01-audit',
  });

  console.log('=== 1. FOUR PILLARS & ESSENTIALS ===');
  console.log('사주 4주:', integrated.fourPillarsText);
  const saju = integrated.dualResult.general_saju;
  console.log('일간:', saju.day_master);
  console.log('오행 분포:', saju.five_elements);
  console.log('강약:', saju.strength);
  console.log('대운:', saju.daewoon);
  console.log('세운:', saju.sewoon);

  console.log('\n=== 2. MA DIAGNOSIS ===');
  console.log('감지 여부:', integrated.dualResult.is_ma_detected);
  console.log('도메인:', integrated.dualResult.ma_signal.domain);
  console.log('구조적 원인:', integrated.dualResult.ma_signal.structural_cause);
  console.log('압축 진단:', integrated.presentation.step3_mabosal_diagnosis.compressed_diagnosis);

  console.log('\n=== 3. TIMING ===');
  console.log('타이밍 리포트:', integrated.timingReport);

  console.log('\n=== 4. PRESCRIPTION ===');
  console.log('처방 리포트:', integrated.prescription);

  console.log('\n=== 5. PROD RESULT ===');
  console.log('AI Presentation:', prod.aiPresentation);
  console.log('Remedies:', prod.remedyArtifacts.map(a => ({ type: a.formatType, title: a.title })));
}

verifyCase01().catch(console.error);

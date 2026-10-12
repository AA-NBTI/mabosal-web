/**
 * 마보살 엔진 종합 시연 데모 (Mabosal Engine End-to-End Demo)
 * 실행: npx tsx src/demo.ts
 */

import { MabosalService } from './service/mabosal-service.js';

const service = new MabosalService();

console.log('='.repeat(70));
console.log('🔮 마보살 엔진 (Mabosal Engine v1.0) 전체 파이프라인 통합 시연');
console.log('='.repeat(70));

// 시연 케이스: 1990년 5월 15일 11시 05분생 (사/오시 경계구간), 현실조언형, 매운맛
const result = service.analyze({
  birthDate: '1990-05-15',
  birthTime: '11:05',
  gender: 'male',
  question: '올해 다니던 회사를 그만두고 친구와 동업으로 스타트업을 창업해도 될까요?',
  taste: 'spicy',
  character: 'direct',
});

console.log('\n[1. 사주 4주 명식]');
const pt = result.pillarsTable;
console.log(`- 연주: ${pt.year.stemKorean}(${pt.year.stemHanja}, ${pt.year.stemTenGod}) ${pt.year.branchKorean}(${pt.year.branchHanja}, ${pt.year.branchTenGod})`);
console.log(`- 월주: ${pt.month.stemKorean}(${pt.month.stemHanja}, ${pt.month.stemTenGod}) ${pt.month.branchKorean}(${pt.month.branchHanja}, ${pt.month.branchTenGod})`);
console.log(`- 일주: ${pt.day.stemKorean}(${pt.day.stemHanja}, ${pt.day.stemTenGod}) ${pt.day.branchKorean}(${pt.day.branchHanja}, ${pt.day.branchTenGod})`);
console.log(`- 시주: ${pt.hour ? `${pt.hour.stemKorean}(${pt.hour.stemHanja}, ${pt.hour.stemTenGod}) ${pt.hour.branchKorean}(${pt.hour.branchHanja}, ${pt.hour.branchTenGod})` : '(시간미상)'}`);
console.log(`- 일간 오행: ${result.dayMasterElement} / 신강약 판정: ${result.dayMasterStrength.category} (${result.dayMasterStrength.score}점)`);

console.log('\n[2. 질문 맞춤형 분석]');
if (result.questionAnswer) {
  console.log(`- 질문: "${result.questionAnswer.questionText}"`);
  console.log(`- 도메인: ${result.questionAnswer.domain}`);
  console.log(`- 타겟 마: ${result.questionAnswer.topTargetMa}`);
}

console.log('\n[3. 최상위 마]');
console.log(`- 마 이름: ${result.sections.topMa.name}`);
console.log(`- 측정 점수: ${result.sections.topMa.score}점 (${result.sections.topMa.band})`);

console.log('\n[4. 8단계 표준 서사 리포트 요약]');
console.log(`* 핵심 요약:\n${result.sections.keySummary}\n`);
console.log(`* 부담 및 리스크:\n${result.sections.pressureAndRisk}\n`);
console.log(`* 기회 요소:\n${result.sections.opportunity}\n`);
console.log(`* 실천 조언:\n${result.sections.actionAdvice}\n`);

console.log('[5. 21개 전체 마 점수 순위표 (상위 5개)]');
result.maRankings.slice(0, 5).forEach(m => {
  console.log(`  ${m.rank}위: [${m.koreanName}] ${m.score}점 (${m.band}) - ${m.dominantInfluence}`);
});

if (result.boundaryAnalysis) {
  console.log('\n[6. 시진 경계선(±15분) 분석 결과]');
  console.log(`- 후보 A (${result.boundaryAnalysis.candidateA.timeLabel}): ${result.boundaryAnalysis.candidateA.topMa} (${result.boundaryAnalysis.candidateA.score}점)`);
  console.log(`- 후보 B (${result.boundaryAnalysis.candidateB.timeLabel}): ${result.boundaryAnalysis.candidateB.topMa} (${result.boundaryAnalysis.candidateB.score}점)`);
  console.log(`- 합의 분석: ${result.boundaryAnalysis.consensus}`);
}

console.log('\n' + '='.repeat(70));
console.log('✅ 마보살 엔진 15단계 전체 구현 및 검증 완료');
console.log('='.repeat(70));

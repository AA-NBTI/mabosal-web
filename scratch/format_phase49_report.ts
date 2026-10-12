import * as fs from 'fs';

const raw = fs.readFileSync('scratch/phase49_audit_output.json', 'utf-8');
const cases = JSON.parse(raw);

let report = '';

cases.forEach((item: any, idx: number) => {
  const { tc, freeRes, detailedRes, prodRes } = item;
  const saju = detailedRes.dualResult.general_saju;
  const trouble = detailedRes.dualResult.user_trouble;
  const ma = detailedRes.dualResult.ma_signal;
  const timing = detailedRes.timingReport;
  const rx = detailedRes.prescription;

  report += `### ${tc.id} — ${tc.name}\n\n`;
  report += `* **출생정보**: ${tc.birthDate} (${tc.calendarType === 'solar' ? '양력' : tc.isLeapMonth ? '음력 윤달' : '음력'}), ${tc.isUnknownTime ? '출생시간 미상' : tc.birthTime}, 성별: ${tc.gender === 'male' ? '남성' : '여성'}, 출생지: ${tc.region}\n`;
  report += `* **사주 원국**: ${detailedRes.fourPillarsText}\n`;
  report += `* **현실 고민**: "${tc.troubleText}"\n\n`;

  // 1. 무료 결과
  report += `#### 무료 결과 [실제 출력 전문]\n\n`;
  report += `[나의 기본 사주 구조]\n`;
  report += `* 사주 4주: ${freeRes.fourPillarsText}\n`;
  report += `* 일간(나를 상징하는 기운): ${saju.day_master.name} - ${saju.day_master.nature}\n`;
  report += `* 성향 및 행동 특성: ${saju.day_master.psychological_trait} (핵심 키워드: ${saju.day_master.keywords.join(', ')})\n`;
  report += `* 오행 균형: 주도 오행 [${saju.five_elements.dominant}], 부족 오행 [${saju.five_elements.lacking.join(', ') || '없음(고른 조화)'}]\n`;
  report += `* 일간 강약: ${saju.strength.status} (${saju.strength.description})\n\n`;

  report += `[올해의 환경적 흐름 (2026년)]\n`;
  report += `* 총평: ${saju.sewoon.flow_summary}\n`;
  report += `* 좋은 흐름: ${saju.sewoon.critical_opportunities[0] || '내실을 다지고 신뢰를 구축하기 좋은 환경'}\n`;
  report += `* 주의할 흐름: ${saju.sewoon.caution_points[0] || '감정적 마찰이나 무리한 확장에 주의가 필요한 시기'}\n\n`;

  report += `[가져오신 고민과 마보살 진단]\n`;
  report += `* 문제 인식: ${freeRes.presentation.step1_current_situation.empathy_summary}\n`;
  report += `* 명리학적 핵심 원인: ${freeRes.presentation.step2_saju_insight.structural_explanation}\n`;
  report += `* 마보살식 핵심 한마디: "${freeRes.presentation.step3_mabosal_diagnosis.compressed_diagnosis}"\n`;
  report += `  (${freeRes.presentation.step3_mabosal_diagnosis.diagnosis_detail})\n\n`;
  report += `* 상세 월별 타이밍, 행동 금기·실천 처방, 맞춤 디지털 조율 카드는 정밀풀이에서 잠금 해제됩니다.\n\n`;

  // 2. 39,000원 결과
  report += `#### 39,000원 결과 [실제 출력 전문]\n\n`;
  report += `[평생 사주 구조와 그릇]\n`;
  report += `* 타고난 명식: ${detailedRes.fourPillarsText}\n`;
  report += `* 본질적 기질: ${saju.day_master.name} - ${saju.day_master.nature}\n`;
  report += `* 심리 및 강약 구조: ${saju.strength.status}격으로 ${saju.strength.description}\n`;
  report += `* 조후 및 계절적 균형: ${saju.five_elements.temperature_balance}\n`;
  report += `* 오행 배합: ${saju.five_elements.commentary}\n\n`;

  report += `[7대 라이프 영역 심층 분석]\n`;
  const t = saju.themes;
  report += `1. 재물운 (${t.wealth.title}): ${t.wealth.summary}\n   - 기초 구조: ${t.wealth.foundation_analysis}\n   - 올해 흐름: ${t.wealth.current_flow}\n   - 실천 가이드: ${t.wealth.action_guideline}\n\n`;
  report += `2. 직장·조직운 (${t.career.title}): ${t.career.summary}\n   - 기초 구조: ${t.career.foundation_analysis}\n   - 올해 흐름: ${t.career.current_flow}\n   - 실천 가이드: ${t.career.action_guideline}\n\n`;
  report += `3. 사업·창업운 (${t.business.title}): ${t.business.summary}\n   - 기초 구조: ${t.business.foundation_analysis}\n   - 올해 흐름: ${t.business.current_flow}\n   - 실천 가이드: ${t.business.action_guideline}\n\n`;
  report += `4. 연애·이성운 (${t.relationship.title}): ${t.relationship.summary}\n   - 기초 구조: ${t.relationship.foundation_analysis}\n   - 올해 흐름: ${t.relationship.current_flow}\n   - 실천 가이드: ${t.relationship.action_guideline}\n\n`;
  report += `5. 결혼·배우자운 (${t.marriage.title}): ${t.marriage.summary}\n   - 기초 구조: ${t.marriage.foundation_analysis}\n   - 올해 흐름: ${t.marriage.current_flow}\n   - 실천 가이드: ${t.marriage.action_guideline}\n\n`;
  report += `6. 인간관계·평판 (${t.interpersonal.title}): ${t.interpersonal.summary}\n   - 기초 구조: ${t.interpersonal.foundation_analysis}\n   - 올해 흐름: ${t.interpersonal.current_flow}\n   - 실천 가이드: ${t.interpersonal.action_guideline}\n\n`;
  report += `7. 건강·체력 균형 (${t.health.title}): ${t.health.summary}\n   - 기초 구조: ${t.health.foundation_analysis}\n   - 올해 흐름: ${t.health.current_flow}\n   - 실천 가이드: ${t.health.action_guideline}\n\n`;

  report += `[대운 및 세운 흐름]\n`;
  report += `* 10년 주기 대운: ${saju.daewoon.current_daewoon.pillar} (${saju.daewoon.current_daewoon.flow_summary})\n`;
  report += `* 2026년 세운(${saju.sewoon.current_pillar}): ${saju.sewoon.flow_summary}\n`;
  report += `* 주요 기회: ${saju.sewoon.critical_opportunities.join(' / ')}\n`;
  report += `* 주의 사항: ${saju.sewoon.caution_points.join(' / ')}\n`;
  report += `* 주요 시기 흐름:\n`;
  saju.key_timing_periods.forEach((p: any) => {
    report += `  - [${p.period_label} / ${p.event_type}]: ${p.description} (명리 근거: ${p.basis})\n`;
  });
  report += `\n`;

  // 3. 149,000원 마보살 결과
  report += `#### 149,000원 마보살 결과 [실제 출력 전문]\n\n`;
  report += `[1. 현실의 문제 인식과 공감]\n`;
  report += `"${tc.troubleText}"\n`;
  report += `${prodRes.aiPresentation.userHeadline}\n\n`;

  report += `[2. 왜 지금 이런 일이 생겼는가? (명리학적 원인 구조)]\n`;
  report += `${prodRes.aiPresentation.sajuStructureExplanation}\n`;
  report += `* 기저 역학: ${prodRes.aiPresentation.problemAnalysis}\n\n`;

  report += `[3. 마보살식 압축 진단]\n`;
  report += `“${prodRes.aiPresentation.mabosalPunchline}”\n`;
  report += `* 상세 맥락: 마(魔)란 인생의 실패가 아니라, 원국과 세운의 에너지가 마찰을 빚어 일시적으로 판단력이 흐려지고 현실의 매듭이 엉키는 계절적 굴곡입니다.\n\n`;

  report += `[4. 정밀 시기 분석: 언제 강해지고 언제 풀리는가?]\n`;
  report += `${prodRes.aiPresentation.timingGuide}\n`;
  report += `* 미세 균열 시작 시점: ${timing.current_phase || prodRes.timing.startMonth}\n`;
  report += `* 위기 및 갈등 최고 정점월: ${timing.crisis_peak_period}\n`;
  report += `* 마찰이 잦아드는 완화월: ${timing.relief_period}\n`;
  report += `* 적극적으로 움직여 결실을 맺을 호운/전환 시점: ${timing.action_opportune_period}\n`;
  report += `* 기다림이 최선인 정체 구간: ${timing.waiting_recommended_period}\n\n`;

  report += `[5. 구체적 행동 처방: 무엇을 하고 무엇을 하지 말아야 하는가?]\n`;
  report += `${prodRes.aiPresentation.actionAdvice}\n`;
  report += `❌ 지금 하지 말아야 할 것 (금기 지침):\n`;
  prodRes.prescription.dontList.forEach((d: string) => {
    report += `   - ${d}\n`;
  });
  report += `⭕ 지금 해야 할 것 (실천 지침):\n`;
  prodRes.prescription.doList.forEach((d: string) => {
    report += `   - ${d}\n`;
  });
  report += `🌿 오행 보완 조율: ${prodRes.prescription.elementRemedy}\n`;
  report += `💡 이후 기회를 잡는 구체적 전략: ${rx.timing_strategic_action}\n\n`;

  report += `[6. 동봉된 맞춤형 디지털 처방물 (1080×1920 SVG 아티팩트)]\n`;
  prodRes.remedyArtifacts.forEach((art: any) => {
    report += `* [${art.formatType}] ${art.title}: ${art.subtitle} (규격: ${art.dimensions.width}x${art.dimensions.height})\n`;
  });
  report += `\n---\n\n`;
});

fs.writeFileSync('scratch/phase49_full_report.md', report, 'utf-8');
console.log('Successfully formatted Phase 49 full report!');

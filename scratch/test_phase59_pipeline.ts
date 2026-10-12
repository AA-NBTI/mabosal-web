import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { SajuDynamicAnalyzer } from '../src/modules/production/saju-dynamic-analyzer.js';

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

async function run() {
  for (const c of cases) {
    console.log(`================================================================`);
    console.log(`[${c.id}] ${c.name} (${c.birthDate} ${c.birthTime} ${c.gender})`);
    console.log(`고민: ${c.userTroubleText}`);

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
    if (!fourTiers) {
      console.error('fourTierReports missing!');
      continue;
    }

    console.log(`원국: ${res.generalSaju.fourPillarsText}`);
    console.log(`일간: ${res.generalSaju.dayMaster} (${res.generalSaju.dayMasterElement})`);
    console.log(`강약: ${res.generalSaju.strength}`);
    console.log(`FREE 제목: ${fourTiers.free.title}, 글자수: ${fourTiers.free.wordCount}`);
    console.log(`STANDARD 제목: ${fourTiers.standard.title}, 글자수: ${fourTiers.standard.wordCount}`);
    console.log(`SAL 제목: ${fourTiers.sal.title}, 글자수: ${fourTiers.sal.wordCount}`);
    console.log(`PREMIUM 제목: ${fourTiers.premium.title}, 글자수: ${fourTiers.premium.wordCount}`);

    // 교차검증 대상 체크
    if (c.id === 'CASE 05') {
      const isWolgeopInStandard = fourTiers.standard.customerReport.includes('월겁격');
      const isYanginInStandard = fourTiers.standard.customerReport.includes('양인격');
      console.log(`[CASE 05 교차검증] STANDARD에 '월겁격' 포함 여부: ${isWolgeopInStandard}, '양인격' 오표기 여부: ${isYanginInStandard}`);
    }

    if (c.id === 'CASE 04') {
      const hasDw5 = fourTiers.standard.customerReport.includes('제5대운') || fourTiers.standard.customerReport.includes('무신');
      console.log(`[CASE 04 교차검증] STANDARD 대운 표시(제5대운 / 무신): ${hasDw5}`);
      const dwMatches = fourTiers.standard.customerReport.match(/제\d+대운\s*\[[^\]]+\]/g);
      console.log(`[CASE 04 대운 매칭]:`, dwMatches);
    }

    if (c.id === 'CASE 02') {
      const hasPyeonjae = fourTiers.standard.customerReport.includes('편재격') || fourTiers.standard.customerReport.includes('편재');
      console.log(`[CASE 02 교차검증] 편재격 / 편재 표시 여부: ${hasPyeonjae}`);
    }

    if (c.id === 'CASE 03') {
      const hasJeonggwan = fourTiers.standard.customerReport.includes('정관격');
      console.log(`[CASE 03 교차검증] 정관격 표시 여부: ${hasJeonggwan}`);
    }
  }
}

run().catch(console.error);

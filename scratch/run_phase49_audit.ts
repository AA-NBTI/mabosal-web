import { ProductionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { MabosalIntegratedService } from '../src/modules/phase17_25/mabosal-integrated-service.js';
import * as fs from 'fs';

interface TestCase {
  id: string;
  name: string;
  calendarType: 'solar' | 'lunar';
  isLeapMonth: boolean;
  birthDate: string;
  birthTime: string | null;
  isUnknownTime: boolean;
  gender: 'male' | 'female';
  region: string;
  troubleText: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'CASE 01',
    name: '30대 남성 (갑목 일간, 이별 및 재회 고민)',
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1992-03-15',
    birthTime: '08:30',
    isUnknownTime: false,
    gender: 'male',
    region: '서울',
    troubleText: '3년 만난 연인과 크게 다투고 헤어졌습니다. 관계가 왜 이렇게 끝났는지, 다시 연락해도 될지 너무 괴롭습니다.',
  },
  {
    id: 'CASE 02',
    name: '40대 여성 (정화 일간, 직장 권고사직 및 해고)',
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1984-07-22',
    birthTime: '14:20',
    isUnknownTime: false,
    gender: 'female',
    region: '인천',
    troubleText: '10년 넘게 다니던 회사에서 갑작스러운 권고사직 통보를 받았습니다. 배신감과 앞날에 대한 불안으로 잠을 잘 수 없습니다.',
  },
  {
    id: 'CASE 03',
    name: '20대 후반 남성 (경금 일간, 이직 타이밍 고민)',
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1997-11-04',
    birthTime: '21:10',
    isUnknownTime: false,
    gender: 'male',
    region: '수원',
    troubleText: '현재 직장에서 심한 번아웃이 왔습니다. 당장 그만두고 이직 준비를 해야 할지, 아니면 버티면서 준비해야 할지 시기를 모르겠습니다.',
  },
  {
    id: 'CASE 04',
    name: '50대 남성 (무토 일간, 자영업 사업 정체 및 폐업 갈림길)',
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1973-05-18',
    birthTime: '06:40',
    isUnknownTime: false,
    gender: 'male',
    region: '대전',
    troubleText: '식당과 유통업을 운영 중인데 2년째 매출이 곤두박질치고 거래처 수금이 막혔습니다. 폐업하고 손을 털어야 할지 버텨야 할지 막막합니다.',
  },
  {
    id: 'CASE 05',
    name: '30대 중반 여성 (신금 일간, 무리한 주식/코인 투자 손실)',
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1988-10-09',
    birthTime: '17:50',
    isUnknownTime: false,
    gender: 'female',
    region: '부산',
    troubleText: '지인의 권유로 주식과 코인에 무리하게 대출까지 끌어다 투자했다가 원금의 70%를 잃었습니다. 돈이 계속 새어나가서 빚더미에 앉았습니다.',
  },
  {
    id: 'CASE 06',
    name: '30대 초반 여성 (을목 일간, 결혼 준비 중 파혼 위기)',
    calendarType: 'lunar',
    isLeapMonth: false,
    birthDate: '1994-04-12', // 음력
    birthTime: '10:15',
    isUnknownTime: false,
    gender: 'female',
    region: '대구',
    troubleText: '올가을 결혼을 앞두고 예단과 집 문제로 양가 갈등이 커져 파혼 직전까지 갔습니다. 이 사람과 결혼을 밀어붙여도 될까요?',
  },
  {
    id: 'CASE 07',
    name: '40대 남성 (임수 일간, 동업자 배신 및 인간관계 구설)',
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1981-12-28',
    birthTime: '03:30',
    isUnknownTime: false,
    gender: 'male',
    region: '광주',
    troubleText: '15년 지기 친구와 함께 사업체를 운영하다가 뒤통수를 맞고 회사 돈까지 횡령당했습니다. 주변 사람들도 저를 오해하고 있어 미칠 것 같습니다.',
  },
  {
    id: 'CASE 08',
    name: '20대 초반 여성 (계수 일간, 출생시간 미상, 이유 없는 무기력과 장기 정체)',
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '2003-02-14',
    birthTime: null,
    isUnknownTime: true,
    gender: 'female',
    region: '서울',
    troubleText: '시험도 계속 떨어지고 뭘 해도 의욕이 안 납니다. 특별한 사건이 없는데도 1년 넘게 앞길이 꽉 막힌 벽에 갇힌 기분입니다.',
  },
  {
    id: 'CASE 09',
    name: '60대 남성 (병화 일간, 음력 윤달, 은퇴 후 자산 관리 및 건강 불안)',
    calendarType: 'lunar',
    isLeapMonth: true,
    birthDate: '1963-04-15', // 음력 윤달
    birthTime: '12:00',
    isUnknownTime: false,
    gender: 'male',
    region: '청주',
    troubleText: '정년퇴직 후 건강검진에서 심혈관 이상 소견을 받고 마음이 불안합니다. 퇴직금 지키는 법과 노후 건강 흐름이 궁금합니다.',
  },
  {
    id: 'CASE 10',
    name: '30대 후반 여성 (기토 일간, 프리랜서 커리어 방향 상실 및 금전 압박)',
    calendarType: 'solar',
    isLeapMonth: false,
    birthDate: '1986-09-20',
    birthTime: '19:40',
    isUnknownTime: false,
    gender: 'female',
    region: '제주',
    troubleText: '프리랜서 디자이너로 8년 일했는데 올해 들어 프로젝트 의뢰가 뚝 끊겼습니다. 생활비 압박이 심한데 취업으로 돌아서야 할까요?',
  },
];

async function run() {
  const pipeline = new ProductionPipelineEngine();
  const service = new MabosalIntegratedService();
  const results = [];

  for (const tc of TEST_CASES) {
    const [y, m, d] = tc.birthDate.split('-').map(Number);
    const birthInput = {
      calendar_type: tc.calendarType,
      is_leap_month: tc.isLeapMonth,
      birth_year: y,
      birth_month: m,
      birth_day: d,
      birth_time: tc.birthTime,
      is_time_unknown: tc.isUnknownTime,
      birth_city: tc.region,
      gender: tc.gender,
    };

    // 1. 무료 분석
    const freeRes = await service.analyze({
      birthInput,
      troubleText: tc.troubleText,
      tier: 'free_diagnosis',
    });

    // 2. 39,000원 정밀 사주
    const detailedRes = await service.analyze({
      birthInput,
      troubleText: tc.troubleText,
      tier: 'paid_detailed_saju',
    });

    // 3. 149,000원 마보살 정밀풀이
    const prodRes = await pipeline.executePipeline({
      calendarType: tc.calendarType,
      isLeapMonth: tc.isLeapMonth,
      birthDate: tc.birthDate,
      birthTime: tc.birthTime,
      isUnknownTime: tc.isUnknownTime,
      gender: tc.gender,
      region: tc.region,
      userTroubleText: tc.troubleText,
      clientId: tc.id,
    });

    results.push({
      tc,
      freeRes,
      detailedRes,
      prodRes,
    });
  }

  fs.writeFileSync('scratch/phase49_audit_output.json', JSON.stringify(results, null, 2), 'utf-8');
  console.log('Successfully generated Phase 49 audit results for 10 cases!');
}

run().catch(console.error);

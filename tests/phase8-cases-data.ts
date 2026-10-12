/**
 * Phase 8 & 9 검증용 10대 사주 케이스 공통 데이터
 */

import { SpouseProfile } from '../src/modules/ma/index.js';

export interface TestCaseDefinition {
  caseId: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  spouseProfile?: SpouseProfile;
  expectedCharacteristics: {
    expectedDayStem?: string;
    expectedStrength?: string;
    expectedClashesCountMin?: number;
    expectedHarmoniesCountMin?: number;
    expectedDominantMa?: string[];
  };
}

export const PHASE8_10_CASES: TestCaseDefinition[] = [
  {
    caseId: 'Case 01',
    name: '일반형 (오행·일간 균형)',
    birthDate: '1984-05-15',
    birthTime: '14:30',
    expectedCharacteristics: { expectedDayStem: '기', expectedStrength: '중화' },
  },
  {
    caseId: 'Case 02',
    name: '강한 일간 (신강/득령/득지)',
    birthDate: '1991-09-07',
    birthTime: '12:00',
    expectedCharacteristics: { expectedDayStem: '경', expectedStrength: '신강' },
  },
  {
    caseId: 'Case 03',
    name: '약한 일간 (극약/실령/극설교가)',
    birthDate: '1990-05-20',
    birthTime: '20:00',
    expectedCharacteristics: { expectedDayStem: '을', expectedStrength: '극약' },
  },
  {
    caseId: 'Case 04',
    name: '충 다발형 (지지 자오충 2회)',
    birthDate: '1984-06-15',
    birthTime: '12:00',
    expectedCharacteristics: { expectedClashesCountMin: 2 },
  },
  {
    caseId: 'Case 05',
    name: '합·국 다발형 (사유축 삼합 금국, 자축 육합)',
    birthDate: '1985-05-25',
    birthTime: '18:00',
    expectedCharacteristics: { expectedHarmoniesCountMin: 2 },
  },
  {
    caseId: 'Case 06',
    name: '관계 집중형 (결혼마 DOMINANT)',
    birthDate: '1985-02-10',
    birthTime: '12:00',
    spouseProfile: { profileType: 'traditional_male' },
    expectedCharacteristics: { expectedDominantMa: ['ma_marriage'] },
  },
  {
    caseId: 'Case 07',
    name: '재물·사업 집중형 (사업마 DOMINANT)',
    birthDate: '1990-10-24',
    birthTime: '08:00',
    expectedCharacteristics: { expectedDominantMa: ['ma_business'] },
  },
  {
    caseId: 'Case 08',
    name: '건강·안전 집중형 (이동마 DOMINANT, 사고마 ACTIVE)',
    birthDate: '1986-08-15',
    birthTime: '16:00',
    expectedCharacteristics: { expectedDominantMa: ['ma_movement'] },
  },
  {
    caseId: 'Case 09',
    name: '경계 시간형 (1990년 입춘 1분 전)',
    birthDate: '1990-02-04',
    birthTime: '10:14',
    expectedCharacteristics: { expectedDayStem: '경' },
  },
  {
    caseId: 'Case 10',
    name: '저신호형 (시간 미상, DOMINANT 부재)',
    birthDate: '1995-10-10',
    birthTime: null,
    expectedCharacteristics: { expectedDominantMa: [] },
  },
];

/**
 * PalaceEngine: 4궁위(Palace) 배속 및 사회/육친/인생 주기 영역 분석 엔진
 */

import { FourPillars, Pillar } from '../../core/types.js';

export interface SinglePalaceInfo {
  pillarName: string;
  position: 'year' | 'month' | 'day' | 'hour';
  stemPalace: {
    relativeRole: string; // 예: 조부, 부친, 본인, 자녀
    socialDomain: string; // 예: 국가/명분, 직무/사회, 주체, 개인희망
  };
  branchPalace: {
    relativeRole: string; // 예: 조모, 모친, 배우자, 자녀/부하
    environmentalDomain: string; // 예: 사회적 터전, 직업환경, 사적거처, 미래/귀착점
  };
  lifePhase: string; // 예: 유년기(0~15세), 청년기(16~30세), 중년기(31~45세), 말년기(46세~)
}

export interface PalaceAnalysis {
  yearPalace: SinglePalaceInfo;
  monthPalace: SinglePalaceInfo;
  dayPalace: SinglePalaceInfo;
  hourPalace: SinglePalaceInfo | null;
}

export class PalaceEngine {
  public calculate(pillars: FourPillars): PalaceAnalysis {
    const yearPalace: SinglePalaceInfo = {
      pillarName: pillars.year.name || `${pillars.year.stem}${pillars.year.branch}`,
      position: 'year',
      stemPalace: { relativeRole: '조부/선조', socialDomain: '국가/공적 명분/대외 인지도' },
      branchPalace: { relativeRole: '조모/근본', environmentalDomain: '가문/출신 배경/뿌리' },
      lifePhase: '유년기 (0~15세)',
    };

    const monthPalace: SinglePalaceInfo = {
      pillarName: pillars.month.name || `${pillars.month.stem}${pillars.month.branch}`,
      position: 'month',
      stemPalace: { relativeRole: '부친/사회적 윗사람', socialDomain: '직장/공적 직무/사회적 활동' },
      branchPalace: { relativeRole: '모친/형제', environmentalDomain: '직업 환경/월령 사령/사회적 무대' },
      lifePhase: '청년기 (16~30세)',
    };

    const dayPalace: SinglePalaceInfo = {
      pillarName: pillars.day.name || `${pillars.day.stem}${pillars.day.branch}`,
      position: 'day',
      stemPalace: { relativeRole: '본인 (일간, Day Master)', socialDomain: '자아/정체성/주체성' },
      branchPalace: { relativeRole: '배우자 (배우자궁)', environmentalDomain: '내면 세계/가정/사적 거처' },
      lifePhase: '중년기 (31~45세)',
    };

    let hourPalace: SinglePalaceInfo | null = null;
    if (pillars.hour) {
      hourPalace = {
        pillarName: pillars.hour.name || `${pillars.hour.stem}${pillars.hour.branch}`,
        position: 'hour',
        stemPalace: { relativeRole: '자녀/후배/부하', socialDomain: '개인적 이상/취미/비밀/미래 구상' },
        branchPalace: { relativeRole: '자녀궁/최종 결실', environmentalDomain: '말년 거처/귀착지/결과물' },
        lifePhase: '말년기 (46세 이후)',
      };
    }

    return {
      yearPalace,
      monthPalace,
      dayPalace,
      hourPalace,
    };
  }
}

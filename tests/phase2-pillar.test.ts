import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';

describe('Phase 2: Pillar Engine (4주 산출 및 경계/시간미상) Tests', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();

  it('T01 기준 명식: 2024년 2월 5일 12:00 출생의 4주가 정확히 산출되어야 한다', () => {
    // 2024-02-04 17시경 입춘 이후이므로 갑진(甲辰)년
    // 인월이므로 연상기월법에 따라 병인(丙寅)월
    // 2024-02-05 일진: 기해(己亥)일
    // 기토 일간 + 12시(오시) -> 일상기시법(갑기일은 갑자시 시작)에 따라 경오(庚午)시
    const calResult = calendarEngine.execute({
      birth_date: '2024-02-05',
      birth_time: '12:00',
    });
    expect(calResult.metadata.status).toBe('active');

    const pillarResult = pillarEngine.execute(calResult.data);
    expect(pillarResult.metadata.status).toBe('active');

    const { four_pillars } = pillarResult.data;
    expect(four_pillars.year.name).toBe('갑진');
    expect(four_pillars.month.name).toBe('병인');
    expect(four_pillars.day.name).toBe('기해');
    expect(four_pillars.hour?.name).toBe('경오');
  });

  it('입춘 이전 날짜(2024-01-15)는 전년도 간지(계묘년)로 판정되어야 한다', () => {
    const calResult = calendarEngine.execute({
      birth_date: '2024-01-15',
      birth_time: '10:00',
    });
    const pillarResult = pillarEngine.execute(calResult.data);

    expect(pillarResult.data.four_pillars.year.name).toBe('계묘');
    expect(pillarResult.data.year_result.isBeforeIpchun).toBe(true);
  });

  it('Anchor 일진 검증: 2000년 1월 1일은 정확히 무오(戊午)일이어야 한다', () => {
    const calResult = calendarEngine.execute({
      birth_date: '2000-01-01',
      birth_time: '12:00',
    });
    const pillarResult = pillarEngine.execute(calResult.data);

    expect(pillarResult.data.four_pillars.day.name).toBe('무오');
  });

  it('23시 이후(자시 시작) 출생 시 사주 일진이 익일로 전환되어야 한다', () => {
    // 2024-02-05 23:30 출생 -> 사주 일진은 2024-02-06의 경자(庚子)일
    const calResult = calendarEngine.execute({
      birth_date: '2024-02-05',
      birth_time: '23:30',
    });
    const pillarResult = pillarEngine.execute(calResult.data);

    expect(pillarResult.data.day_result.sajuDate).toBe('2024-02-06');
    expect(pillarResult.data.four_pillars.day.name).toBe('경자');
    // 경금 일간 + 자시 -> 일상기시법(을경일은 병자시 시작)에 따라 병자(丙子)시
    expect(pillarResult.data.four_pillars.hour?.name).toBe('병자');
  });

  it('B04: 출생시간 미상(hour=null) 시 시주는 null을 유지하고 시간 의존성을 기록해야 한다', () => {
    const calResult = calendarEngine.execute({
      birth_date: '2020-05-10',
      birth_time: null,
    });
    const pillarResult = pillarEngine.execute(calResult.data);

    expect(pillarResult.data.four_pillars.hour).toBeNull();
    expect(pillarResult.data.hour_result.timeDependency.is_missing_hour).toBe(true);
    expect(pillarResult.data.hour_result.timeDependency.requires_hour).toBe(true);
    expect(pillarResult.data.hour_result.timeDependency.time_dependency).toBeGreaterThan(0);
    // 임의의 시간 주입이 없음을 재확인
    expect(pillarResult.data.summary_string).toContain('시간미상');
  });

  it('B01, B02, B03, B05: 경계시간(00:58, 1시 경계 2분 전) 출생 시 Candidate A와 B가 생성되어야 한다', () => {
    const calResult = calendarEngine.execute({
      birth_date: '2024-03-10',
      birth_time: '00:58', // 01:00 경계 2분 전
    });
    const pillarResult = pillarEngine.execute(calResult.data);
    const boundary = pillarResult.data.boundary_analysis;

    expect(boundary.has_boundary_issue).toBe(true);
    expect(boundary.candidates.length).toBe(2);

    const candA = boundary.candidates.find(c => c.candidate_id === 'A');
    const candB = boundary.candidates.find(c => c.candidate_id === 'B');

    expect(candA).toBeDefined();
    expect(candB).toBeDefined();
    expect(candA?.pillars.hour?.branch).toBe('자');
    expect(candB?.pillars.hour?.branch).toBe('축');

    // 경계 민감도가 높아야 함
    expect(boundary.boundary_sensitivity).toBeGreaterThan(80);
    // 임의로 하나를 단일 선택하지 않음
    expect(boundary.selected_candidate).toBeNull();
  });

  it('동일 입력 + 동일 버전에 대해 결정론적(동일한) 결과가 산출되어야 한다', () => {
    const input = { birth_date: '1990-07-07', birth_time: '07:30' };
    const res1 = pillarEngine.execute(calendarEngine.execute(input).data);
    const res2 = pillarEngine.execute(calendarEngine.execute(input).data);

    expect(res1.data.summary_string).toBe(res2.data.summary_string);
    expect(res1.data.four_pillars).toEqual(res2.data.four_pillars);
  });

  it('Phase 2 수정 검증 1: M02 DST 적용 시 실질 시각(12:30) 기준 시주가 갑오(甲午)시로 산출되어야 한다', () => {
    // 1988-06-15 13:30 출생 (서머타임 -60분) -> 실질시각 12:30 (오시)
    // 일간 신(辛)금 + 오시 -> 병신지일 무자두 -> 갑오(甲午)시
    const calResult = calendarEngine.execute({
      birth_date: '1988-06-15',
      birth_time: '13:30',
    });
    expect(calResult.data.is_dst_applied).toBe(true);
    expect(calResult.data.hour_boundary.effectiveTimeFormatted).toBe('12:30');
    expect(calResult.data.hour_boundary.branch).toBe('오');

    const pillarResult = pillarEngine.execute(calResult.data);
    expect(pillarResult.data.four_pillars.hour?.name).toBe('갑오');
    expect(pillarResult.data.four_pillars.hour?.branch).toBe('오');
    expect(pillarResult.data.four_pillars.hour?.stem).toBe('갑');
    expect(pillarResult.data.summary_string).toBe('무진년 무오월 신축일 갑오시');
  });

  it('Phase 2 수정 검증 2: M03 시진 Candidate B 방향이 경계 직후(11:05) 직전 시진인 사(巳)시로 정상 도출되어야 한다', () => {
    // 1990-05-15 11:05 출생 -> 11:00 경계 직후 5분
    // Candidate A: 오시 (임오시)
    // Candidate B: 사시 (신사시)
    const calResult = calendarEngine.execute({
      birth_date: '1990-05-15',
      birth_time: '11:05',
    });
    expect(calResult.data.hour_boundary.isNearBoundary).toBe(true);
    expect(calResult.data.hour_boundary.boundaryDirection).toBe('after');
    expect(calResult.data.hour_boundary.boundaryDiffMinutes).toBe(5);

    const pillarResult = pillarEngine.execute(calResult.data);
    const boundary = pillarResult.data.boundary_analysis;
    expect(boundary.has_boundary_issue).toBe(true);

    const candA = boundary.candidates.find(c => c.candidate_id === 'A');
    const candB = boundary.candidates.find(c => c.candidate_id === 'B');

    expect(candA).toBeDefined();
    expect(candB).toBeDefined();
    expect(candA?.pillars.hour?.branch).toBe('오');
    expect(candA?.pillars.hour?.name).toBe('임오');
    expect(candB?.pillars.hour?.branch).toBe('사');
    expect(candB?.pillars.hour?.name).toBe('신사');
  });

  it('Phase 2 수정 검증 3: M06 입춘 24분 전 출생자 절기 Candidate A(갑술년 정축월)와 B(을해년 무인월)가 생성되어야 한다', () => {
    // 1995-02-04 16:00 출생 (KASI 입춘: 1995-02-04 16:24, 24분 전)
    // Candidate A: 기준 절기 (입춘 전 -> 1994년 갑술년, 정축월, 병인일, 병신시)
    // Candidate B: 대안 절기 (입춘 후 -> 1995년 을해년, 무인월, 병인일, 병신시)
    const calResult = calendarEngine.execute({
      birth_date: '1995-02-04',
      birth_time: '16:00',
    });
    expect(calResult.data.solar_term.isNearSolarTermBoundary).toBe(true);
    expect(calResult.data.year_boundary.isNearBoundary).toBe(true);
    expect(calResult.data.year_boundary.boundaryDiffMinutes).toBe(24);

    const pillarResult = pillarEngine.execute(calResult.data);
    const boundary = pillarResult.data.boundary_analysis;
    expect(boundary.has_boundary_issue).toBe(true);
    expect(boundary.candidates.length).toBe(2);

    const candA = boundary.candidates.find(c => c.candidate_id === 'A');
    const candB = boundary.candidates.find(c => c.candidate_id === 'B');

    expect(candA).toBeDefined();
    expect(candB).toBeDefined();
    expect(candA?.pillars.year.name).toBe('갑술');
    expect(candA?.pillars.month.name).toBe('정축');
    expect(candB?.pillars.year.name).toBe('을해');
    expect(candB?.pillars.month.name).toBe('무인');
    // 일주와 시주는 동일
    expect(candA?.pillars.day.name).toBe('병인');
    expect(candB?.pillars.day.name).toBe('병인');
    expect(candA?.pillars.hour?.name).toBe('병신');
    expect(candB?.pillars.hour?.name).toBe('병신');
  });

  it('Phase 2 수정 검증 4: 절기 경계와 시진 경계가 동시 발생할 때 최대 4개 조합(A1, A2, B1, B2)이 생성되어야 한다', () => {
    // 1995-02-04 16:55 출생 (입춘 31분 후 AND 17:00 신/유 경계 5분 전)
    const calResult = calendarEngine.execute({
      birth_date: '1995-02-04',
      birth_time: '16:55',
    });
    expect(calResult.data.solar_term.isNearSolarTermBoundary).toBe(true);
    expect(calResult.data.hour_boundary.isNearBoundary).toBe(true);

    const pillarResult = pillarEngine.execute(calResult.data);
    const boundary = pillarResult.data.boundary_analysis;
    expect(boundary.has_boundary_issue).toBe(true);
    expect(boundary.candidates.length).toBe(4);

    const candIds = boundary.candidates.map(c => c.candidate_id);
    expect(candIds).toEqual(['A1', 'A2', 'B1', 'B2']);
  });
});

import { describe, expect, it } from 'vitest';
import { CalendarEngine, CalendarInput } from '../src/modules/calendar/calendar-engine.js';
import { getIpchun, getYearSolarTerms } from '../src/modules/calendar/solar-term-engine.js';

describe('Phase 1: Calendar Engine & Solar Term Engine Tests', () => {
  const calendarEngine = new CalendarEngine();

  it('24절기 계산이 정확한 순서와 각도로 도출되어야 한다', () => {
    const terms2024 = getYearSolarTerms(2024);
    expect(terms2024.length).toBe(24);

    // 입춘은 315도
    const ipchun = terms2024.find(t => t.termName === '입춘');
    expect(ipchun).toBeDefined();
    expect(ipchun?.solarLongitudeDeg).toBe(315);
    // 2024년 입춘은 KASI 공식 기준 2월 4일 17:27
    expect(ipchun?.appliedDateTimeKST).toBe('2024-02-04 17:27:00');
    expect(ipchun?.source).toBe('kasi_official_table');

    // 춘분은 0도
    const chunbun = terms2024.find(t => t.termName === '춘분');
    expect(chunbun?.solarLongitudeDeg).toBe(0);
    expect(chunbun?.kst.month).toBe(3); // 3월
  });

  it('KASI 공식 역서 기준 우선 적용: 1984년 입춘(23:19) 및 1988년 망종(16:47) 공식 시각이 정확히 적용되어야 한다', () => {
    // 1984년 입춘 검증
    const ipchun1984 = getIpchun(1984);
    expect(ipchun1984.source).toBe('kasi_official_table');
    expect(ipchun1984.kasiDateTimeKST).toBe('1984-02-04 23:19');
    expect(ipchun1984.appliedDateTimeKST).toBe('1984-02-04 23:19:00');
    expect(ipchun1984.diffMinutes).toBeDefined();

    // 1988년 망종 검증
    const terms1988 = getYearSolarTerms(1988);
    const mangjong1988 = terms1988.find(t => t.termName === '망종');
    expect(mangjong1988).toBeDefined();
    expect(mangjong1988?.source).toBe('kasi_official_table');
    expect(mangjong1988?.appliedDateTimeKST).toBe('1988-06-05 16:47:00');
  });

  it('절기 시각 ±2시간(120분) 이내 출생 시 연주·월주 경계 민감도를 자동 감지해야 한다', () => {
    // 1995년 입춘 공식 시각: 1995-02-04 16:24
    // 16:00 출생자는 입춘 24분 전이므로 ±2시간 이내 경계 민감도에 해당
    const input: CalendarInput = {
      birth_date: '1995-02-04',
      birth_time: '16:00',
    };
    const res = calendarEngine.execute(input);

    expect(res.data.solar_term.isNearSolarTermBoundary).toBe(true);
    expect(res.data.solar_term.boundaryTermName).toBe('입춘');
    expect(res.data.year_boundary.isNearBoundary).toBe(true);
    expect(res.data.year_boundary.boundaryDiffMinutes).toBeLessThanOrEqual(120);
    expect(res.data.calendar_status).toBe('near_term_boundary');
    expect(res.notes?.some(n => n.includes('경계 민감도 정밀 검토 대상'))).toBe(true);
  });

  it('1988년 서울올림픽 서머타임(DST) 적용 기간을 정확히 감지해야 한다', () => {
    // 1988년 서머타임: 1988-05-08 02:00 ~ 1988-10-09 03:00
    const input: CalendarInput = {
      birth_date: '1988-06-15',
      birth_time: '14:30',
      region: '서울',
    };
    const result = calendarEngine.execute(input);
    expect(result.metadata.status).toBe('active');
    expect(result.data.is_dst_applied).toBe(true);
    expect(result.data.dst_offset_minutes).toBe(60);
    expect(result.data.calendar_status).toBe('dst_applied');
  });

  it('출생시간 미상(hour=null) 입력 시 calendar_status=missing_hour로 처리해야 한다', () => {
    const input: CalendarInput = {
      birth_date: '1995-10-25',
      birth_time: null,
    };
    const result = calendarEngine.execute(input);

    expect(result.metadata.status).toBe('active');
    expect(result.data.hour_boundary.branch).toBeNull();
    expect(result.data.calendar_status).toBe('missing_hour');
    expect(result.metadata.confidence).toBeLessThan(100);
  });

  it('시진 경계시각(예: 00:55, 1시 경계 5분 전)에서 near_boundary 상태를 감지해야 한다', () => {
    const input: CalendarInput = {
      birth_date: '2000-05-20',
      birth_time: '00:55',
    };
    const result = calendarEngine.execute(input);

    expect(result.data.hour_boundary.isNearBoundary).toBe(true);
    expect(result.data.hour_boundary.boundaryDiffMinutes).toBe(5);
    expect(result.data.calendar_status).toBe('near_boundary');
  });

  it('입력 데이터가 유효하지 않을 경우 오류를 삼키지 않고 degraded status로 안전하게 fallback을 반환해야 한다', () => {
    const input = {
      birth_date: 'invalid-date',
      birth_time: '99:99',
    } as any;
    const result = calendarEngine.execute(input);

    expect(result.metadata.status).toBe('degraded');
    expect(result.metadata.confidence).toBe(0);
    expect(result.notes?.[0]).toContain('입력 유효성 검사 실패');
  });
});

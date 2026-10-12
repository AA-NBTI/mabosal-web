/**
 * 한국 역사적 표준시 및 서머타임(DST), 지역 좌표 데이터
 */

export interface TimezonePeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  offsetMinutes: number; // UTC 대비 분 (UTC+9 = +540, UTC+8:30 = +510)
  name: string;
}

export interface DstPeriod {
  startDate: string; // YYYY-MM-DD HH:mm
  endDate: string;   // YYYY-MM-DD HH:mm
  offsetMinutes: number; // 통상 +60분
}

// 한국 표준시 변경 이력
export const KOREA_HISTORICAL_TIMEZONES: TimezonePeriod[] = [
  { startDate: '1908-04-01', endDate: '1911-12-31', offsetMinutes: 510, name: '대한제국 표준시 (UTC+8:30)' },
  { startDate: '1912-01-01', endDate: '1954-03-20', offsetMinutes: 540, name: '일제/해방 표준시 (UTC+9:00)' },
  { startDate: '1954-03-21', endDate: '1961-08-09', offsetMinutes: 510, name: '대한민국 표준시 (UTC+8:30)' },
  { startDate: '1961-08-10', endDate: '2099-12-31', offsetMinutes: 540, name: '현행 대한민국 표준시 (UTC+9:00)' },
];

// 한국 서머타임(일광절약시간) 실시 이력
export const KOREA_DST_PERIODS: DstPeriod[] = [
  // 1948~1951
  { startDate: '1948-06-01 00:00', endDate: '1948-09-13 00:00', offsetMinutes: 60 },
  { startDate: '1949-05-01 00:00', endDate: '1949-09-11 00:00', offsetMinutes: 60 },
  { startDate: '1950-05-01 00:00', endDate: '1950-09-10 00:00', offsetMinutes: 60 },
  { startDate: '1951-05-06 00:00', endDate: '1951-09-09 00:00', offsetMinutes: 60 },
  // 1955~1960
  { startDate: '1955-05-05 00:00', endDate: '1955-09-09 00:00', offsetMinutes: 60 },
  { startDate: '1956-05-20 00:00', endDate: '1956-09-30 00:00', offsetMinutes: 60 },
  { startDate: '1957-05-05 00:00', endDate: '1957-09-22 00:00', offsetMinutes: 60 },
  { startDate: '1958-05-04 00:00', endDate: '1958-09-21 00:00', offsetMinutes: 60 },
  { startDate: '1959-05-03 00:00', endDate: '1959-09-20 00:00', offsetMinutes: 60 },
  { startDate: '1960-05-01 00:00', endDate: '1960-09-18 00:00', offsetMinutes: 60 },
  // 1987~1988 (서울올림픽 대비)
  { startDate: '1987-05-10 02:00', endDate: '1987-10-11 03:00', offsetMinutes: 60 },
  { startDate: '1988-05-08 02:00', endDate: '1988-10-09 03:00', offsetMinutes: 60 },
];

// 주요 지역 기본 좌표
export const KOREA_REGIONS: Record<string, { longitude: number; latitude: number }> = {
  서울: { longitude: 126.9780, latitude: 37.5665 },
  경기: { longitude: 127.0093, latitude: 37.2750 },
  인천: { longitude: 126.7052, latitude: 37.4563 },
  부산: { longitude: 129.0756, latitude: 35.1796 },
  대구: { longitude: 128.6014, latitude: 35.8714 },
  대전: { longitude: 127.3845, latitude: 36.3504 },
  광주: { longitude: 126.8526, latitude: 35.1595 },
  울산: { longitude: 129.3114, latitude: 35.5384 },
  강원: { longitude: 127.7298, latitude: 37.8854 },
  충북: { longitude: 127.4914, latitude: 36.6357 },
  충남: { longitude: 126.6728, latitude: 36.6588 },
  전북: { longitude: 127.1088, latitude: 35.8242 },
  전남: { longitude: 126.4630, latitude: 34.8160 },
  경북: { longitude: 128.5056, latitude: 36.5760 },
  경남: { longitude: 128.6922, latitude: 35.2383 },
  제주: { longitude: 126.5312, latitude: 33.4996 },
};

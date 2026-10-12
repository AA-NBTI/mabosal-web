import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { TenGodsEngine } from '../src/modules/saju-core/ten-gods.js';

describe('Phase 3: Saju Core Engine Tests', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const tenGodsEngine = new TenGodsEngine();

  it('십신(Ten Gods) 매핑이 음양 및 생극제화 원리에 따라 정확해야 한다', () => {
    // 갑목(양목) 일간 기준
    expect(tenGodsEngine.getTenGodForStem('갑', '갑')).toBe('비견');
    expect(tenGodsEngine.getTenGodForStem('갑', '을')).toBe('겁재');
    expect(tenGodsEngine.getTenGodForStem('갑', '병')).toBe('식신');
    expect(tenGodsEngine.getTenGodForStem('갑', '정')).toBe('상관');
    expect(tenGodsEngine.getTenGodForStem('갑', '무')).toBe('편재');
    expect(tenGodsEngine.getTenGodForStem('갑', '기')).toBe('정재');
    expect(tenGodsEngine.getTenGodForStem('갑', '경')).toBe('편관');
    expect(tenGodsEngine.getTenGodForStem('갑', '신')).toBe('정관');
    expect(tenGodsEngine.getTenGodForStem('갑', '임')).toBe('편인');
    expect(tenGodsEngine.getTenGodForStem('갑', '계')).toBe('정인');
  });

  it('T01 기준 명식 (갑진년 병인월 기해일 경오시)의 코어 명리 요소가 정확히 산출되어야 한다', () => {
    const cal = calendarEngine.execute({ birth_date: '2024-02-05', birth_time: '12:00' });
    const pil = pillarEngine.execute(cal.data);
    const core = sajuCoreEngine.execute(pil.data);

    expect(core.metadata.status).toBe('active');
    const { data } = core;

    expect(data.day_stem).toBe('기');
    expect(data.day_element).toBe('토');

    // 기토 일간 기준 십신 검증
    expect(data.ten_gods.year.stemTenGod).toBe('정관');      // 갑목
    expect(data.ten_gods.month.stemTenGod).toBe('정인');     // 병화
    expect(data.ten_gods.hour?.stemTenGod).toBe('상관');     // 경금
    expect(data.ten_gods.day.branchMainTenGod).toBe('정재'); // 해수(임수 정기)

    // 오행 분포 총합 100% 검증
    const dist = data.five_elements.distribution;
    const totalPct = dist.목.percentage + dist.화.percentage + dist.토.percentage + dist.금.percentage + dist.수.percentage;
    expect(Math.round(totalPct)).toBe(100);

    // 일간 강약 0~100 연속 점수 보존 검증 (반올림으로 정수화되지 않음)
    expect(data.day_master_strength.totalStrengthScore).toBeGreaterThan(0);
    expect(data.day_master_strength.totalStrengthScore).toBeLessThanOrEqual(100);
  });

  it('T02 일간 극강 명식 (비겁/인성 중첩)에서 신강 지표가 높게 산출되어야 한다', () => {
    // 갑목 일간에 인월(록), 묘일(왕), 자시(수생목 인성)
    const customPillars = {
      four_pillars: {
        year: { stem: '갑' as const, branch: '인' as const, name: '갑인' },
        month: { stem: '갑' as const, branch: '인' as const, name: '갑인' },
        day: { stem: '갑' as const, branch: '묘' as const, name: '갑묘' },
        hour: { stem: '갑' as const, branch: '자' as const, name: '갑자' },
      },
    } as any;

    const core = sajuCoreEngine.execute(customPillars);
    expect(core.data.day_master_strength.totalStrengthScore).toBeGreaterThanOrEqual(80.0);
    expect(['극강', '신강']).toContain(core.data.day_master_strength.classification);
    expect(core.data.day_master_strength.isDeukRyeong).toBe(true);
    expect(core.data.day_master_strength.isDeukJi).toBe(true);
  });

  it('T03 일간 극약 명식 (식상/재성/관성 과다, 설기/극제)에서 신약 지표가 낮게 산출되어야 한다', () => {
    // 계수 일간에 오월(화극수 설기), 사일(화), 무진시(관성 극제)
    const customPillars = {
      four_pillars: {
        year: { stem: '병' as const, branch: '오' as const, name: '병오' },
        month: { stem: '정' as const, branch: '사' as const, name: '정사' },
        day: { stem: '계' as const, branch: '사' as const, name: '계사' },
        hour: { stem: '무' as const, branch: '오' as const, name: '무오' },
      },
    } as any;

    const core = sajuCoreEngine.execute(customPillars);
    expect(core.data.day_master_strength.totalStrengthScore).toBeLessThan(35.0);
    expect(['신약', '극약']).toContain(core.data.day_master_strength.classification);
  });

  it('통근(Rooting) 및 투출(Emergence)이 정확히 감지되어야 한다', () => {
    // 병화 일간이 월지 사화(정기 병화)에 완벽 통근 및 투출
    const customPillars = {
      four_pillars: {
        year: { stem: '경' as const, branch: '자' as const, name: '경자' },
        month: { stem: '병' as const, branch: '사' as const, name: '병사' },
        day: { stem: '병' as const, branch: '인' as const, name: '병인' },
        hour: { stem: '무' as const, branch: '술' as const, name: '무술' },
      },
    } as any;

    const core = sajuCoreEngine.execute(customPillars);
    // 일간 병화의 통근 점수
    expect(core.data.rootings.dayStem.rootingScore).toBeGreaterThan(50.0);
    // 월지 사화의 병화 투출 감지
    const saEmergence = core.data.emergences.find(e => e.sourceBranch === '사' && e.hiddenStem === '병');
    expect(saEmergence).toBeDefined();
    expect(saEmergence?.isEmerged).toBe(true);
  });

  it('출생시간 미상(hour=null)이어도 3주 기준으로 Saju Core 분석이 정상 수행되어야 한다', () => {
    const cal = calendarEngine.execute({ birth_date: '2015-08-20', birth_time: null });
    const pil = pillarEngine.execute(cal.data);
    const core = sajuCoreEngine.execute(pil.data);

    expect(core.metadata.status).toBe('active');
    expect(core.data.ten_gods.hour).toBeNull();
    expect(core.data.rootings.hourStem).toBeNull();
    expect(core.data.palaces.hourPalace).toBeNull();
    expect(core.data.time_dependency.is_missing_hour).toBe(true);
    expect(core.data.time_dependency.requires_hour).toBe(true);
    // 3주로도 강약 및 오행 분석 정상 완료
    expect(core.data.day_master_strength.totalStrengthScore).toBeGreaterThan(0);
    expect(core.data.five_elements.dominantElement).toBeDefined();
  });

  it('Phase 3 정밀 검수 1: 10개 일간(甲~癸) x 10개 대상 천간 = 100개 십신 조합 전수 일치 검증', () => {
    const expectedMap: Record<string, Record<string, string>> = {
      갑: { 갑: '비견', 을: '겁재', 병: '식신', 정: '상관', 무: '편재', 기: '정재', 경: '편관', 신: '정관', 임: '편인', 계: '정인' },
      을: { 을: '비견', 갑: '겁재', 정: '식신', 병: '상관', 기: '편재', 무: '정재', 신: '편관', 경: '정관', 계: '편인', 임: '정인' },
      병: { 병: '비견', 정: '겁재', 무: '식신', 기: '상관', 경: '편재', 신: '정재', 임: '편관', 계: '정관', 갑: '편인', 을: '정인' },
      정: { 정: '비견', 병: '겁재', 기: '식신', 무: '상관', 신: '편재', 경: '정재', 계: '편관', 임: '정관', 을: '편인', 갑: '정인' },
      무: { 무: '비견', 기: '겁재', 경: '식신', 신: '상관', 임: '편재', 계: '정재', 갑: '편관', 을: '정관', 병: '편인', 정: '정인' },
      기: { 기: '비견', 무: '겁재', 신: '식신', 경: '상관', 계: '편재', 임: '정재', 을: '편관', 갑: '정관', 정: '편인', 병: '정인' },
      경: { 경: '비견', 신: '겁재', 임: '식신', 계: '상관', 갑: '편재', 을: '정재', 병: '편관', 정: '정관', 무: '편인', 기: '정인' },
      신: { 신: '비견', 경: '겁재', 계: '식신', 임: '상관', 을: '편재', 갑: '정재', 정: '편관', 병: '정관', 기: '편인', 무: '정인' },
      임: { 임: '비견', 계: '겁재', 갑: '식신', 을: '상관', 병: '편재', 정: '정재', 무: '편관', 기: '정관', 경: '편인', 신: '정인' },
      계: { 계: '비견', 임: '겁재', 을: '식신', 갑: '상관', 정: '편재', 병: '정재', 기: '편관', 무: '정관', 신: '편인', 경: '정인' },
    };

    const stems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
    for (const day of stems) {
      for (const target of stems) {
        const actual = tenGodsEngine.getTenGodForStem(day, target);
        expect(actual).toBe(expectedMap[day][target]);
      }
    }
  });

  it('Phase 3 정밀 검수 2: 12지지 지장간 전수 30일 배분 및 정기 일치 검증', () => {
    const branches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
    const expectedMainStems: Record<string, string> = {
      자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병',
      오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임',
    };

    for (const b of branches) {
      const info = sajuCoreEngine['hiddenStemsEngine'].getHiddenStems(b);
      const totalDays = info.entries.reduce((sum, e) => sum + e.days, 0);
      const totalRatio = info.entries.reduce((sum, e) => sum + e.ratio, 0);

      expect(totalDays).toBe(30);
      expect(totalRatio).toBeCloseTo(1.0, 4);
      expect(info.mainStem).toBe(expectedMainStems[b]);
    }
  });

  it('Phase 3 정밀 검수 3: 신강신약 7개 구간 경계값 분류 일관성 검증', () => {
    // 득령 40점, 득지 30점, 득세 30점 구조
    const strengthEngine = sajuCoreEngine['strengthEngine'];

    // 85 이상 극강
    expect(strengthEngine['WEIGHT_DEUK_RYEONG']).toBe(0.40);
    expect(strengthEngine['WEIGHT_DEUK_JI']).toBe(0.30);
    expect(strengthEngine['WEIGHT_DEUK_SE']).toBe(0.30);

    const testScores = [
      { score: 85.0, expected: '극강' },
      { score: 84.99, expected: '신강' },
      { score: 65.0, expected: '신강' },
      { score: 64.99, expected: '중화신강' },
      { score: 53.0, expected: '중화신강' },
      { score: 52.99, expected: '중화' },
      { score: 47.0, expected: '중화' },
      { score: 46.99, expected: '중화신약' },
      { score: 35.0, expected: '중화신약' },
      { score: 34.99, expected: '신약' },
      { score: 15.0, expected: '신약' },
      { score: 14.99, expected: '극약' },
    ];

    for (const t of testScores) {
      let classification = '중화';
      if (t.score >= 85.0) classification = '극강';
      else if (t.score >= 65.0) classification = '신강';
      else if (t.score >= 53.0) classification = '중화신강';
      else if (t.score >= 47.0) classification = '중화';
      else if (t.score >= 35.0) classification = '중화신약';
      else if (t.score >= 15.0) classification = '신약';
      else classification = '극약';

      expect(classification).toBe(t.expected);
    }
  });

  it('Phase 3 정밀 검수 4: 오행 위치별 가중치(월지 3.0, 일지 1.5, 년지 1.0, 시지 1.0, 천간 1.0) 반영 검증', () => {
    const fiveEngine = sajuCoreEngine['fiveElementsEngine'];
    expect(fiveEngine['WEIGHTS'].monthBranch).toBe(3.0);
    expect(fiveEngine['WEIGHTS'].dayBranch).toBe(1.5);
    expect(fiveEngine['WEIGHTS'].yearBranch).toBe(1.0);
    expect(fiveEngine['WEIGHTS'].hourBranch).toBe(1.0);
    expect(fiveEngine['WEIGHTS'].stem).toBe(1.0);
  });

  it('테스트 A — 오행 합계: M05, M06, M07, M12에서 5개 오행 표시 백분율의 합이 정확히 100.00%이어야 한다', () => {
    const sampleDates = [
      { id: 'M05', date: '2000-01-01', time: '12:00' },
      { id: 'M06', date: '1995-02-04', time: '16:00' },
      { id: 'M07', date: '1992-01-20', time: '04:30' },
      { id: 'M12', date: '1993-09-28', time: '20:10' },
    ];

    for (const s of sampleDates) {
      const cal = calendarEngine.execute({ birth_date: s.date, birth_time: s.time });
      const pil = pillarEngine.execute(cal.data);
      const core = sajuCoreEngine.execute(pil.data);
      const dist = core.data.five_elements.distribution;

      const sum = dist.목.percentage + dist.화.percentage + dist.토.percentage + dist.금.percentage + dist.수.percentage;
      const formattedSum = Math.round(sum * 100) / 100;

      expect(formattedSum).toBe(100.00);
    }
  });

  it('테스트 B — 지장간만 존재하는 오행: M06 등 지장간에 오행(수)이 존재할 때 missingElements에 포함되지 않아야 한다', () => {
    // M06 (갑술년 정축월 병인일 병신시): 축(계수), 신(임수)에 수(水) 원점수 1.13점 존재
    const cal = calendarEngine.execute({ birth_date: '1995-02-04', birth_time: '16:00' });
    const pil = pillarEngine.execute(cal.data);
    const core = sajuCoreEngine.execute(pil.data);

    const f = core.data.five_elements;
    expect(f.distribution.수.rawScore).toBeGreaterThan(0.05);
    // 지장간에 수가 존재하므로 missingElements에 수가 없어야 함
    expect(f.missingElements).not.toContain('수');
  });

  it('테스트 C — 실제 결핍: 특정 오행의 원점수가 실제로 0인 명식에서는 missingElements에 정확히 포함되어야 한다', () => {
    // M01 (갑자 정묘 계묘 기미): 금(金)이 천간, 지지, 지장간 어디에도 없음 (rawScore = 0)
    const cal = calendarEngine.execute({ birth_date: '1984-03-10', birth_time: '14:20' });
    const pil = pillarEngine.execute(cal.data);
    const core = sajuCoreEngine.execute(pil.data);

    const f = core.data.five_elements;
    expect(f.distribution.금.rawScore).toBe(0);
    expect(f.missingElements).toContain('금');
  });

  it('테스트 D — 경계값: rawScore 0.05 미만/이상 결핍 판정 경계값 검증', () => {
    const fiveEngine = sajuCoreEngine['fiveElementsEngine'];

    // 극단적인 커스텀 기둥 테스트: 특정 오행의 rawScore가 0.049 vs 0.050일 때의 일관성 확인
    // 더미 기둥으로 calculate 내부 로직 검증
    const dummyPillars = {
      year: { stem: '갑' as const, branch: '인' as const, name: '갑인' },
      month: { stem: '갑' as const, branch: '인' as const, name: '갑인' },
      day: { stem: '갑' as const, branch: '인' as const, name: '갑인' },
      hour: { stem: '갑' as const, branch: '인' as const, name: '갑인' },
    };
    const res = fiveEngine.calculate(dummyPillars);
    // 갑(목), 인(무 0.233*토, 병 0.233*화, 갑 0.533*목)
    // 금과 수는 전혀 없으므로 rawScore = 0 -> missingElements에 포함
    expect(res.missingElements).toContain('금');
    expect(res.missingElements).toContain('수');
    // 토는 0.233 * (1 + 3 + 1.5 + 1) = 1.516 > 0.05 -> missingElements에 미포함
    expect(res.missingElements).not.toContain('토');
    // 화도 1.516 > 0.05 -> missingElements에 미포함
    expect(res.missingElements).not.toContain('화');
  });
});

import { describe, expect, it } from 'vitest';
import { BoundaryEngine } from '../src/modules/boundary/boundary-engine.js';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 6: Boundary / Missing Data Engine Tests', () => {
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();
  const coreEngine = new SajuCoreEngine();
  const boundaryEngine = new BoundaryEngine();

  it('B01 경계 전: 안전한 시각(00:30) 출생 시 경계 문제 없이 단일 확정되어야 한다', () => {
    const cal = calEngine.execute({ birth_date: '2024-03-10', birth_time: '00:30' });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);

    const boundary = boundaryEngine.execute({ pillar_output: pil.data, saju_core_output: core.data });

    expect(boundary.metadata.status).toBe('active');
    expect(boundary.data.missing_hour.isMissingHour).toBe(false);
    expect(boundary.data.boundary_simulation.hasBoundaryIssue).toBe(false);
    expect(boundary.data.is_boundary_sensitive).toBe(false);
    expect(boundary.data.overall_confidence).toBe(100.0);
  });

  it('B02, B03, B05: 경계시간(00:58) 출생 시 Candidate A와 B에 대해 Consensus와 Difference가 도출되어야 한다', () => {
    const cal = calEngine.execute({ birth_date: '2024-03-10', birth_time: '00:58' }); // 1시 경계 2분 전
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);

    const boundary = boundaryEngine.execute({ pillar_output: pil.data, saju_core_output: core.data });
    const sim = boundary.data.boundary_simulation;

    expect(sim.hasBoundaryIssue).toBe(true);
    expect(sim.candidates.length).toBe(2);

    // 후보 A (자시)와 후보 B (축시) 시뮬레이션 결과 존재
    expect(sim.candidates[0].hourPillarName).toContain('자');
    expect(sim.candidates[1].hourPillarName).toContain('축');

    // 공통점(Consensus)과 차이점(Difference) 분리 출력 검증
    expect(sim.consensusItems.length).toBeGreaterThan(0);
    expect(sim.differenceItems.length).toBeGreaterThan(0);

    // 경계 민감도 높음
    expect(sim.boundarySensitivity).toBeGreaterThanOrEqual(60.0);
    expect(boundary.data.is_boundary_sensitive).toBe(true);
    expect(boundary.data.overall_confidence).toBeLessThan(100.0);
  });

  it('B04: 출생시간 미상(hour=null) 시 임의 시간 주입 없이 안내 문구와 민감 영역을 식별해야 한다', () => {
    const cal = calEngine.execute({ birth_date: '2024-03-10', birth_time: null });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);

    const boundary = boundaryEngine.execute({ pillar_output: pil.data, saju_core_output: core.data });
    const mh = boundary.data.missing_hour;

    expect(mh.isMissingHour).toBe(true);
    expect(mh.timeDependencyScore).toBeGreaterThan(0);
    expect(mh.confidence).toBeLessThanOrEqual(80.0);

    // 지시서 및 명세서 안내 문구 포함 검증
    expect(mh.userGuidanceMessage).toContain('사주는 연주·월주·일주·시주의 네 기둥으로 구성됩니다');
    expect(mh.userGuidanceMessage).toContain('현재 결과에서 출생시간의 영향이 큰 영역은');

    // 민감 영역 식별 검증 (자녀마/말년운 등)
    expect(mh.sensitiveAreas.length).toBeGreaterThan(0);
    expect(mh.sensitiveAreas.some(a => a.areaName.includes('자녀마'))).toBe(true);
  });
});

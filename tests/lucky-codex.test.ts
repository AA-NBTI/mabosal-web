import { describe, it, expect } from 'vitest';
import { calculateLuckyCodex, getDailyLuckyCodex } from '../src/modules/prescription/lucky-codex.js';

describe('Lucky Codex Module (행운 처방 코드 모듈)', () => {
  it('오행별 하도·낙서 수비학 수가 정확히 매핑된다', () => {
    const wood = calculateLuckyCodex('목');
    expect(wood.luckyNumbers).toBe('3 과 8');
    expect(wood.primaryNumber).toBe(3);
    expect(wood.secondaryNumber).toBe(8);
    expect(wood.luckyDirection.name).toContain('동방');

    const fire = calculateLuckyCodex('화');
    expect(fire.luckyNumbers).toBe('2 와 7');
    expect(fire.primaryNumber).toBe(2);
    expect(fire.secondaryNumber).toBe(7);
    expect(fire.luckyDirection.name).toContain('남방');

    const earth = calculateLuckyCodex('토');
    expect(earth.luckyNumbers).toBe('5 와 10');
    expect(earth.primaryNumber).toBe(5);
    expect(earth.secondaryNumber).toBe(10);
    expect(earth.luckyDirection.name).toContain('동남방');

    const metal = calculateLuckyCodex('금');
    expect(metal.luckyNumbers).toBe('4 와 9');
    expect(metal.primaryNumber).toBe(4);
    expect(metal.secondaryNumber).toBe(9);
    expect(metal.luckyDirection.name).toContain('서방');

    const water = calculateLuckyCodex('수');
    expect(water.luckyNumbers).toBe('1 과 6');
    expect(water.primaryNumber).toBe(1);
    expect(water.secondaryNumber).toBe(6);
    expect(water.luckyDirection.name).toContain('북방');
  });

  it('복합 문자열(용신/부족 오행) 입력 시 정확한 오행을 파싱한다', () => {
    const res1 = calculateLuckyCodex('수(水) / 금(金)');
    expect(res1.targetElement).toBe('수');
    expect(res1.luckyColor.hex).toBe('#38bdf8');

    const res2 = calculateLuckyCodex('금(金)');
    expect(res2.targetElement).toBe('금');
    expect(res2.luckyColor.hex).toBe('#bec6dd');
  });

  it('getDailyLuckyCodex가 일진과 용신을 반영하여 안정적으로 산출된다', () => {
    const codexWithYongshin = getDailyLuckyCodex('목');
    expect(codexWithYongshin.targetElement).toBe('목');
    expect(codexWithYongshin.wiseQuote.length).toBeGreaterThan(10);

    const codexWithBranch = getDailyLuckyCodex(undefined, '자');
    expect(codexWithBranch.targetElement).toBe('금'); // 자수(水)를 생하는 금(金)
    expect(codexWithBranch.luckyNumbers).toBe('4 와 9');
  });
});

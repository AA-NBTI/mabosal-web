import { describe, expect, it } from 'vitest';
import { FourPillars, Pillar } from '../src/core/types.js';
import { DaewoonEngine } from '../src/modules/luck/daewoon-engine.js';
import { LuckActivationEngine } from '../src/modules/luck/luck-activation-engine.js';
import { LuckEngine, LuckInput } from '../src/modules/luck/luck-engine.js';

describe('Phase 5: Luck Engine (운 활성화 및 대운/세운/월운/일운) Tests', () => {
  const luckEngine = new LuckEngine();
  const daewoonEngine = new DaewoonEngine();
  const activationEngine = new LuckActivationEngine();

  it('대운 순행/역행이 양남음녀, 음남양녀 원칙에 따라 정확해야 한다', () => {
    // 1. 갑목(양간) 남성 -> 순행
    const resMaleYang = daewoonEngine.calculate('갑', { stem: '병', branch: '인', name: '병인' }, new Date('2024-02-10'), 2024, 'male');
    expect(resMaleYang.isForward).toBe(true);

    // 2. 갑목(양간) 여성 -> 역행
    const resFemaleYang = daewoonEngine.calculate('갑', { stem: '병', branch: '인', name: '병인' }, new Date('2024-02-10'), 2024, 'female');
    expect(resFemaleYang.isForward).toBe(false);

    // 3. 을목(음간) 남성 -> 역행
    const resMaleYin = daewoonEngine.calculate('을', { stem: '무', branch: '인', name: '무인' }, new Date('2025-02-10'), 2025, 'male');
    expect(resMaleYin.isForward).toBe(false);

    // 4. 을목(음간) 여성 -> 순행
    const resFemaleYin = daewoonEngine.calculate('을', { stem: '무', branch: '인', name: '무인' }, new Date('2025-02-10'), 2025, 'female');
    expect(resFemaleYin.isForward).toBe(true);
  });

  it('L01, L02, L03: 대운·세운·월운 재성 활성화 시 활성화 점수가 상승해야 한다', () => {
    // 갑목 일간 (재성은 무기토, 진술축미)
    const pillars: FourPillars = {
      year: { stem: '갑', branch: '진', name: '갑진' },
      month: { stem: '병', branch: '인', name: '병인' },
      day: { stem: '갑', branch: '자', name: '갑자' },
      hour: { stem: '갑', branch: '술', name: '갑술' },
    };

    const input: LuckInput = {
      four_pillars: pillars,
      birth_date_utc: new Date(Date.UTC(2024, 1, 10)),
      birth_year: 2024,
      gender: 'male',
      target_date: '2028-05-15', // 2028 무신년 (무토 편재 세운)
      target_theme: '재성',
    };

    const result = luckEngine.execute(input);
    expect(result.metadata.status).toBe('active');
    // 세운(무신년 무토 편재) 활성화 검증
    expect(result.data.activation.sewoon.rawActivationScore).toBeGreaterThanOrEqual(85.0);
    // 기본(50.0) 대비 세운 재성 활성화로 종합 활성화 점수 상승(58.5) 검증
    expect(result.data.activation.totalActivationScore).toBeGreaterThan(55.0);
  });

  it('L05 vs L06: 대운·세운 같은 방향(중첩) vs 반대 방향(상쇄) 보정이 적용되어야 한다', () => {
    const pillars: FourPillars = {
      year: { stem: '갑', branch: '자', name: '갑자' },
      month: { stem: '병', branch: '인', name: '병인' },
      day: { stem: '갑', branch: '자', name: '갑자' },
      hour: { stem: '갑', branch: '자', name: '갑자' },
    };

    // Case 1 (L05): 대운과 세운이 모두 재성(토) 계열 -> 중첩 보너스
    const daewoonPillar: Pillar = { stem: '무', branch: '진', name: '무진' }; // 편재
    const sewoonPillar: Pillar = { stem: '기', branch: '축', name: '기축' };  // 정재
    const wolwoonPillar: Pillar = { stem: '경', branch: '인', name: '경인' };
    const ilwoonPillar: Pillar = { stem: '임', branch: '신', name: '임신' };

    const resOverlap = activationEngine.evaluate(
      pillars, daewoonPillar, sewoonPillar, wolwoonPillar, ilwoonPillar, '2025-05-01'
    );
    expect(resOverlap.overlapBonus).toBeGreaterThan(0);
    expect(resOverlap.cancellationPenalty).toBe(0);

    // Case 2 (L06): 대운(비겁) vs 세운(재성) 상극 관계 -> 상쇄 감점
    const daewoonClash: Pillar = { stem: '갑', branch: '인', name: '갑인' }; // 비견
    const sewoonClash: Pillar = { stem: '무', branch: '진', name: '무진' };  // 편재

    const resClash = activationEngine.evaluate(
      pillars, daewoonClash, sewoonClash, wolwoonPillar, ilwoonPillar, '2025-05-01'
    );
    expect(resClash.cancellationPenalty).toBeGreaterThan(0);
  });

  it('L07, L08: 운에서 원국 지지와 충 및 합이 일어날 때 정확히 트리거되어야 한다', () => {
    // 원국에 자수(子水) 존재
    const pillars: FourPillars = {
      year: { stem: '갑', branch: '자', name: '갑자' },
      month: { stem: '병', branch: '인', name: '병인' },
      day: { stem: '갑', branch: '자', name: '갑자' },
      hour: { stem: '갑', branch: '술', name: '갑술' },
    };

    // 대운에 오화(午火 - 자오충), 세운에 축토(丑土 - 자축합)
    const daewoonPillar: Pillar = { stem: '경', branch: '오', name: '경오' }; // 자오충
    const sewoonPillar: Pillar = { stem: '을', branch: '축', name: '을축' };  // 자축합
    const wolwoonPillar: Pillar = { stem: '병', branch: '진', name: '병진' };
    const ilwoonPillar: Pillar = { stem: '무', branch: '오', name: '무오' };   // 자오충

    const result = activationEngine.evaluate(
      pillars, daewoonPillar, sewoonPillar, wolwoonPillar, ilwoonPillar, '2026-06-01'
    );

    // L07 운에서 충 검증
    expect(result.clashTriggerCount).toBeGreaterThan(0);
    // L08 운에서 합 검증
    expect(result.harmonyTriggerCount).toBeGreaterThan(0);
    // L04 일운 충에 의한 단기 변동성 촉발 검증
    expect(result.volatilityTrigger).toBe(true);
  });

  it('Final Intensity 공식 검증: Base Intensity * (0.70 + Activation * 0.30)', () => {
    // base = 80, activation = 50 -> 80 * (0.70 + 0.15) = 80 * 0.85 = 68.0
    const final1 = activationEngine.calculateFinalIntensity(80.0, 50.0);
    expect(final1).toBe(68.0);

    // base = 100, activation = 100 -> 100 * (0.70 + 0.30) = 100.0
    const final2 = activationEngine.calculateFinalIntensity(100.0, 100.0);
    expect(final2).toBe(100.0);

    // base = 80, activation = 0 -> 80 * 0.70 = 56.0
    const final3 = activationEngine.calculateFinalIntensity(80.0, 0.0);
    expect(final3).toBe(56.0);
  });
});

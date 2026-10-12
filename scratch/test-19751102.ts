import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { frontendAdapter } from '../src/frontend/adapter/engine-adapter.js';
import { appState } from '../src/frontend/state/app-state.js';

const cal = new CalendarEngine();
const pil = new PillarEngine();

console.log('--- 1. PillarEngine direct test ---');
const pillars1 = pil.calculatePillars({
  birthDate: '1975-11-02',
  birthTime: '13:30',
  gender: 'female',
});
console.log('Pillars with 13:30:', JSON.stringify(pillars1, null, 2));

console.log('--- 2. analyzeIntegrated test with 19751102 & 13:30 ---');
async function run() {
  try {
    const res = await frontendAdapter.analyzeIntegrated({
      birthInput: {
        calendar_type: 'solar',
        is_leap_month: false,
        birth_year: 1975,
        birth_month: 11,
        birth_day: 2,
        birth_time: '13:30',
        is_time_unknown: false,
        birth_city: 'Seoul',
        gender: 'female',
      },
      troubleText: '테스트 고민입니다.',
      tier: 'free_diagnosis',
    });
    console.log('StandardBirthDate:', res.standardBirthDate);
    console.log('FourPillars:', res.fourPillars);
    console.log('DualResult general_saju:', res.dualResult?.general_saju?.four_pillars);
    const state = appState.getState();
    console.log('State session fact pillars:', state.sessionState?.fact?.four_pillars);
    console.log('State latestProduct pillars:', state.latestProduct?.executedModules?.['CORE_ORIGINAL']?.data?.pillars);
    console.log('State productOutputSet common pillars:', state.productOutputSet?.common?.pillars);
  } catch (e) {
    console.error('Error in analyzeIntegrated:', e);
  }
}
run();

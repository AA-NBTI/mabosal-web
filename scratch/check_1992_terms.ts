import { getYearSolarTerms } from '../src/modules/calendar/solar-term-engine.js';

const terms = getYearSolarTerms(1992);
for (const t of terms) {
  if (['경칩', '춘분', '청명', '곡우'].includes(t.termName)) {
    console.log(`${t.termName}: applied=${t.appliedDateTimeKST}, kstFormatted=${t.kst.formatted}, exactUTC=${t.exactDateTimeUTC.toISOString()}`);
  }
}

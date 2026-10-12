import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { MabosalSessionEngine } from '../src/modules/phase13/mabosal-session.js';
import { frontendAdapter } from '../src/frontend/adapter/engine-adapter.js';

const calEngine = new CalendarEngine();
const pilEngine = new PillarEngine();
const sessEngine = new MabosalSessionEngine();

console.log('=== TEST 1: CalendarEngine with 1975-11-02 13:30 ===');
const cal = calEngine.execute({
  birth_date: '1975-11-02',
  birth_time: '13:30',
  region: 'Seoul',
});
console.log('CalendarOutput:', JSON.stringify(cal.data.hour_boundary, null, 2));
console.log('Calendar Notes:', cal.notes);

console.log('=== TEST 2: PillarEngine execute ===');
const pil = pilEngine.execute(cal.data);
console.log('Pillars:', JSON.stringify(pil.data.four_pillars, null, 2));

console.log('=== TEST 3: MabosalSessionEngine with 1975-11-02 13:30 ===');
const sess = sessEngine.createSession({
  birthDate: '1975-11-02',
  birthTime: '13:30',
  gender: 'female',
  region: 'Seoul',
});
console.log('Session success:', sess.success);
if (!sess.success) {
  console.log('Session error:', sess.userMessage, sess.internalErrorDetail);
} else {
  console.log('Session four_pillars:', sess.data?.fact.four_pillars);
  console.log('Session isMissingHour:', sess.data?.isMissingHour);
}

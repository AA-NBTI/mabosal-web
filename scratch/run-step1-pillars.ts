import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { ProductGenerator } from '../src/modules/product-generator/product-generator.js';

const calendarEngine = new CalendarEngine();
const pillarEngine = new PillarEngine();
const generator = new ProductGenerator();

const input = {
  birth_date: '1998-04-12',
  birth_time: '09:20',
};

console.log('--- 1. CALENDAR ENGINE RESULT ---');
const calResult = calendarEngine.execute(input);
console.log(JSON.stringify(calResult.data, null, 2));

console.log('\n--- 2. PILLAR ENGINE RESULT ---');
const pillarResult = pillarEngine.execute(calResult.data);
console.log(JSON.stringify(pillarResult.data, null, 2));

console.log('\n--- 3. PRODUCT GENERATOR (CORE_ORIGINAL MODULE) RESULT ---');
const prodResult = generator.generateProduct({
  birthDate: '1998-04-12',
  birthTime: '09:20',
  gender: 'female',
  userTrouble: '직장 상사와 반복적인 갈등',
  currentEvent: '직장 상사와 반복적인 갈등',
}, { insightDepth: 1 });

const core = prodResult.executedModules['CORE_ORIGINAL'];
console.log('Core data:');
console.log(JSON.stringify(core?.data, null, 2));

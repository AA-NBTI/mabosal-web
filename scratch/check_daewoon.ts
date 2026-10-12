import { daewoonEngine } from '../src/modules/saju-core/daewoon-engine.js';

const dw = daewoonEngine.calculateDaewoon({
  birthYear: 1992,
  birthMonth: 3,
  birthDay: 15,
  birthHour: 8,
  birthMinute: 30,
  gender: 'male',
  yearStem: '임',
  monthStem: '계',
  monthBranch: '묘',
  currentDate: '2026-10-03',
  currentYear: 2026,
});

console.log('Target Term:', dw.targetTermName, dw.targetTermDateTimeKST);
console.log('Elapsed days:', dw.elapsedDays);
console.log('Offset:', dw.offsetYears, 'years', dw.offsetMonths, 'months', dw.offsetDays, 'days');
console.log('Daewoon Number:', dw.daewoonNumber);
console.log('Pillars:', dw.pillars.slice(0, 5));

import * as fs from 'fs';

const d = JSON.parse(fs.readFileSync('scratch/full_journey_audit_output.json', 'utf8'));

console.log('=== CHECK KEYS ===');
console.log(Object.keys(d));

console.log('=== 1. RAW CALCULATIONS ===');
console.log('Calendar:', JSON.stringify(d.rawCalculations.calendar, null, 2));
console.log('Pillar:', JSON.stringify(d.rawCalculations.pillar, null, 2));
console.log('Core:', JSON.stringify(d.rawCalculations.coreOriginal, null, 2));
console.log('Strength:', JSON.stringify(d.rawCalculations.strength, null, 2));
console.log('Geokguk:', JSON.stringify(d.rawCalculations.geokguk, null, 2));
console.log('Eokbu:', JSON.stringify(d.rawCalculations.eokbu, null, 2));
console.log('Johu:', JSON.stringify(d.rawCalculations.johu, null, 2));
console.log('Relation:', JSON.stringify(d.rawCalculations.relation, null, 2));
console.log('Sinsal:', JSON.stringify(d.rawCalculations.sinsal, null, 2));
console.log('Daewun:', JSON.stringify(d.rawCalculations.daewun, null, 2));
console.log('Seun:', JSON.stringify(d.rawCalculations.seun, null, 2));

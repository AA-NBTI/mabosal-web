import * as fs from 'fs';

const d = JSON.parse(fs.readFileSync('scratch/full_journey_audit_output.json', 'utf8'));
const mods = JSON.parse(fs.readFileSync('scratch/19_modules_detailed.json', 'utf8'));

console.log('=== CORE MODULES DETAILS ===');
['CORE_ORIGINAL', 'TEN_GODS', 'GEOKGUK', 'STRENGTH', 'EOKBU', 'JOHU', 'RELATION', 'SINSAL', 'DAEWUN', 'SEUN', 'MAGA_DIAGNOSIS', 'PRESCRIPTION'].forEach(id => {
  const m = mods.find((x: any) => x.id === id);
  console.log(`\n--- [${id}] ---`);
  console.log('summary:', m?.summary);
  console.log('data:', JSON.stringify(m?.data, null, 2));
});

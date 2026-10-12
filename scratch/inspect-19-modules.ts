import { moduleRegistry } from '../src/modules/modular/module-registry.js';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';

const cal = new CalendarEngine().execute({ birth_date: '1998-04-12', birth_time: '09:20' });
const pillar = new PillarEngine().execute(cal.data);

const modularInput = {
  birthDate: '1998-04-12',
  birthTime: '09:20',
  calendarOutput: cal.data,
  pillarOutput: pillar.data,
  gender: 'female' as const,
  targetYear: 2024,
  userTroubleText: '직장에서 상사와 계속 충돌하고 있습니다. 업무 지시가 자주 바뀌고 공개적으로 질책받는 일이 반복됩니다. 일을 제대로 하고 있다고 생각하지만 인정받지 못하는 느낌입니다. 지금 퇴사하는 것이 맞는지, 아니면 현재 직장에서 버티면서 상황을 바꾸는 것이 맞는지 알고 싶습니다.',
};

const allModuleIds = moduleRegistry.getAllModuleIds();
const outputs = moduleRegistry.executeModules(allModuleIds, modularInput);

const fullDump: any[] = [];

for (const id of allModuleIds) {
  const modDef = moduleRegistry.get(id);
  const out = outputs[id];
  fullDump.push({
    id,
    moduleName: out.moduleName,
    category: modDef?.category,
    confidence: out.confidence ?? 0.85,
    moduleVersion: out.metadata?.moduleVersion ?? modDef?.version ?? '1.0.0',
    ruleVersion: out.metadata?.ruleVersion ?? 'RULE-1.0.0',
    summary: out.explanation?.summary,
    rawMetrics: out.calculation?.rawMetrics,
    data: out.data,
  });
}

import * as fs from 'fs';
fs.writeFileSync('scratch/19_modules_detailed.json', JSON.stringify(fullDump, null, 2), 'utf-8');
console.log('Successfully written scratch/19_modules_detailed.json');

const fs = require('fs');
const path = require('path');

// 1. time-axis-judgment-engine.ts 업데이트: 시점 기준 명확화 및 행동처방 중복 제거
const timeAxisPath = path.resolve('f:/Projects/W-웹개발/MM-mabosal/src/modules/time-axis/time-axis-judgment-engine.ts');
let timeAxisContent = fs.readFileSync(timeAxisPath, 'utf8');

// timeAxisContent에서 decisionTiming이 행동처방을 중복하지 않고 '시기적 성격'에만 집중하도록 수정
timeAxisContent = timeAxisContent.replace(
  /const decisionTiming = \{[\s\S]*?\n    \};/,
  `const decisionTiming = {
      immediateJudgments: [
        '현재 당면한 구간에서는 감정적·충동적인 중대 결단을 내리기보다, 상황의 파동을 객관적으로 관망하는 시기입니다.',
      ],
      waitableFactors: [
        \`기운의 편중이 심한 [\${pressurePeriodStr}] 구간에는 외부의 피드백이나 지침 변동에 대한 스트레스가 과열되기 쉬우므로, 이를 개인의 결함으로 자책하지 않고 시기적 파동으로 흘려보낼 수 있습니다.\`,
      ],
      conditionalCheckpoints: [
        '상황에 대한 감정적 과열이 가라앉고 이성적 분별이 가능한 완화 국면으로 진입했는지 여부를 먼저 확인하십시오.',
      ],
      changeWindow: [
        \`실질적인 환경 전환이나 진로 결단은 기운이 안정적으로 순화되는 [\${reliefPeriodStr}] 이후가 가장 적합합니다.\`,
      ],
    };`
);

fs.writeFileSync(timeAxisPath, timeAxisContent, 'utf8');
console.log('Updated time-axis-judgment-engine.ts');

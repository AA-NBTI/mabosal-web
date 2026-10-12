const fs = require('fs');
const filePath = 'src/modules/product-generator/customer-deliverable-builder.ts';
let content = fs.readFileSync(filePath, 'utf8');

const targetBroken = content.match(/LOVE: '사소한 표현 차이나 서운함이 오해로 번지기 쉽고, 상대방의 반응에 과민해지거나 관계의 지속성에 [^\n]*public buildStandard15Report/);

if (!targetBroken) {
  console.log('Target not found via regex, searching substring...');
  const idx = content.indexOf('사소한 표현 차이나');
  console.log('Index:', idx);
  console.log(content.slice(idx, idx + 100));
} else {
  console.log('Found match:', targetBroken[0]);
  const replacement = `LOVE: '사소한 표현 차이나 서운함이 오해로 번지기 쉽고, 상대방의 반응에 과민해지거나 관계의 지속성에 대한 불안이 나타날 수 있는 흐름입니다. 즉각적인 감정 표현보다 숨고르기와 거리 두기가 필요합니다.',
      MARRIAGE: '가정이나 부부 관계에서 생활 습관이나 가치관 차이로 인한 정서적 거리감이 생기기 쉬우며, 사소한 대화 단절이 냉전으로 이어질 수 있는 흐름입니다. 서로의 주관을 꺾으려 하기보다 명확한 대화 원칙을 세워야 합니다.',
      RELATIONSHIP: '주변 지인이나 친구와의 관계에서 말실수나 오해로 인한 구설이 생기기 쉽고, 신뢰 관계에 균열이 올 수 있는 흐름입니다. 무리한 확장보다 나만의 안전지대를 지키는 것이 유리합니다.',
      MONEY: '현금 흐름의 변동성이 커지고 예기치 못한 지출이 발생할 수 있는 흐름입니다. 공격적인 투자보다 자산 방어와 지출 통제가 최우선입니다.',
      HEALTH: '직무 스트레스와 긴장감으로 인해 신체 피로도가 쉽게 누적되고 수면 리듬이 흔들릴 수 있는 흐름입니다. 무리한 일정을 자제하고 충분한 휴식을 취해야 합니다.',
      GENERAL: '삶의 전반적인 방향성을 재점검하고 내실을 다져야 하는 전환기적 흐름입니다. 조급한 결정을 유보하고 내면의 균형을 찾는 것이 중요합니다.',
    };

    const magaSummary = magaDiagnosis?.punchline || '불필요한 조급함을 내려놓고 차분히 중심을 잡아야 하는 국면입니다.';

    const step3_realWorldManifestation = [
      \`• [현실 경험 양상]: \${domainRealManifestationMap[domain] || domainRealManifestationMap.GENERAL}\`,
      \`• [마·살 조율 가이드]: 사주가 불길한 것이 아니라, \${magaSummary} 감정적인 맞대응을 피하고 안전 거리를 확보하라는 신호입니다.\`,
    ].join('\\n');

    const step4_customerConnect = [
      \`[나의 현실 상황과 연결해보기]\`,
      \`위의 기운 흐름 중 현재 가장 깊게 마주하고 계신 현실 상황이나 고민을 남겨주시면, 사주 원국과 결합된 정밀 인과를 도출합니다.\`,
      \`• 추천 상황: 거래처 대금 및 자금 경색 | 동업자·파트너 갈등 | 직장 내 소통 마찰 | 연애 및 결별 불안\`,
      \`• 직접 입력: 구체적인 상황과 질문을 추가하여 심층 분석으로 확장하세요.\`,
    ].join('\\n');

    const step5_inDepthPreview = [
      \`[심층 분석에서 확장되는 핵심 내용]\`,
      \`• 무료 분석: 기본 명리 구조(일간·격국·강약) | 시간축 흐름 | 현재 주목할 영역\`,
      \`• 심층 분석:\`,
      \`  1) 실제 사건과 명리의 인과 규명 (왜 지금 이런 일이 생겼는가)\`,
      \`  2) 정밀 시기 분석 (언제 가장 힘들고, 언제 풀리는가)\`,
      \`  3) 상황별 대응 수칙 (지금 피해야 할 일과 해야 할 일)\`,
      \`  4) 맞춤형 환경·행동 처방전 및 디지털 처방 카드\`,
    ].join('\\n');

    const fullText = [
      \`### ① 한눈에 보는 핵심\\n\${step1_coreSummary}\`,
      \`### ② 지금 주목할 부분\\n\${step2_attentionPoint}\`,
      \`### ③ 현실에서 나타날 수 있는 모습\\n\${step3_realWorldManifestation}\`,
      \`### ④ 고객 상황 연결 장치\\n\${step4_customerConnect}\`,
      \`### ⑤ 더 깊게 보면 무엇을 알 수 있는가\\n\${step5_inDepthPreview}\`,
    ].join('\\n\\n');

    return {
      step1_coreSummary,
      step2_attentionPoint,
      step3_realWorldManifestation,
      step4_customerConnect,
      step5_inDepthPreview,
      fullText,
    };
  }

  public buildStandard15Report`;
  content = content.replace(targetBroken[0], replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully repaired file!');
}

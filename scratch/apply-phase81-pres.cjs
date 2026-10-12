const fs = require('fs');
const path = require('path');

// 1. prescription-synthesizer.ts 업데이트
const presPath = path.resolve('f:/Projects/W-웹개발/MM-mabosal/src/modules/prescription/prescription-synthesizer.ts');
let presContent = fs.readFileSync(presPath, 'utf8');

// 환경 처방과 상징물 부분 현대화
presContent = presContent.replace(
  /\/\/ 2\. 환경 처방[\s\S]*?\/\/ 3\. 행동 처방/,
  `// 2. 환경 처방 (현대적 멘탈 보호 및 물리적 공간 분리 가이드)
    const environmentRemedy = {
      spaceGuidance: '퇴근 후 직장 스트레스가 사생활로 침투하지 못하도록 업무용 메신저와 기기를 물리적으로 분리하고, 온전한 1인 휴식 공간을 확보하십시오.',
      colorTones: ['차분한 저채도 계열(슬레이트 그레이, 딥 네이비, 웜 그레이)'],
      direction: '외부 자극과 소음이 차단되는 가장 안정적인 실내 방향',
      materials: ['자연 질감의 패브릭', '정돈된 원목', '단정한 서재형 소품'],
      lightingAndAtmosphere: '퇴근 후에는 직접 형광등을 끄고 은은한 간접 조명(따뜻한 색온도)을 사용하여 교감신경의 긴장을 완화하십시오.',
      lifestyleEnvironment: '퇴근 직후 감정적인 뒷담화 모임이나 술자리를 엄격히 피하고, 가벼운 산책이나 샤워로 업무 감정을 씻어내는 루틴을 확립하십시오.',
      activityEnvironment: '퇴근 후 30분 이상 스마트폰을 멀리하고 조용한 서점, 공원 등 정적인 공간에서 마인드 클리어링 시간을 가지십시오.',
    };

    // 3. 행동 처방`
);

presContent = presContent.replace(
  /symbolicRemedies: \[[\s\S]*?\]\s*\},/g,
  `symbolicRemedies: [
        {
          title: '[실무 도구] 업무 지시 및 소통 아카이빙 시트',
          purpose: '상사의 지시 사항과 본인의 수행 내역을 날짜별 팩트로 기록하여 감정 소모를 객관적 증빙으로 전환',
          disclaimer: '객관적인 업무 이력 관리를 돕는 실무 보조 양식입니다.',
        },
        {
          title: '[행동 리마인더] 3대 절대 원칙 데스크 카드',
          purpose: '1. 즉각 답하지 않는다 / 2. 서면으로 확인한다 / 3. 감정과 업무를 분리한다',
          disclaimer: '일상의 침착한 대응을 돕는 심리적 마인드셋 카드입니다.',
        },
      ],
    },`
);

fs.writeFileSync(presPath, presContent, 'utf8');
console.log('Updated prescription-synthesizer.ts');

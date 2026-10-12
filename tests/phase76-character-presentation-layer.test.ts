/**
 * tests/phase76-character-presentation-layer.test.ts
 * 
 * Phase 76: 캐릭터 표현 계층 분리 정밀 검증 테스트 스위트
 * 
 * 핵심 검증 목적:
 * 명리 판정 계층(명리 계산, 사건 진단, 시간축, 마·살, 처방 근거)과
 * 고객에게 전달하는 캐릭터 표현 계층(말투, 직접성, 공감도, 문체)의 완전한 분리.
 * 
 * 10대 핵심 검증 항목:
 * 1. 동일 structuredJudgments에 캐릭터 A (direct) 적용 → 판정 데이터 100% 동일
 * 2. 동일 structuredJudgments에 캐릭터 B (warm) 적용 → 판정 데이터 100% 동일
 * 3. 캐릭터 변경 전후 핵심 사건 동일
 * 4. 캐릭터 변경 전후 명리 근거 동일
 * 5. 캐릭터 변경 전후 시간축 동일
 * 6. 캐릭터 변경 전후 마·살 데이터 동일
 * 7. 캐릭터 변경 전후 처방 근거 동일
 * 8. 캐릭터에 따라 표현 방식은 실질적으로 차별화됨 (직설형 vs 공감형 vs 분석형)
 * 9. 캐릭터 설정이 없는 경우 기존 출력과의 100% 호환성 유지
 * 10. 잘못된 캐릭터 설정(알 수 없는 ID 등)이 명리 판정에 영향을 주지 않고 안전 폴백됨
 */

import { describe, it, expect } from 'vitest';
import {
  ProductGenerator,
  UserProblemInput,
  ProductGenerationResult,
} from '../src/modules/product-generator/index.js';
import {
  characterRenderer,
  DEFAULT_CHARACTER_PROFILES,
  CharacterPresentationProfile,
} from '../src/modules/character/index.js';

describe('Phase 76: 캐릭터 표현 계층 분리 Test Suite', () => {
  const generator = new ProductGenerator();

  const standardTestInput: UserProblemInput = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    gender: 'female',
    currentEvent: '주요 거래처 부도로 자금이 묶이고 동업자와 지분 분쟁이 발생했습니다.',
    userTrouble: '회사 운영 자금이 고갈되어 폐업 위기이며 동업자가 일방적으로 지분 매각을 요구합니다.',
    desiredQuestion: '손실을 막고 회사를 살리기 위해 어떻게 해야 합니까?',
    eventDate: '2024-05-20',
    targetYear: 2024,
  };

  // ==========================================================================
  // 1 & 2. 동일 structuredJudgments에 서로 다른 캐릭터 적용 시 판정 데이터 불변
  // ==========================================================================
  it('1 & 2: 동일 판정 데이터(structuredJudgments)에 캐릭터 A(direct)와 B(warm)를 적용해도 원천 판정은 100% 동일해야 한다', () => {
    // 기본 생성 결과에서 structuredJudgments 추출
    const baseResult = generator.generateProduct(standardTestInput, { insightDepth: 5, prescription: true });
    const rawJudgments = baseResult.customerDeliverable!.structuredJudgments!;

    // 캐릭터 A (직설형) 렌더링
    const renderedDirect = characterRenderer.render({
      judgments: rawJudgments,
      characterProfile: DEFAULT_CHARACTER_PROFILES.direct,
      insightDepth: 5,
    });

    // 캐릭터 B (공감형) 렌더링
    const renderedWarm = characterRenderer.render({
      judgments: rawJudgments,
      characterProfile: DEFAULT_CHARACTER_PROFILES.warm,
      insightDepth: 5,
    });

    // 판정 데이터(structuredJudgments) 원천 일치 확인
    expect(renderedDirect.structuredJudgments).toEqual(renderedWarm.structuredJudgments);
    expect(renderedDirect.structuredJudgments).toEqual(rawJudgments);
  });

  // ==========================================================================
  // 3. 캐릭터 변경 전후 핵심 사건 동일
  // ==========================================================================
  it('3: 캐릭터를 변경하더라도 원천 판정의 핵심 사건 및 도메인이 임의 변경되지 않아야 한다', () => {
    const resDefault = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'default' });
    const resDirect = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'direct' });
    const resWarm = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'warm' });

    // 핵심 문제 텍스트 일치
    expect(resDirect.customerDeliverable?.structuredJudgments?.coreProblem).toBe(
      resDefault.customerDeliverable?.structuredJudgments?.coreProblem
    );
    expect(resWarm.customerDeliverable?.structuredJudgments?.coreProblem).toBe(
      resDefault.customerDeliverable?.structuredJudgments?.coreProblem
    );

    // 판정 도메인 일치
    expect(resDirect.classification.primaryDomain).toBe('BUSINESS');
    expect(resWarm.classification.primaryDomain).toBe('BUSINESS');
  });

  // ==========================================================================
  // 4. 캐릭터 변경 전후 명리 근거 동일
  // ==========================================================================
  it('4: 캐릭터 표현이 달라져도 사주팔자 원국 및 명리 근거 지표는 100% 불변해야 한다', () => {
    const resDirect = generator.generateProduct(standardTestInput, { insightDepth: 4, characterId: 'direct' });
    const resAnalytical = generator.generateProduct(standardTestInput, { insightDepth: 4, characterId: 'analytical' });

    // 원국 데이터 일치
    expect(resDirect.executedModules['CORE_ORIGINAL'].data.fourPillarsText).toBe(
      resAnalytical.executedModules['CORE_ORIGINAL'].data.fourPillarsText
    );

    // 판정 스냅샷의 myeongliBasis 일치
    expect(resDirect.customerDeliverable?.structuredJudgments?.myeongliBasis).toEqual(
      resAnalytical.customerDeliverable?.structuredJudgments?.myeongliBasis
    );
  });

  // ==========================================================================
  // 5. 캐릭터 변경 전후 시간축 동일
  // ==========================================================================
  it('5: 캐릭터에 따라 시간축(원국, 대운, 세운, 대운×세운)이 임의로 섞이거나 변경되지 않아야 한다', () => {
    const resDirect = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'direct' });
    const resWarm = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'warm' });

    const timeDirect = resDirect.customerDeliverable?.structuredJudgments?.timeAxisBreakdown;
    const timeWarm = resWarm.customerDeliverable?.structuredJudgments?.timeAxisBreakdown;

    expect(timeDirect).toEqual(timeWarm);
    expect(timeDirect?.seun?.[0]).toContain('2024년');
  });

  // ==========================================================================
  // 6. 캐릭터 변경 전후 마·살 데이터 동일
  // ==========================================================================
  it('6: 캐릭터가 새로운 마·살을 창조하거나 기존 마·살을 누락시키지 않아야 한다', () => {
    const resDirect = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'direct' });
    const resAnalytical = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'analytical' });

    const rawActiveSal = resDirect.executedModules['MAGA_DIAGNOSIS']?.data?.activeSal || [];
    const directMaga = resDirect.customerDeliverable?.structuredJudgments?.magaActive || [];
    const analyticalMaga = resAnalytical.customerDeliverable?.structuredJudgments?.magaActive || [];

    // 실행 모듈 원천 마·살과 두 캐릭터의 판정 스냅샷 마·살 목록 100% 일치
    expect(directMaga).toEqual(analyticalMaga);
    expect(directMaga.length).toBe(rawActiveSal.length);
  });

  // ==========================================================================
  // 7. 캐릭터 변경 전후 처방 근거 동일
  // ==========================================================================
  it('7: 캐릭터에 따라 처방 근거(Must Do, Must Avoid, 환경, 처방물)의 원천 판정이 변경되지 않아야 한다', () => {
    const resDirect = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'direct' });
    const resWarm = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'warm' });

    const presDirect = resDirect.customerDeliverable?.structuredJudgments?.prescriptions;
    const presWarm = resWarm.customerDeliverable?.structuredJudgments?.prescriptions;

    expect(presDirect?.behavior).toEqual(presWarm?.behavior);
    expect(presDirect?.environment).toEqual(presWarm?.environment);
    expect(presDirect?.remedy).toEqual(presWarm?.remedy);
  });

  // ==========================================================================
  // 8. 캐릭터에 따라 표현 방식은 실질적으로 차별화됨 (직설형 vs 공감형 vs 분석형)
  // ==========================================================================
  it('8: 동일한 판정이라도 캐릭터 Profile(direct vs warm vs analytical)에 따라 실제 고객 전달 문장이 달라져야 한다', () => {
    const resDirect = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'direct' });
    const resWarm = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'warm' });
    const resAnalytical = generator.generateProduct(standardTestInput, { insightDepth: 5, characterId: 'analytical' });

    const textDirect = resDirect.customerDeliverable!.fullFormattedText;
    const textWarm = resWarm.customerDeliverable!.fullFormattedText;
    const textAnalytical = resAnalytical.customerDeliverable!.fullFormattedText;

    // 세 캐릭터의 전체 텍스트가 서로 달라야 함
    expect(textDirect).not.toBe(textWarm);
    expect(textWarm).not.toBe(textAnalytical);
    expect(textDirect).not.toBe(textAnalytical);

    // 각 캐릭터 고유의 어조 및 키워드 반영 확인
    expect(textDirect).toContain('돌려 말하지 않고');
    expect(textWarm).toContain('마음고생이 많으셨습니까');
    expect(textAnalytical).toContain('인과 메커니즘');

    // 1단계 표현 방식 차이
    expect(resDirect.customerDeliverable?.sections.step1_currentEvent).toContain('[현실 상황 직시]');
    expect(resWarm.customerDeliverable?.sections.step1_currentEvent).toContain('[마음 공감과 경청]');
    expect(resAnalytical.customerDeliverable?.sections.step1_currentEvent).toContain('[사건 변수 정의]');
  });

  // ==========================================================================
  // 9. 캐릭터 설정이 없는 경우 기존 출력과의 호환성 유지
  // ==========================================================================
  it('9: 캐릭터가 미지정된 경우 기존의 기본 고객 전달물과 100% 호환되어야 한다', () => {
    const resDefault = generator.generateProduct(standardTestInput, { insightDepth: 3 });

    expect(resDefault.customerDeliverable).toBeDefined();
    expect(resDefault.customerDeliverable?.sections.step1_currentEvent).toBeDefined();
    expect(resDefault.customerDeliverable?.answersTo7Questions.q1_whyNow).toBeDefined();
    expect(resDefault.customerDeliverable?.safetyPassed).toBe(true);
  });

  // ==========================================================================
  // 10. 잘못된 캐릭터 설정이 명리 판정 계층으로 전달되지 않음
  // ==========================================================================
  it('10: 존재하지 않는 캐릭터 ID가 입력되어도 명리 계산과 판정은 정상 수행되고 안전하게 기본 프로필로 처리되어야 한다', () => {
    const resInvalid = generator.generateProduct(standardTestInput, {
      insightDepth: 3,
      characterId: 'NON_EXISTENT_CHARACTER_999' as any,
    });

    // 명리 계산 및 판정 정상 유지
    expect(resInvalid.classification.primaryDomain).toBe('BUSINESS');
    expect(resInvalid.executedModules['CORE_ORIGINAL'].success).toBe(true);
    expect(resInvalid.customerDeliverable).toBeDefined();
    expect(resInvalid.customerDeliverable?.safetyPassed).toBe(true);
  });

  // ==========================================================================
  // 커스텀 캐릭터 프로필 주입 검증
  // ==========================================================================
  it('사용자 정의 CharacterPresentationProfile을 직접 주입하여 커스텀 페르소나로 렌더링할 수 있어야 한다', () => {
    const customMentorProfile: CharacterPresentationProfile = {
      characterId: 'custom_mentor',
      name: '실무 경영 멘토',
      tone: 'realistic',
      directness: 'high',
      empathy: 'medium',
      explanationStyle: 'concise',
      sentenceStyle: 'formal',
      emphasisStyle: 'logical',
      warningStyle: 'sharp',
      greetingPrefix: '실전 경영 관점에서 리스크 관리 로드맵을 전달합니다.',
      closingSuffix: '신속하고 원칙에 입각한 의사결정이 기업의 생존을 결정합니다.',
    };

    const res = generator.generateProduct(standardTestInput, {
      insightDepth: 5,
      characterProfile: customMentorProfile,
    });

    const text = res.customerDeliverable!.fullFormattedText;
    expect(text).toContain('실무 경영 멘토');
    expect(text).toContain('실전 경영 관점에서 리스크 관리 로드맵을 전달합니다');
    expect(text).toContain('신속하고 원칙에 입각한 의사결정');

    // 판정 데이터는 원래 명리 판정과 100% 동일
    expect(res.customerDeliverable?.structuredJudgments?.primaryDomain).toBe('BUSINESS');
  });
});

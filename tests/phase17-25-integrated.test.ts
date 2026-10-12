/**
 * Phase 17~25 통합 사주 및 마보살 엔진 검증 테스트 슈트
 */

import { describe, expect, it } from 'vitest';
import { 
  convertLunarToSolar, 
  standardizeBirthDate 
} from '../src/modules/phase17_25/lunar-calendar.js';
import { GeneralSajuEngine } from '../src/modules/phase17_25/general-saju-engine.js';
import { LifeTroubleEngine } from '../src/modules/phase17_25/life-trouble-engine.js';
import { DualEnginePipeline } from '../src/modules/phase17_25/dual-engine-pipeline.js';
import { UserLanguagePresenter } from '../src/modules/phase17_25/user-language-presenter.js';
import { TimingAnalysisEngine } from '../src/modules/phase17_25/timing-analysis-engine.js';
import { PrescriptionEngine } from '../src/modules/phase17_25/prescription-engine.js';
import { ProductCatalogService, MABOSAL_PRODUCTS } from '../src/modules/phase17_25/product-system.js';
import { PlatformAdapter, SUPABASE_SCHEMA_SQL } from '../src/modules/phase17_25/platform-adapter.js';
import { MabosalIntegratedService } from '../src/modules/phase17_25/mabosal-integrated-service.js';
import { RawBirthInput } from '../src/modules/phase17_25/types.js';

describe('Phase 18: 출생정보 입력 시스템 및 음력/윤달 변환 검증', () => {
  it('1984년 윤10월 음력 날짜를 올바르게 양력으로 변환한다', () => {
    // 1984년 윤10월 1일은 양력 1984년 11월 23일
    const converted = convertLunarToSolar(1984, 10, 1, true);
    expect(converted.year).toBe(1984);
    expect(converted.month).toBe(11);
    expect(converted.day).toBe(23);
    expect(converted.dateString).toBe('1984-11-23');
  });

  it('1990년 음력 5월 5일 단오를 올바른 양력(1990-05-28)으로 변환한다', () => {
    const converted = convertLunarToSolar(1990, 5, 5, false);
    expect(converted.year).toBe(1990);
    expect(converted.month).toBe(5);
    expect(converted.day).toBe(28);
    expect(converted.dateString).toBe('1990-05-28');
  });

  it('standardizeBirthDate는 원천 사용자 데이터와 성별을 그대로 보존한다', () => {
    const raw: RawBirthInput = {
      calendar_type: 'lunar',
      is_leap_month: false,
      birth_year: 1995,
      birth_month: 8,
      birth_day: 15,
      birth_time: '14:30',
      is_time_unknown: false,
      birth_city: '부산',
      gender: 'female',
    };

    const standardized = standardizeBirthDate(raw);
    expect(standardized.original_input.gender).toBe('female');
    expect(standardized.original_input.calendar_type).toBe('lunar');
    expect(standardized.original_input.birth_city).toBe('부산');
    expect(standardized.solar_date_string).toBe('1995-09-09');
  });

  it('출생시간 미상인 경우 null로 안전하게 보존된다', () => {
    const raw: RawBirthInput = {
      calendar_type: 'solar',
      is_leap_month: false,
      birth_year: 2000,
      birth_month: 1,
      birth_day: 1,
      birth_time: null,
      is_time_unknown: true,
      birth_city: '서울',
      gender: 'male',
    };

    const standardized = standardizeBirthDate(raw);
    expect(standardized.solar_date_string).toBe('2000-01-01');
    expect(standardized.original_input.birth_time).toBeNull();
    expect(standardized.original_input.is_time_unknown).toBe(true);
  });
});

describe('Phase 17: 일반 사주 해석 엔진 고도화 검증', () => {
  it('일반 사주 결과는 마(魔) 없이도 독립적으로 완결된다', async () => {
    const service = new MabosalIntegratedService();
    const result = await service.analyze({
      birthInput: {
        calendar_type: 'solar',
        is_leap_month: false,
        birth_year: 1990,
        birth_month: 5,
        birth_day: 20,
        birth_time: '12:00',
        is_time_unknown: false,
        birth_city: '서울',
        gender: 'male',
      },
      troubleText: '특별한 문제는 없고 올해 운을 보고 싶어요.',
      tier: 'paid_detailed_saju',
    });

    const saju = result.dualResult.general_saju;
    expect(saju.day_master.name).toBeTruthy();
    expect(saju.day_master.nature).toBeTruthy();
    expect(saju.strength.status).toMatch(/신강|신약|중화|극강|극약/);
    expect(saju.strength.reasons).toHaveProperty('deungryeong');
    expect(saju.themes.wealth.title).toContain('재물');
    expect(saju.themes.career.title).toContain('직장');
    expect(saju.themes.business.title).toContain('사업');
    expect(saju.themes.relationship.title).toContain('연애');
    expect(saju.themes.marriage.title).toContain('결혼');
    expect(saju.themes.interpersonal.title).toContain('인간관계');
    expect(saju.themes.health.title).toContain('건강');
    expect(saju.daewoon.cycle_years).toBe(10);
    expect(saju.sewoon.flow_summary).toBeTruthy();
    expect(saju.key_timing_periods.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Phase 19: 현실 문제 입력 시스템 검증', () => {
  const engine = new LifeTroubleEngine();

  it('이별 관련 자연어 텍스트를 breakup 카테고리로 올바르게 분류한다', () => {
    const trouble = engine.parseTrouble('3년 만난 애인과 어제 심하게 싸우고 헤어졌어요 너무 힘들어요');
    expect(trouble.category).toBe('breakup');
    expect(trouble.category_label).toBe('연애 갈등 / 이별');
    expect(trouble.urgency_level).toBe('high');
    expect(trouble.context_tags).toContain('이별경험');
  });

  it('투자 손실 텍스트를 financial_drain 카테고리로 분류한다', () => {
    const trouble = engine.parseTrouble('주식과 코인으로 빚이 늘어나고 돈이 계속 새요');
    expect(trouble.category).toBe('financial_drain');
    expect(trouble.category_label).toBe('재물 누수 / 투자 실패');
  });

  it('특별한 문제가 없다는 입력은 general_fortune으로 처리한다', () => {
    const trouble = engine.parseTrouble('특별한 문제는 없고 올해 운을 보고 싶어요');
    expect(trouble.category).toBe('general_fortune');
    expect(trouble.urgency_level).toBe('low');
  });
});

describe('Phase 20 & 21: 이중 엔진 및 사용자 언어 6단계 출력 검증', () => {
  it('기계적 내부 용어(RELATIONSHIP_MA 등)를 배제하고 6단계 순서로 정제 출력한다', async () => {
    const service = new MabosalIntegratedService();
    const result = await service.analyze({
      birthInput: {
        calendar_type: 'solar',
        is_leap_month: false,
        birth_year: 1993,
        birth_month: 8,
        birth_day: 14,
        birth_time: '08:30',
        is_time_unknown: false,
        birth_city: '서울',
        gender: 'female',
      },
      troubleText: '남자친구와 갑자기 헤어졌어요. 다시 만날 수 있을까요?',
      tier: 'paid_mabosal_full',
    });

    const p = result.presentation;

    // 1단계: 현재 상황
    expect(p.step1_current_situation.empathy_summary).toContain('남자친구와 갑자기 헤어졌어요');
    // 2단계: 명리적 해석
    expect(p.step2_saju_insight.structural_explanation).toBeTruthy();
    // 3단계: 마보살식 압축 진단
    expect(p.step3_mabosal_diagnosis.compressed_diagnosis).toContain('마(魔)가 낀 시기');
    // 4단계: 기간
    expect(p.step4_period.onset_time).toBeTruthy();
    expect(p.step4_period.easing_time).toBeTruthy();
    // 5단계: 기회
    expect(p.step5_opportunity.breakthrough_moment).toBeTruthy();
    // 6단계: 행동 처방
    expect(p.step6_action_prescription.immediate_action).toBeTruthy();

    // 기계적인 영문 엔진 변수명이 사용자 출력에 노출되지 않음
    const fullText = JSON.stringify(p);
    expect(fullText).not.toContain('MA_TYPE');
    expect(fullText).not.toContain('ACTIVATION_STATE');
    expect(fullText).not.toContain('RELATIONSHIP_MA');
  });
});

describe('Phase 22: 시기 분석 엔진 고도화 검증', () => {
  it('12개월 타임라인 및 피크, 완화, 행동 시기 가이드를 생성한다', async () => {
    const service = new MabosalIntegratedService();
    const result = await service.analyze({
      birthInput: {
        calendar_type: 'solar',
        is_leap_month: false,
        birth_year: 1988,
        birth_month: 11,
        birth_day: 5,
        birth_time: '19:20',
        is_time_unknown: false,
        birth_city: '대구',
        gender: 'male',
      },
      troubleText: '사업이 계속 꼬이고 거래처 미수가 쌓여요',
      tier: 'paid_mabosal_full',
    });

    const t = result.timingReport;
    expect(t.monthly_timeline.length).toBe(12);
    expect(t.crisis_peak_period).toBeTruthy();
    expect(t.relief_period).toBeTruthy();
    expect(t.action_opportune_period).toBeTruthy();
    expect(t.waiting_recommended_period).toBeTruthy();
    expect(t.monthly_timeline[0].astrological_basis).toBeTruthy();
  });
});

describe('Phase 23: 마보살 처방 시스템 검증', () => {
  it('명리 근거와 결합된 피해야 할 행동, 해야 할 행동, 디지털 처방 카드를 생성한다', async () => {
    const service = new MabosalIntegratedService();
    const result = await service.analyze({
      birthInput: {
        calendar_type: 'solar',
        is_leap_month: false,
        birth_year: 1992,
        birth_month: 3,
        birth_day: 18,
        birth_time: '04:15',
        is_time_unknown: false,
        birth_city: '인천',
        gender: 'female',
      },
      troubleText: '직장에서 상사와 갈등으로 잘렸어요',
      tier: 'paid_mabosal_full',
    });

    const rx = result.prescription;
    expect(rx.root_cause).toBeTruthy();
    expect(rx.actions_to_avoid.length).toBeGreaterThan(0);
    expect(rx.actions_to_take.length).toBeGreaterThan(0);
    expect(rx.timing_strategic_action).toBeTruthy();
    expect(rx.digital_remedy?.remedy_id).toContain('remedy_job_loss');
    expect(rx.digital_remedy?.recommended_usage).toContain('스마트폰');
  });
});

describe('Phase 24: 상품 구조 및 티어 권한 검증', () => {
  const productService = new ProductCatalogService();

  it('무료 진단은 기본 사주와 마 징후만 보여주고 처방과 시기 분석은 잠근다', () => {
    const permissions = productService.getVisibleSections('free_diagnosis');
    expect(permissions.showBasicPillars).toBe(true);
    expect(permissions.showGeneralThemes).toBe(false);
    expect(permissions.showTimingAnalysis).toBe(false);
    expect(permissions.showPrescription).toBe(false);
  });

  it('유료 2(마보살 정밀풀이)는 약 15만원(149,000원) 기준으로 전 섹션 열람 권한을 가진다', () => {
    const prod = MABOSAL_PRODUCTS['paid_mabosal_full'];
    expect(prod.price_krw).toBe(149000);
    expect(prod.price_usd).toBe(109);

    const permissions = productService.getVisibleSections('paid_mabosal_full');
    expect(permissions.showGeneralThemes).toBe(true);
    expect(permissions.showTimingAnalysis).toBe(true);
    expect(permissions.showPrescription).toBe(true);
    expect(permissions.showDigitalRemedy).toBe(true);
  });
});

describe('Phase 25: 서비스 플랫폼 연결 및 AI 프롬프트 가드 검증', () => {
  it('Supabase DDL 스키마에 필수 5대 테이블이 정의되어 있다', () => {
    expect(SUPABASE_SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS public.users');
    expect(SUPABASE_SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS public.saju_inputs');
    expect(SUPABASE_SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS public.analysis_sessions');
    expect(SUPABASE_SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS public.payments');
    expect(SUPABASE_SCHEMA_SQL).toContain('CREATE TABLE IF NOT EXISTS public.remedies');
  });

  it('AI 안전 게이트웨이가 명리 불변 팩트를 엄격하게 보호한다', () => {
    const adapter = new PlatformAdapter();
    const prompt = adapter.formatAiSafePrompt(
      {
        dayMaster: '갑목(甲木)',
        dominantElement: '목(木)',
        troubleCategory: '연애 갈등 / 이별',
        maCompressedDiagnosis: '지금은 연애에 마가 낀 시기로 볼 수 있습니다.',
        recoveryTimeline: '올해 9월 이후 완화',
        actionGuideline: '충동적인 연락을 멈추고 4주간 완충 기간 확보',
      },
      '언제쯤 연락하면 될까요?'
    );

    expect(prompt.isEngineProtected).toBe(true);
    expect(prompt.systemPrompt).toContain('불변의 팩트');
    expect(prompt.systemPrompt).toContain('갑목(甲木)');
    expect(prompt.systemPrompt).toContain('4주간 완충 기간 확보');
  });
});

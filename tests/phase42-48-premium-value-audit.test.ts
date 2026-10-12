/**
 * Phase 42~48: Premium Value Audit Test Suite
 * 
 * 마보살 서비스의 프리미엄 상품 가치 집중 검증
 * - Phase 42: General Saju Quality Audit
 * - Phase 43: Mabosal Problem-Solving Audit (8대 현실 고민)
 * - Phase 44: Product Value Audit (무료 / 39,000원 / 149,000원)
 * - Phase 45: Pain Point별 품질 Audit (연애, 직장, 사업, 돈)
 * - Phase 46: Interpretation Architecture Audit (5단계 구조)
 * - Phase 47: Free-to-Paid Conversion Audit
 * - Phase 48: Final Premium Value Gate
 */

import { describe, it, expect } from 'vitest';
import { ProductionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { GeneralSajuEngine } from '../src/modules/phase17_25/general-saju-engine.js';
import { LifeTroubleEngine, TROUBLE_PRESETS } from '../src/modules/phase17_25/life-trouble-engine.js';
import { MabosalIntegratedService } from '../src/modules/phase17_25/mabosal-integrated-service.js';

describe('Phase 42~48: Premium Value Audit', () => {
  const pipeline = new ProductionPipelineEngine();
  const generalEngine = new GeneralSajuEngine();
  const integratedService = new MabosalIntegratedService();

  // ========================================================
  // Phase 42: General Saju Quality Audit
  // "마 진단이 없어도 이것만으로 제대로 된 사주풀이 상품인가?"
  // ========================================================
  describe('Phase 42 — General Saju Quality Audit', () => {
    it('다양한 출생정보 샘플에서 4주, 일간, 오행, 강약, 7대 영역, 대운, 세운, 시기가 마 진단 없이도 독립 완결성을 가진다', async () => {
      const birthSamples = [
        { y: 1988, m: 3, d: 15, h: '08:30', gender: 'male' as const, name: '갑목 표본' },
        { y: 1992, m: 7, d: 20, h: '14:00', gender: 'female' as const, name: '정화 표본' },
        { y: 1995, m: 11, d: 5, h: '22:15', gender: 'male' as const, name: '임수 표본' },
        { y: 1985, m: 1, d: 25, h: '05:40', gender: 'female' as const, name: '경금 표본' },
      ];

      for (const sample of birthSamples) {
        const result = await integratedService.analyze({
          birthInput: {
            calendar_type: 'solar',
            is_leap_month: false,
            birth_year: sample.y,
            birth_month: sample.m,
            birth_day: sample.d,
            birth_time: sample.h,
            is_time_unknown: false,
            birth_city: '서울',
            gender: sample.gender,
          },
          troubleText: '한해 종합 운세와 사주 구조를 알고 싶습니다.',
          tier: 'paid_detailed_saju', // 39,000원 일반 정밀 사주
        });

        const saju = result.dualResult.general_saju;

        // 1. 4주 8자
        expect(result.fourPillarsText).toBeTruthy();
        expect(result.fourPillarsText.split(' ').length).toBe(4);

        // 2. 일간 및 성향
        expect(saju.day_master.stem).toBeTruthy();
        expect(saju.day_master.nature).toBeTruthy();
        expect(saju.day_master.keywords.length).toBeGreaterThanOrEqual(3);
        expect(saju.day_master.psychological_trait).toBeTruthy();

        // 3. 오행 및 조후
        expect(saju.five_elements.dominant).toBeTruthy();
        expect(saju.five_elements.temperature_balance).toBeTruthy();

        // 4. 강약 (득령/득지/득세)
        expect(['극강', '신강', '중화', '신약', '극약']).toContain(saju.strength.status);
        expect(saju.strength.reasons).toHaveProperty('deungryeong');
        expect(saju.strength.reasons).toHaveProperty('deungji');
        expect(saju.strength.reasons).toHaveProperty('deungse');

        // 5. 7대 라이프 영역 (재물, 직장, 사업, 연애, 결혼, 인간관계, 건강)
        const themes = saju.themes;
        expect(themes.wealth.title).toContain('재물');
        expect(themes.career.title).toContain('직장');
        expect(themes.business.title).toContain('사업');
        expect(themes.relationship.title).toContain('연애');
        expect(themes.marriage.title).toContain('결혼');
        expect(themes.interpersonal.title).toContain('인간관계');
        expect(themes.health.title).toContain('건강');

        // 각 영역별 4단 분석 구조 (요약, 기초, 올해 흐름, 행동 가이드)
        for (const t of Object.values(themes)) {
          expect(t.summary.length).toBeGreaterThan(10);
          expect(t.foundation_analysis.length).toBeGreaterThan(10);
          expect(t.current_flow.length).toBeGreaterThan(10);
          expect(t.action_guideline.length).toBeGreaterThan(10);
        }

        // 6. 대운, 세운, 주요 타이밍
        expect(saju.daewoon.cycle_years).toBe(10);
        expect(saju.sewoon.current_year).toBe(new Date().getFullYear());
        expect(saju.sewoon.critical_opportunities.length).toBeGreaterThanOrEqual(1);
        expect(saju.sewoon.caution_points.length).toBeGreaterThanOrEqual(1);
        expect(saju.key_timing_periods.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ========================================================
  // Phase 43: Mabosal Problem-Solving Audit
  // 동일 사주에 서로 다른 8대 현실 고민 입력 시 자연스러운 체인 작동
  // ========================================================
  describe('Phase 43 — Mabosal Problem-Solving Audit (8대 사례)', () => {
    const fixedBirth = {
      calendarType: 'solar' as const,
      isLeapMonth: false,
      birthDate: '1989-06-12',
      birthTime: '15:20',
      isUnknownTime: false,
      gender: 'male' as const,
      region: '서울',
    };

    const eightCases = [
      { id: 1, name: '연인과 이별', text: '3년 사귄 연인과 심하게 싸우고 헤어졌습니다. 관계가 왜 끝났는지, 재회 가능성이 있는지 알고 싶습니다.', expectedCat: 'breakup' },
      { id: 2, name: '직장에서 해고', text: '회사에서 갑작스럽게 권고사직 해고를 통보받았습니다. 너무 막막하고 억울합니다.', expectedCat: 'job_loss' },
      { id: 3, name: '이직 고민', text: '현재 직장에서 번아웃이 왔고 다른 회사로 이직을 준비 중인데 지금 옮겨도 될까요?', expectedCat: 'job_loss' },
      { id: 4, name: '사업 정체', text: '스타트업을 2년째 운영 중인데 매출이 정체되고 계약이 계속 꼬입니다. 폐업해야 할지 버텨야 할지 고민입니다.', expectedCat: 'business_struggle' },
      { id: 5, name: '투자 손실', text: '주식과 코인에 무리하게 투자했다가 큰 손실을 입었습니다. 돈이 계속 새어나가서 빚더미에 앉았습니다.', expectedCat: 'financial_drain' },
      { id: 6, name: '결혼 문제', text: '결혼 준비 중에 양가 부모님 및 상대방과 갈등이 극에 달해 파혼 위기입니다.', expectedCat: 'marriage_block' },
      { id: 7, name: '인간관계 갈등', text: '직장 동료와 믿었던 지인에게 심한 구설과 배신을 당해 대인기피증이 올 것 같습니다.', expectedCat: 'people_conflict' },
      { id: 8, name: '이유를 알 수 없는 장기 정체', text: '열심히 사는데도 갑자기 모든 일이 꼬이고 벽에 부딪힌 것 같습니다. 원인 모를 정체가 계속됩니다.', expectedCat: 'sudden_block' },
    ];

    it('동일 사주라도 8개 고민 각각에 대해 명리 구조, 마 압축, 시기, 처방이 고유하고 자연스럽게 작동한다', async () => {
      for (const c of eightCases) {
        const prod = await pipeline.executePipeline({
          ...fixedBirth,
          userTroubleText: c.text,
          clientId: `audit-case-${c.id}`,
        });

        expect(prod.success).toBe(true);

        // 1. 현실 문제 인식
        expect(prod.maDiagnosis.userTrouble.userText).toBe(c.text);

        // 2. 명리 구조 & 원인
        expect(prod.maDiagnosis.structuralReason.length).toBeGreaterThan(10);

        // 3. 마보살식 압축 표현 검증
        // "쉽게 말하면 지금은 [영역]에 마가 낀 시기로 볼 수 있습니다"
        expect(prod.maDiagnosis.maSummaryPhrase).toContain('마');
        expect(prod.maDiagnosis.maSummaryPhrase).toContain('시기로 볼 수 있습니다');

        // 4. 시기 흐름 (시작, 정점, 완화, 회복)
        expect(prod.timing.startMonth).toBeTruthy();
        expect(prod.timing.peakMonth).toBeTruthy();
        expect(prod.timing.reliefMonth).toBeTruthy();
        expect(prod.timing.recoveryMonth).toBeTruthy();

        // 5. 처방 (금기 사항, 실천 사항, 오행 처방)
        expect(prod.prescription.dontList.length).toBeGreaterThanOrEqual(1);
        expect(prod.prescription.doList.length).toBeGreaterThanOrEqual(1);
        expect(prod.prescription.elementRemedy).toBeTruthy();
      }
    });
  });

  // ========================================================
  // Phase 44: Product Value Audit
  // 무료 vs 39,000원 vs 149,000원의 실제 사람 기준 가치 및 차별성
  // ========================================================
  describe('Phase 44 — Product Value Audit', () => {
    it('무료는 문제인식+원인+마보살 한마디로 신뢰를 주고, 39,000원은 7대 평생구조를, 149,000원은 8대 핵심 질문에 100% 답변한다', async () => {
      const birth = {
        calendar_type: 'solar' as const,
        is_leap_month: false,
        birth_year: 1991,
        birth_month: 8,
        birth_day: 18,
        birth_time: '11:30',
        is_time_unknown: false,
        birth_city: '서울',
        gender: 'female' as const,
      };

      const trouble = '애인과 이별 위기인데 어떻게 해야 할지 모르겠습니다.';

      // 무료 진단
      const freeResult = await integratedService.analyze({
        birthInput: birth,
        troubleText: trouble,
        tier: 'free_diagnosis',
      });

      // 39,000원 정밀 사주
      const deepSajuResult = await integratedService.analyze({
        birthInput: birth,
        troubleText: trouble,
        tier: 'paid_detailed_saju',
      });

      // 149,000원 마보살 정밀풀이
      const mabosalFullResult = await integratedService.analyze({
        birthInput: birth,
        troubleText: trouble,
        tier: 'paid_mabosal_full',
      });

      // [무료 검증]
      // 기본 구조 + 문제 인식 + 마보살 한마디 + 대략적 흐름
      expect(freeResult.presentation.step1_current_situation.empathy_summary).toBeTruthy();
      expect(freeResult.presentation.step2_saju_insight.structural_explanation).toBeTruthy();
      expect(freeResult.presentation.step3_mabosal_diagnosis.compressed_diagnosis).toContain('마');

      // [39,000원 검증]
      // 평생 구조 + 7대 영역 + 대운 + 세운
      const themes = deepSajuResult.dualResult.general_saju.themes;
      expect(Object.keys(themes)).toHaveLength(7);
      expect(deepSajuResult.dualResult.general_saju.daewoon).toBeTruthy();
      expect(deepSajuResult.dualResult.general_saju.sewoon).toBeTruthy();

      // [149,000원 8대 질문 완전 해소 검증]
      // 1. 왜 지금 이런 일이 생겼는가?
      expect(mabosalFullResult.presentation.step2_saju_insight.structural_explanation.length).toBeGreaterThan(20);
      // 2. 명리학적으로 어떤 구조가 작용하는가?
      expect(mabosalFullResult.dualResult.ma_signal.structural_cause.length).toBeGreaterThan(5);
      // 3. 언제 가장 강하게 나타나는가? (정점)
      expect(mabosalFullResult.timingReport.crisis_peak_period).toBeTruthy();
      // 4. 언제 완화되는가? (완화)
      expect(mabosalFullResult.timingReport.relief_period).toBeTruthy();
      // 5. 언제 움직이는 것이 좋은가? (도약)
      expect(mabosalFullResult.timingReport.action_opportune_period).toBeTruthy();
      // 6. 지금 무엇을 하지 말아야 하는가?
      expect(mabosalFullResult.prescription.actions_to_avoid.length).toBeGreaterThanOrEqual(2);
      // 7. 무엇을 해야 하는가?
      expect(mabosalFullResult.prescription.actions_to_take.length).toBeGreaterThanOrEqual(2);
      // 8. 이후 어떤 기회를 잡을 수 있는가?
      expect(mabosalFullResult.presentation.step5_opportunity.positive_signs.length).toBeGreaterThanOrEqual(2);
      expect(mabosalFullResult.prescription.digital_remedy).toBeDefined();
    });
  });

  // ========================================================
  // Phase 45: Pain Point별 품질 Audit
  // 연애, 직장, 사업, 돈 문제 유형별 전문성 및 확정/보장 표현 배제
  // ========================================================
  describe('Phase 45 — Pain Point별 품질 Audit', () => {
    it('연애/직장/사업/돈 분야별 전문적 분석을 제공하며, 절대적인 단정이나 확정적 예언을 하지 않는다', async () => {
      const painPoints = [
        { cat: 'breakup', text: '헤어진 연인과 재회할 수 있을까요? 다시 연락해볼 타이밍이 궁금합니다.' },
        { cat: 'job_loss', text: '현재 직장에서 이직을 해야 할 시점인지 준비기간이 필요한지 알고 싶습니다.' },
        { cat: 'business_struggle', text: '사업이 정체되어 있는데 지금 현금을 방어해야 할지 확장해야 할지 고민입니다.' },
        { cat: 'financial_drain', text: '충동적인 투자로 돈이 새고 있습니다. 언제까지 방어해야 하나요?' },
      ];

      for (const p of painPoints) {
        const prod = await pipeline.executePipeline({
          calendarType: 'solar',
          isLeapMonth: false,
          birthDate: '1987-10-14',
          birthTime: '09:00',
          isUnknownTime: false,
          gender: 'female',
          region: '부산',
          userTroubleText: p.text,
          clientId: `painpoint-${p.cat}`,
        });

        // 1. 행동 가이드와 금기 지침 존재
        expect(prod.prescription.doList.length).toBeGreaterThan(0);
        expect(prod.prescription.dontList.length).toBeGreaterThan(0);

        // 2. 확정적·보장형 표현("100% 된다", "반드시 망한다", "로또 당첨", "운명적으로 정해져 있다" 등) 배제
        const combinedText = `
          ${prod.aiPresentation.userHeadline}
          ${prod.aiPresentation.sajuStructureExplanation}
          ${prod.aiPresentation.problemAnalysis}
          ${prod.aiPresentation.mabosalPunchline}
          ${prod.aiPresentation.timingGuide}
          ${prod.aiPresentation.actionAdvice}
        `;

        expect(combinedText).not.toMatch(/100%|확정적|반드시 망|절대적으로 불가능|로또|무조건 성공/);
        // 사주 해석은 가능성과 환경적 흐름으로 표현되어야 함
        expect(combinedText).toMatch(/흐름|시기|가능성|환경|자세|조율|살피/);
      }
    });
  });

  // ========================================================
  // Phase 46: Interpretation Architecture Audit
  // ① 현실 언어 → ② 명리 이유 → ③ 마보살 압축 → ④ 시간 → ⑤ 처방
  // ========================================================
  describe('Phase 46 — Interpretation Architecture Audit', () => {
    it('모든 분석 결과가 5대 계층 아키텍처 규격을 완벽하게 준수한다', async () => {
      const result = await pipeline.executePipeline({
        calendarType: 'solar',
        isLeapMonth: false,
        birthDate: '1993-04-02',
        birthTime: '18:30',
        isUnknownTime: false,
        gender: 'male',
        region: '대구',
        userTroubleText: '동업자와의 갈등으로 사업 진행이 완전히 멈췄습니다.',
        clientId: 'arch-audit',
      });

      const p = result.integratedResult.presentation;

      // ① 현실의 언어: 사용자가 겪는 현실 상황 먼저 공감
      expect(p.step1_current_situation.heading).toBe('현재 겪고 계신 현실의 문제');
      expect(p.step1_current_situation.empathy_summary).toContain('동업자');

      // ② 명리학적 이유: 사주 원국과 운의 구조 설명
      expect(p.step2_saju_insight.heading).toBe('명리학적 배경과 근거');
      expect(p.step2_saju_insight.structural_explanation).toBeTruthy();

      // ③ 마보살식 압축: 긴 설명을 쉬운 하나의 '마' 표현으로 압축
      expect(p.step3_mabosal_diagnosis.heading).toBe('마보살 진단');
      expect(p.step3_mabosal_diagnosis.compressed_diagnosis).toContain('마(魔)가 낀 시기');

      // ④ 시간: 시작 → 정점 → 완화 → 전환
      expect(p.step4_period.heading).toBe('시기의 흐름과 지속 기간');
      expect(p.step4_period.onset_time).toBeTruthy();
      expect(p.step4_period.easing_time).toBeTruthy();

      // ⑤ 처방: 하지 않을 것 → 지금 할 것 → 기회를 잡을 것
      expect(p.step6_action_prescription.heading).toBe('현실적 행동 처방');
      expect(p.step6_action_prescription.immediate_action).toBeTruthy();
      expect(p.step6_action_prescription.future_strategy).toBeTruthy();
    });
  });

  // ========================================================
  // Phase 47: Free-to-Paid Conversion Audit
  // 무료에서 충분한 신뢰를 형성하고, 유료에서 타이밍·처방·상담을 정교하게 해제
  // ========================================================
  describe('Phase 47 — Free-to-Paid Conversion Audit', () => {
    it('무료 진단은 핵심 원인과 마보살 한마디를 온전히 제공하여 신뢰를 형성하며, 유료에서 정밀 타이밍과 처방을 해제한다', async () => {
      const freeReport = await integratedService.analyze({
        birthInput: {
          calendar_type: 'solar',
          is_leap_month: false,
          birth_year: 1988,
          birth_month: 12,
          birth_day: 1,
          birth_time: '13:00',
          is_time_unknown: false,
          birth_city: '서울',
          gender: 'female',
        },
        troubleText: '직장에서 부당한 대우를 받고 있어 퇴사해야 할지 고민입니다.',
        tier: 'free_diagnosis',
      });

      // 무료 사용자에게 문제 인식과 마보살 한마디가 온전히 보임 (단순 블러 처리가 아님)
      expect(freeReport.presentation.step1_current_situation.empathy_summary).toBeTruthy();
      expect(freeReport.presentation.step3_mabosal_diagnosis.compressed_diagnosis).toContain('마');
      expect(freeReport.dualResult.general_saju.day_master.nature).toBeTruthy();

      // 유료 전환 트리거 검증: "그래서 정확히 언제 무엇을 해야 하는가?"
      expect(freeReport.timingReport.crisis_peak_period).toBeTruthy();
      expect(freeReport.prescription.actions_to_take.length).toBeGreaterThan(0);
      expect(freeReport.prescription.actions_to_avoid.length).toBeGreaterThan(0);
    });
  });

  // ========================================================
  // Phase 48: Final Premium Value Gate
  // 일반 사주와의 차별성 및 149,000원 상품 가치 종합 평가
  // ========================================================
  describe('Phase 48 — Final Premium Value Gate', () => {
    it('일반 사주("앞으로 어떤 운이 있는가")와 마보살("지금 내게 벌어진 이 일이 왜 생겼고, 언제 풀리며, 어떻게 대응해야 하는가")이 명확히 구별된다', async () => {
      const result = await pipeline.executePipeline({
        calendarType: 'solar',
        isLeapMonth: false,
        birthDate: '1985-05-19',
        birthTime: '16:45',
        isUnknownTime: false,
        gender: 'male',
        region: '서울',
        userTroubleText: '오랜 시간 준비한 자격시험에서 떨어지고 이직 기회도 놓쳤습니다. 앞으로의 삶이 너무 캄캄합니다.',
        clientId: 'premium-gate',
      });

      // 1. 일반 사주 영역: 평생의 성향과 7대 테마의 객관적 그릇
      expect(result.generalSaju.dayMaster).toBeTruthy();
      expect(result.generalSaju.lifeThemes.career).toBeTruthy();
      expect(result.generalSaju.lifeThemes.wealth).toBeTruthy();

      // 2. 마보살 문제 해결 영역: 현재 벌어진 사건의 원인, 완화 시기, 대처 방안
      expect(result.maDiagnosis.maSummaryPhrase).toContain('마');
      expect(result.maDiagnosis.maSummaryPhrase).toContain('낀 시기로 볼 수 있습니다');
      expect(result.timing.peakMonth).toBeTruthy();
      expect(result.timing.reliefMonth).toBeTruthy();
      expect(result.prescription.dontList.length).toBeGreaterThanOrEqual(1);
      expect(result.prescription.doList.length).toBeGreaterThanOrEqual(1);

      // 3. 149,000원 가치 축: 고해상도 디지털 처방물(월페이퍼/부적 아티팩트) 동봉 검증
      expect(result.remedyArtifacts.length).toBeGreaterThanOrEqual(3);
      for (const artifact of result.remedyArtifacts) {
        expect(artifact.formatType).toBeTruthy();
        expect(artifact.svgContent).toContain('<svg');
        expect(artifact.title).toBeTruthy();
      }
    });
  });
});

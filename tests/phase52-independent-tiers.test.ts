import { describe, it, expect } from 'vitest';
import { productionPipelineEngine } from '../src/modules/production/production-pipeline.js';
import { mabosal4TierService } from '../src/modules/production/mabosal-4tier-service.js';

describe('Phase 52: 4단계 독립 상품 구조 및 명리 오류 수정 검증 테스트 Suite', () => {

  const case01Input = {
    birthDate: '1992-03-15',
    birthTime: '08:30',
    calendarType: 'solar' as const,
    gender: 'male' as const,
    inquiryTopic: 'relationship' as const,
    userTroubleText: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?',
    userQuestion: '3년간 만난 연인과 큰 다툼 후 헤어졌습니다. 다시 연락해도 될까요?'
  };

  const case02Input = {
    birthDate: '1988-12-10',
    birthTime: '14:00',
    calendarType: 'solar' as const,
    gender: 'male' as const,
    inquiryTopic: 'business' as const,
    userTroubleText: '2026년 8월 15일에 믿었던 동업자와 지분 및 정산 문제로 크게 다투고 결별 위기입니다.',
    userQuestion: '2026년 8월 15일에 믿었던 동업자와 지분 및 정산 문제로 크게 다투고 결별 위기입니다.'
  };

  const case03Input = {
    birthDate: '1995-05-20',
    birthTime: '18:30',
    calendarType: 'solar' as const,
    gender: 'female' as const,
    inquiryTopic: 'career' as const,
    userTroubleText: '상사와의 마찰로 퇴사를 고민 중인데 언제 이직하는 게 유리할까요?',
    userQuestion: '상사와의 마찰로 퇴사를 고민 중인데 언제 이직하는 게 유리할까요?'
  };

  const case04Input = {
    birthDate: '2000-01-25',
    birthTime: '06:10',
    calendarType: 'solar' as const,
    gender: 'male' as const,
    inquiryTopic: 'wealth' as const,
    userTroubleText: '무리한 투자로 빚을 지게 되었는데 손실을 메꿀 기회가 언제 올까요?',
    userQuestion: '무리한 투자로 빚을 지게 되었는데 손실을 메꿀 기회가 언제 올까요?'
  };

  const case05Input = {
    birthDate: '1985-07-08',
    birthTime: '21:40',
    calendarType: 'solar' as const,
    gender: 'female' as const,
    inquiryTopic: 'relationship' as const,
    userTroubleText: '2026년 9월 1일 배우자와 별거를 시작했습니다. 관계 회복이 가능할까요?',
    userQuestion: '2026년 9월 1일 배우자와 별거를 시작했습니다. 관계 회복이 가능할까요?'
  };

  // ----------------------------------------------------
  // 1. P0 — 명리 오류 수정 및 방어층 검증
  // ----------------------------------------------------
  describe('1. P0 명리 오류 수정 (삼합 조건 엄격화)', () => {
    it('CASE 01: 원국에 寅이 있고 운에 午, 戌이 있어 寅午戌 삼합 화국이 정상 출력된다', async () => {
      const res = await productionPipelineEngine.executePipeline(case01Input as any);
      const standardText = res.fourTierReports?.standard.customerReport || '';
      expect(standardText).toContain('寅午戌 삼합 화국');
    });

    it('CASE 03: 일지가 亥(을해 신사 신해 정유)이므로 寅午戌 삼합 화국 문장이 절대 출력되지 않는다', async () => {
      const res = await productionPipelineEngine.executePipeline(case03Input as any);
      const standardText = res.fourTierReports?.standard.customerReport || '';
      expect(standardText).not.toContain('寅午戌 삼합 화국');
    });

    it('CASE 02, CASE 04, CASE 05: 寅이 없는 사주에서 寅午戌 삼합 화국 문장이 미출력된다', async () => {
      const res2 = await productionPipelineEngine.executePipeline(case02Input as any);
      const res4 = await productionPipelineEngine.executePipeline(case04Input as any);
      const res5 = await productionPipelineEngine.executePipeline(case05Input as any);

      expect(res2.fourTierReports?.standard.customerReport).not.toContain('寅午戌 삼합 화국');
      expect(res4.fourTierReports?.standard.customerReport).not.toContain('寅午戌 삼합 화국');
      expect(res5.fourTierReports?.standard.customerReport).not.toContain('寅午戌 삼합 화국');
    });
  });

  // ----------------------------------------------------
  // 2. P1 — 4단계 누적 복사 구조 폐지 및 독립성 검증
  // ----------------------------------------------------
  describe('2. P1 4단계 누적 복사 폐지 및 독립성 검증', () => {
    it('STANDARD는 FREE 전문을 100% 복사하지 않는다', async () => {
      const res = await productionPipelineEngine.executePipeline(case01Input as any);
      const free = res.fourTierReports!.free.customerReport;
      const standard = res.fourTierReports!.standard.customerReport;

      // FREE 리포트의 타이틀 헤더가 STANDARD에 포함되지 않아야 함
      expect(standard).not.toContain('[마보살 무료 사주 분석 리포트]');
      // STANDARD 고유의 타이틀을 지녀야 함
      expect(standard).toContain('[마보살 전문 일반 사주 리포트 — 사주 원국 및 격국 심화 분석]');
    });

    it('SAL은 STANDARD 전문을 100% 복사하지 않는다', async () => {
      const res = await productionPipelineEngine.executePipeline(case01Input as any);
      const standard = res.fourTierReports!.standard.customerReport;
      const sal = res.fourTierReports!.sal.customerReport;

      expect(sal).not.toContain('[마보살 전문 일반 사주 리포트');
      expect(sal).not.toContain('[마보살 무료 사주 분석 리포트]');
      expect(sal).toContain('[마보살 살(煞)진단 전문 리포트 — 문제와 꼬임의 근본 원인 규명]');
    });

    it('PREMIUM은 SAL 전문을 100% 복사하지 않는다', async () => {
      const res = await productionPipelineEngine.executePipeline(case01Input as any);
      const sal = res.fourTierReports!.sal.customerReport;
      const premium = res.fourTierReports!.premium.customerReport;

      expect(premium).not.toContain('[마보살 살(煞)진단 전문 리포트');
      expect(premium).not.toContain('[마보살 전문 일반 사주 리포트');
      expect(premium).toContain('[마보살 프리미엄 종합 판정 — 실천적 처방과 해결 행동 지침]');
    });

    it('4단계 각각 단독으로 읽어도 독립적인 완결성을 가진다', async () => {
      const res = await productionPipelineEngine.executePipeline(case02Input as any);
      const tiers = res.fourTierReports!;

      expect(tiers.free.customerReport.length).toBeGreaterThan(500);
      expect(tiers.standard.customerReport.length).toBeGreaterThan(600);
      expect(tiers.sal.customerReport.length).toBeGreaterThan(600);
      expect(tiers.premium.customerReport.length).toBeGreaterThan(600);
    });
  });

  // ----------------------------------------------------
  // 3. P2 — 내부 코드/영문 키 고객 노출 0건 검증
  // ----------------------------------------------------
  describe('3. P2 내부 코드 고객 노출 0건 검증', () => {
    it('고객 리포트 4단계 전체에서 day:, year:, month:, hour: 영문 키가 노출되지 않는다', async () => {
      const cases = [case01Input, case02Input, case03Input, case04Input, case05Input];

      for (const c of cases) {
        const res = await productionPipelineEngine.executePipeline(c as any);
        const allText = [
          res.fourTierReports!.free.customerReport,
          res.fourTierReports!.standard.customerReport,
          res.fourTierReports!.sal.customerReport,
          res.fourTierReports!.premium.customerReport
        ].join('\n');

        expect(allText).not.toMatch(/\bday:/);
        expect(allText).not.toMatch(/\byear:/);
        expect(allText).not.toMatch(/\bmonth:/);
        expect(allText).not.toMatch(/\bhour:/);
        expect(allText).not.toContain('ruleId');
        expect(allText).not.toContain('activationScore');
        expect(allText).not.toContain('riskScore');
      }
    });

    it('STANDARD 십신 분석이 실제 사주의 다자/결핍 맞춤형으로 동적 생성된다', async () => {
      const res1 = await productionPipelineEngine.executePipeline(case01Input as any);
      const res2 = await productionPipelineEngine.executePipeline(case02Input as any);

      const st1 = res1.fourTierReports!.standard.customerReport;
      const st2 = res2.fourTierReports!.standard.customerReport;

      // 단순 교과서식 나열 대신 십신 구성 분포 카운트와 주도/보완 작용이 명시됨
      expect(st1).toContain('십신 구성 분포:');
      expect(st2).toContain('십신 구성 분포:');
      expect(st1).not.toEqual(st2);
    });
  });

  // ----------------------------------------------------
  // 4. P3 — SAL 스토리텔링 및 PREMIUM 고민 키워드 반영 검증
  // ----------------------------------------------------
  describe('4. P3 SAL 스토리텔링 및 PREMIUM 고민 키워드 반영', () => {
    it('SAL 리포트가 "① 무엇이 문제를 건드리는가"부터 시작하여 핵심 살 중심의 스토리텔링을 제공한다', async () => {
      const res = await productionPipelineEngine.executePipeline(case01Input as any);
      const sal = res.fourTierReports!.sal.customerReport;

      expect(sal).toContain('1. 문제의 핵심 도화선:');
      expect(sal).toContain('2. 왜 \'지금\' 갈등과 정체가 폭발했는가?');
      expect(sal).toContain('3. 현실 삶의 영역별 영향');
      expect(sal).toContain('4. 위기를 완화시키는 조력 신호');
      expect(sal).toContain('5. 시간축 분석 및 명리학적 취약 구간');
      expect(sal).toContain('6. 살진단 기반 현실 행동 주의사항');
    });

    it('PREMIUM 리포트가 사용자의 고민 핵심 단어를 직접 인용하고 공감한다', async () => {
      const res1 = await productionPipelineEngine.executePipeline(case01Input as any);
      const res2 = await productionPipelineEngine.executePipeline(case02Input as any);

      const prem1 = res1.fourTierReports!.premium.customerReport;
      const prem2 = res2.fourTierReports!.premium.customerReport;

      // CASE 01: "3년간", "연인", "다툼", "헤어짐"
      expect(prem1).toMatch(/3년간|연인|다툼|헤어짐/);
      // CASE 02: "동업자", "지분", "정산", "결별"
      expect(prem2).toMatch(/동업자|지분|정산|결별/);
    });

    it('서로 다른 사주와 고민에서 Do/Don\'t 처방이 완벽하게 차별화된다', async () => {
      const res1 = await productionPipelineEngine.executePipeline(case01Input as any); // 연애
      const res2 = await productionPipelineEngine.executePipeline(case02Input as any); // 사업
      const res3 = await productionPipelineEngine.executePipeline(case03Input as any); // 직장
      const res4 = await productionPipelineEngine.executePipeline(case04Input as any); // 재물

      const p1 = res1.fourTierReports!.premium.customerReport;
      const p2 = res2.fourTierReports!.premium.customerReport;
      const p3 = res3.fourTierReports!.premium.customerReport;
      const p4 = res4.fourTierReports!.premium.customerReport;

      expect(p1).toContain('침묵을 통한 감정 냉각');
      expect(p2).toContain('문서화');
      expect(p3).toContain('포트폴리오');
      expect(p4).toContain('자산 현황의 정밀 감사');
    });
  });
});

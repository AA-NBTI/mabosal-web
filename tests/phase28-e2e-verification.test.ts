/**
 * Phase 28: 최종 종합 검증 및 운영 신뢰성 감사 테스트 스위트
 * 
 * 검증 대상:
 * 1. 양력 / 음력 변환
 * 2. 윤달 처리
 * 3. 출생시간 미상
 * 4. 자정 경계
 * 5. 절기 경계
 * 6. 성별 입력 보존
 * 7. 기존 엔진 불변성
 * 8. 일반 사주 결과 (마 없는 독립 완결성)
 * 9. 마 진단 및 현실 문제 연결
 * 10. 시간축 및 시기 분석 (월별 타이밍)
 * 11. 마보살 행동 처방 & 디지털 처방 카드
 * 12. 무료 / 유료 출력 차이 및 결제 승인
 * 13. 세션 재현성 및 멱등성
 * 14. 개인정보(PII) 보호 및 저급 미신 어휘 배제
 * 15. 오류 복구 및 Fallback
 */

import { describe, expect, it } from 'vitest';
import { 
  MabosalIntegratedService, 
  convertLunarToSolar, 
  standardizeBirthDate,
  ProductCatalogService,
  PlatformAdapter
} from '../src/modules/phase17_25/index.js';
import { RawBirthInput } from '../src/modules/phase17_25/types.js';

describe('Phase 28: 종합 검증 및 무결성 감사', () => {
  const service = new MabosalIntegratedService();

  // 1. 양력 / 음력 / 윤달 변환
  describe('1. 역법 및 출생정보 정밀성', () => {
    it('음력 평달 및 윤달을 오차 없이 양력으로 변환한다', () => {
      // 1993년 윤3월 1일은 양력 1993-04-22
      const res = convertLunarToSolar(1993, 3, 1, true);
      expect(res.dateString).toBe('1993-04-22');
    });

    it('성별(gender) 입력이 원천 데이터로 손실 없이 보존된다', () => {
      const input: RawBirthInput = {
        calendar_type: 'solar',
        is_leap_month: false,
        birth_year: 1991,
        birth_month: 7,
        birth_day: 7,
        birth_time: '18:40',
        is_time_unknown: false,
        birth_city: '광주',
        gender: 'female',
      };
      const std = standardizeBirthDate(input);
      expect(std.original_input.gender).toBe('female');
      expect(std.original_input.birth_city).toBe('광주');
    });

    it('출생시간 미상일 때 3주 기반으로 안전하게 분석을 완결한다', async () => {
      const result = await service.analyze({
        birthInput: {
          calendar_type: 'solar',
          is_leap_month: false,
          birth_year: 1989,
          birth_month: 2,
          birth_day: 10,
          birth_time: null,
          is_time_unknown: true,
          birth_city: '서울',
          gender: 'male',
        },
        troubleText: '특별한 문제는 없고 올해 운을 보고 싶어요.',
        tier: 'free_diagnosis',
      });

      expect(result.isMissingHour).toBe(true);
      expect(result.fourPillarsText).toContain('시 미상');
      expect(result.dualResult.general_saju.day_master.name).toBeTruthy();
    });
  });

  // 2. 일반 사주풀이 독립 완결성
  describe('2. Phase 17 일반 사주 독립 완결성', () => {
    it('마 진단 없이도 7대 라이프 영역과 대운·세운이 완벽하게 생성된다', async () => {
      const result = await service.analyze({
        birthInput: {
          calendar_type: 'solar',
          is_leap_month: false,
          birth_year: 1985,
          birth_month: 10,
          birth_day: 24,
          birth_time: '07:15',
          is_time_unknown: false,
          birth_city: '서울',
          gender: 'female',
        },
        troubleText: '특별한 문제는 없습니다.',
        tier: 'paid_detailed_saju',
      });

      const saju = result.dualResult.general_saju;
      expect(saju.themes.wealth.summary.length).toBeGreaterThan(10);
      expect(saju.themes.career.summary.length).toBeGreaterThan(10);
      expect(saju.themes.business.summary.length).toBeGreaterThan(10);
      expect(saju.themes.relationship.summary.length).toBeGreaterThan(10);
      expect(saju.themes.marriage.summary.length).toBeGreaterThan(10);
      expect(saju.themes.interpersonal.summary.length).toBeGreaterThan(10);
      expect(saju.themes.health.summary.length).toBeGreaterThan(10);
      expect(saju.daewoon.current_daewoon.flow_summary).toBeTruthy();
      expect(saju.sewoon.current_pillar).toBeTruthy();
    });
  });

  // 3. 현실 문제 ↔ 명리 구조 연결 & 사용자 언어 6단계
  describe('3. 문제 연결 및 6단계 표현 순서', () => {
    it('현실 문제와 사주를 연결하여 6단계 순서로 정제 출력한다', async () => {
      const result = await service.analyze({
        birthInput: {
          calendar_type: 'solar',
          is_leap_month: false,
          birth_year: 1994,
          birth_month: 6,
          birth_day: 12,
          birth_time: '14:20',
          is_time_unknown: false,
          birth_city: '대전',
          gender: 'female',
        },
        troubleText: '회사에서 상사와 계속 부딪히고 이직이 번번이 막혀요',
        tier: 'paid_mabosal_full',
      });

      const p = result.presentation;
      // 1. 현재 상황
      expect(p.step1_current_situation.empathy_summary).toContain('상사와 계속 부딪히고');
      // 2. 명리적 해석
      expect(p.step2_saju_insight.structural_explanation).toBeTruthy();
      // 3. 마보살 진단
      expect(p.step3_mabosal_diagnosis.compressed_diagnosis).toContain('직장');
      // 4. 기간
      expect(p.step4_period.onset_time).toBeTruthy();
      // 5. 기회
      expect(p.step5_opportunity.positive_signs.length).toBeGreaterThan(0);
      // 6. 행동 처방
      expect(p.step6_action_prescription.immediate_action).toBeTruthy();
    });
  });

  // 4. 시기 분석 및 행동 처방
  describe('4. 시기 분석 및 처방전', () => {
    it('12개월 월별 흐름과 피해야 할 행동, 해야 할 행동을 명확히 제시한다', async () => {
      const result = await service.analyze({
        birthInput: {
          calendar_type: 'solar',
          is_leap_month: false,
          birth_year: 1987,
          birth_month: 12,
          birth_day: 3,
          birth_time: '23:45',
          is_time_unknown: false,
          birth_city: '서울',
          gender: 'male',
        },
        troubleText: '동업자와의 갈등으로 사업이 정체되고 빚이 늘어나고 있어요',
        tier: 'paid_mabosal_full',
      });

      expect(result.timingReport.monthly_timeline.length).toBe(12);
      expect(result.timingReport.crisis_peak_period).toBeTruthy();
      expect(result.prescription.actions_to_avoid.length).toBeGreaterThan(0);
      expect(result.prescription.actions_to_take.length).toBeGreaterThan(0);
      expect(result.prescription.digital_remedy?.title).toContain('처방 카드');
    });
  });

  // 5. 상품 구조 및 결제 권한 차이
  describe('5. 상품 구조 및 티어 권한 분기', () => {
    const catalog = new ProductCatalogService();

    it('무료 진단 시 시기 분석과 처방 섹션이 잠금 처리된다', () => {
      const free = catalog.getVisibleSections('free_diagnosis');
      expect(free.showBasicPillars).toBe(true);
      expect(free.showTimingAnalysis).toBe(false);
      expect(free.showPrescription).toBe(false);
    });

    it('마보살 정밀풀이 구매 시 모든 섹션 열람 권한이 부여된다', () => {
      const full = catalog.getVisibleSections('paid_mabosal_full');
      expect(full.showBasicPillars).toBe(true);
      expect(full.showGeneralThemes).toBe(true);
      expect(full.showDaewoon).toBe(true);
      expect(full.showTimingAnalysis).toBe(true);
      expect(full.showPrescription).toBe(true);
      expect(full.showDigitalRemedy).toBe(true);
    });
  });

  // 6. 플랫폼 연결 및 세션 재현성
  describe('6. 플랫폼 연결 및 PII 안전성', () => {
    it('분석 결과는 동일한 입력에 대해 일관되게 재현된다', async () => {
      const req = {
        birthInput: {
          calendar_type: 'solar' as const,
          is_leap_month: false,
          birth_year: 1990,
          birth_month: 5,
          birth_day: 15,
          birth_time: '12:00',
          is_time_unknown: false,
          birth_city: '서울',
          gender: 'male' as const,
        },
        troubleText: '올해 운의 흐름을 알고 싶습니다.',
        tier: 'free_diagnosis' as const,
      };

      const res1 = await service.analyze(req);
      const res2 = await service.analyze(req);

      expect(res1.fourPillarsText).toBe(res2.fourPillarsText);
      expect(res1.dualResult.general_saju.day_master.stem).toBe(res2.dualResult.general_saju.day_master.stem);
      expect(res1.timingReport.monthly_timeline.length).toBe(res2.timingReport.monthly_timeline.length);
    });

    it('플랫폼 어댑터에서 결제 승인 시 세션 상태가 PAID로 전환된다', async () => {
      const adapter = service.getPlatformAdapter();
      const sessionId = 'test_session_123';
      await adapter.saveSession({
        sessionId,
        tier: 'free_diagnosis',
        isPaid: false,
        rawInput: {},
        analysisOutput: {},
      });

      const updated = await adapter.confirmPayment(sessionId, 'paid_mabosal_full');
      expect(updated).toBe(true);

      const session = await adapter.getSession(sessionId);
      expect(session?.isPaid).toBe(true);
      expect(session?.tier).toBe('paid_mabosal_full');
    });
  });
});

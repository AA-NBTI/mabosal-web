/**
 * Phase 15: Mabosal Service Facade Tests
 * 최종 통합 서비스 파사드 엔드투엔드 테스트
 */

import { describe, it, expect } from 'vitest';
import { MabosalService } from '../src/service/mabosal-service.js';

describe('Phase 15: Mabosal Service Facade Tests', () => {
  const service = new MabosalService();

  it('기본 통합 분석 호출 시 사주 4주 테이블, 8개 표준 섹션, 21개 마 순위표가 온전히 생성되어야 한다', () => {
    const res = service.analyze({
      birthDate: '1990-05-15',
      birthTime: '10:30',
      gender: 'male',
      taste: 'standard',
      character: 'default',
    });

    // 1. 사주 테이블 검증
    expect(res.pillarsTable.year.stemKorean).toBeDefined();
    expect(res.pillarsTable.month.stemKorean).toBeDefined();
    expect(res.pillarsTable.day.stemKorean).toBeDefined();
    expect(res.pillarsTable.hour).not.toBeNull();
    expect(res.pillarsTable.hour?.stemKorean).toBeDefined();

    // 2. 8단계 표준 섹션 검증
    expect(res.sections.keySummary).toBeDefined();
    expect(res.sections.topMa.name).toBeDefined();
    expect(res.sections.topMa.score).toBeGreaterThanOrEqual(0.0);
    expect(res.sections.topMa.score).toBeLessThanOrEqual(100.0);
    expect(res.sections.topMa.band).toContain('점대');
    expect(res.sections.luckActivation).toContain('대운');
    expect(res.sections.pressureAndRisk).toBeDefined();
    expect(res.sections.opportunity).toBeDefined();
    expect(res.sections.actionAdvice).toBeDefined();
    expect(res.sections.timeDependency).toContain('4주');

    // 3. 21개 전체 마 순위표 검증
    expect(res.maRankings.length).toBe(21);
    expect(res.maRankings[0].rank).toBe(1);
    expect(res.maRankings[0].score).toBeGreaterThanOrEqual(res.maRankings[1].score); // 내림차순 정렬
    expect(res.maRankings[20].rank).toBe(21);

    // 4. 메타데이터
    expect(res.meta.version).toBe('1.0.0');
    expect(res.meta.isMissingHour).toBe(false);
  });

  it('질문(Question) 전달 시 질문 맞춤형 답변이 정확한 도메인과 타겟 마로 생성되어야 한다', () => {
    const res = service.analyze({
      birthDate: '1988-08-20',
      birthTime: '14:00',
      gender: 'female',
      question: '이번에 직장을 그만두고 새로운 사업을 시작해도 될까요?',
      taste: 'realistic',
      character: 'realistic',
    });

    expect(res.questionAnswer).toBeDefined();
    expect(res.questionAnswer?.questionText).toContain('직장을 그만두고');
    expect(res.questionAnswer?.domain).toContain('직장/사업/진로');
    expect(res.questionAnswer?.analysisText).toBeDefined();
    expect(res.sections.keySummary).toBeDefined();
  });

  it('출생시간 미상(birthTime: null) 시 시주가 null로 유지되고 시간 의존성 안내가 적시되어야 한다', () => {
    const res = service.analyze({
      birthDate: '1992-11-05',
      birthTime: null,
      gender: 'male',
    });

    // 시주 null 보존 원칙 검증
    expect(res.pillarsTable.hour).toBeNull();
    expect(res.meta.isMissingHour).toBe(true);

    // 3주 기반 정상 분석 및 신뢰도/안내 검증
    expect(res.sections.timeDependency).toContain('출생시간을 제외한 세 기둥을 기준으로 분석');
    expect(res.maRankings.length).toBe(21); // 21개 마 모두 정상 산출
  });

  it('맛(Taste)과 캐릭터(Character) 스타일에 따라 어조가 조화롭게 변환되어야 한다', () => {
    const resSpicyDirect = service.analyze({
      birthDate: '1995-03-25',
      birthTime: '08:45',
      gender: 'female',
      taste: 'spicy',
      character: 'direct',
    });

    const resWarm = service.analyze({
      birthDate: '1995-03-25',
      birthTime: '08:45',
      gender: 'female',
      taste: 'mild',
      character: 'warm',
    });

    // 문체 및 발화 차이 검증
    expect(resSpicyDirect.sections.keySummary).toContain('당신');
    expect(resWarm.sections.keySummary).toContain('벗님');

    // 계산 수치 완벽 일치 검증 (지시서 제10/15/21원칙)
    expect(resSpicyDirect.sections.topMa.score).toBe(resWarm.sections.topMa.score);
    expect(resSpicyDirect.maRankings[0].maId).toBe(resWarm.maRankings[0].maId);
  });

  it('경계시간(±15분 이내) 시 Candidate A/B 시뮬레이션 및 Consensus가 산출되어야 한다', () => {
    const res = service.analyze({
      birthDate: '1993-09-10',
      birthTime: '11:05', // 사시/오시 경계 5분 후 (경계구간 ±15분 이내)
      gender: 'male',
    });

    expect(res.boundaryAnalysis).toBeDefined();
    if (res.boundaryAnalysis) {
      expect(typeof res.boundaryAnalysis.isBoundarySensitive).toBe('boolean');
      expect(res.boundaryAnalysis.candidateA).toBeDefined();
      expect(res.boundaryAnalysis.candidateB).toBeDefined();
      expect(res.boundaryAnalysis.consensus).toBeDefined();
    }
  });
});

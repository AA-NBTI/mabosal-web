/**
 * Phase 7: E2E 실전 검증 테스트 스위트
 * 
 * 목적:
 * 실제 출생정보 입력을 기반으로 Phase 1~6 전체 파이프라인의 엔드투엔드 무결성을 검증합니다.
 * 출생일시 → P1~P4 사주 Fact → P5 MaSignalSet → Second Relationship → RSI → TimeModulatorSignal → InterpretationNode
 * 
 * 5대 실전 시나리오:
 * 1. 일반적인 표준 사주 (Balanced Case: 중화, 균형)
 * 2. 일간이 강한 사주 (Strong Case: 신강, 득령/득지)
 * 3. 일간이 약한 사주 (Weak Case: 극약, 실령/극설교가)
 * 4. 관계 충돌이 많은 사주 (Multi-Clash Case: 지지 다중 충돌)
 * 5. 경계조건 사주 (Boundary Case: 24절기 입춘 분초 경계 및 시간 미상)
 * 
 * 절대 원칙 준수:
 * - Phase 1~6 FROZEN 코드 및 규칙 불변
 * - P1~P5 BEFORE vs AFTER 원본 불변성 100% 보존
 * - 모든 InterpretationNode의 Fact Traceability 100% 보장
 * - 4단계 해석 구조(결론→근거→2차관계/RSI영향→주의) 완성도 검증
 */

import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import {
  MaFactAdapter,
  MaSignalEngine,
  MaSignalSet,
  SpouseProfile,
} from '../src/modules/ma/index.js';
import {
  Phase6Output,
  Phase6Pipeline,
  TimeModulatorGuard,
  TimeModulatorSignal,
} from '../src/modules/phase6/index.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';

interface PipelineResult {
  calendar: any;
  pillar: any;
  core: any;
  relationship: any;
  fact: any;
  signalSet: MaSignalSet;
  phase6Output: Phase6Output;
}

function runFullPipeline(
  birthDate: string,
  birthTime: string | null,
  timeModulators: TimeModulatorSignal[] = [],
  spouseProfile: SpouseProfile = { profileType: 'traditional_male' }
): PipelineResult {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const relationshipEngine = new RelationshipEngine();
  const signalEngine = new MaSignalEngine();
  const phase6Pipeline = new Phase6Pipeline();

  // P1: Calendar
  const calRes = calendarEngine.execute({
    birth_date: birthDate,
    birth_time: birthTime,
    region: 'Seoul',
  });

  // P2: Pillar
  const pillarRes = pillarEngine.execute(calRes.data);

  // P3: Saju Core
  const coreRes = sajuCoreEngine.execute(pillarRes.data);

  // P4: Relationship
  const relRes = relationshipEngine.execute({
    four_pillars: pillarRes.data.four_pillars,
  });

  // P5: Fact Adapter
  const fact = MaFactAdapter.createInputFact({
    fourPillars: pillarRes.data.four_pillars,
    sajuCore: coreRes.data,
    relationship: relRes.data,
    spouseProfile,
  });

  // P5: Ma Signal Engine
  const signalSet = signalEngine.process(fact);

  // Phase 6: Second Relationship → RSI → TimeModulatorSignal → InterpretationNode
  const phase6Output = phase6Pipeline.execute({
    fact,
    signalSet,
    timeModulatorSignals: timeModulators,
  });

  return {
    calendar: calRes.data,
    pillar: pillarRes.data,
    core: coreRes.data,
    relationship: relRes.data,
    fact,
    signalSet,
    phase6Output,
  };
}

describe('PHASE 7: Full E2E Real-World Pipeline Validation', () => {
  // Phase 6에서 생성되는 핵심 해석 테마
  const expectedCoreThemes = [
    'CAREER_ORGANIZATION',
    'WEALTH_FLOW',
    'RELATIONSHIP_BOND',
    'SAFETY_MOVEMENT',
  ];

  describe('시나리오 1: 일반적인 표준 사주 (Balanced Case)', () => {
    it('1984-05-15 14:30 표준 사주의 P1~P6 전 구간이 정상 작동하고 불변성을 유지한다', () => {
      const timeModulators: TimeModulatorSignal[] = [
        TimeModulatorGuard.createSignal({
          timeScope: 'DAEWOON',
          targetModuleId: 'ma_wealth',
          temporalTriggerState: 'ACTIVE',
          description: '대운 10년 재성 기회 국면',
        }),
      ];

      const res = runFullPipeline('1984-05-15', '14:30', timeModulators);

      // A. Calendar / Pillar 검증 (갑자년 기사월 기유일 신미시)
      expect(res.calendar.solar_datetime_formatted).toBeDefined();
      expect(res.pillar.four_pillars.year.stem).toBe('갑');
      expect(res.pillar.four_pillars.year.branch).toBe('자');
      expect(res.pillar.four_pillars.month.stem).toBe('기');
      expect(res.pillar.four_pillars.month.branch).toBe('사');
      expect(res.pillar.four_pillars.day.stem).toBe('기');
      expect(res.pillar.four_pillars.day.branch).toBe('유');
      expect(res.pillar.four_pillars.hour.stem).toBe('신');
      expect(res.pillar.four_pillars.hour.branch).toBe('미');

      // Saju Core: 중화 판정 확인
      expect(res.core.day_stem).toBe('기');
      expect(res.core.day_master_strength.classification).toBe('중화');

      // B. MaSignalSet 검증 (21개 모듈 완전성)
      expect(Object.keys(res.signalSet.signals).length).toBe(21);
      for (const sig of Object.values(res.signalSet.signals)) {
        expect(['DORMANT', 'TRIGGERED', 'ACTIVE', 'DOMINANT', 'OVERBURDENED']).toContain(sig.activation.state);
        expect(['PHASE5_CONFIRMED', 'PROVISIONAL']).toContain(sig.activation.certainty);
      }

      // C. Second Relationship 검증
      expect(Array.isArray(res.phase6Output.secondRelationships)).toBe(true);

      // D. RSI 검증
      const rsi = res.phase6Output.rsi;
      expect(['STABLE', 'MODERATE', 'FRAGILE']).toContain(rsi.cohesion);
      expect(['LOW', 'TENSE', 'CRITICAL']).toContain(rsi.tension);
      expect(['HIGH', 'PARTIAL', 'DEFICIENT']).toContain(rsi.resilience);
      expect(['SERENE', 'BALANCED_TENSION', 'TURBULENT', 'LATENT']).toContain(rsi.band);
      expect(rsi.certainty).toBe('PROVISIONAL');

      // E. Time Axis 검증
      expect(res.phase6Output.timeModulatorSignals?.length).toBe(1);
      expect(res.phase6Output.immutabilityVerified).toBe(true);

      // F. Interpretation 검증 (핵심 테마 및 4단 구조)
      const interps = res.phase6Output.interpretations;
      expect(interps.length).toBe(4);
      const generatedThemes = interps.map(n => n.theme);
      for (const t of expectedCoreThemes) {
        expect(generatedThemes).toContain(t);
      }

      for (const node of interps) {
        expect(node.interpretationId).toBeDefined();
        expect(node.primaryVerdict).toBeDefined();
        expect(node.certainty).toBe('PROVISIONAL');
        expect(node.provisionalNote).toBeDefined();

        // 4단 구조 검증
        expect(node.structure.conclusion).toBeDefined();
        expect(node.structure.basis.facts.length).toBeGreaterThan(0);
        expect(node.structure.basis.signals.length).toBeGreaterThan(0);
        expect(node.structure.relationshipAndRSIImpact).toBeDefined();
        expect(node.structure.actionableCaution).toBeDefined();

        // Fact 역추적성
        expect(node.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
        expect(Array.isArray(node.factReferences.tenGods)).toBe(true);
      }
    });
  });

  describe('시나리오 2: 일간이 강한 사주 (Strong Day Master Case)', () => {
    it('1991-09-07 12:00 신미년 병신월 경진일 임오시 신강 사주에서 강세 신호와 RSI가 적절히 형성된다', () => {
      const res = runFullPipeline('1991-09-07', '12:00');

      // 일간 득령/신강 상태 확인
      expect(res.core.day_stem).toBe('경');
      expect(res.core.day_master_strength.classification).toBe('신강');
      expect(res.core.day_master_strength.isDeukRyeong).toBe(true);
      expect(res.core.day_master_strength.totalStrengthScore).toBeGreaterThan(70);

      // 비겁/인성 및 사회 관련 Ma 신호 반응 확인
      const socialMa = res.signalSet.signals['ma_social'];
      expect(socialMa).toBeDefined();

      // RSI 검증 (비선형 매트릭스를 통한 4대 밴드 도출)
      const rsi = res.phase6Output.rsi;
      expect(rsi.band).toBeDefined();
      expect(['SERENE', 'BALANCED_TENSION', 'TURBULENT', 'LATENT']).toContain(rsi.band);

      // 불변성 및 추적성
      expect(res.phase6Output.immutabilityVerified).toBe(true);
      for (const node of res.phase6Output.interpretations) {
        expect(node.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
        expect(node.certainty).toBe('PROVISIONAL');
      }
    });
  });

  describe('시나리오 3: 일간이 약한 사주 (Weak Day Master Case)', () => {
    it('1990-05-20 20:00 경오년 신사월 을유일 병술시 극신약 사주에서 예외 판정 및 긴장 구조가 정상 유지된다', () => {
      const res = runFullPipeline('1990-05-20', '20:00');

      // 일간 극약 상태 확인 (실령, 실지, 극설교가)
      expect(res.core.day_stem).toBe('을');
      expect(res.core.day_master_strength.classification).toBe('극약');
      expect(res.core.day_master_strength.isDeukRyeong).toBe(false);
      expect(res.core.day_master_strength.totalStrengthScore).toBeLessThan(20);

      // 관살 과다로 사고마/관재마 등 긴장 신호 확인
      const accidentMa = res.signalSet.signals['ma_accident'];
      expect(accidentMa).toBeDefined();

      // 극약 사주 RSI 예외 규칙 점검 (일간 극약 시 Cohesion/Resilience 정성 처리)
      const rsi = res.phase6Output.rsi;
      expect(rsi.band).toBeDefined();
      expect(['SERENE', 'BALANCED_TENSION', 'TURBULENT', 'LATENT']).toContain(rsi.band);

      // 해석 노드 및 Fact 역추적성 확인
      expect(res.phase6Output.interpretations.length).toBe(4);
      for (const node of res.phase6Output.interpretations) {
        expect(node.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
        expect(node.certainty).toBe('PROVISIONAL');
      }
    });
  });

  describe('시나리오 4: 관계 충돌이 많은 사주 (High Conflict / Multi-Clash Case)', () => {
    it('1984-06-15 12:00 갑자년 경오월 경진일 임오시 자오충 다중 충돌에서 긴장도와 해석이 정상 작동한다', () => {
      const res = runFullPipeline('1984-06-15', '12:00');

      // 관계층 충돌 확인 (자오충 2건 발생)
      expect(res.relationship.branch_clashes.length).toBeGreaterThanOrEqual(1);
      const clashNames = res.relationship.branch_clashes.map((c: any) => c.name);
      expect(clashNames).toContain('자오충');

      // 2차 관계층에서 4대 관계 배열 생성 여부
      const secondRels = res.phase6Output.secondRelationships;
      expect(Array.isArray(secondRels)).toBe(true);

      // 충돌 다수 시 RSI 판정 확인
      const rsi = res.phase6Output.rsi;
      expect(['SERENE', 'BALANCED_TENSION', 'TURBULENT', 'LATENT']).toContain(rsi.band);

      // 안전/사고 테마 해석 노드에 충돌 영향이 반영되었는지 확인
      const safetyNode = res.phase6Output.interpretations.find(n => n.theme === 'SAFETY_MOVEMENT');
      expect(safetyNode).toBeDefined();
      expect(safetyNode?.structure.basis.facts.some(f => f.includes('지지충'))).toBe(true);
      expect(safetyNode?.structure.actionableCaution.cautionType).toBe('ACCIDENT_TENSION');
    });
  });

  describe('시나리오 5: 경계조건 사주 (Boundary Case - 24절기 입춘 경계 및 시간 미상)', () => {
    it('1990년 입춘 시각(10:15) 직전(10:14)과 직후(10:16) 경계 전환이 정확하고 파이프라인이 무결하다', () => {
      // 1990-02-04 10:14: 입춘 직전 (기사년 정축월)
      const resBefore = runFullPipeline('1990-02-04', '10:14');
      // 1990-02-04 10:16: 입춘 직후 (경오년 무인월)
      const resAfter = runFullPipeline('1990-02-04', '10:16');

      // 년주/월주 전환 검증
      expect(resBefore.pillar.four_pillars.year.stem).toBe('기');
      expect(resBefore.pillar.four_pillars.year.branch).toBe('사');
      expect(resBefore.pillar.four_pillars.month.branch).toBe('축');

      expect(resAfter.pillar.four_pillars.year.stem).toBe('경');
      expect(resAfter.pillar.four_pillars.year.branch).toBe('오');
      expect(resAfter.pillar.four_pillars.month.branch).toBe('인');

      // 양쪽 모두 21개 Ma 및 4대 해석 노드가 완전하게 산출됨
      expect(Object.keys(resBefore.signalSet.signals).length).toBe(21);
      expect(Object.keys(resAfter.signalSet.signals).length).toBe(21);

      expect(resBefore.phase6Output.interpretations.length).toBe(4);
      expect(resAfter.phase6Output.interpretations.length).toBe(4);

      expect(resBefore.phase6Output.immutabilityVerified).toBe(true);
      expect(resAfter.phase6Output.immutabilityVerified).toBe(true);
    });

    it('시간 미상(birth_time: null) 입력 시에도 파이프라인 전 구간이 안전하게 완료된다', () => {
      const resMissingHour = runFullPipeline('1985-07-20', null);

      expect(resMissingHour.pillar.four_pillars.hour).toBeNull();
      expect(Object.keys(resMissingHour.signalSet.signals).length).toBe(21);
      expect(resMissingHour.phase6Output.interpretations.length).toBe(4);
      expect(resMissingHour.phase6Output.immutabilityVerified).toBe(true);
    });
  });

  describe('가장 중요한 검증: P1~P5 BEFORE vs AFTER 원본 불변성 & Traceability', () => {
    it('Phase 6 실행 전후의 P1~P5 모든 원천 데이터가 100% 동일함을 심층 대조한다', () => {
      const calendarEngine = new CalendarEngine();
      const pillarEngine = new PillarEngine();
      const sajuCoreEngine = new SajuCoreEngine();
      const relationshipEngine = new RelationshipEngine();
      const signalEngine = new MaSignalEngine();
      const phase6Pipeline = new Phase6Pipeline();

      const cal = calendarEngine.execute({ birth_date: '1992-07-07', birth_time: '18:20' });
      const pil = pillarEngine.execute(cal.data);
      const core = sajuCoreEngine.execute(pil.data);
      const rel = relationshipEngine.execute({ four_pillars: pil.data.four_pillars });
      const fact = MaFactAdapter.createInputFact({
        fourPillars: pil.data.four_pillars,
        sajuCore: core.data,
        relationship: rel.data,
      });
      const signalSet = signalEngine.process(fact);

      // BEFORE 심층 직렬화 스냅샷
      const beforeFourPillarsJson = JSON.stringify(fact.four_pillars);
      const beforeStrengthJson = JSON.stringify(fact.day_master_strength);
      const beforeClashesJson = JSON.stringify(fact.branch_clashes);
      const beforeHarmoniesJson = JSON.stringify(fact.branch_harmonies);
      const beforeSignalsStateMap = new Map<string, any>();
      for (const [id, s] of Object.entries(signalSet.signals)) {
        beforeSignalsStateMap.set(id, {
          state: s.activation.state,
          qualitativeAxis: { ...s.qualitativeAxis },
          primaryCauses: [...s.activation.primaryCauses],
          inhibitingFactors: [...s.activation.inhibitingFactors],
          mitigatingFactors: [...s.activation.mitigatingFactors],
        });
      }

      // 3대 시간축(DAEWOON, SEWOON, WOLWOON) 동시 인입
      const timeModulators: TimeModulatorSignal[] = [
        TimeModulatorGuard.createSignal({
          timeScope: 'DAEWOON',
          targetModuleId: 'ma_career',
          temporalTriggerState: 'ACTIVE',
          description: '대운 직장 확장운',
        }),
        TimeModulatorGuard.createSignal({
          timeScope: 'SEWOON',
          targetModuleId: 'ma_wealth',
          temporalTriggerState: 'ACTIVE',
          description: '세운 재물 유입운',
        }),
        TimeModulatorGuard.createSignal({
          timeScope: 'WOLWOON',
          targetModuleId: 'ma_movement',
          temporalTriggerState: 'TRIGGERED',
          description: '월운 이동/출장운',
        }),
      ];

      // Phase 6 파이프라인 실행
      const phase6Output = phase6Pipeline.execute({
        fact,
        signalSet,
        timeModulatorSignals: timeModulators,
      });

      // AFTER 대조 검증
      // 1. P1~P4 Fact 불변
      expect(JSON.stringify(fact.four_pillars)).toBe(beforeFourPillarsJson);
      expect(JSON.stringify(fact.day_master_strength)).toBe(beforeStrengthJson);
      expect(JSON.stringify(fact.branch_clashes)).toBe(beforeClashesJson);
      expect(JSON.stringify(fact.branch_harmonies)).toBe(beforeHarmoniesJson);

      // 2. P5 MaSignalSet 불변
      for (const [id, s] of Object.entries(signalSet.signals)) {
        const before = beforeSignalsStateMap.get(id);
        expect(s.activation.state).toBe(before.state);
        expect(s.qualitativeAxis).toEqual(before.qualitativeAxis);
        expect(s.activation.primaryCauses).toEqual(before.primaryCauses);
        expect(s.activation.inhibitingFactors).toEqual(before.inhibitingFactors);
        expect(s.activation.mitigatingFactors).toEqual(before.mitigatingFactors);
      }

      // 3. 파이프라인 자체 불변 검증 플래그
      expect(phase6Output.immutabilityVerified).toBe(true);

      // 4. Traceability: 모든 InterpretationNode가 원천 Fact로 역추적 가능
      for (const node of phase6Output.interpretations) {
        expect(node.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
        for (const p of node.factReferences.pillarsInvolved) {
          expect(['year', 'month', 'day', 'hour']).toContain(p);
        }
        expect(node.certainty).toBe('PROVISIONAL');
        expect(node.provisionalNote).toBeDefined();
      }
    });
  });
});

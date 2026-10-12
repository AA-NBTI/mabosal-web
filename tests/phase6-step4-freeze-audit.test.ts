/**
 * Phase 6 STEP 4: Phase 6 전체 통합 검증 및 최종 Freeze Audit 테스트
 * 
 * 검증 항목:
 * A. Architecture: P1~P4 Fact → P5 MaSignalSet → Second Relationship → RSI → TimeModulatorSignal → InterpretationNode
 * B. Immutability: P1~P5 원본 데이터가 Phase 6 실행 전후 100% 불변 보존
 * C. Certainty: P1~P4 CONFIRMED, P5 PHASE5_CONFIRMED, Phase 6 PROVISIONAL 격리 (자동 승격 없음)
 * D. Traceability: 모든 InterpretationNode가 원천 Fact까지 완전 역추적 가능
 * E. RSI: 숫자 점수/가중평균 0% 배제, 정성 4대 Band Decision Matrix 유지
 * F. Time Axis: DAEWOON/SEWOON/WOLWOON 모듈레이터가 원국을 변경하지 않고 해석만 보조
 * G. Regression: 기존 전체 테스트 100% PASS 유지
 */

import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import {
  MaFactAdapter,
  MaSignalEngine,
  MaSignalSet,
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

describe('Phase 6 STEP 4: Final Freeze Audit & Full E2E Pipeline Tests', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const relationshipEngine = new RelationshipEngine();
  const signalEngine = new MaSignalEngine();
  const phase6Pipeline = new Phase6Pipeline();

  function runFullPipeline(birthDate = '1988-08-18', birthTime = '13:30', timeModulators: TimeModulatorSignal[] = []): {
    fact: any;
    signalSet: MaSignalSet;
    phase6Output: Phase6Output;
  } {
    // 1. Calendar (P1)
    const calRes = calendarEngine.execute({ birth_date: birthDate, birth_time: birthTime });
    // 2. Pillar (P2)
    const pillarRes = pillarEngine.execute(calRes.data);
    // 3. Saju Core (P3)
    const coreRes = sajuCoreEngine.execute(pillarRes.data);
    // 4. Relationship (P4)
    const relRes = relationshipEngine.execute({ four_pillars: pillarRes.data.four_pillars });
    // 5. Ma Fact Adapter (P5)
    const fact = MaFactAdapter.createInputFact({
      fourPillars: pillarRes.data.four_pillars,
      sajuCore: coreRes.data,
      relationship: relRes.data,
      spouseProfile: { profileType: 'traditional_male' },
    });
    // 6. Ma Signal Engine (P5)
    const signalSet = signalEngine.process(fact);

    // 7. Phase 6 Pipeline (Second Relationship → RSI → TimeModulatorSignal → InterpretationNode)
    const phase6Output = phase6Pipeline.execute({
      fact,
      signalSet,
      timeModulatorSignals: timeModulators,
    });

    return { fact, signalSet, phase6Output };
  }

  describe('A. Architecture: P1~P6 전체 E2E 파이프라인 완전성', () => {
    it('출생일시 입력부터 Phase 6 최종 해석 노드 도출까지 파이프라인이 완전 결합되어 정상 실행됨', () => {
      const { signalSet, phase6Output } = runFullPipeline();

      expect(phase6Output).toBeDefined();
      expect(phase6Output.secondRelationships).toBeDefined();
      expect(phase6Output.rsi).toBeDefined();
      expect(phase6Output.interpretations).toBeDefined();
      expect(phase6Output.interpretations.length).toBeGreaterThanOrEqual(4);
      expect(phase6Output.immutabilityVerified).toBe(true);

      // Phase 5 신호 21개 완전성 보존 확인
      expect(Object.keys(signalSet.signals).length).toBe(21);
    });
  });

  describe('B. Immutability: P1~P5 원본 데이터 불변성 검증', () => {
    it('Phase 6 연산 및 시간축 모듈레이터가 실행된 후에도 P5 MaSignalSet의 ActivationState가 100% 동일함', () => {
      const calRes = calendarEngine.execute({ birth_date: '1992-04-05', birth_time: '09:00' });
      const pillarRes = pillarEngine.execute(calRes.data);
      const coreRes = sajuCoreEngine.execute(pillarRes.data);
      const relRes = relationshipEngine.execute({ four_pillars: pillarRes.data.four_pillars });
      const fact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
      });
      const signalSet = signalEngine.process(fact);

      // 실행 전 스냅샷
      const beforeSnapshot = new Map<string, string>();
      for (const [id, sig] of Object.entries(signalSet.signals)) {
        beforeSnapshot.set(id, sig.activation.state);
      }

      // 시간축 신호 3종 동시 주입
      const timeModulators: TimeModulatorSignal[] = [
        TimeModulatorGuard.createSignal({
          timeScope: 'DAEWOON',
          targetModuleId: 'ma_career',
          temporalTriggerState: 'ACTIVE',
          description: '대운 10년 관성 강화 환경',
        }),
        TimeModulatorGuard.createSignal({
          timeScope: 'SEWOON',
          targetModuleId: 'ma_wealth',
          temporalTriggerState: 'TRIGGERED',
          description: '세운 1년 재물 기회 촉발',
        }),
        TimeModulatorGuard.createSignal({
          timeScope: 'WOLWOON',
          targetModuleId: 'ma_accident',
          temporalTriggerState: 'TRIGGERED',
          description: '월운 이동/사고 긴장 주의',
        }),
      ];

      const phase6Output = phase6Pipeline.execute({
        fact,
        signalSet,
        timeModulatorSignals: timeModulators,
      });

      expect(phase6Output.immutabilityVerified).toBe(true);

      // 실행 후 스냅샷과 원본 대조
      for (const [id, sig] of Object.entries(signalSet.signals)) {
        expect(sig.activation.state).toBe(beforeSnapshot.get(id));
      }
    });
  });

  describe('C. Certainty: 규칙 확정도 엄격 격리 검증', () => {
    it('Phase 6의 모든 산출물(Second Relationship, RSI, Interpretation)은 PROVISIONAL이며 자동 승격이 없음', () => {
      const { signalSet, phase6Output } = runFullPipeline();

      // P5 신호 확정도 보존 검증
      expect(signalSet.signals['ma_career'].activation.certainty).toBe('PHASE5_CONFIRMED');

      // Phase 6 Second Relationship 확정도 검증
      for (const rel of phase6Output.secondRelationships) {
        expect(rel.certainty).toBe('PROVISIONAL');
        expect(rel.evidenceLevel).toBe('PROVISIONAL');
        expect((rel.certainty as any)).not.toBe('PHASE6_CONFIRMED');
      }

      // Phase 6 RSI 확정도 검증
      expect(phase6Output.rsi.certainty).toBe('PROVISIONAL');
      expect((phase6Output.rsi.certainty as any)).not.toBe('PHASE6_CONFIRMED');

      // Phase 6 Interpretation 확정도 검증
      for (const node of phase6Output.interpretations) {
        expect(node.certainty).toBe('PROVISIONAL');
        expect(node.provisionalNote).toBeDefined();
        expect((node.certainty as any)).not.toBe('PHASE6_CONFIRMED');
      }
    });
  });

  describe('D. Traceability: 모든 InterpretationNode의 원천 Fact 역추적성 검증', () => {
    it('모든 해석 노드가 원천 십신/궁위/관계 Fact ID를 보유하며 누락이 없음', () => {
      const { phase6Output } = runFullPipeline();

      for (const node of phase6Output.interpretations) {
        expect(node.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
        expect(Array.isArray(node.factReferences.tenGods)).toBe(true);
        expect(Array.isArray(node.factReferences.relationshipsUsed)).toBe(true);
        expect(node.structure.basis.facts.length).toBeGreaterThan(0);
      }
    });
  });

  describe('E. RSI: 비선형 정성 판정 및 시간축 비간섭 검증', () => {
    it('RSI는 숫자 점수 없이 4대 밴드(SERENE/BALANCED_TENSION/TURBULENT/LATENT)로만 산출되며, 시간축에 의해 원국값이 변경되지 않음', () => {
      // 시간축 없이 실행
      const res1 = runFullPipeline('1990-06-15', '11:00', []);
      const pureRsiBand = res1.phase6Output.rsi.band;

      // 시간축 주입 후 실행
      const timeModulators = [
        TimeModulatorGuard.createSignal({
          timeScope: 'SEWOON',
          targetModuleId: 'ma_accident',
          temporalTriggerState: 'TRIGGERED',
          description: '세운 변동성 자극',
        }),
      ];
      const res2 = runFullPipeline('1990-06-15', '11:00', timeModulators);

      // 시간축이 개입해도 순수 원국 RSI 밴드는 완전히 동일해야 함 (RSI 원국값 변경 금지)
      expect(res2.phase6Output.rsi.band).toBe(pureRsiBand);
      expect(['SERENE', 'BALANCED_TENSION', 'TURBULENT', 'LATENT']).toContain(res2.phase6Output.rsi.band);

      // 숫자 점수 전무 확인
      expect((res2.phase6Output.rsi as any).score).toBeUndefined();
    });
  });

  describe('F. Time Axis Modulator: DAEWOON/SEWOON/WOLWOON 연결 및 해석 보조 검증', () => {
    it('시간축 신호가 Interpretation 단계에 temporalContext로 온전히 전달되어 시점 의미를 보조함', () => {
      const timeModulators: TimeModulatorSignal[] = [
        TimeModulatorGuard.createSignal({
          timeScope: 'DAEWOON',
          targetModuleId: 'ma_career',
          temporalTriggerState: 'ACTIVE',
          description: '대운 10년 관인상생 호황기 진입',
        }),
      ];

      const { phase6Output } = runFullPipeline('1985-01-20', '08:00', timeModulators);

      expect(phase6Output.timeModulatorSignals).toBeDefined();
      expect(phase6Output.timeModulatorSignals?.length).toBe(1);

      // 커리어 해석 노드에 temporalContext가 반영되었는지 확인
      const careerNode = phase6Output.interpretations.find(n => n.theme === 'CAREER_ORGANIZATION');
      expect(careerNode?.structure.temporalContext).toBeDefined();
      expect(careerNode?.structure.temporalContext?.[0].timeScope).toBe('DAEWOON');
      expect(careerNode?.structure.temporalContext?.[0].description).toContain('호황기');
    });
  });
});

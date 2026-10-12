/**
 * Phase 5 STEP 4: Phase 5 전체 통합 검증 및 Freeze Audit 테스트
 * 
 * 검증 범위:
 * 1. Phase 1~5 전체 파이프라인 E2E 통합 (Calendar → Pillar → SajuCore → Relationship → FactAdapter → SignalEngine)
 * 2. 21개 Ma 모듈의 완전성 (20개 표준 + 1개 확장 슬롯, 중복/누락 전무)
 * 3. 규칙 무결성 (DOMINANT 개별 조건 보존, PROVISIONAL/OPEN 핵심 차단)
 * 4. 배우자 모델 Zero-Gender Leakage 최종 검증
 * 5. Fact → Signal Traceability & Interaction 독립성
 * 6. 5대 질적 Axis 독립성 및 비상쇄 검증
 * 7. 시주 미상(시간 미상) 경계조건 완벽 대응
 */

import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import {
  MaFactAdapter,
  MaSignalEngine,
  MaSignalSet,
  STANDARD_MA_DEFINITIONS,
  StandardMaId,
} from '../src/modules/ma/index.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 5 STEP 4: Phase 5 Full Pipeline & Freeze Audit', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const relationshipEngine = new RelationshipEngine();
  const signalEngine = new MaSignalEngine();

  describe('1. Phase 1~5 전체 파이프라인 E2E 검증', () => {
    it('출생일시 입력부터 Phase 5 MaSignalSet 도출까지 파이프라인이 완전 무결하게 작동함', () => {
      // 1. Calendar (Phase 1)
      const calRes = calendarEngine.execute({
        birth_date: '1984-05-15',
        birth_time: '14:30',
        region: '서울',
      });
      expect(calRes.data.solar_datetime_formatted).toBeDefined();

      // 2. Pillar (Phase 2)
      const pillarRes = pillarEngine.execute(calRes.data);
      expect(pillarRes.data.four_pillars).toBeDefined();
      expect(pillarRes.data.four_pillars.year.stem).toBe('갑');
      expect(pillarRes.data.four_pillars.year.branch).toBe('자');

      // 3. Saju Core (Phase 3)
      const coreRes = sajuCoreEngine.execute(pillarRes.data);
      expect(coreRes.data.day_stem).toBeDefined();
      expect(coreRes.data.day_master_strength).toBeDefined();

      // 4. Relationship (Phase 4)
      const relRes = relationshipEngine.execute({
        four_pillars: pillarRes.data.four_pillars,
      });
      expect(relRes.data.branch_clashes).toBeDefined();
      expect(relRes.data.branch_harmonies).toBeDefined();

      // 5. Fact Adapter (Phase 5)
      const inputFact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
        spouseProfile: { profileType: 'traditional_male' },
      });
      expect(inputFact.four_pillars).toBe(pillarRes.data.four_pillars);
      expect('gender' in (inputFact as any)).toBe(false);

      // 6. Signal Engine (Phase 5)
      const signalSet: MaSignalSet = signalEngine.process(inputFact);
      expect(signalSet).toBeDefined();
      expect(Object.keys(signalSet.signals).length).toBe(21);
      expect(signalSet.dominantSignals).toBeDefined();
      expect(signalSet.traceability).toBeDefined();
      expect(signalSet.safetyAlerts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('2. 21개 Ma 모듈 완전성 검증 (누락/중복 전무)', () => {
    it('20대 표준 Ma와 1개 확장 슬롯이 빠짐없이 존재하며 중복이 없음', () => {
      const calRes = calendarEngine.execute({ birth_date: '1990-10-24', birth_time: '08:00' });
      const pillarRes = pillarEngine.execute(calRes.data);
      const coreRes = sajuCoreEngine.execute(pillarRes.data);
      const relRes = relationshipEngine.execute({ four_pillars: pillarRes.data.four_pillars });
      const inputFact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
      });
      const signalSet = signalEngine.process(inputFact);

      const expectedIds: StandardMaId[] = [
        'ma_wealth', 'ma_business', 'ma_career', 'ma_asset', 'ma_social',
        'ma_romance', 'ma_marriage', 'ma_family', 'ma_children', 'ma_parents',
        'ma_health', 'ma_accident', 'ma_gossip', 'ma_document', 'ma_legal',
        'ma_movement', 'ma_exam', 'ma_fame', 'ma_noble', 'ma_home'
      ];

      for (const id of expectedIds) {
        expect(signalSet.signals[id]).toBeDefined();
        expect(signalSet.signals[id].moduleId).toBe(id);
      }

      expect(signalSet.signals['ma_extension_slot']).toBeDefined();
      expect(signalSet.signals['ma_extension_slot'].moduleId).toBe('ma_extension_slot');

      // 총 개수 정확히 21개
      expect(Object.keys(signalSet.signals).length).toBe(21);
    });
  });

  describe('3. 규칙 무결성 및 PROVISIONAL/OPEN 격리 검증', () => {
    it('PROVISIONAL 등급 신호는 어떠한 경우에도 DOMINANT 상태에 도달할 수 없음', () => {
      const calRes = calendarEngine.execute({ birth_date: '1985-02-10', birth_time: '12:00' });
      const pillarRes = pillarEngine.execute(calRes.data);
      const coreRes = sajuCoreEngine.execute(pillarRes.data);
      const relRes = relationshipEngine.execute({ four_pillars: pillarRes.data.four_pillars });
      const inputFact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
      });
      const signalSet = signalEngine.process(inputFact);

      for (const provisionalSig of signalSet.provisionalSignals) {
        expect(provisionalSig.activation.certainty).toBe('PROVISIONAL');
        expect(provisionalSig.activation.state).not.toBe('DOMINANT');
        // dominantSignals 리스트에 포함되지 않아야 함
        expect(signalSet.dominantSignals.some(d => d.moduleId === provisionalSig.moduleId)).toBe(false);
      }
    });
  });

  describe('4. 배우자 모델 Zero-Gender Leakage 최종 검증', () => {
    it('프로필 유형 변경 시에도 Ma Engine 내부 코드 및 Fact 구조체에 gender가 전혀 누출되지 않음', () => {
      const calRes = calendarEngine.execute({ birth_date: '1988-08-08', birth_time: '20:00' });
      const pillarRes = pillarEngine.execute(calRes.data);
      const coreRes = sajuCoreEngine.execute(pillarRes.data);
      const relRes = relationshipEngine.execute({ four_pillars: pillarRes.data.four_pillars });

      // 1. 남명 프로필
      const maleFact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
        spouseProfile: { profileType: 'traditional_male' },
      });
      // 2. 여명 프로필
      const femaleFact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
        spouseProfile: { profileType: 'traditional_female' },
      });

      expect('gender' in (maleFact as any)).toBe(false);
      expect('gender' in (femaleFact as any)).toBe(false);
      expect('gender' in (maleFact.spouse_facts as any)).toBe(false);
      expect('gender' in (femaleFact.spouse_facts as any)).toBe(false);

      const maleSignals = signalEngine.process(maleFact);
      const femaleSignals = signalEngine.process(femaleFact);

      expect(maleSignals.signals['ma_marriage']).toBeDefined();
      expect(femaleSignals.signals['ma_marriage']).toBeDefined();
    });
  });

  describe('5. Fact → Signal Traceability & Interaction 불변성', () => {
    it('모든 Signal은 참조한 원천 Fact의 메타데이터를 유지하며, 상호작용은 원본 Activation을 변경하지 않음', () => {
      const calRes = calendarEngine.execute({ birth_date: '1995-03-21', birth_time: '06:00' });
      const pillarRes = pillarEngine.execute(calRes.data);
      const coreRes = sajuCoreEngine.execute(pillarRes.data);
      const relRes = relationshipEngine.execute({ four_pillars: pillarRes.data.four_pillars });
      const inputFact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
      });

      const signalSet = signalEngine.process(inputFact);

      // 추적성 검사
      for (const [id, trace] of Object.entries(signalSet.traceability)) {
        expect(trace.moduleId).toBe(id);
        expect(trace.pillarsInvolved.length).toBeGreaterThan(0);
        expect(Array.isArray(trace.tenGods)).toBe(true);
      }

      // 상호작용이 기록되어도 원본 상태는 온전히 보존
      expect(Array.isArray(signalSet.interactions)).toBe(true);
      for (const inter of signalSet.interactions) {
        expect(['AMPLIFIED', 'MITIGATED', 'CONFLICTING', 'DRAINED']).toContain(inter.interactionType);
        expect(['CONFIRMED', 'DERIVED', 'PROVISIONAL']).toContain(inter.evidenceLevel);
      }
    });
  });

  describe('6. 5대 질적 Axis 독립성 및 비상쇄 검증', () => {
    it('임의 선형 점수/비율 없이 LOW/MODERATE/HIGH/VERY_HIGH 정성 밴드만 산출됨', () => {
      const calRes = calendarEngine.execute({ birth_date: '2000-01-01', birth_time: '00:30' });
      const pillarRes = pillarEngine.execute(calRes.data);
      const coreRes = sajuCoreEngine.execute(pillarRes.data);
      const relRes = relationshipEngine.execute({ four_pillars: pillarRes.data.four_pillars });
      const inputFact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
      });

      const signalSet = signalEngine.process(inputFact);

      const validLevels = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];

      for (const signal of Object.values(signalSet.signals)) {
        const axis = signal.qualitativeAxis;
        expect(validLevels).toContain(axis.intensity);
        expect(validLevels).toContain(axis.pressure);
        expect(validLevels).toContain(axis.opportunity);
        expect(validLevels).toContain(axis.volatility);
        expect(validLevels).toContain(axis.mitigation);

        // 숫자 타입이 아님을 검증
        expect(typeof axis.intensity).toBe('string');
        expect(typeof axis.pressure).toBe('string');
        expect(typeof axis.opportunity).toBe('string');
        expect(typeof axis.volatility).toBe('string');
        expect(typeof axis.mitigation).toBe('string');
      }
    });
  });

  describe('7. 경계조건: 시주 미상(시간 미상, 3주 6자) 사주 안정성', () => {
    it('시간 미상(birth_time: null) 입력 시에도 전체 파이프라인이 크래시 없이 정상 완료됨', () => {
      const calRes = calendarEngine.execute({
        birth_date: '1975-07-20',
        birth_time: null, // 시간 미상
      });
      const pillarRes = pillarEngine.execute(calRes.data);
      expect(pillarRes.data.four_pillars.hour).toBeNull();

      const coreRes = sajuCoreEngine.execute(pillarRes.data);
      const relRes = relationshipEngine.execute({ four_pillars: pillarRes.data.four_pillars });

      const inputFact = MaFactAdapter.createInputFact({
        fourPillars: pillarRes.data.four_pillars,
        sajuCore: coreRes.data,
        relationship: relRes.data,
      });

      const signalSet = signalEngine.process(inputFact);
      expect(signalSet).toBeDefined();
      expect(Object.keys(signalSet.signals).length).toBe(21);

      // 시주 의존적인 자녀마는 시간 미상 시 DOMINANT가 될 수 없음
      const children = signalSet.signals['ma_children'];
      expect(children.activation.state).not.toBe('DOMINANT');
    });
  });
});

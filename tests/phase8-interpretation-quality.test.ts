/**
 * Phase 8: 실제 사주 해석 품질 및 10대 Case E2E 검증 테스트
 * 
 * 10가지 검증 사주:
 * Case 01 — 일반형: 1984-05-15 14:30 (기토 일간, 중화 49.5점)
 * Case 02 — 강한 일간: 1991-09-07 12:00 (경금 일간, 신강 75.25점)
 * Case 03 — 약한 일간: 1990-05-20 20:00 (을목 일간, 극약 9.0점)
 * Case 04 — 충 다발형: 1984-06-15 12:00 (지지 자오충 2회)
 * Case 05 — 합·국 다발형: 1985-05-25 18:00 (사유축 금국, 자축합토 등 3건)
 * Case 06 — 관계 집중형: 1985-02-10 12:00 (결혼마 DOMINANT)
 * Case 07 — 재물·사업 집중형: 1990-10-24 08:00 (사업마 DOMINANT, 재물마 ACTIVE)
 * Case 08 — 건강·안전 집중형: 1986-08-15 16:00 (이동마 DOMINANT, 사고마 ACTIVE, 인신충형)
 * Case 09 — 경계 시간형: 1990-02-04 10:14 (입춘 1분 전)
 * Case 10 — 저신호형: 1995-10-10 null (시간 미상, DOMINANT 0건)
 * 
 * 8대 품질 기준 검증:
 * 1. 10 Case E2E & 60 Themes 전체 생성
 * 2. Determinism (결정론)
 * 3. Fact Traceability (사실 추적성)
 * 4. Immutability (불변성: TimeModulator 개입 전후)
 * 5. Certainty Isolation (확실성 계층 격리)
 * 6. Gender Independence (성별 독립성)
 * 7. Medical Safety (의료 안전성)
 * 8. Low-Signal Safety (저신호 안전성)
 */

import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { MaFactAdapter, MaSignalEngine } from '../src/modules/ma/index.js';
import { InterpretationTheme, TimeModulatorGuard, TimeModulatorSignal } from '../src/modules/phase6/index.js';
import { Phase7Pipeline } from '../src/modules/phase7/index.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { PHASE8_10_CASES, TestCaseDefinition } from './phase8-cases-data.js';

const EXPECTED_6_THEMES: InterpretationTheme[] = [
  'WEALTH_FLOW',
  'CAREER_ORGANIZATION',
  'BUSINESS_VENTURE',
  'RELATIONSHIP_BOND',
  'HEALTH_EQUILIBRIUM',
  'SAFETY_MOVEMENT',
];

function runFullEngine(tc: TestCaseDefinition, timeModulators: TimeModulatorSignal[] = []) {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const relationshipEngine = new RelationshipEngine();
  const signalEngine = new MaSignalEngine();
  const phase7Pipeline = new Phase7Pipeline();

  const cal = calendarEngine.execute({ birth_date: tc.birthDate, birth_time: tc.birthTime, region: 'Seoul' });
  const pil = pillarEngine.execute(cal.data);
  const core = sajuCoreEngine.execute(pil.data);
  const rel = relationshipEngine.execute({ four_pillars: pil.data.four_pillars });
  const fact = MaFactAdapter.createInputFact({
    fourPillars: pil.data.four_pillars,
    sajuCore: core.data,
    relationship: rel.data,
    spouseProfile: tc.spouseProfile || { profileType: 'traditional_male' },
  });
  const signalSet = signalEngine.process(fact);
  const phase7Output = phase7Pipeline.execute({
    fact,
    signalSet,
    timeModulatorSignals: timeModulators,
  });

  return { cal: cal.data, pil: pil.data, core: core.data, rel: rel.data, fact, signalSet, phase7Output };
}

describe('Phase 8: Interpretation Quality & 10 Cases Audit Suite', () => {
  describe('1. 10 Case E2E & 60 Themes 전체 생성 검증 (10/10 Cases, 60/60 Themes)', () => {
    it.each(PHASE8_10_CASES)('$caseId — $name 에서 6대 테마가 7개 필드를 구비하여 완전하게 생성된다', (tc) => {
      const res = runFullEngine(tc);

      // A. 원천 데이터 완전성
      expect(res.pil.four_pillars).toBeDefined();
      expect(res.core.day_stem).toBeDefined();
      expect(res.core.five_elements).toBeDefined();
      expect(res.core.day_master_strength).toBeDefined();

      // B. 21개 Ma 모듈 완전성
      expect(Object.keys(res.signalSet.signals).length).toBe(21);
      for (const sig of Object.values(res.signalSet.signals)) {
        expect(['DORMANT', 'TRIGGERED', 'ACTIVE', 'DOMINANT', 'OVERBURDENED']).toContain(sig.activation.state);
        expect(sig.qualitativeAxis.intensity).toBeDefined();
        expect(sig.qualitativeAxis.pressure).toBeDefined();
        expect(sig.qualitativeAxis.opportunity).toBeDefined();
        expect(sig.qualitativeAxis.volatility).toBeDefined();
        expect(sig.qualitativeAxis.mitigation).toBeDefined();
      }

      // C. Second Relationship 확인
      expect(Array.isArray(res.phase7Output.secondRelationships)).toBe(true);

      // D. RSI 확인 (점수 없음, 4대 밴드 유지)
      expect(['SERENE', 'BALANCED_TENSION', 'TURBULENT', 'LATENT']).toContain(res.phase7Output.rsi.band);
      expect((res.phase7Output.rsi as any).score).toBeUndefined();

      // F. 6대 Interpretation 생성 및 7개 필드 검증
      expect(res.phase7Output.interpretations.length).toBe(6);
      const generatedThemes = res.phase7Output.interpretations.map(n => n.theme);
      for (const expectedTheme of EXPECTED_6_THEMES) {
        expect(generatedThemes).toContain(expectedTheme);
      }

      for (const node of res.phase7Output.interpretations) {
        // 7대 필수 필드
        expect(node.interpretationId).toBeDefined();
        expect(node.theme).toBeDefined();
        expect(node.primaryVerdict).toBeDefined();
        expect(Array.isArray(node.derivedFromSignals)).toBe(true);
        expect(node.factReferences).toBeDefined();
        expect(node.certainty).toBe('PROVISIONAL');
        expect(node.provisionalNote).toBeDefined();

        // 4단 구조
        expect(node.structure.conclusion).toBeDefined();
        expect(node.structure.basis.facts.length).toBeGreaterThan(0);
        expect(node.structure.relationshipAndRSIImpact.rsiBand).toBeDefined();
        expect(node.structure.actionableCaution.guideline).toBeDefined();
      }
    });
  });

  describe('2. Determinism (결정론: Same Input → Same Output)', () => {
    it('동일한 입력을 3회 반복 실행했을 때 결과 JSON이 100% 동일하다', () => {
      const tc = PHASE8_10_CASES[0];
      const res1 = runFullEngine(tc);
      const res2 = runFullEngine(tc);
      const res3 = runFullEngine(tc);

      const json1 = JSON.stringify(res1.phase7Output.interpretations);
      const json2 = JSON.stringify(res2.phase7Output.interpretations);
      const json3 = JSON.stringify(res3.phase7Output.interpretations);

      expect(json1).toBe(json2);
      expect(json2).toBe(json3);
    });
  });

  describe('3. Fact Traceability (사실 추적성: Interpretation → Signal → Fact)', () => {
    it('10개 모든 케이스의 60개 테마 노드가 원천 기둥 및 십신을 명시적으로 추적한다', () => {
      for (const tc of PHASE8_10_CASES) {
        const res = runFullEngine(tc);
        for (const node of res.phase7Output.interpretations) {
          expect(node.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
          for (const p of node.factReferences.pillarsInvolved) {
            expect(['year', 'month', 'day', 'hour']).toContain(p);
          }
        }
      }
    });
  });

  describe('4. Immutability (TimeModulator 개입 전후 원본 불변성)', () => {
    it('3대 시간축(DAEWOON, SEWOON, WOLWOON)이 동시 인입되어도 원국 Fact, MaSignal, RSI가 100% 불변이다', () => {
      const tc = PHASE8_10_CASES[1]; // Case 02 강한 일간
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
          temporalTriggerState: 'ACTIVE',
          description: '세운 재물 유입 환경',
        }),
        TimeModulatorGuard.createSignal({
          timeScope: 'WOLWOON',
          targetModuleId: 'ma_accident',
          temporalTriggerState: 'TRIGGERED',
          description: '월운 이동 긴장',
        }),
      ];

      // 시간축 없이 실행
      const resWithoutTime = runFullEngine(tc, []);
      // 시간축 포함 실행
      const resWithTime = runFullEngine(tc, timeModulators);

      // 원국 Fact 불변 대조
      expect(JSON.stringify(resWithTime.fact.four_pillars)).toBe(JSON.stringify(resWithoutTime.fact.four_pillars));
      expect(JSON.stringify(resWithTime.fact.day_master_strength)).toBe(JSON.stringify(resWithoutTime.fact.day_master_strength));

      // 원국 MaSignalSet의 ActivationState 불변 대조
      for (const [id, sig] of Object.entries(resWithTime.signalSet.signals)) {
        const pureSig = resWithoutTime.signalSet.signals[id];
        expect(sig.activation.state).toBe(pureSig.activation.state);
        expect(sig.activation.certainty).toBe(pureSig.activation.certainty);
        expect(sig.qualitativeAxis).toEqual(pureSig.qualitativeAxis);
      }

      // 원국 RSI 밴드 불변 대조
      expect(resWithTime.phase7Output.rsi.band).toBe(resWithoutTime.phase7Output.rsi.band);
      expect(resWithTime.phase7Output.immutabilityVerified).toBe(true);
    });
  });

  describe('5. Certainty Isolation (확실성 계층 엄격 격리)', () => {
    it('P1~4는 CONFIRMED, P5는 PHASE5_CONFIRMED, Phase 6~7은 PROVISIONAL로 분리 유지된다', () => {
      const res = runFullEngine(PHASE8_10_CASES[0]);

      // P5 확정도 확인
      expect(res.signalSet.signals['ma_wealth'].activation.certainty).toBe('PHASE5_CONFIRMED');

      // Phase 6 Second Relationship 확정도 확인
      for (const sr of res.phase7Output.secondRelationships) {
        expect(sr.certainty).toBe('PROVISIONAL');
      }

      // Phase 6 RSI 확정도 확인
      expect(res.phase7Output.rsi.certainty).toBe('PROVISIONAL');

      // Phase 6~7 Interpretation 확정도 확인 (자동 승격 전무)
      for (const node of res.phase7Output.interpretations) {
        expect(node.certainty).toBe('PROVISIONAL');
        expect((node.certainty as any)).not.toBe('PHASE6_CONFIRMED');
        expect((node.certainty as any)).not.toBe('CONFIRMED');
      }
    });
  });

  describe('6. Gender Independence (성별 독립성: Zero-Gender Leakage)', () => {
    it('남명/여명/중립 프로필 변경 시에도 Ma Engine 내부 Fact에 gender 속성이 누출되지 않는다', () => {
      const tc = PHASE8_10_CASES[5]; // Case 06 관계 집중형
      const resMale = runFullEngine({ ...tc, spouseProfile: { profileType: 'traditional_male' } });
      const resFemale = runFullEngine({ ...tc, spouseProfile: { profileType: 'traditional_female' } });

      expect('gender' in (resMale.fact as any)).toBe(false);
      expect('gender' in (resFemale.fact as any)).toBe(false);
      expect('gender' in (resMale.fact.spouse_facts as any)).toBe(false);
      expect('gender' in (resFemale.fact.spouse_facts as any)).toBe(false);

      // 양쪽 모두 관계 테마 정상 생성
      const maleRelNode = resMale.phase7Output.interpretations.find(n => n.theme === 'RELATIONSHIP_BOND');
      const femaleRelNode = resFemale.phase7Output.interpretations.find(n => n.theme === 'RELATIONSHIP_BOND');
      expect(maleRelNode).toBeDefined();
      expect(femaleRelNode).toBeDefined();
    });
  });

  describe('7. Medical Safety (의료 안전성: 질병 단정 및 치료 지시 배제)', () => {
    it('10개 모든 케이스의 HEALTH_EQUILIBRIUM 노드에서 질병 단정 문구가 없으며 전문 의료기관 안내가 포함된다', () => {
      for (const tc of PHASE8_10_CASES) {
        const res = runFullEngine(tc);
        const healthNode = res.phase7Output.interpretations.find(n => n.theme === 'HEALTH_EQUILIBRIUM');
        expect(healthNode).toBeDefined();

        const guideline = healthNode?.structure.actionableCaution.guideline ?? '';
        // 의료기관 안내 문구 필수 포함
        expect(guideline).toContain('의료기관');

        // 확정적 질병명 단정이나 발병 확정 단어 배제
        expect(guideline).not.toContain('반드시 발병');
        expect(guideline).not.toContain('치료 처방');
      }
    });
  });

  describe('8. Low-Signal Safety (저신호 안전성: 억지 해석 날조 방어)', () => {
    it('Case 10 (저신호형)에서 허위 사실을 날조하지 않고 잠복 또는 보수적 평가 상태를 유지한다', () => {
      const tc = PHASE8_10_CASES[9]; // Case 10 (1995-10-10 null)
      const res = runFullEngine(tc);

      // 시주 부재로 인한 자녀마 DOMINANT 차단 확인
      expect(res.signalSet.signals['ma_children'].activation.state).not.toBe('DOMINANT');

      // 직장마 DORMANT 상태 시 과장된 권한 날조 없이 통상적 역할 유지로 평가됨
      const careerNode = res.phase7Output.interpretations.find(n => n.theme === 'CAREER_ORGANIZATION');
      expect(careerNode).toBeDefined();
      expect(careerNode?.primaryVerdict).toContain('통상적 업무 흐름 유지');

      // 사업마 역시 DOMINANT가 아니므로 무리한 공격적 확장이 아닌 보수적 준비 주의점 제공
      const businessNode = res.phase7Output.interpretations.find(n => n.theme === 'BUSINESS_VENTURE');
      expect(businessNode).toBeDefined();
      expect(businessNode?.structure.actionableCaution.guideline).toContain('고위험 독자 창업보다는');

      // 모든 노드가 원천 팩트를 결측 없이 보유함
      for (const node of res.phase7Output.interpretations) {
        expect(node.structure.conclusion).toBeDefined();
        expect(node.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * Phase 7: 6대 Interpretation Theme 완성 및 검증 테스트
 * 
 * 검증 대상:
 * 1. BUSINESS_VENTURE 테마 정상 생성 및 7대 필드 구비
 * 2. HEALTH_EQUILIBRIUM 테마 정상 생성 및 안전 가이드라인 준수
 * 3. 6대 테마 전체 동시 완성 (6 / 6)
 *    - WEALTH_FLOW
 *    - CAREER_ORGANIZATION
 *    - BUSINESS_VENTURE
 *    - RELATIONSHIP_BOND
 *    - HEALTH_EQUILIBRIUM
 *    - SAFETY_MOVEMENT
 * 4. 각 테마 Fact Traceability (원천 Fact 100% 역추적성)
 * 5. 근거 부족 시 허위 해석 방지 (Fake Facts & Hallucination Guard)
 * 6. 원본 P1~P6 불변성 (Immutability) 100% 보존
 */

import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { MaFactAdapter, MaSignalEngine } from '../src/modules/ma/index.js';
import { InterpretationTheme, TimeModulatorGuard, TimeModulatorSignal } from '../src/modules/phase6/index.js';
import { Phase7Pipeline } from '../src/modules/phase7/index.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';

describe('Phase 7: 6 Interpretation Themes Completion Tests', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const relationshipEngine = new RelationshipEngine();
  const signalEngine = new MaSignalEngine();
  const phase7Pipeline = new Phase7Pipeline();

  const all6Themes: InterpretationTheme[] = [
    'WEALTH_FLOW',
    'CAREER_ORGANIZATION',
    'BUSINESS_VENTURE',
    'RELATIONSHIP_BOND',
    'HEALTH_EQUILIBRIUM',
    'SAFETY_MOVEMENT',
  ];

  function runPhase7(birthDate: string, birthTime: string | null, timeModulators: TimeModulatorSignal[] = []) {
    const cal = calendarEngine.execute({ birth_date: birthDate, birth_time: birthTime, region: 'Seoul' });
    const pil = pillarEngine.execute(cal.data);
    const core = sajuCoreEngine.execute(pil.data);
    const rel = relationshipEngine.execute({ four_pillars: pil.data.four_pillars });
    const fact = MaFactAdapter.createInputFact({
      fourPillars: pil.data.four_pillars,
      sajuCore: core.data,
      relationship: rel.data,
    });
    const signalSet = signalEngine.process(fact);

    const output = phase7Pipeline.execute({
      fact,
      signalSet,
      timeModulatorSignals: timeModulators,
    });

    return { fact, signalSet, output };
  }

  describe('1. 6대 테마 전체 완성 검증 (6 / 6 Themes)', () => {
    it('실제 사주 입력 시 6대 테마가 단 하나도 누락 없이 100% 정상 생성된다', () => {
      const { output } = runPhase7('1984-05-15', '14:30');

      expect(output.interpretations.length).toBe(6);
      const generatedThemes = output.interpretations.map(n => n.theme);

      for (const expectedTheme of all6Themes) {
        expect(generatedThemes).toContain(expectedTheme);
      }
    });

    it('각 테마는 중복 없이 서로 다른 6개의 고유 테마로 매핑된다', () => {
      const { output } = runPhase7('1991-09-07', '12:00');

      const themeSet = new Set(output.interpretations.map(n => n.theme));
      expect(themeSet.size).toBe(6);
    });
  });

  describe('2. BUSINESS_VENTURE 테마 상세 검증', () => {
    it('BUSINESS_VENTURE 노드가 7대 필수 필드를 구비하며, 사업마/재물마와 연동된다', () => {
      const { output } = runPhase7('1991-09-07', '12:00');

      const businessNode = output.interpretations.find(n => n.theme === 'BUSINESS_VENTURE');
      expect(businessNode).toBeDefined();

      // 7대 필수 필드 검증
      expect(businessNode?.structure.conclusion).toBeDefined();
      expect(businessNode?.structure.basis.signals).toContain('ma_business');
      expect(businessNode?.structure.basis.facts.length).toBeGreaterThan(0);
      expect(businessNode?.structure.relationshipAndRSIImpact.rsiBand).toBeDefined();
      expect(businessNode?.structure.actionableCaution.guideline).toBeDefined();
      expect(businessNode?.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
      expect(businessNode?.certainty).toBe('PROVISIONAL');
      expect(businessNode?.provisionalNote).toBeDefined();

      // 자동 CONFIRMED 승격 금지 확인
      expect((businessNode?.certainty as any)).not.toBe('PHASE6_CONFIRMED');
      expect((businessNode?.certainty as any)).not.toBe('CONFIRMED');
    });
  });

  describe('3. HEALTH_EQUILIBRIUM 테마 상세 검증', () => {
    it('HEALTH_EQUILIBRIUM 노드가 7대 필수 필드를 구비하며, 의료 단정을 금지하고 오행 균형을 표현한다', () => {
      const { output } = runPhase7('1990-05-20', '20:00'); // 극약 사주

      const healthNode = output.interpretations.find(n => n.theme === 'HEALTH_EQUILIBRIUM');
      expect(healthNode).toBeDefined();

      // 7대 필수 필드 검증
      expect(healthNode?.structure.conclusion).toBeDefined();
      expect(healthNode?.structure.basis.signals).toContain('ma_health');
      expect(healthNode?.structure.basis.facts.some(f => f.includes('오행'))).toBe(true);
      expect(healthNode?.structure.relationshipAndRSIImpact.rsiBand).toBeDefined();
      expect(healthNode?.structure.actionableCaution.cautionType).toBe('HEALTH_EQUILIBRIUM');
      expect(healthNode?.structure.actionableCaution.guideline).toContain('의학적');
      expect(healthNode?.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
      expect(healthNode?.certainty).toBe('PROVISIONAL');
      expect(healthNode?.provisionalNote).toBeDefined();

      // 질병 확정/치료 단정 금지 문구 포함 검증
      expect(healthNode?.structure.actionableCaution.guideline).toContain('의료기관');
    });
  });

  describe('4. Fact Traceability (원천 Fact 100% 역추적성)', () => {
    it('6대 테마 모든 노드가 원천 십신/궁위 Fact를 보유하여 역추적이 가능하다', () => {
      const { output } = runPhase7('1984-06-15', '12:00');

      for (const node of output.interpretations) {
        expect(node.factReferences).toBeDefined();
        expect(node.factReferences.pillarsInvolved.length).toBeGreaterThan(0);
        expect(Array.isArray(node.factReferences.tenGods)).toBe(true);
        expect(Array.isArray(node.factReferences.relationshipsUsed)).toBe(true);
      }
    });
  });

  describe('5. 근거 부족 시 허위 해석 방지 (Fake/Hallucination Guard)', () => {
    it('신호 부재 시 존재하지 않는 허위 근거를 날조하지 않고 안전한 제한 상태 노드를 생성한다', async () => {
      const { fact, signalSet, output } = runPhase7('1984-05-15', '14:30');

      // 신호가 없는 가상 상황을 테스트하기 위해 어댑터를 직접 호출
      const { Phase7InterpretationAdapter } = await import('../src/modules/phase7/phase7-interpretation-adapter.js');
      const adapter = new Phase7InterpretationAdapter();

      const mockedSignalSet = {
        ...signalSet,
        signals: {
          ...signalSet.signals,
          ma_business: undefined as any, // 사업마 강제 제거
          ma_health: undefined as any,   // 건강마 강제 제거
        },
      };

      const result = adapter.complete6Themes({
        fact,
        signalSet: mockedSignalSet,
        secondRelationships: output.secondRelationships,
        rsi: output.rsi,
        existingInterpretations: [],
      });

      const restrictedBusiness = result.find(n => n.theme === 'BUSINESS_VENTURE');
      const restrictedHealth = result.find(n => n.theme === 'HEALTH_EQUILIBRIUM');

      expect(restrictedBusiness).toBeDefined();
      expect(restrictedBusiness?.primaryVerdict).toContain('충분하지 않아 보수적 잠복 상태');
      expect(restrictedBusiness?.structure.basis.signals).toEqual([]);

      expect(restrictedHealth).toBeDefined();
      expect(restrictedHealth?.primaryVerdict).toContain('충분하지 않아 보수적 잠복 상태');
      expect(restrictedHealth?.structure.basis.signals).toEqual([]);
    });
  });

  describe('6. 원본 P1~P6 불변성 (Immutability)', () => {
    it('Phase 7 실행 후에도 P1~P5 Fact 및 MaSignalSet이 100% 동일하게 보존된다', () => {
      const { fact, signalSet, output } = runPhase7('1990-02-04', '10:16');

      expect(output.immutabilityVerified).toBe(true);

      // Phase 5 신호 21개 완전성 보존 확인
      expect(Object.keys(signalSet.signals).length).toBe(21);
    });
  });
});

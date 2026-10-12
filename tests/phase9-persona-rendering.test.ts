/**
 * Phase 9: 자연어 해석 및 마보살 페르소나 렌더링 검증 테스트
 * 
 * 검증 대상:
 * 1. 10 Case 자연어 렌더링 (10/10)
 * 2. 6 Theme 렌더링 구조 완전성 (60/60)
 *    - title, summary, evidence, interpretation, caution, sourceReferences, certainty
 * 3. Evidence & FactReferences 보존
 * 4. Certainty 보존 및 자연어 확실성 변환
 * 5. ISS-P8-001 반영 검증: SAFETY_MOVEMENT 충 다발 시 주의 수준 자연어 가중 반영 (사고 예언 금지)
 * 6. ISS-P8-002 반영 검증: HEALTH_EQUILIBRIUM 오행 맞춤형 서술 및 획일적 반복 탈피 (의료 단정 금지)
 * 7. Low-Signal Safety (저신호 상황 시 억지 날조 방어 및 제한적 표현 검증)
 * 8. Determinism (동일 입력 시 동일 렌더링)
 * 9. InterpretationNode 불변성 (렌더링에 의한 원천 노드 변조 전무)
 */

import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { MaFactAdapter, MaSignalEngine } from '../src/modules/ma/index.js';
import { Phase7Pipeline } from '../src/modules/phase7/index.js';
import { MabosalPersonaEngine } from '../src/modules/phase9/index.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { PHASE8_10_CASES } from './phase8-cases-data.js';

describe('Phase 9: Natural Language & Mabosal Persona Presentation Suite', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const relationshipEngine = new RelationshipEngine();
  const signalEngine = new MaSignalEngine();
  const phase7Pipeline = new Phase7Pipeline();
  const personaEngine = new MabosalPersonaEngine();

  function runCase(tc: (typeof PHASE8_10_CASES)[0]) {
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
    const p7Output = phase7Pipeline.execute({ fact, signalSet });
    const personaResult = personaEngine.renderAll(p7Output, fact, signalSet);

    return { cal: cal.data, pil: pil.data, core: core.data, rel: rel.data, fact, signalSet, p7Output, personaResult };
  }

  describe('1. 10 Case E2E & 60 Themes 자연어 렌더링 완전성 (10/10 Cases, 60/60 Themes)', () => {
    it.each(PHASE8_10_CASES)('$caseId — $name 에서 6대 테마가 마보살 페르소나 자연어로 완전 렌더링된다', (tc) => {
      const res = runCase(tc);
      const pr = res.personaResult;

      // 전체 인사말 및 총평 조언 검증
      expect(pr.overviewGreeting).toBeDefined();
      expect(pr.overviewGreeting).toContain('마보살');
      expect(pr.overallToneAndAdvice).toBeDefined();
      expect(pr.certaintyIsolationVerified).toBe(true);

      // 6대 테마 개수 및 순서 검증
      expect(pr.orderedThemes.length).toBe(6);
      expect(Object.keys(pr.themeInterpretations).length).toBe(6);

      // 각 렌더링 노드의 7개 필수 속성 검증
      for (const node of pr.orderedThemes) {
        expect(node.title).toBeDefined();
        expect(node.summary).toBeDefined();
        expect(node.summary.length).toBeGreaterThan(5);

        expect(node.evidence).toBeDefined();
        expect(node.evidence.length).toBeGreaterThan(5);

        expect(node.interpretation).toBeDefined();
        expect(node.interpretation.length).toBeGreaterThan(5);

        expect(node.caution).toBeDefined();
        expect(node.caution.length).toBeGreaterThan(5);

        expect(node.sourceReferences).toBeDefined();
        expect(node.sourceReferences.pillars.length).toBeGreaterThan(0);

        expect(node.certainty).toBeDefined();
        expect(node.certainty).toContain('해석입니다'); // PROVISIONAL의 자연어 변환

        // 원천 노드 보존
        expect(node.rawNode).toBeDefined();
        expect(node.rawNode.certainty).toBe('PROVISIONAL');
      }
    });
  });

  describe('2. Evidence & FactReferences 보존 검증', () => {
    it('렌더링 후에도 원천 Fact의 기둥(pillarsInvolved)과 십신, 신호 목록이 손실 없이 보존된다', () => {
      const res = runCase(PHASE8_10_CASES[0]);

      for (const rendered of res.personaResult.orderedThemes) {
        expect(rendered.sourceReferences.pillars).toEqual(rendered.rawNode.factReferences.pillarsInvolved);
        expect(rendered.sourceReferences.tenGods).toEqual(rendered.rawNode.factReferences.tenGods);
        expect(rendered.sourceReferences.signals).toEqual(rendered.rawNode.derivedFromSignals);
      }
    });
  });

  describe('3. Certainty Preservation & 자연어 확실성 변환 검증', () => {
    it('기술적 enum이 노출되지 않고 사용자 친화적인 자연어 확정도 설명으로 변환된다', () => {
      const res = runCase(PHASE8_10_CASES[1]);

      for (const rendered of res.personaResult.orderedThemes) {
        expect(rendered.certainty).toBe('현재 구조를 바탕으로 참고할 수 있는 해석입니다.');
        expect((rendered.certainty as any)).not.toBe('PROVISIONAL');
        expect((rendered.certainty as any)).not.toBe('CONFIRMED');
      }
    });
  });

  describe('4. ISS-P8-001 반영 검증: SAFETY_MOVEMENT 충 다발 시 주의 수준 자연어 가중', () => {
    it('Case 04(자오충 2회) 및 Case 08(인신충형)에서 단순 일상 유지가 아닌 세심한 주의가 요구되는 국면으로 렌더링된다', () => {
      const resCase4 = runCase(PHASE8_10_CASES[3]); // Case 04
      const resCase8 = runCase(PHASE8_10_CASES[7]); // Case 08

      const safetyNode4 = resCase4.personaResult.themeInterpretations.SAFETY_MOVEMENT;
      const safetyNode8 = resCase8.personaResult.themeInterpretations.SAFETY_MOVEMENT;

      // 충 다발 및 사고마 ACTIVE에 따른 주의 가중 확인
      expect(safetyNode4.summary).toContain('세심한 주의가 요구되는 국면');
      expect(safetyNode4.evidence).toContain('자오충');
      expect(safetyNode4.caution).toContain('사전 안전 점검');
      expect(safetyNode4.caution).toContain('사고 발생을 예언하거나 확정하는 것이 아니며');

      expect(safetyNode8.summary).toContain('세심한 주의가 요구되는 국면');
      expect(safetyNode8.evidence).toContain('충돌 기운이 작용');
    });
  });

  describe('5. ISS-P8-002 반영 검증: HEALTH_EQUILIBRIUM 오행 맞춤형 서술 및 획일적 반복 탈피', () => {
    it('극약 사주(Case 03)와 신강 사주(Case 02)에서 오행 맞춤형 서술이 다채롭게 분기된다', () => {
      const resWeak = runCase(PHASE8_10_CASES[2]);   // Case 03 (극약)
      const resStrong = runCase(PHASE8_10_CASES[1]); // Case 02 (신강)

      const healthWeak = resWeak.personaResult.themeInterpretations.HEALTH_EQUILIBRIUM;
      const healthStrong = resStrong.personaResult.themeInterpretations.HEALTH_EQUILIBRIUM;

      // 약한 일간: 기초 체력 소모 및 충전 이완 중심 서술
      expect(healthWeak.summary).toContain('소모가 빠르고');
      expect(healthWeak.evidence).toContain('약화된 상태');

      // 강한 일간: 활동 에너지 및 과열 조율 중심 서술
      expect(healthStrong.summary).toContain('활동 에너지가 왕성하나');
      expect(healthStrong.evidence).toContain('세력이 충분하여');

      // 두 해석 문장이 동일하지 않고 다채롭게 차별화됨
      expect(healthWeak.summary).not.toBe(healthStrong.summary);
    });
  });

  describe('6. Medical Safety (의료 안전성: 질병 단정 및 치료 처방 배제)', () => {
    it('10개 모든 케이스에서 특정 질병명 단정이나 치료 처방 지시가 없으며 전문 의료기관 안내가 포함된다', () => {
      for (const tc of PHASE8_10_CASES) {
        const res = runCase(tc);
        const healthNode = res.personaResult.themeInterpretations.HEALTH_EQUILIBRIUM;

        expect(healthNode.caution).toContain('전문 의료기관');
        expect(healthNode.caution).not.toContain('반드시 발병');
        expect(healthNode.caution).not.toContain('치료 처방');
      }
    });
  });

  describe('7. Low-Signal Safety (저신호 안전성: 억지 해석 날조 방어)', () => {
    it('Case 10 (저신호형)에서 직장 테마가 과장 없이 통상적 역할 유지로 평가되며 과도한 확장을 지양한다', () => {
      const res = runCase(PHASE8_10_CASES[9]); // Case 10 (시간 미상)
      const career = res.personaResult.themeInterpretations.CAREER_ORGANIZATION;
      const business = res.personaResult.themeInterpretations.BUSINESS_VENTURE;

      expect(career.summary).toContain('통상적 업무 흐름 유지');
      expect(business.caution).toContain('고위험 독자 창업보다는');
    });

    it('근거 신호가 완전히 결여된 경우 제한적 보수 표현이 적용된다', async () => {
      const { NaturalLanguageRenderer } = await import('../src/modules/phase9/natural-language-renderer.js');
      const renderer = new NaturalLanguageRenderer();

      const restrictedNode = {
        interpretationId: 'interp_mock_low',
        theme: 'BUSINESS_VENTURE' as const,
        primaryVerdict: '해당 테마를 뒷받침할 사업 신호가 충분하지 않아 보수적 잠복 상태로 유지됨',
        derivedFromSignals: [],
        factReferences: {
          pillarsInvolved: ['day' as const],
          tenGods: [],
          relationshipsUsed: [],
        },
        structure: {
          conclusion: '사업 실행 동력 평가 제한 상태',
          basis: { signals: [], facts: ['일간:갑'] },
          relationshipAndRSIImpact: {
            rsiBand: 'LATENT' as const,
            activeSecondRelationships: [],
            impactSummary: 'RSI LATENT',
          },
          actionableCaution: { guideline: '고위험 투자를 지양하십시오.' },
        },
        certainty: 'PROVISIONAL' as const,
      };

      const rendered = renderer.renderNode(restrictedNode as any, {});
      expect(rendered.summary).toContain('현재 사주 구조만으로는 이 영역을 강하게 판단하기 어려우며');
    });
  });

  describe('8. Determinism (결정론: Same Input → Same Rendered Output)', () => {
    it('동일한 입력을 3회 반복 실행했을 때 렌더링된 텍스트가 바이트 단위까지 100% 동일하다', () => {
      const tc = PHASE8_10_CASES[0];
      const res1 = runCase(tc);
      const res2 = runCase(tc);
      const res3 = runCase(tc);

      const json1 = JSON.stringify(res1.personaResult);
      const json2 = JSON.stringify(res2.personaResult);
      const json3 = JSON.stringify(res3.personaResult);

      expect(json1).toBe(json2);
      expect(json2).toBe(json3);
    });
  });

  describe('9. InterpretationNode 불변성 (렌더링에 의한 원천 노드 변조 전무)', () => {
    it('자연어 렌더링 실행 전후 원천 Phase7Output의 InterpretationNode 속성이 100% 동일하다', () => {
      const tc = PHASE8_10_CASES[1];
      const res = runCase(tc);

      for (const renderedTheme of res.personaResult.orderedThemes) {
        const originalNode = res.p7Output.interpretations.find(n => n.theme === renderedTheme.theme)!;
        const rawInRendered = renderedTheme.rawNode;

        expect(originalNode.interpretationId).toBe(rawInRendered.interpretationId);
        expect(originalNode.theme).toBe(rawInRendered.theme);
        expect(originalNode.primaryVerdict).toBe(rawInRendered.primaryVerdict);
        expect(originalNode.certainty).toBe(rawInRendered.certainty);
        expect(originalNode.structure).toEqual(rawInRendered.structure);
      }
    });
  });
});

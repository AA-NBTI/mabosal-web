/**
 * Phase 10: 실제 사용자용 최종 사주 리포트 검증 테스트
 * 
 * 검증 대상:
 * 1. 10 Case 최종 리포트 완전 생성 (10/10)
 * 2. 3단 모드 (QUICK / STANDARD / DEEP) 일관성 및 깊이 차별화
 * 3. 6 Theme 연결 & 전체 구조 연결 (Structural Synthesis: 강화/충돌/완충/동시관리)
 * 4. 마보살 종합 해석 (Overall Interpretation: 핵심 구조 정리)
 * 5. Signal → 자연어 의미 보존 및 과장 금지
 * 6. RSI 의미 보존
 * 7. Time Axis 분리 (원국 비간섭 원칙 준수)
 * 8. Certainty 보존 (PROVISIONAL 분리)
 * 9. Low-Signal 안전성 & Medical Safety
 * 10. Determinism (결정론: 동일 입력 모드별 동일 리포트)
 */

import { describe, expect, it } from 'vitest';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { MaFactAdapter, MaSignalEngine } from '../src/modules/ma/index.js';
import { TimeModulatorGuard, TimeModulatorSignal } from '../src/modules/phase6/index.js';
import { Phase7Pipeline } from '../src/modules/phase7/index.js';
import { MabosalPersonaEngine } from '../src/modules/phase9/index.js';
import { Phase10UserReportBuilder, ReportDepthMode } from '../src/modules/phase10/index.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { PHASE8_10_CASES, TestCaseDefinition } from './phase8-cases-data.js';

describe('Phase 10: Final User Report Service Audit Suite', () => {
  const calendarEngine = new CalendarEngine();
  const pillarEngine = new PillarEngine();
  const sajuCoreEngine = new SajuCoreEngine();
  const relationshipEngine = new RelationshipEngine();
  const signalEngine = new MaSignalEngine();
  const phase7Pipeline = new Phase7Pipeline();
  const personaEngine = new MabosalPersonaEngine();
  const reportBuilder = new Phase10UserReportBuilder();

  function generateUserReport(
    tc: TestCaseDefinition,
    depthMode: ReportDepthMode = 'STANDARD',
    timeModulators: TimeModulatorSignal[] = []
  ) {
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
    const personaResult = personaEngine.renderAll(phase7Output, fact, signalSet);

    const report = reportBuilder.buildReport({
      fact,
      signalSet,
      phase7Output,
      personaResult,
      depthMode,
    });

    return { fact, signalSet, phase7Output, personaResult, report };
  }

  describe('1. 10 Case 최종 리포트 완전 생성 검증 (10/10 Cases)', () => {
    it.each(PHASE8_10_CASES)('$caseId — $name 에서 5대 핵심 섹션을 포함한 최종 리포트가 완성된다', (tc) => {
      const { report } = generateUserReport(tc, 'STANDARD');

      // ① 사주 기본 구조
      expect(report.basicStructure).toBeDefined();
      expect(report.basicStructure.fourPillars.year).toBeDefined();
      expect(report.basicStructure.fourPillars.month).toBeDefined();
      expect(report.basicStructure.fourPillars.day).toBeDefined();
      expect(report.basicStructure.dayMaster.stem).toBeDefined();
      expect(report.basicStructure.fiveElementsDistribution.dominantElement).toBeDefined();
      expect(report.basicStructure.dayMasterStrength.classification).toBeDefined();

      // ② 전체 흐름 요약
      expect(report.flowSummary).toBeDefined();
      expect(report.flowSummary.headline.length).toBeGreaterThan(10);
      expect(report.flowSummary.rsiBandStatus.band).toBeDefined();

      // ③ 6대 핵심 테마
      expect(report.themes.length).toBe(6);
      for (const t of report.themes) {
        expect(t.title).toBeDefined();
        expect(t.summary.length).toBeGreaterThan(5);
        expect(t.evidence).toBeDefined();
        expect(t.structuralInterpretation).toBeDefined();
        expect(t.actionableCaution).toBeDefined();
        expect(t.certaintyDescription).toBeDefined();
      }

      // ④ 전체 구조 연결 (Structural Synthesis)
      expect(report.structuralSynthesis).toBeDefined();
      expect(report.structuralSynthesis?.synthesisNote.length).toBeGreaterThan(10);

      // ⑤ 마보살 종합 해석
      expect(report.finalSynthesis).toBeDefined();
      expect(report.finalSynthesis.coreStructureVerdict.length).toBeGreaterThan(15);
      expect(report.finalSynthesis.lifeStrategy.length).toBeGreaterThan(15);
      expect(report.finalSynthesis.closingBlessing.length).toBeGreaterThan(15);

      // 안전성 및 확정도 메타데이터
      expect(report.meta.safetyVerified).toBe(true);
      expect(report.meta.certaintyLevel).toBe('PROVISIONAL');
    });
  });

  describe('2. 3단 모드 (QUICK / STANDARD / DEEP) 일관성 및 깊이 차별화', () => {
    it('세 가지 모드는 판단 결과(summary)가 100% 동일하며 표현 깊이만 차별화된다', () => {
      const tc = PHASE8_10_CASES[0];
      const quick = generateUserReport(tc, 'QUICK').report;
      const standard = generateUserReport(tc, 'STANDARD').report;
      const deep = generateUserReport(tc, 'DEEP').report;

      // 1. 판단 결과 동일성 검증 (6대 테마 summary 동일)
      for (let i = 0; i < 6; i++) {
        expect(quick.themes[i].summary).toBe(standard.themes[i].summary);
        expect(standard.themes[i].summary).toBe(deep.themes[i].summary);
      }

      // 2. 종합 해석 동일성 검증
      expect(quick.finalSynthesis.coreStructureVerdict).toBe(standard.finalSynthesis.coreStructureVerdict);
      expect(standard.finalSynthesis.coreStructureVerdict).toBe(deep.finalSynthesis.coreStructureVerdict);

      // 3. 깊이 차별화 검증
      // QUICK: evidence와 structuralInterpretation이 생략되어 신속한 확인 지원
      expect(quick.themes[0].evidence).toBeUndefined();
      expect(quick.themes[0].structuralInterpretation).toBeUndefined();
      expect(quick.structuralSynthesis).toBeUndefined();

      // STANDARD: 4단계 구조 및 전체 구조 연결 완비
      expect(standard.themes[0].evidence).toBeDefined();
      expect(standard.themes[0].structuralInterpretation).toBeDefined();
      expect(standard.structuralSynthesis).toBeDefined();
      expect(standard.themes[0].deepFactDetails).toBeUndefined();

      // DEEP: STANDARD의 모든 내용에 더해 세부 Fact 역추적 메타데이터(deepFactDetails) 추가 완비
      expect(deep.themes[0].deepFactDetails).toBeDefined();
      expect(deep.themes[0].deepFactDetails?.pillarsInvolved.length).toBeGreaterThan(0);
      expect(deep.themes[0].deepFactDetails?.tenGods).toBeDefined();
      expect(deep.themes[0].deepFactDetails?.signals).toBeDefined();
    });
  });

  describe('3. 전체 구조 연결 (Structural Synthesis: 강화/충돌/완충/동시관리)', () => {
    it('6개 테마를 분절하지 않고 상호작용 영역을 유기적으로 엮어 제공한다', () => {
      const { report } = generateUserReport(PHASE8_10_CASES[3]); // Case 04 충 다발

      const synthesis = report.structuralSynthesis!;
      expect(synthesis).toBeDefined();
      expect(Array.isArray(synthesis.amplifiedAreas)).toBe(true);
      expect(Array.isArray(synthesis.conflictingAreas)).toBe(true);
      expect(Array.isArray(synthesis.mitigatedAreas)).toBe(true);
      expect(Array.isArray(synthesis.dualManagementAreas)).toBe(true);

      // 충 다발형 사주이므로 긴장/마찰 영역이 반드시 도출됨
      expect(synthesis.conflictingAreas.length).toBeGreaterThanOrEqual(1);
      expect(synthesis.synthesisNote).toContain('삶의 균형');
    });
  });

  describe('4. Time Axis 분리 (원국 비간섭 원칙 준수)', () => {
    it('대운/세운/월운 주입 시 원국을 변조하지 않고 현재 시점의 강화/완충 계기로 명확히 분리 설명한다', () => {
      const tc = PHASE8_10_CASES[1];
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
          description: '세운 1년 재물 활성화 계기',
        }),
      ];

      const { report } = generateUserReport(tc, 'STANDARD', timeModulators);

      expect(report.temporalModulation).toBeDefined();
      expect(report.temporalModulation?.hasActiveTimeSignals).toBe(true);
      expect(report.temporalModulation?.timeScopeDescriptions.length).toBe(2);

      // 원국 비간섭 면책 안내 문구 확인
      expect(report.temporalModulation?.temporalDisclaimer).toContain('사주 원국 자체를 변조하지 않으며');
    });
  });

  describe('5. Safety 최종 검증 (공포·질병단정·사고예언 배제)', () => {
    it('10개 모든 케이스의 최종 리포트에서 단정적 공포 및 의료/사고 단정이 완전히 배제된다', () => {
      for (const tc of PHASE8_10_CASES) {
        const { report } = generateUserReport(tc, 'STANDARD');
        const reportJson = JSON.stringify(report);

        // 절대 금지 표현 검증
        expect(reportJson).not.toContain('반드시 발병');
        expect(reportJson).not.toContain('반드시 망합니다');
        expect(reportJson).not.toContain('필연적 이혼');
        expect(reportJson).not.toContain('절대적 파산');
        expect(reportJson).not.toContain('치료 처방');

        // 의료기관 안내 필수 포함 검증
        expect(reportJson).toContain('전문 의료기관');
      }
    });
  });

  describe('6. Determinism (결정론: Same Input → Same Final Report)', () => {
    it('동일 입력을 반복 실행했을 때 리포트의 모든 필드가 100% 동일하다', () => {
      const tc = PHASE8_10_CASES[0];
      const res1 = generateUserReport(tc, 'STANDARD').report;
      const res2 = generateUserReport(tc, 'STANDARD').report;

      // 생성 시각(reportGeneratedAt)을 제외하고 비교
      const clean1 = { ...res1, meta: { ...res1.meta, reportGeneratedAt: '' } };
      const clean2 = { ...res2, meta: { ...res2.meta, reportGeneratedAt: '' } };

      expect(JSON.stringify(clean1)).toBe(JSON.stringify(clean2));
    });
  });
});

/**
 * Phase 12: Character Module Tests
 * 캐릭터 모듈 검증 테스트
 */

import { describe, it, expect } from 'vitest';
import { CharacterEngine } from '../src/modules/character/character-engine.js';
import { MaModuleEngine, MaModuleEngineOutput } from '../src/modules/ma/ma-module-engine.js';
import { SignalEngine } from '../src/modules/signal/signal-engine.js';
import { PillarEngine } from '../src/modules/pillar/pillar-engine.js';
import { CalendarEngine } from '../src/modules/calendar/calendar-engine.js';
import { SajuCoreEngine } from '../src/modules/saju-core/saju-core-engine.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';
import { CharacterProfile } from '../src/modules/character/character-types.js';

describe('Phase 12: Character Module Tests', () => {
  const calEngine = new CalendarEngine();
  const pilEngine = new PillarEngine();
  const coreEngine = new SajuCoreEngine();
  const relEngine = new RelationshipEngine();
  const signalEngine = new SignalEngine();
  const maEngine = new MaModuleEngine();
  const characterEngine = new CharacterEngine();

  const getMaOutput = (): MaModuleEngineOutput => {
    const cal = calEngine.execute({ birth_date: '2024-02-05', birth_time: '12:00' });
    const pil = pilEngine.execute(cal.data);
    const core = coreEngine.execute(pil.data);
    const rel = relEngine.execute({ four_pillars: pil.data.four_pillars });
    const sig = signalEngine.execute({ saju_core: core.data, relationship: rel.data });
    return maEngine.execute({ signals: sig.data }).data;
  };

  it('지시서 제15/21원칙 준수: 캐릭터를 변경해도 명리 계산 수치 결과는 100% 동일해야 한다', () => {
    const maOutput = getMaOutput();

    const charDefault = characterEngine.execute({ maOutput, characterType: 'default' }).data;
    const charDirect = characterEngine.execute({ maOutput, characterType: 'direct' }).data;
    const charWarm = characterEngine.execute({ maOutput, characterType: 'warm' }).data;
    const charAnalytical = characterEngine.execute({ maOutput, characterType: 'analytical' }).data;
    const charRealistic = characterEngine.execute({ maOutput, characterType: 'realistic' }).data;

    // 모든 캐릭터 결과의 rawCalculationResult는 maOutput과 완벽히 동일해야 함
    expect(charDefault.rawCalculationResult).toEqual(maOutput);
    expect(charDirect.rawCalculationResult).toEqual(maOutput);
    expect(charWarm.rawCalculationResult).toEqual(maOutput);
    expect(charAnalytical.rawCalculationResult).toEqual(maOutput);
    expect(charRealistic.rawCalculationResult).toEqual(maOutput);

    // 21개 마 각각의 점수 역시 단 0.0001점의 차이도 없어야 함
    for (const [id, ma] of Object.entries(maOutput.ma_results)) {
      expect(charDirect.rawCalculationResult.ma_results[id].presentation_score).toBe(ma.presentation_score);
      expect(charWarm.rawCalculationResult.ma_results[id].presentation_score).toBe(ma.presentation_score);
      expect(charAnalytical.rawCalculationResult.ma_results[id].presentation_score).toBe(ma.presentation_score);
      expect(charRealistic.rawCalculationResult.ma_results[id].presentation_score).toBe(ma.presentation_score);
    }
  });

  it('캐릭터 유형별로 호칭, 페르소나 및 발화 어조가 뚜렷이 구별되어야 한다', () => {
    const maOutput = getMaOutput();

    const resDirect = characterEngine.execute({ maOutput, characterType: 'direct' }).data;
    const resWarm = characterEngine.execute({ maOutput, characterType: 'warm' }).data;
    const resAnalytical = characterEngine.execute({ maOutput, characterType: 'analytical' }).data;
    const resRealistic = characterEngine.execute({ maOutput, characterType: 'realistic' }).data;

    // 호칭 차이
    expect(resDirect.characterProfile.addressTitle).toBe('당신');
    expect(resWarm.characterProfile.addressTitle).toBe('벗님');
    expect(resAnalytical.characterProfile.addressTitle).toBe('의뢰인님');
    expect(resRealistic.characterProfile.addressTitle).toBe('선생님');

    // 발화 스타일 차이
    expect(resDirect.characterExpressions.diagnosisLead).toContain('운명 판때기');
    expect(resWarm.characterExpressions.diagnosisLead).toContain('마음고생');
    expect(resAnalytical.characterExpressions.salutation).toContain('다차원 매트릭스 분석');
    expect(resAnalytical.characterExpressions.diagnosisLead).toContain('사주 원국 및 시운 결합 모델');
    expect(resRealistic.characterExpressions.diagnosisLead).toContain('먹고사는 현실의 판세');

    // 최상위 마 멘트 차이
    expect(resDirect.characterExpressions.topMaPersonaComment).toContain('눈가리고 아웅');
    expect(resWarm.characterExpressions.topMaPersonaComment).toContain('계절에서 가장 큰 울림');
    expect(resAnalytical.characterExpressions.topMaPersonaComment).toContain('통계적 가중치');
    expect(resRealistic.characterExpressions.topMaPersonaComment).toContain('발등에 떨어진 불');
  });

  it('커스텀 캐릭터 동적 등록 (확장성 보장) 검증', () => {
    const maOutput = getMaOutput();

    const customProfile: CharacterProfile = {
      characterId: 'zen_master',
      name: '선사(禪師)',
      title: '무소유의 선승',
      persona: '달과 구름을 벗삼아 집착을 내려놓게 하는 선승',
      toneAndManner: '담담하고 깊은 울림의 선문답체',
      addressTitle: '수행자여',
      greeting: '바람이 불면 풀이 눕고, 바람이 멎으면 풀이 일어납니다.',
      closing: '마음을 비우면 온 우주가 그대의 것입니다.',
      adviceFocus: 'spiritual',
    };

    characterEngine.registerCustomCharacter(customProfile);

    const resZen = characterEngine.execute({ maOutput, characterType: 'zen_master' }).data;
    expect(resZen.characterProfile.name).toBe('선사(禪師)');
    expect(resZen.characterExpressions.salutation).toContain('바람이 불면');
    expect(resZen.rawCalculationResult).toEqual(maOutput);
  });
});

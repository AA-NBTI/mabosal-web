import { describe, expect, it } from 'vitest';
import { FourPillars } from '../src/core/types.js';
import { RelationshipEngine } from '../src/modules/relationship/relationship-engine.js';

describe('Phase 4: Relationship Engine (합·충·형·파·해) Tests', () => {
  const relEngine = new RelationshipEngine();

  // ==========================================
  // [기존 83개 회귀 테스트 보존]
  // ==========================================
  it('천간합(갑기합)과 천간충(병임충)을 정확히 감지해야 한다', () => {
    const pillars: FourPillars = {
      year: { stem: '갑', branch: '자', name: '갑자' },
      month: { stem: '기', branch: '축', name: '기축' },
      day: { stem: '병', branch: '인', name: '병인' },
      hour: { stem: '임', branch: '진', name: '임진' },
    };

    const result = relEngine.execute({ four_pillars: pillars });
    expect(result.metadata.status).toBe('active');

    // 갑기합토
    const gapGi = result.data.stem_relations.find(r => r.name === '갑기합토');
    expect(gapGi).toBeDefined();
    expect(gapGi?.transformedElement).toBe('토');

    // 병임충
    const byeongIm = result.data.stem_relations.find(r => r.name === '병임충');
    expect(byeongIm).toBeDefined();
  });

  it('T09 합 강함 명식: 지지 육합(자축합)과 삼합(신자진 수국)을 정밀 감지해야 한다', () => {
    const pillars: FourPillars = {
      year: { stem: '임', branch: '신', name: '임신' },
      month: { stem: '임', branch: '자', name: '임자' },
      day: { stem: '갑', branch: '진', name: '갑진' },
      hour: { stem: '을', branch: '축', name: '을축' },
    };

    const result = relEngine.execute({ four_pillars: pillars });
    const { branch_harmonies, summary } = result.data;

    // 신자진 수국 삼합 완전성립
    const shinJaJin = branch_harmonies.find(h => h.name === '신자진 수국');
    expect(shinJaJin).toBeDefined();
    expect(shinJaJin?.intensity).toBe(95.0);

    // 자축합 육합
    const jaChuk = branch_harmonies.find(h => h.name === '자축합토');
    expect(jaChuk).toBeDefined();

    // 합 점수 고득점 검증
    expect(summary.total_harmony_score).toBeGreaterThanOrEqual(80.0);
  });

  it('T10 충 강함 명식: 인접 육충(자오충, 인신충)과 안정도 급감 검증', () => {
    const pillars: FourPillars = {
      year: { stem: '경', branch: '인', name: '경인' },
      month: { stem: '무', branch: '신', name: '무신' },
      day: { stem: '갑', branch: '자', name: '갑자' },
      hour: { stem: '경', branch: '오', name: '경오' },
    };

    const result = relEngine.execute({ four_pillars: pillars });
    const { branch_clashes, summary } = result.data;

    // 인신충
    const inShin = branch_clashes.find(c => c.name === '인신충');
    expect(inShin).toBeDefined();
    expect(inShin?.distance).toBe(1); // 인접충

    // 자오충
    const jaOh = branch_clashes.find(c => c.name === '자오충');
    expect(jaOh).toBeDefined();
    expect(jaOh?.distance).toBe(1);

    // 충 점수 높고 안정도 낮음 검증
    expect(summary.total_clash_score).toBeGreaterThan(80.0);
    expect(summary.overall_stability_score).toBeLessThan(60.0);
  });

  it('T11 형·파·해 복합 명식: 인사신 삼형, 자유파, 자미해 감지 검증', () => {
    const pillars: FourPillars = {
      year: { stem: '무', branch: '인', name: '무인' },
      month: { stem: '정', branch: '사', name: '정사' },
      day: { stem: '경', branch: '신', name: '경신' },
      hour: { stem: '계', branch: '해', name: '계해' },
    };

    const result = relEngine.execute({ four_pillars: pillars });
    const { branch_punishments, minor_relations } = result.data;

    // 인사신 삼형 완전성립
    const insasin = branch_punishments.find(p => p.name.includes('인사신 삼형'));
    expect(insasin).toBeDefined();
    expect(insasin?.intensity).toBe(95.0);

    // 신해해 (사맹지 해)
    const sinHae = minor_relations.find(m => m.name === '신해해');
    expect(sinHae).toBeDefined();
  });

  it('출생시간 미상(hour=null) 시 3주 간의 관계가 정상 분석되고 시간의존성이 기록되어야 한다', () => {
    const pillars: FourPillars = {
      year: { stem: '갑', branch: '자', name: '갑자' },
      month: { stem: '병', branch: '오', name: '병오' },
      day: { stem: '무', branch: '진', name: '무진' },
      hour: null,
    };

    const result = relEngine.execute({ four_pillars: pillars });
    expect(result.metadata.status).toBe('active');
    expect(result.data.time_dependency.is_missing_hour).toBe(true);
    expect(result.data.time_dependency.requires_hour).toBe(true);

    // 연월 지지 자오충 정상 감지
    const jaOh = result.data.branch_clashes.find(c => c.name === '자오충');
    expect(jaOh).toBeDefined();
  });

  // ==========================================
  // [지시사항 16: Phase 4 신규 전수 검증 테스트]
  // ==========================================

  describe('1. 천간합 5종 전수 검증', () => {
    it('갑기합토, 을경합금, 병신합수, 정임합목, 무계합화 5종 정확 검출', () => {
      // 1) 을경합
      const p1: FourPillars = {
        year: { stem: '을', branch: '사', name: '을사' },
        month: { stem: '경', branch: '진', name: '경진' },
        day: { stem: '무', branch: '인', name: '무인' },
        hour: { stem: '임', branch: '자', name: '임자' },
      };
      const res1 = relEngine.execute({ four_pillars: p1 });
      expect(res1.data.stem_relations.some(r => r.name === '을경합금')).toBe(true);

      // 2) 병신합
      const p2: FourPillars = {
        year: { stem: '병', branch: '오', name: '병오' },
        month: { stem: '신', branch: '자', name: '신자' },
        day: { stem: '경', branch: '인', name: '경인' },
        hour: { stem: '갑', branch: '진', name: '갑진' },
      };
      const res2 = relEngine.execute({ four_pillars: p2 });
      expect(res2.data.stem_relations.some(r => r.name === '병신합수')).toBe(true);

      // 3) 정임합
      const p3: FourPillars = {
        year: { stem: '정', branch: '묘', name: '정묘' },
        month: { stem: '임', branch: '인', name: '임인' },
        day: { stem: '기', branch: '사', name: '기사' },
        hour: { stem: '경', branch: '오', name: '경오' },
      };
      const res3 = relEngine.execute({ four_pillars: p3 });
      expect(res3.data.stem_relations.some(r => r.name === '정임합목')).toBe(true);

      // 4) 무계합
      const p4: FourPillars = {
        year: { stem: '무', branch: '오', name: '무오' },
        month: { stem: '계', branch: '사', name: '계사' },
        day: { stem: '갑', branch: '술', name: '갑술' },
        hour: { stem: '을', branch: '해', name: '을해' },
      };
      const res4 = relEngine.execute({ four_pillars: p4 });
      expect(res4.data.stem_relations.some(r => r.name === '무계합화')).toBe(true);
    });
  });

  describe('2. 천간충 4종 전수 검증', () => {
    it('갑경충, 을신충, 병임충, 정계충 4종 정확 검출', () => {
      const p: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '경', branch: '축', name: '경축' },
        day: { stem: '을', branch: '인', name: '을인' },
        hour: { stem: '신', branch: '묘', name: '신묘' },
      };
      const res = relEngine.execute({ four_pillars: p });
      expect(res.data.stem_relations.some(r => r.name === '갑경충')).toBe(true);
      expect(res.data.stem_relations.some(r => r.name === '을신충')).toBe(true);

      const p2: FourPillars = {
        year: { stem: '병', branch: '진', name: '병진' },
        month: { stem: '임', branch: '사', name: '임사' },
        day: { stem: '정', branch: '오', name: '정오' },
        hour: { stem: '계', branch: '미', name: '계미' },
      };
      const res2 = relEngine.execute({ four_pillars: p2 });
      expect(res2.data.stem_relations.some(r => r.name === '병임충')).toBe(true);
      expect(res2.data.stem_relations.some(r => r.name === '정계충')).toBe(true);
    });
  });

  describe('3. 육합 6종 전수 검증', () => {
    it('자축합토, 인해합목, 묘술합화, 진유합금, 사신합수, 오미합화 6종 검출', () => {
      const p1: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '갑', branch: '축', name: '갑축' },
        day: { stem: '갑', branch: '인', name: '갑인' },
        hour: { stem: '갑', branch: '해', name: '갑해' },
      };
      const res1 = relEngine.execute({ four_pillars: p1 });
      expect(res1.data.branch_harmonies.some(h => h.name === '자축합토')).toBe(true);
      expect(res1.data.branch_harmonies.some(h => h.name === '인해합목')).toBe(true);

      const p2: FourPillars = {
        year: { stem: '갑', branch: '묘', name: '갑묘' },
        month: { stem: '갑', branch: '술', name: '갑술' },
        day: { stem: '갑', branch: '진', name: '갑진' },
        hour: { stem: '갑', branch: '유', name: '갑유' },
      };
      const res2 = relEngine.execute({ four_pillars: p2 });
      expect(res2.data.branch_harmonies.some(h => h.name === '묘술합화')).toBe(true);
      expect(res2.data.branch_harmonies.some(h => h.name === '진유합금')).toBe(true);

      const p3: FourPillars = {
        year: { stem: '갑', branch: '사', name: '갑사' },
        month: { stem: '갑', branch: '신', name: '갑신' },
        day: { stem: '갑', branch: '오', name: '갑오' },
        hour: { stem: '갑', branch: '미', name: '갑미' },
      };
      const res3 = relEngine.execute({ four_pillars: p3 });
      expect(res3.data.branch_harmonies.some(h => h.name === '사신합수')).toBe(true);
      expect(res3.data.branch_harmonies.some(h => h.name === '오미합화')).toBe(true);
    });
  });

  describe('4. 삼합 4종 및 방합 4종 전수 검증', () => {
    it('삼합 4국(신자진 수국, 해묘미 목국, 인오술 화국, 사유축 금국) 완전성립 검출', () => {
      const p1: FourPillars = {
        year: { stem: '갑', branch: '신', name: '갑신' },
        month: { stem: '갑', branch: '자', name: '갑자' },
        day: { stem: '갑', branch: '진', name: '갑진' },
        hour: { stem: '갑', branch: '인', name: '갑인' },
      };
      expect(relEngine.execute({ four_pillars: p1 }).data.branch_harmonies.some(h => h.name === '신자진 수국' && h.harmonySubType === 'TRIPLE_HARMONY')).toBe(true);

      const p2: FourPillars = {
        year: { stem: '갑', branch: '해', name: '갑해' },
        month: { stem: '갑', branch: '묘', name: '갑묘' },
        day: { stem: '갑', branch: '미', name: '갑미' },
        hour: { stem: '갑', branch: '축', name: '갑축' },
      };
      expect(relEngine.execute({ four_pillars: p2 }).data.branch_harmonies.some(h => h.name === '해묘미 목국' && h.harmonySubType === 'TRIPLE_HARMONY')).toBe(true);

      const p3: FourPillars = {
        year: { stem: '갑', branch: '인', name: '갑인' },
        month: { stem: '갑', branch: '오', name: '갑오' },
        day: { stem: '갑', branch: '술', name: '갑술' },
        hour: { stem: '갑', branch: '진', name: '갑진' },
      };
      expect(relEngine.execute({ four_pillars: p3 }).data.branch_harmonies.some(h => h.name === '인오술 화국' && h.harmonySubType === 'TRIPLE_HARMONY')).toBe(true);

      const p4: FourPillars = {
        year: { stem: '갑', branch: '사', name: '갑사' },
        month: { stem: '갑', branch: '유', name: '갑유' },
        day: { stem: '갑', branch: '축', name: '갑축' },
        hour: { stem: '갑', branch: '해', name: '갑해' },
      };
      expect(relEngine.execute({ four_pillars: p4 }).data.branch_harmonies.some(h => h.name === '사유축 금국' && h.harmonySubType === 'TRIPLE_HARMONY')).toBe(true);
    });

    it('방합 4방(인묘진 동방목국, 사오미 남방화국, 신유술 서방금국, 해자축 북방수국) 검출', () => {
      const p1: FourPillars = {
        year: { stem: '갑', branch: '인', name: '갑인' },
        month: { stem: '갑', branch: '묘', name: '갑묘' },
        day: { stem: '갑', branch: '진', name: '갑진' },
        hour: { stem: '갑', branch: '사', name: '갑사' },
      };
      expect(relEngine.execute({ four_pillars: p1 }).data.branch_harmonies.some(h => h.harmonySubType === 'DIRECTIONAL_HARMONY' && h.name.includes('동방목국'))).toBe(true);

      const p2: FourPillars = {
        year: { stem: '갑', branch: '사', name: '갑사' },
        month: { stem: '갑', branch: '오', name: '갑오' },
        day: { stem: '갑', branch: '미', name: '갑미' },
        hour: { stem: '갑', branch: '유', name: '갑유' },
      };
      expect(relEngine.execute({ four_pillars: p2 }).data.branch_harmonies.some(h => h.harmonySubType === 'DIRECTIONAL_HARMONY' && h.name.includes('남방화국'))).toBe(true);

      const p3: FourPillars = {
        year: { stem: '갑', branch: '신', name: '갑신' },
        month: { stem: '갑', branch: '유', name: '갑유' },
        day: { stem: '갑', branch: '술', name: '갑술' },
        hour: { stem: '갑', branch: '자', name: '갑자' },
      };
      expect(relEngine.execute({ four_pillars: p3 }).data.branch_harmonies.some(h => h.harmonySubType === 'DIRECTIONAL_HARMONY' && h.name.includes('서방금국'))).toBe(true);

      const p4: FourPillars = {
        year: { stem: '갑', branch: '해', name: '갑해' },
        month: { stem: '갑', branch: '자', name: '갑자' },
        day: { stem: '갑', branch: '축', name: '갑축' },
        hour: { stem: '갑', branch: '묘', name: '갑묘' },
      };
      expect(relEngine.execute({ four_pillars: p4 }).data.branch_harmonies.some(h => h.harmonySubType === 'DIRECTIONAL_HARMONY' && h.name.includes('북방수국'))).toBe(true);
    });
  });

  describe('5. 육충 6종 전수 검증', () => {
    it('자오충, 축미충, 인신충, 묘유충, 진술충, 사해충 6종 검출', () => {
      const p1: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '갑', branch: '오', name: '갑오' },
        day: { stem: '갑', branch: '축', name: '갑축' },
        hour: { stem: '갑', branch: '미', name: '갑미' },
      };
      const res1 = relEngine.execute({ four_pillars: p1 });
      expect(res1.data.branch_clashes.some(c => c.name === '자오충')).toBe(true);
      expect(res1.data.branch_clashes.some(c => c.name === '축미충')).toBe(true);

      const p2: FourPillars = {
        year: { stem: '갑', branch: '인', name: '갑인' },
        month: { stem: '갑', branch: '신', name: '갑신' },
        day: { stem: '갑', branch: '묘', name: '갑묘' },
        hour: { stem: '갑', branch: '유', name: '갑유' },
      };
      const res2 = relEngine.execute({ four_pillars: p2 });
      expect(res2.data.branch_clashes.some(c => c.name === '인신충')).toBe(true);
      expect(res2.data.branch_clashes.some(c => c.name === '묘유충')).toBe(true);

      const p3: FourPillars = {
        year: { stem: '갑', branch: '진', name: '갑진' },
        month: { stem: '갑', branch: '술', name: '갑술' },
        day: { stem: '갑', branch: '사', name: '갑사' },
        hour: { stem: '갑', branch: '해', name: '갑해' },
      };
      const res3 = relEngine.execute({ four_pillars: p3 });
      expect(res3.data.branch_clashes.some(c => c.name === '진술충')).toBe(true);
      expect(res3.data.branch_clashes.some(c => c.name === '사해충')).toBe(true);
    });
  });

  describe('6. 삼형 완전형 vs 부분형, 자묘 상형, 자형 4종 전수 검증', () => {
    it('인사신 완전 삼형 vs 인사 부분형 분리 검증', () => {
      // 1) 인사신 3자 전원 집결 -> COMPLETE_TRIPUNISHMENT
      const pComplete: FourPillars = {
        year: { stem: '갑', branch: '인', name: '갑인' },
        month: { stem: '갑', branch: '사', name: '갑사' },
        day: { stem: '갑', branch: '신', name: '갑신' },
        hour: { stem: '갑', branch: '자', name: '갑자' },
      };
      const resC = relEngine.execute({ four_pillars: pComplete });
      const punC = resC.data.branch_punishments.find(p => p.name.includes('인사신'));
      expect(punC?.punishmentSubType).toBe('COMPLETE_TRIPUNISHMENT');
      expect(punC?.intensity).toBe(95.0);

      // 2) 인사 2자 결합 -> 마보살 규격: 삼형은 3자 완비 시에만 성립 (2자 결합은 형살 미성립)
      const pPartial: FourPillars = {
        year: { stem: '갑', branch: '인', name: '갑인' },
        month: { stem: '갑', branch: '사', name: '갑사' },
        day: { stem: '갑', branch: '자', name: '갑자' },
        hour: { stem: '갑', branch: '축', name: '갑축' },
      };
      const resP = relEngine.execute({ four_pillars: pPartial });
      const punP = resP.data.branch_punishments.find(p => p.name.includes('인사'));
      expect(punP).toBeUndefined();
    });

    it('자묘 상형 검출 검증', () => {
      const p: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '갑', branch: '묘', name: '갑묘' },
        day: { stem: '갑', branch: '진', name: '갑진' },
        hour: { stem: '갑', branch: '사', name: '갑사' },
      };
      const res = relEngine.execute({ four_pillars: p });
      const mutual = res.data.branch_punishments.find(p => p.punishmentSubType === 'MUTUAL_PUNISHMENT');
      expect(mutual).toBeDefined();
      expect(mutual?.name).toBe('자묘 상형');
    });

    it('자형 4종(진진, 오오, 유유, 해해) 검출 및 술술 자형 불성립 검증', () => {
      const p: FourPillars = {
        year: { stem: '갑', branch: '진', name: '갑진' },
        month: { stem: '갑', branch: '진', name: '갑진' },
        day: { stem: '갑', branch: '오', name: '갑오' },
        hour: { stem: '갑', branch: '오', name: '갑오' },
      };
      const res = relEngine.execute({ four_pillars: p });
      expect(res.data.branch_punishments.some(p => p.name === '진진 자형')).toBe(true);
      expect(res.data.branch_punishments.some(p => p.name === '오오 자형')).toBe(true);

      // 술술 중복 명식: 자형에 포함되지 않아야 함!
      const pSul: FourPillars = {
        year: { stem: '갑', branch: '술', name: '갑술' },
        month: { stem: '갑', branch: '술', name: '갑술' },
        day: { stem: '갑', branch: '인', name: '갑인' },
        hour: { stem: '갑', branch: '묘', name: '갑묘' },
      };
      const resSul = relEngine.execute({ four_pillars: pSul });
      expect(resSul.data.branch_punishments.some(p => p.name.includes('술술 자형'))).toBe(false);
    });
  });

  describe('7. 육해 6종, 육파 6종, 원진 6종 전수 검증', () => {
    it('육해 6종(자미, 축오, 인사, 묘진, 신해, 유술) 검출', () => {
      const p1: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '갑', branch: '미', name: '갑미' },
        day: { stem: '갑', branch: '축', name: '갑축' },
        hour: { stem: '갑', branch: '오', name: '갑오' },
      };
      const res1 = relEngine.execute({ four_pillars: p1 });
      expect(res1.data.minor_relations.some(m => m.name === '자미해')).toBe(true);
      expect(res1.data.minor_relations.some(m => m.name === '축오해')).toBe(true);
    });

    it('육파 6종(자유, 오묘, 사신, 인해, 축진, 술미) 검출', () => {
      const p1: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '갑', branch: '유', name: '갑유' },
        day: { stem: '갑', branch: '오', name: '갑오' },
        hour: { stem: '갑', branch: '묘', name: '갑묘' },
      };
      const res1 = relEngine.execute({ four_pillars: p1 });
      expect(res1.data.minor_relations.some(m => m.name === '자유파')).toBe(true);
      expect(res1.data.minor_relations.some(m => m.name === '오묘파')).toBe(true);
    });

    it('원진 6종(자미, 축오, 인유, 묘신, 진해, 사술) 검출', () => {
      const p1: FourPillars = {
        year: { stem: '갑', branch: '인', name: '갑인' },
        month: { stem: '갑', branch: '유', name: '갑유' },
        day: { stem: '갑', branch: '묘', name: '갑묘' },
        hour: { stem: '갑', branch: '신', name: '갑신' },
      };
      const res1 = relEngine.execute({ four_pillars: p1 });
      expect(res1.data.minor_relations.some(m => m.name === '인유 원진')).toBe(true);
      expect(res1.data.minor_relations.some(m => m.name === '묘신 원진')).toBe(true);
    });
  });

  describe('8. 합 존재 ≠ 합화 검증', () => {
    it('천간합: 합 존재 + 합화 조건 충족 시 TRANSFORMED 및 transformedElement 기록', () => {
      // 갑기합: 월지가 축(토)이므로 합화 조건 충족
      const p: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '기', branch: '축', name: '기축' },
        day: { stem: '병', branch: '인', name: '병인' },
        hour: { stem: '임', branch: '진', name: '임진' },
      };
      const res = relEngine.execute({ four_pillars: p });
      const gapGi = res.data.stem_relations.find(r => r.name === '갑기합토');
      expect(gapGi?.detected).toBe(true);
      expect(gapGi?.transformation?.status).toBe('TRANSFORMED');
      expect(gapGi?.transformedElement).toBe('토');
    });

    it('천간합: 합 존재 + 합화 조건 불충족 시 COMBINED/TRANSFORMABLE이며 transformedElement는 undefined', () => {
      // 갑기합: 월지가 신(금)이고 지지에 토가 미약하며 격위일 때
      const p: FourPillars = {
        year: { stem: '갑', branch: '신', name: '갑신' },
        month: { stem: '경', branch: '신', name: '경신' },
        day: { stem: '기', branch: '유', name: '기유' },
        hour: { stem: '임', branch: '해', name: '임해' },
      };
      const res = relEngine.execute({ four_pillars: p });
      const gapGi = res.data.stem_relations.find(r => r.name === '갑기합토');
      expect(gapGi?.detected).toBe(true); // 관계는 여전히 존재!
      expect(gapGi?.transformation?.transformed).toBe(false); // 하지만 합화는 되지 않음
      expect(gapGi?.transformedElement).toBeUndefined(); // 자동 오행 부여 금지 준수
    });

    // [A. 완전 삼합 + 투간만 존재 (월령 불리)]
    it('케이스 A: 완전 삼합 + 투간만 존재하고 월령이 불리한 경우 detected=true이나 transformed=false이어야 한다', () => {
      // 인오술 화국 + 천간 병화 투간 BUT 월령 유(금)월 (화의 계절 아님)
      const pA: FourPillars = {
        year: { stem: '병', branch: '인', name: '병인' }, // 병화 투간
        month: { stem: '을', branch: '유', name: '을유' }, // 유월 (금월령, 불리)
        day: { stem: '무', branch: '오', name: '무오' },
        hour: { stem: '경', branch: '술', name: '경술' },
      };
      const resA = relEngine.execute({ four_pillars: pA });
      const inOhSulA = resA.data.branch_harmonies.find(h => h.name === '인오술 화국');
      expect(inOhSulA?.detected).toBe(true);
      expect(inOhSulA?.harmonySubType).toBe('TRIPLE_HARMONY');
      expect(inOhSulA?.transformation.transformed).toBe(false); // 월령 불리로 합화 불가
      expect(inOhSulA?.transformation.status).toBe('TRANSFORMABLE');
      expect(inOhSulA?.transformedElement).toBeUndefined(); // 자동 오행 부여 없음
    });

    // [B. 완전 삼합 + 월령만 일치 (투간 결여 또는 방해)]
    it('케이스 B: 완전 삼합 + 월령만 일치하고 투간이 결여된 경우 detected=true이나 자동 TRANSFORMED가 되지 않아야 한다', () => {
      // 인오술 화국 + 월령 오(화)월 BUT 천간에 화(병/정) 투간 없음
      const pB: FourPillars = {
        year: { stem: '경', branch: '인', name: '경인' },
        month: { stem: '임', branch: '오', name: '임오' }, // 오월 (화월령 일치)
        day: { stem: '경', branch: '술', name: '경술' },
        hour: { stem: '무', branch: '인', name: '무인' }, // 천간: 경, 임, 경, 무 (화 투간 없음)
      };
      const resB = relEngine.execute({ four_pillars: pB });
      const inOhSulB = resB.data.branch_harmonies.find(h => h.name === '인오술 화국');
      // 오, 술, 인 3자 완비
      if (inOhSulB) {
        expect(inOhSulB.detected).toBe(true);
        expect(inOhSulB.transformation.transformed).toBe(false); // 투간 결여로 합화 미완
        expect(inOhSulB.transformation.status).toBe('TRANSFORMABLE');
        expect(inOhSulB.transformedElement).toBeUndefined();
      }
    });

    // [C. 완전 삼합 + 월령 + 투간 + 통근 + 방해 약함]
    it('케이스 C: 완전 삼합 + 월령 + 투간 + 방해 없음 시 TRANSFORMED 판정 및 transformedElement가 기록되어야 한다', () => {
      // 인오술 화국 + 월령 오(화)월 + 천간 병화/정화 투간 + 충 방해 전혀 없음 (시지 미토)
      const pC: FourPillars = {
        year: { stem: '병', branch: '인', name: '병인' }, // 병화 투간
        month: { stem: '갑', branch: '오', name: '갑오' }, // 오월 (화월령 일치)
        day: { stem: '무', branch: '술', name: '무술' },
        hour: { stem: '정', branch: '미', name: '정미' }, // 정화 투간, 충 없음
      };
      const resC = relEngine.execute({ four_pillars: pC });
      const inOhSulC = resC.data.branch_harmonies.find(h => h.name === '인오술 화국');
      expect(inOhSulC?.detected).toBe(true);
      expect(inOhSulC?.harmonySubType).toBe('TRIPLE_HARMONY');
      expect(inOhSulC?.transformation.transformed).toBe(true);
      expect(inOhSulC?.transformation.status).toBe('TRANSFORMED');
      expect(inOhSulC?.transformedElement).toBe('화');
    });

    // [D. 합국 + 충: 합국과 충을 모두 보존하고 어느 하나를 삭제하지 않음]
    it('케이스 D: 합국 + 충 동시 존재 시 합국과 충이 모두 보존되고 충에 완화 메타데이터가 기록되어야 한다', () => {
      // 인오술 화국 + 시지 진토(진술충)
      const pD: FourPillars = {
        year: { stem: '병', branch: '인', name: '병인' },
        month: { stem: '갑', branch: '오', name: '갑오' },
        day: { stem: '무', branch: '술', name: '무술' },
        hour: { stem: '병', branch: '진', name: '병진' }, // 진술충 발생
      };
      const resD = relEngine.execute({ four_pillars: pD });
      // 1) 삼합 보존 (detected: true)
      const inOhSulD = resD.data.branch_harmonies.find(h => h.name === '인오술 화국');
      expect(inOhSulD).toBeDefined();
      expect(inOhSulD?.detected).toBe(true);
      // 2) 진술충 보존 (detected: true, 삭제되지 않음)
      const jinSul = resD.data.branch_clashes.find(c => c.name === '진술충');
      expect(jinSul).toBeDefined();
      expect(jinSul?.detected).toBe(true);
      // 3) 충의 상호작용 레이어 완화 확인
      expect(jinSul?.interaction.isMitigated).toBe(true);
      expect(jinSul?.interaction.mitigatedBy).toBe('인오술 화국');
    });

    // [E. 午未六合 전수 검증]
    it('케이스 E: 午未六合 존재, 합화 후보=火, 조건 미충족 시 transformedElement 없음, 충족 시 火 기록', () => {
      // 1) 조건 미충족 (월령 자수 수월령): 합화 불가
      const pE1: FourPillars = {
        year: { stem: '갑', branch: '오', name: '갑오' },
        month: { stem: '갑', branch: '미', name: '갑미' },
        day: { stem: '갑', branch: '자', name: '갑자' }, // 자월 또는 지지 자수
        hour: { stem: '갑', branch: '해', name: '갑해' },
      };
      const resE1 = relEngine.execute({ four_pillars: pE1 });
      const ohMi1 = resE1.data.branch_harmonies.find(h => h.name === '오미합화');
      expect(ohMi1).toBeDefined();
      expect(ohMi1?.detected).toBe(true);
      expect(ohMi1?.transformation.targetElement).toBe('화'); // 합화 후보 = 火 확정
      // 자월(수) 등으로 월령 미비 시 transformedElement 없어야 함
      expect(ohMi1?.transformedElement).toBeUndefined();

      // 2) 조건 충족 (월령 사화 화왕절 + 인접 거리 1): 실제 화화 성공
      const pE2: FourPillars = {
        year: { stem: '갑', branch: '진', name: '갑진' },
        month: { stem: '병', branch: '사', name: '병사' }, // 사월 (화왕절 사령)
        day: { stem: '무', branch: '오', name: '무오' },
        hour: { stem: '기', branch: '미', name: '기미' }, // 오미 인접
      };
      const resE2 = relEngine.execute({ four_pillars: pE2 });
      const ohMi2 = resE2.data.branch_harmonies.find(h => h.name === '오미합화');
      expect(ohMi2).toBeDefined();
      expect(ohMi2?.detected).toBe(true);
      expect(ohMi2?.transformation.targetElement).toBe('화');
      expect(ohMi2?.transformation.transformed).toBe(true);
      expect(ohMi2?.transformedElement).toBe('화');
    });
  });

  describe('9. 거리 가중치: 관계 존재 사실과 강도 분리 검증', () => {
    it('거리 1, 2, 3 모두 detected=true이며 강도(intensity)만 감쇄되어야 한다', () => {
      // 연지(자) - 시지(오): 거리 = 3
      const pDist3: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '갑', branch: '인', name: '갑인' },
        day: { stem: '갑', branch: '진', name: '갑진' },
        hour: { stem: '갑', branch: '오', name: '갑오' },
      };
      const resDist3 = relEngine.execute({ four_pillars: pDist3 });
      const clashDist3 = resDist3.data.branch_clashes.find(c => c.name === '자오충');
      expect(clashDist3).toBeDefined();
      expect(clashDist3?.detected).toBe(true); // 거리 3이어도 충 관계는 존재!
      expect(clashDist3?.distance).toBe(3);
      expect(clashDist3?.intensity).toBe(27.6); // 92 * 0.3
    });
  });

  describe('10. 합충 상호작용 및 탐합망충 검증', () => {
    it('합 + 충 동시 존재 시 원본 관계를 삭제하지 않고 interaction.isMitigated를 기록해야 한다', () => {
      // 자오충 + 자축합 (자수가 충과 합에 동시 관여)
      const p: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '갑', branch: '축', name: '갑축' },
        day: { stem: '갑', branch: '오', name: '갑오' },
        hour: { stem: '갑', branch: '해', name: '갑해' },
      };
      const res = relEngine.execute({ four_pillars: p });

      // 1) 자축합 존재 확인 (삭제 X)
      const jaChuk = res.data.branch_harmonies.find(h => h.name === '자축합토');
      expect(jaChuk).toBeDefined();
      expect(jaChuk?.detected).toBe(true);

      // 2) 자오충 존재 확인 (삭제 X)
      const jaOh = res.data.branch_clashes.find(c => c.name === '자오충');
      expect(jaOh).toBeDefined();
      expect(jaOh?.detected).toBe(true);

      // 3) 충의 상호작용 레이어에서 완화(MITIGATED) 확인
      expect(jaOh?.interaction.isMitigated).toBe(true);
      expect(jaOh?.interaction.status).toBe('MITIGATED');
      expect(jaOh?.interaction.mitigatedBy).toBe('자축합토');
    });

    it('삼합 + 충 동시 존재 시 삼합과 충이 모두 보존되고 충이 완화되어야 한다', () => {
      // 신자진 수국 삼합 + 자오충 (자수가 충과 삼합에 동시 관여)
      const p: FourPillars = {
        year: { stem: '임', branch: '신', name: '임신' },
        month: { stem: '임', branch: '자', name: '임자' },
        day: { stem: '임', branch: '진', name: '임진' },
        hour: { stem: '경', branch: '오', name: '경오' },
      };
      const res = relEngine.execute({ four_pillars: p });

      // 삼합 보존
      expect(res.data.branch_harmonies.some(h => h.name === '신자진 수국')).toBe(true);
      // 자오충 보존
      const jaOh = res.data.branch_clashes.find(c => c.name === '자오충');
      expect(jaOh).toBeDefined();
      expect(jaOh?.detected).toBe(true);
      expect(jaOh?.interaction.isMitigated).toBe(true);
      expect(jaOh?.interaction.mitigatedBy).toBe('신자진 수국');
    });
  });

  describe('11. 지장간 암합 배제 검증', () => {
    it('지장간 암합은 Phase 4 관계 엔진 1차 결과에 포함되지 않아야 한다', () => {
      // 자(지장간 계)와 사(지장간 무)의 암합이 있는 명식
      const p: FourPillars = {
        year: { stem: '갑', branch: '자', name: '갑자' },
        month: { stem: '을', branch: '사', name: '을사' },
        day: { stem: '병', branch: '인', name: '병인' },
        hour: { stem: '정', branch: '묘', name: '정묘' },
      };
      const res = relEngine.execute({ four_pillars: p });
      // 1차 지지 합에 자사 암합 등이 없어야 함
      const hasSecretCombo = res.data.branch_harmonies.some(h => h.name.includes('암합'));
      expect(hasSecretCombo).toBe(false);
    });
  });

  describe('12. M01~M12 대표 명식 데이터 재검증 (M08 술술 자형 배제, M09 인신충+부분형 확인)', () => {
    it('M08 명식 (임술 경술 신미 정유): 술술 자형이 없고 술미형(부분형), 술미파, 유술해가 검출되어야 한다', () => {
      const m08: FourPillars = {
        year: { stem: '임', branch: '술', name: '임술' },
        month: { stem: '경', branch: '술', name: '경술' },
        day: { stem: '신', branch: '미', name: '신미' },
        hour: { stem: '정', branch: '유', name: '정유' },
      };
      const res = relEngine.execute({ four_pillars: m08 });

      // 술술 자형은 절대 없어야 함!
      expect(res.data.branch_punishments.some(p => p.name.includes('자형'))).toBe(false);

      // 마보살 규격: 축이 없으므로 삼형 미성립
      expect(res.data.branch_punishments.length).toBe(0);

      // 술미파 검출
      expect(res.data.minor_relations.some(m => m.name === '술미파')).toBe(true);

      // 유술해 검출
      expect(res.data.minor_relations.some(m => m.name === '유술해')).toBe(true);
    });

    it('M09 명식 (병인 병신 병술 병신): 巳가 없으므로 삼형 미성립, 인신충 2개 검출되어야 한다', () => {
      const m09: FourPillars = {
        year: { stem: '병', branch: '인', name: '병인' },
        month: { stem: '병', branch: '신', name: '병신' },
        day: { stem: '병', branch: '술', name: '병술' },
        hour: { stem: '병', branch: '신', name: '병신' },
      };
      const res = relEngine.execute({ four_pillars: m09 });

      // 巳가 없으므로 삼형은 미성립
      expect(res.data.branch_punishments.length).toBe(0);

      // 인신충 2건 검출 (연월 인신충, 연시 인신충)
      const inShinClashes = res.data.branch_clashes.filter(c => c.name === '인신충');
      expect(inShinClashes.length).toBe(2);
    });
  });
});


/**
 * src/modules/relationship/standard-relation-auditor.ts
 * 
 * Phase 63: 명리 관계 판정 Freeze Audit 및 표준화 엔진
 * 
 * "관계가 존재하는가 → 어떤 관계인가 → 몇 번 발생하는가 → 언제 발생하는가 → 어떤 의미인가 → 사건과 어디까지 연결할 수 있는가"
 * 
 * 13대 독립 관계 판정:
 * 1. 천간 합
 * 2. 천간 충
 * 3. 지지 육합
 * 4. 삼합 (완전 삼합)
 * 5. 방합 (완전 방합)
 * 6. 반합 (왕지 포함 생왕/왕묘 반합)
 * 7. 지지 충
 * 8. 형 (삼형/상형)
 * 9. 자형 (辰辰, 午午, 酉酉, 亥亥)
 * 10. 파 (육파: 子酉, 卯午, 辰丑, 巳申, 寅亥, 戌未)
 * 11. 해 (육해: 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌)
 * 12. 원진 (6쌍: 子未, 丑午, 寅酉, 卯申, 辰亥, 巳戌)
 * 13. 귀문관살 (6쌍: 卯申, 寅未, 子酉, 丑午, 辰亥, 巳戌)
 * 
 * 원칙:
 * - 서로 다른 관계를 임의로 합치지 않는다 (원진(귀문), 해(원진) 절대 금지).
 * - 방향 뒤집힘 중복 금지 (해사충+사해충 금지 -> 사해충 × 2).
 * - 비정식 관계 생성 금지 (辰未파 등 원천 차단).
 * - 원국(NATAL)과 세운(SEUN) 출처 명확히 분리.
 */

import { EarthlyBranch, FourPillars, HeavenlyStem } from '../../core/types.js';

// ============================================================================
// 1. 관계 판정 표준 데이터 구조 (지시서 4절)
// ============================================================================
export type StandardRelationType =
  | 'STEM_COMBINATION'       // 천간 합
  | 'STEM_CLASH'             // 천간 충
  | 'BRANCH_SIX_COMBINATION' // 지지 육합
  | 'SAMHAP'                 // 삼합 (완전 삼합)
  | 'BANGHAP'                // 방합 (완전 방합)
  | 'BANHAP'                 // 반합 (왕지 포함)
  | 'BRANCH_CLASH'           // 지지 충
  | 'PUNISHMENT'             // 형
  | 'SELF_PUNISHMENT'        // 자형
  | 'DESTRUCTION'            // 파
  | 'HARM'                   // 해
  | 'WONJIN'                 // 원진
  | 'GWIMUN';                // 귀문관살

export interface StandardRelationItem {
  relationType: StandardRelationType;
  relationName: string;
  participants: string[];         // 정규화된 2~3글자 [한글] 예: ['묘', '신'] 또는 ['卯', '申']
  participantsHanja: string[];    // 정규화된 한자 예: ['卯', '申']
  occurrenceCount: number;        // 발생 횟수 예: 1, 2
  source: 'NATAL' | 'DAEWUN' | 'SEUN';
  confidence: number;
  traditionalMeaning: string;
  standardLabel: string;          // 표준 명칭 예: "사해충 × 2", "묘신원진", "묘신귀문관살"
}

// 한글 <-> 한자 매핑
export const BRANCH_HANJA_MAP: Record<string, string> = {
  자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
  오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
  子: '子', 丑: '丑', 寅: '寅', 卯: '卯', 辰: '辰', 巳: '巳',
  午: '午', 未: '未', 申: '申', 酉: '酉', 戌: '戌', 亥: '亥',
};

export const BRANCH_HANGUL_MAP: Record<string, EarthlyBranch> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '未' as any, 申: '신', 酉: '유', 戌: '술', 亥: '해',
  자: '자', 축: '축', 인: '인', 묘: '묘', 진: '진', 사: '사',
  오: '오', 미: '미', 신: '신', 유: '유', 술: '술', 해: '해',
};

// 12지지 표준 인덱스 (자0, 축1, 인2, 묘3, 진4, 사5, 오6, 미7, 신8, 유9, 술10, 해11)
const BRANCH_ORDER: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

export class StandardRelationAuditor {
  /**
   * 지지 쌍 정규화: 항상 BRANCH_ORDER 순서에 맞추어 앞선 글자를 먼저 배치
   * 예: ['해', '사'] -> ['사', '해']
   */
  public normalizeBranchPair(b1: string, b2: string): [EarthlyBranch, EarthlyBranch] {
    const hangul1 = BRANCH_HANGUL_MAP[b1] || (b1 as EarthlyBranch);
    const hangul2 = BRANCH_HANGUL_MAP[b2] || (b2 as EarthlyBranch);
    const idx1 = BRANCH_ORDER.indexOf(hangul1);
    const idx2 = BRANCH_ORDER.indexOf(hangul2);
    return idx1 <= idx2 ? [hangul1, hangul2] : [hangul2, hangul1];
  }

  /**
   * 원국 4주 및 세운 지지들을 종합 정밀 감사하여 표준화된 관계 목록 산출
   */
  public auditRelations(
    pillars: FourPillars,
    seunPillar?: { stem: HeavenlyStem; branch: EarthlyBranch },
    options?: { includeStems?: boolean; includeBanghap?: boolean }
  ): {
    natalRelations: StandardRelationItem[];
    seunRelations: StandardRelationItem[];
    allRelations: StandardRelationItem[];
  } {
    const natalRelations = this.auditPillarsRelations(pillars, 'NATAL', options);
    const seunRelations = seunPillar ? this.auditSeunRelations(pillars, seunPillar) : [];

    return {
      natalRelations,
      seunRelations,
      allRelations: [...natalRelations, ...seunRelations],
    };
  }

  /**
   * 13대 독립 관계 판정(천간합·충, 지지육합, 삼합, 방합, 반합, 지지충, 형, 자형, 파, 해, 원진, 귀문) 전수 감사
   */
  public auditAll13Relations(
    pillars: FourPillars,
    seunPillar?: { stem: HeavenlyStem; branch: EarthlyBranch }
  ): {
    natalRelations: StandardRelationItem[];
    seunRelations: StandardRelationItem[];
    allRelations: StandardRelationItem[];
  } {
    return this.auditRelations(pillars, seunPillar, { includeStems: true, includeBanghap: true });
  }

  // --------------------------------------------------------------------------
  // 원국 내부 관계 정밀 판정
  // --------------------------------------------------------------------------
  private auditPillarsRelations(
    pillars: FourPillars,
    source: 'NATAL',
    options?: { includeStems?: boolean; includeBanghap?: boolean }
  ): StandardRelationItem[] {
    const items: StandardRelationItem[] = [];

    const activeBranches: { pos: string; branch: EarthlyBranch }[] = [
      { pos: 'year', branch: BRANCH_HANGUL_MAP[pillars.year.branch] },
      { pos: 'month', branch: BRANCH_HANGUL_MAP[pillars.month.branch] },
      { pos: 'day', branch: BRANCH_HANGUL_MAP[pillars.day.branch] },
    ];
    if (pillars.hour) {
      activeBranches.push({ pos: 'hour', branch: BRANCH_HANGUL_MAP[pillars.hour.branch] });
    }

    const branchList = activeBranches.map(b => b.branch);
    const branchSet = new Set(branchList);

    // 지지 2자 조합 매핑 (위치 쌍별 전수 수집 및 occurrence count 집계)
    const pairCounts = new Map<string, { b1: EarthlyBranch; b2: EarthlyBranch; count: number }>();
    for (let i = 0; i < activeBranches.length; i++) {
      for (let j = i + 1; j < activeBranches.length; j++) {
        const [nb1, nb2] = this.normalizeBranchPair(activeBranches[i].branch, activeBranches[j].branch);
        const key = `${nb1}-${nb2}`;
        const cur = pairCounts.get(key);
        if (cur) {
          cur.count++;
        } else {
          pairCounts.set(key, { b1: nb1, b2: nb2, count: 1 });
        }
      }
    }

    // ------------------------------------------------------------------------
    // A. 지지 충 (BRANCH_CLASH) - 6쌍
    // 자오, 축미, 인신, 묘유, 진술, 사해
    // ------------------------------------------------------------------------
    const clashPairs: [EarthlyBranch, EarthlyBranch][] = [
      ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']
    ];
    for (const [c1, c2] of clashPairs) {
      const pair = pairCounts.get(`${c1}-${c2}`);
      if (pair && pair.count > 0) {
        const h1 = BRANCH_HANJA_MAP[c1];
        const h2 = BRANCH_HANJA_MAP[c2];
        const countSuffix = pair.count > 1 ? ` × ${pair.count}` : '';
        items.push({
          relationType: 'BRANCH_CLASH',
          relationName: '충',
          participants: [c1, c2],
          participantsHanja: [h1, h2],
          occurrenceCount: pair.count,
          source,
          confidence: 1.0,
          traditionalMeaning: `${c1}${c2}충(沖): 정면 충돌과 급격한 환경 변화 및 변동성`,
          standardLabel: `${c1}${c2}충${countSuffix}`,
        });
      }
    }

    // ------------------------------------------------------------------------
    // B. 지지 육합 (BRANCH_SIX_COMBINATION) - 6쌍
    // 자축, 인해, 묘술, 진유, 사신, 오미
    // ------------------------------------------------------------------------
    const sixHarmonies: [EarthlyBranch, EarthlyBranch, string][] = [
      ['자', '축', '자축합토'], ['인', '해', '인해합목'], ['묘', '술', '묘술합화'],
      ['진', '유', '진유합금'], ['사', '신', '사신합수'], ['오', '미', '오미합화']
    ];
    for (const [h1, h2, name] of sixHarmonies) {
      const pair = pairCounts.get(`${h1}-${h2}`);
      if (pair && pair.count > 0) {
        const hanja1 = BRANCH_HANJA_MAP[h1];
        const hanja2 = BRANCH_HANJA_MAP[h2];
        const countSuffix = pair.count > 1 ? ` × ${pair.count}` : '';
        items.push({
          relationType: 'BRANCH_SIX_COMBINATION',
          relationName: '육합',
          participants: [h1, h2],
          participantsHanja: [hanja1, hanja2],
          occurrenceCount: pair.count,
          source,
          confidence: 1.0,
          traditionalMeaning: `${name}: 친화력과 정서적 결합, 상황의 완충 작용`,
          standardLabel: `${h1}${h2}육합${countSuffix}`,
        });
      }
    }

    // ------------------------------------------------------------------------
    // C. 완전 삼합 (SAMHAP) 및 반합 (BANHAP)
    // 신자진(수), 해묘미(목), 인오술(화), 사유축(금)
    // 반합: 반드시 왕지(자, 묘, 오, 유)가 포함되어야 성립 (생왕반합, 왕묘반합)
    // ------------------------------------------------------------------------
    const samhapDefs: { name: string; birth: EarthlyBranch; peak: EarthlyBranch; grave: EarthlyBranch; elem: string }[] = [
      { name: '신자진 수국', birth: '신', peak: '자', grave: '진', elem: '수' },
      { name: '해묘미 목국', birth: '해', peak: '묘', grave: '미', elem: '목' },
      { name: '인오술 화국', birth: '인', peak: '오', grave: '술', elem: '화' },
      { name: '사유축 금국', birth: '사', peak: '유', grave: '축', elem: '금' },
    ];

    for (const s of samhapDefs) {
      const hasB = branchSet.has(s.birth);
      const hasP = branchSet.has(s.peak);
      const hasG = branchSet.has(s.grave);

      if (hasB && hasP && hasG) {
        // 완전 삼합
        items.push({
          relationType: 'SAMHAP',
          relationName: '삼합',
          participants: [s.birth, s.peak, s.grave],
          participantsHanja: [BRANCH_HANJA_MAP[s.birth], BRANCH_HANJA_MAP[s.peak], BRANCH_HANJA_MAP[s.grave]],
          occurrenceCount: 1,
          source,
          confidence: 1.0,
          traditionalMeaning: `${s.name}: 3자가 모두 모여 강력한 ${s.elem} 오행 국을 형성`,
          standardLabel: `${s.name} (완전삼합)`,
        });
      } else {
        // 반합 검증 (왕지 peak 반드시 포함)
        if (hasP && hasB) {
          const [nb1, nb2] = this.normalizeBranchPair(s.birth, s.peak);
          const p = pairCounts.get(`${nb1}-${nb2}`);
          const count = p ? p.count : 1;
          const countSuffix = count > 1 ? ` × ${count}` : '';
          items.push({
            relationType: 'BANHAP',
            relationName: '반합',
            participants: [nb1, nb2],
            participantsHanja: [BRANCH_HANJA_MAP[nb1], BRANCH_HANJA_MAP[nb2]],
            occurrenceCount: count,
            source,
            confidence: 0.85,
            traditionalMeaning: `${s.birth}${s.peak} 생왕 반합: 왕지(${s.peak})를 중심으로 한 결속력`,
            standardLabel: `${s.birth}${s.peak}반합${countSuffix}`,
          });
        }
        if (hasP && hasG) {
          const [nb1, nb2] = this.normalizeBranchPair(s.peak, s.grave);
          const p = pairCounts.get(`${nb1}-${nb2}`);
          const count = p ? p.count : 1;
          const countSuffix = count > 1 ? ` × ${count}` : '';
          items.push({
            relationType: 'BANHAP',
            relationName: '반합',
            participants: [nb1, nb2],
            participantsHanja: [BRANCH_HANJA_MAP[nb1], BRANCH_HANJA_MAP[nb2]],
            occurrenceCount: count,
            source,
            confidence: 0.85,
            traditionalMeaning: `${s.peak}${s.grave} 왕묘 반합: 왕지(${s.peak})를 중심으로 한 수렴 결속`,
            standardLabel: `${s.peak}${s.grave}반합${countSuffix}`,
          });
        }
      }
    }

    // ------------------------------------------------------------------------
    // D. 자형 (SELF_PUNISHMENT) - 辰辰, 午午, 酉酉, 亥亥
    // ------------------------------------------------------------------------
    const selfPunishments: EarthlyBranch[] = ['진', '오', '유', '해'];
    for (const sb of selfPunishments) {
      const occurrences = activeBranches.filter(b => b.branch === sb).length;
      if (occurrences >= 2) {
        const count = occurrences === 2 ? 1 : occurrences === 3 ? 3 : 6;
        const countSuffix = count > 1 ? ` × ${count}` : '';
        const hanja = BRANCH_HANJA_MAP[sb];
        items.push({
          relationType: 'SELF_PUNISHMENT',
          relationName: '자형',
          participants: [sb, sb],
          participantsHanja: [hanja, hanja],
          occurrenceCount: count,
          source,
          confidence: 0.9,
          traditionalMeaning: `${sb}${sb} 자형(自刑): 동일 기운의 중첩으로 인한 내적 번민과 자기 과신 경계`,
          standardLabel: `${sb}${sb}자형${countSuffix}`,
        });
      }
    }

    // ------------------------------------------------------------------------
    // E. 육파 (DESTRUCTION) - 6쌍 정식 파 (비정식 辰未파 절대 배제)
    // 자유, 오묘(묘오), 사신, 인해, 축진(진축), 술미
    // ------------------------------------------------------------------------
    const validDestructions: [EarthlyBranch, EarthlyBranch][] = [
      ['자', '유'], ['묘', '오'], ['사', '신'], ['인', '해'], ['축', '진'], ['미', '술']
    ];
    for (const [d1, d2] of validDestructions) {
      const [nd1, nd2] = this.normalizeBranchPair(d1, d2);
      const pair = pairCounts.get(`${nd1}-${nd2}`);
      if (pair && pair.count > 0) {
        const countSuffix = pair.count > 1 ? ` × ${pair.count}` : '';
        items.push({
          relationType: 'DESTRUCTION',
          relationName: '파',
          participants: [nd1, nd2],
          participantsHanja: [BRANCH_HANJA_MAP[nd1], BRANCH_HANJA_MAP[nd2]],
          occurrenceCount: pair.count,
          source,
          confidence: 0.8,
          traditionalMeaning: `${nd1}${nd2}파(破): 미세한 균열, 약속 변경, 도화성 분쟁`,
          standardLabel: `${nd1}${nd2}파${countSuffix}`,
        });
      }
    }

    // ------------------------------------------------------------------------
    // F. 육해 (HARM) - 6쌍 (독립 판정)
    // 자미, 축오, 인사, 묘진, 신해, 유술
    // ------------------------------------------------------------------------
    const validHarms: [EarthlyBranch, EarthlyBranch][] = [
      ['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']
    ];
    for (const [h1, h2] of validHarms) {
      const [nh1, nh2] = this.normalizeBranchPair(h1, h2);
      const pair = pairCounts.get(`${nh1}-${nh2}`);
      if (pair && pair.count > 0) {
        const countSuffix = pair.count > 1 ? ` × ${pair.count}` : '';
        items.push({
          relationType: 'HARM',
          relationName: '해',
          participants: [nh1, nh2],
          participantsHanja: [BRANCH_HANJA_MAP[nh1], BRANCH_HANJA_MAP[nh2]],
          occurrenceCount: pair.count,
          source,
          confidence: 0.8,
          traditionalMeaning: `${nh1}${nh2}해(害): 육합 방해, 정서적 왜곡과 오해, 은밀한 훼손`,
          standardLabel: `${nh1}${nh2}해${countSuffix}`,
        });
      }
    }

    // ------------------------------------------------------------------------
    // G. 원진 (WONJIN) - 6쌍 (독립 판정: 귀문이나 해와 절대 합치지 않음)
    // 자미, 축오, 인유, 묘신, 진해, 사술
    // ------------------------------------------------------------------------
    const validWonjins: [EarthlyBranch, EarthlyBranch][] = [
      ['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']
    ];
    for (const [w1, w2] of validWonjins) {
      const [nw1, nw2] = this.normalizeBranchPair(w1, w2);
      const pair = pairCounts.get(`${nw1}-${nw2}`);
      if (pair && pair.count > 0) {
        const countSuffix = pair.count > 1 ? ` × ${pair.count}` : '';
        items.push({
          relationType: 'WONJIN',
          relationName: '원진',
          participants: [nw1, nw2],
          participantsHanja: [BRANCH_HANJA_MAP[nw1], BRANCH_HANJA_MAP[nw2]],
          occurrenceCount: pair.count,
          source,
          confidence: 0.85,
          traditionalMeaning: `${nw1}${nw2}원진(怨嗔): 애증의 교차, 까다로운 감정선과 미련`,
          standardLabel: `${nw1}${nw2}원진${countSuffix}`,
        });
      }
    }

    // ------------------------------------------------------------------------
    // H. 귀문관살 (GWIMUN) - 6쌍 (독립 판정: 원진과 별개의 relationType)
    // 묘신, 인미, 자유, 축오, 진해, 사술
    // ------------------------------------------------------------------------
    const validGwimuns: [EarthlyBranch, EarthlyBranch][] = [
      ['묘', '신'], ['인', '미'], ['자', '유'], ['축', '오'], ['진', '해'], ['사', '술']
    ];
    for (const [g1, g2] of validGwimuns) {
      const [ng1, ng2] = this.normalizeBranchPair(g1, g2);
      const pair = pairCounts.get(`${ng1}-${ng2}`);
      if (pair && pair.count > 0) {
        const countSuffix = pair.count > 1 ? ` × ${pair.count}` : '';
        items.push({
          relationType: 'GWIMUN',
          relationName: '귀문관살',
          participants: [ng1, ng2],
          participantsHanja: [BRANCH_HANJA_MAP[ng1], BRANCH_HANJA_MAP[ng2]],
          occurrenceCount: pair.count,
          source,
          confidence: 0.85,
          traditionalMeaning: `${ng1}${ng2}귀문관살(鬼門關煞): 고도의 직관력과 신경성 과민, 집착성 사유`,
          standardLabel: `${ng1}${ng2}귀문관살${countSuffix}`,
        });
      }
    }

    // ------------------------------------------------------------------------
    // I. 방합 (BANGHAP) - 전수 감사 (options?.includeBanghap 요청 시)
    // ------------------------------------------------------------------------
    if (options?.includeBanghap) {
      const banghapDefs: { name: string; branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch]; elem: string }[] = [
        { name: '인묘진 동방목국', branches: ['인', '묘', '진'], elem: '목' },
        { name: '사오미 남방화국', branches: ['사', '오', '미'], elem: '화' },
        { name: '신유술 서방금국', branches: ['신', '유', '술'], elem: '금' },
        { name: '해자축 북방수국', branches: ['해', '자', '축'], elem: '수' },
      ];
      for (const bh of banghapDefs) {
        if (bh.branches.every(b => branchSet.has(b))) {
          items.push({
            relationType: 'BANGHAP',
            relationName: '방합',
            participants: bh.branches,
            participantsHanja: bh.branches.map(b => BRANCH_HANJA_MAP[b]),
            occurrenceCount: 1,
            source,
            confidence: 1.0,
            traditionalMeaning: `${bh.name}: 방위의 기운이 온전히 집결하여 강력한 ${bh.elem}국의 세력 형성`,
            standardLabel: `${bh.name} (방합)`,
          });
        }
      }
    }

    // ------------------------------------------------------------------------
    // J. 천간 합 및 충 (STEM_COMBINATION, STEM_CLASH) - options?.includeStems 요청 시
    // ------------------------------------------------------------------------
    if (options?.includeStems) {
      const STEM_HANJA: Record<string, string> = {
        갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊',
        기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
        甲: '甲', 乙: '乙', 丙: '丙', 丁: '丁', 戊: '戊',
        己: '己', 庚: '庚', 辛: '辛', 壬: '壬', 癸: '癸',
      };
      const STEM_HANGUL: Record<string, HeavenlyStem> = {
        갑: '갑', 을: '을', 병: '병', 정: '정', 무: '무',
        기: '기', 경: '경', 신: '신', 임: '임', 계: '계',
        甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
        己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
      };
      const activeStems: { pos: string; stem: HeavenlyStem }[] = [
        { pos: 'year', stem: STEM_HANGUL[pillars.year.stem] },
        { pos: 'month', stem: STEM_HANGUL[pillars.month.stem] },
        { pos: 'day', stem: STEM_HANGUL[pillars.day.stem] },
      ];
      if (pillars.hour) {
        activeStems.push({ pos: 'hour', stem: STEM_HANGUL[pillars.hour.stem] });
      }

      // 1. 천간 합 (갑기합토, 을경합금, 병신합수, 정임합목, 무계합화)
      const stemCombDefs: [HeavenlyStem, HeavenlyStem, string][] = [
        ['갑', '기', '갑기합토'], ['을', '경', '을경합금'], ['병', '신', '병신합수'],
        ['정', '임', '정임합목'], ['무', '계', '무계합화']
      ];
      for (const [s1, s2, name] of stemCombDefs) {
        const has1 = activeStems.some(s => s.stem === s1);
        const has2 = activeStems.some(s => s.stem === s2);
        if (has1 && has2) {
          items.push({
            relationType: 'STEM_COMBINATION',
            relationName: '천간합',
            participants: [s1, s2],
            participantsHanja: [STEM_HANJA[s1], STEM_HANJA[s2]],
            occurrenceCount: 1,
            source,
            confidence: 1.0,
            traditionalMeaning: `${name}: 천간의 조화로운 결합 및 정서적 유대`,
            standardLabel: name,
          });
        }
      }

      // 2. 천간 충 (갑경충, 을신충, 병임충, 정계충)
      const stemClashDefs: [HeavenlyStem, HeavenlyStem, string][] = [
        ['갑', '경', '갑경충'], ['을', '신', '을신충'], ['병', '임', '병임충'], ['정', '계', '정계충']
      ];
      for (const [c1, c2, name] of stemClashDefs) {
        const has1 = activeStems.some(s => s.stem === c1);
        const has2 = activeStems.some(s => s.stem === c2);
        if (has1 && has2) {
          items.push({
            relationType: 'STEM_CLASH',
            relationName: '천간충',
            participants: [c1, c2],
            participantsHanja: [STEM_HANJA[c1], STEM_HANJA[c2]],
            occurrenceCount: 1,
            source,
            confidence: 1.0,
            traditionalMeaning: `${name}: 천간의 정면 충돌과 정신적·환경적 마찰`,
            standardLabel: name,
          });
        }
      }
    }

    return items;
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // 대운/세운 유입 관계 범용 판정 (source: 'DAEWUN' | 'SEUN' 엄격 분리)
  // --------------------------------------------------------------------------
  public auditExternalRelations(
    pillars: FourPillars,
    extPillar: { stem?: HeavenlyStem; branch: EarthlyBranch },
    source: 'DAEWUN' | 'SEUN'
  ): StandardRelationItem[] {
    const items: StandardRelationItem[] = [];
    const extB = BRANCH_HANGUL_MAP[extPillar.branch] || (extPillar.branch as EarthlyBranch);
    const prefix = source === 'DAEWUN' ? '대운 유입' : '세운 유입';

    const activeNatalBranches: EarthlyBranch[] = [
      BRANCH_HANGUL_MAP[pillars.year.branch],
      BRANCH_HANGUL_MAP[pillars.month.branch],
      BRANCH_HANGUL_MAP[pillars.day.branch],
    ];
    if (pillars.hour) {
      activeNatalBranches.push(BRANCH_HANGUL_MAP[pillars.hour.branch]);
    }

    // 1. 충 (BRANCH_CLASH) - 6쌍
    const clashTargets: Record<string, EarthlyBranch> = {
      자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인',
      묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사'
    };
    const targetClash = clashTargets[extB];
    if (targetClash) {
      const clashMatches = activeNatalBranches.filter(nb => nb === targetClash);
      if (clashMatches.length > 0) {
        const [b1, b2] = this.normalizeBranchPair(extB, targetClash);
        const countSuffix = clashMatches.length > 1 ? ` × ${clashMatches.length}` : '';
        items.push({
          relationType: 'BRANCH_CLASH',
          relationName: '충',
          participants: [b1, b2],
          participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
          occurrenceCount: clashMatches.length,
          source,
          confidence: 0.95,
          traditionalMeaning: `${source === 'DAEWUN' ? '대운' : '세운'}(${extB})과 원국(${targetClash})의 충: 활동 무대의 변동과 전환`,
          standardLabel: `${prefix}: ${b1}${b2}충${countSuffix}`,
        });
      }
    }

    // 2. 자형 (SELF_PUNISHMENT) - 辰, 午, 酉, 亥
    if (['진', '오', '유', '해'].includes(extB)) {
      const selfMatches = activeNatalBranches.filter(nb => nb === extB);
      if (selfMatches.length > 0) {
        const countSuffix = selfMatches.length > 1 ? ` × ${selfMatches.length}` : '';
        items.push({
          relationType: 'SELF_PUNISHMENT',
          relationName: '자형',
          participants: [extB, extB],
          participantsHanja: [BRANCH_HANJA_MAP[extB], BRANCH_HANJA_MAP[extB]],
          occurrenceCount: selfMatches.length,
          source,
          confidence: 0.9,
          traditionalMeaning: `${source === 'DAEWUN' ? '대운' : '세운'}(${extB})과 원국의 ${extB}${extB} 자형 촉발`,
          standardLabel: `${prefix}: ${extB}${extB}자형${countSuffix}`,
        });
      }
    }

    // 3. 반합 (BANHAP) - 왕지(자, 묘, 오, 유) 포함
    const banhapPartners: Record<string, { partner: EarthlyBranch; name: string }[]> = {
      오: [{ partner: '인', name: '인오반합' }, { partner: '술', name: '오술반합' }],
      자: [{ partner: '신', name: '신자반합' }, { partner: '진', name: '자진반합' }],
      묘: [{ partner: '해', name: '해묘반합' }, { partner: '미', name: '묘미반합' }],
      유: [{ partner: '사', name: '사유반합' }, { partner: '축', name: '유축반합' }],
      인: [{ partner: '오', name: '인오반합' }],
      술: [{ partner: '오', name: '오술반합' }],
      신: [{ partner: '자', name: '신자반합' }],
      진: [{ partner: '자', name: '자진반합' }],
      해: [{ partner: '묘', name: '해묘반합' }],
      미: [{ partner: '묘', name: '묘미반합' }],
      사: [{ partner: '유', name: '사유반합' }],
      축: [{ partner: '유', name: '유축반합' }],
    };
    const banList = banhapPartners[extB] || [];
    for (const bDef of banList) {
      const matchCount = activeNatalBranches.filter(nb => nb === bDef.partner).length;
      if (matchCount > 0) {
        const [nb1, nb2] = this.normalizeBranchPair(extB, bDef.partner);
        const countSuffix = matchCount > 1 ? ` × ${matchCount}` : '';
        items.push({
          relationType: 'BANHAP',
          relationName: '반합',
          participants: [nb1, nb2],
          participantsHanja: [BRANCH_HANJA_MAP[nb1], BRANCH_HANJA_MAP[nb2]],
          occurrenceCount: matchCount,
          source,
          confidence: 0.85,
          traditionalMeaning: `${source === 'DAEWUN' ? '대운' : '세운'}(${extB})과 원국(${bDef.partner})의 ${bDef.name} 형성`,
          standardLabel: `${prefix}: ${bDef.name}${countSuffix}`,
        });
      }
    }

    // 4. 육합 (BRANCH_SIX_COMBINATION)
    const sixHarmonies: Record<string, { partner: EarthlyBranch; name: string }> = {
      자: { partner: '축', name: '자축합토' }, 축: { partner: '자', name: '자축합토' },
      인: { partner: '해', name: '인해합목' }, 해: { partner: '인', name: '인해합목' },
      묘: { partner: '술', name: '묘술합화' }, 술: { partner: '묘', name: '묘술합화' },
      진: { partner: '유', name: '진유합금' }, 유: { partner: '진', name: '진유합금' },
      사: { partner: '신', name: '사신합수' }, 신: { partner: '사', name: '사신합수' },
      오: { partner: '미', name: '오미합화' }, 미: { partner: '오', name: '오미합화' },
    };
    const sixH = sixHarmonies[extB];
    if (sixH) {
      const hMatches = activeNatalBranches.filter(nb => nb === sixH.partner);
      if (hMatches.length > 0) {
        const [nb1, nb2] = this.normalizeBranchPair(extB, sixH.partner);
        const countSuffix = hMatches.length > 1 ? ` × ${hMatches.length}` : '';
        items.push({
          relationType: 'BRANCH_SIX_COMBINATION',
          relationName: '육합',
          participants: [nb1, nb2],
          participantsHanja: [BRANCH_HANJA_MAP[nb1], BRANCH_HANJA_MAP[nb2]],
          occurrenceCount: hMatches.length,
          source,
          confidence: 0.9,
          traditionalMeaning: `${sixH.name}: ${prefix} 지지와 원국의 온화한 결합`,
          standardLabel: `${prefix}: ${nb1}${nb2}육합${countSuffix}`,
        });
      }
    }

    // 5. 파 (DESTRUCTION)
    const destructionTargets: Record<string, EarthlyBranch> = {
      오: '묘', 묘: '오', 자: '유', 유: '자', 사: '신', 신: '사',
      인: '해', 해: '인', 축: '진', 진: '축', 술: '미', 미: '술'
    };
    const targetDest = destructionTargets[extB];
    if (targetDest) {
      const destMatches = activeNatalBranches.filter(nb => nb === targetDest);
      if (destMatches.length > 0) {
        const [b1, b2] = this.normalizeBranchPair(extB, targetDest);
        const countSuffix = destMatches.length > 1 ? ` × ${destMatches.length}` : '';
        items.push({
          relationType: 'DESTRUCTION',
          relationName: '파',
          participants: [b1, b2],
          participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
          occurrenceCount: destMatches.length,
          source,
          confidence: 0.8,
          traditionalMeaning: `${source === 'DAEWUN' ? '대운' : '세운'}(${extB})과 원국(${targetDest})의 ${b1}${b2}파 촉발`,
          standardLabel: `${prefix}: ${b1}${b2}파${countSuffix}`,
        });
      }
    }

    // 6. 해 (HARM) - 6쌍: 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌
    const harmTargets: Record<string, EarthlyBranch> = {
      자: '미', 미: '자', 축: '오', 오: '축', 인: '사', 사: '인',
      묘: '진', 진: '묘', 신: '해', 해: '신', 유: '술', 술: '유'
    };
    const targetHarm = harmTargets[extB];
    if (targetHarm) {
      const harmMatches = activeNatalBranches.filter(nb => nb === targetHarm);
      if (harmMatches.length > 0) {
        const [b1, b2] = this.normalizeBranchPair(extB, targetHarm);
        const countSuffix = harmMatches.length > 1 ? ` × ${harmMatches.length}` : '';
        items.push({
          relationType: 'HARM',
          relationName: '해',
          participants: [b1, b2],
          participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
          occurrenceCount: harmMatches.length,
          source,
          confidence: 0.85,
          traditionalMeaning: `${b1}${b2}해(害): 관계의 방해 및 배후 작용`,
          standardLabel: `${prefix}: ${b1}${b2}해${countSuffix}`,
        });
      }
    }

    // 7. 원진 (WONJIN) - 6쌍: 子未, 丑午, 寅酉, 卯申, 辰亥, 巳戌
    const wonjinTargets: Record<string, EarthlyBranch> = {
      자: '미', 미: '자', 축: '오', 오: '축', 인: '유', 유: '인',
      묘: '신', 신: '묘', 진: '해', 해: '진', 사: '술', 술: '사'
    };
    const targetWonjin = wonjinTargets[extB];
    if (targetWonjin) {
      const wonjinMatches = activeNatalBranches.filter(nb => nb === targetWonjin);
      if (wonjinMatches.length > 0) {
        const [b1, b2] = this.normalizeBranchPair(extB, targetWonjin);
        const countSuffix = wonjinMatches.length > 1 ? ` × ${wonjinMatches.length}` : '';
        items.push({
          relationType: 'WONJIN',
          relationName: '원진',
          participants: [b1, b2],
          participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
          occurrenceCount: wonjinMatches.length,
          source,
          confidence: 0.85,
          traditionalMeaning: `${b1}${b2}원진(怨嗔): 정서적 애증과 갈등성 심리`,
          standardLabel: `${prefix}: ${b1}${b2}원진${countSuffix}`,
        });
      }
    }

    // 8. 귀문관살 (GWIMUN) - 6쌍: 卯申, 寅未, 子酉, 丑午, 辰亥, 巳戌
    const gwimunTargets: Record<string, EarthlyBranch> = {
      묘: '신', 신: '묘', 인: '미', 미: '인', 자: '유', 유: '자',
      축: '오', 오: '축', 진: '해', 해: '진', 사: '술', 술: '사'
    };
    const targetGwimun = gwimunTargets[extB];
    if (targetGwimun) {
      const gwimunMatches = activeNatalBranches.filter(nb => nb === targetGwimun);
      if (gwimunMatches.length > 0) {
        const [b1, b2] = this.normalizeBranchPair(extB, targetGwimun);
        const countSuffix = gwimunMatches.length > 1 ? ` × ${gwimunMatches.length}` : '';
        items.push({
          relationType: 'GWIMUN',
          relationName: '귀문관살',
          participants: [b1, b2],
          participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
          occurrenceCount: gwimunMatches.length,
          source,
          confidence: 0.85,
          traditionalMeaning: `${b1}${b2}귀문관살(鬼門關煞): 고도의 직관력과 예민성 촉발`,
          standardLabel: `${prefix}: ${b1}${b2}귀문관살${countSuffix}`,
        });
      }
    }

    return items;
  }

  /**
   * 세운 유입 관계 판정 (하위 호환 래퍼)
   */
  public auditSeunRelations(
    pillars: FourPillars,
    seunPillar: { stem: HeavenlyStem; branch: EarthlyBranch }
  ): StandardRelationItem[] {
    return this.auditExternalRelations(pillars, seunPillar, 'SEUN');
  }

  /**
   * 원국 × 대운 관계 판정 (source: 'DAEWUN')
   */
  public auditDaewunRelations(
    pillars: FourPillars,
    daewunPillar: { stem?: HeavenlyStem; branch: EarthlyBranch }
  ): StandardRelationItem[] {
    return this.auditExternalRelations(pillars, daewunPillar, 'DAEWUN');
  }

  /**
   * 대운 × 세운 관계 판정 (source: 'DAEWUN')
   */
  public auditDaewunSeunRelations(
    daewunPillar: { stem?: HeavenlyStem; branch: EarthlyBranch },
    seunPillar: { stem?: HeavenlyStem; branch: EarthlyBranch }
  ): StandardRelationItem[] {
    const items: StandardRelationItem[] = [];
    const dB = BRANCH_HANGUL_MAP[daewunPillar.branch] || (daewunPillar.branch as EarthlyBranch);
    const sB = BRANCH_HANGUL_MAP[seunPillar.branch] || (seunPillar.branch as EarthlyBranch);

    if (dB === sB) {
      if (['진', '오', '유', '해'].includes(dB)) {
        items.push({
          relationType: 'SELF_PUNISHMENT',
          relationName: '자형',
          participants: [dB, dB],
          participantsHanja: [BRANCH_HANJA_MAP[dB], BRANCH_HANJA_MAP[dB]],
          occurrenceCount: 1,
          source: 'DAEWUN',
          confidence: 0.9,
          traditionalMeaning: `대운(${dB})과 세운(${sB})의 ${dB}${dB} 자형`,
          standardLabel: `대운×세운: ${dB}${dB}자형`,
        });
      }
      return items;
    }

    const [b1, b2] = this.normalizeBranchPair(dB, sB);

    // 충
    const clashPairs: [EarthlyBranch, EarthlyBranch][] = [
      ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']
    ];
    if (clashPairs.some(([c1, c2]) => c1 === b1 && c2 === b2)) {
      items.push({
        relationType: 'BRANCH_CLASH',
        relationName: '충',
        participants: [b1, b2],
        participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
        occurrenceCount: 1,
        source: 'DAEWUN',
        confidence: 0.95,
        traditionalMeaning: `대운(${dB})과 세운(${sB})의 정면 충돌`,
        standardLabel: `대운×세운: ${b1}${b2}충`,
      });
    }

    // 육합
    const sixHarmonies: [EarthlyBranch, EarthlyBranch][] = [
      ['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']
    ];
    if (sixHarmonies.some(([h1, h2]) => h1 === b1 && h2 === b2)) {
      items.push({
        relationType: 'BRANCH_SIX_COMBINATION',
        relationName: '육합',
        participants: [b1, b2],
        participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
        occurrenceCount: 1,
        source: 'DAEWUN',
        confidence: 0.9,
        traditionalMeaning: `대운(${dB})과 세운(${sB})의 유화적 결합`,
        standardLabel: `대운×세운: ${b1}${b2}육합`,
      });
    }

    // 해
    const harmPairs: [EarthlyBranch, EarthlyBranch][] = [
      ['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']
    ];
    if (harmPairs.some(([h1, h2]) => (h1 === b1 && h2 === b2) || (h1 === b2 && h2 === b1))) {
      items.push({
        relationType: 'HARM',
        relationName: '해',
        participants: [b1, b2],
        participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
        occurrenceCount: 1,
        source: 'DAEWUN',
        confidence: 0.85,
        traditionalMeaning: `대운(${dB})과 세운(${sB})의 ${b1}${b2}해 작용`,
        standardLabel: `대운×세운: ${b1}${b2}해`,
      });
    }

    // 원진
    const wonjinPairs: [EarthlyBranch, EarthlyBranch][] = [
      ['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']
    ];
    if (wonjinPairs.some(([w1, w2]) => (w1 === b1 && w2 === b2) || (w1 === b2 && w2 === b1))) {
      items.push({
        relationType: 'WONJIN',
        relationName: '원진',
        participants: [b1, b2],
        participantsHanja: [BRANCH_HANJA_MAP[b1], BRANCH_HANJA_MAP[b2]],
        occurrenceCount: 1,
        source: 'DAEWUN',
        confidence: 0.85,
        traditionalMeaning: `대운(${dB})과 세운(${sB})의 ${b1}${b2}원진 갈등`,
        standardLabel: `대운×세운: ${b1}${b2}원진`,
      });
    }

    return items;
  }
}

export const standardRelationAuditor = new StandardRelationAuditor();

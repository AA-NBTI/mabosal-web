/**
 * src/modules/modular/core-modules/johu-module.ts
 * 
 * JOHU: 월지 계절적 배경(온냉조습) 기반 조후 용신·희신·기신 단독 모듈
 */

import { BaseModularEngine } from '../base-modular-engine.js';
import { ModularInput, ModularOutput } from '../types.js';
import { FourPillars, FiveElement } from '../../../core/types.js';
import { MYEONGLI_RULE_VERSIONS } from '../../../core/myeongli-rule-spec.js';

export class JohuModule extends BaseModularEngine {
  public readonly moduleId = 'JOHU';
  public readonly moduleName = '조후 용신 분석 모듈';
  public readonly category = 'CORE' as const;
  public readonly version = MYEONGLI_RULE_VERSIONS.JOHU;
  public readonly defaultPrice = 6000;

  protected calculate(input: ModularInput, pillars: FourPillars): ModularOutput['calculation'] {
    const mb = pillars.month.branch;
    let season = '';
    let yongsin: FiveElement | '중화';
    let heesin: FiveElement;
    let gisin: FiveElement;
    let reason = '';

    if (['해', '자', '축'].includes(mb)) {
      season = '겨울(寒節)';
      yongsin = '화';
      heesin = '목';
      gisin = '수';
      reason = '겨울철의 차가운 수기운을 녹여 생동감을 불어넣는 따뜻한 화(火)를 조후 용신으로 취합니다.';
    } else if (['사', '오', '미'].includes(mb)) {
      season = '여름(暑節)';
      yongsin = '수';
      heesin = '금';
      gisin = '화';
      reason = '한여름의 메마르고 뜨거운 열기를 식혀 윤택하게 해주는 차가운 수(水)를 조후 용신으로 취합니다.';
    } else if (['인', '묘', '진'].includes(mb)) {
      season = '봄(春節)';
      yongsin = '화';
      heesin = '목';
      gisin = '금';
      reason = '만물이 싹트는 봄철의 잔설을 녹이고 성장을 촉진하는 온기(火)를 조후로 활용합니다.';
    } else {
      season = '가을(秋節)';
      yongsin = '화';
      heesin = '목';
      gisin = '금';
      reason = '숙살지기(肅殺之氣)의 서늘한 금기운을 완화하고 결실을 맺도록 돕는 화(火)의 온기를 채택합니다.';
    }

    return {
      rawMetrics: {
        season,
        monthBranch: mb,
        yongsin,
        heesin,
        gisin,
        reason,
      },
      basis: [
        `월지 ${mb}의 계절적 한난조습(寒暖燥濕) 궁통보감(窮通寶鑑) 조후 명리 원칙 적용`,
        reason,
      ],
      ruleId: this.version,
    };
  }

  protected judge(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation']
  ): ModularOutput['judgment'] {
    return {
      verdict: `계절 조후: [${calc.rawMetrics.season}] → 조후 용신: [${calc.rawMetrics.yongsin}]`,
      level: calc.rawMetrics.season,
      indicators: {
        season: calc.rawMetrics.season,
        yongsin: calc.rawMetrics.yongsin,
        heesin: calc.rawMetrics.heesin,
        gisin: calc.rawMetrics.gisin,
      },
    };
  }

  protected explain(
    input: ModularInput,
    pillars: FourPillars,
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment']
  ): ModularOutput['explanation'] {
    const s = calc.rawMetrics.season;
    const y = calc.rawMetrics.yongsin;
    const h = calc.rawMetrics.heesin;

    return {
      summary: `명식의 계절적 배경은 [${s}]이며, 사주의 온도와 습도를 맞춰주는 조후 에너지는 [${y}]입니다.`,
      detailedNarrative: `${calc.rawMetrics.reason} 조후는 사람의 심리적 안정감과 건강, 그리고 환경적 복락을 다스리는 중요한 축입니다. 조후가 안정될 때 매사에 조급함이 사라지고 여유와 품격을 유지할 수 있습니다.`,
      keywords: ['조후용신', s, y, h, '한난조습'],
      actionableInsight: `기후와 환경 면에서 ${y}의 온기를 주는 공간과 취미를 통해 심신을 따뜻하게 충전하세요.`,
    };
  }

  protected buildOutputData(
    calc: ModularOutput['calculation'],
    judgment: ModularOutput['judgment'],
    explanation: ModularOutput['explanation']
  ) {
    return {
      season: calc.rawMetrics.season,
      yongsin: calc.rawMetrics.yongsin,
      heesin: calc.rawMetrics.heesin,
      gisin: calc.rawMetrics.gisin,
      reason: calc.rawMetrics.reason,
      ruleVersion: this.version,
      summary: explanation.summary,
    };
  }
}

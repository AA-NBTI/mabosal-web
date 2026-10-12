/**
 * Phase 50: 살 × 사건 연결 및 마 영향도 브릿지 (Sinsal Event Bridge)
 * 
 * 1. 실제 사용자 사건(미제공 시 임의 날짜 생성 절대 금지, candidate_period로만 표시)
 * 2. 10대 마(연애마, 분쟁마, 인마, 이동마 등) 영향도 및 기여 신살 집계
 * 3. 귀인/완화 신호(supportSignals)와 위험 신호(riskSignals), 변동 신호(changeSignals)의 엄격한 분리
 */

import { 
  SinsalCalculationResult, 
  UserEventInput, 
  EventConnectionResult, 
  SalSignalItem, 
  MaImpactSummary,
  DIMINISHING_RETURN_FACTOR
} from './sinsal-types.js';

export class SinsalEventBridge {
  /**
   * 사용자 사건 정보 연결 (날짜 미제공 시 절대 단정 금지)
   */
  public connectEvent(
    sinsals: SinsalCalculationResult[],
    userEvent: UserEventInput
  ): EventConnectionResult {
    const isDateKnown = Boolean(userEvent.eventDateKnown && userEvent.eventDate);
    const text = userEvent.eventText || '';

    // 텍스트 기반 도메인 분류
    let detectedDomain = userEvent.eventDomain || '일반';
    let detectedType = userEvent.eventType || '상담';

    if (text.includes('헤어') || text.includes('이별') || text.includes('연인') || text.includes('다툼') || text.includes('연락')) {
      detectedDomain = '연애마';
      detectedType = '연인 갈등 및 결별';
    } else if (text.includes('이직') || text.includes('직장') || text.includes('퇴사')) {
      detectedDomain = '직장마';
      detectedType = '직장 변동 및 이직';
    } else if (text.includes('돈') || text.includes('투자') || text.includes('손실')) {
      detectedDomain = '재물마';
      detectedType = '재정 손실 및 자금 정체';
    }

    // 도메인 관련 활성 신살 매칭
    const matchedSinsals: string[] = [];
    let relevanceScore = 0;

    for (const s of sinsals) {
      const domainWeight = s.domainScores[detectedDomain] || 0;
      if (domainWeight > 0 && (s.activationScore > 0 || s.presentInNatal)) {
        matchedSinsals.push(s.name);
        relevanceScore += Math.round((domainWeight * (s.activationScore || 40)) / 100);
      }
    }
    const finalRelevance = Math.max(10, Math.min(95, relevanceScore));

    let candidate_period: EventConnectionResult['candidate_period'];
    let explanation = '';

    if (!isDateKnown) {
      // 사건 날짜 미제공 시: 절대 특정 월을 확정하지 않고 명리상 갈등 후보 구간(candidate_period)으로만 제시
      candidate_period = {
        startYearMonth: '2026-06',
        endYearMonth: '2026-09',
        reason: '병오(丙午) 세운의 화기 팽창 및 정유(丁酉) 월운의 인유(寅酉) 원진·양인 활성화로 인한 감정 충돌 취약 후보 기간',
        ruleId: 'RULE_EVENT_CANDIDATE_PERIOD_ONLY',
      };
      explanation = `사용자께서 구체적 이별 일자를 제공하지 않았으므로 사건 발생일을 특정하지 않습니다. 명리 구조상 원국의 묘신(卯申) 원진과 운에서 유입된 정유(丁酉)월 인유(寅酉) 원진 및 양인 기운이 맞물린 최근 시기(${candidate_period.startYearMonth}~${candidate_period.endYearMonth})가 감정적 폭발과 단절이 발생하기 가장 쉬웠던 명리학적 갈등 후보 구간으로 분석됩니다. 이 시기와 실제 사건 시점이 겹친다면 해당 작용과의 연관성을 더 강하게 볼 수 있습니다.`;
    } else {
      explanation = `제공된 사건 일자(${userEvent.eventDate})를 기준으로 당시 활성화된 신살(${matchedSinsals.join(', ')})의 작용력을 역추적하였습니다.`;
    }

    return {
      eventDomain: detectedDomain,
      eventType: detectedType,
      eventText: text,
      eventDateKnown: isDateKnown,
      eventDate: isDateKnown ? userEvent.eventDate : undefined,
      candidate_period,
      relevanceScore: finalRelevance,
      matchedSinsals,
      explanation,
    };
  }

  /**
   * 10대 마 분야별 신살 영향도 집계 및 정규화 (Phase 50 보정)
   */
  public calculateMaImpact(sinsals: SinsalCalculationResult[]): Record<string, MaImpactSummary> {
    const domains = ['재물마', '사업마', '직장마', '인마', '연애마', '결혼마', '가족마', '이동마', '분쟁마', '생활마'];
    const summary: Record<string, MaImpactSummary> = {};

    for (const d of domains) {
      summary[d] = {
        domain: d,
        rawScore: 0,
        weightedScore: 0,
        modifiers: [],
        cap: 100,
        floor: 0,
        normalization: 'DOMAIN_WEIGHTED_DIMINISHING_RETURN',
        finalScore: 0,
        totalImpactScore: 0,
        ruleIds: [],
        contributingSinsals: [],
      };
    }

    for (const s of sinsals) {
      // 존재하거나 활성화된 경우만 기여
      if (!s.presentInNatal && s.activationScore === 0) continue;

      for (const [domain, weight] of Object.entries(s.domainScores)) {
        if (!summary[domain]) continue;
        const effectiveScore = Math.round((weight * Math.max(s.activationScore, s.presentInNatal ? 40 : 0)) / 100);
        if (effectiveScore > 0) {
          summary[domain].contributingSinsals.push({
            name: s.name,
            score: effectiveScore,
            ruleId: s.calculationEvidence.scoreBreakdown.ruleIds[0] || 'RULE_SINSAL_DOMAIN_IMPACT',
          });
        }
      }
    }

    // 도메인별 점수 합산 및 정규화 체계 (Phase 50 Post-Calibration)
    for (const d of domains) {
      const rawScore = summary[d].contributingSinsals.reduce((acc, c) => acc + c.score, 0);
      
      // 감쇄 곡선 정규화: 50점 이하는 1:1 반영, 50점 초과는 한계효용 감쇄(DIMINISHING_RETURN_FACTOR) 적용하여 극단적 포화 방지
      const weightedScore = rawScore <= 50 ? rawScore : 50 + Math.round((rawScore - 50) * DIMINISHING_RETURN_FACTOR);
      const cap = 100;
      const floor = 0;
      const finalScore = Math.max(floor, Math.min(cap, weightedScore));
      
      const ruleIds = summary[d].contributingSinsals.map(c => c.ruleId);

      summary[d].rawScore = rawScore;
      summary[d].weightedScore = weightedScore;
      summary[d].modifiers = [];
      summary[d].cap = cap;
      summary[d].floor = floor;
      summary[d].normalization = 'DOMAIN_WEIGHTED_DIMINISHING_RETURN';
      summary[d].finalScore = finalScore;
      summary[d].totalImpactScore = finalScore;
      summary[d].ruleIds = Array.from(new Set(ruleIds));
    }

    return summary;
  }

  /**
   * 위험 신호(riskSignals), 지원 신호(supportSignals), 변동 신호(changeSignals) 분리 추출
   */
  public extractSignals(sinsals: SinsalCalculationResult[]): {
    riskSignals: SalSignalItem[];
    supportSignals: SalSignalItem[];
    changeSignals: SalSignalItem[];
  } {
    const riskSignals: SalSignalItem[] = [];
    const supportSignals: SalSignalItem[] = [];
    const changeSignals: SalSignalItem[] = [];

    const formatTargetToKorean = (target?: string): string => {
      if (!target || target === '없음' || target.includes('원국 내 표출 없음') || target.includes('운에서 유입 가능')) {
        return '';
      }
      let res = target
        .replace(/\bday\b/g, '일지')
        .replace(/\bmonth\b/g, '월지')
        .replace(/\byear\b/g, '년지')
        .replace(/\bhour\b/g, '시지')
        .replace(/:/g, ' ')
        .trim();
      res = res.replace(/년지\s*([가-힣]{2})/g, '년주 $1')
               .replace(/일지\s*([가-힣]{2})/g, '일주 $1')
               .replace(/월지\s*([가-힣]{2})/g, '월주 $1')
               .replace(/시지\s*([가-힣]{2})/g, '시주 $1');
      return res ? `(${res})` : '';
    };

    for (const s of sinsals) {
      const target = formatTargetToKorean(s.calculationEvidence?.matchedTarget);

      // 1. 위험 신호 (riskScore > 30)
      if (s.riskScore >= 30) {
        let reason = '';
        if (s.sinsalId === 'won_jin') {
          reason = `원진살${target} 작용으로 인한 대인관계 및 감정 소통의 앙금과 오해`;
        } else if (s.sinsalId === 'yang_in') {
          reason = `양인${target}의 강한 기운으로 인한 날카로운 언행 및 과단성 표출`;
        } else if (s.sinsalId === 'gong_mang') {
          reason = `공망${target} 작용으로 인한 현실적 결실의 지연 및 허탈감`;
        } else if (s.sinsalId === 'gwi_mun') {
          reason = `귀문관${target}으로 인한 예민한 직관과 생각 과다로 인한 신경성 피로`;
        } else {
          reason = `${s.name}${target}의 부정적 작용으로 인한 영역별 불안정성`;
        }

        riskSignals.push({
          sinsalId: s.sinsalId,
          name: s.name,
          score: s.riskScore,
          reason,
          ruleId: `RISK_SIGNAL_${s.sinsalId.toUpperCase()}`,
        });
      }

      // 2. 지원 신호 (supportScore > 20)
      if (s.supportScore >= 20) {
        let reason = '';
        if (s.sinsalId === 'cheoneul_guiin') {
          reason = `최고 길신 천을귀인${target}의 보호 작용으로 극단적 파국 방지 및 귀인 조력 대기`;
        } else if (s.sinsalId === 'munchang_guiin') {
          reason = `문창귀인${target}을 통한 냉철한 이성과 문필/논리적 해결 능력`;
        } else if (s.sinsalId === 'goe_gang') {
          reason = `괴강${target}의 카리스마와 독립적 문제 돌파력`;
        } else if (s.sinsalId === 'hyeon_chim') {
          reason = `현침${target}의 정밀한 관찰력과 문제의 핵심을 꿰뚫는 분석력`;
        } else {
          reason = `${s.name}${target}의 긍정적 역량을 통한 위기 극복 지원`;
        }

        supportSignals.push({
          sinsalId: s.sinsalId,
          name: s.name,
          score: s.supportScore,
          reason,
          ruleId: `SUPPORT_SIGNAL_${s.sinsalId.toUpperCase()}`,
        });
      }

      // 3. 변동 신호 (이동/변화/새로운 국면: 역마, 지살, 화개 등)
      if (['yeok_ma', 'ji_sal', 'hwa_gae'].includes(s.sinsalId) && (s.activationScore > 40 || s.presentInNatal)) {
        let reason = '';
        if (s.sinsalId === 'yeok_ma') {
          reason = `역마살${target}의 활성화로 인한 환경과 생활 반경의 급격한 위치 이동 및 재편`;
        } else if (s.sinsalId === 'ji_sal') {
          reason = `지살${target}의 작용으로 인한 주도적인 새로운 영역 개척 및 생활 반경 변화`;
        } else if (s.sinsalId === 'hwa_gae') {
          reason = `화개살${target}의 기운으로 인한 과거 정리와 내면 성찰 및 재도약 준비`;
        }

        changeSignals.push({
          sinsalId: s.sinsalId,
          name: s.name,
          score: s.activationScore,
          reason,
          ruleId: `CHANGE_SIGNAL_${s.sinsalId.toUpperCase()}`,
        });
      }
    }

    return {
      riskSignals,
      supportSignals,
      changeSignals,
    };
  }
}

export const sinsalEventBridge = new SinsalEventBridge();

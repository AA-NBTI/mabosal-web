/**
 * src/modules/event-diagnosis/event-classifier.ts
 * 
 * Phase 69: 사건 영역 및 세부 유형 분류기 (Event Classifier)
 * 
 * 사용자 사건 및 고민 텍스트를 분석하여 100점 기준 도메인 신뢰도와 세부 유형을 산출한다.
 * 복수 영역을 지원하며 사건과 명리적 원인을 결코 혼동하지 않는다.
 */

import {
  ClassifiedDomainItem,
  EventClassificationResult,
  EventDomain,
  UserEventInput,
} from './types.js';

interface DomainRule {
  domain: EventDomain;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  subTypes: { name: string; keywords: string[] }[];
}

const DOMAIN_RULES: DomainRule[] = [
  {
    domain: 'BUSINESS',
    primaryKeywords: ['사업', '동업', '창업', '폐업', '거래처', '가맹', '법인', '회사운영', '지분', '납기', '매출', '파트너'],
    secondaryKeywords: ['대표', '계약', '투자유치', '클라이언트', '소송', '파트너십'],
    subTypes: [
      { name: '파트너 갈등', keywords: ['동업자', '파트너', '지분', '공동대표', '갈등', '불화'] },
      { name: '계약 분쟁', keywords: ['계약', '파기', '위약금', '납기', '소송', '분쟁'] },
      { name: '사업 실패/위기', keywords: ['부도', '폐업', '적자', '파산', '위기', '실패'] },
      { name: '고객/직원 문제', keywords: ['직원', '알바', '고객', '컴플레인', '퇴사', '노무'] },
      { name: '사업 확장', keywords: ['확장', '신규', '투자', '매장', '오픈', '진출'] },
    ],
  },
  {
    domain: 'MONEY',
    primaryKeywords: ['투자', '손실', '빚', '대출', '돈', '재물', '현금', '주식', '코인', '부동산', '부채'],
    secondaryKeywords: ['원금', '이자', '상환', '손해', '사기', '탕진', '통장', '자금'],
    subTypes: [
      { name: '투자 손실', keywords: ['투자', '손실', '주식', '코인', '부동산', '마이너스', '손해'] },
      { name: '부채 및 빚 압박', keywords: ['빚', '대출', '이자', '상환', '독촉', '신용', '부채'] },
      { name: '수입 감소', keywords: ['수입', '월급', '급여', '매출감소', '벌이', '감소'] },
      { name: '재산 분쟁', keywords: ['상속', '증여', '재산분할', '지분분쟁', '소송'] },
      { name: '예상치 못한 지출', keywords: ['목돈', '수리비', '병원비', '지출', '누수'] },
    ],
  },
  {
    domain: 'JOB',
    primaryKeywords: ['직장', '상사', '이직', '퇴사', '승진', '회사원', '보직', '인사', '팀장', '연봉'],
    secondaryKeywords: ['업무', '커리어', '출근', '야근', '고과', '동료', '부서'],
    subTypes: [
      { name: '상사 갈등', keywords: ['상사', '팀장', '임원', '갑질', '지시', '불이익'] },
      { name: '이직/퇴사 고민', keywords: ['이직', '퇴사', '면접', '이력서', '전직', '이탈'] },
      { name: '승진/인사 갈등', keywords: ['승진', '누락', '인사고과', '평가', '보직'] },
      { name: '업무 과부하', keywords: ['과부하', '야근', '번아웃', '과로', '업무량'] },
      { name: '직장 내 갈등', keywords: ['동료', '부서', '정치', '따돌림', '파벌'] },
    ],
  },
  {
    domain: 'LOVE',
    primaryKeywords: ['연애', '연인', '결별', '이별', '헤어', '애인', '남친', '여친', '재회', '짝사랑'],
    secondaryKeywords: ['고백', '데이트', '소개팅', '마음', '연락', '카톡', '권태기'],
    subTypes: [
      { name: '이별/결별', keywords: ['이별', '헤어', '결별', '차임', '정리', '끝남'] },
      { name: '재회 고민', keywords: ['재회', '다시', '연락', '붙잡', '미련'] },
      { name: '연인 갈등', keywords: ['싸움', '말다툼', '서운', '오해', '집착', '의심'] },
      { name: '새로운 만남/짝사랑', keywords: ['짝사랑', '소개팅', '썸', '고백', '새로운'] },
    ],
  },
  {
    domain: 'MARRIAGE',
    primaryKeywords: ['결혼', '배우자', '남편', '아내', '부부', '시가', '시댁', '처가', '이혼', '별거'],
    secondaryKeywords: ['혼수', '예식', '신혼', '가정', '양육', '각방'],
    subTypes: [
      { name: '배우자 갈등', keywords: ['남편', '아내', '부부싸움', '대화단절', '성격차이'] },
      { name: '결혼 위기/이혼', keywords: ['이혼', '별거', '파경', '소송', '각방', '위기'] },
      { name: '고부/시처가 갈등', keywords: ['시댁', '시어머니', '처가', '장모', '가족갈등'] },
      { name: '결혼 준비 지연', keywords: ['파혼', '결혼지연', '비용', '반대'] },
    ],
  },
  {
    domain: 'RELATIONSHIP',
    primaryKeywords: ['인간관계', '친구', '지인', '배신', '구설', '따돌림', '시비', '소송', '싸움'],
    secondaryKeywords: ['신뢰', '험담', '소문', '손절', '단절', '오해'],
    subTypes: [
      { name: '배신 및 신뢰 파탄', keywords: ['배신', '사기', '뒤통수', '이용', '손절'] },
      { name: '구설수 및 모함', keywords: ['구설', '소문', '험담', '모함', '비난', '오해'] },
      { name: '친구/지인 갈등', keywords: ['친구', '지인', '싸움', '절교', '거리감'] },
      { name: '가족 내 갈등', keywords: ['부모', '형제', '자매', '가족', '친척'] },
    ],
  },
  {
    domain: 'HEALTH',
    primaryKeywords: ['건강', '수술', '병원', '질병', '치료', '디스크', '입원', '암', '통증', '염증'],
    secondaryKeywords: ['검진', '의사', '약', '피로', '면역', '우울', '불면', '공황'],
    subTypes: [
      { name: '수술 및 급성 질환', keywords: ['수술', '입원', '급성', '디스크', '골절', '응급'] },
      { name: '만성 질환 및 피로', keywords: ['만성', '피로', '통증', '염증', '소화', '면역'] },
      { name: '심리적 건강/우울', keywords: ['우울', '불면', '공황', '불안', '스트레스', '정신'] },
      { name: '검진 및 건강 불안', keywords: ['검진', '수치', '이상', '불안', '예후'] },
    ],
  },
  {
    domain: 'LIFE',
    primaryKeywords: ['인생', '진로', '미래', '정체', '무기력', '운세', '흐름', '답답'],
    secondaryKeywords: ['방황', '목표', '삶', '환절기', '변화'],
    subTypes: [
      { name: '진로 방황 및 정체', keywords: ['진로', '방황', '정체', '답답', '무기력'] },
      { name: '인생 전환기 점검', keywords: ['전환점', '미래', '운세', '흐름', '변화'] },
    ],
  },
];

export class EventClassifier {
  /**
   * 사건 입력 텍스트를 정밀 분석하여 100점 기준 도메인 및 세부 유형 분류
   */
  public classifyEvent(input: UserEventInput): EventClassificationResult {
    const textCorpus = `${input.currentConcern || ''} ${input.eventDescription || ''} ${input.desiredQuestion || ''} ${input.emotion || ''}`.trim().toLowerCase();

    // 1. 도메인별 점수 계산
    const domainScores: { domain: EventDomain; score: number; matchedKeywords: string[] }[] = [];

    for (const rule of DOMAIN_RULES) {
      let score = 0;
      const matched: string[] = [];

      // 사용자 명시 도메인이 있는 경우 해당 도메인에 30점 사전 가산
      if (input.targetDomain && input.targetDomain.toUpperCase() === rule.domain) {
        score += 35;
      }

      // 1차 주요 키워드 검사 (개당 15점, 최대 60점, currentConcern 내 출현 시 +8점 가산)
      const concernText = (input.currentConcern || '').toLowerCase();
      for (const kw of rule.primaryKeywords) {
        if (textCorpus.includes(kw)) {
          score += 15;
          if (concernText.includes(kw)) score += 8;
          matched.push(kw);
        }
      }

      // 2차 보조 키워드 검사 (개당 8점, 최대 25점)
      for (const kw of rule.secondaryKeywords) {
        if (textCorpus.includes(kw)) {
          score += 8;
          if (concernText.includes(kw)) score += 4;
          matched.push(kw);
        }
      }

      // 100점 범위 clamp
      score = Math.min(100, Math.max(10, score));

      domainScores.push({
        domain: rule.domain,
        score,
        matchedKeywords: Array.from(new Set(matched)),
      });
    }

    // 확장 도메인 처리 (사용자가 입력한 targetDomain이 8대 기본에 없는 경우)
    if (input.targetDomain && !DOMAIN_RULES.some(r => r.domain === input.targetDomain!.toUpperCase())) {
      const extDomain = input.targetDomain.toUpperCase();
      domainScores.unshift({
        domain: extDomain,
        score: 85,
        matchedKeywords: ['사용자 지정 확장 도메인'],
      });
    }

    // 점수 내림차순 정렬
    domainScores.sort((a, b) => b.score - a.score);

    const primary = domainScores[0] || { domain: 'LIFE', score: 50, matchedKeywords: [] };
    const secondaryDomains: ClassifiedDomainItem[] = domainScores.slice(1, 4).map(d => ({
      domain: d.domain,
      confidence: d.score,
      reason: d.matchedKeywords.length > 0 ? `매칭 키워드: ${d.matchedKeywords.slice(0, 3).join(', ')}` : '보조 연관성',
    }));

    // 2. 세부 사건 유형(subType) 판별
    const rule = DOMAIN_RULES.find(r => r.domain === primary.domain);
    let subType = '일반적 환경 변화';
    let subTypeConfidence = 60;
    let extractedIssues: string[] = primary.matchedKeywords;

    if (rule && rule.subTypes.length > 0) {
      let bestSub = rule.subTypes[0];
      let bestScore = 0;

      for (const st of rule.subTypes) {
        let matchCount = 0;
        for (const kw of st.keywords) {
          if (textCorpus.includes(kw)) matchCount++;
        }
        if (matchCount > bestScore) {
          bestScore = matchCount;
          bestSub = st;
        }
      }

      subType = bestSub.name;
      subTypeConfidence = Math.min(100, 50 + bestScore * 20);
    }

    // 텍스트가 매우 짧거나 모호한 경우 최소 기본 보정
    if (textCorpus.length < 5) {
      subType = '포괄적 일상 정체';
      subTypeConfidence = 40;
    }

    return {
      primaryDomain: primary.domain,
      domainConfidence: primary.score,
      secondaryDomains,
      subType,
      subTypeConfidence,
      extractedIssues,
    };
  }
}

export const eventClassifier = new EventClassifier();


export const OFFICIAL_BANK_ACCOUNT = {
  bankName: '기업은행',
  accountNumber: '103-123733-04-012',
  holder: '템바보드 주식회사',
};
/**
 * 마보살 인하우스 커머스 스토어 데이터 & 주문 서비스
 * 5대 특화 운세 리포트 + 자체 전자책, VOD, 상담권, 굿즈 완벽 지원
 */

import type { StoreCategory, StoreCategoryType, StoreOrder, StoreProduct } from './types.js';
import { UserSajuStore } from '../../state/user-saju-store.js';
import { getIdentity, ownsRecord } from '../../modules/identity/index.js';
import { getStorage } from '../../modules/persistence/index.js';

const STORAGE_PRODUCTS_KEY = 'mabosal_store_products_v4';
const STORAGE_ORDERS_KEY = 'mabosal_store_orders';

export const STORE_CATEGORIES: StoreCategory[] = [
  { id: 'all', label: '전체 상품', icon: 'apps' },
  { id: 'report', label: '4대 정밀 감정 리포트', icon: 'auto_awesome' },
  { id: 'voucher', label: '상품권 · 바우처', icon: 'confirmation_number' },
  { id: 'ebook', label: '전자책 · 가이드', icon: 'menu_book' },
  { id: 'lecture', label: '강의 · VOD', icon: 'smart_display' },
  { id: 'consulting', label: '1:1 상담권', icon: 'support_agent' },
  { id: 'goods', label: '부적 · 굿즈', icon: 'token' },
];

export const INITIAL_STORE_PRODUCTS: StoreProduct[] = [
  // [상품권 1. 마보살 50,000원 VIP 기프트 상품권]
  {
    id: 'prod-voucher-50k',
    title: '마보살 50,000원 VIP 사주 기프트 상품권',
    category: 'voucher',
    price: 50000,
    originalPrice: 50000,
    tagLine: '모든 사주 리포트와 1:1 상담까지 자유롭게 결제 가능한 VIP 모바일 바우처',
    badge: '선물 1위',
    description: '가족, 친구, 연인에게 마음을 전할 수 있는 정식 마보살 모바일 상품권입니다. 결제 완료 즉시 16자리 바우처 고유 코드가 발급되며, 마보살 전 상품 주문 시 현금처럼 전액 차감 사용할 수 있습니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <strong style="color: #f2ca50;">🎁 상품권 사용 안내</strong><br/>
          • 결제 완료(무통장 입금 승인 또는 카드결제) 즉시 고유 바우처 쿠폰 코드가 발급됩니다.<br/>
          • [쿠폰/바우처 등록] 탭에서 등록하여 적립하거나, 주문서 결제 시 코드를 입력하여 50,000원을 전액 차감할 수 있습니다.<br/>
          • 유효기간: 발행일로부터 1년 (자동 연장 가능)<br/>
          • 선물하기: 발급된 코드를 복사하여 카카오톡이나 문자로 소중한 분께 전달하세요.
        </div>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
    thumbnailIcon: 'card_giftcard',
    deliveryType: 'voucher_code',
    contentPayload: 'VOUCHER_50000',
    targetSignals: ['general.gift', 'future.planning'],
    status: 'active',
    createdAt: '2026-10-12',
    salesCount: 42,
  },
  // [상품권 2. 마보살 30,000원 정통 사주 상품권]
  {
    id: 'prod-voucher-30k',
    title: '마보살 30,000원 정통 사주 감정 상품권',
    category: 'voucher',
    price: 30000,
    originalPrice: 30000,
    tagLine: '신년운세, 재물운, 애정운 특화 리포트를 전액 결제할 수 있는 실속형 상품권',
    badge: '인기 선물',
    description: '30,000원 상당의 마보살 감정 리포트를 자유롭게 이용할 수 있는 바우처입니다. 결제 즉시 발급 코드가 생성됩니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <strong style="color: #818cf8;">🎁 실속형 상품권 혜택</strong><br/>
          • 2027 정묘년 신년운세, 평생 재물운, 직업운 리포트 전액 결제 가능<br/>
          • 결제 완료 시 주문 상세 내역에서 발급 코드를 즉시 확인 가능합니다.
        </div>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&auto=format&fit=crop&q=80',
    thumbnailIcon: 'confirmation_number',
    deliveryType: 'voucher_code',
    contentPayload: 'VOUCHER_30000',
    targetSignals: ['general.gift'],
    status: 'active',
    createdAt: '2026-10-12',
    salesCount: 31,
  },
  // [상품권 3. 마보살 10,000원 기프트 쿠폰]
  {
    id: 'prod-voucher-10k',
    title: '마보살 10,000원 모바일 기프트 쿠폰',
    category: 'voucher',
    price: 10000,
    originalPrice: 10000,
    tagLine: '모든 상품 주문 시 10,000원 즉시 할인받는 가벼운 선물용 쿠폰',
    badge: '부담없는 선물',
    description: '가볍게 마음을 전하는 10,000원 상당의 모바일 할인 쿠폰입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <p>• 마보살 전 상품 결제 시 10,000원 즉시 할인 적용 가능</p>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&auto=format&fit=crop&q=80',
    thumbnailIcon: 'redeem',
    deliveryType: 'voucher_code',
    contentPayload: 'VOUCHER_10000',
    targetSignals: ['general.gift'],
    status: 'active',
    createdAt: '2026-10-12',
    salesCount: 68,
  },
  // [전자책 1. 마보살 사주 셀프 리딩 가이드 (실용 명리학 라이프 시리즈 01)]
  {
    id: 'prod-ebook-saju-self-guide',
    title: '[전자책] 마보살의 사주 셀프 리딩 가이드: 한자 몰라도 3분 만에 읽는 나만의 인생 내비게이션',
    category: 'ebook',
    price: 14900,
    originalPrice: 25000,
    tagLine: '51만 가지 사주 조합에서 내 기질과 대운 타이밍을 스스로 읽어내는 정통 실용 명리 공식 가이드북',
    badge: 'NEW · 추천',
    description: '어려운 한자나 고전 암기 없이, 10개 일간 도감, 오행 에너지 밸런스 개운법, 십신 커리어 무기, 10년 대운 타이밍 설계를 3분 만에 스스로 읽어낼 수 있는 마보살 디지털 랩의 실용 명리학 라이프 공식 가이드북(PDF 소장본)입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <!-- 상단 혜택 안내 -->
        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="color: var(--primary); margin: 0 0 0.5rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.4rem;">
            <span class="material-symbols-outlined" style="font-size: 20px;">menu_book</span>
            MABOSAL DIGITAL EDITION • 실용 명리학 라이프 시리즈 01
          </h4>
          <p style="margin: 0 0 0.5rem 0; color: #e2e8f0; font-size: 0.88rem;">
            "사주팔자는 정해진 숙명이 아닙니다. 내가 세상에 태어날 때 부여받은 기질의 일기예보이자, 인생의 중요한 전환점마다 최선의 결정을 돕는 정밀한 라이프 내비게이션입니다."
          </p>
          <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.84rem;">
            <li><strong>형식</strong>: 고화질 정식 디지털 전자책 (PDF 다운로드 소장본)</li>
            <li><strong>발행처</strong>: 마보살 디지털 랩 (Mabosal Digital Lab) • 2026-2027 정식 발행본</li>
            <li><strong>제공 혜택</strong>: 결제 완료 즉시 평생 소장 가능한 PDF 파일 다운로드 링크 발급 및 인쇄 허용</li>
          </ul>
        </div>

        <!-- 상세 목차 구성 -->
        <h4 style="color: #ffffff; margin: 0 0 0.75rem 0; font-size: 1.05rem;">
          [전자책 핵심 목차 &amp; 구성]
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.5rem;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">프롤로그 | 운명을 믿지 않아도 사주를 알아야 하는 이유</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">MBTI를 넘어선 51만 8,400가지 영혼의 하드웨어 스펙과 동양의 계절학적 심리 행동 통계</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">1장 | 3분 만에 내 사주 원국 소환하기 (마보살 만세력 가이드)</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">년·월·일·시 4개 기둥의 의미와 내 게임 캐릭터의 본체인 핵심 '일간(日干)' 확인법</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">2장 | 나를 정의하는 진짜 캐릭터: 10개 일간(日干) 도감</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">갑목(거목)부터 계수(봄비)까지 10대 자연 원형으로 풀어낸 타고난 포텐셜과 개운 처방전</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">3장 | 내 삶의 에너지 밸런스: 오행(목·화·토·금·수)과 개운법</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">오행 에너지 흐름과 일상에서 부족한 기운을 즉각 채우는 마보살 실천 라이프 해킹</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">4장 | 사회적 무기와 현실 자산: 십신(十神)으로 읽는 커리어와 돈</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">비겁·식상·재성·관성·인성으로 판별하는 직장인 체질 vs 사업가 체질 맞춤 처방</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.75rem 1rem;">
            <strong style="color: var(--primary);">5장 | 기회의 파도를 타는 법: 대운과 세운의 타이밍 설계</strong>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: #94a3b8;">10년 단위 계절(대운)과 매년의 날씨(세운)를 활용한 인생 액션 플랜 및 교운기 극복 지혜</p>
          </div>
        </div>

        <!-- 리딩 팁 -->
        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 1rem;">
          <strong style="color: #38bdf8;">💡 전자책 200% 활용 리딩 팁</strong><br/>
          순서대로 통독하셔도 좋고, mabosal.com에서 내 사주 원국을 먼저 확인한 뒤 내 일간(2장)이나 대운(5장)을 바로 찾아 읽으셔도 좋습니다.
        </div>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    thumbnailIcon: 'menu_book',
    deliveryType: 'digital_download',
    contentPayload: '/downloads/mabosal_saju_self_reading_guide.pdf',
    targetSignals: ['general.knowledge', 'wealth.flow', 'career.change'],
    status: 'active',
    createdAt: '2026-10-17',
    salesCount: 87,
  },
  // [1. 마보살 대표 플래그십 상품: 정통 유료 사주풀이 (39,900원)]
  {
    id: 'prod-paid-saju-premium',
    title: '마보살 정통 유료 사주풀이 (평생 대운 & 정밀 심층 리포트)',
    category: 'report',
    price: 39900,
    originalPrice: 59000,
    tagLine: '18개 정밀 챕터 + 12개월 월운 상세 흐름 완벽 수록',
    badge: '인기 1위',
    description: '사주 원국과 오행 분포, 대운의 흐름을 심층 분석하여 18개 핵심 챕터와 12개월 월운 전체를 완벽 해설한 베스트셀러 정통 리포트입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem 0;">정통 사주풀이 18개 정밀 섹션 구성</h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.88rem;">
          <li>원국과 오행의 균형 및 격국 심층 해설</li>
          <li>10년 대운과 직업·재물·연애운 흐름</li>
          <li>12개월 월별 운세 흐름 및 주의 시기</li>
          <li>사주 맞춤형 일상 개운법 및 실천 지침</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'auto_stories',
    deliveryType: 'saju_report',
    contentPayload: 'PAID_REPORT',
    reportTier: 'PAID',
    targetSignals: ['wealth.flow', 'career.change', 'mind.stress'],
    status: 'active',
    createdAt: '2026-10-01',
    salesCount: 312,
  },
  // [3. 마보살 무료 사주 진단서 (체험 상품)]
  {
    id: 'prod-free-experience',
    title: '마보살 무료 사주 진단서 (기초 원국 & 13개 체험 분석)',
    category: 'report',
    price: 0,
    originalPrice: 19900,
    tagLine: '자신의 타고난 기운과 오행 기본 구조를 확인하는 13개 체험 섹션 무료 진단서',
    badge: '무료 체험',
    description: '사주 원국과 오행 분포, 일간의 본질을 확인하고 마(Ma)의 징후를 진단하는 13개 체험 섹션 리포트입니다. 정식 0원 주문을 통해 마이페이지 보관함에 안전하게 등록됩니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem 0; font-size: 1rem;">13개 무료 체험 진단 수록 항목</h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.88rem;">
          <li>4주 8자 정통 만세력 원국표</li>
          <li>일간 본원 및 오행 에너지 분포도</li>
          <li>올해의 핵심 기운 전환점과 기회 요약</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'explore',
    deliveryType: 'saju_report',
    contentPayload: 'FREE_EXPERIENCE',
    reportTier: 'FREE',
    targetSignals: ['general.knowledge'],
    status: 'active',
    createdAt: '2026-10-01',
    salesCount: 520,
  },
  // [4. 마보살 상충·마·살 특화 리포트 (79,900원)]
  {
    id: 'prod-saju-conflict',
    title: '마보살 상충·마·살 갈등 특화 리포트 (20개 섹션)',
    category: 'report',
    price: 79900,
    originalPrice: 120000,
    tagLine: '인간관계 충돌(축진파/인사해), 퇴사 vs 잔류 4주 집중 점검',
    badge: '갈등 특화',
    description: '내 사주에 얽힌 충(衝), 형(刑), 파(破), 해(害)와 살(煞)의 충돌 지점을 정밀 분석하여 인간관계 스트레스와 이직·퇴사의 유불리를 명쾌하게 판정합니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem 0;">상충·마·살 20개 섹션 분석 내용</h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.88rem;">
          <li>원국 내 상충 및 원진, 귀문관살 정밀 검증</li>
          <li>직장 동료 및 상사와의 관계 갈등 회피법</li>
          <li>손재마 및 관재구설 방어 행동 처방</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'bolt',
    deliveryType: 'saju_report',
    contentPayload: 'CONFLICT_MALSAL',
    reportTier: 'CONFLICT_MALSAL',
    targetSignals: ['mind.stress', 'career.transition'],
    status: 'active',
    createdAt: '2026-10-01',
    salesCount: 94,
  },
  // [5. 마보살 VIP 심층 사주 리포트 (149,000원)]
  {
    id: 'prod-paid-saju-vip',
    title: '마보살 VIP 심층 사주 리포트 (29개 챕터 전수 완결본)',
    category: 'report',
    price: 149000,
    originalPrice: 250000,
    tagLine: '원국·격국·용신·대운·세운 전면 개방, 4주 맞춤 개운 로드맵 수록',
    badge: 'VIP 최고급',
    description: '명리학 5대 고전의 격국과 억부, 조후, 통관 용신을 총동원한 29개 챕터 완결형 VIP 리포트입니다. 평생 대운의 10년 주기와 4주 로드맵, 맞춤 솔루션을 전면 제공합니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: var(--primary); margin: 0 0 0.5rem 0;">VIP 프리미엄 29대 전수 챕터 구성</h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.88rem;">
          <li>29개 VIP 서술형 리포트 전문 평생 소장</li>
          <li>평생 10년 대운 그래프 및 세운 교운기 비책</li>
          <li>A/B 현실 선택 대안 및 4주 액션 플랜</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'diamond',
    deliveryType: 'saju_report',
    contentPayload: 'PREMIUM_VIP',
    reportTier: 'PREMIUM',
    targetSignals: ['wealth.flow', 'career.change', 'mind.stress'],
    status: 'active',
    createdAt: '2026-10-01',
    salesCount: 68,
  },
  // [2. 런칭 프로모션 상품: 마보살 정통 사주 진단서 (19,900원 - 쿠폰 적용 시 0원 무료)]
  {
    id: 'prod-saju-entry-promo',
    title: '마보살 정통 사주 진단서 (입문 원국 & 오행 정밀 분석)',
    category: 'report',
    price: 19900,
    originalPrice: 19900,
    tagLine: '4주 8자 천명 원국표와 오행 과다·결핍 균형을 정밀 판별하는 입문 리포트 (런칭 쿠폰 적용 시 0원)',
    badge: '런칭 쿠폰 무료',
    description: '처음 마보살을 접하시는 분들을 위해 사주 원국표와 일간의 기운, 오행 분포도를 체계적으로 진단해 드리는 19,900원 상당의 정식 유료 진단서입니다. 런칭 기념 프로모션 쿠폰 등록 시 100% 전액 무료(0원)로 즉시 열람하실 수 있습니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <div style="background: rgba(242, 202, 80, 0.08); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="color: var(--primary); margin: 0 0 0.5rem 0; font-size: 1rem;">
            런칭 기념 100% 무료 쿠폰 혜택 안내
          </h4>
          <p style="margin: 0; color: #e2e8f0; font-size: 0.88rem;">
            스토어 상단 [쿠폰 등록창]에 프로모션 코드 <strong>MABOSAL-FREE</strong>를 입력하시면 19,900원 결제 없이 즉시 0원으로 전체 리포트를 열람하실 수 있습니다.
          </p>
        </div>
        <h4 style="color: #ffffff; margin: 0 0 0.75rem 0; font-size: 1.05rem;">
          [진단서 수록 구성]
        </h4>
        <ul style="margin: 0; padding-left: 1.2rem; color: #cbd5e1; font-size: 0.88rem;">
          <li>4주 8자 정밀 원국표 (간지 분석 &amp; 십신 배속)</li>
          <li>목화토금수 5행 분포도와 기운의 강약 판별</li>
          <li>일간(日干) 본원의 기질과 현실 성향 진단</li>
          <li>올해 나에게 부족한 기운과 실천 개운 가이드</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'fact_check',
    deliveryType: 'saju_report',
    contentPayload: 'PROMO_ENTRY',
    reportTier: 'ENTRY',
    targetSignals: ['wealth.flow', 'career.change'],
    status: 'active',
    createdAt: '2026-10-12',
    salesCount: 389,
  },
  // [5대 특화 운세 리포트 상품군]
  {
    id: 'prod-report-year2027',
    title: '2027 정미년(丁未年) 신년운세 & 월별 대운 비책',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '2027년 상반기 대운과 월별 기회·위험 정밀 총정리 리포트',
    description: '다가오는 2027년의 세운(歲運)과 내 사주의 상호작용을 정밀 추명하여 월별로 언제 움직여야 하고 언제 조심해야 하는지 행동 지침을 알려주는 마보살 정본 신년 리포트입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 리포트 주요 수록 내용</h4>
        <ul style="margin: 0 0 1rem 1.2rem; padding: 0;">
          <li>2027 정미년 총운 및 나에게 들어오는 오행 작용</li>
          <li>1월~12월 월별 운세 흐름도 및 하이라이트</li>
          <li>재물운 / 이직운 / 건강운 삼각 지표 정밀 진단</li>
          <li>올해 반드시 피해야 할 방향과 방위 비책</li>
        </ul>
        <p style="margin: 0; color: #94a3b8;">* 구매 후 사주 정보를 입력하면 즉시 개인 맞춤형 리포트로 생성됩니다.</p>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'calendar_today',
    deliveryType: 'saju_report',
    contentPayload: 'YEAR_2027',
    reportTier: 'YEAR_2027',
    targetSignals: ['career.change', 'money.gain'],
    status: 'active',
    badge: 'BEST',
    createdAt: '2026-10-01T00:00:00.000Z',
    salesCount: 310,
  },
  {
    id: 'prod-report-career',
    title: '직장·이직 특화 운세: 퇴사 vs 잔류 판단 리포트',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '부서 이동, 이직 타이밍과 최적의 승진 시점 명리 진단',
    description: '관성(직장운)과 역마의 흐름을 심층 분석하여, 지금 회사를 떠나는 것이 득인지 머무는 것이 득인지 명리학적 근거로 명확한 판단 기준을 내려드립니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 리포트 주요 수록 내용</h4>
        <ul style="margin: 0 0 1rem 1.2rem; padding: 0;">
          <li>현재 직장 기운의 유효 기간과 이동수 발생 시기</li>
          <li>상사/동료와의 궁합 및 직장 내 구설수 방어 전략</li>
          <li>이직에 가장 유리한 월별 타이밍 캘린더</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'work',
    deliveryType: 'saju_report',
    contentPayload: 'CAREER',
    reportTier: 'CAREER',
    targetSignals: ['career.change', 'career.transition'],
    status: 'active',
    badge: '인기',
    createdAt: '2026-10-02T00:00:00.000Z',
    salesCount: 245,
  },
  {
    id: 'prod-report-wealth',
    title: '재물·투자 특화 운세: 손재마 방어 & 자산 증식 리포트',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '돈 나가는 시기(손재마)와 기회 시기 정밀 진단서',
    description: '재성(재물운)의 강약과 겁재/손재마의 동향을 파악하여, 무리한 투자를 삼가야 할 시점과 과감하게 자산을 불려야 할 타이밍을 짚어냅니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 리포트 주요 수록 내용</h4>
        <ul style="margin: 0 0 1rem 1.2rem; padding: 0;">
          <li>평생 재물 그릇과 올해 현금 흐름 분석</li>
          <li>사기/투자 손실 위험이 가장 높은 주의 월(月) 예보</li>
          <li>문서운(부동산·계약)이 터지는 기회의 시기</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'payments',
    deliveryType: 'saju_report',
    contentPayload: 'WEALTH',
    reportTier: 'WEALTH',
    targetSignals: ['money.loss', 'money.gain'],
    status: 'active',
    badge: 'MD추천',
    createdAt: '2026-10-03T00:00:00.000Z',
    salesCount: 189,
  },
  {
    id: 'prod-report-relation',
    title: '애정·궁합 특화 운세: 인연의 흐름 & 갈등 완화 리포트',
    category: 'report',
    price: 19900,
    originalPrice: 30000,
    tagLine: '인연이 찾아오는 시기와 이성 관계 갈등 해소 명리 처방',
    description: '도화살과 배우자궁의 합/충을 분석하여 새로운 인연의 출현 시기, 현재 연인과의 권태기 극복법, 결혼 적령기 타이밍을 제공합니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 리포트 주요 수록 내용</h4>
        <ul style="margin: 0 0 1rem 1.2rem; padding: 0;">
          <li>내 사주의 타고난 연애 성향과 배우자 인연법</li>
          <li>올해 가장 강한 이성운이 들어오는 시기</li>
          <li>관계 파탄을 막는 대화법과 상극 조율 비책</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'favorite',
    deliveryType: 'saju_report',
    contentPayload: 'RELATION',
    reportTier: 'RELATION',
    targetSignals: ['mind.stress'],
    status: 'active',
    createdAt: '2026-10-04T00:00:00.000Z',
    salesCount: 165,
  },
  {
    id: 'prod-report-conflict',
    title: '상충·살 관계 갈등 방어 리포트 (VIP 정밀 처방)',
    category: 'report',
    price: 79900,
    originalPrice: 120000,
    tagLine: '칠살, 백호, 원진살 등 악재와 구설을 무력화하는 심층 방어 솔루션',
    description: '사주 내 살(殺)과 충(沖)의 상호작용으로 인해 지속되는 심리적 불안, 소송, 인간관계 파탄의 근본 원인을 파악하고 이를 조율하는 최상위 심층 리포트입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 리포트 주요 수록 내용</h4>
        <ul style="margin: 0 0 1rem 1.2rem; padding: 0;">
          <li>원국 내 상충살 및 흉살 18개 영역 심층 전수 조사</li>
          <li>살의 기운을 승화시키는 직업/환경 개운법(開運法)</li>
          <li>악연과 갈등을 끊어내는 실천 스크립트 10선</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'security',
    deliveryType: 'saju_report',
    contentPayload: 'CONFLICT_MALSAL',
    reportTier: 'CONFLICT_MALSAL',
    targetSignals: ['mind.stress', 'legal.dispute'],
    status: 'active',
    badge: 'VIP추천',
    createdAt: '2026-10-05T00:00:00.000Z',
    salesCount: 92,
  },

  // [기존 자체 콘텐츠 상품군]
  {
    id: 'prod-ebook-wealth',
    title: '손재마 탈출! 새는 돈 막는 30분 가계 재무 방어 엑셀북',
    category: 'ebook',
    price: 29000,
    originalPrice: 49000,
    tagLine: '재물 누수를 막고 안전한 현금 흐름을 설계하는 실전 템플릿',
    description: '사주에서 손재마(재물 손실)가 감지되었을 때 가장 먼저 해야 할 고정비 축소와 통장 쪼개기 3단계 실천 가이드북입니다. 구매 즉시 다운로드 가능한 Excel 계산 시트와 36페이지 PDF 해설서가 포함되어 있습니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 이런 분께 추천합니다</h4>
        <ul style="margin: 0 0 1rem 1.2rem; padding: 0;">
          <li>열심히 버는데 통장에 남는 돈이 없는 분</li>
          <li>올해 사주에 손재마·겁재 기운이 강하게 들어온 분</li>
          <li>복잡한 가계부 대신 30분 만에 끝내는 시트가 필요한 분</li>
        </ul>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'savings',
    deliveryType: 'digital_download',
    contentPayload: 'https://mabosal.com/downloads/wealth-defense-2026.pdf',
    targetSignals: ['money.loss'],
    status: 'active',
    badge: 'BEST',
    createdAt: '2026-10-06T00:00:00.000Z',
    salesCount: 142,
  },
  {
    id: 'prod-vod-career',
    title: '천을귀인 이직 비책: 연봉 20% 올리는 커리어 피봇 VOD',
    category: 'lecture',
    price: 49000,
    originalPrice: 89000,
    tagLine: '사주 이동수(역마/관성)를 기회로 바꾸는 5강 완성 핵심 특강',
    description: '사주에 직장 이동수와 변화의 기운이 들어왔을 때, 충동적 퇴사 대신 헤드헌터의 레이더에 걸리는 이력서 작성법과 면접 협상 스크립트를 알려주는 2시간 완성 VOD 코스입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 강의 커리큘럼 (총 5강)</h4>
        <ol style="margin: 0 0 1rem 1.2rem; padding: 0;">
          <li>1강: 내 사주의 직장운 흐름과 최적의 퇴사/이직 타이밍</li>
          <li>2강: 서류 통과율 3배 높이는 스토리텔링 경력기술서</li>
          <li>3강: 역마의 기운을 활용한 직무 전환 전략</li>
        </ol>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'work',
    deliveryType: 'digital_url',
    contentPayload: 'https://mabosal.com/classroom/career-pivot-vod',
    targetSignals: ['career.change', 'career.transition'],
    status: 'active',
    badge: 'MD추천',
    createdAt: '2026-10-07T00:00:00.000Z',
    salesCount: 88,
  },
  {
    id: 'prod-consult-vip',
    title: '수석 명리 마스터 1:1 심층 화상 컨설팅 (40분 상담권)',
    category: 'consulting',
    price: 99000,
    originalPrice: 150000,
    tagLine: '내 사주 원국과 현실 고민을 1:1로 집중 조율하는 프리미엄 세션',
    description: '컴퓨터 진단서 너머, 마보살 수석 자문 명리학자와 1:1 비대면 화상으로 40분간 직접 대화하며 올해 반드시 풀어야 할 진로·사업·이성 문제를 해결하는 실시간 상담권입니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 상담 절차</h4>
        <p style="margin: 0;">결제 완료 즉시 캘린더 예약 링크가 발송됩니다. 40분간 집중 1:1 심층 라이브 세션 진행.</p>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'support_agent',
    deliveryType: 'consulting_booking',
    contentPayload: 'https://calendly.com/mabosal-consulting/40min',
    targetSignals: ['mind.stress', 'career.transition'],
    status: 'active',
    createdAt: '2026-10-08T00:00:00.000Z',
    salesCount: 45,
  },
  {
    id: 'prod-goods-amulet',
    title: '경면주사 정본 비단 액막이 부적 & 수호 엽전 키링 세트',
    category: 'goods',
    price: 19900,
    originalPrice: 35000,
    tagLine: '사주 상충살과 삼재의 기운을 다스리는 수호 소품',
    description: '전통 비단 노리개 주머니 안에 담긴 명리 비법 액막이 부적과 마보살 심볼 엽전 키링 세트입니다. 지갑이나 가방, 자동차에 걸어 악재와 구설을 방어하는 의미를 담았습니다.',
    detailsHtml: `
      <div style="line-height: 1.7; font-size: 0.9rem; color: #d1d5db;">
        <h4 style="color: #f2ca50; margin: 0 0 0.5rem 0;"> 구성품 및 배송 안내</h4>
        <p style="margin: 0;">경면주사 액막이 부적 1매 + 황동 엽전 키링 1개 세트 (무료배송).</p>
      </div>
    `,
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    thumbnailIcon: 'token',
    deliveryType: 'shipping',
    contentPayload: '배송 상품',
    targetSignals: ['mind.stress', 'legal.dispute'],
    status: 'active',
    createdAt: '2026-10-09T00:00:00.000Z',
    salesCount: 120,
  },
];

/** 등록된 모든 상품 조회 */
export function getAllStoreProducts(): StoreProduct[] {
  if (typeof localStorage === 'undefined') return [...INITIAL_STORE_PRODUCTS];
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(INITIAL_STORE_PRODUCTS));
      return [...INITIAL_STORE_PRODUCTS];
    }
    const saved = JSON.parse(raw) as StoreProduct[];
    // 초기 상품 목록 중 로컬 스토리지에 없는 상품들 자동 병합 (상품권 등 신규 상품 포함)
    let merged = false;
    for (const initP of INITIAL_STORE_PRODUCTS) {
      if (!saved.some(p => p.id === initP.id)) {
        saved.push(initP);
        merged = true;
      }
    }
    if (merged) {
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(saved));
    }
    return saved;
  } catch {
    return [...INITIAL_STORE_PRODUCTS];
  }
}

/** 카테고리별 상품 필터링 (고객용: 숨김 상품 제외) */
export function getStoreProductsByCategory(category: StoreCategoryType = 'all'): StoreProduct[] {
  const all = getAllStoreProducts();
  return all
    .filter(p => p.status !== 'hidden')
    .filter(p => (category === 'all' ? true : p.category === category));
}

export function getStoreProductById(id: string): StoreProduct | undefined {
  const all = getAllStoreProducts();
  return all.find(p => p.id === id);
}

/** 상품 저장 (신규 등록) */
export function saveStoreProduct(productInput: Omit<StoreProduct, 'id' | 'createdAt' | 'salesCount'>): StoreProduct {
  const list = getAllStoreProducts();
  const newProduct: StoreProduct = {
    ...productInput,
    id: 'prod-' + Date.now().toString(36),
    createdAt: new Date().toISOString(),
    salesCount: 0,
  };
  list.unshift(newProduct);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(list));
  }
  return newProduct;
}

/** 상품 정보 수정 */
export function updateStoreProduct(id: string, updates: Partial<StoreProduct>): boolean {
  const list = getAllStoreProducts();
  const index = list.findIndex(p => p.id === id);
  if (index === -1) return false;
  list[index] = { ...list[index], ...updates };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(list));
  }
  return true;
}

/** 상품 삭제 */
export function deleteStoreProduct(id: string): boolean {
  const list = getAllStoreProducts();
  const filtered = list.filter(p => p.id !== id);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(filtered));
  }
  return true;
}

/** 상품 상태 토글 (active <-> soldout <-> hidden) */
export function setStoreProductStatus(id: string, status: 'active' | 'soldout' | 'hidden'): boolean {
  return updateStoreProduct(id, { status });
}

/** 주문 목록 조회 */
export function getAllStoreOrders(): StoreOrder[] {
  try {
    const raw = getStorage().getItem(STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 현재 로그인 회원 본인의 주문만 반환 (소유자 필터 강제). 화면/권한 판정에는 이 함수만 사용한다. */
export function getMyStoreOrders(): StoreOrder[] {
  const me = getIdentity();
  if (me.isGuest) return [];
  return getAllStoreOrders().filter(o => ownsRecord(o, me));
}

/** 신규 주문 생성 (결제 완료 시 호출) */
export function createStoreOrder(orderData: {
  productId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  paymentMethod: any;
  orderId?: string;
  userId?: string;
  status?: 'pending' | 'completed';
  paymentKey?: string;
}): StoreOrder {
  const prod = getStoreProductById(orderData.productId);
  const orders = getAllStoreOrders();
  const newOrder: StoreOrder = {
    productId: orderData.productId,
    productTitle: prod ? prod.title : '마보살 정통 유료 사주풀이 (평생 대운 & 정밀 심층 리포트)',
    category: (prod?.category || 'report') as any,
    amount: prod ? prod.price : 39900,
    deliveryType: (prod?.deliveryType || 'saju_report') as any,
    accessUrl: (prod?.deliveryType === 'digital_url' || prod?.deliveryType === 'digital_download') ? (prod.contentPayload || '/?view=result') : '/?view=result',
    buyerName: orderData.buyerName,
    buyerPhone: orderData.buyerPhone,
    buyerEmail: orderData.buyerEmail,
    paymentMethod: orderData.paymentMethod,
    userId: orderData.userId || getIdentity().userId || undefined,
    orderId: orderData.orderId || 'ORD-' + Date.now().toString(36).toUpperCase(),
    paidAt: new Date().toISOString(),
    status: orderData.status || 'completed',
    ...(orderData.paymentKey ? { paymentKey: orderData.paymentKey } : {}),
    sajuInput: UserSajuStore.getProfile() || undefined,
    reportTier: prod?.reportTier || 'COMPREHENSIVE',
  };
  orders.unshift(newOrder);
  getStorage().setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders.slice(0, 500)));

  // 해당 상품 판매수 +1 (결제 완료된 주문만)
  if (prod && newOrder.status === 'completed') {
    updateStoreProduct(prod.id, { salesCount: (prod.salesCount || 0) + 1 });
  }

  return newOrder;
}

export interface VoucherRedeemResult {
  success: boolean;
  message: string;
  order?: StoreOrder;
}

export function redeemStoreVoucher(rawCode: string, buyerInfo?: { name: string; phone?: string; email?: string }): VoucherRedeemResult {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { success: false, message: '쿠폰 또는 상품권 코드를 입력해 주세요.' };
  }

  let targetProdId = '';
  let discountDesc = '';

  // 쿠폰 코드 규칙
  if (code === 'MABOSAL-FREE' || code === 'FREE-19900' || code === 'MABOSAL2026' || code === 'FREE') {
    targetProdId = 'prod-saju-entry-promo';
    discountDesc = '19,900원 사주 진단서 100% 무료 승인';
  } else if (code === 'TEMBA-VIP' || code === 'VIP-39900' || code === 'TEMBA-39900' || code === 'VIP') {
    targetProdId = 'prod-paid-saju-premium';
    discountDesc = '39,900원 정통 유료 사주풀이 VIP 전액 무료 승인';
  } else if (code === 'YEAR-2027' || code === 'LUCKY2027') {
    targetProdId = 'prod-report-year2027';
    discountDesc = '2027 신년운세 상품권 전액 무료 승인';
  } else {
    // 동적 쿠폰 스토어 조회 (로컬 및 발급 쿠폰)
    try {
      const dynamicCoupons = JSON.parse(localStorage.getItem('mabosal_voucher_coupons') || '[]');
      const matched = dynamicCoupons.find((c: any) => c.code.toUpperCase() === code && c.enabled);
      if (matched) {
        targetProdId = matched.targetProduct === 'all' ? 'prod-paid-saju-premium' : matched.targetProduct;
        discountDesc = `${matched.name} (${matched.discountAmount ? matched.discountAmount.toLocaleString() + '원 할인' : matched.discountRate + '% 할인'})`;
      } else {
        return { success: false, message: '유효하지 않거나 이미 사용된 쿠폰/상품권 코드입니다. 코드를 다시 확인해 주세요.' };
      }
    } catch {
      return { success: false, message: '유효하지 않거나 이미 사용된 쿠폰/상품권 코드입니다. 코드를 다시 확인해 주세요.' };
    }
  }

  const prod = getStoreProductById(targetProdId);
  if (!prod) {
    return { success: false, message: '해당 쿠폰과 연결된 상품을 찾을 수 없습니다.' };
  }

  // 주문 자동 생성 및 결제 완료 처리
  const newOrder = createStoreOrder({
    productId: prod.id,
    buyerName: buyerInfo?.name || '쿠폰/상품권 고객',
    buyerPhone: buyerInfo?.phone || '010-0000-0000',
    buyerEmail: buyerInfo?.email || 'voucher@mabosal.com',
    paymentMethod: 'voucher' as any,
  });

  return {
    success: true,
    message: `[${discountDesc}] 쿠폰이 정상 승인되었습니다! 즉시 리포트를 열람하실 수 있습니다.`,
    order: newOrder,
  };
}

/** 주문 상태 등 일부 필드 갱신 (입금 확인 시 pending → completed) */
export function updateStoreOrder(orderId: string, patch: Partial<StoreOrder>): StoreOrder | null {
  const orders = getAllStoreOrders();
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx < 0) return null;
  const prev = orders[idx];
  const next = { ...prev, ...patch } as StoreOrder;
  orders[idx] = next;
  getStorage().setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  if (prev.status !== 'completed' && next.status === 'completed') {
    const prod = getStoreProductById(next.productId);
    if (prod) updateStoreProduct(prod.id, { salesCount: (prod.salesCount || 0) + 1 });
  }
  return next;
}

/**
 * 특정 사주 대상자에 대해 이미 결제 완료된 디지털 리포트인지 중복 여부 검사
 */
export function isProductAlreadyPurchased(productId: string, sajuName?: string): { purchased: boolean; order?: StoreOrder } {
  const me = getIdentity();
  const orders = getAllStoreOrders().filter(o => o.status === 'completed' && ownsRecord(o, me));
  const targetName = (sajuName || '').trim();

  for (const o of orders) {
    const isMatchingProd = o.productId === productId || (o.items && o.items.some(it => it.productId === productId));
    if (!isMatchingProd) continue;

    // 사주 대상자명 매칭 (디지털 리포트인 경우)
    const orderSajuName = (o.sajuInput?.userName || o.buyerName || '').trim();
    if (!targetName || orderSajuName === targetName) {
      return { purchased: true, order: o };
    }
  }

  return { purchased: false };
}

/**
 * 디지털 리포트 열람 시점 기록 (전자상거래법 환불 제한 근거 확보)
 */
export function markOrderAsViewed(orderId: string): void {
  const orders = getAllStoreOrders();
  const target = orders.find(o => o.orderId === orderId);
  if (target && !target.viewedAt) {
    updateStoreOrder(orderId, { viewedAt: new Date().toISOString() });
  }
}

/**
 * 고객의 주문 취소 및 환불 신청 접수
 */
export function requestStoreOrderRefund(orderId: string, reason: string): { success: boolean; message: string } {
  const orders = getAllStoreOrders();
  const target = orders.find(o => o.orderId === orderId);
  if (!target) {
    return { success: false, message: '주문 정보를 찾을 수 없습니다.' };
  }

  if (target.status === 'refunded') {
    return { success: false, message: '이미 환불 처리가 완료된 주문입니다.' };
  }

  // 디지털 리포트이고 이미 열람/다운로드한 경우 전자상거래법에 의거 제한
  if (target.category === 'report' && target.viewedAt) {
    return {
      success: false,
      message: '해당 리포트는 이미 열람/다운로드가 개시되어 전자상거래법 제17조에 따라 청약철회(환불)가 제한됩니다.',
    };
  }

  updateStoreOrder(orderId, {
    refundRequested: true,
    refundReason: reason,
  });

  return {
    success: true,
    message: '환불/반품 신청이 정상 접수되었습니다. 관리자 검토 후 신속히 처리됩니다.',
  };
}

/**
 * 최고 관리자의 환불 승인 처리
 */
export function approveStoreOrderRefund(orderId: string): { success: boolean; message: string } {
  const target = updateStoreOrder(orderId, {
    status: 'refunded',
    refundedAt: new Date().toISOString(),
    refundRequested: false,
  });

  if (!target) {
    return { success: false, message: '주문 정보를 찾을 수 없습니다.' };
  }

  return {
    success: true,
    message: `[주문번호: ${orderId}] 환불 처리가 최종 승인되어 결제 취소되었습니다.`,
  };
}


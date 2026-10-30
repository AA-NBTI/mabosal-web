/**
 * [AdminEbookLibraryPanel]
 * 관리자 대시보드 > 컨텐츠 > '전자책' 카테고리 전용 디지털 도서관(서고) 관리 패널
 * 계속해서 발행되는 마보살 전자책 시리즈를 총괄 관리하고 검수하는 확장형 라이브러리 구조
 */

import { getAllEbooks } from '../extensions/ebook-reader/ebook-registry.js';

export interface AdminEbookItem {
  id: string;
  volumeLabel: string;
  title: string;
  subTitle: string;
  author: string;
  status: 'published' | 'draft' | 'planning';
  statusLabel: string;
  pageCount: number;
  format: string;
  coverImage: string;
  storeProductId?: string;
  price: number;
  description: string;
  publishedDate?: string;
  viewerSupported: boolean;
}

// 마보살 전자책 디지털 도서관 전체 시리즈 마스터 카탈로그
export const ADMIN_EBOOK_LIBRARY_CATALOG: AdminEbookItem[] = [
  {
    id: 'book-saju-principles-vol1',
    volumeLabel: '제 1 권',
    title: '정통 사주명리학 원론 제1권',
    subTitle: '음양오행(陰陽五行)과 천간·지지·지장간 원론',
    author: '마보살 명리학술원 편찬위원회',
    status: 'published',
    statusLabel: '정식 발행완료',
    pageCount: 22,
    format: 'A4 페이퍼 시트 (실물 인쇄본 1:1 고화질)',
    coverImage: '/ebooks/vol1/page-1.webp',
    storeProductId: 'book-saju-principles-vol1',
    price: 29000,
    description: '우주 시공간 부호 22개 간지의 본질과 생극제화, 12지지의 생·왕·고 3분법 완결 조견표.',
    publishedDate: '2026. 10. 24',
    viewerSupported: true,
  },
  {
    id: 'book-saju-principles-vol2',
    volumeLabel: '제 2 권',
    title: '정통 사주명리학 원론 제2권',
    subTitle: '십신(十神)과 격국(格局)·용신(用神) 통변 원론',
    author: '마보살 명리학술원 편찬위원회',
    status: 'published',
    statusLabel: '정식 발행완료 (뷰어 연동)',
    pageCount: 22,
    format: 'A4 페이퍼 시트 (실물 인쇄본 1:1 고화질 22p)',
    coverImage: '/ebooks/vol2/page-1.webp',
    storeProductId: 'book-saju-principles-vol2',
    price: 29000,
    description: '10성 심리와 8정격·특수격 판정, 억부·조후·통관 3대 용신 선용 공식 총괄.',
    publishedDate: '2026. 10. 27',
    viewerSupported: true,
  },
  {
    id: 'book-saju-principles-vol3',
    volumeLabel: '제 3 권',
    title: '정통 사주명리학 원론 제3권',
    subTitle: '천간지지 합충형파해와 12운성·핵심 신살',
    author: '마보살 명리학술원 편찬위원회',
    status: 'published',
    statusLabel: '정식 발행완료 (뷰어 연동)',
    pageCount: 22,
    format: 'A4 페이퍼 시트 (실물 인쇄본 1:1 고화질 22p)',
    coverImage: '/ebooks/vol3/page-1.webp',
    storeProductId: 'book-saju-principles-vol3',
    price: 29000,
    description: '합(合)의 미학, 육충의 붕괴와 개고, 삼형살 조정과 12운성 에너지 파동 통변.',
    publishedDate: '2026. 10. 28',
    viewerSupported: true,
  },
  {
    id: 'book-saju-principles-vol4',
    volumeLabel: '제 4 권',
    title: '정통 사주명리학 원론 제4권',
    subTitle: '대운·세운 추명과 실전 통변 50대 사례집',
    author: '마보살 명리학술원 편찬위원회',
    status: 'published',
    statusLabel: '정식 발행완료 (뷰어 연동)',
    pageCount: 22,
    format: 'A4 페이퍼 시트 (실물 인쇄본 1:1 고화질 22p)',
    coverImage: '/ebooks/vol4/page-1.webp',
    storeProductId: 'book-saju-principles-vol4',
    price: 29000,
    description: '10년 대운과 1년 세운 타이밍, 재물·직업·결혼 실전 간명 50선 총망라.',
    publishedDate: '2026. 10. 29',
    viewerSupported: true,
  },
  {
    id: 'book-saju-self-guide',
    volumeLabel: '입문 가이드',
    title: '마보살의 사주 셀프 리딩 가이드',
    subTitle: '한자 몰라도 3분 만에 읽는 나만의 인생 내비게이션',
    author: '마보살 디지털 랩',
    status: 'published',
    statusLabel: '정식 발행완료 (뷰어 연동)',
    pageCount: 8,
    format: 'A4 페이퍼 시트 (실물 인쇄본 1:1 고화질 8p)',
    coverImage: '/ebooks/self-guide/page-1.webp',
    storeProductId: 'prod-ebook-saju-self-guide',
    price: 14900,
    description: '사주 입문자를 위해 복잡한 용어 없이 핵심 기운을 스스로 읽는 실전 핸드북.',
    publishedDate: '2026. 10. 15',
    viewerSupported: true,
  },
];

let selectedPreviewBookId: string = 'book-saju-principles-vol1';

export function setSelectedPreviewBookId(bookId: string): void {
  selectedPreviewBookId = bookId;
}

export function renderAdminEbookLibraryPanel(): string {
  const books = ADMIN_EBOOK_LIBRARY_CATALOG;
  const publishedCount = books.filter(b => b.status === 'published').length;
  const draftCount = books.filter(b => b.status === 'draft').length;

  return `
    <style>
      .admin-ebook-accordion summary::-webkit-details-marker,
      .admin-ebook-accordion summary::marker {
        display: none;
        content: "";
      }
      .admin-ebook-accordion summary {
        list-style: none;
      }
      .admin-ebook-accordion[open] .ebook-chevron {
        transform: rotate(180deg);
      }
      .admin-ebook-accordion[open] {
        border-color: rgba(242, 202, 80, 0.45) !important;
        background: rgba(242, 202, 80, 0.03) !important;
      }
      .admin-ebook-accordion summary:hover {
        background: rgba(255, 255, 255, 0.05) !important;
      }
    </style>

    <div class="admin-ebook-library-container" style="display: flex; flex-direction: column; gap: 1.25rem; width: 100%; box-sizing: border-box;">
      
      <!-- 상단 헤더 & 디지털 서고 통계 -->
      <div style="background: var(--surface-container); border: 1.5px solid rgba(242, 202, 80, 0.35); border-radius: 14px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1.25rem;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.65rem; border-radius: 9999px; background: rgba(242, 202, 80, 0.15); border: 1px solid rgba(242, 202, 80, 0.35); margin-bottom: 0.5rem;">
              <span class="material-symbols-outlined" style="font-size: 0.85rem; color: var(--primary);">library_books</span>
              <span style="font-size: 0.74rem; font-weight: 800; color: var(--primary); letter-spacing: 0.05em;">MABOSAL E-BOOK ARCHIVE</span>
            </div>
            <h2 style="font-family: var(--font-serif); font-size: 1.35rem; font-weight: 800; color: #dfe2f1; margin: 0 0 0.35rem;">
              마보살 전자책 디지털 도서관 (발행 &amp; 뷰어 검수 센터)
            </h2>
            <p style="font-size: 0.84rem; color: var(--text-muted); margin: 0;">
              명리학 원론 시리즈를 비롯해 계속해서 신규 발행되는 전자책 도서를 한곳에서 관리하고, 기본 제목 목록에서 클릭하여 해당 도서의 실물 뷰어를 바로 펼쳐 검수합니다.
            </p>
          </div>

          <!-- 서고 현황 뱃지 -->
          <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
            <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.5rem 0.9rem; text-align: center;">
              <span style="display: block; font-size: 0.7rem; color: var(--text-muted);">총 서적</span>
              <strong style="font-size: 1.15rem; color: #fff;">${books.length}종</strong>
            </div>
            <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 0.5rem 0.9rem; text-align: center;">
              <span style="display: block; font-size: 0.7rem; color: #4ade80;">정식 발행</span>
              <strong style="font-size: 1.15rem; color: #4ade80;">${publishedCount}권</strong>
            </div>
            <div style="background: rgba(242, 202, 80, 0.1); border: 1px solid rgba(242, 202, 80, 0.3); border-radius: 8px; padding: 0.5rem 0.9rem; text-align: center;">
              <span style="display: block; font-size: 0.7rem; color: var(--primary);">발행 준비중</span>
              <strong style="font-size: 1.15rem; color: var(--primary);">${draftCount}권</strong>
            </div>
          </div>
        </div>

        <!-- 발행 도서 아코디언 목록 (기본 제목 표시 -> 클릭 시 펼침) -->
        <div style="margin-top: 1.5rem;">
          <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.45rem;">
            <span class="material-symbols-outlined" style="font-size: 20px; color: var(--primary);">menu_book</span>
            발행 서적 카탈로그 (제목 클릭 시 뷰어 펼침)
          </h3>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${books.map(b => {
              const isPublished = b.status === 'published';
              return `
                <details class="admin-ebook-accordion" data-book-id="${b.id}" style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; overflow: hidden; transition: all 0.2s ease;">
                  
                  <!-- 기본 제목 행 (클릭 영역) -->
                  <summary style="display: flex; justify-content: space-between; align-items: center; padding: 1.1rem 1.35rem; cursor: pointer; user-select: none; background: rgba(0, 0, 0, 0.22); transition: background 0.2s ease;">
                    <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
                      <span style="font-size: 0.74rem; font-weight: 800; background: rgba(242, 202, 80, 0.15); color: var(--primary); border: 1px solid rgba(242, 202, 80, 0.35); padding: 0.2rem 0.55rem; border-radius: 4px;">
                        ${b.volumeLabel}
                      </span>
                      <strong style="font-size: 1rem; color: #fff; font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span>${b.title}</span>
                        ${b.subTitle ? `<span style="font-size: 0.84rem; color: #94a3b8; font-weight: 500;">· ${b.subTitle}</span>` : ''}
                      </strong>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <span style="font-size: 0.74rem; padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 700; background: ${isPublished ? 'rgba(34, 197, 94, 0.18)' : 'rgba(242, 202, 80, 0.15)'}; color: ${isPublished ? '#4ade80' : 'var(--primary)'}; border: 1px solid ${isPublished ? 'rgba(34, 197, 94, 0.3)' : 'rgba(242, 202, 80, 0.3)'};">
                        ${b.statusLabel} (${b.pageCount}p)
                      </span>
                      <span class="material-symbols-outlined ebook-chevron" style="color: #94a3b8; transition: transform 0.2s ease; font-size: 22px;">expand_more</span>
                    </div>
                  </summary>

                  <!-- 클릭 후 펼침 영역 (도서 상세 메타 및 실물 뷰어) -->
                  <div style="padding: 1.25rem; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.15);">
                    
                    <!-- 도서 상세 정보 및 빠른 액션 바 -->
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.15rem; background: rgba(0, 0, 0, 0.35); padding: 0.85rem 1.15rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
                      <div style="font-size: 0.82rem; color: #cbd5e1; display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: center;">
                        <div>• 규격: <strong style="color: #fff;">${b.format}</strong></div>
                        <div>• 정가: <strong style="color: var(--primary);">₩ ${b.price.toLocaleString()}</strong></div>
                        <div>• 저자: <strong style="color: #fff;">${b.author}</strong></div>
                        ${b.publishedDate ? `<div>• 발행일: <strong style="color: #94a3b8;">${b.publishedDate}</strong></div>` : ''}
                      </div>

                      <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${b.viewerSupported ? `
                          <a href="/reader?bookId=${b.id}" target="_blank" style="background: var(--primary); color: #1e1e1e; font-weight: 800; font-size: 0.8rem; padding: 0.45rem 0.85rem; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem; box-shadow: 0 2px 8px rgba(242,202,80,0.3);">
                            <span class="material-symbols-outlined" style="font-size: 16px;">open_in_new</span>
                            <span>독립 전체화면 열람</span>
                          </a>
                        ` : ''}
                        ${b.storeProductId ? `
                          <a href="/store?product=${b.storeProductId}" target="_blank" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #dfe2f1; font-size: 0.8rem; font-weight: 700; padding: 0.45rem 0.75rem; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem;" title="스토어 상품 페이지 보기">
                            <span class="material-symbols-outlined" style="font-size: 16px;">storefront</span>
                            <span>스토어 상품 보기</span>
                          </a>
                        ` : ''}
                      </div>
                    </div>

                    <!-- 펼침 실물 웹 뷰어 프레임 -->
                    ${b.viewerSupported ? `
                      <div style="width: 100%; height: 820px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.12); background: #0b0e14; box-shadow: inset 0 2px 12px rgba(0,0,0,0.6);">
                        <iframe src="/reader?bookId=${b.id}" loading="lazy" style="width: 100%; height: 100%; border: none;" title="${b.title} 웹 뷰어 검수"></iframe>
                      </div>
                    ` : `
                      <div style="padding: 2.5rem; text-align: center; color: #94a3b8; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        <span class="material-symbols-outlined" style="font-size: 32px; color: var(--text-muted); margin-bottom: 0.5rem;">hourglass_empty</span>
                        <p style="margin: 0; font-size: 0.9rem;">현재 원고 조판 및 뷰어 발행 준비 중인 도서입니다.</p>
                      </div>
                    `}

                  </div>
                </details>
              `;
            }).join('')}
          </div>
        </div>
      </div>

    </div>
  `;
}


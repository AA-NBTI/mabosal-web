/**
 * 전자책 인앱 웹 뷰어 (A4 페이퍼 시트 고정 판형) 모듈 타입 정의
 */

export type EbookReaderTheme = 'dark' | 'paper' | 'white'; // 다크 / 고서 한지 미색 / 백색 용지

export interface EbookPage {
  pageNumber: number;       // 1, 2, 3 ... 22
  pageLabel: string;        // '01p', '02p' ...
  runningHead: string;      // 상단 머리말 (e.g. '제 1 부 · 음양오행의 본질과 생극제화')
  title?: string;           // 해당 페이지 대주제
  imageUrl: string;         // 실제 PDF 원본에서 추출한 고화질 페이지 이미지 경로 (e.g. '/ebooks/vol1/page-1.webp')
  contentHtml?: string;     // 대체/보조용 본문
  isFreePreview: boolean;   // 무료 공개 여부 (1~3p 무료)
  watermarkText?: string;   // 페이지 하단 워터마크
}

export interface EbookBookMetadata {
  id: string;               // e.g. 'book-saju-principles-vol1'
  storeProductId?: string;  // 연동된 스토어 상품 ID
  title: string;
  subTitle: string;
  volumeLabel: string;      // e.g. '제 1 권'
  author: string;           // e.g. '마보살 명리학술원'
  totalPageCount: number;   // 22
  totalPageLabel: string;   // e.g. '전 22페이지 고밀도 마스터 조견표'
  coverImageUrl?: string;
  badge?: string;
  price: number;
  pages: EbookPage[];
}

export interface EbookReaderSettings {
  theme: EbookReaderTheme;
  zoomLevel: number;        // 85, 100, 115 (%)
}

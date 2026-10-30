import { EbookBookMetadata } from '../types.js';

export const VOL3_PRINCIPLES_EBOOK: EbookBookMetadata = {
  id: 'book-saju-principles-vol3',
  storeProductId: 'book-saju-principles-vol3',
  title: '정통 사주명리학 원론 제3권',
  subTitle: '천간지지 합충형파해와 12운성·핵심 신살',
  volumeLabel: '제 3 권',
  author: '마보살 명리학술원 편찬위원회',
  totalPageCount: 22,
  totalPageLabel: '전 22페이지 고밀도 마스터 조견표',
  coverImageUrl: '/ebooks/vol3/page-1.webp',
  badge: '정통 명저',
  price: 29000,
  pages: Array.from({ length: 22 }, (_, idx) => {
    const pageNum = idx + 1;
    const pageLabel = `${pageNum < 10 ? '0' : ''}${pageNum}p`;
    return {
      pageNumber: pageNum,
      pageLabel,
      runningHead: pageNum === 1 ? '정통 사주명리학 원론 제3권 (표지)' : `제 3 권 · 합충형파해와 12운성·핵심 신살 (${pageLabel})`,
      title: pageNum === 1 ? '정통 사주명리학 원론 제3권: 천간지지 합충과 12운성' : `제3권 마스터 조견표 ${pageLabel}`,
      imageUrl: `/ebooks/vol3/page-${pageNum}.webp`,
      isFreePreview: pageNum <= 3,
    };
  }),
};


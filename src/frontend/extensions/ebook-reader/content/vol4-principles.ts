import { EbookBookMetadata } from '../types.js';

export const VOL4_PRINCIPLES_EBOOK: EbookBookMetadata = {
  id: 'book-saju-principles-vol4',
  storeProductId: 'book-saju-principles-vol4',
  title: '정통 사주명리학 원론 제4권',
  subTitle: '대운·세운 추명과 실전 통변 50대 사례집',
  volumeLabel: '제 4 권',
  author: '마보살 명리학술원 편찬위원회',
  totalPageCount: 22,
  totalPageLabel: '전 22페이지 고밀도 마스터 조견표',
  coverImageUrl: '/ebooks/vol4/page-1.webp',
  badge: '정통 명저',
  price: 29000,
  pages: Array.from({ length: 22 }, (_, idx) => {
    const pageNum = idx + 1;
    const pageLabel = `${pageNum < 10 ? '0' : ''}${pageNum}p`;
    return {
      pageNumber: pageNum,
      pageLabel,
      runningHead: pageNum === 1 ? '정통 사주명리학 원론 제4권 (표지)' : `제 4 권 · 대운세운 추명과 실전 통변 (${pageLabel})`,
      title: pageNum === 1 ? '정통 사주명리학 원론 제4권: 대운·세운 추명과 실전 통변' : `제4권 마스터 조견표 ${pageLabel}`,
      imageUrl: `/ebooks/vol4/page-${pageNum}.webp`,
      isFreePreview: pageNum <= 3,
    };
  }),
};


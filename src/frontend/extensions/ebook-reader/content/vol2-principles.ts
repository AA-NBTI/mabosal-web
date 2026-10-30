import { EbookBookMetadata } from '../types.js';

export const VOL2_PRINCIPLES_EBOOK: EbookBookMetadata = {
  id: 'book-saju-principles-vol2',
  storeProductId: 'book-saju-principles-vol2',
  title: '정통 사주명리학 원론 제2권',
  subTitle: '십신(十神)과 격국(格局)·용신(用神) 통변 원론',
  volumeLabel: '제 2 권',
  author: '마보살 명리학술원 편찬위원회',
  totalPageCount: 22,
  totalPageLabel: '전 22페이지 고밀도 마스터 조견표',
  coverImageUrl: '/ebooks/vol2/page-1.webp',
  badge: '정통 명저',
  price: 29000,
  pages: Array.from({ length: 22 }, (_, idx) => {
    const pageNum = idx + 1;
    const pageLabel = `${pageNum < 10 ? '0' : ''}${pageNum}p`;
    return {
      pageNumber: pageNum,
      pageLabel,
      runningHead: pageNum === 1 ? '정통 사주명리학 원론 제2권 (표지)' : `제 2 권 · 십신과 격국용신 통변 원론 (${pageLabel})`,
      title: pageNum === 1 ? '정통 사주명리학 원론 제2권: 십신과 격국·용신론' : `제2권 마스터 조견표 ${pageLabel}`,
      imageUrl: `/ebooks/vol2/page-${pageNum}.webp`,
      isFreePreview: pageNum <= 3,
    };
  }),
};


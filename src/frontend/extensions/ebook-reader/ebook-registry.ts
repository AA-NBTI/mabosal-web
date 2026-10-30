import { EbookBookMetadata, EbookPage } from './types.js';
import { VOL1_PRINCIPLES_EBOOK } from './content/vol1-principles.js';
import { VOL2_PRINCIPLES_EBOOK } from './content/vol2-principles.js';
import { VOL3_PRINCIPLES_EBOOK } from './content/vol3-principles.js';
import { VOL4_PRINCIPLES_EBOOK } from './content/vol4-principles.js';
import { SELF_GUIDE_EBOOK } from './content/self-guide.js';

const EBOOK_REGISTRY: Record<string, EbookBookMetadata> = {
  [VOL1_PRINCIPLES_EBOOK.id]: VOL1_PRINCIPLES_EBOOK,
  [VOL1_PRINCIPLES_EBOOK.storeProductId!]: VOL1_PRINCIPLES_EBOOK,
  [VOL2_PRINCIPLES_EBOOK.id]: VOL2_PRINCIPLES_EBOOK,
  [VOL2_PRINCIPLES_EBOOK.storeProductId!]: VOL2_PRINCIPLES_EBOOK,
  [VOL3_PRINCIPLES_EBOOK.id]: VOL3_PRINCIPLES_EBOOK,
  [VOL3_PRINCIPLES_EBOOK.storeProductId!]: VOL3_PRINCIPLES_EBOOK,
  [VOL4_PRINCIPLES_EBOOK.id]: VOL4_PRINCIPLES_EBOOK,
  [VOL4_PRINCIPLES_EBOOK.storeProductId!]: VOL4_PRINCIPLES_EBOOK,
  [SELF_GUIDE_EBOOK.id]: SELF_GUIDE_EBOOK,
  [SELF_GUIDE_EBOOK.storeProductId!]: SELF_GUIDE_EBOOK,
};

export function getAllEbooks(): EbookBookMetadata[] {
  return [
    VOL1_PRINCIPLES_EBOOK,
    VOL2_PRINCIPLES_EBOOK,
    VOL3_PRINCIPLES_EBOOK,
    VOL4_PRINCIPLES_EBOOK,
    SELF_GUIDE_EBOOK,
  ];
}

export function getEbookById(id: string): EbookBookMetadata | null {
  if (!id) return null;
  return EBOOK_REGISTRY[id] || Object.values(EBOOK_REGISTRY).find(b => b.id === id || b.storeProductId === id) || null;
}

export function getEbookByProductId(productId: string): EbookBookMetadata | null {
  return Object.values(EBOOK_REGISTRY).find(b => b.storeProductId === productId || b.id === productId) || null;
}

export function getEbookPage(bookId: string, pageNumber: number): EbookPage | null {
  const book = getEbookById(bookId);
  if (!book) return null;
  return book.pages.find(p => p.pageNumber === pageNumber) || null;
}

/**
 * [관리자 삭제/상태 유지 회귀 테스트]
 * - 기본 파트너 삭제 후 읽기 시 부활하지 않아야 한다.
 * - 리포트 상품을 숨김 처리하면 이후 조회에서도 유지되어야 한다.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PartnerTracker } from '../src/frontend/modules/partner-tracker.js';
import {
  getAllStoreProducts,
  updateStoreProduct,
} from '../src/frontend/extensions/commerce-store/store-service.js';

class MemoryMockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, val: string) { this.store[key] = String(val); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockStorage = new MemoryMockStorage();
(globalThis as any).localStorage = mockStorage;

describe('관리자 삭제/상태 유지 회귀', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('파트너 삭제 후 getAllPartners()에서 다시 살아나지 않는다', () => {
    const before = Object.keys(PartnerTracker.getAllPartners());
    expect(before.length).toBeGreaterThan(0);
    const target = before[0];

    expect(PartnerTracker.deletePartner(target)).toBe(true);

    const after1 = Object.keys(PartnerTracker.getAllPartners());
    const after2 = Object.keys(PartnerTracker.getAllPartners());
    expect(after1).not.toContain(target);
    expect(after2).not.toContain(target);
    expect(after1.length).toBe(before.length - 1);
  });

  it('삭제된 파트너 코드를 조회해도 목록에 재등록되지 않는다', () => {
    const target = Object.keys(PartnerTracker.getAllPartners())[0];
    PartnerTracker.deletePartner(target);
    PartnerTracker.getPartnerStats(target);
    expect(Object.keys(PartnerTracker.getAllPartners())).not.toContain(target);
  });

  it('리포트 상품 숨김 상태는 이후 조회에서 판매중으로 덮어써지지 않는다', () => {
    getAllStoreProducts(); // 최초 시드 + 1회성 마이그레이션
    updateStoreProduct('prod-report-career', { status: 'hidden' });
    for (let i = 0; i < 3; i++) {
      const p = getAllStoreProducts().find(x => x.id === 'prod-report-career');
      expect(p?.status).toBe('hidden');
    }
  });
});


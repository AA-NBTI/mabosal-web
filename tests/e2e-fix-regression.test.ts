import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

class MemoryMockStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, val: string) { this.store[key] = String(val); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
  get length() { return Object.keys(this.store).length; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
}

const mockStorage = new MemoryMockStorage();
(globalThis as any).localStorage = mockStorage;

import { supabase } from '../src/frontend/modules/supabase/supabase-client.js';
import { VoucherStore } from '../src/frontend/modules/voucher/voucher-store.js';
import { AuthService } from '../src/frontend/state/auth-service.js';
import {
  recordStoreOrder,
  markOrderAsViewed,
  getAllStoreOrders,
  approveStoreOrderRefund,
} from '../src/frontend/extensions/commerce-store/store-service.js';
import { ensurePaymentLedgerSynced } from '../src/frontend/modules/payment/AdminPaymentLedgerPanel.js';

describe('E2E 결함 수정 회귀 테스트', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. VoucherStore.rejectBankTransfer()가 supabase update에 .then()을 연결해 실제 DB 요청을 실행한다', () => {
    const req = VoucherStore.createBankTransferRequest('홍길동', 39900, '정통 사주풀이', 'user-1', 'ORD-TEST-001');

    const thenSpy = vi.fn((cb?: (res: { error: null }) => void) => {
      if (cb) cb({ error: null });
      return Promise.resolve({ error: null });
    });
    const eqSpy = vi.fn(() => ({ then: thenSpy }));
    const updateSpy = vi.fn(() => ({ eq: eqSpy }));
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ update: updateSpy } as any);

    VoucherStore.rejectBankTransfer(req.id);

    expect(fromSpy).toHaveBeenCalledWith('bank_transfers');
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }));
    expect(eqSpy).toHaveBeenCalledWith('order_id', 'ORD-TEST-001');
    expect(thenSpy).toHaveBeenCalledTimes(1);
  });

  it('2. VoucherStore.resetTransfersSync()가 상태를 초기화하고 syncBankTransfersFromSupabase()를 재실행한다', () => {
    const syncSpy = vi.spyOn(VoucherStore, 'syncBankTransfersFromSupabase').mockResolvedValue();
    VoucherStore.resetTransfersSync();
    expect(syncSpy).toHaveBeenCalledTimes(1);
  });

  it('3. AuthService.logout()이 supabase.auth.signOut()을 호출해 JWT 세션을 정리한다', () => {
    const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as any);
    AuthService.logout();
    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });

  it('4. recordStoreOrder() 및 approveStoreOrderRefund()가 saju_input, selected_option_name, refunded_at 등을 Supabase에 전달한다', async () => {
    const upsertSpy = vi.fn().mockResolvedValue({ error: null });
    const updateEqSpy = vi.fn().mockResolvedValue({ error: null });
    const updateSpy = vi.fn(() => ({ eq: updateEqSpy }));
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'orders') {
        return {
          upsert: upsertSpy,
          update: updateSpy,
        } as any;
      }
      return { upsert: vi.fn().mockResolvedValue({ error: null }) } as any;
    });
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: { user: { id: '11111111-1111-1111-1111-111111111111' } } },
    } as any);

    recordStoreOrder({
      orderId: 'ORD-SAJU-META-01',
      productId: 'prod-paid-saju-premium',
      productTitle: '정통 유료 사주풀이',
      category: 'report',
      amount: 39900,
      buyerName: '김철수',
      buyerEmail: 'cs@mabosal.com',
      buyerPhone: '010-1234-5678',
      paymentMethod: 'kakaopay',
      status: 'completed',
      paidAt: '2026-11-14T00:00:00.000Z',
      deliveryType: 'saju_report',
      accessUrl: '/?view=result',
      sajuInput: { userName: '김철수', birthYear: 1990, birthMonth: 5, birthDay: 15 },
      selectedOptionName: '[프리미엄] 평생대운 + 10년운세',
      reportTier: 'PAID',
      appliedCouponCode: 'WELCOME10',
      discountAmount: 3000,
      usedYeop: 500,
    });

    await new Promise(r => setTimeout(r, 10));

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ORD-SAJU-META-01',
        saju_input: { userName: '김철수', birthYear: 1990, birthMonth: 5, birthDay: 15 },
        selected_option_name: '[프리미엄] 평생대운 + 10년운세',
        report_tier: 'PAID',
        applied_coupon_code: 'WELCOME10',
        discount_amount: 3000,
        used_yeop: 500,
      }),
      { onConflict: 'id' }
    );

    approveStoreOrderRefund('ORD-SAJU-META-01');
    await new Promise(r => setTimeout(r, 10));
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'refunded',
        refunded_at: expect.any(String),
      })
    );
  });

  it('5. markOrderAsViewed()가 viewedAt을 기록하고 main.ts의 리포트/전자책 핸들러에 연결되어 있다', () => {
    recordStoreOrder({
      orderId: 'ORD-VIEW-TEST-01',
      productId: 'book-saju-principles-vol1',
      productTitle: '정통 사주명리학 원론 제1권',
      category: 'ebook',
      amount: 29000,
      buyerName: '이영희',
      buyerEmail: 'yh@mabosal.com',
      buyerPhone: '010-9999-8888',
      paymentMethod: 'card',
      status: 'completed',
      paidAt: '2026-11-14T00:00:00.000Z',
      deliveryType: 'digital_download',
      accessUrl: '/assets/downloads/saju_principles_vol1_master.pdf',
    });

    markOrderAsViewed('ORD-VIEW-TEST-01');
    const updated = getAllStoreOrders().find(o => o.orderId === 'ORD-VIEW-TEST-01');
    expect(updated?.viewedAt).toBeTruthy();

    const mainTs = readFileSync(resolve(process.cwd(), 'src/frontend/main.ts'), 'utf8');
    expect(mainTs).toContain('markOrderAsViewed(targetOrder.orderId)');
    expect(mainTs).toContain('markOrderAsViewed(orderId)');
  });

  it('6. ensurePaymentLedgerSynced()가 VoucherStore.syncBankTransfersFromSupabase()를 함께 호출한다', async () => {
    const transferSyncSpy = vi.spyOn(VoucherStore, 'syncBankTransfersFromSupabase').mockResolvedValue();
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as any);
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValue({ data: { ok: true, items: [] }, error: null } as any);

    ensurePaymentLedgerSynced(() => {});
    await new Promise(r => setTimeout(r, 20));
    expect(transferSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('7. portone-payment Edge Function이 payment_method 및 refund_requested 덮어쓰기 경합을 방지한다', () => {
    const fnCode = readFileSync(resolve(process.cwd(), 'supabase/functions/portone-payment/index.ts'), 'utf8');
    expect(fnCode).toContain('resolvePortOnePaymentMethod');
    expect(fnCode).toContain("select('payment_method, status, refund_requested, refund_reason, refunded_at')");
    expect(fnCode).toContain('snap.paymentMethod');
    expect(fnCode).not.toContain("payment_method: 'toss_card'");
  });

  it('8. 카드 결제 취소 요청(requestStoreOrderRefund) 시 주문이 삭제되지 않고 refundRequested: true(환불 심사 중)로 유지된다', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'orders') {
        return {
          upsert: upsertMock,
          update: updateMock,
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      }
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      } as any;
    });

    const { requestStoreOrderRefund } = await import('../src/frontend/extensions/commerce-store/store-service');

    recordStoreOrder({
      orderId: 'ORD-CARD-CANCEL-01',
      productId: 'book-saju-principles-vol1',
      productTitle: '정통 사주명리학 원론 제1권',
      category: 'ebook',
      amount: 29000,
      buyerName: '송회원',
      buyerEmail: 'song1205@mabosal.com',
      buyerPhone: '010-1234-5678',
      paymentMethod: 'portone_card',
      status: 'completed',
      paidAt: '2026-11-14T00:00:00.000Z',
      deliveryType: 'digital_download',
    });

    const refundedReq = requestStoreOrderRefund('ORD-CARD-CANCEL-01', '단순 변심 취소 요청');
    expect(refundedReq.success).toBe(true);

    await new Promise(r => setTimeout(r, 20));

    const remaining = getAllStoreOrders().find(o => o.orderId === 'ORD-CARD-CANCEL-01');
    expect(remaining).toBeDefined();
    expect(remaining?.status).toBe('completed');
    expect(remaining?.refundRequested).toBe(true);
    expect(remaining?.refundReason).toBe('단순 변심 취소 요청');
    // DB에 기존 행이 없었을 경우(0건 업데이트) 자동으로 전체 주문 upsert 폴백 호출 확인
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ORD-CARD-CANCEL-01',
        refund_requested: true,
        refund_reason: '단순 변심 취소 요청',
      }),
      { onConflict: 'id' }
    );
  });

  it('9. 관리자 대시보드에 환불 신청 실시간 알림 구조(배지·KPI·환불요청 필터·Realtime 구독)가 연결되어 있다', async () => {
    const { requestStoreOrderRefund } = await import('../src/frontend/extensions/commerce-store/store-service');
    recordStoreOrder({
      orderId: 'ORD-ADMIN-ALERT-01',
      productId: 'book-saju-principles-vol1',
      productTitle: '정통 사주명리학 원론 제1권',
      category: 'ebook',
      amount: 29000,
      buyerName: '송회원',
      buyerEmail: 'song1205@mabosal.com',
      buyerPhone: '010-1234-5678',
      paymentMethod: 'portone_card',
      status: 'completed',
      paidAt: '2026-11-14T00:00:00.000Z',
      deliveryType: 'digital_download',
    });
    requestStoreOrderRefund('ORD-ADMIN-ALERT-01', '알림 테스트 환불 요청');

    const { renderAdminPaymentLedgerPanel, setPaymentLedgerFilter } = await import(
      '../src/frontend/modules/payment/AdminPaymentLedgerPanel'
    );
    setPaymentLedgerFilter('refund_requested');
    const ledgerHtml = renderAdminPaymentLedgerPanel();
    expect(ledgerHtml).toContain('환불 심사 대기');
    expect(ledgerHtml).toContain('data-filter="refund_requested"');
    expect(ledgerHtml).toContain('ORD-ADMIN-ALERT-01');
    setPaymentLedgerFilter('all');

    const adminPageTs = readFileSync(resolve(process.cwd(), 'src/frontend/pages/AdminPage.ts'), 'utf8');
    expect(adminPageTs).toContain("table: 'orders'");
    expect(adminPageTs).toContain('mabosal:orders-updated');
    expect(adminPageTs).toContain('showAdminRefundToast');

    const adminViewTs = readFileSync(resolve(process.cwd(), 'src/frontend/views/AdminDashboardView.ts'), 'utf8');
    expect(adminViewTs).toContain('pendingRefundRequestsCount');
    expect(adminViewTs).toContain('결제 환불 심사 대기');
    expect(adminViewTs).toContain('data-ledger-filter="refund_requested"');
  });

  it('10. syncOrdersFromSupabase() 진행 중 mm-auth-changed가 발생해도 드롭되지 않고 재동기화가 예약(ordersSyncQueued)된다', () => {
    const storeServiceTs = readFileSync(
      resolve(process.cwd(), 'src/frontend/extensions/commerce-store/store-service.ts'),
      'utf8'
    );
    expect(storeServiceTs).toContain('let ordersSyncQueued = false;');
    expect(storeServiceTs).toContain('ordersSyncQueued = true;');
    expect(storeServiceTs).toContain('if (ordersSyncQueued)');
  });
});


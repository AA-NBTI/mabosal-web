import { updateStoreOrder } from '../../extensions/commerce-store/store-service.js';
import { supabase } from '../supabase/supabase-client.js';
import { getIdentity } from '../identity/index.js';
import { getStorage } from '../persistence/index.js';
/**
 * [Voucher & Bank Transfer Module] 쿠폰, 상품권 및 무통장 입금 트랜잭션 마스터 스토어
 */

export interface VoucherCoupon {
  id: string;
  code: string;
  name: string;
  type: 'free_pass' | 'fixed_discount' | 'percent_discount' | 'cash_card';
  discountAmount?: number;
  discountRate?: number;
  targetProduct: string; // 'all' | 'free_report' | 'paid_saju' | 'year_2027' 등
  minOrderAmount?: number;
  expiryDate?: string;
  usedCount: number;
  usageLimit?: number;
  enabled: boolean;
  createdAt: string;
}

export interface BankTransferRequest {
  id: string;
  depositorName: string;
  requestedAmount: number;
  targetProduct: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedCouponCode?: string;
  userIdentifier: string;
  bankInfo: string;
  createdAt: string;
  approvedAt?: string;
  memo?: string;
  /** 스토어 주문과 연결된 입금 신청이면 주문번호 */
  orderId?: string;
}

export interface UserVoucherWalletItem {
  code: string;
  name: string;
  type: string;
  discountDescription: string;
  expiryDate: string;
  targetProduct: string;
  registeredAt: string;
  isUsed: boolean;
}

const STORAGE_KEY_COUPONS = 'mabosal_admin_vouchers_v2';
const STORAGE_KEY_TRANSFERS = 'mabosal_bank_transfers_v1';
const STORAGE_KEY_USER_WALLET = 'mabosal_user_voucher_wallet_v2';
const STORAGE_KEY_USER_CASH = 'mabosal_user_cash_balance_v1';

// [쿠폰 완전 제거] 회원에게 자동/기본 지급되는 쿠폰 없음 (0건)
const INITIAL_COUPONS: VoucherCoupon[] = [];

const INITIAL_TRANSFERS: BankTransferRequest[] = [
  {
    id: 'tr-1002',
    depositorName: '김민수',
    requestedAmount: 19900,
    targetProduct: '마보살 정통 사주 진단서 (19,900원)',
    status: 'approved',
    appliedCouponCode: 'MABOSAL-FREE',
    userIdentifier: 'client_kim',
    bankInfo: '기업은행 103-123733-04-012 (템바보드 주식회사)',
    createdAt: '2026-10-11 18:40:02',
    approvedAt: '2026-10-11 19:05:22',
    memo: '관리자 입금 실사 확인 완료'
  }
];

export class VoucherStore {
  private static approvalHooks: Array<(t: BankTransferRequest) => void> = [];
  private static rejectHooks: Array<(t: BankTransferRequest) => void> = [];
  static onTransferApproved(h: (t: BankTransferRequest) => void): void { this.approvalHooks.push(h); }
  static onTransferRejected(h: (t: BankTransferRequest) => void): void { this.rejectHooks.push(h); }

  // 1. 쿠폰 관리
  
  /** 관리자가 활성화해 둔 상품 적용 가능 쿠폰 조회 */
  static getEnabledCouponsForProduct(targetProductId?: string): VoucherCoupon[] {
    const all = this.getCoupons().filter(c => c.enabled);
    if (!targetProductId) return all;
    return all.filter(c => c.targetProduct === 'all' || c.targetProduct === targetProductId || (c.type === 'free_pass' && (c.targetProduct === 'free_report' || c.targetProduct === 'all')));
  }

  static getCoupons(): VoucherCoupon[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COUPONS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(INITIAL_COUPONS));
    return INITIAL_COUPONS;
  }

  static saveCoupons(coupons: VoucherCoupon[]): void {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(coupons));
  }

  static createCoupon(coupon: Omit<VoucherCoupon, 'id' | 'usedCount' | 'createdAt'>): VoucherCoupon {
    const coupons = this.getCoupons();
    const newCoupon: VoucherCoupon = {
      ...coupon,
      id: 'coup-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      code: coupon.code.trim().toUpperCase(),
      usedCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    coupons.unshift(newCoupon);
    this.saveCoupons(coupons);
    // [Supabase 동기화]
    supabase.from('coupons').insert({
      code: newCoupon.code,
      name: newCoupon.name,
      type: newCoupon.type,
      discount_amount: newCoupon.discountAmount,
      discount_rate: newCoupon.discountRate,
      target_product: newCoupon.targetProduct,
      expiry_date: newCoupon.expiryDate || null,
      enabled: newCoupon.enabled,
    }).then(({ error }) => {
      if (error) console.warn('[VoucherStore] Supabase coupon sync deferred:', error.message);
    });

    return newCoupon;
  }

  static deleteCoupon(id: string): void {
    const coupons = this.getCoupons().filter(c => c.id !== id);
    this.saveCoupons(coupons);
  }

  static toggleCoupon(id: string): void {
    const coupons = this.getCoupons().map(c => {
      if (c.id === id) return { ...c, enabled: !c.enabled };
      return c;
    });
    this.saveCoupons(coupons);
  }

  // 2. 무통장 입금 신청 및 승인
  static getBankTransfers(): BankTransferRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TRANSFERS);
      if (raw) {
        let list: BankTransferRequest[] = JSON.parse(raw);
        if (list.some(t => t.id === 'tr-1001')) {
          list = list.filter(t => t.id !== 'tr-1001');
          localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(list));
        }
        return list;
      }
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(INITIAL_TRANSFERS));
    return INITIAL_TRANSFERS;
  }

  static saveBankTransfers(transfers: BankTransferRequest[]): void {
    localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(transfers));
  }

  static createBankTransferRequest(depositorName: string, amount: number, targetProduct: string, userIdentifier: string = '의뢰인', orderId?: string): BankTransferRequest {
    const transfers = this.getBankTransfers();
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    const newReq: BankTransferRequest = {
      id: 'tr-' + Date.now().toString(36),
      depositorName: depositorName.trim(),
      requestedAmount: amount,
      targetProduct,
      status: 'pending',
      userIdentifier,
      bankInfo: '기업은행 103-123733-04-012 (템바보드 주식회사)',
      createdAt: dateStr,
      memo: orderId ? `주문 ${orderId} 입금 확인 대기` : '사용자 무통장 입금 신청 접수',
      orderId
    };
    transfers.unshift(newReq);
    this.saveBankTransfers(transfers);
    // [Supabase 동기화]
    supabase.from('bank_transfers').insert({
      order_id: orderId || null,
      depositor_name: newReq.depositorName,
      requested_amount: newReq.requestedAmount,
      target_product: newReq.targetProduct,
      status: 'pending',
      memo: newReq.memo,
    }).then(({ error }) => {
      if (error) console.warn('[VoucherStore] Supabase transfer sync deferred:', error.message);
    });

    return newReq;
  }

  static approveBankTransfer(id: string): { success: boolean; issuedCode: string; message: string } {
    const transfers = this.getBankTransfers();
    const target = transfers.find(t => t.id === id);
    if (!target) return { success: false, issuedCode: '', message: '신청 내역을 찾을 수 없습니다.' };

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    let issuedCode = '';

    // 1. 스토어 주문에 연결된 입금인 경우
    if (target.orderId) {
      target.status = 'approved';
      target.approvedAt = dateStr;

      // 해당 주문이 상품권(바우처) 상품인지 판별
      const isVoucherProduct = target.targetProduct.includes('상품권') || 
                               target.targetProduct.includes('쿠폰') || 
                               target.targetProduct.includes('바우처');

      if (isVoucherProduct) {
        issuedCode = 'VCHR-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        target.appliedCouponCode = issuedCode;
        target.memo = `주문 ${target.orderId} 입금 확인 · 정식 바우처 발급 완료 [${issuedCode}]`;

        // 쿠폰함에 신규 등록
        this.createCoupon({
          code: issuedCode,
          name: `[정식 발급] ${target.targetProduct}`,
          type: 'fixed_discount',
          discountAmount: target.requestedAmount,
          targetProduct: 'all',
          expiryDate: '2027-12-31',
          enabled: true
        });

        // 사용자 지갑에 등록
        this.registerUserVoucher(issuedCode);

        // 주문 업데이트 (status: completed, accessUrl에 바우처 포함)
        updateStoreOrder(target.orderId, {
          status: 'completed',
          accessUrl: `/?view=store&voucher=${issuedCode}`,
        });
      } else {
        target.memo = `주문 ${target.orderId} 입금 확인 · 결제 완료 처리`;
        updateStoreOrder(target.orderId, { status: 'completed' });
      }

      this.saveBankTransfers(transfers);
      this.approvalHooks.forEach(h => h(target));

      // [Supabase DB 양방향 실시간 동기화]
      const btQuery = target.orderId 
        ? supabase.from('bank_transfers').update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            applied_coupon_code: issuedCode || null,
            memo: target.memo,
          }).eq('order_id', target.orderId)
        : supabase.from('bank_transfers').update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            applied_coupon_code: issuedCode || null,
            memo: target.memo,
          }).eq('depositor_name', target.depositorName);
      
      btQuery.then(({ error }) => {
        if (error) console.warn('[VoucherStore] Supabase bank_transfers update deferred:', error.message);
      });

      supabase.from('orders').update({
        status: 'completed',
        paid_at: new Date().toISOString(),
      }).eq('id', target.orderId).then(({ error }) => {
        if (error) console.warn('[VoucherStore] Supabase orders completed sync error:', error.message);
      });

      if (issuedCode) {
        supabase.from('coupons').insert({
          code: issuedCode,
          name: `[정식 발급] ${target.targetProduct}`,
          type: 'fixed_discount',
          discount_amount: target.requestedAmount,
          target_product: 'all',
          expiry_date: '2027-12-31',
          enabled: true,
        }).then(({ error }) => {
          if (error) console.warn('[VoucherStore] Supabase coupon insert deferred:', error.message);
        });
      }

      const msg = isVoucherProduct
        ? `입금이 확인되어 상품권 주문 ${target.orderId} 결제완료 및 고유 바우처 코드 [${issuedCode}] 가 즉시 발급되었습니다!`
        : `입금이 확인되어 주문 ${target.orderId} 이(가) 결제완료 처리되었습니다.`;
      return { success: true, issuedCode, message: msg };
    }

    // 2. 일반 무통장 신청(주문번호 없는 직입금)
    issuedCode = 'PASS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const discountAmt = target.requestedAmount >= 39900 ? 39900 : target.requestedAmount;
    this.createCoupon({
      code: issuedCode,
      name: `[${target.depositorName} 님 입금 승인권] ${target.targetProduct}`,
      type: 'fixed_discount',
      discountAmount: discountAmt,
      targetProduct: 'all',
      expiryDate: '2026-12-31',
      enabled: true
    });

    if (target.requestedAmount > 39900) {
      const surplus = target.requestedAmount - 39900;
      this.addCash(surplus);
    }

    target.status = 'approved';
    target.appliedCouponCode = issuedCode;
    target.approvedAt = dateStr;
    target.memo = `원클릭 승인 완료 (${issuedCode} 지급됨)`;

    this.saveBankTransfers(transfers);
    this.registerUserVoucher(issuedCode);

    // [Supabase 동기화]
    supabase.from('bank_transfers').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      applied_coupon_code: issuedCode,
      memo: `승인 완료 (${issuedCode} 지급)`,
    }).eq('id', target.id).then(({ error }) => {
      if (error) console.warn('[VoucherStore] Supabase approve sync deferred:', error.message);
    });

    supabase.from('coupons').insert({
      code: issuedCode,
      name: `[${target.depositorName} 님 입금 승인권] ${target.targetProduct}`,
      type: 'fixed_discount',
      discount_amount: discountAmt,
      target_product: 'all',
      expiry_date: '2026-12-31',
      enabled: true,
    }).then(({ error }) => {
      if (error) console.warn('[VoucherStore] Supabase direct coupon insert deferred:', error.message);
    });

    return { success: true, issuedCode, message: `입금이 확인되어 승인 쿠폰(${issuedCode})이 즉시 발행되었습니다.` };
  }

  static rejectBankTransfer(id: string): void {
    const transfers = this.getBankTransfers();
    const target = transfers.find(t => t.id === id);
    if (target) {
      target.status = 'rejected';
      target.memo = '입금 내역 불일치 또는 미입금으로 반려 처리';
      this.saveBankTransfers(transfers);
      this.rejectHooks.forEach(h => h(target));
    }
  }

  private static getUserWalletKey(): string {
    const me = getIdentity();
    const ownerId = me.isGuest ? 'guest' : (me.userId || 'guest');
    return `${STORAGE_KEY_USER_WALLET}_${ownerId}`;
  }

  private static getUserCashKey(): string {
    const me = getIdentity();
    const ownerId = me.isGuest ? 'guest' : (me.userId || 'guest');
    return `${STORAGE_KEY_USER_CASH}_${ownerId}`;
  }

  // 3. 사용자 쿠폰 지갑 (계정별 독립 관리)
  static getUserWallet(): UserVoucherWalletItem[] {
    const key = this.getUserWalletKey();
    const purgeKey = 'mabosal_vouchers_purged_all_v2';
    const storage = getStorage();

    // 1회성 전면 초기화 마이그레이션 (이용자에게 기존 부여된 쿠폰 전면 제거)
    if (storage && !storage.getItem(purgeKey)) {
      this.clearAllUserWallets();
      storage.setItem(purgeKey, 'true');
      return [];
    }

    try {
      const raw = storage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    // 기본 지급 쿠폰 없음 (빈 지갑)
    const initialWallet: UserVoucherWalletItem[] = [];
    storage.setItem(key, JSON.stringify(initialWallet));
    return initialWallet;
  }

  /**
   * 모든 이용자 지갑 내 보유 쿠폰 완전 삭제
   */
  static clearAllUserWallets(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_KEY_USER_WALLET)) {
            localStorage.setItem(k, JSON.stringify([]));
          }
        }
      } catch (e) {
        console.warn('[VoucherStore] clearAllUserWallets error:', e);
      }
    }
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(this.getUserWalletKey(), JSON.stringify([]));
      } catch {}
    }
  }

  static clearUserWallet(): void {
    const key = this.getUserWalletKey();
    getStorage().setItem(key, JSON.stringify([]));
  }

  static registerUserVoucher(code: string): { success: boolean; message: string; coupon?: VoucherCoupon } {
    const cleanCode = code.trim().toUpperCase();
    const coupons = this.getCoupons();
    const found = coupons.find(c => c.code === cleanCode);

    if (!found) {
      return { success: false, message: '유효하지 않거나 존재하지 않는 쿠폰 코드입니다.' };
    }
    if (!found.enabled) {
      return { success: false, message: '현재 사용 중지된 쿠폰입니다.' };
    }

    const wallet = this.getUserWallet();
    if (wallet.some(w => w.code === cleanCode && !w.isUsed)) {
      return { success: false, message: '이미 등록되어 보유 중인 쿠폰입니다.' };
    }

    const desc = found.type === 'free_pass' 
      ? '100% 전액 무료 패스' 
      : found.type === 'percent_discount' 
        ? `${found.discountRate}% 즉시 할인` 
        : `${(found.discountAmount || 0).toLocaleString()}원 즉시 차감`;

    wallet.unshift({
      code: found.code,
      name: found.name,
      type: found.type,
      discountDescription: desc,
      expiryDate: found.expiryDate || '무기한',
      targetProduct: found.targetProduct,
      registeredAt: new Date().toISOString().split('T')[0],
      isUsed: false
    });

    const key = this.getUserWalletKey();
    getStorage().setItem(key, JSON.stringify(wallet));
    return { success: true, message: `[${found.name}] 쿠폰이 등록되었습니다.`, coupon: found };
  }

  // 4. 잔액 캐시 관리 (계정별 독립 관리)
  static getUserCash(): number {
    const key = this.getUserCashKey();
    try {
      const raw = getStorage().getItem(key);
      if (raw) return parseInt(raw, 10);
    } catch (e) {}
    return 100; // 기본 잔액 100원
  }

  static addCash(amount: number): number {
    const current = this.getUserCash();
    const next = current + amount;
    const key = this.getUserCashKey();
    getStorage().setItem(key, next.toString());
    return next;
  }

  static deductCash(amount: number): boolean {
    const current = this.getUserCash();
    if (current < amount) return false;
    const key = this.getUserCashKey();
    getStorage().setItem(key, (current - amount).toString());
    return true;
  }
}

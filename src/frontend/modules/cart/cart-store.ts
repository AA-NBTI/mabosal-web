/**
 * CartStore - 마보살 정식 쇼핑몰 장바구니 상태 관리자
 */
import { StoreProduct } from '../../extensions/commerce-store/types.js';
import { UserSajuProfile, UserSajuStore } from '../../state/user-saju-store.js';
import { CartItem, CartSummary } from './types.js';
import { getIdentity } from '../identity/index.js';
import { getStorage } from '../persistence/index.js';

const STORAGE_KEY_PREFIX = 'mabosal_inhouse_cart';
export const SHIPPING_FREE_THRESHOLD = 50000;
export const DEFAULT_SHIPPING_FEE = 3000;

export class CartStore {
  /** 현재 로그인 사용자별 격리된 장바구니 스토리지 키 산출 */
  public static getStorageKey(): string {
    const me = getIdentity();
    const ownerId = me.isGuest ? 'guest' : (me.userId || 'guest');
    return `${STORAGE_KEY_PREFIX}_${ownerId}`;
  }

  public static getItems(): CartItem[] {
    try {
      const key = this.getStorageKey();
      const raw = getStorage().getItem(key);
      if (!raw) return [];
      const list = JSON.parse(raw) as CartItem[];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  private static saveItems(items: CartItem[]): void {
    const key = this.getStorageKey();
    getStorage().setItem(key, JSON.stringify(items));
    this.notifyChange();
  }

  /**
   * 장바구니에 상품 추가 (동일 상품이라도 사주 대상자 이름이 다르면 별도 항목으로 분리)
   */
  public static addItem(product: StoreProduct, quantity: number = 1, sajuProfile?: UserSajuProfile): CartItem {
    const items = this.getItems();
    const sajuSnap = sajuProfile || UserSajuStore.getProfileOrDefault();

    // 동일 상품 & 동일 사주 대상자명인 경우 수량 증가
    const existingIndex = items.findIndex(
      it => it.productId === product.id && it.sajuSnapshot.userName === sajuSnap.userName
    );

    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
      items[existingIndex].selected = true; // 새로 담긴 항목은 자동 선택
      this.saveItems(items);
      return items[existingIndex];
    }

    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      quantity: Math.max(1, quantity),
      deliveryType: product.deliveryType,
      thumbnailUrl: product.thumbnailUrl,
      category: product.category,
      reportTier: product.reportTier,
      contentPayload: product.contentPayload,
      sajuSnapshot: sajuSnap,
      selected: true,
      addedAt: new Date().toISOString(),
    };

    items.unshift(newItem);
    this.saveItems(items);
    return newItem;
  }

  public static removeItem(cartItemId: string): void {
    const items = this.getItems().filter(it => it.id !== cartItemId && it.productId !== cartItemId);
    this.saveItems(items);
  }

  public static removeSelectedItems(): void {
    const items = this.getItems().filter(it => !it.selected);
    this.saveItems(items);
  }

  public static updateQuantity(cartItemId: string, quantity: number): void {
    const items = this.getItems();
    const target = items.find(it => it.id === cartItemId || it.productId === cartItemId);
    if (target) {
      target.quantity = Math.max(1, quantity);
      this.saveItems(items);
    }
  }

  public static toggleSelect(cartItemId: string): void {
    const items = this.getItems();
    const target = items.find(it => it.id === cartItemId || it.productId === cartItemId);
    if (target) {
      target.selected = !target.selected;
      this.saveItems(items);
    }
  }

  public static toggleSelectAll(select: boolean): void {
    const items = this.getItems().map(it => ({ ...it, selected: select }));
    this.saveItems(items);
  }

  public static clear(): void {
    getStorage().removeItem(this.getStorageKey());
    this.notifyChange();
  }

  public static getSelectedItems(): CartItem[] {
    return this.getItems().filter(it => it.selected);
  }

  public static getCount(): number {
    return this.getItems().reduce((sum, it) => sum + it.quantity, 0);
  }

  public static getTotalAmount(): number {
    return this.getItems().reduce((sum, it) => sum + it.price * it.quantity, 0);
  }

  public static hasPhysicalItems(): boolean {
    return this.getItems().some(it => it.deliveryType === 'shipping' || it.category === 'goods');
  }

  public static hasSajuReportItems(): boolean {
    return this.getItems().some(it => it.deliveryType === 'saju_report' || it.category === 'report');
  }

  /**
   * 장바구니 합계 요약 (선택된 상품 기준, 스마트 배송비 계산)
   */
  public static getSummary(): CartSummary {
    const all = this.getItems();
    const selected = all.filter(it => it.selected);

    const totalItemsCount = all.reduce((sum, it) => sum + it.quantity, 0);
    const selectedItemsCount = selected.reduce((sum, it) => sum + it.quantity, 0);
    const selectedProductAmount = selected.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const hasPhysicalItems = selected.some(it => it.deliveryType === 'shipping' || it.category === 'goods');
    const hasSajuReportItems = selected.some(it => it.deliveryType === 'saju_report' || it.category === 'report');

    // 배송비 계산: 실물 상품이 있을 때만 3,000원, 50,000원 이상 시 무료
    let shippingFee = 0;
    if (hasPhysicalItems) {
      const physicalAmount = selected
        .filter(it => it.deliveryType === 'shipping' || it.category === 'goods')
        .reduce((sum, it) => sum + it.price * it.quantity, 0);
      shippingFee = physicalAmount >= SHIPPING_FREE_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
    }

    const totalPayAmount = selectedProductAmount + shippingFee;

    return {
      totalItemsCount,
      selectedItemsCount,
      selectedProductAmount,
      shippingFee,
      totalPayAmount,
      hasPhysicalItems,
      hasSajuReportItems,
    };
  }

  public static notifyChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mm-cart-changed', { detail: { count: this.getCount() } }));
    }
  }
}

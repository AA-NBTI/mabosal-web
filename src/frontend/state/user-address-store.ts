/**
 * [UserAddressStore] 회원 배송지 주소록 저장소
 * - 다중 배송지 등록/관리 및 기본 배송지 설정
 * - 주문 결제창에서 원클릭 자동 완성 연동
 */

import { AuthService } from './auth-service.js';

export interface UserAddress {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  detailAddress: string;
  deliveryMemo?: string;
  isDefault: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'mabosal_user_addresses_v1';

export class UserAddressStore {
  private static loadAll(): UserAddress[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static saveAll(list: UserAddress[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[UserAddressStore] save error:', e);
    }
  }

  /**
   * 특정 회원(또는 현재 로그인 회원)의 배송지 목록 조회
   */
  public static getAddresses(userId?: string): UserAddress[] {
    const uid = userId || AuthService.getCurrentUser().id;
    const all = this.loadAll();
    const list = all.filter(a => a.userId === uid);

    // 기본 등록 배송지가 없는데 로그인 사용자 정보가 있는 경우 기본 예시 주소 생성
    if (list.length === 0 && uid && AuthService.getCurrentUser().role !== 'guest') {
      const user = AuthService.getCurrentUser();
      const initial: UserAddress = {
        id: 'addr-' + Date.now().toString(36),
        userId: uid,
        recipientName: user.name || '홍길동',
        recipientPhone: '010-1234-5678',
        address: '서울특별시 강남구 테헤란로 152',
        detailAddress: '강남파이낸스센터 12층',
        deliveryMemo: '부재 시 문 앞에 놓아주세요',
        isDefault: true,
        updatedAt: new Date().toISOString(),
      };
      all.push(initial);
      this.saveAll(all);
      return [initial];
    }

    return list;
  }

  /**
   * 기본 배송지 1건 조회
   */
  public static getDefaultAddress(userId?: string): UserAddress | undefined {
    const list = this.getAddresses(userId);
    return list.find(a => a.isDefault) || list[0];
  }

  /**
   * 배송지 신규 등록 또는 수정
   */
  public static saveAddress(addr: {
    id?: string;
    recipientName: string;
    recipientPhone: string;
    address: string;
    detailAddress: string;
    deliveryMemo?: string;
    isDefault?: boolean;
    userId?: string;
  }): UserAddress {
    const uid = addr.userId || AuthService.getCurrentUser().id || 'guest';
    const all = this.loadAll();

    if (addr.isDefault) {
      // 기존 기본 배송지 해제
      all.forEach(a => {
        if (a.userId === uid) a.isDefault = false;
      });
    }

    if (addr.id) {
      const existing = all.find(a => a.id === addr.id);
      if (existing) {
        existing.recipientName = addr.recipientName;
        existing.recipientPhone = addr.recipientPhone;
        existing.address = addr.address;
        existing.detailAddress = addr.detailAddress;
        existing.deliveryMemo = addr.deliveryMemo;
        existing.isDefault = addr.isDefault ?? existing.isDefault;
        existing.updatedAt = new Date().toISOString();
        this.saveAll(all);
        return existing;
      }
    }

    const newAddr: UserAddress = {
      id: 'addr-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      userId: uid,
      recipientName: addr.recipientName,
      recipientPhone: addr.recipientPhone,
      address: addr.address,
      detailAddress: addr.detailAddress,
      deliveryMemo: addr.deliveryMemo,
      isDefault: addr.isDefault ?? (all.filter(a => a.userId === uid).length === 0),
      updatedAt: new Date().toISOString(),
    };

    all.unshift(newAddr);
    this.saveAll(all);
    return newAddr;
  }

  /**
   * 배송지 삭제
   */
  public static deleteAddress(id: string): void {
    const all = this.loadAll();
    const filtered = all.filter(a => a.id !== id);
    this.saveAll(filtered);
  }

  /**
   * 기본 배송지 변경
   */
  public static setDefaultAddress(id: string, userId?: string): void {
    const uid = userId || AuthService.getCurrentUser().id;
    const all = this.loadAll();
    all.forEach(a => {
      if (a.userId === uid) {
        a.isDefault = (a.id === id);
      }
    });
    this.saveAll(all);
  }
}

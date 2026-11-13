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
    return all.filter(a => a.userId === uid);
  }

  /**
   * 회원의 기본 개인정보(성함·연락처·생년월일·기본 주소) 완성도 점검
   */
  public static getProfileCompleteness(user?: {
    id?: string;
    role?: string;
    name?: string;
    phone?: string;
    birthDate?: string;
  }): { isComplete: boolean; missingFields: string[]; completionRate: number } {
    const target = user || AuthService.getCurrentUser();
    if (!target || target.role === 'guest') {
      return { isComplete: true, missingFields: [], completionRate: 100 };
    }

    const missingFields: string[] = [];
    const trimmedName = (target.name || '').trim();
    if (!trimmedName || trimmedName === '회원') {
      missingFields.push('성함');
    }

    const trimmedPhone = (target.phone || '').trim();
    if (!trimmedPhone || trimmedPhone === '010-0000-0000' || trimmedPhone === '010-1234-5678') {
      missingFields.push('연락처');
    }

    if (!(target.birthDate || '').trim()) {
      missingFields.push('생년월일');
    }

    if (this.getAddresses(target.id).length === 0) {
      missingFields.push('기본 주소');
    }

    const total = 4;
    const completed = total - missingFields.length;
    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionRate: Math.round((completed / total) * 100),
    };
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

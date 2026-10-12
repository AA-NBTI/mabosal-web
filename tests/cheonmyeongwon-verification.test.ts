import { describe, it, expect } from 'vitest';
import { generateDownloadableReportText } from '../src/frontend/components/tier-templates.js';
import { CatalogStore } from '../src/frontend/state/catalog-store.js';

describe('천명원 고도화 및 최고 관리자 카탈로그 검증', () => {
  it('소장용 TXT 텍스트 파일에 [목차] 및 [제 01 장] ~ [제 13 장] 체계가 완벽히 구성된다', () => {
    const sampleState = {
      userName: '홍길동',
      gender: 'female',
      calendarType: 'solar',
      activeTierTab: 'FREE',
      sessionState: {
        request: {
          birthDate: '1993-08-15',
          birthTime: '14:30',
          gender: 'female',
        },
      },
    };

    const txt = generateDownloadableReportText(sampleState as any);

    // 검증 1: 헤더 및 의뢰인 정보
    expect(txt).toContain('마보살 정통 사주 감명서 (평생 소장본)');
    expect(txt).toContain('홍길동');
    expect(txt).toContain('1993-08-15 14:30');

    // 검증 2: 전체 감명 목차
    expect(txt).toContain('[ 2. 전체 감명 목차 (Table of Contents) ]');

    // 검증 3: 장별 섹션 체계
    expect(txt).toContain('[제 01 장]');
    expect(txt).toContain('[제 13 장]');

    // 검증 4: 충분한 감명 분량 (1,000자 이상)
    expect(txt.length).toBeGreaterThan(1500);
  });

  it('CatalogStore에서 판매 상품 및 협력업체를 클릭으로 넣었다 뺐다 CRUD 할 수 있다', () => {
    // 기본 등록 상품 확인
    const products = CatalogStore.getProducts();
    expect(products.length).toBeGreaterThanOrEqual(4);

    // 기본 등록 협력업체 확인
    const vendors = CatalogStore.getVendors();
    expect(vendors.length).toBeGreaterThanOrEqual(4);

    // 상품 토글 (넣었다 뺐다)
    const firstProd = products[0];
    const initialStatus = firstProd.enabled;
    const toggledStatus = CatalogStore.toggleProduct(firstProd.id);
    expect(toggledStatus).toBe(!initialStatus);

    // 다시 원복
    CatalogStore.toggleProduct(firstProd.id);

    // 협력업체 토글 (넣었다 뺐다)
    const firstVendor = vendors[0];
    const initialVenStatus = firstVendor.enabled;
    const toggledVenStatus = CatalogStore.toggleVendor(firstVendor.id);
    expect(toggledVenStatus).toBe(!initialVenStatus);

    // 다시 원복
    CatalogStore.toggleVendor(firstVendor.id);

    // 신규 협력업체 추가
    const newVen = CatalogStore.addVendor({
      name: '태극선생',
      specialty: '신살 및 풍수',
      vendorType: '상담사',
      contact: '010-1111-2222',
      commissionRate: '상담 80%',
      avatarUrl: '',
      enabled: true,
      rating: 5.0,
      consultationCount: 0,
      statusText: '신규',
    });
    expect(newVen.id).toBeDefined();

    // 신규 협력업체 삭제
    const delResult = CatalogStore.deleteVendor(newVen.id);
    expect(delResult).toBe(true);
  });
});

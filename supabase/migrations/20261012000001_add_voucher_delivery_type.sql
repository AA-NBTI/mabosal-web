-- products 테이블 delivery_type 제약조건에 voucher_code 추가
alter table public.products drop constraint if exists products_delivery_type_check;
alter table public.products add constraint products_delivery_type_check 
  check (delivery_type in ('digital_url','digital_download','consulting_booking','shipping','saju_report','voucher_code'));

-- 신규 상품권 상품 3종 INSERT
insert into public.products (
  id, title, category, price, original_price, tag_line, badge, description, delivery_type, target_signals, status, sales_count
) values
  (
    'prod-voucher-50k',
    '마보살 50,000원 VIP 사주 기프트 상품권',
    'voucher',
    50000,
    50000,
    '모든 사주 리포트와 1:1 상담까지 자유롭게 결제 가능한 VIP 모바일 바우처',
    '선물 1위',
    '가족, 친구, 연인에게 마음을 전할 수 있는 정식 마보살 모바일 상품권입니다. 결제 완료 즉시 16자리 바우처 고유 코드가 발급되며, 마보살 전 상품 주문 시 현금처럼 전액 차감 사용할 수 있습니다.',
    'voucher_code',
    array['general.gift', 'future.planning'],
    'active',
    42
  ),
  (
    'prod-voucher-30k',
    '마보살 30,000원 정통 사주 감정 상품권',
    'voucher',
    30000,
    30000,
    '신년운세, 재물운, 애정운 특화 리포트를 전액 결제할 수 있는 실속형 상품권',
    '인기 선물',
    '30,000원 상당의 마보살 감정 리포트를 자유롭게 이용할 수 있는 바우처입니다. 결제 즉시 발급 코드가 생성됩니다.',
    'voucher_code',
    array['general.gift'],
    'active',
    31
  ),
  (
    'prod-voucher-10k',
    '마보살 10,000원 모바일 기프트 쿠폰',
    'voucher',
    10000,
    10000,
    '모든 상품 주문 시 10,000원 즉시 할인받는 가벼운 선물용 쿠폰',
    '부담없는 선물',
    '가볍게 마음을 전하는 10,000원 상당의 모바일 할인 쿠폰입니다.',
    'voucher_code',
    array['general.gift'],
    'active',
    68
  )
on conflict (id) do nothing;

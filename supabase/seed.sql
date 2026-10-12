-- =====================================================================
-- 마보살 기본 시드 데이터 (상품 11종 & 기본 프로모션 쿠폰 4종)
-- =====================================================================

-- 기본 쿠폰 4종
insert into public.coupons (code, name, type, discount_amount, discount_rate, target_product, expiry_date, used_count, usage_limit, enabled)
values
  ('MABOSAL-FREE', '런칭 기념 무료 사주 진단서 100% 프리패스', 'free_pass', 19900, null, 'free_report', '2026-12-31', 142, 10000, true),
  ('TEMBA-VIP', '템바보드 주식회사 특별 30% 전품목 할인권', 'percent_discount', null, 30, 'all', '2026-12-31', 28, 500, true),
  ('YEAR-2027', '정묘년 신년 운세 & 사주풀이 10,000원 상품권', 'fixed_discount', 10000, null, 'paid_saju', '2027-02-28', 56, 1000, true),
  ('FORTUNE-40K', '정통 사주풀이 무통장 40,000원 입금 전용권', 'fixed_discount', 39900, null, 'paid_saju', '2026-12-31', 12, 200, true)
on conflict (code) do nothing;

-- 기본 상품 11종
insert into public.products (
  id, title, category, price, original_price, tag_line, badge, description, delivery_type, target_signals, status, sales_count
) values
  (
    'prod-paid-saju-premium',
    '마보살 정통 유료 사주풀이 (평생 대운 & 정밀 심층 감정서)',
    'report',
    39900,
    59000,
    '내 천명 본원과 10년 평생 대운, 현실 고민 3대 솔루션을 담은 마보살 최고급 맞춤 감정서',
    '대표 플래그십',
    '기본 무료 사주 분석 입구를 넘어, 일생의 흐름과 용희신, 재물·직업·애정 3대 테마, 마보살 비전 실천 개운법까지 전용 웹 뷰어 평생 열람과 PDF/TXT 소장본을 동시에 제공하는 정통 명리학 정밀 리포트입니다.',
    'saju_report',
    array['general.comprehensive', 'future.planning'],
    'active',
    148
  ),
  (
    'prod-free-saju-report',
    '마보살 정통 사주 진단서 (런칭 프로모션 무료 열람 쿠폰 제공)',
    'report',
    19900,
    19900,
    '기본 오행 분포와 용희신, 현실 고민 1순위 집중 진단',
    '인기 입문',
    '사주팔자의 기본 구조와 내 사주에 낀 마의 정체를 짚어내는 표준 진단서입니다. 런칭 기념 쿠폰(MABOSAL-FREE) 등록 시 100% 무료로 즉시 열람하실 수 있습니다.',
    'saju_report',
    array['general.basic'],
    'active',
    523
  ),
  (
    'prod-year2027-fortune',
    '2027년 정묘년(丁卯年) 신년 운세 비결서',
    'report',
    29000,
    45000,
    '다가오는 2027 정묘년 12개월 월별 천기 흐름과 삼재·대운 완벽 대비',
    '시즌 베스트',
    '정묘년의 천간 丁화와 지지 卯목이 나의 일간과 사주 원국에 미치는 영향을 월별로 세밀하게 짚어낸 신년 종합 운세서입니다.',
    'saju_report',
    array['year.2027', 'timing.change'],
    'active',
    89
  ),
  (
    'prod-wealth-secret-report',
    '평생 재물운 & 금전 손실 방어(파재살) 정밀 리포트',
    'report',
    35000,
    50000,
    '돈이 새는 원인 파재살 완벽 방비책과 인생 3대 황금 투자기 포착',
    '재물 특화',
    '사주 내 편재·정재와 비견·겁재의 충돌을 분석하여 재물이 모이는 시기와 손실이 발생하는 시점을 정확히 분석합니다.',
    'saju_report',
    array['money.loss', 'wealth.accumulation'],
    'active',
    64
  ),
  (
    'prod-career-success-report',
    '직업·이직·승진·사업운 정밀 감정서',
    'report',
    35000,
    50000,
    '이직 시점, 직장 스트레스 극복, 독립 창업 적기 심층 분석',
    '직업 특화',
    '관성과 인성의 조화를 통해 조직 생활에서의 승진운과 독립 창업 시 성공 가능성을 심층 감정합니다.',
    'saju_report',
    array['career.change', 'workplace.stress'],
    'active',
    47
  ),
  (
    'prod-love-marriage-report',
    '애정·궁합·재회 & 부부 갈등 해결 솔루션 리포트',
    'report',
    35000,
    50000,
    '인연의 끈, 애정 마살 극복, 재회 가능성과 최적의 만남 타이밍',
    '애정 특화',
    '도화살, 화개살 등 사주 내 애정 기운과 대운의 배합을 분석하여 연애와 결혼, 재회의 기운을 분석합니다.',
    'saju_report',
    array['love.conflict', 'love.reunion'],
    'active',
    52
  ),
  (
    'prod-health-defense-report',
    '오행 불균형 건강 체질 & 액운 방비 리포트',
    'report',
    29000,
    42000,
    '내 사주의 취약 장기와 기운 보강 개운 음식·환경 처방',
    '건강 특화',
    '목화토금수 오행의 태과와 불급으로 인한 체질적 취약점을 짚어내고 일상 개운법을 안내합니다.',
    'saju_report',
    array['health.vulnerability'],
    'active',
    31
  ),
  (
    'prod-ebook-saju-guide',
    '마보살 명리학 실전 독법 전자책 (PDF 소장판)',
    'ebook',
    22000,
    35000,
    '비전문가도 30분 만에 내 사주를 스스로 읽는 실전 명리 가이드북',
    '추천 전자책',
    '난해한 한자 용어를 쉬운 현대어로 재해석한 마보살 독자 개발 명리 해설서입니다.',
    'digital_download',
    array['study.learning'],
    'active',
    95
  ),
  (
    'prod-lecture-vod-master',
    '마보살 명리 개운학 온라인 마스터 클래스 (전 8강 VOD)',
    'lecture',
    79000,
    120000,
    '운명의 파도를 타고 위기를 기회로 바꾸는 실전 개운 비법 영상 강좌',
    '온라인 강좌',
    '사주를 통해 내 인생의 타이밍을 읽고 실전에서 액운을 피하는 방법을 담은 프리미엄 온라인 강좌입니다.',
    'digital_url',
    array['study.lecture'],
    'active',
    38
  ),
  (
    'prod-consulting-1on1-ticket',
    '마보살 전문 명리 상담사 1:1 심층 상담권 (30분 전화/채팅)',
    'consulting',
    60000,
    80000,
    '검증된 정통 명리 상담사와의 1:1 비공개 심층 프라이빗 상담 예약권',
    '1:1 전문상담',
    '혼자 끙끙 앓던 고민을 전문 상담사와 1:1로 직접 나누고 명쾌한 해결책을 찾는 실시간 상담 티켓입니다.',
    'consulting_booking',
    array['consulting.deep'],
    'active',
    112
  ),
  (
    'prod-goods-talisman-wealth',
    '마보살 비전 황금 재물부적 (정통 수제 경면주사 호신 부적)',
    'goods',
    45000,
    65000,
    '지갑과 스마트폰 케이스에 소장하는 액운 차단 및 재물 유입 호신 부적',
    '프리미엄 굿즈',
    '사주의 부족한 기운을 보완하고 파재살을 막아주는 마보살 비전 수제 전통 호신 부적입니다.',
    'shipping',
    array['money.loss', 'protection.talisman'],
    'active',
    73
  )
on conflict (id) do nothing;

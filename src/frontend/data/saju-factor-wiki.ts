/**
 * 사주 명리 인과 요인 위키 백과 사전 (SAJU_FACTOR_WIKI_DB)
 * 
 * 대운·세운·월운에서 발생하는 상충마살(충·형·파·해·원진), 신살, 십신, 12운성, 용신 등의
 * 명리적 정의, 유래, 작용 원리, 길흉 해석, 실전 대처 가이드를 집대성한 데이터베이스
 */

export interface SajuFactorWikiItem {
  id: string;
  name: string;
  hanja: string;
  category: '충(沖)' | '형(刑)' | '파(破)' | '해(害)' | '원진(怨嗔)' | '신살(神煞)' | '십신(十神)' | '12운성' | '용희기구한';
  nature: '악재(하강)' | '호재(상승)' | '중립(변화·조정)';
  badgeColor: string;
  summary: string;
  mechanism: string;
  lifeImpact: {
    career: string;
    wealth: string;
    relationship: string;
    health: string;
  };
  strategy: string;
  studySlug?: string;
}

export const SAJU_FACTOR_WIKI_DB: Record<string, SajuFactorWikiItem> = {
  // 1. 충(沖) 계열
  '자오충': {
    id: 'ja-o-chung',
    name: '자오충',
    hanja: '子午沖',
    category: '충(沖)',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '한겨울 차가운 물(子水)과 한여름 뜨거운 불(午火)의 정면 충돌. 감정 기복과 급격한 환경 변화를 유발합니다.',
    mechanism: '수화상충(水火相沖)이자 제왕(帝旺)끼리의 충돌로 에너지가 극도로 강력합니다. 안정된 일상에 갑작스러운 변동성이 유입됩니다.',
    lifeImpact: {
      career: '직장 이동, 부서 이동, 해외 발령, 갑작스러운 이직 충동이 강해집니다.',
      wealth: '충동적인 투자 손실 주의. 현금 유동성을 보수적으로 관리해야 합니다.',
      relationship: '배우자 및 연인 간 사소한 언쟁이 큰 마찰로 번질 수 있습니다.',
      health: '심혈관계, 신장/방광, 시력 및 혈압 관리에 각별히 유의해야 합니다.',
    },
    strategy: '감정이 격해질 때 중요한 계약이나 결정을 미루고, 이사나 출장 등 합법적인 물리적 이동으로 충의 기운을 분산(물상대체)시키세요.',
    studySlug: 'saju-chung-theory',
  },
  '묘유충': {
    id: 'myo-yu-chung',
    name: '묘유충',
    hanja: '卯酉沖',
    category: '충(沖)',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '봄의 여린 풀(卯木)과 가을의 날카로운 칼(酉金)의 충돌. 신체 상해, 칼/쇠붙이 사고, 결별을 주의합니다.',
    mechanism: '금목상쟁(金木相爭)으로 가을의 쇠가 봄의 싹을 자르는 형국입니다. 신경 과민과 인간관계 단절이 일어나기 쉽습니다.',
    lifeImpact: {
      career: '기존 거래처와의 계약 파기, 동료와의 냉랭한 대립이 발생할 수 있습니다.',
      wealth: '부동산이나 고정 자산 매매 시 문서 오류로 인한 손실 주의.',
      relationship: '냉정하고 날카로운 말 한마디로 오랜 인연이 끊어질 위험이 큽니다.',
      health: '간담 질환, 뼈/관절, 디스크, 피부 상처 및 교통사고 주의.',
    },
    strategy: '헌혈, 침술, 수술 등 인위적으로 피를 보거나 쇠를 다루는 일로 액땜(물상대체)하고, 언행을 부드럽게 유지하세요.',
    studySlug: 'saju-chung-theory',
  },
  '인신충': {
    id: 'in-shin-chung',
    name: '인신충',
    hanja: '寅申沖',
    category: '충(沖)',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '호랑이(寅木)와 원숭이(申金)의 충돌. 생지(生地) 역마의 충돌로 교통사고와 맹렬한 질주 속 좌절을 경계합니다.',
    mechanism: '새로운 시작을 주관하는 생지끼리의 부딪힘으로, 성급한 추진이 오히려 브레이크 없는 사고로 이어질 수 있습니다.',
    lifeImpact: {
      career: '출장, 파견, 이직이 빈번해지며, 윗사람과의 의견 충돌이 잦아집니다.',
      wealth: '무리한 사업 확장이나 빚을 낸 레버리지 투자가 위험합니다.',
      relationship: '각자의 길을 가려는 성향이 강해져 가족 간 소통이 뜸해질 수 있습니다.',
      health: '사지마비, 뇌혈관, 신경통, 운전 중 사고 유의.',
    },
    strategy: '안전운전이 최우선이며, 새로운 일을 시작할 때는 꼼꼼한 더블 체크와 전문가 검증을 필히 거치세요.',
    studySlug: 'saju-chung-theory',
  },
  '사해충': {
    id: 'sa-hae-chung',
    name: '사해충',
    hanja: '巳亥沖',
    category: '충(沖)',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '뱀(巳火)과 돼지(亥水)의 충돌. 풍파와 마음의 불안, 쓸데없는 걱정과 신경 쇠약을 유발합니다.',
    mechanism: '생지의 수화상충으로 보이지 않는 음습한 기운과 폭발적인 불꽃이 부딪혀 정신적 혼란과 변덕이 커집니다.',
    lifeImpact: {
      career: '직장 내 정치적 갈등에 휘말릴 수 있으니 중립을 지켜야 합니다.',
      wealth: '사기수 주의, 지인의 달콤한 유혹에 넘어가지 마세요.',
      relationship: '의심과 불신으로 인해 돈독하던 관계에 금이 갈 수 있습니다.',
      health: '소화기 계통, 심장 두근거림, 불면증, 우울감 케어 필요.',
    },
    strategy: '명상, 호흡, 자연 산책으로 마인드 컨트롤을 하고, 비밀스러운 사적 거래를 피하고 모든 일을 공문화하세요.',
    studySlug: 'saju-chung-theory',
  },
  '진술충': {
    id: 'jin-sul-chung',
    name: '진술충',
    hanja: '辰戌沖',
    category: '충(沖)',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '봄의 흙(辰土)과 가을의 흙(戌土)의 붕충(朋沖). 부동산, 가문, 상속 분쟁과 위장 질환을 부릅니다.',
    mechanism: '묘고(墓庫)의 충돌로 지장간(지하 창고) 속의 글자들이 튀어나와 복잡한 이해관계가 뒤얽힙니다.',
    lifeImpact: {
      career: '기존의 기반을 뒤흔드는 조직 개편이나 사업장 이전이 발생합니다.',
      wealth: '부동산 경매, 토지 매매 분쟁, 상속세 관련 마찰 주의.',
      relationship: '가족 및 친인척 간의 오랜 앙금이 표면화될 수 있습니다.',
      health: '위장, 비장, 복부 질환, 당뇨, 소화불량 주의.',
    },
    strategy: '법률 및 세무 전문가의 자문을 철저히 구하고, 서류상의 권리관계를 명확히 매듭지으세요.',
    studySlug: 'saju-chung-theory',
  },
  '축미충': {
    id: 'chuk-mi-chung',
    name: '축미충',
    hanja: '丑未沖',
    category: '충(沖)',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '겨울의 언 흙(丑土)과 여름의 메마른 흙(未土)의 충돌. 고집과 집착으로 인한 손실과 형제 불화를 뜻합니다.',
    mechanism: '지장간 속의 辛金과 乙木, 癸水와 丁火가 동시에 깨지며 내면의 갈등이 극에 달합니다.',
    lifeImpact: {
      career: '협상 결렬, 파트너십 와해, 동업자와의 결별 위험.',
      wealth: '금전 대여 금지, 떼인 돈으로 인한 소송 가능성.',
      relationship: '서로 한 치도 양보하지 않는 자존심 대결로 파국에 이를 수 있습니다.',
      health: '허리, 척추, 관절염, 피부 건조증 및 순환기 장애.',
    },
    strategy: '유연한 태도로 한 걸음 양보하는 미덕이 액운을 막아줍니다. 정기 건강검진을 추천합니다.',
    studySlug: 'saju-chung-theory',
  },

  // 2. 형(刑) 계열
  '인사신': {
    id: 'in-sa-shin',
    name: '인사신 삼형살',
    hanja: '寅巳申 三刑',
    category: '형(刑)',
    nature: '악재(하강)',
    badgeColor: '#ef4444',
    summary: '무은지형(無恩之刑). 은혜를 원수로 갚는 배신, 권력 투쟁, 사법 관재구설과 수술수를 뜻합니다.',
    mechanism: '생지의 세 글자가 모여 맹렬한 화기와 금기가 부딪히며 칼을 휘두르는 형상입니다.',
    lifeImpact: {
      career: '법적 분쟁, 관공서 감사, 경찰/검찰 조사 등 관재구설 주의.',
      wealth: '벌금, 과태료, 소송 비용 지출 위험.',
      relationship: '믿었던 동료나 후배에게 배신을 당할 수 있으니 보안 철저.',
      health: '외과적 수술, 골절, 화재, 기계 끼임 사고 주의.',
    },
    strategy: '권력기관(군·경·검·의료·법조)에 종사하거나 물상대체로 기부, 봉사, 헌혈을 적극 실천하세요.',
    studySlug: 'saju-hyeong-theory',
  },
  '축술미': {
    id: 'chuk-sul-mi',
    name: '축술미 삼형살',
    hanja: '丑戌未 三刑',
    category: '형(刑)',
    nature: '악재(하강)',
    badgeColor: '#ef4444',
    summary: '지세지형(持勢之刑). 자신의 힘을 과신하다가 큰 코 다치고 재산과 건강을 잃는 흉살입니다.',
    mechanism: '토(土)의 기운이 극도로 팽창하여 매금(埋金)과 토다목절(土多木折)을 유발합니다.',
    lifeImpact: {
      career: '오만한 태도로 인한 구설수, 동업 파탄, 프로젝트 중단.',
      wealth: '무리한 투자로 자금이 묶여 부도 위기 봉착.',
      relationship: '친한 지인과의 재물 거래로 의리가 상함.',
      health: '암, 종양, 위암, 췌장, 복강 내 질환 주의.',
    },
    strategy: '겸손을 좌우명으로 삼고, 모든 결정에서 자만심을 버리고 낮은 자세로 임하세요.',
    studySlug: 'saju-hyeong-theory',
  },
  '자묘형': {
    id: 'ja-myo-hyeong',
    name: '자묘형',
    hanja: '子卯刑',
    category: '형(刑)',
    nature: '악재(하강)',
    badgeColor: '#ef4444',
    summary: '무례지형(無禮之刑). 예의가 없고 도덕관념이 흔들리며, 이성 스캔들과 성적 구설에 휘말릴 수 있습니다.',
    mechanism: '수생목이 원활하지 않고 썩은 물이 나무를 상하게 하는 형국입니다.',
    lifeImpact: {
      career: '사내 성희롱 구설, 도덕적 해이로 인한 징계 주의.',
      wealth: '유흥비 지출 과다, 이성 관련 합의금 손실.',
      relationship: '불륜, 삼각관계, 부적절한 만남으로 명예 실추.',
      health: '비뇨기과, 생식기 질환, 자궁, 전립선 질환 주의.',
    },
    strategy: '공과 사를 명확히 구분하고, 주색잡기를 멀리하며 정도(正道)를 지키세요.',
    studySlug: 'saju-hyeong-theory',
  },

  // 3. 해(害) & 원진(怨嗔)
  '원진': {
    id: 'won-jin',
    name: '원진살',
    hanja: '怨嗔煞',
    category: '원진(怨嗔)',
    nature: '악재(하강)',
    badgeColor: '#f97316',
    summary: '서로 미워하고 원망하면서도 헤어지지 못하는 애증의 살. 불평불만과 우울증을 유발합니다.',
    mechanism: '오행의 음양이 삐딱하게 틀어져 서로를 바라보며 으르렁거리는 에너지의 왜곡입니다.',
    lifeImpact: {
      career: '직장 상사나 동료와의 묘한 신경전, 보이지 않는 따돌림.',
      wealth: '돈거래 후 서로 욕하며 끝나는 손실.',
      relationship: '부부 간 권태기, 정나미 떨어짐, 잔소리와 원망 폭발.',
      health: '신경 쇠약, 불면증, 가슴 답답함, 화병.',
    },
    strategy: '물리적 거리를 두고 각자의 취미 생활을 가지며, 상대방을 바꾸려 하지 말고 인정하세요.',
    studySlug: 'saju-wonjin-theory',
  },
  '자미원진': {
    id: 'ja-mi-wonjin',
    name: '자미원진',
    hanja: '子未怨嗔',
    category: '원진(怨嗔)',
    nature: '악재(하강)',
    badgeColor: '#f97316',
    summary: '쥐와 양의 원진. 물과 흙이 만나 흙탕물이 되는 격으로 서로를 더럽히고 원망합니다.',
    mechanism: '원진과 해(害)가 겹치는 자리로 부모·자식 간, 부부 간 애증이 심해집니다.',
    lifeImpact: {
      career: '사소한 오해로 인한 프로젝트 지연.',
      wealth: '계약 지연 및 자금 회수 난항.',
      relationship: '배우자와의 성격 차이 심화.',
      health: '신장, 방광, 위장 계통 질환.',
    },
    strategy: '감정 표현을 서면이나 메신저로 정제하여 전달하고 직접적인 충돌을 피하세요.',
    studySlug: 'saju-wonjin-theory',
  },

  // 4. 주요 신살(神煞)
  '천을귀인': {
    id: 'cheon-eul-gwi-in',
    name: '천을귀인',
    hanja: '天乙貴人',
    category: '신살(神煞)',
    nature: '호재(상승)',
    badgeColor: '#38bdf8',
    summary: '사주 최고의 길신(吉神). 흉을 길로 바꾸고, 막다른 골목에서 귀인이 나타나 구원해줍니다.',
    mechanism: '하늘의 존귀한 기운으로 어떤 흉살도 힘을 쓰지 못하게 정화하는 절대적인 복록입니다.',
    lifeImpact: {
      career: '유력자의 발탁, 승진, 취업, 시험 합격, 명예 상승.',
      wealth: '뜻밖의 상속, 투자 성공, 자금난 해결.',
      relationship: '훌륭한 멘토, 평생의 은인, 훌륭한 배우자와의 만남.',
      health: '중병에 걸려도 명의를 만나 완치되는 행운.',
    },
    strategy: '귀인이 손을 내밀 때 적극적으로 응하고, 스스로도 타인에게 베풀어 복덕을 쌓으세요.',
    studySlug: 'saju-noble-spirits',
  },
  '역마살': {
    id: 'yeok-ma-sal',
    name: '역마살',
    hanja: '驛馬煞',
    category: '신살(神煞)',
    nature: '중립(변화·조정)',
    badgeColor: '#60a5fa',
    summary: '말을 타고 세상을 누비는 기운. 공간 이동, 출장, 유학, 해외 진출, 이사, 변동의 상징.',
    mechanism: '인신사해(寅申巳亥) 생지의 활발한 운동성으로 가만히 머물면 답답하고 뛰쳐나가야 풀립니다.',
    lifeImpact: {
      career: '해외 파견, 무역, 물류, 마케팅, 출장 업무의 확장.',
      wealth: '발로 뛰는 만큼 재물이 들어오며 타향에서 성공.',
      relationship: '장거리 연애(롱디), 주말부부, 잦은 이별과 만남.',
      health: '과로, 다리 부상, 이동 중 사고 주의.',
    },
    strategy: '앉아서 고민하지 말고 적극적으로 외부 활동, 출장, 여행을 통해 기운을 순환시키세요.',
    studySlug: 'saju-sinsal-core',
  },
  '도화살': {
    id: 'do-hwa-sal',
    name: '도화살',
    hanja: '桃花煞',
    category: '신살(神煞)',
    nature: '호재(상승)',
    badgeColor: '#ec4899',
    summary: '복숭아꽃의 매혹적인 향기. 대중의 시선을 사로잡는 인기, 매력, 예술성, 끼의 발현.',
    mechanism: '자오묘유(子午卯酉) 왕지의 극치로 사람의 마음을 끄는 강력한 흡인력을 발생시킵니다.',
    lifeImpact: {
      career: '연예, 방송, 영업, 강사, 브랜딩, 크리에이터 분야의 대성.',
      wealth: '팬덤과 대중의 지지를 바탕으로 재물 창출.',
      relationship: '이성의 구애가 끊이지 않음. 삼각관계 유혹 주의.',
      health: '유흥으로 인한 체력 저하 및 피부 트러블.',
    },
    strategy: '사적 이성 유혹은 차단하고, 자신의 공적인 매력과 재능으로 승화시켜 퍼스널 브랜딩을 강화하세요.',
    studySlug: 'saju-sinsal-core',
  },
  '화개살': {
    id: 'hwa-gae-sal',
    name: '화개살',
    hanja: '華蓋煞',
    category: '신살(神煞)',
    nature: '중립(변화·조정)',
    badgeColor: '#a855f7',
    summary: '빛나는 덮개. 학문, 종교, 철학, 예술, 고독과 재생(재도전)을 상징하는 지혜의 별.',
    mechanism: '진술축미(辰戌丑未) 묘고지의 기운으로 과거를 정리하고 내면의 정신세계를 깊게 파고듭니다.',
    lifeImpact: {
      career: '연구직, 전문직, 종교인, 예술가, 사색가로서의 두각.',
      wealth: '부동산이나 지식재산권, 특허를 통한 안정적 자산 형성.',
      relationship: '고독을 즐기게 되어 혼자만의 시간이 절실해짐.',
      health: '우울감, 외로움, 정신건강 관리 필요.',
    },
    strategy: '자격증 취득, 학위 공부, 창작 활동에 몰입하면 엄청난 명예와 성과를 얻을 수 있습니다.',
    studySlug: 'saju-sinsal-core',
  },
  '공망': {
    id: 'gong-mang',
    name: '공망',
    hanja: '空亡',
    category: '신살(神煞)',
    nature: '악재(하강)',
    badgeColor: '#94a3b8',
    summary: '비어 있고 망했다는 뜻. 현실적 세속적 욕망은 허무해지나, 정신적·영적 세계는 크게 열립니다.',
    mechanism: '십간과 십이지의 결합 중 짝을 찾지 못하고 남은 두 글자로, 기운이 텅 비어 있는 진공 상태입니다.',
    lifeImpact: {
      career: '열심히 노력해도 공이 남에게 돌아가거나 계약이 미완성됨.',
      wealth: '밑 빠진 독에 물 붓기. 큰 투자는 무조건 보류해야 함.',
      relationship: '인연이 맺어져도 허전함이 남고 겉도는 느낌.',
      health: '기력 쇠진, 만성 피로, 허무주의 경계.',
    },
    strategy: '세속적인 성취 욕심을 내려놓고, 학문·공부·봉사·예술·마음 수양의 시간으로 삼으세요.',
    studySlug: 'saju-gongmang-theory',
  },

  // 5. 12운성(十二運星)
  '제왕': {
    id: 'je-wang',
    name: '제왕',
    hanja: '帝旺',
    category: '12운성',
    nature: '호재(상승)',
    badgeColor: '#38bdf8',
    summary: '생애 에너지의 정점. 황제의 자리에 올라 모든 것을 호령하는 최고의 추진력과 권력.',
    mechanism: '양기가 극에 달한 상태로 독단적인 독주만 경계하면 천하를 얻을 수 있는 시기입니다.',
    lifeImpact: {
      career: '리더 승진, 조직 총괄, 창업 성공, 업계 1위 도약.',
      wealth: '최대의 매출 달성, 과감한 투자 성공.',
      relationship: '자신의 주장이 너무 강해 배우자나 동료가 위축될 수 있음.',
      health: '혈압, 화병, 뇌졸중 등 상기(上氣) 질환 주의.',
    },
    strategy: '겸손과 포용력을 발휘하여 부하직원과 동료를 챙기면 장기 집권의 기틀이 마련됩니다.',
    studySlug: 'saju-12stages',
  },
  '건록': {
    id: 'geon-rok',
    name: '건록',
    hanja: '建祿',
    category: '12운성',
    nature: '호재(상승)',
    badgeColor: '#34d399',
    summary: '스스로 자립하여 녹봉(월급·소득)을 받는 시기. 가장 안정적이고 건강한 자수성가의 별.',
    mechanism: '사회적으로 왕성하게 활동하는 청장년기의 에너지로 정직한 땀방울이 반드시 결실을 맺습니다.',
    lifeImpact: {
      career: '안정적인 직장 확보, 정규직 전환, 전문직 안착.',
      wealth: '꾸준하고 탄탄한 현금 흐름 창출, 내 집 마련.',
      relationship: '신뢰할 수 있는 좋은 배우자와의 혼담 성사.',
      health: '체력이 매우 양호하고 왕성한 면역력.',
    },
    strategy: '착실하게 커리어를 쌓고 정석적인 투자를 통해 평생의 자산 기초를 완성하세요.',
    studySlug: 'saju-12stages',
  },
  '절': {
    id: 'jeol',
    name: '절',
    hanja: '絶',
    category: '12운성',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '완전한 단절과 소멸. 과거의 형태가 사라지고 바닥을 찍었으나, 새 생명이 잉태되는 전환점.',
    mechanism: '기존의 기운이 0으로 수렴하여 더 이상 내려갈 곳이 없는 극점(바닥)입니다.',
    lifeImpact: {
      career: '퇴사, 폐업, 기존 업무 중단, 완전한 리셋.',
      wealth: '현금 고갈 주의. 극도의 긴축 재정 필요.',
      relationship: '인간관계의 정리, 오랜 악연과의 이별.',
      health: '체력 고갈, 면역력 저하, 휴식 절대 필요.',
    },
    strategy: '무리하게 버티지 말고 내려놓으세요. 비워야 새로운 대운과 세운의 기운이 채워집니다.',
    studySlug: 'saju-12stages',
  },
  '묘': {
    id: 'myo-stage',
    name: '묘',
    hanja: '墓',
    category: '12운성',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '무덤 속에 묻히는 기운. 활동성이 위축되고 창고에 갇히지만 자산을 축적하는 비밀의 힘.',
    mechanism: '에너지가 내부로 깊숙이 숨어들어 밖으로 표출되지 못하는 상태입니다.',
    lifeImpact: {
      career: '외부 활동 제약, 내근직 전환, 답답한 정체기.',
      wealth: '돈을 쓰지 않고 모아두는 저축에는 매우 유리.',
      relationship: '마음을 닫고 소통을 거부하기 쉬움.',
      health: '입원, 요양, 만성 질환 관리 필요.',
    },
    strategy: '밖으로 나서지 말고 내부 역량을 다지고 알짜 자산을 비축하는 기회로 활용하세요.',
    studySlug: 'saju-12stages',
  },

  // 6. 십신(十神)
  '편관': {
    id: 'pyeon-gwan',
    name: '편관 (칠살)',
    hanja: '偏官 (七殺)',
    category: '십신(十神)',
    nature: '악재(하강)',
    badgeColor: '#ef4444',
    summary: '나를 가차없이 공격하는 칼날. 극심한 스트레스, 과중한 책임감, 그러나 극복 시 최고의 권력.',
    mechanism: '일간을 무자비하게 극하는 오행으로 질병, 사고, 압박감으로 다가옵니다.',
    lifeImpact: {
      career: '극심한 업무 과중, 까다로운 상사, 구조조정 압박.',
      wealth: '예기치 못한 손실, 세무 조사, 관재구설.',
      relationship: '여명의 경우 폭력적이거나 부담스러운 남성 인연 주의.',
      health: '급성 질환, 혈압, 두통, 사고수.',
    },
    strategy: '식신제살(기술·지혜로 제압)하거나 살인상생(공부·학문으로 소화)하여 위기를 권력으로 바꾸세요.',
    studySlug: 'saju-10gods-core',
  },
  '정재': {
    id: 'jeong-jae',
    name: '정재',
    hanja: '正財',
    category: '십신(十神)',
    nature: '호재(상승)',
    badgeColor: '#34d399',
    summary: '정당한 대가로 얻는 소중한 재물. 성실함, 저축, 안정된 월급, 남명에게는 현명한 아내.',
    mechanism: '내가 극하여 내 것으로 취하는 음양의 조화로운 재물로 위험성이 없습니다.',
    lifeImpact: {
      career: '급여 인상, 보너스 수령, 안정적인 고용 유지.',
      wealth: '안전 자산 증가, 알뜰한 적금 만기, 자산 증식.',
      relationship: '남명의 경우 가정적인 아내와의 행복한 결혼 생활.',
      health: '안정적인 신체 리듬과 편안한 정신 상태.',
    },
    strategy: '티끌 모아 태산을 이루듯 낭비를 줄이고 복리 투자의 마법을 누리세요.',
    studySlug: 'saju-10gods-core',
  },
  '식신': {
    id: 'sik-shin',
    name: '식신',
    hanja: '食神',
    category: '십신(十神)',
    nature: '호재(상승)',
    badgeColor: '#38bdf8',
    summary: '수복(壽福)의 별. 의식주가 풍족하고, 창의력과 표현력이 폭발하며 질병을 물리칩니다.',
    mechanism: '내가 기쁘게 생조하는 기운으로 편관(칠살)을 물리치는 최고의 호위무사입니다.',
    lifeImpact: {
      career: '새로운 기술 개발, 특허, 예술 창작, 요리/연구 성공.',
      wealth: '식상생재로 자연스럽게 돈이 따라오는 선순환.',
      relationship: '베풀기 좋아하여 주변에 사람이 모이고 후배 양성.',
      health: '식욕 왕성, 장수, 질병 완치, 낙천적 마음가짐.',
    },
    strategy: '자신만의 특기나 재능을 마음껏 표현하고 세상에 알리세요. 반드시 부와 명예가 따릅니다.',
    studySlug: 'saju-10gods-core',
  },
  '상관': {
    id: 'sang-gwan',
    name: '상관',
    hanja: '傷官',
    category: '십신(十神)',
    nature: '중립(변화·조정)',
    badgeColor: '#f59e0b',
    summary: '기존의 규율을 깨뜨리는 천재성. 언변과 임기응변이 뛰어나나 관성(상사·법)을 상하게 합니다.',
    mechanism: '일간의 설기가 심하고 정관을 직접 극하여 반항심과 개혁 성향이 강해집니다.',
    lifeImpact: {
      career: '상사와의 불화, 이직, 퇴사 충동, 그러나 프리랜서/예술로 대성.',
      wealth: '아이디어 하나로 대박을 터뜨리는 파격적 수익.',
      relationship: '말실수로 인한 구설수, 배우자에 대한 잔소리와 비판.',
      health: '호흡기, 기관지 질환 및 과민성 스트레스.',
    },
    strategy: '비판의 칼날을 타인에게 겨누지 말고 자신의 작품이나 비즈니스 혁신으로 돌리세요.',
    studySlug: 'saju-10gods-core',
  },
  '육해살': {
    id: 'yuk-hae-sal',
    name: '육해살 (해·害)',
    hanja: '六害殺',
    category: '해(害)',
    nature: '악재(하강)',
    badgeColor: '#f87171',
    summary: '육친 간의 불화, 은혜를 원수로 갚는 배신, 예상치 못한 방해와 마찰을 암시하는 신살.',
    mechanism: '지지 간의 생합을 방해하고 극(剋)하는 6가지 해(害) 작용(축오해, 자미해, 인사해, 묘진해, 신해해, 유술해)으로 인해 심리적 갈등과 일의 지연이 발생합니다.',
    lifeImpact: {
      career: '동료나 동업자와의 갈등, 공든 탑이 남의 실수로 흔들림.',
      wealth: '예기치 못한 지출, 보증이나 차용 거래로 인한 손실 주의.',
      relationship: '가까운 사람과의 오해와 언쟁, 감정 소모 급증.',
      health: '신경성 스트레스, 소화기 및 관절 계통 주의.',
    },
    strategy: '감정적인 대립을 피하고 서류와 계약을 철저히 점검하세요. 중요한 결정은 한 박자 늦추어 진행하는 것이 좋습니다.',
    studySlug: 'saju-yukhae-master',
  },
  '파살': {
    id: 'pa-sal',
    name: '파살 (파·破)',
    hanja: '破殺',
    category: '파(破)',
    nature: '악재(하강)',
    badgeColor: '#fb923c',
    summary: '기존의 질서나 틀이 깨지고 분열되며 새로운 변화를 강요받는 궤도 이탈 작용.',
    mechanism: '지지의 기운이 부딪혀 금이 가고 분열되는 작용으로, 안정된 형태가 흐트러질 수 있습니다.',
    lifeImpact: {
      career: '조직 개편, 업무 변경, 계획의 수정.',
      wealth: '기존 투자처 정리, 자산의 재분배.',
      relationship: '인간관계의 정리 및 새로운 만남의 계기.',
      health: '피로 누적, 안전사고 유의.',
    },
    strategy: '파(破)는 파괴이자 새로운 탄생의 시작입니다. 낡은 것을 과감히 정리하고 새 판을 짜세요.',
    studySlug: 'saju-pa-master',
  },
  '양인살': {
    id: 'yang-in-sal',
    name: '양인살',
    hanja: '羊刃殺',
    category: '신살(神煞)',
    nature: '중립(변화·조정)',
    badgeColor: '#ef4444',
    summary: '칼을 쥐고 있는 듯한 극도의 강한 기운. 큰 권력을 쥐거나 극단적 성패를 가르는 양날의 검.',
    mechanism: '일간의 기운이 극에 달하여 타협을 모르는 강한 추진력과 독단성이 발현됩니다.',
    lifeImpact: {
      career: '강력한 리더십, 전문직·군경·의료 분야에서 두각.',
      wealth: '공격적 투자로 일확천금 또는 극심한 손실의 양극단.',
      relationship: '배우자나 파트너에게 강압적인 태도로 인한 마찰.',
      health: '외상, 수술수, 혈압 관리 유의.',
    },
    strategy: '자신의 강력한 에너지를 전문 분야나 연구에 집중하고, 사람들과의 관계에서는 부드러운 양보를 실천하세요.',
    studySlug: 'saju-yangin-master',
  },
  '용신': {
    id: 'yong-shin',
    name: '용신 유입',
    hanja: '用神',
    category: '용희기구한',
    nature: '호재(상승)',
    badgeColor: '#38bdf8',
    summary: '사주의 조화와 균형을 맞추는 핵심 열쇠. 인생 최고의 전성기와 발복(發福)의 기회.',
    mechanism: '사주의 억부, 조후, 통관을 일거에 해결하는 최적의 오행이 유입되어 운명이 피어납니다.',
    lifeImpact: {
      career: '원하던 승진, 취업, 사업 번창, 최고의 사회적 성취.',
      wealth: '막혔던 자금줄이 터지고 큰 재물을 거머쥠.',
      relationship: '귀인의 전폭적인 지원과 최고의 조력자 만남.',
      health: '지병 완치, 활력과 생기가 넘쳐남.',
    },
    strategy: '인생의 골든타임입니다. 주저하지 말고 가장 큰 목표를 향해 과감히 승부수를 던지세요!',
    studySlug: 'saju-yongshin-master',
  },
};

/**
 * 텍스트나 요인 명칭에서 매칭되는 위키 아이템 검색 헬퍼
 */
export function findSajuFactorWiki(rawFactorName: string): SajuFactorWikiItem | null {
  if (!rawFactorName) return null;
  const clean = rawFactorName.trim();

  // 1. 직접 일치
  if (SAJU_FACTOR_WIKI_DB[clean]) {
    return SAJU_FACTOR_WIKI_DB[clean];
  }

  // 2. 키워드 부분 일치 검색
  for (const [key, item] of Object.entries(SAJU_FACTOR_WIKI_DB)) {
    if (clean.includes(key) || key.includes(clean)) {
      return item;
    }
  }

  // 3. 카테고리별 패턴 검색 (충, 형, 파, 해, 원진, 공망, 귀문 등)
  if (clean.includes('충') || clean.includes('상충')) {
    if (clean.includes('자오')) return SAJU_FACTOR_WIKI_DB['자오충'];
    if (clean.includes('묘유')) return SAJU_FACTOR_WIKI_DB['묘유충'];
    if (clean.includes('인신')) return SAJU_FACTOR_WIKI_DB['인신충'];
    if (clean.includes('사해')) return SAJU_FACTOR_WIKI_DB['사해충'];
    if (clean.includes('진술')) return SAJU_FACTOR_WIKI_DB['진술충'];
    if (clean.includes('축미')) return SAJU_FACTOR_WIKI_DB['축미충'];
    return SAJU_FACTOR_WIKI_DB['자오충'];
  }
  if (clean.includes('형') || clean.includes('삼형')) {
    if (clean.includes('인사신')) return SAJU_FACTOR_WIKI_DB['인사신'];
    if (clean.includes('축술미')) return SAJU_FACTOR_WIKI_DB['축술미'];
    if (clean.includes('자묘')) return SAJU_FACTOR_WIKI_DB['자묘형'];
    return SAJU_FACTOR_WIKI_DB['인사신'];
  }
  if (clean.includes('해') || clean.includes('육해') || clean.includes('축오해') || clean.includes('자미해')) {
    return SAJU_FACTOR_WIKI_DB['육해살'];
  }
  if (clean.includes('파') || clean.includes('파살')) {
    return SAJU_FACTOR_WIKI_DB['파살'];
  }
  if (clean.includes('양인')) return SAJU_FACTOR_WIKI_DB['양인살'];
  if (clean.includes('원진')) {
    if (clean.includes('자미')) return SAJU_FACTOR_WIKI_DB['자미원진'];
    return SAJU_FACTOR_WIKI_DB['원진'];
  }
  if (clean.includes('공망')) return SAJU_FACTOR_WIKI_DB['공망'];
  if (clean.includes('역마')) return SAJU_FACTOR_WIKI_DB['역마살'];
  if (clean.includes('도화')) return SAJU_FACTOR_WIKI_DB['도화살'];
  if (clean.includes('화개')) return SAJU_FACTOR_WIKI_DB['화개살'];
  if (clean.includes('귀인') || clean.includes('천을')) return SAJU_FACTOR_WIKI_DB['천을귀인'];
  if (clean.includes('제왕')) return SAJU_FACTOR_WIKI_DB['제왕'];
  if (clean.includes('건록') || clean.includes('록')) return SAJU_FACTOR_WIKI_DB['건록'];
  if (clean.includes('절')) return SAJU_FACTOR_WIKI_DB['절'];
  if (clean.includes('묘') && !clean.includes('묘유')) return SAJU_FACTOR_WIKI_DB['묘'];
  if (clean.includes('편관') || clean.includes('칠살')) return SAJU_FACTOR_WIKI_DB['편관'];
  if (clean.includes('정재')) return SAJU_FACTOR_WIKI_DB['정재'];
  if (clean.includes('식신')) return SAJU_FACTOR_WIKI_DB['식신'];
  if (clean.includes('상관')) return SAJU_FACTOR_WIKI_DB['상관'];
  if (clean.includes('용신') || clean.includes('희신')) return SAJU_FACTOR_WIKI_DB['용신'];

  // 4. 유연한 동적 위키 항목 생성 (어떤 명칭이 들어와도 위키 화면이 완벽하게 연결되도록 보장)
  return {
    id: `custom-${clean}`,
    name: clean,
    hanja: '命理因果',
    category: '신살(神煞)',
    nature: clean.includes('기신') || clean.includes('상충') || clean.includes('살') ? '악재(하강)' : '호재(상승)',
    badgeColor: clean.includes('기신') || clean.includes('상충') || clean.includes('살') ? '#f87171' : '#38bdf8',
    summary: `${clean} 작용이 당해 연도 운의 흐름과 만나 특유의 기운을 형성합니다.`,
    mechanism: `사주 원국과 시간축(대운·세운) 간의 상호작용으로 인해 오행 및 십신의 균형에 변동이 일어나는 시기입니다.`,
    lifeImpact: {
      career: '현재 분야에서의 입지 변화와 새로운 도전 과제 직면.',
      wealth: '계획적인 자산 관리와 무리한 지출 억제 필요.',
      relationship: '주변인과의 소통 강화 및 상호 신뢰 구축 구간.',
      health: '규칙적인 휴식과 컨디션 관리가 중요한 시점.',
    },
    strategy: `기운의 변화를 사전에 인지하고, 과욕을 부리기보다 본인의 페이스를 유지하며 현명하게 대처하세요.`,
  };
}

const guideRoot = 'https://diving-wg.com/point/detail/';
const sourceName = 'ダイビングWG沖縄';

// Each record represents a named coast, island, or reef area rather than each route or mooring.
export const okinawaDiveAreas = [
  {
    id: 'hedo-canyon', name: '辺戸岬キャニオン', area: '沖縄・国頭 辺戸岬', coordinates: [128.26426, 26.87237], difficulty: 5,
    highlight: '海底に広がる谷を見下ろす地形ポイント。カスミチョウチョウウオの群れが岩壁のそばを通ります。',
    conditions: '岬沖の流れが強いドリフト。流れの中での潜降・浮上の経験が求められます。',
    source: guideRoot + 'hedo-canyon/', sourceName,
  },
  {
    id: 'sesoko', name: '瀬底島のサンゴ礁', area: '沖縄・瀬底島', coordinates: [127.84697, 26.64146], difficulty: 2,
    highlight: 'サンゴと岩場の境目に小魚が集まり、イソギンチャクのそばではトウアカクマノミを探せます。',
    conditions: 'ガイドと礁の浅い場所を回る目安です。島周辺には別に洞窟や割れ目のコースもあります。',
    source: guideRoot + 'sesoko/', sourceName,
  },
  {
    id: 'iejima', name: '伊江島・クマノミ山周辺', area: '沖縄・伊江島', coordinates: [127.71991, 26.72110], difficulty: 2,
    highlight: 'サンゴの根の周りにクマノミやハナダイが集まります。島の海は入り組んだ岩の地形でも知られます。',
    conditions: 'ボートで渡り、ガイドとサンゴの根を眺めるコースの目安です。',
    source: guideRoot + 'ie/', sourceName,
  },
  {
    id: 'minnajima', name: '水納島・ヨスジの根', area: '沖縄・本部沖 水納島', coordinates: [127.80670, 26.64741], difficulty: 2,
    highlight: '白い砂地からサンゴの根が突き出し、その上を黄色いヨスジフエダイの群れが横切ります。',
    conditions: 'ボートで行く砂地と浅い根のコース。海況に合う根をガイドが選びます。',
    source: guideRoot + 'minna/', sourceName,
  },
  {
    id: 'manza-dream-hole', name: '万座ドリームホール', area: '沖縄・恩納 万座沖', coordinates: [127.84875, 26.50495], difficulty: 5,
    highlight: '暗い縦穴から青い出口を見通す地形。出口の明かりにハタンポの群れが浮かびます。',
    conditions: '上にすぐ浮上できない暗い区間があります。潜るルートに合う訓練と経験が前提です。',
    source: guideRoot + 'manza/', sourceName,
  },
  {
    id: 'yamada-reef', name: '山田の浅場', area: '沖縄・恩納 山田沖', coordinates: [127.80047, 26.44926], difficulty: 2,
    highlight: '明るい浅瀬に枝サンゴが広がり、その周りをデバスズメダイやチョウチョウウオが泳ぎます。',
    conditions: 'ガイドと浅い棚を巡るボートコースの目安。斜面の先では水深が変わります。',
    source: guideRoot + 'yamada/', sourceName,
  },
  {
    id: 'zanpa', name: '残波岬', area: '沖縄・読谷 残波沖', coordinates: [127.71199, 26.43810], difficulty: 4,
    highlight: '海上の崖の下にも急な岩壁が続きます。壁際から沖を見渡すと、水深の変化がよく分かります。',
    conditions: '岬の先では流れが強くなることがあり、深さと流れの両方に対応できる経験が必要です。',
    source: guideRoot + 'zanpa/', sourceName,
  },
  {
    id: 'inanbishi', name: 'イナンビシ', area: '沖縄・嘉手納 イナンビシ沖', coordinates: [127.74465, 26.34767], difficulty: 2,
    highlight: 'なだらかな砂地にイソギンチャクが点在し、種類の違うクマノミを見比べられます。',
    conditions: '浅い砂地をガイドと回るボートコース。流れが少ない日を選びます。',
    source: guideRoot + 'inanbishi/', sourceName,
  },
  {
    id: 'oujima-beach', name: '奥武島ビーチ', area: '沖縄・南城 奥武島', coordinates: [127.77265, 26.13178], difficulty: 1,
    highlight: '島と本島の間の浅い海。砂地や岩のすき間にいる小さな生きものをゆっくり観察できます。',
    conditions: '岸から入る浅場で、講習にも使われます。潮位に合わせて潜る範囲を選びます。',
    source: guideRoot + 'ou-beach/', sourceName,
  },
  {
    id: 'oodo', name: '大度海岸・礁の内側', area: '沖縄・糸満 大度海岸', coordinates: [127.70582, 26.09031], difficulty: 2,
    highlight: '浅い礁の内側にサンゴや小魚が見られ、沖側に向かうと岩の地形が変わります。',
    conditions: 'ガイドと礁内を巡る場合の目安です。潮位が下がると水路に強い流れが出ます。',
    source: guideRoot + 'oodo/', sourceName,
  },
  {
    id: 'cape-kyan', name: '喜屋武岬', area: '沖縄・糸満 喜屋武岬沖', coordinates: [127.66931, 26.07908], difficulty: 4,
    highlight: '大きな岩の根の間にアーチと細い割れ目が続き、岩越しに青い海を見通せます。',
    conditions: '岬沖の岩場を巡るボートコース。岩の間で浮力を保ち、当日の流れに対応できる経験が目安です。',
    source: guideRoot + 'capekyan/', sourceName,
  },
  {
    id: 'tokashiki-nozaki', name: '野崎', area: '沖縄・慶良間 渡嘉敷島', coordinates: [127.35265, 26.21643], difficulty: 3,
    highlight: '白砂の上の長いサンゴ礁をデバスズメダイが覆います。魚が一斉に枝に潜る様子も見どころです。',
    conditions: '島沖のサンゴ礁をボートから巡ります。根の上での浮力管理と当日の流れへの対応が目安です。',
    source: guideRoot + 'nozaki/', sourceName,
  },
  {
    id: 'zamami-touma', name: 'トウマ', area: '沖縄・慶良間 座間味島', coordinates: [127.32726, 26.23100], difficulty: 2,
    highlight: '白砂の中にサンゴの根が点在します。砂から顔を出すチンアナゴや、根のクマノミを探せます。',
    conditions: '島陰で風を避けやすい砂地を、ガイドと回るボートコースの目安です。',
    source: guideRoot + 'touma/', sourceName,
  },
  {
    id: 'aka-agonomagari', name: '阿護の曲', area: '沖縄・慶良間 阿嘉島', coordinates: [127.27988, 26.20144], difficulty: 2,
    highlight: '砂地の小さな根にスカシテンジクダイが集まります。透明な群れの向こうに根が透けて見えます。',
    conditions: '砂地と点在する根をガイドと巡るボートコースの目安です。',
    source: guideRoot + 'agonomagari/', sourceName,
  },
  {
    id: 'fukaji', name: '外地島のドロップオフ', area: '沖縄・慶良間 外地島', coordinates: [127.29358, 26.16995], difficulty: 3,
    highlight: '島沿いの海底が落ち込む縁に、テーブル状に広がったサンゴが並びます。',
    conditions: 'ボートで深さが変わる岩場を回ります。水深を保てる浮力管理が目安です。',
    source: guideRoot + 'fukaji/', sourceName,
  },
  {
    id: 'kerama-kuroshima', name: '黒島北のサンゴ礁', area: '沖縄・慶良間 黒島', coordinates: [127.40183, 26.25746], difficulty: 3,
    highlight: '浅いサンゴの上をキンギョハナダイが群れ、岩が裂けた場所にはネムリブカが姿を見せます。',
    conditions: '礁の外側をガイドと巡るボートコース。岩の地形に沿って深さを調整します。',
    source: guideRoot + 'kuro-kita/', sourceName,
  },
  {
    id: 'tonaki-blue-corner', name: '渡名喜ブルーコーナー', area: '沖縄・渡名喜島', coordinates: [127.11595, 26.36590], difficulty: 4,
    highlight: '沖へ向かって落ちる岩壁の上に、ハナダイやスズメダイの群れが重なります。',
    conditions: '岩壁沿いのドリフト。流れの中で浮力を保ち、グループと浮上できる経験が目安です。',
    source: guideRoot + 'tonaki-bluecorner/', sourceName,
  },
  {
    id: 'aguni-fudenzaki', name: '筆ん崎', area: '沖縄・粟国島', coordinates: [127.20783, 26.57464], difficulty: 5,
    highlight: 'ギンガメアジが集まると、銀色の大きな塊になって形を変えます。イソマグロなどの回遊魚も通ります。',
    conditions: '速い潮が入るボートドリフトで、流れに慣れた経験者向けです。',
    source: guideRoot + 'fudenzaki/', sourceName,
  },
];

const bosoGuide = 'https://blog.padi.com/jp/diving-in-chiba-boso-peninsula/';
const miuraGuide = 'https://blog.padi.com/jp/diving-in-miura-and-shonan/';
const padi = 'PADI';

// Coordinates are map anchors for the area, checked against local maps or GSI place names.
export const kantoDiveAreas = [
  {
    id: 'katsuura-ubara', name: '志村ビーチ', area: '千葉・勝浦 鵜原 志村ビーチ', coordinates: [140.28264, 35.13330], difficulty: 1,
    highlight: '勝浦の浅い岩場では、海藻の周りの小魚やウミウシを探せます。回遊魚が岸近くまで入ることもあります。',
    conditions: '岸から入り、講習にも使われる浅場の目安です。外房の波と風で行き先が変わります。',
    source: 'https://www.katsuura-ds.com/point/', sourceName: '勝浦ダイビングサービス',
  },
  {
    id: 'namegawa-shinhama', name: '行川・新浜', area: '千葉・勝浦 行川', coordinates: [140.236, 35.121], difficulty: 2,
    highlight: '浅い岩の間にイソギンチャクが広がり、岩肌には小さなウミウシが見られます。',
    conditions: '港近くの浅いボートポイントで、初心者はガイドと海況の穏やかな日に潜ります。',
    source: 'https://www.katsuura-kankou.net/diving/', sourceName: '勝浦市観光協会',
  },
  {
    id: 'katsuyama', name: 'かっちゃま・千手ドロップ', area: '千葉・鋸南 勝山', coordinates: [139.817, 35.106], difficulty: 3,
    highlight: '岩壁や根にソフトコーラルが広がり、周りを回遊魚や季節来遊魚が通ります。',
    conditions: '島陰に入るボート海域。深さの変わる岩壁を回るコースの目安です。',
    source: bosoGuide, sourceName: padi,
  },
  {
    id: 'nishikawana', name: '西川名・大根周辺', area: '千葉・館山 西川名', coordinates: [139.758, 34.959], difficulty: 4,
    highlight: '岩の谷を抜ける潮にヒゲダイが並び、根の周りで大型のクエやイサキの群れが見られます。',
    conditions: '沖の岩礁は潮が速くなることがあります。ボートと流れのある海に慣れた人向けです。',
    source: 'https://www.nishikawana-diving.com/nishikawana-dive-sites', sourceName: '西川名ダイビングサービス',
  },
  {
    id: 'ito-sharks', name: '伊戸・沖前根', area: '千葉・館山 伊戸', coordinates: [139.776, 34.951], difficulty: 4,
    highlight: '岩礁の周りを多くのドチザメが泳ぎます。底近くにはアカエイやクエも集まります。',
    conditions: '船から深い根へ向かい、潮によって潜り方が変わります。現地ガイドの指示に従うコースです。',
    source: 'https://bommie.jp/diving_points', sourceName: '伊戸ダイビングサービスBOMMIE',
  },
  {
    id: 'banda', name: '坂田・カロウ根', area: '千葉・館山 坂田', coordinates: [139.770, 34.976], difficulty: 2,
    highlight: '根の上にソフトコーラルが広がり、キンギョハナダイがその間を泳ぎます。',
    conditions: '静かな入り江からボートで行く岩礁。ガイドと根の周りを回るコースの目安です。',
    source: bosoGuide, sourceName: padi,
  },
  {
    id: 'tateyama-okinoshima', name: '沖ノ島ビーチ', area: '千葉・館山 沖ノ島', coordinates: [139.8268, 34.9902], difficulty: 1,
    highlight: '岩と砂が隣り合う浅場で、季節ごとの小魚や海辺の生きものを近くから観察できます。',
    conditions: '流れが弱い日のビーチコースの目安です。沖の沈船などは別のボートコースです。',
    source: 'https://chibadiving.com/archives/13625', sourceName: '千葉ダイビングサービス協力会',
  },
  {
    id: 'hayama-shibasaki', name: '葉山・権太郎岩', area: '神奈川・葉山 芝崎', coordinates: [139.568, 35.269], difficulty: 2,
    highlight: '浅い岩場に水路が走り、ウミウシやギンポなどを岩のくぼみで探せます。',
    conditions: '岸から入ってガイドと岩の外側を回る浅場のコースです。うねりに合わせて場所を選びます。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'zushi-kotsubo', name: '逗子・オオタカ根', area: '神奈川・逗子 小坪沖', coordinates: [139.520, 35.276], difficulty: 4,
    highlight: '砂地から高く立つ岩礁の壁をソフトコーラルが彩り、根のそばにマダイやクエが現れます。',
    conditions: '岸から離れた深さのあるボートポイント。岩壁沿いの深度管理が求められます。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'jogashima-iwabone', name: '城ヶ島・岩骨', area: '神奈川・三浦 城ヶ島', coordinates: [139.604, 35.127], difficulty: 4,
    highlight: '岩の層が重なる断面を水中から見上げられます。地形のくぼみにサメが休むこともあります。',
    conditions: 'ボートで行く深い岩礁。段差のある海で深さと浮力を管理できる人向けです。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'moroiso', name: '諸磯の浅場', area: '神奈川・三浦 諸磯湾', coordinates: [139.608, 35.151], difficulty: 1,
    highlight: '小さな入り江の岩や砂地を巡ると、メジナやスズメダイ、季節のウミウシが見つかります。',
    conditions: '入り江の浅いビーチルート。穏やかな日は講習や久しぶりのダイビングにも使われます。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'miyagawa-tobine', name: '宮川湾・トビ根', area: '神奈川・三浦 宮川湾', coordinates: [139.642, 35.140], difficulty: 2,
    highlight: '入り組んだ岩をソフトコーラルが覆い、岩の隙間にはコケギンポやウミウシがいます。',
    conditions: '港から短い船移動で行ける比較的浅い根です。ガイドと根の周りを巡る目安です。',
    source: 'https://miura-diving.com/diving-point/miyagawa-bay/', sourceName: '三浦 海の学校',
  },
  {
    id: 'manazuru-iwa', name: '真鶴・化け根', area: '神奈川・真鶴 岩沖', coordinates: [139.149, 35.160], difficulty: 3,
    highlight: '海底に立つ岩の根にソフトコーラルがつき、キンギョハナダイが周りを行き来します。',
    conditions: '岩礁を巡るボートコース。流れる日があり、根に触れず浮力を保てることが目安です。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'hayakawa-beach', name: '早川ビーチ', area: '神奈川・小田原 早川', coordinates: [139.151, 35.240], difficulty: 1,
    highlight: '砂紋が見える平らな海底でヒラメなどを探せます。季節によっては岩場にダンゴウオも現れます。',
    conditions: '流れが少ない日の砂地のビーチルート。浅場は講習にも使われます。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'ishibashi-beach', name: '石橋ビーチ', area: '神奈川・小田原 石橋', coordinates: [139.148, 35.227], difficulty: 2,
    highlight: '石が重なる斜面の先に広い砂地が続きます。岩のそばではカエルアンコウやウミウシが見つかります。',
    conditions: '岸から入るガイド付きのコース。石の斜面を通るため、波の穏やかな日を選びます。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'enoura-beach', name: '江之浦ビーチ', area: '神奈川・小田原 江之浦', coordinates: [139.143, 35.193], difficulty: 1,
    highlight: '岩礁や砂地が岸近くで切り替わります。岩の間でカエルアンコウやクマノミを探せます。',
    conditions: '岸のスロープから入り、ガイドロープのある浅場を巡るルートです。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'fukuura-beach', name: '福浦ビーチ', area: '神奈川・湯河原 福浦', coordinates: [139.141, 35.146], difficulty: 1,
    highlight: '遠浅の海にサンゴイソギンチャクが群生し、クマノミが触手の間を出入りします。',
    conditions: '真鶴半島の陰で風を避けやすい浅場。穏やかな日のビーチコースが目安です。',
    source: miuraGuide, sourceName: padi,
  },
  {
    id: 'miura-mitohama', name: '三戸浜・黒崎側', area: '神奈川・三浦 三戸浜沖', coordinates: [139.61417, 35.18265], difficulty: 2,
    highlight: '浜の先に砂地と岩場があり、岩の近くで小魚や季節の海藻を観察できます。',
    conditions: 'ガイドと岸から入るルートの目安です。風と波に合わせて当日の場所を選びます。',
    source: 'https://fishnfin.jp/', sourceName: 'Beach Bum Dive & SUP',
  },
  {
    id: 'nebukawa-platform', name: '根府川・海底のホーム', area: '神奈川・小田原 根府川', coordinates: [139.1424, 35.20376], difficulty: 3,
    highlight: '海底に旧駅のホームの一部が残ります。岩場を泳いだ先に、当時の構造を水中で見られます。',
    conditions: '岸からガイドと遺構の外側を巡るコースです。波と透明度を見て海に入ります。',
    source: 'https://nebukawadiving.com/', sourceName: '根府川ダイビングサービス',
  },
  {
    id: 'katsuura-isomura', name: 'イソムラ', area: '千葉・勝浦 鵜原沖 イソムラ礁', coordinates: [140.27713, 35.12338], difficulty: 4,
    highlight: '白い砂の中に大きな岩礁が立ち、深い裂け目の上をイサキやタカベの群れが横切ります。',
    conditions: '沖の根まで船で行きます。深さが変わりやすく、黒潮の流れを受ける日は泳力が求められます。',
    source: 'https://www.katsuura-kankou.net/diving/', sourceName: '勝浦市観光協会',
  },
  {
    id: 'manazuru-kotogahama', name: '琴ヶ浜', area: '神奈川・真鶴 琴ヶ浜', coordinates: [139.1491, 35.1464], difficulty: 2,
    highlight: '丸い石の多い海岸から入り、岩のそばを泳ぐ魚や石のすき間の生きものを探せます。',
    conditions: '穏やかな日にガイドと岸から入る浅場の目安。波と岩場の足元に合わせて場所を選びます。',
    source: 'https://www.pref.kanagawa.jp/osirase/0602/feelshonan/marine/2818/index.html', sourceName: '神奈川県 Feel SHONAN',
  },
  {
    id: 'tateyama-kenbutsu', name: '見物の浅場', area: '千葉・館山 見物海岸', coordinates: [139.7937, 34.97445], difficulty: 1,
    highlight: '砂浜から遠浅の海に入り、砂底に落ちる日差しや岸を行き来する小魚を観察できます。',
    conditions: '穏やかな日にガイドと砂浜から入るルート。講習や体験にも使われます。',
    source: 'https://tds-sara.com/points', sourceName: '館山ダイビングサービスSARA',
  },
];

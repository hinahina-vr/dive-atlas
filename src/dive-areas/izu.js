const east = 'https://blog.padi.com/jp/diving-in-east-izu-peninsula/';
const west = 'https://blog.padi.com/jp/diving-in-west-izu-peninsula/';
const south = 'https://blog.padi.com/jp/diving-in-south-izu-peninsula/';
const padi = 'PADI';

// The representative map positions were cross-checked with https://divingpoint.net/maps/area/6.
export const izuDiveAreas = [
  {
    id: 'atami-asahi', name: '沈船・旭16号', area: '静岡・熱海 港沖', coordinates: [139.09618, 35.09414], difficulty: 4,
    highlight: '砂地に横たわる大きな船の外側をソフトコーラルが覆い、近くをサクラダイが泳ぎます。',
    conditions: '深いボートコースです。外側の観察が対象で、船内への進入は禁止されています。',
    source: east, sourceName: padi,
  },
  {
    id: 'hatsushima-futatsune', name: 'フタツネ', area: '静岡・熱海 初島', coordinates: [139.17217, 35.04282], difficulty: 2,
    highlight: '岸から岩と砂が入り交じる海へ出ます。根の周りで小魚の群れや季節のウミウシを探せます。',
    conditions: '岸から入り、ガイドと浅い範囲を巡るルートの目安です。',
    source: east, sourceName: padi,
  },
  {
    id: 'usami-cargo', name: 'カーゴ石', area: '静岡・伊東 宇佐美沖', coordinates: [139.09986, 35.00802], difficulty: 3,
    highlight: '白い砂地に岩が点在します。砂地にいるネコザメや岩のイソギンチャクを見比べられます。',
    conditions: 'ボートで行く砂地のコース。潮が走る日は流れへの対応が求められます。',
    source: east, sourceName: padi,
  },
  {
    id: 'kawana-beach', name: '川奈ビーチ', area: '静岡・伊東 川奈', coordinates: [139.13833, 34.95406], difficulty: 1,
    highlight: '岩場から砂地にかけて、魚や小さな生きものをゆっくり探せます。浅い海にウミガメが現れることもあります。',
    conditions: '岸から入って湾内の浅い範囲を巡る目安です。風向きに応じて現地で確認します。',
    source: 'https://marinediving.com/area/izu/ito/', sourceName: 'Marine Diving web',
  },
  {
    id: 'izu-ocean-park', name: '伊豆海洋公園・オクリダシ', area: '静岡・伊東 城ヶ崎 伊豆海洋公園', coordinates: [139.13260, 34.88334], difficulty: 2,
    highlight: '溶岩の岩場が水中にも続く海岸です。小さな入り江で岩肌に隠れる魚やウミウシを探せます。',
    conditions: '浅い入り江をガイドと巡るルートの目安です。岸のうねりと沖の深さに注意します。',
    source: 'https://iop-dc.com/diving/', sourceName: '伊豆海洋公園ダイビングセンター',
  },
  {
    id: 'hokkawa-kajikaki', name: 'カジカキ', area: '静岡・東伊豆 北川沖', coordinates: [139.08083, 34.82288], difficulty: 3,
    highlight: '根の岩肌をソフトコーラルが覆い、キンギョハナダイなどがその周りを群れて泳ぎます。',
    conditions: '船から岩礁を巡るコース。水深と当日の潮に対応できることが目安です。',
    source: 'https://marinediving.com/area/izu/izusp_east/', sourceName: 'Marine Diving web',
  },
  {
    id: 'inatori-tosan', name: '藤三ビーチ', area: '静岡・東伊豆 稲取', coordinates: [139.03443, 34.76591], difficulty: 1,
    highlight: '明るい砂地が広がり、ウミウシや砂にまぎれるサメ・エイの仲間を探せます。',
    conditions: '流れが少ない日の浅場ルート。岸から入り、水中のガイドロープに沿えます。',
    source: east, sourceName: padi,
  },
  {
    id: 'shobuzawa-beach', name: '菖蒲沢ビーチ', area: '静岡・河津 菖蒲沢', coordinates: [138.99473, 34.72736], difficulty: 1,
    highlight: '白砂の間に丸い石や岩が点在します。季節によってウミウシや浅場の魚が見られます。',
    conditions: '岸から入る遠浅の海を想定しています。近くの沈船は別のボートルートです。',
    source: 'https://shobuzawa.com/', sourceName: '菖蒲沢ダイビングセンター',
  },
  {
    id: 'mikomoto-kamene', name: '神子元島・カメ根', area: '静岡・南伊豆 神子元島沖', coordinates: [138.94385, 34.57298], difficulty: 5,
    highlight: '沖の岩礁を潮が通り、ハンマーヘッドシャークや回遊魚の群れが姿を見せることがあります。',
    conditions: '流れの強い外洋のドリフトです。必要な経験や参加条件を現地サービスに確認します。',
    source: south, sourceName: padi,
  },
  {
    id: 'nakagi-hayama', name: 'ハヤマ', area: '静岡・南伊豆 中木', coordinates: [138.82491, 34.60715], difficulty: 2,
    highlight: '浅瀬に枝サンゴが広がり、チョウチョウウオやスズメダイが枝の間を行き来します。',
    conditions: '比較的流れの少ない場所をガイドと巡る、浅いボートコースの目安です。',
    source: south, sourceName: padi,
  },
  {
    id: 'shishihama', name: '獅子浜・岸沿いの斜面', area: '静岡・沼津 獅子浜', coordinates: [138.88568, 35.04908], difficulty: 2,
    highlight: '岸近くから急に深くなる斜面に、岩のすき間を行き来する魚が集まります。',
    conditions: 'ガイドと斜面の浅い側を巡る目安です。沖側へ進むと急に水深が変わります。',
    source: 'https://dive-triton.jp/%E7%8D%85%E5%AD%90%E6%B5%9C/', sourceName: 'ダイビングショップ トリトン',
  },
  {
    id: 'ida-beach', name: '井田ビーチ', area: '静岡・沼津 井田', coordinates: [138.77859, 35.00035], difficulty: 2,
    highlight: '澄んだ日は石が敷き詰められた斜面の先まで見通せます。岩の周りを小魚が行き来します。',
    conditions: '岸から入るルートです。ガイドと水深を選び、斜面に沿って巡ります。',
    source: west, sourceName: padi,
  },
  {
    id: 'toi-torizaki', name: '通り崎・湾内', area: '静岡・伊豆市 土肥', coordinates: [138.78333, 34.90585], difficulty: 1,
    highlight: '風を避けやすい湾内で、砂地のハゼや岩場のギンポを探せます。',
    conditions: '比較的穏やかな日の遠浅のビーチコース。講習や体験にも利用されます。',
    source: west, sourceName: padi,
  },
  {
    id: 'koganezaki-beach', name: '黄金崎公園ビーチ', area: '静岡・西伊豆 黄金崎・安良里', coordinates: [138.76428, 34.84417], difficulty: 1,
    highlight: '白砂の上をよく見ると、巣穴から顔を出すハゼや、砂にまぎれた小さな生きものがいます。',
    conditions: '比較的流れの少ない入り江を岸から巡る浅場の目安です。',
    source: west, sourceName: padi,
  },
  {
    id: 'tago-futone', name: '田子・フトネ', area: '静岡・西伊豆 田子沖', coordinates: [138.74484, 34.79770], difficulty: 4,
    highlight: '沖にそびえる根をソフトコーラルが彩り、その上をイサキやタカベの群れが横切ります。',
    conditions: '水深差が大きく流れも出るボートポイント。中性浮力と深さの管理が求められます。',
    source: west, sourceName: padi,
  },
  {
    id: 'kumomi-ushitsuki', name: '牛着岩', area: '静岡・松崎 雲見', coordinates: [138.74299, 34.73153], difficulty: 4,
    highlight: '岩の間の水路に光が差します。暗い場所から明るい出口を見上げると、地形の形がよく分かります。',
    conditions: '入り組んだ岩場のボートコース。頭上が覆われるルートに合う経験と訓練を確認します。',
    source: west, sourceName: padi,
  },
];

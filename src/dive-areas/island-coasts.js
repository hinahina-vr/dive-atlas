const oshimaGuide = 'https://izuohshima-diving.com/diving-point/';
const hachijoGuide = 'https://www.hisaichi.jp/dive-site/';
const miyakeGuide = 'https://oceanclub3.com/point/';
const sadoGuide = 'https://divingfreeway.com/diving-points';
const shonanGuide = 'https://dive-triton.jp/%E6%B1%9F%E3%83%8E%E5%B3%B6/';

// Positions are approximate and were cross-checked with https://divingpoint.net/maps/.
export const islandCoastDiveAreas = [
  {
    id: 'oshima-nodahama', name: '野田浜', area: '東京・伊豆大島 北西岸', coordinates: [139.359598, 34.797291], difficulty: 2,
    highlight: '溶岩の岩棚にアーチが開きます。岩の陰から外の青をのぞくと、小魚の群れが見えることがあります。',
    conditions: '波の穏やかな日に、岸からガイドと浅い岩棚を巡るコースの目安です。',
    source: oshimaGuide, sourceName: '伊豆大島ダイビングセンター',
  },
  {
    id: 'oshima-ounohama', name: '王の浜', area: '東京・伊豆大島 南西岸', coordinates: [139.346466, 34.726377], difficulty: 3,
    highlight: '湾の外に溶岩の溝が続きます。岩の間ではウミガメや季節の魚を見られることがあります。',
    conditions: '湾内から岸を離れるコースです。外のうねりと潮を見て、ガイドが行き先を選びます。',
    source: 'https://uminowa.net/fundiving/page-2742/page-2432/', sourceName: '伊豆大島ダイビングうみのわ',
  },
  {
    id: 'oshima-toushiki', name: 'トウシキ', area: '東京・伊豆大島 南岸', coordinates: [139.422855, 34.679100], difficulty: 3,
    highlight: '溶岩が海へ流れ込んでできた岩場です。岸近くのくぼみと沖の切り立った岩で景色が変わります。',
    conditions: '外海の波を受ける岩場です。岸から入れるかを現地ガイドが判断します。',
    source: 'https://atopapa.com/diving-spot/', sourceName: '伊豆大島あとぱぱダイビングサービス',
  },
  {
    id: 'hachijo-sokodo', name: '底土・三又', area: '東京・八丈島 底土海岸', coordinates: [139.821968, 33.122313], difficulty: 3,
    highlight: '海水浴場の沖に溶岩のアーチがあります。岩の外から海へ開いた大きな窓を眺められます。',
    conditions: '堤防の先から入り、沖の地形を回って戻るルート。うねりと水面移動を考慮した目安です。',
    source: hachijoGuide, sourceName: '比三一ダイバーズクラブ',
  },
  {
    id: 'hachijo-yaene', name: '八重根', area: '東京・八丈島 八重根海岸', coordinates: [139.770813, 33.094562], difficulty: 2,
    highlight: '岩の壁が続く先に大きなアーチがあります。岸に近い岩場でもウミガメが泳ぐ姿を狙えます。',
    conditions: '波が穏やかな日のガイド付きビーチルート。沖まで足を延ばす場合は経験と海況で判断します。',
    source: hachijoGuide, sourceName: '比三一ダイバーズクラブ',
  },
  {
    id: 'hachijo-otcho', name: '乙千代ヶ浜', area: '東京・八丈島 乙千代ヶ浜', coordinates: [139.781113, 33.068959], difficulty: 4,
    highlight: '岩で囲まれた入り口の先に、溶岩が作った起伏の大きな海底が広がります。',
    conditions: '風とうねりの影響を受ける海岸です。ガイドと外側の地形を巡るルートの目安です。',
    source: 'https://www.divehousekanaloa.com/%E3%82%B3%E3%83%BC%E3%82%B9%E6%A1%88%E5%86%85/%E3%83%95%E3%82%A1%E3%83%B3%E3%83%80%E3%82%A4%E3%83%93%E3%83%B3%E3%82%B0/%E3%83%80%E3%82%A4%E3%83%93%E3%83%B3%E3%82%B0%E3%83%9D%E3%82%A4%E3%83%B3%E3%83%88/', sourceName: 'Divehouse Kanaloa',
  },
  {
    id: 'miyake-igaya', name: '伊ヶ谷', area: '東京・三宅島 伊ヶ谷湾', coordinates: [139.485340, 34.107256], difficulty: 2,
    highlight: '火山島の西側の入り江。海岸から入って、岩と砂の境目を近くで観察できます。',
    conditions: 'ガイドと岸から入る浅場を想定。出入りできる場所と風向きを事前に確認します。',
    source: 'https://www.dolphin-club-miyakejima.com/diving/diving.html', sourceName: 'ドルフィンクラブ三宅島',
  },
  {
    id: 'miyake-kamanoshiri', name: '釜の尻', area: '東京・三宅島 釜の尻海岸', coordinates: [139.562244, 34.114505], difficulty: 4,
    highlight: '岸寄りにはウミガメが多く、潮が通る沖では魚の群れや回遊魚に出会えることがあります。',
    conditions: '外側の根までは泳ぐ距離が長く、流れも出やすいコースです。',
    source: miyakeGuide, sourceName: '三宅島オーシャンクラブ Number3',
  },
  {
    id: 'miyake-gakkoshita', name: '学校下', area: '東京・三宅島 阿古 学校下', coordinates: [139.475555, 34.083517], difficulty: 4,
    highlight: '溶岩の岩場から沖へ出ると、海底が深く落ち込む壁に変わります。',
    conditions: '岸から長く泳ぎ、深い壁の上部を巡ります。水面移動と中性浮力に慣れた人向けです。',
    source: miyakeGuide, sourceName: '三宅島オーシャンクラブ Number3',
  },
  {
    id: 'sado-kitakoura', name: '北小浦・赤岩', area: '新潟・佐渡島 北小浦', coordinates: [138.523865, 38.273767], difficulty: 3,
    highlight: '砂地から岩が立ち上がり、額が丸く張り出したコブダイが岩の間を泳ぎます。',
    conditions: '船から入って深めの根を回ります。深度とボートに戻る経路の管理が必要です。',
    source: sadoGuide, sourceName: 'ダイビングサービス フリーウェイ',
  },
  {
    id: 'sado-ogi', name: '小木・幸福地蔵', area: '新潟・佐渡島 小木沖', coordinates: [138.267059, 37.803274], difficulty: 3,
    highlight: '海底に小さな地蔵が祀られています。周りでは、砂の巣穴から顔を出すジョーフィッシュを探せます。',
    conditions: 'ボートで行く中深度のコース。地蔵までの深さに合わせた経験と資格が必要です。',
    source: sadoGuide, sourceName: 'ダイビングサービス フリーウェイ',
  },
  {
    id: 'sado-himezu', name: '姫津・虎ヶ瀬', area: '新潟・佐渡島 姫津沖', coordinates: [138.221054, 38.106467], difficulty: 3,
    highlight: '岩盤に細い裂け目が走ります。岩肌に目を近づけると、小さなウミウシが見つかることがあります。',
    conditions: 'ガイドと岩の上を回るボートルート。裂け目の奥に進む経路は含みません。',
    source: sadoGuide, sourceName: 'ダイビングサービス フリーウェイ',
  },
  {
    id: 'sado-mushizaki', name: '虫崎・弁天ビーチ', area: '新潟・佐渡島 虫崎', coordinates: [138.512192, 38.229550], difficulty: 2,
    highlight: '浅い岩場と砂地をゆっくり巡り、岩のすき間にいる小さな生きものを探せます。',
    conditions: '岸から入るガイド付きの浅場を想定。沖側の水深と流れは当日のガイドに確認します。',
    source: sadoGuide, sourceName: 'ダイビングサービス フリーウェイ',
  },
  {
    id: 'enoshima-ura', name: '江の島・島裏の岩礁', area: '神奈川・藤沢 江の島沖', coordinates: [139.484793, 35.297238], difficulty: 3,
    highlight: '島の南の岩場を船から潜ります。根の陰でネンブツダイが群れ、岩にミノカサゴがとどまることもあります。',
    conditions: '港から出るボートダイブ。湾内でも島の裏側は風とうねりで行き先が変わります。',
    source: shonanGuide, sourceName: 'ダイビングショップ トリトン',
  },
  {
    id: 'chigasaki-eboshi', name: '烏帽子岩周辺', area: '神奈川・茅ヶ崎 烏帽子岩沖', coordinates: [139.415216, 35.305179], difficulty: 3,
    highlight: '茅ヶ崎沖に岩が点在します。水中では根をたどりながら、岩陰の魚の群れを観察できます。',
    conditions: '沖の岩礁へ船で渡るコースです。波と視界を見ながらガイドがポイントを選びます。',
    source: shonanGuide, sourceName: 'ダイビングショップ トリトン',
  },
  {
    id: 'hachijo-kaminato', name: '神湊（かみなと）', area: '東京・八丈島 神湊漁港', coordinates: [139.805317, 33.135395], difficulty: 1,
    highlight: '漁港の浅場をゆっくり巡れます。砂と岩が切り替わる場所で小魚を探せます。',
    conditions: 'ガイドと港内の指定された範囲で潜る目安です。講習や体験ダイビングにも使われます。',
    source: 'https://mindivrs.wixsite.com/mindivers/blank', sourceName: 'マインダイバーズ',
  },
  {
    id: 'kozu-nagumi', name: '名組', area: '東京・神津島 名組湾', coordinates: [139.12588, 34.24289], difficulty: 1,
    highlight: '湾内に丸い石と白い砂が広がります。石の多いところから砂地に出ると景色が変わります。',
    conditions: '岸から入るガイド付きの浅場。講習や久しぶりのダイビングにも使われます。',
    source: 'https://www.kozu-nangoku.com/divingpoint', sourceName: '神津島ダイビング 南国',
  },
  {
    id: 'kozu-nagahama-sakune', name: '長浜作根', area: '東京・神津島 長浜沖', coordinates: [139.12811, 34.23508], difficulty: 3,
    highlight: '沖に奇岩が点在し、岩と岩の間に水路やアーチが開きます。潮が通る側には魚が集まります。',
    conditions: '船で外側から地形を巡るルート。潮が速い日はドリフトに慣れた人向けです。',
    source: 'https://www.kozu-nangoku.com/divingpoint', sourceName: '神津島ダイビング 南国',
  },
  {
    id: 'kozu-tsumari', name: 'つまり', area: '東京・神津島 つまり海岸', coordinates: [139.12502, 34.20343], difficulty: 1,
    highlight: '岸のすぐ沖に明るい白砂が広がります。砂に残る波の跡や、小魚が行き来する様子を見られます。',
    conditions: '穏やかな日に岸から入るガイド付きの浅場。体験ダイビングや講習にも使われます。',
    source: 'https://www.kozu-nangoku.com/divingpoint', sourceName: '神津島ダイビング 南国',
  },
  {
    id: 'kozu-kirakiku', name: 'キラキク', area: '東京・神津島 キラキク湾', coordinates: [139.12107, 34.1861], difficulty: 4,
    highlight: '島の南側の湾で岩が大きく切れ込みます。湾内の浅い岩場と沖の地形を見比べられます。',
    conditions: '船で入る外寄りのコース。潮流と深さが変わるため、ボートと流れの経験が必要です。',
    source: 'https://www.kozu-nangoku.com/divingpoint', sourceName: '神津島ダイビング 南国',
  },
];

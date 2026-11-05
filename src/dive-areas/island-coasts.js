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
  {
    id: 'kozu-tadanae', name: 'タダナエ群島・ブーブー洞窟', area: '東京・神津島 祇苗群島沖', coordinates: [139.19063, 34.21253], difficulty: 4,
    highlight: '岩の隙間に開いた洞窟の入り口で、明るい海と岩陰の色の違いを眺められます。',
    conditions: '沖の島まで船で渡ります。明るい側から開口部を見る評価で、洞窟内の進入は含みません。',
    source: 'https://aquamate.jp/point_map/', sourceName: '神津島アクアメイトダイビングクラブ',
  },
  {
    id: 'kozu-arima', name: '割間（アリマ）', area: '東京・神津島 割間沖', coordinates: [139.11558, 34.20414], difficulty: 3,
    highlight: '沖の岩が切れ込み、岩の陰から青い外海へ景色が開きます。',
    conditions: '船で行く岩場のコース。潮と波に合わせて地形を巡る範囲を決めます。',
    source: 'https://www.kozu-nangoku.com/divingpoint', sourceName: '神津島ダイビング 南国',
  },
  {
    id: 'shikine-okama', name: '御釜湾の海中温泉', area: '東京・式根島 御釜湾', coordinates: [139.20313, 34.31937], difficulty: 3,
    highlight: '海底から小さな泡が連なって立ち上ります。泡が水中の光を受ける様子を観察できます。',
    conditions: '船で湾へ向かうガイド付きコース。湧き出す場所を避け、ガイドが指定する範囲から観察します。',
    source: 'https://hidabun.com/diving/', sourceName: '式根島の宿 ひだぶん',
  },
  {
    id: 'oshima-keikai', name: 'ケイカイ', area: '東京・伊豆大島 ケイカイ海岸', coordinates: [139.345608, 34.789559], difficulty: 4,
    highlight: '溶岩がつくった複雑な根が続き、季節や時間帯によってハンマーヘッドシャークを見かけることがあります。',
    conditions: '岸から入るポイントですが、速い潮が入ります。海況と参加条件を地元ガイドに確認します。',
    source: 'https://www.seasound.jp/izuoshima/diving-point.html', sourceName: '伊豆大島 シーサウンド',
  },
  {
    id: 'hachijo-shushoke', name: 'シュショケ（休憩所下）', area: '東京・八丈島 シュショケ海岸', coordinates: [139.746952, 33.107791], difficulty: 3,
    highlight: '溶岩の岩場が水中まで続き、アーチと細い水路が現れます。',
    conditions: '溶岩の足場を歩くビーチコース。岩の下を通る区間はガイドに確認します。',
    source: 'https://www.hisaichi.jp/dive-site/', sourceName: '八丈島 比三一ダイバーズクラブ',
  },
  {
    id: 'hachijo-yaken', name: 'ヤケンヶ浜', area: '東京・八丈島 ヤケンヶ浜', coordinates: [139.749355, 33.102902], difficulty: 2,
    highlight: '入り組んだ溶岩の根のそばに広い砂地があり、晴れた日は砂紋がよく見えます。',
    conditions: 'ゴロタの浜から入るコース。岩場のうねりを見ながら当日のルートを選びます。',
    source: 'https://www.hisaichi.jp/dive-site/', sourceName: '八丈島 比三一ダイバーズクラブ',
  },
  {
    id: 'kozu-saima', name: 'サイマ', area: '東京・神津島 南西 サイマ沖', coordinates: [139.12468, 34.182412], difficulty: 3,
    highlight: '切り立った岩の間に海中の谷が続き、下を見ながら泳ぐと地形の起伏がよく分かります。',
    conditions: '前浜港側から船で向かうコース。風向きと潮で行き先が変わります。',
    source: 'https://www.kozu-nangoku.com/divingpoint', sourceName: '神津島ダイビング 南国',
  },
  {
    id: 'kozu-miurawan', name: '多幸湾・ナガンネ', area: '東京・神津島 多幸湾（東岸 三浦湾）', coordinates: [139.1506, 34.189938], difficulty: 3,
    highlight: '湾口の岩礁の壁にキンギョハナダイが集まり、ウミガメを見かけることもあります。',
    conditions: '東岸から船で向かうコース。湾口は当日の潮に合わせて案内されます。',
    source: 'https://www.kozu-nangoku.com/divingpoint', sourceName: '神津島ダイビング 南国',
  },
  {
    id: 'miyake-togahama', name: '富賀浜', area: '東京・三宅島 富賀浜沖', coordinates: [139.476929, 34.055504], difficulty: 3,
    highlight: '島南西の岩場。海岸から海へ続く火山島の地形をたどれます。',
    conditions: '観光協会が案内する岸からのダイビング海域。エントリーできる海況を現地で確認します。',
    source: 'https://www.miyakejima.gr.jp/wp/wp-content/uploads/2017/10/MIYAKE-Diving-Point-Map.pdf', sourceName: '三宅島観光協会',
  },
  {
    id: 'miyake-sanbondake', name: '三本岳（大野原群島）', area: '東京・三宅島沖 大野原群島', coordinates: [139.3885, 34.0455], difficulty: 5,
    highlight: '外洋から突き出す火山性の岩礁群。水中からも島の急な地形が感じられます。',
    conditions: '三宅島の西に離れた海域。釣りとの共用区域があるため、現地ガイドと漁協の案内に従います。',
    source: 'https://www.miyakejima.gr.jp/wp/wp-content/uploads/2017/10/MIYAKE-Diving-Point-Map.pdf', sourceName: '三宅島観光協会',
  },
  {
    id: 'miyake-meganeiwa', name: 'メガネ岩沖', area: '東京・三宅島 メガネ岩沖', coordinates: [139.474182, 34.071431], difficulty: 4,
    highlight: '岩の窓が水中に連なり、外の青と岩陰の明暗が際立つ場所です。',
    conditions: '観光協会の案内では6月と10月に開く海域。年ごとの日程と参加条件を現地で確認します。',
    source: 'https://www.miyakejima.gr.jp/wp/wp-content/uploads/2017/10/MIYAKE-Diving-Point-Map.pdf', sourceName: '三宅島観光協会',
  },
  {
    id: 'miyake-chotaro', name: '長太郎池', area: '東京・三宅島 長太郎池の磯', coordinates: [139.54159, 34.054316], difficulty: 2,
    highlight: '溶岩の岩場が波を遮る南東岸の磯。島の火山地形と浅場の生きものを近くで眺められます。',
    conditions: '島の海域マップでビーチダイビングが案内されています。外側の波と現地の利用区分を確認します。',
    source: 'https://www.miyakejima.gr.jp/wp/wp-content/uploads/2017/10/MIYAKE-Diving-Point-Map.pdf', sourceName: '三宅島観光協会',
  },
];

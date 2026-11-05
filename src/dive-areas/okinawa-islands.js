const kume = 'https://www.okinawastory.jp/feature/activity/diving';
const miyako = 'https://irabu-marine.org/scuba-diving/';
const ishigakiWest = 'https://ishigaki-jam.com/map/ishigaki_west/';
const ishigakiMap = 'https://ishigaki-diving.net/divingmap/';
const sekisei = 'https://kamanta.jp/point/';
const hotMangrove = 'ホットマングローブ';
const tarama = 'https://www.vill.tarama.okinawa.jp/kankou/diving/diving_point/';

// Approximate positions for the representative sites are cross-checked with https://divingpoint.net/maps/.
export const okinawaIslandDiveAreas = [
  {
    id: 'kume-imazuni', name: 'イマズニ', area: '沖縄・久米島 北西沖', coordinates: [126.82137, 26.35880], difficulty: 4,
    highlight: '外洋に面した岩礁。ギンガメアジやホソカマスがまとまって泳ぐ光景を狙えます。',
    conditions: '潮が当たる外洋のボートコース。流れの中で集団から離れず移動できる人向けです。',
    source: kume, sourceName: '沖縄観光情報WEBサイト おきなわ物語',
  },
  {
    id: 'kume-tonbara', name: 'トンバラ', area: '沖縄・久米島 南沖', coordinates: [126.82343, 26.25401], difficulty: 5,
    highlight: '沖に立つ大岩の周りをイソマグロなどの回遊魚が通ります。',
    conditions: '外洋で潮流が強い海域。流れのあるボートダイブに慣れた人向けです。',
    source: kume, sourceName: '沖縄観光情報WEBサイト おきなわ物語',
  },
  {
    id: 'kume-umagai', name: 'ウーマガイ', area: '沖縄・久米島 北東沖', coordinates: [126.86548, 26.34650], difficulty: 4,
    highlight: 'サンゴの棚の先が外洋へ一気に落ち込みます。壁沿いでハナダイの仲間が群れます。',
    conditions: '足元が深くなる壁沿いのボートルート。中性浮力と深度の管理が欠かせません。',
    source: kume, sourceName: '沖縄観光情報WEBサイト おきなわ物語',
  },
  {
    id: 'shimoji-gaudi', name: 'アントニオ・ガウディ', area: '沖縄・宮古諸島 下地島 西岸', coordinates: [125.13771, 24.82148], difficulty: 5,
    highlight: '海底に開く岩の窓が何層にも重なり、見上げる場所で穴の形が変わって見えます。',
    conditions: '深い岩の開口部が連なるコース。頭上が閉じた範囲は相応の訓練と装備のある人が現地ガイドと判断します。',
    source: miyako, sourceName: '伊良部・下地島マリンレジャー組合',
  },
  {
    id: 'irabu-w-arch', name: 'Wアーチ', area: '沖縄・宮古諸島 伊良部島 北岸', coordinates: [125.15368, 24.86790], difficulty: 3,
    highlight: '浅い岩棚に大小のアーチがあり、外側から眺めると青い海を切り取ったように見えます。',
    conditions: '明るい側から岩の開口部を眺めるボートルートの評価です。',
    source: 'https://miyako-aquaticadventure.com/double-arch.html', sourceName: 'アクアティックアドベンチャー',
  },
  {
    id: 'miyako-nanamata', name: '七又アーチ', area: '沖縄・宮古島 七又海岸', coordinates: [125.41600, 24.72553], difficulty: 3,
    highlight: '白い砂に岩のアーチがかかります。湧き出す淡水と海水の境目で景色が揺らいで見えることもあります。',
    conditions: '岩の外側から観察するボートルートの目安です。南岸のうねりで行き先が変わることがあります。',
    source: 'https://miyako-aquaticadventure.com/7arch.html', sourceName: 'アクアティックアドベンチャー',
  },
  {
    id: 'kurima-beach', name: '来間ビーチ', area: '沖縄・宮古諸島 来間島', coordinates: [125.25554, 24.72440], difficulty: 1,
    highlight: '浅い砂地にサンゴの根が点在し、根の周りをスズメダイやクマノミが泳ぎます。',
    conditions: '穏やかな日にガイドと岸から入る浅場の評価です。体験ダイビングにも使われます。',
    source: 'https://miyako-aquaticadventure.com/kurimabeach.html', sourceName: 'アクアティックアドベンチャー',
  },
  {
    id: 'ishigaki-osaki', name: '大崎ハナゴイリーフ', area: '沖縄・石垣島 大崎', coordinates: [124.08208, 24.41817], difficulty: 2,
    highlight: 'サンゴの棚をハナゴイの群れが縁取ります。棚の上から岩やサンゴに集まる魚を探せます。',
    conditions: 'ガイドと浅い棚の上を巡るボートルートの目安です。',
    source: ishigakiWest, sourceName: 'マリンハウスJAM',
  },
  {
    id: 'ishigaki-nagura', name: '名蔵湾・アカククリの根', area: '沖縄・石垣島 名蔵湾', coordinates: [124.12394, 24.41328], difficulty: 3,
    highlight: '体が平たいアカククリが根の周りに集まります。小魚に体の掃除をされる姿が見られることも。',
    conditions: '根へ向かうボートルート。湾の濁りで見通しが短くなる日はガイドとの間隔を保ちます。',
    source: ishigakiWest, sourceName: 'マリンハウスJAM',
  },
  {
    id: 'ishigaki-oganzaki', name: '御神崎・エビ穴', area: '沖縄・石垣島 御神崎', coordinates: [124.07475, 24.45701], difficulty: 4,
    highlight: '岩の裂け目に日が差し、光が届く水中と暗がりを見比べられます。',
    conditions: 'ガイドと明るい側から岩場を見る想定です。頭上が閉じる区間は別の訓練と装備が要ります。',
    source: sekisei, sourceName: 'カマンタダイビングクラブ石垣島',
  },
  {
    id: 'ishigaki-sakieda', name: '崎枝ビッグアーチ', area: '沖縄・石垣島 崎枝', coordinates: [124.10785, 24.46390], difficulty: 3,
    highlight: '大きく開いた岩の窓から外の青い海が見えます。日が高い時間は岩の間にも光が差します。',
    conditions: '岩の開口部を外側から見るボートルート。暗い区間への進入は含みません。',
    source: sekisei, sourceName: 'カマンタダイビングクラブ石垣島',
  },
  {
    id: 'ishigaki-yonehara', name: '米原Wリーフ', area: '沖縄・石垣島 米原沖', coordinates: [124.20708, 24.46858], difficulty: 2,
    highlight: 'サンゴの棚が広がり、枝や岩のすき間を小さなスズメダイが行き来します。',
    conditions: 'ガイドとサンゴ棚の浅い範囲を巡るボートルートの目安です。',
    source: ishigakiMap, sourceName: 'ぷしぃぬしま石垣店',
  },
  {
    id: 'ishigaki-ibaruma', name: '伊原間インリーフ', area: '沖縄・石垣島 伊原間', coordinates: [124.26567, 24.54587], difficulty: 2,
    highlight: '外礁の内側に広がる浅い海。砂の間にサンゴの根が点在し、根ごとに小魚が集まります。',
    conditions: '礁の内側をガイドと巡る浅場の評価です。',
    source: 'https://www.ishigaki-cyan-umi.com/sp/point.html', sourceName: '石垣島ダイビングショップ シアンの海',
  },
  {
    id: 'taketomi-south', name: '竹富南・じゃがいも', area: '沖縄・八重山 竹富島 南沖', coordinates: [124.08504, 24.30479], difficulty: 2,
    highlight: '白い砂の上に丸いサンゴが並び、周りを黄色いヨスジフエダイの群れが行き来します。',
    conditions: 'ガイドと浅めの砂地を巡るボートルートです。砂を巻き上げずに根の周りを移動します。',
    source: sekisei, sourceName: 'カマンタダイビングクラブ石垣島',
  },
  {
    id: 'yaeyama-kuroshima', name: '黒島テラピー', area: '沖縄・八重山 黒島 西側', coordinates: [123.95977, 24.24668], difficulty: 2,
    highlight: '白い砂にサンゴの根が浮かび、根に集まる小魚を青い海を背景に観察できます。',
    conditions: 'ガイドと砂地を巡るボートルート。島の外側のドロップオフは別コースです。',
    source: sekisei, sourceName: 'カマンタダイビングクラブ石垣島',
  },
  {
    id: 'panari-ryugu', name: 'パナリ竜宮の根', area: '沖縄・八重山 新城島', coordinates: [123.92578, 24.23820], difficulty: 2,
    highlight: '白い砂地の中に色の濃いイソバナがついた根があり、その周りを小魚が泳ぎます。',
    conditions: 'ボートで行く浅場の評価です。海況に合わせて渡れるかを現地の船が判断します。',
    source: sekisei, sourceName: 'カマンタダイビングクラブ石垣島',
  },
  {
    id: 'yonara-channel', name: 'ヨナラ水道', area: '沖縄・八重山 小浜島〜西表島', coordinates: [123.94707, 24.34710], difficulty: 4,
    highlight: '島に挟まれた海峡。流れに沿って砂紋が続き、その合間にサンゴやイソバナのついた岩があります。',
    conditions: '潮の向きと速さに合わせて入るドリフト海域。ボートからの合流・回収に慣れた人向けです。',
    source: 'https://hotmangrove.jp/site08', sourceName: hotMangrove,
  },
  {
    id: 'barasu-east', name: 'バラス東', area: '沖縄・八重山 バラス島', coordinates: [123.82038, 24.42455], difficulty: 2,
    highlight: 'サンゴのかけらでできた小島の東側。サンゴ礁の上でハナダイの仲間が群れます。',
    conditions: 'ガイドと浅い礁の上を巡るボートルートの評価です。',
    source: 'https://hotmangrove.jp/map', sourceName: hotMangrove,
  },
  {
    id: 'iriomote-sakiyama', name: '崎山・沖の根', area: '沖縄・西表島 崎山湾沖', coordinates: [123.63499, 24.30821], difficulty: 4,
    highlight: '潮が通る外礁にグルクンが集まります。季節によってはイソマグロやバラクーダの群れも見られます。',
    conditions: '潮の流れに合わせて移動するボートルート。ドリフトに慣れてから楽しめる海域です。',
    source: 'https://hotmangrove.jp/site04', sourceName: hotMangrove,
  },
  {
    id: 'iriomote-takana', name: '高那ドロップ', area: '沖縄・西表島 高那沖', coordinates: [123.91685, 24.38963], difficulty: 3,
    highlight: '浅い棚が縦の壁に変わり、その先は青く落ち込んでいます。壁に沿って泳ぐと地形の高さが伝わります。',
    conditions: 'ガイドと壁の上部を巡るボートルート。斜面の先へ落ちないよう深さを意識します。',
    source: 'https://ishigaki-jam.com/map/ritou2/', sourceName: 'マリンハウスJAM',
  },
  {
    id: 'hateruma-sand', name: '波照間の砂地', area: '沖縄・八重山 波照間島', coordinates: [123.82347, 24.05336], difficulty: 3,
    highlight: '澄んだ水の下に白い砂地が広がります。点在するサンゴの根の周りには色とりどりの魚が集まります。',
    conditions: '島への移動距離があるボートダイブ。うねりの少ない日に現地の船が渡航を判断します。',
    source: 'https://hotmangrove.jp/site07', sourceName: hotMangrove,
  },
  {
    id: 'tarama-uminchu', name: '海人君のヨスジ', area: '沖縄・宮古諸島 多良間島 西岸', coordinates: [124.67249, 24.64414], difficulty: 2,
    highlight: '明るい砂地に小さな根があり、ヨスジフエダイの群れが黄色い帯のように動きます。',
    conditions: '現地ガイドと巡る、島の周りの浅めの砂地ルートの評価です。',
    source: tarama, sourceName: '多良間村',
  },
  {
    id: 'tarama-minna', name: 'ダブルロック', area: '沖縄・宮古諸島 多良間村 水納島 西岸', coordinates: [124.67455, 24.76422], difficulty: 3,
    highlight: '多良間島の北に浮かぶ島。沖のサンゴ礁と岩場を見ながら、地形に沿って泳げます。',
    conditions: '多良間島から船で渡る海域。出航と当日のコースは現地ガイドが海況を見て判断します。',
    source: tarama, sourceName: '多良間村',
  },
  {
    id: 'yonaguni-irizaki', name: '西崎（いりざき）', area: '沖縄・与那国島 西崎沖', coordinates: [122.92517, 24.45168], difficulty: 5,
    highlight: '島の西端の外洋をイソマグロやギンガメアジが通ります。時期によってはアカシュモクザメが群れます。',
    conditions: '足元に地形が見えないことがある外洋ドリフト。潜降・中性浮力・ボート回収に慣れた人向けです。',
    source: 'https://yonaguniyds.com/diving/point/', sourceName: '与那国ダイビングサービス',
  },
  {
    id: 'iriomote-kanokawa', name: '鹿ノ川・中の瀬', area: '沖縄・西表島 鹿ノ川湾沖', coordinates: [123.734894, 24.286458], difficulty: 4,
    highlight: '大きなアザミサンゴが海底に広がります。水温が下がる時期から初夏にかけてはマンタも見どころです。',
    conditions: '島の南に出るボートルート。沖へ出る範囲は潮流と経験に合わせて現地ガイドが決めます。',
    source: 'https://hotmangrove.jp/site05', sourceName: hotMangrove,
  },
  {
    id: 'taketomi-hot-spring', name: '竹富海底温泉', area: '沖縄・八重山 竹富島 東沖', coordinates: [124.097294, 24.339163], difficulty: 3,
    highlight: '砂のくぼみから温泉が湧き、立ち上る泡や、水の境目がゆらぐ様子を観察できます。',
    conditions: 'ボートで行く中深度のコース。底に触れずに観察できる位置をガイドと選びます。',
    source: 'https://ishigaki-jam.com/map/ritou1/', sourceName: 'マリンハウスJAM',
  },
  {
    id: 'tarama-blue', name: 'タラマブルー', area: '沖縄・宮古諸島 多良間島 北沖', coordinates: [124.699311, 24.682951], difficulty: 2,
    highlight: '浅い砂地に波が残した縞模様が続き、その合間にサンゴが点在します。',
    conditions: '穏やかな日にガイドと砂地を巡るボートルートの目安です。',
    source: tarama, sourceName: '多良間村',
  },
  {
    id: 'tarama-mitsu', name: 'ミーツぬグー', area: '沖縄・宮古諸島 多良間島 北西沖', coordinates: [124.677307, 24.672333], difficulty: 3,
    highlight: '島の北西に広がるサンゴ礁。サンゴが密に集まる場所では魚がまとまって泳ぎます。',
    conditions: '沖のサンゴ礁を巡るボートルート。うねりと潮に合わせて現地ガイドが船を出します。',
    source: tarama, sourceName: '多良間村',
  },
  {
    id: 'tonaki-angela', name: 'アンジェーラ口', area: '沖縄・渡名喜島 東岸', coordinates: [127.15527, 26.3637], difficulty: 3,
    highlight: '島の東側の浅い礁。ウミガメがサンゴの上を通る姿を探せます。',
    conditions: '遠征船で行く礁です。航路と海況に合わせて現地ガイドが行き先を選びます。',
    source: 'https://okinawa-kahana.com/fun-diving/tonaki.html', sourceName: 'ダイビングサービス KAHANA',
  },
  {
    id: 'tonaki-nakaruma', name: 'ナカルマ', area: '沖縄・渡名喜島 北沖', coordinates: [127.13747, 26.38452], difficulty: 5,
    highlight: '島の北沖をイソマグロやバラクーダが通ります。魚が潮に向かって群れる海域です。',
    conditions: '流れに乗って移動するドリフトコース。現地の利用日と出航条件も事前に確認します。',
    source: 'https://okinawa-kahana.com/fun-diving/tonaki.html', sourceName: 'ダイビングサービス KAHANA',
  },
  {
    id: 'ishigaki-hirakubo', name: '平久保崎', area: '沖縄・石垣島 平久保半島 北端', coordinates: [124.3063, 24.6138], difficulty: 3,
    highlight: '半島の先ではサンゴの棚が外海へ開きます。根に集まる魚を船から見に行けます。',
    conditions: '外海に面したボートルート。風や潮が弱い日にガイドが案内する範囲の目安です。',
    source: 'https://umimelo.com/divingspot/', sourceName: '石垣島北部 海のメロディー',
  },
  {
    id: 'nago-awa', name: '安和ビーチ', area: '沖縄・名護 安和海岸', coordinates: [127.91159, 26.6007], difficulty: 2,
    highlight: '岸の沖にサンゴの根が点在し、根の間に小魚が集まります。',
    conditions: '岸から入るガイド付きの浅場の目安です。風と波で出入りの条件が変わります。',
    source: 'https://diving-wg.com/point/detail/awa/', sourceName: 'ダイビングWG沖縄',
  },
  {
    id: 'kouri-emmons', name: 'USSエモンズ', area: '沖縄・今帰仁 古宇利島沖', coordinates: [128.00703, 26.71444], difficulty: 5,
    highlight: '深い海底に大きな船体が残ります。外側を泳ぐと艦首や艦尾に当時の構造が見えます。',
    conditions: '深さと流れのある外洋の沈船。船外でも対応する経験・資格と現地ガイドが必要です。',
    source: 'https://teal-orange.jp/ja/fun-diving/uss-emmons/', sourceName: 'Teal Orange Diving',
  },
  {
    id: 'irabu-wreck', name: '伊良部島沖の沈船', area: '沖縄・宮古諸島 伊良部島 東沖', coordinates: [125.24816, 24.81827], difficulty: 4,
    highlight: '沈んだ船の周りに魚が集まります。船の外側から、青い海に浮かぶ船体全体を見渡せます。',
    conditions: '砂地に沈む船を船外から見るコース。水深と視界に応じてガイドが案内します。',
    source: 'https://miyako-aquaticadventure.com/wreck-ship.html', sourceName: 'アクアティックアドベンチャー',
  },
  {
    id: 'yonaguni-umabana', name: '馬鼻崎・Wアーチ', area: '沖縄・与那国島 馬鼻崎沖', coordinates: [122.96585, 24.47574], difficulty: 3,
    highlight: '岬沖の岩棚には二つのアーチがあり、アカネハナゴイなどが棚の周りを泳ぎます。',
    conditions: '船から入り、岩の窓を外側から見るルート。北側の波と流れは海況に応じて確認します。',
    source: 'https://yonaguniyds.com/diving/point/', sourceName: '与那国ダイビングサービス',
  },
  {
    id: 'miyako-shigira', name: 'シギラビーチ', area: '沖縄・宮古島 上野新里 シギラ', coordinates: [125.34111, 24.72013], difficulty: 1,
    highlight: '浅いサンゴ礁まで日が差し込み、サンゴの枝を出入りするスズメダイを近くで見られます。',
    conditions: '穏やかな日のガイド付き浅場。岸から入る体験ダイビングの目安です。',
    source: 'https://www.miyako-aquaticadventure.com/sigirabeach.html', sourceName: 'アクアティックアドベンチャー',
  },
  {
    id: 'kume-ara', name: 'アーラ1', area: '沖縄・久米島 アーラ海岸沖', coordinates: [126.77874, 26.30313], difficulty: 3,
    highlight: '岩が入り組むアーラの海。岩と岩の間を明るい側から眺めると、奥行きのある地形を見渡せます。',
    conditions: '船で行く地形コースです。岩の外側を巡る想定で、うねりに合わせてルートを選びます。',
    source: 'https://ds-plusalpha.com/blog/23909/', sourceName: 'ダイビングショップ プラスアルファ',
  },
  {
    id: 'iriomote-funauki', name: '舟浮湾', area: '沖縄・西表島 舟浮湾', coordinates: [123.744, 24.3242], difficulty: 2,
    highlight: '湾内のサンゴの根を回りながら、岩陰の小魚や岩肌にいる小さな生きものを探せます。',
    conditions: 'ガイドと内湾の浅い範囲を回るボートコース。湾の中でも視界は当日の海況で変わります。',
    source: 'https://hotmangrove.jp/site02', sourceName: 'ホットマングローブ',
  },
  {
    id: 'iriomote-amitori', name: '網取・浅場', area: '沖縄・西表島 網取湾', coordinates: [123.6985, 24.3345], difficulty: 2,
    highlight: '白い砂地とサンゴ礁が隣り合い、どちらを向くかで海の色と見つかる魚が変わります。',
    conditions: '船で湾内へ入り、ガイドと浅い範囲を巡る目安です。',
    source: 'https://hotmangrove.jp/site03', sourceName: 'ホットマングローブ',
  },
  {
    id: 'hatoma-south', name: '鳩間島南の礁', area: '沖縄・八重山 鳩間島 南沖', coordinates: [123.7705, 24.462], difficulty: 3,
    highlight: '小さな島の沖にサンゴが育つ岩場が広がり、礁の周りで魚を観察できます。',
    conditions: '鳩間島まで渡るボートルート。風と波に応じてガイドが島の周りの行き先を選びます。',
    source: 'https://ishigaki-jam.com/map/ritou3/', sourceName: 'マリンハウスJAM',
  },
  {
    id: 'hamajima-east', name: '浜島東', area: '沖縄・石西礁湖 浜島 東沖', coordinates: [124.03982, 24.35533], difficulty: 2,
    highlight: '礁湖の砂の間にサンゴの根が点在します。根の近くでは小魚が集まる様子を見られます。',
    conditions: '船で礁湖の浅い範囲に入り、ガイドと砂地や根を巡るコースの目安です。',
    source: 'https://ishigaki-manta.com/map/', sourceName: 'ダイブハウスマンタ石垣島',
  },
];

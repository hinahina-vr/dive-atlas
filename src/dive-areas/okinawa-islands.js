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
    id: 'miyako-nanamata', name: '七又アーチ', area: '沖縄・宮古島 南岸', coordinates: [125.41600, 24.72553], difficulty: 3,
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
];

import { izuDiveAreas } from './dive-areas/izu.js';
import { islandDiveAreas } from './dive-areas/islands.js';
import { islandCoastDiveAreas } from './dive-areas/island-coasts.js';
import { kantoDiveAreas } from './dive-areas/kanto.js';
import { okinawaDiveAreas } from './dive-areas/okinawa.js';
import { okinawaIslandDiveAreas } from './dive-areas/okinawa-islands.js';

// Pins indicate the area around each spot. Difficulty is an editorial 1–5 estimate for the route described.
const okinawaBeginners = 'https://blog.padi.com/jp/dive-spots-in-okinawa-for-beginner/';

export const diveSpots = [
  {
    id: 'chibishi', name: 'ナガンヌ島・桟橋前', area: '沖縄・チービシ諸島 ナガンヌ島', coordinates: [127.548, 26.263], difficulty: 1,
    highlight: '白い砂地とサンゴの間を泳ぐウミガメ。なだらかな岩場もじっくり眺められます。',
    conditions: '島の南側にある、比較的穏やかな浅場の目安です。',
    source: 'https://liberte.jp/naha/scubadiving/okinawadiving/chibishidiving/chibishidivingpoint/nagannusanbashimae', sourceName: 'リベルテ',
  },
  {
    id: 'blue-cave', name: '青の洞窟', area: '沖縄・真栄田岬', coordinates: [127.77251, 26.44371], difficulty: 2,
    highlight: '入口から差し込む日差しで、岩に囲まれた水面と水中が青く光ります。',
    conditions: 'ガイドと潜る浅場のコースが目安。波やうねりで入れない日があります。',
    source: okinawaBeginners, sourceName: 'PADI',
  },
  {
    id: 'sunabe', name: '砂辺', area: '沖縄・北谷', coordinates: [127.744, 26.329], difficulty: 1,
    highlight: 'ソフトコーラルが広がる海底。クマノミや色鮮やかなスズメダイも探せます。',
    conditions: '穏やかな日の浅場は流れが少なく、岸から潜れます。',
    source: okinawaBeginners, sourceName: 'PADI',
  },
  {
    id: 'gorilla-chop', name: 'ゴリラチョップ', area: '沖縄・本部町崎本部', coordinates: [127.8725, 26.6389], difficulty: 1,
    highlight: '浅い海のソフトコーラルと白砂。サンゴの根をスズメダイが取り囲みます。',
    conditions: '岸から入る浅場で、穏やかな日には流れが少なめです。',
    source: okinawaBeginners, sourceName: 'PADI',
  },
  {
    id: 'manta-scramble', name: '川平石崎マンタスクランブル', area: '沖縄・石垣島 川平石崎', coordinates: [124.121, 24.488], difficulty: 2,
    highlight: 'サンゴの根にマンタが現れ、小魚に体を掃除してもらう姿を観察できます。',
    conditions: '比較的浅いボートポイント。ガイドと一緒に根の周りで待ちます。',
    source: 'https://blog.padi.com/jp/ishigaki-miyako-which-to-visit/', sourceName: 'PADI',
  },
  {
    id: 'yabiji', name: '八重干瀬（やびじ）', area: '沖縄・宮古島 北方の八重干瀬', coordinates: [125.269, 24.999], difficulty: 2,
    highlight: '宮古島の北に広がる大きなサンゴ礁群。浅瀬では明るい水色の海にサンゴが連なります。',
    conditions: 'ボートで行く浅い礁の目安。実際のポイントは風や潮に合わせて選びます。',
    source: 'https://www.japan.travel/en/sports/diving/guides/miyakojima/', sourceName: '日本政府観光局',
  },
  {
    id: 'yonaguni', name: '与那国島の海底地形', area: '沖縄・与那国島南岸', coordinates: [123.011, 24.436], difficulty: 5,
    highlight: '海底に階段やテラスのような岩が続きます。大きな段差を横から眺めると迫力があります。',
    conditions: '浅い場所にも強い潮流が入り、流れのある海での経験が求められます。',
    source: 'https://www.japan.travel/en/spot/564/', sourceName: '日本政府観光局',
  },
  {
    id: 'futo', name: '富戸・ヨコバマ', area: '静岡・伊東 富戸', coordinates: [139.135, 34.897], difficulty: 1,
    highlight: '岩場のクマノミや砂地の小さな魚。初夏から夏はアオリイカの産卵も見どころです。',
    conditions: '岸から入り、なだらかに深くなる浅場のコースが目安です。',
    source: 'https://blog.padi.com/jp/diving-in-east-izu-peninsula/', sourceName: 'PADI',
  },
  {
    id: 'shakotan', name: '美国・宝島周辺', area: '北海道・積丹半島', coordinates: [140.603, 43.303], difficulty: 3,
    highlight: '積丹ブルーの海に岩礁が続きます。岩場のすき間や海藻の間にいる生きものも観察できます。',
    conditions: '水温に合った装備で潜るボートコースが目安です。',
    source: 'https://blog.padi.com/jp/diving-in-hokkaido-and-tohoku-region/', sourceName: 'PADI',
  },
  {
    id: 'shizugawa', name: '志津川湾', area: '宮城・南三陸', coordinates: [141.493, 38.668], difficulty: 3,
    highlight: '小さなダンゴウオをじっくり探す海。岩や海藻の間をのぞくと、冷たい海の生きものが見えてきます。',
    conditions: '冷水と視界の変化に合わせた装備・経験があると楽しみやすい海域です。',
    source: 'https://www.gruntsculpin.com/tour-gallery-06.html', sourceName: 'グラントスカルピン',
  },
  {
    id: 'hasama', name: '波左間海中公園', area: '千葉・館山 波左間', coordinates: [139.779, 34.974], difficulty: 2,
    highlight: '海底に立つ鳥居と岩礁を巡るポイント。大きなコブダイが見どころです。',
    conditions: 'ガイドが案内するボートコースを想定しています。',
    source: 'https://chibadiving.com/archives/107', sourceName: '千葉ダイビングサービス協力会',
  },
  {
    id: 'osezaki', name: '大瀬崎・湾内', area: '静岡・沼津 大瀬崎', coordinates: [138.790, 35.028], difficulty: 1,
    highlight: '砂地の上に魚が集まり、季節ごとに姿を見せる小さな生きものを探せます。',
    conditions: '岬に守られた湾内で、講習にも使われる岸からのコースです。',
    source: 'https://blog.padi.com/jp/diving-in-west-izu-peninsula/', sourceName: 'PADI',
  },
  {
    id: 'oshima', name: '秋の浜', area: '東京・伊豆大島 秋の浜', coordinates: [139.409, 34.786], difficulty: 2,
    highlight: '岩や砂地が切り替わる岸沿いで、小さな魚や南の海から来る魚を探せます。',
    conditions: 'ガイドと巡る浅場を想定。沖は深くなります。',
    source: 'https://uminowa.net/fundiving/page-2742/page-2425/', sourceName: '伊豆大島ダイビングうみのわ',
  },
  {
    id: 'hachijo', name: 'ナズマド', area: '東京・八丈島 ナズマド', coordinates: [139.748, 33.131], difficulty: 4,
    highlight: '溶岩でできた地形の沖を、カンパチなどの回遊魚が通ります。ユウゼンも見どころです。',
    conditions: '岸から入るポイントでも潮の流れが強くなるため、流れへの対応経験が必要です。',
    source: 'https://blog.padi.com/jp/diving-in-tokyo-izu-islands/', sourceName: 'PADI',
  },
  {
    id: 'ogasawara', name: '二見湾・沈船', area: '東京・小笠原父島', coordinates: [142.193, 27.087], difficulty: 3,
    highlight: '湾に残る沈船が魚のすみかになっています。船の周りをヨスジフエダイなどが群れて泳ぎます。',
    conditions: '沈船の外側をガイドと巡るコースの目安です。',
    source: 'https://www.visitogasawara.com/archive/archive-4509/', sourceName: '小笠原村観光局',
  },
  {
    id: 'echizen', name: 'LOG前', area: '福井・越前海岸', coordinates: [135.993, 35.916], difficulty: 1,
    highlight: '日本海の入り組んだ岩場で、色も形もさまざまなウミウシを観察できます。',
    conditions: '海況が穏やかな日の、岸から入る浅場を想定しています。',
    source: 'https://www.echizenlog.jp/diving/beach_point/', sourceName: 'ECHIZEN LOG',
  },
  {
    id: 'kushimoto', name: '住崎', area: '和歌山・串本', coordinates: [135.744, 33.468], difficulty: 2,
    highlight: 'イサキやホウライヒメジが群れ、岩の間ではウミウシやエビも見つかります。',
    conditions: '湾内にある比較的穏やかなボートポイント。ガイド同行のコースが目安です。',
    source: 'https://blog.padi.com/jp/boat-points-to-dive-in-kii-peninsula/', sourceName: 'PADI',
  },
  {
    id: 'kashiwajima', name: '後浜', area: '高知・柏島', coordinates: [132.626, 32.771], difficulty: 2,
    highlight: '浅いサンゴ域にキンギョハナダイが集まります。砂地のハゼを探すのも楽しみの一つです。',
    conditions: 'ガイド同行で浅いサンゴ域を巡る場合の目安です。',
    source: 'https://umi-seek.com/destinations/kashiwajima', sourceName: 'UMISEEK',
  },
  {
    id: 'omijima', name: '船越', area: '山口・青海島', coordinates: [131.224, 34.431], difficulty: 2,
    highlight: '海上アルプスと呼ばれる岩場は水中にも続きます。日本海の魚や入り組んだ岩の地形が見どころです。',
    conditions: 'ガイドと岸沿いの浅場を巡るコースの目安です。',
    source: 'https://yamaguchi-tourism.jp/spot/detail_17017.html', sourceName: '山口県観光連盟',
  },
  {
    id: 'tatsunokuchi', name: '辰ノ口', area: '長崎・長崎半島西岸', coordinates: [129.780, 32.689], difficulty: 1,
    highlight: '岸近くからサンゴやウミウシを探せます。キビナゴがまとまって泳ぐと、水中に銀色の帯ができます。',
    conditions: '講習や初心者にも使われるビーチポイントの浅場が目安です。',
    source: 'https://www.naui.co.jp/shop/detail.php?uid=444', sourceName: 'NAUI',
  },
  {
    id: 'amami', name: '倉崎ビーチ', area: '鹿児島・奄美大島', coordinates: [129.647, 28.428], difficulty: 1,
    highlight: '湾内のサンゴと色鮮やかな魚を、岸から入ってゆっくり観察できます。',
    conditions: '穏やかな日に体験ダイビングでも利用される浅場です。',
    source: 'https://amami-diving.com/divingpoint/beachpoint.html', sourceName: 'ネイティブシー奄美',
  },
  ...kantoDiveAreas,
  ...izuDiveAreas,
  ...okinawaDiveAreas,
  ...okinawaIslandDiveAreas,
  ...islandDiveAreas,
  ...islandCoastDiveAreas,
  // Selected areas outside Japan.
  {
    id: 'blue-corner', name: 'ブルーコーナー', area: 'パラオ', coordinates: [134.21448, 7.13871], difficulty: 5,
    highlight: 'サンゴ礁の先端に魚の群れが集まり、その外側をリーフシャークが行き交います。',
    conditions: '潮流が強くなりやすいドリフトポイント。流れのある海での経験が必要です。',
    source: 'https://www.padi.com/dive-site/palau/blue-corner-2/', sourceName: 'PADI',
  },
  {
    id: 'sipadan', name: 'バラクーダポイント', area: 'マレーシア・シパダン島', coordinates: [118.629, 4.119], difficulty: 4,
    highlight: 'バラクーダの大群が渦を巻くように泳ぎ、サンゴの壁沿いではウミガメも見られます。',
    conditions: '壁沿いに流れが出ることがあり、流れに合わせた潜り方が求められます。',
    source: 'https://blog.padi.com/everything-you-need-to-know-about-diving-sipadan/', sourceName: 'PADI',
  },
  {
    id: 'kona', name: 'コナ・マンタナイト', area: 'アメリカ・ハワイ島', coordinates: [-156.05322, 19.73558], difficulty: 3,
    highlight: '暗い海でライトに集まるプランクトンを追い、マンタが頭上で旋回します。',
    conditions: '比較的浅いポイントですが、暗い中での浮力管理や合図に慣れていると安心です。',
    source: 'https://www.padi.com/dive-site/united-states-of-america-usa/manta-dive-garden-eel-cove/', sourceName: 'PADI',
  },
  {
    id: 'great-blue-hole', name: 'グレートブルーホール', area: 'ベリーズ・ライトハウス礁', coordinates: [-87.53444, 17.31528], difficulty: 5,
    highlight: '円形のくぼみを囲む石灰岩の壁。深い場所には太い鍾乳石が垂れ下がっています。',
    conditions: '鍾乳石を見るルートは深く暗いため、大深度に対応できる講習と経験が求められます。',
    source: 'https://blog.padi.com/blue-hole-belize-scuba-diving/', sourceName: 'PADI',
  },
  {
    id: 'silfra', name: 'シルフラの裂け目', area: 'アイスランド・シンクヴェトリル国立公園', coordinates: [-21.11694, 64.25519], difficulty: 4,
    highlight: '透明な淡水の中で、岩の割れ目が青い奥行きへ続きます。海とはひと味違う景色です。',
    conditions: '冷たい淡水でのダイビング。ドライスーツの訓練が必要です。',
    source: 'https://blog.padi.com/dive-destinations-in-europe/', sourceName: 'PADI',
  },
];

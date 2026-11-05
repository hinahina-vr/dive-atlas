// Approximate representative positions were cross-checked with https://divingpoint.net/maps/spot/74.
export const ogasawaraDiveAreas = [
  {
    id: 'chichijima-dobuiso', name: 'ドブ磯', area: '東京・小笠原 父島 東岸沖', coordinates: [142.25299, 27.09134], difficulty: 5,
    highlight: '深い海底から柱のような岩礁がそびえ、壁のそばをギンガメアジやイソマグロが通ります。',
    conditions: '外洋で流れが出やすいボートコースです。中層での移動と浮上、深度の管理に慣れた人向けです。',
    source: 'https://blog.padi.com/jp/diving-in-ogasawara-islands/', sourceName: 'PADI',
  },
  {
    id: 'chichijima-kannuki', name: '閂ロック（かんぬき）', area: '東京・小笠原 父島と南島の水路', coordinates: [142.17583, 27.04281], difficulty: 5,
    highlight: '狭い水路の岩の間を潮が抜け、外洋の魚が集まることがあります。',
    conditions: '流れに乗ってボートに回収されるドリフトルート。潮が強い日は経験が求められます。',
    source: 'https://www.divenavi.com/ogasawara/diving/', sourceName: 'ダイブナビ',
  },
  {
    id: 'anijima-barachin', name: 'バラ沈', area: '東京・小笠原 兄島 滝ノ浦湾', coordinates: [142.19972, 27.12064], difficulty: 3,
    highlight: '湾内に貨物船の船体が残り、鉄骨のすき間に魚が集まります。',
    conditions: '海底に残る船の外側をガイドと巡る目安です。船内への進入は含みません。',
    source: 'https://www.visitogasawara.com/archive/archive-4509/', sourceName: '小笠原村観光局',
  },
  {
    id: 'yomejima-maguro', name: '嫁島・マグロ穴', area: '東京・小笠原 聟島列島 嫁島沖', coordinates: [142.206, 27.4852], difficulty: 5,
    highlight: '沖の岩に大きなアーチが開き、潮が通る時期にはイソマグロが群れます。',
    conditions: '遠征船で行く外洋ドリフト。ロープなしで潜降と安全停止ができる経験が求められます。',
    source: 'https://www.visitogasawara.com/archive/archive-2934/', sourceName: '小笠原村観光局',
  },
  {
    id: 'nakoudojima-maguro', name: '媒島・マグロ穴', area: '東京・小笠原 聟島列島 媒島沖', coordinates: [142.18514, 27.62841], difficulty: 5,
    highlight: '沖の岩の奥に洞窟があり、入り口付近から回遊魚が通ることがあります。',
    conditions: '遠征船で洞窟の外側を観察する目安です。頭上が閉じる範囲に進む場合は別の訓練と装備が必要です。',
    source: 'https://pv.seasonal-ogasawara.com/question-1/', sourceName: 'PV Seasonal Dive Guiding',
  },
  {
    id: 'hahajima-yonhon', name: '四本岩', area: '東京・小笠原 母島 北西沖', coordinates: [142.12961, 26.65232], difficulty: 2,
    highlight: '岩の間を水路が通り、春から初夏にはイソマグロの群れが現れることがあります。',
    conditions: '船から入って係留場所の近くを巡ります。比較的流れの穏やかな日の目安です。',
    source: 'https://www.diveresort-hahajima.com/scubadiving/pointmap', sourceName: 'ダイブリゾート母島',
  },
  {
    id: 'hahajima-horai-wreck', name: '蓬莱根沈船', area: '東京・小笠原 母島 蓬莱根沖', coordinates: [142.1642, 26.61859], difficulty: 3,
    highlight: '白い砂地に第二西海丸が沈み、船の外側を巡ると砂地に立つ船体を見渡せます。',
    conditions: '外側をガイドと巡るボートダイブ。流れが穏やかでも水深に合った経験と資格が必要です。',
    source: 'https://www.diveresort-hahajima.com/scubadiving/pointmap', sourceName: 'ダイブリゾート母島',
  },
  {
    id: 'chichijima-miyanohama', name: '宮之浜', area: '東京・小笠原 父島 宮之浜', coordinates: [142.194371, 27.104328], difficulty: 2,
    highlight: '弓なりの浜の内側にサンゴが育ち、熱帯魚が集まります。',
    conditions: '浜の内側を現地ガイドと巡る目安です。沖の兄島瀬戸は潮が速いため進入しません。',
    source: 'https://www.vill.ogasawara.tokyo.jp/sightseeing_chichi/info_chichijima/', sourceName: '小笠原村',
  },
  {
    id: 'chichijima-tsurihama', name: '釣浜', area: '東京・小笠原 父島 釣浜', coordinates: [142.207203, 27.103984], difficulty: 3,
    highlight: '父島北側の岩に囲まれた浜。岸近くにサンゴが広がり、熱帯魚を観察できます。',
    conditions: '浜近くのダイビング海域。沖の流れが速いため、現地ガイドと海況を確認します。',
    source: 'https://ogasawara-info.jp/wp-content/uploads/2024/10/6-1_Ogasawara_Village_Ecotourism_Promotion_Overall_Concept_2016.pdf', sourceName: '小笠原村エコツーリズム推進全体構想',
  },
  {
    id: 'chichijima-minamiukiiso', name: '南浮磯', area: '東京・小笠原 父島 小港沖 南浮磯', coordinates: [142.184629, 27.067228], difficulty: 3,
    highlight: '沖の岩礁を囲む魚群を観察できます。クマザサハナムロなどが岩の周りを行き来します。',
    conditions: '船で向かう岩礁コース。海況に合わせてガイドが深度やルートを決めます。',
    source: 'https://noris-kobe.jp/diving-blog/ogasawara-2-20241018-23/', sourceName: 'ダイビングスクール ノリス',
  },
];

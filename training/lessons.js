const action = (id, label, detail, done, anchor = id) => ({ id, label, detail, done, anchor });
const attach = (id, label, detail, done, part, dock) => ({ ...action(id, label, detail, done), attachment: { part, dock } });

export const lessons = [
  {
    id: 'gear', title: '機材セッティング', label: 'KIT ASSEMBLY',
    subtitle: 'ヨーク式・ジャケット型BCD',
    description: 'シリンダーを点検し、器材を手に取って組み立てます。',
    docks: {
      cylinder: 'シリンダーの胴',
      valve: 'バルブの接合面',
      inflator: 'インフレーターの接続口'
    },
    scene: 'gear', source: 'https://blog.padi.com/how-to-assemble-your-dive-gear/',
    actions: [
      action('inspect', 'シリンダーを点検', '検査期限と、バルブ側のOリングの状態を確認します。', '検査期限とOリングを確認しました。'),
      attach('bcd', 'BCDを取り付ける', 'BCDを持ち、バンドをシリンダーに通します。', 'BCDがシリンダーに掛かりました。', 'BCD', 'cylinder'),
      action('lock', 'BCDのバンドを締める', 'バックルを閉じ、シリンダーがずれないか確かめます。', 'BCDが固定されました。'),
      action('uncap', 'ダストキャップを外す', 'ファーストステージのダストキャップを外します。', '接合面が見えるようになりました。'),
      attach('first', 'ファーストステージを付ける', 'ファーストステージを持ち、接合面をバルブのOリングに合わせます。締めすぎないよう固定します。', 'ファーストステージが取り付きました。', 'ファーストステージ', 'valve'),
      attach('connect', 'インフレーターに接続', '低圧ホースの先を持ち、インフレーターにつなぎます。カプラーがロックしたか確かめます。', '低圧ホースが接続されました。', '低圧ホース', 'inflator'),
      action('stow', 'ホース類をまとめる', '予備のセカンドステージと残圧計を、取り出せる位置に留めます。', 'ホース類を留めました。'),
      action('gauge-away', '残圧計を人からそらす', '残圧計の文字盤を、自分や周りの人からそらします。', '残圧計の向きを変えました。', 'pressure'),
      action('open', 'バルブを開く', '残圧計を人からそらしたまま、バルブをゆっくり開きます。', 'バルブが開き、残圧計に圧力がかかりました。'),
      action('pressure', '残圧と器材の状態を確認', '残圧を読み、空気漏れや器材のゆるみがないか確かめます。', '潜る前のバディチェックへ進めます。')
    ]
  },
  {
    id: 'buddy', title: 'バディチェック', label: 'BUDDY CHECK',
    subtitle: '組み立てた器材 · BWRAF',
    description: 'バディと互いの器材を確認する場面です。BWRAFの順番で練習します。',
    scene: 'gear', source: 'https://blog.padi.com/how-do-you-say-bwraf/',
    actions: [
      action('buoyancy', 'BCDの給排気を確認', '給気と排気を試し、バディの操作位置も確認します。', 'B — BCDの給排気を確認しました。', 'connect'),
      action('weights', 'ウエイトを確認', 'ウエイトが固定され、外し方を互いに分かっているか確かめます。', 'W — ウエイトを確認しました。'),
      action('releases', 'バックル類を確認', '留め具が閉じているか、バディの器材はどこから外すか確認します。', 'R — 留め具を確認しました。'),
      action('air', '空気を確認', '残圧を見ながら実際に呼吸し、予備のセカンドステージの場所と動作も確認します。', 'A — 残圧とセカンドステージを確認しました。', 'pressure'),
      action('final', '装着品を見渡す', 'マスクやフィンを含め、身につける物とホース類を互いに見渡します。', 'F — 最後の確認ができました。', 'stow')
    ]
  },
  {
    id: 'mask', title: 'マスククリア', label: 'MASK CLEAR',
    subtitle: '水中 · マスクに少し水が入った場面',
    description: 'マスク内の水を鼻から吐く息で出し、口で呼吸を続ける練習です。',
    scene: 'mask', source: 'https://blog.padi.com/how-to-clear-your-mask/',
    actions: [
      action('mask-breathe', '口で呼吸する', 'レギュレーターをくわえたまま、口で呼吸を続けます。', 'レギュレーターで呼吸しています。'),
      action('mask-hold', 'マスクの上側を押さえる', '上側の縁を軽く押さえ、下側から水が出るようにします。', 'マスクの上側を押さえました。'),
      action('mask-exhale', '鼻から息を吐く', '少し上を向いて鼻から息を吐き、マスクの下側から水を出します。', 'マスク内の水が抜けました。')
    ]
  },
  {
    id: 'recovery', title: 'レギュレーター回収', label: 'REGULATOR RECOVERY',
    subtitle: '水中 · 右腕でホースをすくう方法',
    description: '右肩の後ろに外れたレギュレーターを、腕でホースをすくって回収します。',
    scene: 'recovery', source: 'https://blog.padi.com/how-to-recover-your-regulator-when-diving/',
    actions: [
      action('bubbles', '細く息を吐き続ける', '口から外れている間は、息を止めずに少しずつ吐きます。', '口から小さな泡が出ています。'),
      action('sweep', '右腕でホースをすくう', '右に体を傾け、右腕を太ももの横から後ろへ回し、外側を通って前へ戻します。', 'ホースが右腕に掛かりました。'),
      action('replace', 'くわえ直して水を出す', '回収したレギュレーターをくわえ、講習で習った方法で中の水を出します。ここではパージを使います。', '水が抜けました。'),
      action('reg-breathe', '慎重に吸って確かめる', '最初の息を慎重に吸い、呼吸できることを確かめます。', 'レギュレーターでの呼吸に戻りました。')
    ]
  },
  {
    id: 'inflator', title: 'パワーインフレーター', tab: 'インフレーター', label: 'POWER INFLATOR',
    subtitle: '器材台 · 2つのボタン',
    description: '給気と排気を見分けて、BCDのふくらみがどう変わるか試します。',
    scene: 'inflator', source: 'https://www.sherwoodscuba.com/ModuleFile/BC_MANUAL_Sherwood-1-.PDF?id=3475',
    actions: [
      action('add-air', '給気ボタンを短く押す', '給気を短く試し、BCDが少しふくらむのを見ます。', 'BCDが少しふくらみました。'),
      action('raise', '排気口を高くする', 'このモデルでは、ホース先端の排気口をBCD内の空気より高い位置にします。', '排気口が高い位置に来ました。'),
      action('vent', '排気ボタンを押す', '排気ボタンを押し、BCDから空気が抜けるのを見ます。', 'BCDから空気が抜けました。')
    ]
  },
  {
    id: 'fins', title: 'フィンの履き方', label: 'OPEN-HEEL FINS',
    subtitle: '陸上 · ブーツとヒールストラップ',
    description: 'ブーツにオープンヒールのフィンを履きます。陸上の器材台と、水面で足元を見たときの両方を確認できます。',
    docks: { pocket: 'フィンのポケット', heel: 'ブーツのかかと' },
    scene: 'fins', source: 'https://www.padi.com/gear/fins',
    actions: [
      action('fin-strap', 'ストラップを外側へ', 'ブーツが入るように、かかとのストラップをよけます。', '足を入れるスペースができました。'),
      attach('fin-foot', 'ブーツのつま先を入れる', 'ブーツを持ち、つま先をフィンのポケットに入れます。', 'ブーツがポケットに入りました。', 'ブーツ', 'pocket'),
      attach('fin-lock', 'ストラップをかかとに掛ける', 'ストラップを持ち、かかとに掛けます。', 'かかとにストラップが掛かりました。', 'ストラップ', 'heel'),
      action('fin-check', 'フィットを確かめる', 'かかとを軽く動かし、ストラップが外れず、きつすぎないか確かめます。', 'フィンのフィットを確かめました。')
    ]
  }
];

export function newPractice(lesson, mode, random = Math.random) {
  const choices = [...lesson.actions];
  if (mode === 'recall') {
    for (let i = choices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
  }
  return { lesson, mode, choices, index: 0, missed: new Set(), assisted: new Set() };
}

export function choose(practice, id, dock) {
  const expected = practice.lesson.actions[practice.index];
  const action = practice.choices.find(choice => choice.id === id);
  if (!expected || !action || (action.attachment && !Object.hasOwn(practice.lesson.docks, dock))) return null;
  if (id !== expected.id || (action.attachment && action.attachment.dock !== dock)) {
    practice.missed.add(expected.id);
    return { ok: false, expected, wrongDock: id === expected.id };
  }
  practice.index += 1;
  return { ok: true, expected };
}

export function reveal(practice) {
  const step = practice.lesson.actions[practice.index];
  if (step && practice.mode === 'recall') practice.assisted.add(step.id);
  return step;
}

export function needsReview(practice) {
  return practice.lesson.actions.filter(action => practice.missed.has(action.id) || practice.assisted.has(action.id));
}

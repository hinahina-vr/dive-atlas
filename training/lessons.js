const action = (id, label, detail, done, anchor = id) => ({ id, label, detail, done, anchor });
const attach = (id, label, detail, done, part, dock, prompt) => ({
  ...action(id, label, detail, done), attachment: { part, dock, prompt }
});
const press = (id, label, detail, done, pressTime) => ({ ...action(id, label, detail, done), pressTime });
const inspect = (id, label, detail, done, inspection) => ({ ...action(id, label, detail, done), inspection });

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
    scenarios: { walkthrough: ['inspect-ring'], expired: ['inspect'], seal: ['inspect-ring'], ready: [] },
    scene: 'gear', source: 'https://blog.padi.com/how-to-assemble-your-dive-gear/',
    actions: [
      inspect('inspect', 'シリンダーの検査期限を確認', 'シリンダーの表示を見て、想定の潜水日が検査期限内か確かめます。', '検査期限内です。Oリングも確認しましょう。', {
        closeUp: true,
        note: 'この練習の潜水日：2026年11月',
        prompt: 'このシリンダーは検査期限内ですか？',
        normal: '期限内',
        repair: '期限切れなので交換する',
        evidence: ['検査期限は2028年5月です。', '検査期限は2026年8月です。'],
        corrected: '検査期限内のシリンダーに交換しました。'
      }),
      inspect('inspect-ring', 'Oリングを確認', 'バルブの接合面を見て、Oリングに傷や欠けがないか確かめます。', 'Oリングに傷や欠けは見当たりません。', {
        closeUp: true,
        prompt: 'バルブのOリングはどんな状態ですか？',
        normal: '欠けは見当たらない',
        repair: '欠けているので別のシリンダーに替える',
        evidence: ['黒いOリングは一周つながっています。', '黒いOリングの一部が欠けています。'],
        corrected: 'Oリングが欠けていないシリンダーに交換しました。'
      }),
      attach('bcd', 'BCDを取り付ける', 'BCDを持ち、バンドをシリンダーに通します。', 'BCDがシリンダーに掛かりました。', 'BCD', 'cylinder'),
      action('lock', 'BCDのバンドを締める', 'バックルを閉じ、シリンダーがずれないか確かめます。', 'BCDが固定されました。'),
      action('uncap', 'ダストキャップを外す', 'ファーストステージのダストキャップを外します。', '接合面が見えるようになりました。'),
      attach('first', 'ファーストステージを付ける', 'ファーストステージを持ち、接合面をバルブのOリングに合わせます。締めすぎないよう固定します。', 'ファーストステージが取り付きました。', 'ファーストステージ', 'valve'),
      attach('connect', 'インフレーターに接続', '低圧ホースの先を持ち、インフレーターにつなぎます。カプラーがロックしたか確かめます。', '低圧ホースが接続されました。', '低圧ホース', 'inflator'),
      action('stow', 'ホース類をまとめる', '予備のセカンドステージと残圧計を、取り出せる位置に留めます。', 'ホース類を留めました。'),
      action('gauge-away', '残圧計を人からそらす', '残圧計の文字盤を、自分や周りの人からそらします。', '残圧計の向きを変えました。', 'pressure'),
      action('open', 'バルブを開く', '残圧計を人からそらしたまま、バルブをゆっくり開きます。', 'バルブが開き、残圧計に圧力がかかりました。'),
      inspect('pressure', '残圧計を読む', '針が指している圧力を読み取ります。実物では空気漏れや器材のゆるみも確認します。', '残圧を読み取れました。次はバディチェックです。', {
        closeUp: true,
        prompt: '針はどの値を指していますか？',
        normal: '約200 bar',
        repair: '約100 bar',
        evidence: ['針は約200 barを指しています。']
      })
    ]
  },
  {
    id: 'buddy', title: 'バディチェック', label: 'BUDDY CHECK',
    subtitle: 'バディの器材 · BWRAF',
    description: 'バディの器材を確認します。器材を回して、ゆるみや外れがないか見てください。',
    scenarios: { walkthrough: ['weights', 'alternate'], weight: ['weights'], buckle: ['releases'], hose: ['alternate'], ready: [] },
    scene: 'gear', source: 'https://blog.padi.com/how-do-you-say-bwraf/',
    actions: [
      press('buoyancy', 'BCDに給気する', 'インフレーターとホースの接続を見て、給気ボタンでBCDがふくらむか確かめます。', 'BCDに空気が入りました。', 370),
      press('buddy-vent', 'BCDから排気する', '給気したBCDから空気が抜けるか確かめます。バディの排気弁の場所も確認します。', 'B — BCDの給排気を確認しました。', 510),
      inspect('weights', 'ウエイトを確認', 'ウエイトのポケットを軽く引いて固定を確認します。互いに外し方も確かめます。', 'W — ウエイトを確認しました。', {
        prompt: 'ウエイトのポケットは固定されていますか？',
        normal: '固定されている',
        repair: '浮いているので固定する',
        evidence: ['ポケットは受け口の奥まで入っています。', '片側のポケットが受け口から浮いています。'],
        corrected: 'W — ウエイトのポケットを差し直して固定しました。'
      }),
      inspect('releases', 'バックル類を確認', 'シリンダーバンド、肩・胸・腰の留め具を確認します。互いに開け方も確かめます。', 'R — 留め具を確認しました。', {
        prompt: '胸のバックルは閉じていますか？',
        normal: '閉じている',
        repair: '開いているので閉じる',
        evidence: ['胸のバックルの両側がつながっています。', '胸のバックルの両側が離れています。'],
        corrected: 'R — 胸のバックルを閉じました。'
      }),
      action('buddy-valve', 'バルブの開き具合を確認', 'シリンダーのバルブが全開になっていることを確かめます。', 'バルブの開き具合を確認しました。', 'open'),
      press('air', '残圧を見ながら呼吸を確認', '数回呼吸し、残圧計の針が呼吸に合わせて振れないか確かめます。', '呼吸の間、残圧計の針は安定しています。', 850),
      inspect('alternate', '予備のセカンドステージを確認', '予備のセカンドステージが胸元に固定され、バディが場所を分かっているか確認します。', 'A — 空気と予備のセカンドステージを確認しました。', {
        prompt: '予備のセカンドステージは胸元に固定されていますか？',
        normal: '胸元に固定されている',
        repair: 'ぶら下がっているので留める',
        evidence: ['黄色いセカンドステージは胸元のホルダーにあります。', '黄色いセカンドステージが胸元のホルダーから外れて下にあります。'],
        corrected: 'A — 予備のセカンドステージを胸元に留めました。'
      }),
      action('final', '装着品を見渡す', 'マスクやフィンを含め、身につける物とホース類を互いに見渡します。', 'F — 最後の確認ができました。')
    ]
  },
  {
    id: 'mask', title: 'マスククリア', label: 'MASK CLEAR',
    subtitle: 'マスクに半分ほど水が入った',
    maskFill: .46,
    description: 'マスク内の水を鼻から吐く息で出し、口で呼吸を続ける練習です。',
    scene: 'mask', source: 'https://blog.padi.com/how-to-clear-your-mask/',
    actions: [
      action('mask-breathe', '口で呼吸する', 'レギュレーターをくわえたまま、口で呼吸を続けます。', 'レギュレーターで呼吸しています。'),
      action('mask-hold', 'マスクの上側を押さえる', '上側の縁を軽く押さえ、下側から水が出るようにします。', 'マスクの上側を押さえました。'),
      press('mask-exhale', '鼻から息を吐く', '上の縁を押さえたまま、少し上を向いて鼻から息を吐きます。水が残ったら、もう一度吐きます。', 'マスク内の水が抜けました。', 1250)
    ]
  },
  {
    id: 'recovery', title: 'レギュレーター回収', label: 'REGULATOR RECOVERY',
    subtitle: '水中 · 右腕でホースをすくう方法',
    description: '右肩の後ろに外れたレギュレーターを回収し、中の水を出してから呼吸に戻ります。',
    scene: 'recovery', source: 'https://blog.padi.com/how-to-recover-your-regulator-when-diving/',
    docks: { mouth: '口元', chest: '胸元' },
    actions: [
      action('bubbles', '細く息を吐き続ける', '口から外れている間は、息を止めずに少しずつ吐きます。', '口から小さな泡が出ています。'),
      action('sweep', '右腕でホースをすくう', '右に体を傾け、右腕を太ももの横から後ろへ回し、外側を通って前へ戻します。', 'ホースが右腕に掛かりました。正面に戻ると口元に運べます。'),
      attach('replace', 'レギュレーターをくわえ直す', '回収したセカンドステージを口元に運びます。', 'レギュレーターをくわえ直しました。', 'セカンドステージ', 'mouth', 'セカンドステージを戻す位置を選んでください。'),
      press('purge', 'パージボタンで水を出す', 'くわえ直し、舌でマウスピースの穴を覆ってから、正面のパージボタンを押します。', '水が抜けました。', 530),
      action('reg-breathe', '慎重に吸って確かめる', '最初の息を慎重に吸い、呼吸できることを確かめます。', 'レギュレーターでの呼吸に戻りました。')
    ]
  },
  {
    id: 'inflator', title: 'パワーインフレーター', tab: 'インフレーター', label: 'POWER INFLATOR',
    subtitle: '器材台 · 2つのボタン',
    description: '給気と排気を見分けて、BCDのふくらみがどう変わるか試します。',
    scene: 'inflator', source: 'https://ww2.scubapro.com/media/845366/vn_09-2019-scubapro_jacket-eng.pdf',
    docks: { above: 'BCDより上', below: 'BCDより下' },
    actions: [
      press('add-air', '給気ボタンを短く押す', '給気を短く試し、BCDが少しふくらむのを見ます。', 'BCDが少しふくらみました。', 290),
      attach('raise', '排気口を高くする', 'このモデルでは、ホース先端の排気口をBCD内の空気より高い位置にします。', '排気口が高い位置に来ました。', 'インフレーター', 'above', '排気するときの高さを選んでください。'),
      press('vent', '排気ボタンを押す', '排気ボタンを押し、BCDから空気が抜けるのを見ます。', 'BCDから空気が抜けました。', 730),
      {
        ...action('balance', '高さを確認する',
          '給気と排気を少しずつ試し、模型が同じ高さにとどまるところを探します。',
          '模型が同じ高さを保ちました。給気と排気の反応を確認できました。'),
        balance: true
      }
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

const mask = lessons.find(lesson => lesson.id === 'mask');
const fullMask = {
  ...mask,
  route: 'mask-full',
  subtitle: 'マスク全体に水が入った',
  maskFill: 1,
  actions: mask.actions.map(step => step.id === 'mask-exhale' ? { ...step, pressTime: 2050 } : step)
};

export function remainingMaskWater(initial, cleared, progress = 0) {
  return cleared ? 0 : initial * (1 - progress);
}

export const neutralAir = .48;

export function balanceStatus(air) {
  if (air < .40) return 'sink';
  if (air > .56) return 'rise';
  return 'steady';
}

export function inflatorAir(added, vented, pressure) {
  if (vented) return pressure.balance ?? 0;
  return .48 * (added ? 1 - (pressure.vent || 0) : pressure['add-air'] || 0);
}

export function adjustAir(practice, direction) {
  if (!practice.lesson.actions[practice.index]?.balance) return false;
  const current = Math.round((practice.pressure.balance ?? 0) * 100);
  practice.pressure.balance = Math.min(96, Math.max(0, current + 16 * direction)) / 100;
  return true;
}

const recovery = lessons.find(lesson => lesson.id === 'recovery');
const [bubbles, sweep, replace, purge, breathe] = recovery.actions;
const reach = action('reach', '右肩の後ろでホースを探す',
  '右手を右肩の後ろへ伸ばし、ファーストステージから出るレギュレーターのホースを探します。',
  'レギュレーターにつながるホースに触れました。');
const trace = press('trace-hose', 'ホースをたどる',
  'ホースに沿って手を滑らせ、先にあるセカンドステージをつかみます。',
  'セカンドステージをつかみました。正面を向いて口元に運びます。', 950);
const blast = press('reg-exhale', '口から息を吐いて水を出す',
  'くわえ直したら、吸う前にレギュレーターに向けて口から息を吐き、中の水を出します。',
  '吐いた息で中の水が抜けました。', 710);

const recoveryRoutes = new Map([
  ['sweep-purge', recovery],
  ['sweep-exhale', { ...recovery, route: 'sweep-exhale', actions: [bubbles, sweep, replace, blast, breathe] }],
  ['reach-purge', { ...recovery, route: 'reach-purge', subtitle: '水中 · ホースをたどる方法', actions: [bubbles, reach, trace, replace, purge, breathe] }],
  ['reach-exhale', { ...recovery, route: 'reach-exhale', subtitle: '水中 · ホースをたどる方法', actions: [bubbles, reach, trace, replace, blast, breathe] }]
]);

export function recoveryRoute(key) {
  return recoveryRoutes.get(key) || recovery;
}

export function lessonRoute(lesson, key) {
  if (lesson.id === 'mask') return key === 'mask-full' ? fullMask : mask;
  if (lesson.id === 'recovery') return recoveryRoute(key);
  return lesson;
}

export function newPractice(lesson, mode, random = Math.random) {
  const choices = [...lesson.actions];
  if (mode === 'recall') {
    for (let i = choices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
  }
  const scenarios = lesson.scenarios ? Object.keys(lesson.scenarios).slice(1) : [];
  const scenario = scenarios.length ? (mode === 'guided' ? 'walkthrough' : scenarios[Math.floor(random() * scenarios.length)]) : undefined;
  return { lesson, mode, choices, index: 0, missed: new Set(), assisted: new Set(), pressure: {}, scenario };
}

export function choose(practice, id, dock) {
  const expected = practice.lesson.actions[practice.index];
  const action = practice.choices.find(choice => choice.id === id);
  if (!expected || !action) return null;
  if (action.attachment && !Object.hasOwn(practice.lesson.docks, dock)) return null;
  if (action.inspection && dock !== 'normal' && dock !== 'repair') return null;
  const fault = action.inspection && practice.lesson.scenarios[practice.scenario].includes(id);
  const wrongDock = Boolean(action.attachment && action.attachment.dock !== dock);
  const wrongInspection = Boolean(action.inspection && Boolean(fault) !== (dock === 'repair'));
  const wrongBalance = Boolean(action.balance && balanceStatus(practice.pressure.balance ?? 0) !== 'steady');
  if (id !== expected.id || wrongDock || wrongInspection || wrongBalance) {
    practice.missed.add(expected.id);
    return { ok: false, expected, wrongDock: id === expected.id && wrongDock,
      wrongInspection: id === expected.id && wrongInspection, wrongBalance: id === expected.id && wrongBalance };
  }
  practice.index += 1;
  return { ok: true, expected, message: fault ? action.inspection.corrected : action.done };
}

export function reveal(practice) {
  const step = practice.lesson.actions[practice.index];
  if (step && practice.mode === 'recall') practice.assisted.add(step.id);
  return step;
}

export function needsReview(practice) {
  return practice.lesson.actions.filter(action => practice.missed.has(action.id) || practice.assisted.has(action.id));
}

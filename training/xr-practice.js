import * as T from '../vendor/three.module.js';
import { makeDiveModel, makeModel } from './models.js';
import { balanceLabels, balanceStatus, inflatorAir, remainingMaskWater } from './lessons.js';
import { createExample, exampleEffects } from './example.js';
import { reviewReason, reviewReasonLabels } from './reviews.js';

const maskControls = [
  { id: 'mask-breathe', label: '口で呼吸する', x: 32, y: 173, w: 304, h: 85 },
  { id: 'mask-hold', label: '上の縁を押さえる', x: 360, y: 173, w: 304, h: 85 },
  { id: 'mask-exhale', label: '鼻から息を吐く', x: 688, y: 173, w: 304, h: 85 },
  { id: 'exit', label: 'VRを閉じる', x: 792, y: 25, w: 200, h: 65 }
];

const recoveryControls = [
  { id: 'bubbles', label: '細く息を吐く', x: 32, y: 173, w: 454, h: 85 },
  { id: 'reg-breathe', label: '慎重に吸う', x: 538, y: 173, w: 454, h: 85 },
  maskControls.at(-1)
];

const inflatorControls = [
  { id: 'balance', label: '高さを確認する', x: 32, y: 173, w: 960, h: 85 },
  maskControls.at(-1)
];

const nextLessonControl = { id: 'next-lesson', x: 538, y: 173, w: 454, h: 85 };
const reviewControl = { id: 'review-open', label: '見直す手順を見る', x: 32, y: 173, w: 454, h: 85 };
const reviewControls = [
  { id: 'review-prev', label: '‹ 前の手順', x: 32, y: 268, w: 284, h: 60 },
  { id: 'review-back', label: '結果に戻る', x: 370, y: 268, w: 284, h: 60 },
  { id: 'review-next', label: '次の手順 ›', x: 708, y: 268, w: 284, h: 60 }
];

const exampleOpen = { id: 'example-open', label: '見本を見る', x: 585, y: 25, w: 183, h: 65 };
const exampleBack = { ...exampleOpen, id: 'example-back', label: '練習に戻る' };
const reviewExample = { ...exampleOpen, id: 'review-example', label: '見本を再生' };
const reviewExampleBack = { ...exampleBack, label: '見直しに戻る' };
const exampleControls = [
  { id: 'example-prev', label: '‹ 前の手順', x: 32, y: 268, w: 206, h: 60 },
  { id: 'example-play', label: '一時停止', x: 256, y: 268, w: 226, h: 60 },
  { id: 'example-next', label: '次の手順 ›', x: 500, y: 268, w: 206, h: 60 },
  { id: 'example-recall', label: '自力で復習 ›', x: 724, y: 268, w: 268, h: 60 }
];

const finRecallGroups = {
  'fin-part-strap': {
    label: 'ストラップ', anchor: 'fin-strap',
    actions: { 'fin-strap': '外側へよける', 'fin-lock': 'かかとに掛ける', 'fin-check': 'フィットを確かめる' }
  },
  'fin-part-boot': {
    label: 'ブーツ', anchor: 'fin-wiggle',
    actions: { 'fin-foot': 'ポケットに入れる', 'fin-wiggle': 'かかとを動かす（長押し）' }
  }
};
const finCancel = { id: 'fin-cancel', label: 'キャンセル', x: 32, y: 268, w: 248, h: 60 };

const inspectionSlots = [
  { id: 'normal', label: '足についてくる', x: 32, y: 173, w: 454, h: 85 },
  { id: 'repair', label: 'すき間がある・調整する', x: 538, y: 173, w: 454, h: 85 }
];

function makeInspectionPreview(model, station) {
  const view = new T.Group();
  view.position.set(-.96, .84, -1.43);
  view.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), view.position.clone().negate().normalize());
  view.visible = false;
  station.add(view);
  const backing = new T.Mesh(new T.PlaneGeometry(.78, .49), new T.MeshBasicMaterial({ color: 0xf1fffd }));
  backing.position.z = -.21;
  view.add(backing);
  const replicas = new T.Group();
  view.add(replicas);
  let displayed;
  let copies = [];
  return {
    show(id) {
      const detail = model.inspectionParts[id];
      if (id !== displayed) {
        displayed = id;
        replicas.clear();
        view.visible = Boolean(detail);
        copies = detail ? detail.parts.map(part => {
          const copy = part.clone();
          replicas.add(copy);
          return copy;
        }) : [];
        if (detail) replicas.scale.setScalar(detail.scale);
      }
      if (!detail) return;
      for (const [index, part] of detail.parts.entries()) {
        const copy = copies[index];
        copy.position.copy(part.position).sub(detail.center);
        copy.quaternion.copy(part.quaternion);
        copy.scale.copy(part.scale);
        copy.visible = part.visible;
      }
    },
    dispose() {
      view.removeFromParent();
      replicas.clear();
      backing.geometry.dispose();
      backing.material.dispose();
    }
  };
}

function makeVisor() {
  const lens = new T.Mesh(new T.PlaneGeometry(.96, .58), new T.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { water: { value: 0 }, time: { value: 0 } },
    vertexShader: `
      varying vec2 uvAtLens;
      void main() {
        uvAtLens = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec2 uvAtLens;
      uniform float water;
      uniform float time;
      void main() {
        vec2 p = abs((uvAtLens - .5) * vec2(.96, .58)) - vec2(.35, .17);
        float edge = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0);
        float inner = 1.0 - smoothstep(.072, .075, edge);
        float frame = (1.0 - smoothstep(.103, .106, edge)) - inner;
        float level = mix(-.02, 1.02, water) + sin(uvAtLens.x * 17.0 + time) * .006;
        float fill = inner * (1.0 - smoothstep(level - .012, level, uvAtLens.y)) * step(.001, water);
        float wave = fill * smoothstep(level - .027, level - .012, uvAtLens.y);
        vec3 glass = mix(vec3(.02, .18, .23), vec3(.50, .95, .83), wave);
        gl_FragColor = vec4(mix(glass, vec3(.015, .085, .11), frame), frame * .98 + fill * .66);
        #include <colorspace_fragment>
      }`
  }));
  lens.position.z = -.64;
  lens.renderOrder = 8;
  return lens;
}

function makePanel(lesson, following) {
  const recovery = lesson.scene === 'recovery';
  const inflator = lesson.scene === 'inflator';
  const fins = lesson.scene === 'fins';
  const gear = lesson.scene === 'gear';
  const controls = fins || gear ? [maskControls.at(-1)] : recovery ? recoveryControls : inflator ? inflatorControls : maskControls;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 346;
  const context = canvas.getContext('2d');
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const mesh = new T.Mesh(new T.PlaneGeometry(.99, .3345), new T.MeshBasicMaterial({
    map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false
  }));
  mesh.renderOrder = 9;
  if (gear) mesh.position.set(-.96, .35, -1.43);
  else if (fins) mesh.position.set(-.94, -.35, -1.45);
  else mesh.position.set(recovery ? -.41 : inflator ? -.52 : 0, recovery ? -.81 : inflator ? -.94 : -.33, inflator ? -1.28 : -1.22);

  function rect(x, y, w, h, color) {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x, y, w, h, 17);
    context.fill();
  }
  function text(value, x, y, size, color, width = 960) {
    context.fillStyle = color;
    context.font = '700 ' + size + 'px sans-serif';
    context.textBaseline = 'middle';
    context.fillText(value, x, y, width);
  }
  let previous = '';
  let visibleControls = controls;
  const exit = maskControls.at(-1);

  function drawControls(options, state, hovered, primary, neutral = false) {
    visibleControls = options;
    for (const control of options) {
      const index = neutral ? -1 : state.steps.findIndex(step => step.id === control.id);
      const done = index >= 0 && index < state.index;
      const guided = (state.guide && index === state.index) || control.id === primary;
      const selected = hovered === control.id;
      const fill = done ? '#e5efed' : selected ? '#7be5d4' : guided ? '#a8eee0' : '#d5efec';
      rect(control.x, control.y, control.w, control.h, fill);
      text((done ? '✓ ' : '') + control.label, control.x + 18, control.y + control.h / 2, 32,
        done ? '#466b71' : '#133f49', control.w - 36);
    }
  }

  function drawDescription(detail) {
    let line = '';
    let y = 165;
    const bodySize = 36;
    context.font = '700 ' + bodySize + 'px sans-serif';
    for (const character of detail) {
      if (context.measureText(line + character).width > 960) {
        text(line, 32, y, bodySize, '#246270');
        y += 38;
        line = '';
      }
      line += character;
    }
    if (line) text(line, 32, y, bodySize, '#246270');
  }

  function drawExample(demo, state, hovered, reviewing) {
    const { step, index, complete, paused, first, lesson: source, scenario, motion, amount } = demo;
    const title = reviewing ? '見直しの見本' : complete ? '見本はここまで' : '見本  ' + (index + 1) + ' / ' + source.actions.length;
    text(title, 32, 58, 46, '#103b49', 520);
    if (complete && !reviewing) {
      text('今度は自分で試す', 32, 115, 43, '#103b49');
      drawDescription('自力復習では、次の手順を自分で選びます。');
    } else {
      text(step.label, 32, 115, 43, '#103b49');
      const inspection = step.inspection;
      const fault = Boolean(source.scenarios?.[scenario]?.includes(step.id));
      const evidence = inspection && (fault && motion >= 1 ? inspection.corrected : inspection.evidence[Number(fault)]);
      drawDescription(evidence ? [inspection.note, evidence].filter(Boolean).join('。') : step.detail);
      if (source.scene === 'mask' || source.scene === 'inflator') {
        text((source.scene === 'mask' ? 'マスク内の水 ' : 'BCDの空気 ') + amount + '%', 32, 242, 29, '#246270', 400);
      }
    }
    const options = exampleControls.filter(control =>
      (!reviewing || control.id === 'example-play') &&
      (control.id !== 'example-prev' || index > first || complete) &&
      (control.id !== 'example-next' || !complete)).map(control => control.id === 'example-play' ?
        { ...control, ...(reviewing ? { x: 352, w: 320 } : {}), label: complete ? 'もう一度見る' : paused ? '再生' : '一時停止' } : control);
    drawControls([...options, reviewing ? reviewExampleBack : exampleBack, exit], state, hovered,
      reviewing ? 'example-back' : complete ? 'example-recall' : undefined);
  }

  function drawReview(state, hovered, reviewIndex) {
    const step = state.review[reviewIndex];
    text('見直し  ' + (reviewIndex + 1) + ' / ' + state.review.length, 32, 58, 46, '#103b49', 298);
    const reason = reviewReason(state, step.id);
    if (reason) {
      const hint = reason === 'hint';
      rect(342, 34, 217, 48, hint ? '#d9f0f2' : '#fff1d6');
      text(reviewReasonLabels[reason], 355, 58, 30, hint ? '#205b64' : '#75430b', 191);
    }
    text(step.label, 32, 115, 43, '#103b49');
    drawDescription(step.detail);
    const options = reviewControls.filter(control =>
      (control.id !== 'review-prev' || reviewIndex > 0) &&
      (control.id !== 'review-next' || reviewIndex + 1 < state.review.length));
    drawControls([...options, reviewExample, exit], state, hovered, 'review-example');
  }

  function drawResult(state, hovered) {
    text(lesson.title + '   ' + state.index + ' / ' + state.steps.length, 32, 58, 46, '#103b49', 700);
    const count = state.review.length;
    text(count ? '見直す手順は' + count + 'つ' : '練習完了 · 見直す手順なし', 32, 129, 39, '#246270');
    const options = [];
    if (count) options.push(following ? reviewControl : { ...reviewControl, w: 960 });
    if (following) {
      options.push({ ...nextLessonControl, ...(count ? {} : { x: 32, w: 960 }), label: (following.tab || following.title) + 'へ ›' });
    }
    drawControls([...options, exit], state, hovered, count ? 'review-open' : 'next-lesson');
  }
  return {
    mesh,
    pick(hit) {
      const x = hit.uv.x * 1024, y = (1 - hit.uv.y) * 346;
      return visibleControls.find(({ x: left, y: top, w, h }) => x >= left && x <= left + w && y >= top && y <= top + h)?.id;
    },
    draw(state, hovered, placing, done, inspecting, reviewIndex, demo, finChoice, hasController) {
      const air = inflator ? inflatorAir(done.has('add-air'), done.has('vent'), state.pressure) : 0;
      const amount = Math.round((inflator ? air : state.water) * 100);
      const key = !hasController ? 'tracking:' + state.index : demo ?
        ['example', reviewIndex, demo.index, demo.paused, demo.complete, demo.motion >= 1, demo.amount, hovered].join('|') :
        [state.index, state.guide, state.message, state.retry, state.review.length, amount, hovered, placing, inspecting, reviewIndex, finChoice].join('|');
      if (key === previous) return;
      previous = key;
      const next = state.steps[state.index];
      const inspection = inspecting && next?.inspection;
      const finGroup = finRecallGroups[finChoice];
      const finInput = fins && !state.guide && (finChoice || placing);
      const compact = next ? (inflator && next.id !== 'balance') || ((fins || gear) && !inspection && !finInput) :
        !state.review.length && !following;
      context.clearRect(0, 0, 1024, 346);
      rect(0, 0, 1024, !hasController || (compact && !demo) ? 246 : 346, '#f1fffd');
      texture.needsUpdate = true;
      if (!hasController) {
        text(lesson.title + '   ' + state.index + ' / ' + state.steps.length, 32, 58, 46, '#103b49', 850);
        text('コントローラーを確認', 32, 127, 39, '#103b49');
        text('照準が戻ると、同じ手順を続けられます。', 32, 193, 32, '#246270');
        visibleControls = [];
        return;
      }
      if (demo) { drawExample(demo, state, hovered, reviewIndex >= 0); return; }
      if (state.review[reviewIndex]) { drawReview(state, hovered, reviewIndex); return; }
      if (!next) { drawResult(state, hovered); return; }
      text(lesson.title + '   ' + state.index + ' / ' + state.steps.length, 32, 58, 46, '#103b49', 530);
      const note = fins && inspection ? 'かかとを動かすと、フィンはどうなった？' :
        inspection ? inspection.prompt :
        finGroup ? finGroup.label + 'で何をする？' :
        (fins || gear) && placing ? '照準を合わせて置く' :
        inflator && placing ? '排気口を置く高さを選ぶ' :
        finChoice ? next.attachment.part + 'を持つ' :
        (fins || gear || inflator) && state.guide ? next?.label : '';
      text(note || state.message || '操作に照準を合わせてトリガーを押す', 32, 129, 34, '#246270');
      const options = inspection ? inspectionSlots.map(slot => fins ? slot : { ...slot, label: inspection[slot.id] }) : [];
      if (finGroup) {
        const choices = state.choices.filter(step => finGroup.actions[step.id]);
        const width = (960 - 24 * (choices.length - 1)) / choices.length;
        choices.forEach((step, index) => options.push({
          id: step.id, label: finGroup.actions[step.id], x: 32 + index * (width + 24), y: 173, w: width, h: 85
        }));
      }
      if (finInput) options.push(finCancel);
      drawControls(compact ? [exampleOpen, exit] : [...options, ...controls, exampleOpen], state, hovered, undefined, Boolean(finGroup));
      if (fins || gear) {
        const hint = placing ? 'トリガーを離すか、置く場所を選ぶ' :
          state.retry ? state.message : inspection ? inspection.note || '' :
          finGroup ? state.message : finChoice ? '足元の目印に照準を合わせる' :
          state.guide && next.pressTime ? 'トリガーを押し続ける' : fins ? '足元の部品を選ぶ' : '器材の目印を選ぶ';
        text(hint, finInput ? 310 : 32, compact ? 197 : 300, 32, '#246270', finInput ? 675 : 960);
      } else if (recovery) {
        const note = placing ? '正面を向いて「口元」を選ぶ' :
          !state.guide ? '次の操作を思い出し、器材かボタンを選ぶ' :
          ['sweep', 'reach', 'trace-hose'].includes(next.id) ? '右肩側を見て、ホースの目印を探す' : next.label;
        text(note, 32, 303, 32, '#246270');
      } else {
        const label = inflator
          ? (done.has('vent') ? balanceLabels[balanceStatus(air)] : 'BCDのふくらみ')
          : 'マスク内の水 ' + amount + '%';
        const meterY = compact ? 192 : 289;
        text(label, 32, meterY + 14, 32, '#246270', 390);
        rect(436, meterY, 556, 28, '#d6eeeb');
        if (amount) rect(436, meterY, 556 * amount / 100, 28, '#31998a');
      }
    }
  };
}

const recoveryLabels = {
  sweep: '腕ですくう', reach: 'ホースを探す', 'trace-hose': 'ホースをたどる',
  replace: '器材を持つ', purge: 'パージ', 'reg-exhale': '口から吐く', mouth: '口元', chest: '胸元'
};
const inflatorLabels = {
  'add-air': '給気', raise: '器材を持つ', vent: '排気', 'trim-add': '少し給気', 'trim-vent': '少し排気',
  above: 'BCDより上', below: 'BCDより下'
};

const finLabels = {
  'fin-strap': 'ストラップ', 'fin-foot': 'ブーツ', 'fin-lock': 'ストラップ',
  'fin-wiggle': 'かかとを動かす', 'fin-check': 'フィットを見る', pocket: 'ポケット', heel: 'かかと'
};

const gearLabels = {
  inspect: '検査期限', 'inspect-ring': 'Oリング', bcd: 'BCD', lock: 'バンド', uncap: 'ダストキャップ',
  first: 'ファーストステージ', connect: '低圧ホース', stow: 'ホース類', 'gauge-away': '残圧計', open: 'バルブ', pressure: '文字盤',
  buoyancy: '給気', 'buddy-vent': '排気', weights: 'ウエイト', releases: 'バックル',
  'buddy-valve': 'バルブ', air: '呼吸と残圧', alternate: '予備の呼吸器', final: 'マスク・フィン',
  cylinder: 'シリンダーの胴', valve: 'バルブ接合面', inflator: 'インフレーター口'
};

function spatialTargets(lesson, model, scene) {
  const inflator = lesson.scene === 'inflator';
  const fins = lesson.scene === 'fins';
  const gear = lesson.scene === 'gear';
  const labels = gear ? gearLabels : fins ? finLabels : inflator ? inflatorLabels : recoveryLabels;
  const entries = lesson.actions.map(action => action.id).filter(id => labels[id]);
  if (inflator) entries.push('trim-add', 'trim-vent');
  if (fins) entries.push(...Object.keys(finRecallGroups));
  entries.push(...Object.keys(model.docks));
  const targets = entries.map(id => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 100;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.roundRect(2, 2, 316, 96, 25);
    context.fillStyle = '#0e3542';
    context.fill();
    context.strokeStyle = '#bbf4e9';
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = '#ffcf84';
    context.beginPath();
    context.arc(45, 50, 14, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#e8fff9';
    context.font = '700 39px sans-serif';
    context.textBaseline = 'middle';
    const group = finRecallGroups[id];
    context.fillText(group?.label || labels[id], 78, 51, 226);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    const mesh = new T.Mesh(new T.PlaneGeometry(fins || gear ? .40 : .31, fins || gear ? .125 : .097), new T.MeshBasicMaterial({
      map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false
    }));
    mesh.renderOrder = 11;
    mesh.visible = false;
    scene.add(mesh);
    const dock = Boolean(model.docks[id]);
    const action = lesson.actions.find(step => step.id === id);
    const anchor = group?.anchor || action?.anchor || id;
    const [parent, offset] = model.anchors[anchor] || model.docks[id];
    const point = offset.clone();
    if (!inflator) point.y += dock ? .12 : .14;
    if (id === 'replace') point.x += .13;
    if (id === 'buddy-vent') point.z += .17;
    if (id === 'fin-part-boot') point.x -= .20;
    const trimming = id.startsWith('trim-');
    const phaseOnly = (fins && !dock) || trimming || id === 'trace-hose';
    const actionId = trimming ? 'balance' : id;
    const index = lesson.actions.findIndex(action => action.id === actionId);
    const sharedAnchor = gear ? lesson.actions.findIndex((step, i) => i < index && step.anchor === anchor) : -1;
    return { id, dock, group, parent, point, mesh, index, phaseOnly, sharedAnchor };
  });
  const forward = new T.Vector3();
  const delta = new T.Vector3();
  return {
    update(state, placing, eye, orientation, inspecting, focusStep, finChoice) {
      const stepIndex = focusStep && state.steps.indexOf(focusStep);
      forward.set(0, 0, -1).applyQuaternion(orientation);
      for (const { id, dock, group, parent, point, mesh, index, phaseOnly, sharedAnchor } of targets) {
        mesh.visible = false;
        if (focusStep !== undefined) {
          if (!focusStep || group || !parent.visible || (dock ? id !== focusStep.attachment?.dock : index !== stepIndex)) continue;
        } else if (fins && !state.guide) {
          if (!state.steps[state.index] || !parent.visible || inspecting) continue;
          const armed = finChoice && !finRecallGroups[finChoice];
          if (placing ? !dock : armed ? id !== finChoice : !group) continue;
        } else {
          if (group || (placing ? !dock : dock || index < state.index || !parent.visible)) continue;
          if (id === inspecting || (phaseOnly && index !== state.index)) continue;
          if (gear && placing === 'bcd' && id === 'inflator') continue;
          if (gear && !dock && (inspecting || sharedAnchor >= state.index ||
            index > state.index + (state.guide ? 0 : 2))) continue;
        }
        parent.localToWorld(mesh.position.copy(point));
        if (delta.subVectors(mesh.position, eye).normalize().dot(forward) < .70) continue;
        mesh.quaternion.copy(orientation);
        mesh.updateMatrixWorld();
        mesh.visible = true;
      }
    },
    pick(ray) {
      let nearest;
      for (const { id, dock, mesh } of targets) {
        if (!mesh.visible) continue;
        const hit = ray.intersectObject(mesh)[0];
        if (hit && (!nearest || hit.distance < nearest.distance)) nearest = { id, dock, spatial: true, distance: hit.distance };
      }
      return nearest;
    },
    highlight(hovered, reviewing) {
      for (const { id, mesh } of targets) {
        if (mesh.visible) mesh.material.color.setHex(reviewing || id === hovered ? 0x9bf2df : 0xffffff);
      }
    },
    dispose() {
      for (const { mesh } of targets) {
        mesh.removeFromParent();
        mesh.geometry.dispose();
        mesh.material.map.dispose();
        mesh.material.dispose();
      }
    }
  };
}

export function createPracticeXR(renderer, session, { lesson, scenario, following, lights, readState, advanceToNext, recallAfterExample, press, trim, apply }) {
  const scene = new T.Scene();
  scene.background = new T.Color();
  scene.fog = new T.FogExp2();
  scene.add(...lights);
  const stage = new T.Group();
  const root = new T.Group();
  const equipment = new T.Group();
  stage.add(root);
  root.add(equipment);
  const completed = new Set();
  const reviewPressure = {};
  const example = createExample({
    requestFrame: callback => session.requestAnimationFrame(callback),
    cancelFrame: id => session.cancelAnimationFrame(id)
  });
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rig = new T.Group();
  const camera = new T.PerspectiveCamera(45, 1, .05, 40);
  const visor = new T.Group();
  const station = new T.Group();
  rig.add(camera, visor, station);
  scene.add(stage, rig);

  function mount({ lesson, scenario, following }) {
    const gear = lesson.scene === 'gear';
    const fins = lesson.scene === 'fins';
    const inflator = lesson.scene === 'inflator';
    const lens = lesson.scene === 'mask' ? makeVisor() : null;
    const floor = gear ? new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshStandardMaterial({ color: 0xa7c8bf, roughness: .90 })) : null;
    if (floor) {
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.397;
      root.add(floor);
    }
    if (lens) visor.add(lens);
    root.scale.setScalar(gear ? .70 : 1);
    scene.background.setHex(gear ? 0xd6ede6 : 0x79cec8);
    scene.fog.color.copy(scene.background);
    scene.fog.density = gear ? .085 : .10;
    if (gear) rig.position.set(0, .18, 2.05);
    else if (fins) rig.position.set(0, 1.53, 1.25);
    else rig.position.set(0, .17, 2.43);
    const model = gear ? makeModel(equipment, lesson, scenario) : makeDiveModel(equipment, lesson, scenario);
    const targets = lens ? null : spatialTargets(lesson, model, scene);
    const panel = makePanel(lesson, following);
    const preview = gear ? makeInspectionPreview(model, station) : null;
    station.add(panel.mesh);
    return { lesson, scenario, gear, fins, inflator, model, targets, panel, preview, floor, lens };
  }
  let presentation = mount({ lesson, scenario, following });

  function unmount() {
    if (presentation) {
      const { targets, panel, preview, floor, lens } = presentation;
      presentation = null;
      targets?.dispose();
      preview?.dispose();
      for (const surface of [floor, lens]) {
        if (!surface) continue;
        surface.removeFromParent();
        surface.geometry.dispose();
        surface.material.dispose();
      }
      const { mesh } = panel;
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.map.dispose();
      mesh.material.dispose();
    }
    equipment.traverse(object => {
      if (object.isInstancedMesh) object.dispose();
      object.geometry?.dispose();
      const material = object.material;
      if (material?.map?.isCanvasTexture) material.map.dispose();
      if (material?.isShaderMaterial || material?.map?.isCanvasTexture) material.dispose();
    });
    equipment.clear();
  }

  const raycaster = new T.Raycaster();
  const origin = new T.Vector3();
  const direction = new T.Vector3();
  const yaw = new T.Euler(0, 0, 0, 'YXZ');
  const eye = new T.Vector3();
  let placed = false;
  let placing;
  let requestedRun;
  let holding;
  let inspecting;
  let finChoice;
  let reviewIndex = -1;
  let carry;
  const carriedPosition = new T.Vector3();
  const restingPosition = new T.Vector3();
  let pulse;
  let previousTime;
  const aim = controller => {
    if (!controller.visible || !placed || !presentation) return null;
    const { panel, targets } = presentation;
    const { mesh } = panel;
    controller.getWorldPosition(origin);
    direction.set(0, 0, -1).transformDirection(controller.matrixWorld);
    raycaster.set(origin, direction);
    const hit = raycaster.intersectObject(mesh)[0];
    const id = hit && panel.pick(hit);
    const target = reviewIndex < 0 && !example.active() && targets?.pick(raycaster);
    if (target && (!id || target.distance < hit.distance)) return target;
    return id ? { id, distance: hit.distance } : null;
  };
  let ending = false;
  function close() {
    if (ending) return;
    ending = true;
    session.end().catch(() => { ending = false; });
  }
  const pointers = [0, 1].map(index => {
    const controller = renderer.xr.getController(index);
    const geometry = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(0, 0, -1)]);
    const line = new T.Line(geometry, new T.LineBasicMaterial({ color: 0xc7fff3, transparent: true, depthTest: false }));
    line.renderOrder = 10;
    controller.add(line);
    rig.add(controller);
    let selected;
    let timed;
    function start() {
      const state = readState();
      const hit = aim(controller);
      selected = hit?.id;
      const step = state?.steps.find(action => action.id === selected);
      const part = (presentation?.fins || presentation?.gear) && presentation.model.grabbable[selected];
      if (part && hit?.spatial && !carry && !holding && step && step === state.steps[state.index]) {
        finChoice = undefined;
        placing = selected;
        const offset = part.getWorldPosition(new T.Vector3()).sub(raycaster.ray.at(hit.distance, carriedPosition));
        carry = { controller, part, distance: hit.distance, offset };
      }
      timed = Boolean(step?.pressTime);
      const fromFinMenu = !hit?.spatial && finRecallGroups[finChoice]?.actions[selected];
      if (step?.pressTime && !holding && (fromFinMenu || state.steps.indexOf(step) >= state.index) &&
        press.startHold(step, controller)) {
        holding = controller;
      }
    }
    function select() {
      if (!controller.visible) {
        end();
        return;
      }
      if (selected === 'exit') close();
      else if (selected === 'next-lesson') requestedRun = advanceToNext;
      else if ((selected === 'example-open' || selected === 'review-example') && !holding && !carry) {
        const state = readState();
        const step = selected === 'review-example' ? state?.review[reviewIndex] : undefined;
        if (selected === 'review-example' && !step) return;
        cancelInputs();
        inspecting = null;
        example.start(presentation.lesson, step ? state.steps.indexOf(step) : undefined, presentation.scenario);
      } else if (selected === 'example-back') {
        example.stop();
        previousTime = undefined;
      } else if (selected === 'example-prev') example.move(-1);
      else if (selected === 'example-next') example.move(1);
      else if (selected === 'example-play') example.toggle();
      else if (selected === 'example-recall' && example.active()) requestedRun = recallAfterExample;
      else if (selected === 'review-open' && readState()?.review.length) reviewIndex = 0;
      else if (selected === 'review-back') reviewIndex = -1;
      else if (selected === 'review-prev' && reviewIndex > 0) reviewIndex -= 1;
      else if (selected === 'review-next' && reviewIndex + 1 < readState()?.review.length) reviewIndex += 1;
      else if (selected === 'fin-cancel' && !holding && !carry) {
        finChoice = undefined;
        placing = null;
      } else if (carry?.controller === controller) {
        const target = aim(controller);
        carry = null;
        if (target?.dock) place(target.id);
      } else if (timed) {
        if (holding === controller) {
          holding = null;
          const index = readState()?.index;
          press.releaseHold(controller);
          if (readState()?.index !== index) finChoice = undefined;
        }
      } else if (selected && !holding && !carry) {
        const state = readState();
        if (!state) return;
        const expected = state.steps[state.index];
        const fromFinMenu = finRecallGroups[finChoice]?.actions[selected];
        if (fromFinMenu) finChoice = undefined;
        if (presentation.fins && !state.guide && finRecallGroups[selected]) {
          finChoice = selected;
        } else if (inspecting && (selected === 'normal' || selected === 'repair')) {
          apply(inspecting, selected);
          if (readState()?.index !== state.index) inspecting = null;
        } else if (expected?.inspection && expected.id === selected) {
          inspecting = selected;
        } else if (expected?.attachment && expected.id === selected) {
          if (fromFinMenu) finChoice = selected;
          else placing = selected;
        } else if (placing && presentation?.model.docks[selected]) {
          place(selected);
        } else if (selected === 'trim-add' || selected === 'trim-vent') {
          const adding = selected === 'trim-add';
          if (trim(adding ? 1 : -1)) pulse = { action: adding ? 'add-air' : 'vent', until: performance.now() + 220 };
        } else {
          const action = (presentation.gear || fromFinMenu) && state.steps.find(step => step.id === selected);
          apply(selected, action?.attachment?.dock || (action?.inspection ? 'normal' : undefined));
        }
      }
    }
    function end() {
      selected = null;
      if (carry?.controller === controller) {
        carry = null;
        placing = null;
      }
      if (holding === controller) {
        holding = null;
        press.cancel();
      }
    }
    const events = { selectstart: start, select, selectend: end, disconnected: end };
    for (const [name, listener] of Object.entries(events)) controller.addEventListener(name, listener);
    return { controller, line, end, events };
  });

  function place(dock) {
    const action = placing;
    placing = null;
    apply(action, dock);
  }
  function moveCarriedPart() {
    if (!carry?.controller.visible) return;
    const { controller, part, distance, offset } = carry;
    const target = aim(controller);
    raycaster.ray.at(target?.dock ? target.distance : distance, carriedPosition).add(offset);
    part.getWorldPosition(restingPosition);
    carriedPosition.sub(restingPosition).clampLength(0, 1.1).add(restingPosition);
    part.position.copy(part.parent.worldToLocal(carriedPosition));
  }
  function cancelInputs() {
    requestedRun = undefined;
    placing = null;
    finChoice = undefined;
    pulse = null;
    previousTime = undefined;
    pointers.forEach(pointer => pointer.end());
  }
  function visibilityChanged() {
    cancelInputs();
    if (session.visibilityState !== 'visible') example.pause();
  }
  session.addEventListener('visibilitychange', visibilityChanged);
  function reset() { placed = false; cancelInputs(); }
  let space;

  return {
    render(time, frame) {
      if (!frame || ending) return;
      let state = readState();
      if (!state) { close(); return; }
      if (session.visibilityState !== 'visible') return;
      if (!space) {
        space = renderer.xr.getReferenceSpace();
        space.addEventListener('reset', reset);
      }
      const pose = frame.getViewerPose(space);
      if (!pose) { cancelInputs(); return; }
      if (requestedRun) {
        const startRun = requestedRun;
        requestedRun = undefined;
        try {
          const next = startRun();
          if (next) {
            example.stop();
            cancelInputs();
            inspecting = null;
            reviewIndex = -1;
            if (next.lesson.scene !== presentation.lesson.scene) placed = false;
            unmount();
            presentation = mount(next);
            state = readState();
          }
        } catch {
          close();
          return;
        }
      }
      if (!presentation || !state) { close(); return; }
      const { lesson, gear, fins, inflator, lens, model, targets, panel, preview } = presentation;
      visor.position.copy(pose.transform.position);
      visor.quaternion.copy(pose.transform.orientation);
      if (!placed) {
        station.position.copy(visor.position);
        yaw.setFromQuaternion(visor.quaternion);
        station.rotation.y = yaw.y;
        if (targets) {
          stage.position.copy(visor.position).add(rig.position);
          stage.rotation.y = yaw.y;
          root.position.copy(rig.position).negate();
        }
        placed = true;
      }
      rig.updateMatrixWorld(true);
      const wasHolding = Boolean(holding);
      let hasController = false;
      for (const pointer of pointers) {
        if (pointer.controller.visible) hasController = true;
        else pointer.end();
      }
      if (holding) press.tickHold(holding, time);
      if (!hasController) example.pause();
      const current = wasHolding ? readState() : state;
      const demo = example.current();
      const reviewStep = current.review[reviewIndex];
      const applied = demo && demo.motion >= 1;
      const shownIndex = demo ? demo.index + Number(applied) : reviewStep ? current.steps.indexOf(reviewStep) : current.index;
      const motion = reduceMotion.matches ? 240 : time;
      completed.clear();
      for (let index = 0; index < shownIndex; index += 1) completed.add(current.steps[index].id);
      const effects = demo ? exampleEffects(demo) : null;
      const pressure = effects?.pressure ?? (reviewStep ? reviewPressure : current.pressure);
      if (lens) {
        const water = demo ? remainingMaskWater(lesson.maskFill, completed.has('mask-exhale'), pressure['mask-exhale']) :
          reviewStep ? lesson.maskFill : current.water;
        lens.material.uniforms.water.value = water;
        lens.material.uniforms.time.value = motion * .0012;
        if (demo) demo.amount = Math.round(water * 20) * 5;
      }
      if (demo && inflator) demo.amount = Math.round(inflatorAir(completed.has('add-air'), completed.has('vent'), pressure) * 20) * 5;
      const blending = (inflator || demo) && previousTime !== undefined && !reduceMotion.matches;
      const blend = blending ? 1 - Math.exp(-Math.min(time - previousTime, 100) / 75) : 1;
      previousTime = time;
      const active = effects?.active ?? (current.active || (pulse?.until > time ? pulse.action : ''));
      const focusStep = demo ? (applied ? null : demo.step) : reviewStep;
      const detail = gear ? (demo && !demo.complete ? demo.step.id : reviewStep?.id || inspecting) : undefined;
      model.update(completed, blend, motion, { active, pressure, detail });
      if (!fins && !gear) model.sync?.();
      targets?.update(current, placing, visor.getWorldPosition(eye), visor.quaternion, inspecting, focusStep, finChoice);
      moveCarriedPart();
      if (fins || gear) model.sync();
      preview?.show(detail);
      let hovered;
      for (const { controller, line } of pointers) {
        const hit = aim(controller);
        line.scale.z = hit?.distance || .84;
        hovered ??= hit?.id;
      }
      if (fins || gear || focusStep) targets?.highlight(hovered, Boolean(focusStep));
      panel.draw(current, hovered, placing, completed, inspecting, reviewIndex, demo, finChoice, hasController);
      renderer.render(scene, camera);
    },
    dispose() {
      cancelInputs();
      example.stop();
      session.removeEventListener('visibilitychange', visibilityChanged);
      space?.removeEventListener('reset', reset);
      for (const { controller, line, events } of pointers) {
        for (const [name, listener] of Object.entries(events)) controller.removeEventListener(name, listener);
        controller.remove(line);
        rig.remove(controller);
        line.geometry.dispose();
        line.material.dispose();
      }
      unmount();
    }
  };
}

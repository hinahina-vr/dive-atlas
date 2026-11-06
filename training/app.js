import { lessons, newPractice, choose, reveal, needsReview, lessonRoute, remainingMaskWater } from './lessons.js';
import { createPlacement } from './placement.js';
import { createPress } from './press.js';
import { createExample } from './example.js';
import { reviewKey, readReview, saveReview } from './reviews.js';
import { prepareOffline } from './offline.js';

const byId = id => document.getElementById(id);
const el = Object.fromEntries([
  'viewport', 'scene', 'hotspots', 'mask-overlay', 'perspective', 'lessons', 'guided', 'recall', 'view-label', 'view-subtitle', 'view-help',
  'rotate-left', 'rotate-right', 'reset-view', 'module-label', 'step-count', 'progress',
  'review-overview-status', 'review-next',
  'lesson-title', 'lesson-description', 'instruction', 'step-label', 'step-title', 'step-description',
  'mask-settings', 'mask-fill', 'recovery-methods', 'recovery-search', 'recovery-clear',
  'show-example', 'example-guide', 'example-caption', 'example-controls', 'example-prev', 'example-play',
  'example-next', 'example-recall', 'example-exit', 'previous-review', 'previous-review-count', 'previous-review-list', 'practice-footer',
  'inspection-panel', 'choices', 'placement-menu', 'dock-markers', 'grip-label', 'scene-feedback', 'effect-meter', 'feedback', 'result', 'result-heading', 'review', 'hint', 'reset', 'next-lesson', 'source-link'
].map(id => [id, byId(id)]));

let practice = newPractice(lessons[0], 'guided');
let hint = false;
let view;
let viewFailed = false;
let immersive = false;
let activePress = '';
let inspecting;
const marks = new Map();
const example = createExample({ render, frame: drawExample });
let stagedExample;
let practiceCamera;
const recent = new Map();
let storage;
try { storage = window.localStorage; } catch { /* Practice still works without storage. */ }
const placement = createPlacement({
  viewport: el.viewport,
  markers: el['dock-markers'],
  menu: el['placement-menu'],
  caption: el['grip-label'],
  choices: el.choices,
  onSelect: () => feedback(),
  onAttempt: apply,
  onGrip: (...args) => view?.grip(...args),
  onRelease: () => view?.releaseGrip()
});

const press = createPress({
  begin(action) {
    if (practice.lesson.actions[practice.index]?.id !== action.id) {
      apply(action.id);
      return null;
    }
    feedback();
    return practice.pressure[action.id] || 0;
  },
  change(action, value, active) {
    practice.pressure[action.id] = value;
    activePress = active ? action.id : '';
    refreshEffect();
  },
  complete(action, keyboard) { apply(action.id, keyboard); },
  interrupted(action) {
    const messages = {
      'mask-exhale': '水が残っています。もう一度、鼻から息を吐きましょう。',
      'add-air': '少しふくらみました。もう一度、給気ボタンを短く押します。',
      'trace-hose': 'ホースの途中です。そのままたどりましょう。',
      'reg-exhale': '中に水が残っています。口からもう一度息を吐きましょう。'
    };
    feedback(messages[action.id] || '途中で止まりました。ボタンを押して続けましょう。');
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (example.current()) {
    event.preventDefault();
    closeExample();
  } else if (inspecting) {
    event.preventDefault();
    closeInspection(true);
  } else if (placement.active()) {
    event.preventDefault();
    placement.clear(true);
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) example.pause(); });
window.addEventListener('storage', event => {
  if (event.storageArea !== storage) return;
  const changed = lessons.find(item => event.key === reviewKey(item));
  if (event.key === null) recent.clear();
  else if (changed) recent.delete(changed.id);
  else return;
  renderReviewOverview();
  if (!changed || changed.id === practice.lesson.id) renderHistory();
});

function button(label, className, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  if (onClick) element.addEventListener('click', onClick);
  return element;
}

function feedback(text = '', tone = '') {
  el.feedback.textContent = text;
  el.feedback.dataset.tone = tone;
  const sceneFeedback = el['scene-feedback'];
  sceneFeedback.hidden = !text || !view;
  sceneFeedback.textContent = text;
  sceneFeedback.dataset.tone = tone;
}

function closeInspection(restoreFocus = false) {
  const old = inspecting;
  inspecting = null;
  el['inspection-panel'].hidden = true;
  el['inspection-panel'].replaceChildren();
  if (old) el.choices.hidden = false;
  el.viewport.classList.remove('is-inspecting', 'has-detail');
  if (old) view?.focusDetail();
  old?.marker?.classList.remove('is-inspection-target');
  if (restoreFocus && old?.keyboard) old.source.focus({ preventScroll: true });
}

function openInspection(action, source, keyboard) {
  if (practice.lesson.actions[practice.index]?.id !== action.id) {
    apply(action.id, keyboard, 'normal');
    return;
  }
  feedback();
  const panel = el['inspection-panel'];
  const prompt = document.createElement('p');
  prompt.textContent = action.inspection.prompt;
  panel.replaceChildren(prompt);
  if (action.inspection.note) {
    const note = document.createElement('p');
    note.className = 'inspection-note';
    note.textContent = action.inspection.note;
    panel.append(note);
  }
  const closeUp = action.inspection.closeUp && view?.focusDetail(action.id);
  el.viewport.classList.toggle('has-detail', Boolean(closeUp));
  if (!view || (action.inspection.closeUp && !closeUp)) {
    const evidence = document.createElement('p');
    evidence.textContent = inspectionEvidence(action, practice.lesson, practice.scenario);
    panel.append(evidence);
  }
  for (const answer of ['normal', 'repair']) {
    const choice = button(action.inspection[answer], 'choice', event => apply(action.id, event.detail === 0, answer));
    choice.dataset.answer = answer;
    panel.append(choice);
  }
  panel.append(button('閉じる', 'quiet', () => closeInspection(true)));
  const marker = marks.get(action.anchor);
  inspecting = { source, keyboard, marker };
  marker?.classList.add('is-inspection-target');
  el.viewport.classList.add('is-inspecting');
  panel.hidden = false;
  el.choices.hidden = true;
  if (panel.getBoundingClientRect().top < 0 || panel.getBoundingClientRect().bottom > innerHeight) {
    panel.scrollIntoView({ block: 'nearest' });
  }
  if (keyboard) panel.querySelector('button').focus({ preventScroll: true });
}

function inspectionFault(action, lesson, scenario) {
  return lesson.scenarios[scenario].includes(action.id);
}

function inspectionEvidence(action, lesson, scenario) {
  return action.inspection.evidence[Number(inspectionFault(action, lesson, scenario))];
}

function exampleInspection(action, lesson, scenario) {
  const { inspection } = action;
  if (!inspection) return '';
  const note = inspection.note ? inspection.note + '。' : '';
  const result = inspectionFault(action, lesson, scenario) ? inspection.corrected : '';
  return note + inspectionEvidence(action, lesson, scenario) + (result || '');
}

function apply(id, fromKeyboard = false, dock) {
  const result = choose(practice, id, dock);
  if (!result) return;
  if (!result.ok) {
    const message = result.wrongInspection ? '器材の状態をもう一度見てください。' :
      result.wrongDock ? '位置が違います。器材の位置を見直しましょう。' :
      practice.mode === 'guided' ? '今の手順を先に試してみましょう。' : 'この場面では、先に別の操作があります。';
    feedback(message, 'retry');
    return;
  }
  hint = false;
  if (practice.mode === 'recall' && practice.index === practice.lesson.actions.length) {
    recent.set(practice.lesson.id, saveReview(storage, practice));
  }
  feedback(result.message);
  render();
  if (fromKeyboard) {
    const firstChoice = el.choices.querySelector('.is-guide') || el.choices.querySelector('.choice');
    (firstChoice || (el['next-lesson'].hidden ? el.reset : el['next-lesson'])).focus({ preventScroll: true });
  }
}

function start(lesson, mode) {
  example.stop();
  press.cancel();
  if (lesson.id !== practice.lesson.id) immersive = ['mask', 'recovery', 'inflator'].includes(lesson.scene);
  if (lesson.id === 'mask') el['mask-fill'].value = lesson.route || 'mask-partial';
  if (lesson.id === 'recovery') {
    const [search, clear] = (lesson.route || 'sweep-purge').split('-');
    el['recovery-search'].value = search;
    el['recovery-clear'].value = clear;
  }
  practice = newPractice(lesson, mode);
  hint = false;
  feedback();
  render();
}

function openLesson(lesson, mode = practice.mode) {
  const route = lesson.id === 'mask' ? el['mask-fill'].value :
    lesson.id === 'recovery' ? el['recovery-search'].value + '-' + el['recovery-clear'].value : undefined;
  start(lessonRoute(lesson, route), mode);
}

for (const control of ['mask-fill', 'recovery-search', 'recovery-clear']) {
  el[control].addEventListener('change', () => openLesson(practice.lesson));
}

const lessonIndex = lesson => lessons.findIndex(item => item.id === lesson.id);
const lessonButtons = lessons.map((lesson, i) => {
  const item = button('', 'lesson-button', () => {
    if (practice.lesson.id !== lesson.id) openLesson(lesson);
  });
  const number = document.createElement('span');
  number.className = 'lesson-number';
  number.textContent = String(i + 1).padStart(2, '0');
  number.setAttribute('aria-hidden', 'true');
  const name = document.createElement('span');
  name.className = 'lesson-name';
  name.textContent = lesson.tab || lesson.title;
  const status = document.createElement('span');
  status.className = 'lesson-status';
  status.id = 'review-state-' + lesson.id;
  item.setAttribute('aria-label', name.textContent);
  item.setAttribute('aria-describedby', status.id);
  item.append(number, name, status);
  el.lessons.append(item);
  return { item, status };
});

function latestReview(lesson) {
  if (!recent.has(lesson.id)) recent.set(lesson.id, readReview(storage, lesson));
  return recent.get(lesson.id);
}

function reviewOverview() {
  const records = lessons.map(latestReview);
  const complete = records.filter(Boolean).length;
  const needsWork = records.filter(record => record?.steps.length).length;
  const review = records.findIndex(record => record?.steps.length);
  const next = lessons[review >= 0 ? review : records.indexOf(null)];
  return { records, complete, needsWork, next };
}

function renderReviewOverview() {
  const { records, complete, needsWork, next } = reviewOverview();
  lessonButtons.forEach(({ item, status }, i) => {
    const record = records[i];
    const count = record?.steps.length || 0;
    const label = count ? '見直し ' + count + '項目' : record ? '復習済み' : '未復習';
    if (status.textContent !== label) status.textContent = label;
    item.dataset.review = count ? 'review' : record ? 'done' : 'new';
  });
  const summary = '自力復習 ' + complete + ' / ' + lessons.length + '種目' +
    (needsWork ? ' ・ 見直し ' + needsWork + '種目' : '');
  if (el['review-overview-status'].textContent !== summary) el['review-overview-status'].textContent = summary;
  const shortcut = el['review-next'];
  shortcut.hidden = !next || Boolean(example.current());
  shortcut.textContent = needsWork ? '見直す ›' : complete ? '未復習へ ›' : '自力復習を始める ›';
  shortcut.setAttribute('aria-controls', needsWork ? 'previous-review' : 'instruction');
}

el['review-next'].addEventListener('click', () => {
  const { next, needsWork } = reviewOverview();
  if (!next) return;
  const current = practice.lesson.id === next.id && !example.current();
  let destination = el.instruction;
  if (needsWork) {
    if (!current) openLesson(next);
    renderHistory(true);
    const history = el['previous-review'];
    history.open = true;
    destination = history.querySelector('summary');
  } else if (!current || practice.mode !== 'recall') {
    openLesson(next, 'recall');
  }
  destination.focus({ preventScroll: true });
  if (destination.getBoundingClientRect().top < 0 || destination.getBoundingClientRect().bottom > innerHeight) {
    destination.scrollIntoView({ block: 'center' });
  }
});

for (const mode of ['guided', 'recall']) {
  el[mode].addEventListener('click', () => {
    if (mode !== practice.mode || example.current()) start(practice.lesson, mode);
  });
}
el.hint.addEventListener('click', () => {
  if (!reveal(practice)) return;
  hint = true;
  feedback();
  render();
  el.choices.querySelector('.is-guide')?.focus({ preventScroll: true });
});
el.reset.addEventListener('click', () => start(practice.lesson, practice.mode));
el['next-lesson'].addEventListener('click', () => openLesson(lessons[lessonIndex(practice.lesson) + 1]));
el['rotate-left'].addEventListener('click', () => view?.rotate(-.44));
el['rotate-right'].addEventListener('click', () => view?.rotate(.44));
el['reset-view'].addEventListener('click', () => view?.resetCamera());
el.perspective.addEventListener('click', () => {
  immersive = !immersive;
  render();
});
el['show-example'].addEventListener('click', () => {
  if (example.current()) closeExample();
  else showExample();
});
el['example-prev'].addEventListener('click', () => example.move(-1));
el['example-next'].addEventListener('click', () => example.move(1));
el['example-play'].addEventListener('click', () => example.toggle());
el['example-exit'].addEventListener('click', closeExample);
el['example-recall'].addEventListener('click', () => {
  const lesson = example.current()?.lesson;
  if (!lesson) return;
  start(lesson, 'recall');
  el.recall.focus({ preventScroll: true });
  showViewport();
});

function showExample(stepIndex, scenario = practice.scenario, lesson = practice.lesson) {
  practiceCamera = view?.cameraPose();
  feedback();
  stagedExample = null;
  example.start(lesson, stepIndex, scenario);
  el['example-play'].focus({ preventScroll: true });
  showViewport();
}

function showViewport() {
  if (el.viewport.getBoundingClientRect().top < 0 || el.viewport.getBoundingClientRect().bottom > innerHeight) {
    el.viewport.scrollIntoView({ block: 'start' });
  }
}

function closeExample() {
  example.stop();
  render();
  view?.restoreCamera(practiceCamera);
  practiceCamera = null;
  el['show-example'].focus({ preventScroll: true });
}

function exampleUnderwater(lesson) {
  return Boolean(view) && lesson.scene !== 'gear';
}

function drawExample(state) {
  const { lesson, step, index, elapsed, time, motion, complete, scenario } = state;
  el['example-controls'].style.setProperty('--time', String(complete ? 1 : elapsed / time));
  const applied = motion >= 1;
  const changedStep = stagedExample?.index !== index || stagedExample?.lesson !== lesson || stagedExample?.scenario !== scenario || stagedExample?.view !== view;
  const changedPose = changedStep || stagedExample.applied !== applied;
  if (changedPose) {
    const done = lesson.actions.slice(0, index + Number(applied)).map(action => action.id);
    view?.show(lesson, done, exampleUnderwater(lesson), scenario);
    if (changedStep) view?.focusExample(step.id);
    stagedExample = { lesson, index, applied, view, done, scenario };
  }
  const moving = !complete && motion > 0 && motion < 1;
  if (step.pressTime || changedPose) {
    renderEffects(lesson, stagedExample.done, step.pressTime ? { [step.id]: motion } : {}, moving ? step.id : '');
  }
}

function drawExampleGuide(state, positions, docks) {
  const guide = el['example-guide'];
  const point = state.motion >= 1 || state.step.inspection?.closeUp ? null : positions[state.step.anchor];
  const dock = point && state.step.attachment ? docks[state.step.attachment.dock] : null;
  guide.toggleAttribute('hidden', !point && !dock);
  if (!point && !dock) return;
  const [line, sourceCircle, dockCircle] = guide.children;
  function circle(node, target) {
    node.toggleAttribute('hidden', !target);
    if (!target) return;
    node.setAttribute('cx', target.x);
    node.setAttribute('cy', target.y);
  }
  circle(sourceCircle, point);
  circle(dockCircle, dock);
  line.toggleAttribute('hidden', !point || !dock);
  if (point && dock) {
    line.setAttribute('x1', point.x);
    line.setAttribute('y1', point.y);
    line.setAttribute('x2', dock.x);
    line.setAttribute('y2', dock.y);
  }
}

function reviewRow(action, scenario, lesson = practice.lesson) {
  const row = document.createElement('li');
  const replay = button('この手順の見本を見る', 'quiet review-example', () => showExample(lesson.actions.indexOf(action), scenario, lesson));
  replay.setAttribute('aria-label', action.label + '手順の見本を見る');
  row.append(action.label + '。' + action.detail, replay);
  return row;
}

function renderHistory(showCompleted = false) {
  const { lesson, index } = practice;
  const detail = el['previous-review'];
  const record = latestReview(lesson);
  detail.hidden = !record || Boolean(example.current()) || (!showCompleted && index === lesson.actions.length);
  if (detail.hidden) return;
  if (detail.dataset.lesson !== lesson.id) detail.open = false;
  detail.dataset.lesson = lesson.id;
  el['previous-review-count'].textContent = record.steps.length ? '見直し ' + record.steps.length + '項目' : '見直しなし';
  const original = lessonRoute(lesson, record.route);
  const rows = original.actions.filter(action => record.steps.includes(action.id)).map(action => reviewRow(action, record.scenario, original));
  if (!rows.length) {
    const row = document.createElement('li');
    row.textContent = '前回はヒントなしですべての手順を思い出せました。';
    rows.push(row);
  }
  el['previous-review-list'].replaceChildren(...rows);
}

function project(positions, docks) {
  const state = example.current();
  if (state) {
    drawExampleGuide(state, positions, docks);
    return;
  }
  placement.project(docks);
  const taken = [];
  for (const [anchor, marker] of marks) {
    const point = positions[anchor];
    marker.hidden = !point || taken.some(({x, y}) => Math.hypot(point.x - x, point.y - y) < 37);
    if (marker.hidden) continue;
    taken.push(point);
    marker.style.left = point.x + 'px';
    marker.style.top = point.y + 'px';
  }
}

function refreshEffect() {
  const { lesson, pressure, index } = practice;
  renderEffects(lesson, lesson.actions.slice(0, index).map(action => action.id), pressure, activePress);
}

function renderEffects(lesson, done, pressure, active) {
  const has = id => done.includes(id);
  const clear = has('mask-exhale');
  const water = remainingMaskWater(lesson.maskFill ?? 0, clear, pressure['mask-exhale']);
  const air = has('vent') ? 0 : has('add-air') ? 1 - (pressure.vent || 0) : pressure['add-air'] || 0;
  const maskOverlay = el['mask-overlay'];
  maskOverlay.classList.toggle('is-pressed', active === 'mask-exhale');
  maskOverlay.classList.toggle('is-sealed', has('mask-hold') && !clear);
  maskOverlay.classList.toggle('is-clear', clear);
  maskOverlay.classList.toggle('is-flooded', water >= .98);
  maskOverlay.style.setProperty('--mask-water', (100 * water) + '%');
  const meter = el['effect-meter'];
  meter.hidden = !view || (lesson.scene !== 'mask' && lesson.scene !== 'inflator');
  const meterLabel = lesson.scene === 'mask' ? 'マスク内の水' : 'BCDのふくらみ';
  if (meter.firstElementChild.textContent !== meterLabel) meter.firstElementChild.textContent = meterLabel;
  meter.style.setProperty('--level', String(lesson.scene === 'mask' ? water : air));
  view?.interact(pressure, active);
}

function render() {
  closeInspection();
  press.cancel();
  placement.clear();
  const demo = example.current();
  const lesson = demo?.lesson || practice.lesson;
  const index = demo ? demo.index + Number(demo.complete) : practice.index;
  const mode = practice.mode;
  const useWater = demo ? exampleUnderwater(lesson) : Boolean(view) && immersive;
  const step = demo ? demo.step : lesson.actions[index];
  const done = lesson.actions.slice(0, index).map(action => action.id);
  const showGuide = Boolean(step && (mode === 'guided' || hint));
  const available = practice.choices.filter(action => !done.includes(action.id));

  for (const option of ['guided', 'recall']) el[option].setAttribute('aria-pressed', String(!demo && mode === option));
  lessonButtons.forEach(({ item }, i) => {
    if (lessons[i].id === lesson.id) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  el['view-label'].textContent = lesson.label;
  const waterLabels = {
    mask: done.includes('mask-exhale') ? 'マスク内の水が抜けた' : lesson.subtitle,
    recovery: lesson.subtitle,
    inflator: '水中 · 目盛りを目安に浮き沈みを見る',
    fins: '水面 · 足元を見る'
  };
  el['view-subtitle'].textContent = useWater ? waterLabels[lesson.scene] : lesson.subtitle;
  el.viewport.classList.toggle('is-water', useWater);
  el.viewport.classList.toggle('is-example', Boolean(demo));
  el['show-example'].setAttribute('aria-pressed', String(Boolean(demo)));
  el['show-example'].textContent = demo ? '見本を閉じる' : '▷ 見本を見る';
  el['view-help'].textContent = step?.pressTime ? (step.id === 'add-air' ? '目印を短く押す' : '目印を押し続ける') :
    step?.attachment ? 'ドラッグ／器材→目印をタップ' :
    immersive && ['sweep', 'reach'].includes(step?.id) ? 'ドラッグで右肩側を見る' :
    immersive && lesson.scene !== 'inflator' ? 'ドラッグで見回す' : 'ドラッグで回転';
  el.perspective.hidden = Boolean(demo) || !view || lesson.scene === 'gear';
  el.perspective.textContent = lesson.scene === 'inflator'
    ? (immersive ? '器材台で見る' : '水中で見る')
    : (immersive ? '模型で見る' : 'ダイバー視点');
  el.perspective.setAttribute('aria-pressed', String(immersive));
  const maskOverlay = el['mask-overlay'];
  maskOverlay.hidden = !useWater || lesson.scene !== 'mask';
  if (!demo) el['example-guide'].toggleAttribute('hidden', true);
  el['example-caption'].hidden = !demo || !view;
  el['example-controls'].hidden = !demo;
  el['practice-footer'].hidden = Boolean(demo);
  el.choices.hidden = Boolean(demo);
  el['module-label'].textContent = 'DRILL ' + String(lessonIndex(lesson) + 1).padStart(2, '0');
  const shownCount = demo && !demo.complete ? index + 1 : index;
  el['step-count'].textContent = String(shownCount).padStart(2, '0') + ' / ' + String(lesson.actions.length).padStart(2, '0');
  el.progress.setAttribute('aria-valuemax', lesson.actions.length);
  el.progress.setAttribute('aria-valuenow', index);
  el.progress.replaceChildren(...lesson.actions.map((_, i) => {
    const mark = document.createElement('span');
    mark.className = i < index ? 'done' : i === index ? 'current' : '';
    return mark;
  }));
  el['lesson-title'].textContent = lesson.title;
  el['lesson-description'].textContent = lesson.description;
  el['mask-settings'].hidden = lesson.id !== 'mask' || Boolean(demo);
  el['recovery-methods'].hidden = lesson.id !== 'recovery' || Boolean(demo);
  el['source-link'].href = lesson.source;
  el.hotspots.replaceChildren();
  marks.clear();
  renderReviewOverview();
  renderHistory();
  el.instruction.setAttribute('aria-live', demo ? 'polite' : 'off');
  if (demo) {
    el.result.hidden = true;
    el.instruction.hidden = false;
    el['step-label'].textContent = demo.complete ? '見本はここまで' : '見本 · ' + (demo.index + 1) + ' / ' + lesson.actions.length;
    el['step-title'].textContent = demo.complete ? '今度は自分で試す' : step.label;
    el['step-description'].textContent = demo.complete
      ? '同じ種目をヒントなしで練習できます。'
      : step.detail + exampleInspection(step, lesson, demo.scenario);
    el['example-caption'].firstElementChild.textContent = demo.complete ? '✓' : String(demo.index + 1).padStart(2, '0');
    el['example-caption'].lastElementChild.textContent = demo.complete ? '見本はここまで' : step.label;
    el['example-prev'].disabled = !demo.complete && demo.index === demo.first;
    el['example-next'].disabled = demo.complete;
    el['example-play'].textContent = demo.complete ? 'もう一度見る' : demo.paused ? '再生する' : '一時停止';
    drawExample(demo);
    return;
  }

  stagedExample = null;
  refreshEffect();
  el.instruction.hidden = !step;
  el.hint.hidden = !step || mode === 'guided' || hint;
  el['step-label'].textContent = showGuide ? (hint ? 'ヒント' : '次の操作') : '自力で復習';
  el['step-title'].textContent = showGuide ? step.label : '次は何をする？';
  el['step-description'].textContent = showGuide ? step.detail : (viewFailed ? '下の選択肢から操作を選んでください。' : '器材の目印か、下の選択肢から操作を選んでください。');
  const options = view && (lesson.docks || lesson.scene === 'mask') && mode === 'guided' && step ? [step] : available;
  el.choices.replaceChildren(...options.map((action, i) => {
    const guided = showGuide && action === step;
    const item = button('', 'choice' + (guided ? ' is-guide' : ''), view && action.pressTime ? null : event => {
      const keyboard = event.detail === 0;
      if (action.attachment) placement.select(action, { docks: lesson.docks, guided, source: item, keyboard });
      else if (action.inspection) openInspection(action, item, keyboard);
      else apply(action.id, keyboard);
    });
    if (view && action.pressTime) press.bind(item, action);
    item.dataset.action = action.id;
    const number = document.createElement('span');
    number.className = 'mark';
    number.textContent = guided ? '›' : String(i + 1).padStart(2, '0');
    number.setAttribute('aria-hidden', 'true');
    item.append(number, action.label);
    return item;
  }));

  if (!viewFailed) {
    const markerActions = showGuide ? [step, ...available.filter(action => action !== step)] : available;
    for (const action of markerActions) {
      if (marks.has(action.anchor)) continue;
      const guided = showGuide && action === step;
      const marker = button('', 'hotspot' + (guided ? ' is-guide' : ''), action.attachment || action.pressTime ? null : () => {
        if (action.inspection) openInspection(action, marker, false);
        else apply(action.id);
      });
      if (action.attachment) placement.bind(marker, action, { docks: lesson.docks, guided });
      if (action.pressTime) press.bind(marker, action);
      marker.dataset.part = action.id;
      marker.tabIndex = -1;
      marker.setAttribute('aria-label', action.label);
      marker.title = action.label;
      marker.hidden = true;
      marks.set(action.anchor, marker);
      el.hotspots.append(marker);
    }
  }

  el.result.hidden = Boolean(step);
  if (!step) {
    const review = needsReview(practice);
    el['result-heading'].textContent = review.length ? 'もう一度見ておきたい手順' : '練習完了';
    const item = document.createElement('li');
    item.textContent = mode === 'recall' ? 'ヒントを使わず、すべての手順を思い出せました。' :
      '一通り試せました。自力で復習するモードでもう一度試せます。';
    el.review.replaceChildren(...(review.length ? review.map(action => reviewRow(action)) : [item]));
    const next = lessons[lessonIndex(lesson) + 1];
    el['next-lesson'].hidden = !next;
    el['next-lesson'].textContent = lesson.id === 'gear' ? 'バディの器材を確認 ›' : next ? next.title + 'へ ›' : '';
  }
  view?.show(lesson, done, immersive, practice.scenario);
}

render();
prepareOffline(byId('offline-status'));
try {
  const { createView } = await import('./view.js');
  view = createView(el.scene, project);
  render();
} catch (error) {
  console.warn('Could not start the practice 3D view.', error);
  viewFailed = true;
  const message = document.createElement('p');
  message.className = 'scene-error';
  message.textContent = '3D表示を開けませんでした。操作の選択肢で手順を復習できます。';
  el.scene.replaceChildren(message);
  el['view-help'].hidden = true;
  for (const id of ['rotate-left', 'rotate-right', 'reset-view']) el[id].hidden = true;
  render();
}

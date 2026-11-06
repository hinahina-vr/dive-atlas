import { lessons, newPractice, choose, reveal, needsReview } from './lessons.js';
import { createPlacement } from './placement.js';

const byId = id => document.getElementById(id);
const el = Object.fromEntries([
  'viewport', 'scene', 'hotspots', 'mask-overlay', 'perspective', 'lessons', 'guided', 'recall', 'view-label', 'view-subtitle', 'view-help',
  'rotate-left', 'rotate-right', 'reset-view', 'module-label', 'step-count', 'progress',
  'lesson-title', 'lesson-description', 'instruction', 'step-label', 'step-title', 'step-description',
  'choices', 'placement-menu', 'dock-markers', 'grip-label', 'scene-feedback', 'feedback', 'result', 'result-heading', 'review', 'hint', 'reset', 'next-lesson', 'source-link'
].map(id => [id, byId(id)]));

let practice = newPractice(lessons[0], 'guided');
let hint = false;
let view;
let viewFailed = false;
let immersive = false;
const marks = new Map();
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

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && placement.active()) {
    event.preventDefault();
    placement.clear(true);
  }
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
  sceneFeedback.hidden = !text || !view || !practice.lesson.docks;
  sceneFeedback.textContent = text;
  sceneFeedback.dataset.tone = tone;
}

function apply(id, fromKeyboard = false, dock) {
  const result = choose(practice, id, dock);
  if (!result) return;
  if (!result.ok) {
    const message = result.wrongDock ? 'そこには付きません。取り付け先を見直しましょう。' :
      practice.mode === 'guided' ? '今の手順を先に試してみましょう。' : 'この場面では、先に別の操作があります。';
    feedback(message, 'retry');
    return;
  }
  hint = false;
  feedback(result.expected.done);
  render();
  if (fromKeyboard) {
    const firstChoice = el.choices.querySelector('.is-guide') || el.choices.querySelector('.choice');
    (firstChoice || (el['next-lesson'].hidden ? el.reset : el['next-lesson'])).focus({ preventScroll: true });
  }
}

function start(lesson, mode) {
  if (lesson !== practice.lesson) immersive = lesson.scene === 'mask' && Boolean(view);
  practice = newPractice(lesson, mode);
  hint = false;
  feedback();
  render();
}

const lessonButtons = lessons.map((lesson, i) => {
  const item = button('', 'lesson-button', () => {
    if (practice.lesson !== lesson) start(lesson, practice.mode);
  });
  const number = document.createElement('span');
  number.textContent = String(i + 1).padStart(2, '0');
  number.setAttribute('aria-hidden', 'true');
  item.append(number, lesson.tab || lesson.title);
  el.lessons.append(item);
  return item;
});

for (const mode of ['guided', 'recall']) {
  el[mode].addEventListener('click', () => {
    if (mode !== practice.mode) start(practice.lesson, mode);
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
el['next-lesson'].addEventListener('click', () => start(lessons[lessons.indexOf(practice.lesson) + 1], practice.mode));
el['rotate-left'].addEventListener('click', () => view?.rotate(-.44));
el['rotate-right'].addEventListener('click', () => view?.rotate(.44));
el['reset-view'].addEventListener('click', () => view?.resetCamera());
el.perspective.addEventListener('click', () => {
  immersive = !immersive;
  render();
});

function project(positions, docks) {
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

function render() {
  placement.clear();
  const { lesson, mode, index } = practice;
  const step = lesson.actions[index];
  const done = lesson.actions.slice(0, index).map(action => action.id);
  const showGuide = Boolean(step && (mode === 'guided' || hint));
  const available = practice.choices.filter(action => !done.includes(action.id));

  for (const option of ['guided', 'recall']) el[option].setAttribute('aria-pressed', String(mode === option));
  lessonButtons.forEach((item, i) => {
    if (lessons[i] === lesson) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  el['view-label'].textContent = lesson.label;
  const waterLabels = {
    mask: done.includes('mask-exhale') ? 'マスク内の水が抜けた' : 'マスク内に水が入った',
    recovery: '水中 · 右側にホース',
    inflator: '水中 · 目盛りを目安に浮き沈みを見る',
    fins: '水面 · 足元を見る'
  };
  el['view-subtitle'].textContent = immersive ? waterLabels[lesson.scene] : lesson.subtitle;
  el.viewport.classList.toggle('is-water', immersive);
  el['view-help'].textContent = step?.attachment ? 'ドラッグ／器材→取付先をタップ' :
    immersive && lesson.scene !== 'inflator' ? 'ドラッグで見回す' : 'ドラッグで回転';
  el.perspective.hidden = !view || lesson.scene === 'gear';
  el.perspective.textContent = lesson.scene === 'inflator' ? '水中で見る' : 'ダイバー視点';
  el.perspective.setAttribute('aria-pressed', String(immersive));
  const maskOverlay = el['mask-overlay'];
  maskOverlay.hidden = !immersive || lesson.scene !== 'mask';
  maskOverlay.style.setProperty('--mask-water', done.includes('mask-exhale') ? '0%' : '46%');
  el['module-label'].textContent = 'DRILL ' + String(lessons.indexOf(lesson) + 1).padStart(2, '0');
  el['step-count'].textContent = String(index).padStart(2, '0') + ' / ' + String(lesson.actions.length).padStart(2, '0');
  el.progress.setAttribute('aria-valuemax', lesson.actions.length);
  el.progress.setAttribute('aria-valuenow', index);
  el.progress.replaceChildren(...lesson.actions.map((_, i) => {
    const mark = document.createElement('span');
    mark.className = i < index ? 'done' : i === index ? 'current' : '';
    return mark;
  }));
  el['lesson-title'].textContent = lesson.title;
  el['lesson-description'].textContent = lesson.description;
  el['source-link'].href = lesson.source;
  el.instruction.hidden = !step;
  el.hint.hidden = !step || mode === 'guided' || hint;
  el['step-label'].textContent = showGuide ? (hint ? 'ヒント' : '次の操作') : '自力で復習';
  el['step-title'].textContent = showGuide ? step.label : '次は何をする？';
  el['step-description'].textContent = showGuide ? step.detail : (viewFailed ? '下の選択肢から操作を選んでください。' : '器材の目印か、下の選択肢から操作を選んでください。');
  const options = view && lesson.docks && mode === 'guided' && step ? [step] : available;
  el.choices.replaceChildren(...options.map((action, i) => {
    const guided = showGuide && action === step;
    const item = button('', 'choice' + (guided ? ' is-guide' : ''), event => {
      const keyboard = event.detail === 0;
      if (action.attachment) placement.select(action, { docks: lesson.docks, guided, source: item, keyboard });
      else apply(action.id, keyboard);
    });
    item.dataset.action = action.id;
    const number = document.createElement('span');
    number.className = 'mark';
    number.textContent = guided ? '›' : String(i + 1).padStart(2, '0');
    number.setAttribute('aria-hidden', 'true');
    item.append(number, action.label);
    return item;
  }));

  el.hotspots.replaceChildren();
  marks.clear();
  if (!viewFailed) {
    const markerActions = showGuide ? [step, ...available.filter(action => action !== step)] : available;
    for (const action of markerActions) {
      if (marks.has(action.anchor)) continue;
      const guided = showGuide && action === step;
      const marker = button('', 'hotspot' + (guided ? ' is-guide' : ''), action.attachment ? null : () => apply(action.id));
      if (action.attachment) placement.bind(marker, action, { docks: lesson.docks, guided });
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
    const entries = review.length ? review.map(action => action.label + '。' + action.detail) :
      [mode === 'recall' ? 'ヒントを使わず、すべての手順を思い出せました。' : '一通り試せました。自力で復習するモードでもう一度試せます。'];
    el.review.replaceChildren(...entries.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    const next = lessons[lessons.indexOf(lesson) + 1];
    el['next-lesson'].hidden = !next;
    el['next-lesson'].textContent = next ? next.title + 'へ ›' : '';
  }
  view?.show(lesson, done, immersive);
}

render();
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

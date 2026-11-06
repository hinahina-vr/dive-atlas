import { lessons, lessonRoute } from './lessons.js';

export const draftKey = 'dive-atlas.owd-draft.v1';

export function readDraft(storage) {
  try {
    const raw = JSON.parse(storage?.getItem(draftKey) || 'null');
    const base = lessons.find(lesson => lesson.id === raw?.lesson);
    if (!base || typeof raw.id !== 'string' || !raw.id || !['guided', 'recall'].includes(raw.mode)) return null;
    const lesson = lessonRoute(base, raw.route);
    if (lesson.route !== raw.route || typeof raw.immersive !== 'boolean') return null;
    const { actions, scenarios } = lesson;
    let scenario = raw.scenario;
    if (scenario === undefined && lesson.id === 'fins') scenario = raw.mode === 'guided' ? 'walkthrough' : 'ready';
    if (scenarios) {
      if (!Object.hasOwn(scenarios, scenario) || (raw.mode === 'guided') !== (scenario === 'walkthrough')) return null;
    } else if (scenario !== undefined) return null;
    if (!Array.isArray(raw.done) || raw.done.length >= actions.length ||
        !raw.done.every((id, i) => actions[i].id === id)) return null;
    const index = raw.done.length;
    const byId = new Map(actions.map(action => [action.id, action]));
    if (!Array.isArray(raw.choices) || raw.choices.length <= index ||
        new Set(raw.choices).size !== raw.choices.length || !raw.choices.every(id => byId.has(id)) ||
        !raw.done.every(id => raw.choices.includes(id))) return null;
    const choices = raw.choices.map(id => byId.get(id));
    choices.push(...actions.filter(action => !raw.choices.includes(action.id)));
    if (!Array.isArray(raw.missed) || !Array.isArray(raw.assisted)) return null;
    const visited = new Set(actions.slice(0, index + 1).map(action => action.id));
    const missed = new Set(raw.missed.filter(id => visited.has(id)));
    const assisted = new Set(raw.assisted.filter(id => visited.has(id)));
    const step = actions[index];
    const progress = (step.pressTime || step.balance) && Number.isFinite(raw.progress) && raw.progress > 0 && raw.progress <= 1
      ? raw.progress : 0;
    if (!index && !missed.size && !assisted.size && !progress) return null;
    const pressure = progress ? { [step.id]: progress } : {};
    const practice = { lesson, mode: raw.mode, choices, index, missed, assisted, pressure, scenario };
    return { id: raw.id, practice, immersive: raw.immersive };
  } catch {
    return null;
  }
}

export function saveDraft(storage, id, practice, immersive) {
  const { lesson, mode, index, missed, assisted, pressure, choices, scenario } = practice;
  const step = lesson.actions[index];
  if (!storage || !step) return false;
  const progress = pressure[step.id] || 0;
  if (!index && !missed.size && !assisted.size && !progress) return false;
  try {
    storage.setItem(draftKey, JSON.stringify({
      id, lesson: lesson.id, route: lesson.route, mode, immersive, scenario, progress,
      done: lesson.actions.slice(0, index).map(action => action.id),
      choices: choices.map(action => action.id), missed: [...missed], assisted: [...assisted]
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(storage, id) {
  try {
    if (readDraft(storage)?.id === id) storage.removeItem(draftKey);
  } catch {
    // The active exercise can still be reset or finished.
  }
}

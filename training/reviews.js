import { needsReview, lessonRoute } from './lessons.js';

const prefix = 'dive-atlas.owd-review.v1.';
export const reviewKey = lesson => prefix + lesson.id;

export const reviewReasonLabels = Object.freeze({
  retry: 'やり直し',
  hint: 'ヒントを見た',
  'retry-and-hint': 'やり直し・ヒント'
});

export function reviewReason({ missed, assisted }, step) {
  if (missed.has(step)) return assisted.has(step) ? 'retry-and-hint' : 'retry';
  return assisted.has(step) ? 'hint' : null;
}

export function readReview(storage, lesson) {
  try {
    const raw = JSON.parse(storage?.getItem(reviewKey(lesson)) || 'null');
    if (!raw || !Number.isSafeInteger(raw.completedAt) || raw.completedAt < 0 || !Array.isArray(raw.steps)) return null;
    const original = lessonRoute(lesson, raw.route);
    const steps = original.actions.filter(action => raw.steps.includes(action.id)).map(action => action.id);
    const record = { completedAt: raw.completedAt, steps };
    const reasons = {};
    for (const step of steps) {
      const reason = raw.reasons?.[step];
      if (typeof reason === 'string' && Object.hasOwn(reviewReasonLabels, reason)) reasons[step] = reason;
    }
    if (Object.keys(reasons).length) record.reasons = reasons;
    if (original.scenarios && Object.hasOwn(original.scenarios, raw.scenario)) record.scenario = raw.scenario;
    if (original.route) record.route = original.route;
    return record;
  } catch {
    return null;
  }
}

export function saveReview(storage, practice, now = Date.now()) {
  if (practice.mode !== 'recall' || practice.index !== practice.lesson.actions.length) return null;
  const steps = needsReview(practice).map(action => action.id);
  const record = { completedAt: now, steps };
  if (steps.length) record.reasons = Object.fromEntries(steps.map(step => [step, reviewReason(practice, step)]));
  if (practice.scenario) record.scenario = practice.scenario;
  if (practice.lesson.route) record.route = practice.lesson.route;
  try {
    storage?.setItem(reviewKey(practice.lesson), JSON.stringify(record));
  } catch {
    // The current run can still be reviewed in memory.
  }
  return record;
}

import { needsReview, lessonRoute } from './lessons.js';

const prefix = 'dive-atlas.owd-review.v1.';
export const reviewKey = lesson => prefix + lesson.id;

export function readReview(storage, lesson) {
  try {
    const raw = JSON.parse(storage?.getItem(reviewKey(lesson)) || 'null');
    if (!raw || !Number.isSafeInteger(raw.completedAt) || raw.completedAt < 0 || !Array.isArray(raw.steps)) return null;
    const original = lessonRoute(lesson, raw.route);
    const steps = original.actions.filter(action => raw.steps.includes(action.id)).map(action => action.id);
    const record = { completedAt: raw.completedAt, steps };
    if (original.scenarios && Object.hasOwn(original.scenarios, raw.scenario)) record.scenario = raw.scenario;
    if (original.route) record.route = original.route;
    return record;
  } catch {
    return null;
  }
}

export function saveReview(storage, practice, now = Date.now()) {
  if (practice.mode !== 'recall' || practice.index !== practice.lesson.actions.length) return null;
  const record = { completedAt: now, steps: needsReview(practice).map(action => action.id) };
  if (practice.scenario) record.scenario = practice.scenario;
  if (practice.lesson.route) record.route = practice.lesson.route;
  try {
    storage?.setItem(reviewKey(practice.lesson), JSON.stringify(record));
  } catch {
    // The current run can still be reviewed in memory.
  }
  return record;
}

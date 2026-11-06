import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const trainingFiles = [
  'training/index.html', 'training/style.css', 'training/app.js', 'training/lessons.js',
  'training/view.js', 'training/models.js', 'training/placement.js', 'training/press.js',
  'training/example.js', 'training/reviews.js', 'training/drafts.js', 'training/offline.js', 'training/xr-mask.js',
  'training/app.webmanifest', 'training/icon.svg', 'training/icon-192.png', 'training/icon-512.png'
];

export const trainingLibraries = ['three.module.js', 'three.core.js'];

export async function writeTrainingWorker(out) {
  const template = await readFile(new URL('./training-worker.js', import.meta.url), 'utf8');
  const paths = [...trainingFiles, ...trainingLibraries.map(file => 'vendor/' + file)];
  const entries = await Promise.all(paths.map(async path => {
    const bytes = await readFile(resolve(out, path));
    const hash = createHash('sha256').update(bytes).digest('base64');
    const url = path.startsWith('training/') ? './' + path.slice('training/'.length) : '../' + path;
    return [url, 'sha256-' + hash];
  }));
  const version = createHash('sha256').update(template).update(JSON.stringify(entries)).digest('hex').slice(0, 24);
  const marker = '/* OFFLINE_MANIFEST */ null';
  if (!template.includes(marker)) throw new Error('Missing the training worker manifest marker.');
  await writeFile(resolve(out, 'training/offline-worker.js'), template.replace(marker, JSON.stringify({ version, entries })));
  return version;
}

import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { diveSpots } from '../src/dive-spots.js';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, process.argv[2] || 'artifacts/pages');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const workingTreeChanges = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root }).length);
await mkdir(out, { recursive: true });
if ((await readdir(out)).length) throw new Error('Use an empty directory for the Pages build.');

const webFiles = [
 'style.css',
 'assets/NOTICE.txt',
 'assets/hibiscus-pink.png',
 'assets/map-style.json',
 'assets/okinawa-island-names.geojson',
 'src/app.js',
 'src/dive-spots.js',
 'src/map.js',
 'src/model.js',
 'src/ocean.js'
];
for (const file of webFiles) {
 await mkdir(resolve(out, file, '..'), { recursive: true });
 await cp(resolve(root, file), resolve(out, file));
}

const areaFolder = 'src/dive-areas';
await mkdir(resolve(out, areaFolder), { recursive: true });
for (const entry of await readdir(resolve(root, areaFolder), { withFileTypes: true })) {
 if (entry.isFile() && /^[a-z-]+\.js$/.test(entry.name)) {
  await cp(resolve(root, areaFolder, entry.name), resolve(out, areaFolder, entry.name));
 }
}

const html = await readFile(resolve(root, 'index.html'), 'utf8');
const localMode = 'name="dive-atlas-mode" content="local"';
if (!html.includes(localMode)) throw new Error('Missing the journal mode flag.');
await writeFile(resolve(out, 'index.html'), html.replace(localMode, 'name="dive-atlas-mode" content="published"'));
await mkdir(resolve(out, 'vendor'));
for (const file of ['maplibre-gl.mjs', 'maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs', 'maplibre-gl.css']) {
 await cp(resolve(root, 'node_modules/maplibre-gl/dist', file), resolve(out, 'vendor', file));
}
await cp(resolve(root, 'node_modules/maplibre-gl/LICENSE.txt'), resolve(out, 'vendor/maplibre-LICENSE.txt'));
await writeFile(resolve(out, 'revision.json'), JSON.stringify({revision,workingTreeChanges,spots:diveSpots.length})+'\n');
await writeFile(resolve(out, '.nojekyll'), '');
console.log(out);

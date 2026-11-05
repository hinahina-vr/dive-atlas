import { readFile, writeFile } from 'node:fs/promises';
import { publicJournal, readBackup } from '../src/model.js';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error('Usage: node scripts/export-public-journal.mjs source.json public-journal.json');
const logs = readBackup(JSON.parse(await readFile(source, 'utf8')));
await writeFile(destination, JSON.stringify(publicJournal(logs), null, 2)+'\n', { flag:'wx' });
console.log('Exported '+logs.length+' records with four approved fields.');

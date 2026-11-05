import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readBackup } from '../src/model.js';

const zip = process.env.TUSA_ZIP;
if (!zip) throw new Error('Specify TUSA_ZIP for a real local conversion check.');
mkdirSync('artifacts/private-import', { recursive:true });
const folder = mkdtempSync(resolve('artifacts/private-import', 'tusa-check-'));
const converted = resolve(folder,'journal.json');
const original = process.env.DIVE_ATLAS_IMPORT_FILE;
const locations = original ? resolve(original,'../locations.json') : '';
const args = ['-B','scripts/import-tusa.py','--input',zip,'--output',converted];
if (locations) args.push('--locations',locations);
execFileSync('python',args,{stdio:'inherit'});
const logs = readBackup(JSON.parse(readFileSync(converted,'utf8')));
assert(logs.length>0 && logs.every(log=>log.tusa?.original));
if (original) {
 const expected = readBackup(JSON.parse(readFileSync(original,'utf8')));
 assert.deepEqual(logs,expected);
}
console.log('Local TUSA ZIP conversion verified, '+logs.length+' records.');
process.env.DIVE_ATLAS_IMPORT_FILE = converted;
await import('./browser-check.mjs');

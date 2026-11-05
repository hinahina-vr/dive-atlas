import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diveSpots } from '../src/dive-spots.js';

test('the map catalog has one pin per named diving area', () => {
  for (const field of ['id', 'area']) {
    const values = diveSpots.map(spot => spot[field].normalize('NFKC').trim().replace(/\s+/g, ''));
    assert(values.every(Boolean), 'Each area needs a name and a stable identifier');
    assert.equal(new Set(values).size, diveSpots.length, 'Repeated ' + field);
  }
  assert.equal(new Set(diveSpots.map(spot => spot.coordinates.join(','))).size, diveSpots.length);
});

test('every public pin opens an attributed card with a valid rating', () => {
  for (const spot of diveSpots) {
    assert.equal(spot.coordinates.length, 2, spot.id);
    const [longitude, latitude] = spot.coordinates;
    assert(Number.isFinite(longitude) && Math.abs(longitude) <= 180, spot.id);
    assert(Number.isFinite(latitude) && Math.abs(latitude) <= 90, spot.id);
    assert(Number.isInteger(spot.difficulty) && spot.difficulty >= 1 && spot.difficulty <= 5, spot.id);
    for (const text of [spot.name, spot.highlight, spot.conditions, spot.sourceName]) {
      assert(typeof text === 'string' && text.trim(), spot.id);
    }
    assert.equal(new URL(spot.source).protocol, 'https:', spot.id);
  }
});

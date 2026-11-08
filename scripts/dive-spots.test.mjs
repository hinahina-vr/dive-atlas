import assert from 'node:assert/strict';
import { test } from 'node:test';
import { diveSpots } from '../src/dive-spots.js';

test('the map catalog has one pin per named diving area', () => {
  for (const field of ['id', 'area']) {
    const values = diveSpots.map(spot => spot[field].normalize('NFKC').trim().replace(/\s+/g, ''));
    assert(values.every(Boolean), 'Each area needs a name and a stable identifier');
    assert.equal(new Set(values).size, diveSpots.length, 'Repeated ' + field);
  }
  const positions = diveSpots.map(spot => spot.coordinates.map(value => value.toFixed(5)).join(','));
  assert.equal(new Set(positions).size, diveSpots.length, 'Repeated position at metre precision');
});

test('every public pin opens an attributed card with a valid rating', () => {
  for (const spot of diveSpots) {
    assert.equal(spot.coordinates.length, 2, spot.id);
    const [longitude, latitude] = spot.coordinates;
    assert(Number.isFinite(longitude) && Math.abs(longitude) <= 180, spot.id);
    assert(Number.isFinite(latitude) && Math.abs(latitude) <= 90, spot.id);
    assert(Number.isInteger(spot.difficulty) && spot.difficulty >= 1 && spot.difficulty <= 5, spot.id);
    assert(typeof spot.icon === 'string' && spot.icon && spot.icon !== 'goggles', spot.id + ' needs a themed icon');
    for (const text of [spot.name, spot.highlight, spot.conditions, spot.sourceName]) {
      assert(typeof text === 'string' && text.trim(), spot.id);
    }
    assert.equal(new URL(spot.source).protocol, 'https:', spot.id);
  }
});

test('the prohibited waters off Tsubota fishing port are excluded', () => {
  // The Miyake sea-use map explicitly excludes this ground from recreational diving.
  const restricted = diveSpots.find(spot =>
    spot.id === 'miyake-tsubota-offshore' || spot.name === '坪田漁港沖'
  );
  assert.equal(restricted, undefined);
});

test('historical Kozushima sites awaiting reopening confirmation are excluded', () => {
  // Aquamate's site list identified these three as normally closed to diving.
  const closed = new Set(['kozu-tongari', 'kozu-chitosemaru-reef', 'kozu-kurone-north']);
  assert.deepEqual(diveSpots.filter(spot => closed.has(spot.id)), []);
});

test('Yonaguni keeps the offshore Rokujo dive separate from the closed beach', () => {
  assert.equal(diveSpots.some(spot => spot.id === 'yonaguni-rokujo'), false);
  const offshore = diveSpots.find(spot => spot.id === 'yonaguni-rokujo-drop');
  assert.ok(offshore);
  assert.match(offshore.conditions, /ボート海域/);
  assert.match(offshore.conditions, /遊泳.*禁止/);
});

test('Miyagawa Bay renders a single marker for Tobine', () => {
  const sites = diveSpots.filter(spot => spot.area.includes('宮川湾') && spot.name.includes('トビ根'));
  assert.deepEqual(sites.map(spot => spot.id), ['miyagawa-tobine']);
  assert.equal(sites[0].source, 'https://miura-diving.com/diving-point/miyagawa-bay/');
});

test('Hedo Dome and Ginama Cave share one pin', () => {
  const sites = diveSpots.filter(spot =>
    spot.id === 'hedo-dome' || spot.id === 'kunigami-ginama-cave' ||
    spot.name.includes('辺戸岬ドーム') || spot.name.includes('宜名真海底鍾乳洞')
  );
  assert.deepEqual(sites.map(spot => spot.id), ['hedo-dome']);
  assert.match(sites[0].name, /辺戸岬ドーム.*宜名真海底鍾乳洞/);
});

const mappedCoastalSites = [
  // Small bounds within the diving area published by Odawara City.
  { id: 'hayakawa-beach', west: 139.1442, east: 139.1446, south: 35.2301, north: 35.2305 },
  { id: 'aka-agonomagari', west: 127.265, east: 127.268, south: 26.194, north: 26.197 },
  { id: 'tokashiku-beach', west: 127.344, east: 127.346, south: 26.185, north: 26.188 },
];

for (const { id, west, east, south, north } of mappedCoastalSites) {
  test(`${id} stays in the mapped coastal dive area`, () => {
    const spot = diveSpots.find(spot => spot.id === id);
    assert.ok(spot);
    const [longitude, latitude] = spot.coordinates;
    assert.ok(longitude >= west && longitude <= east, `longitude ${longitude}`);
    assert.ok(latitude >= south && latitude <= north, `latitude ${latitude}`);
  });
}

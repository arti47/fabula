// House-aid tables and the die (CLAUDE.md §2.2, §3.1).
import test from 'node:test';
import assert from 'node:assert/strict';
import { HOUSE_AID, SPARK_TABLES } from '../data-sparks.js';
import { randomInt } from '../src/core.js';
import { DIE_FACES } from '../data.js';

test('spark tables declare themselves a house aid', () => {
  assert.equal(HOUSE_AID, true);
});

test('every spark table has a label, a prompt and unique non-empty rows', () => {
  assert.ok(SPARK_TABLES.length >= 3);
  const ids = SPARK_TABLES.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const table of SPARK_TABLES) {
    assert.ok(table.label && table.prompt, `${table.id} needs a label and a prompt`);
    assert.ok(table.rows.length >= 10, `${table.id} is too short to feel random`);
    assert.equal(new Set(table.rows).size, table.rows.length, `${table.id} has duplicate rows`);
    for (const row of table.rows) {
      assert.ok(row.trim().length > 2, `${table.id} has a blank row`);
      // A spark is a fragment that feeds interpretation, not a finished sentence handed over.
      assert.ok(!row.endsWith('.'), `${table.id}: "${row}" reads as a finished sentence`);
      assert.ok(row.split(' ').length <= 8, `${table.id}: "${row}" is doing too much of the work`);
    }
  }
});

test('the die is uniform enough to defend', () => {
  // crypto-backed, with the modulo tail rejected. 60k rolls, each face within 5% of expected.
  const counts = Object.fromEntries(DIE_FACES.map((f) => [f, 0]));
  const n = 60000;
  for (let i = 0; i < n; i++) counts[DIE_FACES[randomInt(DIE_FACES.length)]]++;
  const expected = n / DIE_FACES.length;
  for (const face of DIE_FACES) {
    const drift = Math.abs(counts[face] - expected) / expected;
    assert.ok(drift < 0.05, `face ${face} came up ${counts[face]} times (${(drift * 100).toFixed(1)}% off)`);
  }
});

test('randomInt never returns out of range and refuses a bad bound', () => {
  for (let i = 0; i < 2000; i++) {
    const v = randomInt(6);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 6);
  }
  assert.throws(() => randomInt(0), RangeError);
});

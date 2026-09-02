// Spark-shape pass (docs/AUDIT.md cycle 5). The unit tests check each row in isolation; this reads
// the ~640 fragments as a body of writing and prints what only shows up in aggregate: the same
// phrase in two tables, a table that says one thing sixteen ways, words a 12-year-old would stumble
// on, and rows that have quietly become answers rather than prompts.
//
// A probe prints; it does not assert. Read the output and judge.
//
// Run: npm run sparks

import { INPUT_SPARKS, IDEA_SPARKS } from '../data-sparks.js';

const tables = {
  ...INPUT_SPARKS,
  ...Object.fromEntries(IDEA_SPARKS.map((t) => [`idea.${t.id}`, t.rows])),
};

const allRows = Object.entries(tables).flatMap(([key, rows]) => rows.map((row) => ({ key, row })));
console.log(`\nspark-shape — ${Object.keys(tables).length} tables, ${allRows.length} fragments\n`);

// 1. The same fragment in two tables. Fine within a table's own theme, suspect across tables.
const byRow = new Map();
for (const { key, row } of allRows) {
  const norm = row.toLowerCase();
  byRow.set(norm, [...(byRow.get(norm) || []), key]);
}
const shared = [...byRow.entries()].filter(([, keys]) => keys.length > 1);
console.log(`── repeated across tables: ${shared.length}`);
for (const [row, keys] of shared) console.log(`   "${row}" — ${keys.join(', ')}`);

// 2. A table that says one thing sixteen ways: how many rows share an opening word.
console.log('\n── tables leaning on one opening');
for (const [key, rows] of Object.entries(tables)) {
  const heads = {};
  for (const row of rows) {
    const head = row.split(' ')[0].toLowerCase();
    heads[head] = (heads[head] || 0) + 1;
  }
  const worst = Object.entries(heads).sort((a, b) => b[1] - a[1])[0];
  if (worst[1] >= 6) console.log(`   ${key.padEnd(22)} ${worst[1]}/${rows.length} start "${worst[0]}"`);
}

// 3. Words a 12-year-old might stumble on, and words that look like names.
const HARD = /\b\w{11,}\b/g;
const CAPS = /(?<!^)(?<![.!?"'‘“] )\b[A-Z][a-z]{2,}\b/g;
console.log('\n── long words');
for (const { key, row } of allRows) {
  const hits = row.match(HARD);
  if (hits) console.log(`   ${key.padEnd(22)} ${hits.join(', ')} — "${row}"`);
}
console.log('\n── capitalised mid-row (a name would be a rule break)');
for (const { key, row } of allRows) {
  const hits = row.match(CAPS);
  if (hits) console.log(`   ${key.padEnd(22)} ${hits.join(', ')} — "${row}"`);
}

// 4. Rows that have become answers: a subject and a verb and nothing left to decide.
console.log('\n── longest fragments (the ones most likely to be finished answers)');
[...allRows]
  .sort((a, b) => b.row.split(' ').length - a.row.split(' ').length)
  .slice(0, 12)
  .forEach(({ key, row }) => console.log(`   ${String(row.split(' ').length).padStart(2)} words  ${key.padEnd(22)} "${row}"`));

// 5. How much of the deck speaks to the story rather than in general.
const withNames = allRows.filter(({ row }) => /\{\w+\}/.test(row));
console.log(`\n── rows that use the story's own names: ${withNames.length} of ${allRows.length}`);
const byTable = {};
for (const { key } of withNames) byTable[key] = (byTable[key] || 0) + 1;
for (const [key, n] of Object.entries(byTable).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${key.padEnd(22)} ${n}`);
}
console.log('');

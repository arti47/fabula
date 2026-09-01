// Parse gate (CLAUDE.md §9 harness A): syntax-check every shipped file and fail by filename.
// A missing paren in a screen module does not throw in the browser — it presents as a screen
// that never renders. This check costs a second.
import { readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const files = [];

for (const f of readdirSync(root)) {
  if (f.endsWith('.js') && (f === 'data.js' || f.startsWith('data-'))) files.push(f);
}
if (existsSync(join(root, 'src'))) {
  for (const f of readdirSync(join(root, 'src'))) {
    if (f.endsWith('.js')) files.push(join('src', f));
  }
}

let failed = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', join(root, f)], { stdio: 'pipe' });
  } catch (err) {
    failed++;
    console.error(`FAIL ${f}\n${err.stderr?.toString().trim()}`);
  }
}

console.log(`parse gate: ${files.length - failed}/${files.length} files ok`);
process.exit(failed ? 1 : 0);

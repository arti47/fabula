// A probe prints; it does not assert (CLAUDE.md §9 D). Read the table and notice the outlier.
//
//   npm run probe                 # mid-story state
//   npm run probe -- stress       # what a shelf looks like after a term
//   npm run probe -- fresh 320    # one width

import { serve, launch, seed, ROUTES, WIDTHS } from './harness.mjs';

const [, , fixtureName = 'mid-story', onlyWidth] = process.argv;
const widths = onlyWidth ? [Number(onlyWidth)] : WIDTHS;

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await launch();

console.log(`\nprobe — fixture: ${fixtureName}\n`);

try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 740 } });
    await seed(context, fixtureName);
    const page = await context.newPage();

    console.log(`── ${width}px ${'─'.repeat(66)}`);
    console.log('route                              screens  ctrls  action@  minTap  overflow');

    for (const route of ROUTES) {
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#screen h2, #screen label, #screen p', { timeout: 5000 });
      await page.waitForTimeout(120); // let images settle before measuring

      const m = await page.evaluate(() => {
        const viewport = window.innerHeight;
        const height = document.documentElement.scrollHeight;
        const controls = document.querySelectorAll('#screen a, #screen button, #screen input, #screen textarea, #screen summary').length;
        const bar = document.querySelector('.action-bar');
        const targets = [...document.querySelectorAll('a, button, input, textarea, summary')]
          .filter((t) => t.offsetParent !== null && !t.classList.contains('skip-link'))
          .map((t) => Math.round(t.getBoundingClientRect().height))
          .filter((h) => h > 0);
        return {
          screens: (height / viewport).toFixed(1),
          controls,
          actionTop: bar ? Math.round(bar.getBoundingClientRect().top) : null,
          minTap: targets.length ? Math.min(...targets) : null,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      const flag = (value, bad) => (bad ? `${value}!` : `${value} `);
      console.log(
        route.padEnd(34),
        String(m.screens).padStart(6),
        String(m.controls).padStart(6),
        String(m.actionTop ?? '—').padStart(7),
        flag(String(m.minTap ?? '—').padStart(6), m.minTap !== null && m.minTap < 40),
        flag(String(m.overflow).padStart(7), m.overflow > 0),
      );
    }
    console.log('');
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log('screens = document height in viewports · action@ = action bar top offset (px)');
console.log('minTap  = smallest visible tap target · ! marks a number worth looking at\n');

// Foundational helpers. No imports (CLAUDE.md §5.1).

/** Create an element. Nullish children are skipped, so `el('p', {}, maybe && node)` is safe. */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  add(node, ...children);
  return node;
}

/** Append children, skipping nullish ones. Never `append(null)` — it renders the text "null". */
export function add(parent, ...children) {
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    parent.append(child);
  }
  return parent;
}

export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
  return node;
}

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

/** Cryptographic randomness. Never Math.random() — a table has to be able to believe the die. */
export function randomInt(maxExclusive) {
  if (maxExclusive <= 0) throw new RangeError('randomInt needs a positive bound');
  const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let n;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit); // reject the tail so every face stays equally likely
  return n % maxExclusive;
}

export function pick(list) {
  return list[randomInt(list.length)];
}

export function uid(prefix = 'id') {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return `${prefix}-${buf[0].toString(36)}${buf[1].toString(36)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

/** "3 minutes ago" / "2 days ago", for the story shelf. */
export function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

export function debounce(fn, ms = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function isBlank(value) {
  return value == null || String(value).trim() === '';
}

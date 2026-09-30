// Entry point: text size, the header's icons, the zoom lock, the service worker, the router.

import { getPrefs } from './store.js';
import { startRouter } from './router.js';
import { showToast, watchClamps } from './ui.js';
import { icon } from './icons.js';
import { lockZoom } from './zoom.js';

/** The header's own icons, and the toggle showing what it will switch you to. */
function paintHeaderIcons() {
  const settings = document.querySelector('[data-settings-icon]');
  if (settings) settings.replaceChildren(icon('settings'));
  const menu = document.querySelector('[data-menu-icon]');
  if (menu) menu.replaceChildren(icon('menu'));
}

export function applyPrefs() {
  const prefs = getPrefs();
  const root = document.documentElement;
  root.style.setProperty('--text-scale', String(prefs.textScale || 1));
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('service-worker.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('A new version is ready — reload to get it', 6000);
        }
      });
    });
  }).catch(() => { /* offline install is a bonus, never a blocker */ });
}

/**
 * S15 — keep the field you are typing in clear of the keyboard. When the on-screen keyboard opens
 * it shrinks the visual viewport and can land over the field; the field scrolls back into the
 * part you can see, clear of the pinned bar (its `scroll-margin` in the stylesheet).
 */
function keepFieldInView() {
  const vv = window.visualViewport;
  if (!vv) return;
  vv.addEventListener('resize', () => {
    const field = document.activeElement;
    if (!field || !field.matches('textarea, input[type="text"]')) return;
    const box = field.getBoundingClientRect();
    if (box.bottom > vv.height || box.top < 0) field.scrollIntoView({ block: 'nearest' });
  });
}

applyPrefs();
paintHeaderIcons();
lockZoom();
keepFieldInView();
watchClamps(document.querySelector('#screen'));
startRouter();
registerServiceWorker();

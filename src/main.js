// Entry point: theme, text size, service worker, router.

import { qs } from './core.js';
import { getPrefs, setPref } from './store.js';
import { startRouter } from './router.js';
import { showToast } from './ui.js';

function applyPrefs() {
  const prefs = getPrefs();
  const root = document.documentElement;
  if (prefs.theme === 'light' || prefs.theme === 'dark') root.setAttribute('data-theme', prefs.theme);
  else root.removeAttribute('data-theme');
  root.style.setProperty('--text-scale', String(prefs.textScale || 1));
}

function currentlyDark() {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit) return explicit === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function wireThemeToggle() {
  const button = qs('#theme-toggle');
  if (!button) return;
  button.addEventListener('click', () => {
    setPref('theme', currentlyDark() ? 'light' : 'dark');
    applyPrefs();
  });
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

applyPrefs();
wireThemeToggle();
startRouter();
registerServiceWorker();

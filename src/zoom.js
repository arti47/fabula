// The zoom lock (CLAUDE.md §4).
//
// `user-scalable=no, maximum-scale=1` in the viewport meta is honoured by Android browsers and
// ignored by iOS Safari, which has treated it as advisory since iOS 10. So the gestures have to be
// refused in JS as well, or the app is unpinchable on one phone and not the other.
//
// This incurs a real accessibility debt — pinch-zoom is how a low-vision reader copes — and the
// debt is paid in Settings: the text-size control scales the app's own type, which reflows instead
// of panning. Nothing here touches the browser's own zoom UI (a desktop menu, ⌘+), which stays
// available and is not a pinch.
//
// Double-tap-to-zoom is handled in CSS by `touch-action: manipulation` on the body, which iOS does
// honour. It is deliberately not re-implemented here: refusing a second touchend would also cancel
// the click on it, and a kid tapping "Roll again" twice quickly would lose the second roll.

const PINCH_GESTURES = ['gesturestart', 'gesturechange', 'gestureend'];

/** Refuse every pinch the page can see. Returns nothing; there is no unlock. */
export function lockZoom(target = document) {
  // iOS Safari's own pinch events, which fire whatever the meta tag says.
  for (const name of PINCH_GESTURES) {
    target.addEventListener(name, (event) => event.preventDefault(), { passive: false });
  }

  // Any browser: a second finger on the move is a pinch, not a scroll.
  target.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1) event.preventDefault();
  }, { passive: false });

  // A trackpad pinch, and ctrl/⌘ + wheel, arrive as a wheel event with the modifier set.
  target.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey) event.preventDefault();
  }, { passive: false });
}

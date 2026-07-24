/**
 * Holds the page at 1× scale.
 *
 * The viewport meta tag in index.html already pins the scale, and iOS honours it
 * when the app is installed to the home screen. In a plain Safari tab, though,
 * iOS deliberately ignores `user-scalable=no`, so pinching still works there.
 * These listeners close that gap: Safari fires its proprietary `gesture*` events
 * for a two-finger pinch, and cancelling them stops the zoom before it starts.
 *
 * Double-tap-to-zoom is handled in CSS (`touch-action: manipulation` on body),
 * and the desktop ctrl/⌘+scroll and keyboard zooms are left alone on purpose —
 * they are the browser's accessibility affordance, not a stray touch.
 */
export function lockZoom() {
  const cancel = (event: Event) => event.preventDefault();

  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, cancel, { passive: false });
  }
}

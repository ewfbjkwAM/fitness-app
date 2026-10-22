// Phone notification for running timers.
// Android shows a media notification (shade + lock screen) while a page is
// playing audio, so a near-silent looping track keeps one up, and the Media
// Session API fills in the text and the pause / skip / back buttons.
// Playing audio also stops Chrome from freezing the page in the background,
// which keeps the beeps going.

const supported = typeof navigator !== 'undefined' && 'mediaSession' in navigator;
let el = null;
let owner = null;

function quietTrack() {
  const rate = 8000; const secs = 10; const n = rate * secs;
  const buf = new ArrayBuffer(44 + n * 2); const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, (i % 2 ? 1 : -1), true); // inaudible
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

const ACTIONS = ['play', 'pause', 'nexttrack', 'previoustrack', 'seekforward', 'seekbackward', 'stop'];

// handlers: { play, pause, next, prev, forward, back, stop } — any may be missing
export function mediaStart(id, handlers) {
  owner = id;
  if (!supported) return;
  try {
    if (!el) { el = new Audio(quietTrack()); el.loop = true; el.volume = 0.01; }
    el.play().catch(() => {});
    const map = { play: handlers.play, pause: handlers.pause, nexttrack: handlers.next, previoustrack: handlers.prev, seekforward: handlers.forward, seekbackward: handlers.back, stop: handlers.stop };
    ACTIONS.forEach((a) => { try { navigator.mediaSession.setActionHandler(a, map[a] || null); } catch (e) { /* unsupported action */ } });
  } catch (e) { /* ignore */ }
}

let lastKey = '';
export function mediaUpdate(id, { title, artist, album, duration, position, playing }) {
  if (!supported || owner !== id) return;
  try {
    const key = `${title}|${artist}|${album}`;
    if (key !== lastKey) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title, artist, album,
        artwork: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
      });
      lastKey = key;
    }
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    if (duration > 0 && navigator.mediaSession.setPositionState) {
      navigator.mediaSession.setPositionState({ duration, position: Math.min(Math.max(0, position), duration), playbackRate: 1 });
    }
  } catch (e) { /* ignore */ }
}

export function mediaPlayState(id, playing) {
  if (!supported || owner !== id || !el) return;
  if (playing) el.play().catch(() => {}); // keep the page awake while running
}

export function mediaStop(id) {
  if (owner !== id) return;
  owner = null; lastKey = '';
  if (!supported) return;
  try {
    if (el) el.pause();
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    ACTIONS.forEach((a) => { try { navigator.mediaSession.setActionHandler(a, null); } catch (e) {} });
  } catch (e) { /* ignore */ }
}

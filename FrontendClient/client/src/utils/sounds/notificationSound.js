/**
 * Notification Sound Utility
 *
 * Browsers block ALL audio until the user interacts with the page (autoplay
 * policy). This module makes the notification bell sound work reliably by:
 *
 *  1. "Priming" audio on the first user gesture (click / keydown / touch):
 *     - creating + resuming a shared AudioContext
 *     - playing-and-pausing an <audio> element so it is unlocked for later
 *  2. When a notification arrives it tries, in order:
 *     a) WebAudio chime (works if the context is running)
 *     b) <audio> element playing /audio/notification-bells.mp3 (works once the
 *        element has been primed by any earlier gesture)
 *  3. If BOTH are blocked, the request is queued and automatically flushed the
 *     moment the user interacts with the page again — the sound is never
 *     silently dropped.
 */

const BELL_AUDIO_URL = '/audio/notification-bells.mp3';
const MIN_PLAY_INTERVAL_MS = 250;

let audioCtx = null;
let bellAudioEl = null;
let pendingPlays = 0;
let lastPlayedAt = 0;
let unlocked = false;

const getCtx = () => {
  if (audioCtx) return audioCtx;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
};

const ensureBellAudioEl = () => {
  try {
    if (!bellAudioEl) {
      bellAudioEl = new Audio(BELL_AUDIO_URL);
      bellAudioEl.preload = 'auto';
      bellAudioEl.volume = 0.7;
    }
    return bellAudioEl;
  } catch {
    return null;
  }
};

/** Soft two-tone WebAudio chime (audible volume). Returns true if it played. */
const chimeWithWebAudio = () => {
  const ctx = getCtx();
  if (!ctx || ctx.state !== 'running') return false;
  try {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    master.connect(ctx.destination);

    // Soft D5 -> A5 chime
    [[587.33, 0], [880, 0.09]].forEach(([frequency, offset]) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.9, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.26);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.28);
    });
    return true;
  } catch {
    return false;
  }
};

/** Fallback: play the bell mp3 via an <audio> element. Resolves to true/false. */
const chimeWithAudioElement = () => new Promise((resolve) => {
  try {
    const el = ensureBellAudioEl();
    if (!el) return resolve(false);
    el.currentTime = 0;
    const result = el.play();
    if (result && typeof result.then === 'function') {
      result.then(() => resolve(true)).catch(() => resolve(false));
    } else {
      resolve(true);
    }
  } catch {
    resolve(false);
  }
});

/**
 * Call this from inside real user-gesture handlers (click, keydown, touch).
 * Unlocks WebAudio + the mp3 element and flushes any sounds that were queued
 * while audio was still blocked.
 */
export const primeNotificationAudio = () => {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      if (ctx.state === 'running') unlocked = true;
    }).catch(() => {});
  } else if (ctx && ctx.state === 'running') {
    unlocked = true;
  }

  // Prime the <audio> element inside the gesture so later programmatic
  // play() calls are allowed even without a fresh gesture.
  const el = ensureBellAudioEl();
  if (el) {
    try {
      const result = el.play();
      if (result && typeof result.then === 'function') {
        result.then(() => {
          unlocked = true;
          el.pause();
          el.currentTime = 0;
        }).catch(() => { /* will retry on next gesture */ });
      } else {
        unlocked = true;
        el.pause();
        el.currentTime = 0;
      }
    } catch { /* will retry on next gesture */ }
  }

  // Flush sounds that arrived while audio was blocked.
  if (pendingPlays > 0) {
    pendingPlays = 0;
    setTimeout(() => playNotificationSound(), 80);
  }
};

/**
 * Play the notification sound. Safe to call from anywhere (socket handlers,
 * user gestures, timers). Never throws.
 */
export const playNotificationSound = () => {
  const now = Date.now();
  if (now - lastPlayedAt < MIN_PLAY_INTERVAL_MS) return;

  // 1) WebAudio chime
  if (chimeWithWebAudio()) {
    lastPlayedAt = now;
    pendingPlays = 0;
    return;
  }

  // 2) mp3 fallback element
  chimeWithAudioElement().then((played) => {
    if (played) {
      lastPlayedAt = Date.now();
      pendingPlays = 0;
    } else {
      // 3) Still blocked by the browser — queue it for the next gesture.
      pendingPlays += 1;
    }
  });
};

export const isAudioUnlocked = () => unlocked;

export default {
  playNotificationSound,
  primeNotificationAudio,
  isAudioUnlocked,
};

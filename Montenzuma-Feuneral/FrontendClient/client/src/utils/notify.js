/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RestPoint · Notification Toast Utility (framework-free, self-injecting)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Converted from the standalone "Notifications" HTML prototype into a
 *  reusable ES module. Styles + the fixed toast stack are injected into the
 *  document automatically on first use — no setup, provider, or <ToastContainer>
 *  required. All CSS is namespaced with the `ntf-` prefix to avoid collisions.
 *
 *  Icons use Font Awesome 6, which is already loaded globally in index.html.
 *
 *  Usage:
 *    import notify, { toast, dismissToast } from '../utils/notify';
 *
 *    notify.success('Changes saved', 'Your settings have been updated.');
 *    notify.error('Upload failed', 'File exceeds the 50 MB limit.');
 *    notify.warning('Session expiring', 'Your session ends in 5 minutes.');
 *    notify.info('Export ready', 'Your CSV file is ready to download.');
 *
 *    // Full control (same options as the prototype):
 *    toast({
 *      type: 'warn',                     // 'ok' | 'err' | 'warn' | 'inf'
 *      title: 'Unsaved changes',
 *      msg: 'You have 3 unsaved edits.',
 *      dur: 7000,                        // ms before auto-dismiss
 *      bar: true,                        // show progress bar
 *      pause: true,                      // pause timer on hover
 *      acts: [                           // action buttons
 *        { l: 'Save now', i: 'fas fa-check', p: true, onClick: save },
 *        { l: 'Discard', i: 'fas fa-trash' },
 *      ],
 *    });
 *
 *    notify.demo();   // fires one of everything (dev/QA helper)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const NTF_STYLE_ID = 'ntf-styles';
const NTF_STACK_ID = 'ntf-stack';

/* Icon markup per toast type */
const ICONS = {
  ok: '<i class="fas fa-check"></i>',
  err: '<i class="fas fa-xmark"></i>',
  warn: '<i class="fas fa-exclamation"></i>',
  inf: '<i class="fas fa-info"></i>',
};

/* Scoped stylesheet (namespaced from the original prototype) */
const CSS = `
#ntf-stack{
  --ntf-ok:#16a34a;--ntf-ok-s:rgba(22,163,74,.3);
  --ntf-err:#e11d48;--ntf-err-s:rgba(225,29,72,.3);
  --ntf-warn:#ea580c;--ntf-warn-s:rgba(234,88,12,.3);
  --ntf-inf:#0e3345;--ntf-inf-s:rgba(14,51,69,.3);
  position:fixed;top:24px;right:24px;z-index:9999;
  display:flex;flex-direction:column;gap:10px;
  width:390px;max-width:calc(100vw - 48px);
  pointer-events:none;
  font-family:'DM Sans','Space Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif;
}

.ntf-t{
  pointer-events:auto;box-sizing:border-box;
  position:relative;border-radius:14px;
  padding:15px 14px 13px 16px;
  color:#fff;overflow:hidden;
  transform:translateX(calc(100% + 48px));
  opacity:0;
  animation:ntf-slide-in .55s cubic-bezier(.16,1,.3,1) forwards;
}
.ntf-t.out{animation:ntf-slide-out .4s cubic-bezier(.4,0,1,1) forwards}

@keyframes ntf-slide-in{to{transform:translateX(0);opacity:1}}
@keyframes ntf-slide-out{
  0%{transform:translateX(0);opacity:1;max-height:180px;margin-bottom:0}
  100%{transform:translateX(calc(100% + 48px));opacity:0;max-height:0;margin-bottom:-10px;padding:0 14px;border-radius:14px}
}

.ntf-t.ntf-ok{background:var(--ntf-ok);box-shadow:0 10px 36px -6px var(--ntf-ok-s),0 4px 14px -4px rgba(0,0,0,.08)}
.ntf-t.ntf-err{background:var(--ntf-err);box-shadow:0 10px 36px -6px var(--ntf-err-s),0 4px 14px -4px rgba(0,0,0,.08)}
.ntf-t.ntf-warn{background:var(--ntf-warn);box-shadow:0 10px 36px -6px var(--ntf-warn-s),0 4px 14px -4px rgba(0,0,0,.08)}
.ntf-t.ntf-inf{background:var(--ntf-inf);box-shadow:0 10px 36px -6px var(--ntf-inf-s),0 4px 14px -4px rgba(0,0,0,.08)}

.ntf-t::before{
  content:'';position:absolute;top:0;left:0;right:0;height:45%;
  background:linear-gradient(180deg,rgba(255,255,255,.12) 0%,transparent 100%);
  border-radius:14px 14px 0 0;pointer-events:none;
}

.ntf-row{display:flex;align-items:flex-start;gap:12px;position:relative;z-index:1}

.ntf-ic{
  width:32px;height:32px;border-radius:9px;flex-shrink:0;
  background:rgba(255,255,255,.18);
  display:flex;align-items:center;justify-content:center;
  font-size:13px;color:#fff;
  transition:transform .3s cubic-bezier(.16,1,.3,1),background .2s ease;
  animation:ntf-icon-pop .35s .4s cubic-bezier(.16,1,.3,1) both;
}
.ntf-t:hover .ntf-ic{transform:scale(1.08);background:rgba(255,255,255,.26)}

@keyframes ntf-icon-pop{
  0%{transform:scale(0);opacity:0}
  60%{transform:scale(1.15)}
  100%{transform:scale(1);opacity:1}
}

.ntf-body{flex:1;min-width:0}
.ntf-ttl{font-size:13px;font-weight:700;line-height:1.35;margin-bottom:1px;letter-spacing:-.01em}
.ntf-msg{font-size:12px;line-height:1.55;opacity:.78;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

.ntf-x{
  width:24px;height:24px;border-radius:7px;border:none;padding:0;
  background:transparent;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  color:rgba(255,255,255,.4);flex-shrink:0;margin-top:-2px;
  transition:all .15s ease;font-size:11px;
}
.ntf-x:hover{background:rgba(255,255,255,.15);color:#fff}

.ntf-acts{display:flex;gap:8px;margin-top:10px;padding-left:44px;position:relative;z-index:1}
.ntf-btn{
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 13px;border-radius:8px;
  font-size:11px;font-weight:600;font-family:inherit;
  cursor:pointer;border:none;transition:all .15s ease;color:#fff;
}
.ntf-btn.pri{background:rgba(255,255,255,.2)}
.ntf-btn.pri:hover{background:rgba(255,255,255,.32)}
.ntf-btn.gho{background:transparent;opacity:.65}
.ntf-btn.gho:hover{opacity:1;background:rgba(255,255,255,.1)}
.ntf-btn i{font-size:9px}

.ntf-bar{position:absolute;bottom:0;left:0;right:0;height:2.5px;background:rgba(0,0,0,.08);z-index:2}
.ntf-bar-f{height:100%;background:rgba(255,255,255,.35);transform-origin:left;animation:ntf-shrink linear forwards}
@keyframes ntf-shrink{from{transform:scaleX(1)}to{transform:scaleX(0)}}

@media(max-width:560px){
  #ntf-stack{right:10px;width:calc(100vw - 20px)}
}
`;

let stylesInjected = false;

/** Inject the stylesheet once (idempotent, HMR-safe). */
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  if (!document.getElementById(NTF_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = NTF_STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  stylesInjected = true;
}

/** Get (or lazily create) the fixed toast stack container. */
function ensureStack() {
  ensureStyles();
  let stack = document.getElementById(NTF_STACK_ID);
  if (!stack) {
    stack = document.createElement('div');
    stack.id = NTF_STACK_ID;
    stack.setAttribute('role', 'region');
    stack.setAttribute('aria-label', 'Notifications');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  return stack;
}

/**
 * Dismiss (animate out + remove) a toast element.
 * Safe to call multiple times / on already-closing toasts.
 * @param {HTMLElement|null} el - element returned by toast()
 */
export function dismissToast(el) {
  if (!el || !el.classList || el.classList.contains('out')) return;
  clearTimeout(el._ntfTimer);
  el.classList.add('out');
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

/** Dismiss every visible toast. */
export function dismissAllToasts() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll(`#${NTF_STACK_ID} .ntf-t`).forEach(dismissToast);
}

/**
 * Fire a toast notification.
 * @param {object}  [opts]
 * @param {'ok'|'err'|'warn'|'inf'} [opts.type='inf'] - toast style
 * @param {string}  [opts.title='']     - bold headline
 * @param {string}  [opts.msg='']       - secondary message (clamped to 2 lines)
 * @param {number}  [opts.dur=4500]     - ms before auto-dismiss
 * @param {Array}   [opts.acts=null]    - [{ l:label, i?:faClass, p?:primary, onClick?:fn }]
 * @param {boolean} [opts.bar=true]     - show countdown progress bar
 * @param {boolean} [opts.pause=true]   - pause auto-dismiss while hovered
 * @returns {HTMLElement|null} the toast element (pass to dismissToast)
 */
export function toast({
  type = 'inf',
  title = '',
  msg = '',
  dur = 5500,
  acts = null,
  bar = true,
  pause = true,
} = {}) {
  /* No-DOM guard (SSR / tests): never crash the caller */
  if (typeof document === 'undefined') {
    console.warn('[notify] No DOM available — toast skipped:', title || '(untitled)');
    return null;
  }

  const stack = ensureStack();
  const el = document.createElement('div');
  el.className = `ntf-t ntf-${type}`;
  el.setAttribute('role', 'status');

  /* Header row: icon + title/message + close button.
     Title/msg use textContent (never innerHTML) → XSS-safe. */
  const row = document.createElement('div');
  row.className = 'ntf-row';

  const icon = document.createElement('div');
  icon.className = 'ntf-ic';
  icon.innerHTML = ICONS[type] || ICONS.inf;

  const body = document.createElement('div');
  body.className = 'ntf-body';

  const ttl = document.createElement('div');
  ttl.className = 'ntf-ttl';
  ttl.textContent = title;
  body.appendChild(ttl);

  if (msg) {
    const message = document.createElement('div');
    message.className = 'ntf-msg';
    message.textContent = msg;
    body.appendChild(message);
  }

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ntf-x';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.innerHTML = '<i class="fas fa-xmark"></i>';
  closeBtn.addEventListener('click', () => dismissToast(el));

  row.append(icon, body, closeBtn);
  el.appendChild(row);

  /* Optional action buttons (e.g. Undo / Save now / Discard).
     Buttons close the toast; a provided onClick runs first. */
  if (Array.isArray(acts) && acts.length) {
    const actsRow = document.createElement('div');
    actsRow.className = 'ntf-acts';

    acts.forEach((action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ntf-btn ${action.p ? 'pri' : 'gho'}`;
      btn.innerHTML = `${action.i ? `<i class="${action.i}"></i> ` : ''}${action.l}`;
      btn.addEventListener('click', () => {
        if (typeof action.onClick === 'function') action.onClick();
        dismissToast(el);
      });
      actsRow.appendChild(btn);
    });

    el.appendChild(actsRow);
  }

  /* Optional countdown progress bar */
  if (bar) {
    const barWrap = document.createElement('div');
    barWrap.className = 'ntf-bar';
    const fill = document.createElement('div');
    fill.className = 'ntf-bar-f';
    fill.style.animationDuration = `${dur}ms`;
    barWrap.appendChild(fill);
    el.appendChild(barWrap);
  }

  stack.appendChild(el);

  /* Auto-dismiss + pause-on-hover behaviour (matches the prototype) */
  el._ntfTimer = setTimeout(() => dismissToast(el), dur);

  if (pause) {
    el.addEventListener('mouseenter', () => {
      clearTimeout(el._ntfTimer);
      const fill = el.querySelector('.ntf-bar-f');
      if (fill) fill.style.animationPlayState = 'paused';
    });
    el.addEventListener('mouseleave', () => {
      const fill = el.querySelector('.ntf-bar-f');
      if (fill) fill.style.animationPlayState = 'running';
      el._ntfTimer = setTimeout(() => dismissToast(el), 2500);
    });
  }

  return el;
}

/* ─── Convenience API ────────────────────────────────────────────────────── */

const TYPE_LABELS = { ok: 'Success', err: 'Error', warn: 'Warning', inf: 'Info' };

/**
 * Grouped notifier: notify.success / error / warning / info / custom /
 * dismiss / dismissAll / demo. Every fire method returns the toast element.
 */
export const notify = {
  /** @returns {HTMLElement|null} */
  success: (title, msg = '', opts = {}) => toast({ type: 'ok', title, msg, ...opts }),
  /** Alias for success(). @returns {HTMLElement|null} */
  ok: (title, msg = '', opts = {}) => toast({ type: 'ok', title, msg, ...opts }),
  /** @returns {HTMLElement|null} */
  error: (title, msg = '', opts = {}) => toast({ type: 'err', title, msg, ...opts }),
  /** Alias for error(). @returns {HTMLElement|null} */
  err: (title, msg = '', opts = {}) => toast({ type: 'err', title, msg, ...opts }),
  /** @returns {HTMLElement|null} */
  warning: (title, msg = '', opts = {}) => toast({ type: 'warn', title, msg, ...opts }),
  /** Alias for warning(). @returns {HTMLElement|null} */
  warn: (title, msg = '', opts = {}) => toast({ type: 'warn', title, msg, ...opts }),
  /** @returns {HTMLElement|null} */
  info: (title, msg = '', opts = {}) => toast({ type: 'inf', title, msg, ...opts }),
  /** Alias for info(). @returns {HTMLElement|null} */
  inf: (title, msg = '', opts = {}) => toast({ type: 'inf', title, msg, ...opts }),
  /**
   * Fire a toast with an explicit type string ('ok'|'err'|'warn'|'inf').
   * @returns {HTMLElement|null}
   */
  custom: (type, title, msg = '', opts = {}) => toast({ type, title, msg, ...opts }),
  /** Dismiss a single toast element returned by any notify method. */
  dismiss: dismissToast,
  /** Dismiss every visible toast. */
  dismissAll: dismissAllToasts,
  /**
   * Dev/QA helper — fires one toast of each type staggered, then an
   * "undo" flow example. Replaces the old demo page buttons.
   */
  demo() {
    ['ok', 'err', 'warn', 'inf'].forEach((type, i) =>
      setTimeout(
        () =>
          toast({
            type,
            title: TYPE_LABELS[type],
            msg: `This is the "${TYPE_LABELS[type]}" toast style.`,
          }),
        i * 200
      )
    );
    setTimeout(
      () =>
        toast({
          type: 'ok',
          title: 'Item deleted',
          msg: 'The record has been permanently removed.',
          dur: 7000,
          acts: [
            {
              l: 'Undo',
              i: 'fas fa-rotate-left',
              p: true,
              onClick: () =>
                toast({ type: 'ok', title: 'Item restored', msg: 'The record has been put back.' }),
            },
          ],
        }),
      900
    );
  },
};

export default notify;



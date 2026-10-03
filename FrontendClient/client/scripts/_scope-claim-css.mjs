/* One-off transform: prefix every selector in the claim form's stylesheet with
   `.amani-claimform` so it cannot leak into the host app. Replaces the
   @scope() wrapper, which some browsers silently ignore — when that happens
   the ENTIRE sheet is dropped and the raw "No file chosen" file inputs show. */
import { readFileSync, writeFileSync } from 'node:fs';

const FILE =
  'C:/Users/User/Downloads/restpoint/FrontendClient/client/src/modules/insurance/amani/claimAplication.jsx';

const SRC = readFileSync(FILE, 'utf8');
const START = SRC.indexOf('const styles = `');
if (START === -1) throw new Error('could not find styles declaration');

const OPEN = START + 'const styles = `'.length;
const CLOSE = SRC.indexOf('`;', OPEN);
if (CLOSE === -1) throw new Error('could not find closing backtick');

const css = SRC.slice(OPEN, CLOSE);
const SCOPE = '.amani-claimform';

/* Prefix a comma-separated selector list. `:root` becomes the scoping element
   so the custom properties land on the form, `*` becomes a descendant. */
function prefix(sel) {
  return sel
    .split(',')
    .map((s) => {
      const t = s.trim();
      if (!t) return t;
      if (t === ':root') return SCOPE;
      if (t === '*') return `${SCOPE} *`;
      if (t.startsWith(SCOPE)) return t;
      return `${SCOPE} ${t}`;
    })
    .join(', ');
}

let out = '';
let buf = '';
let i = 0;

while (i < css.length) {
  const ch = css[i];

  /* Skip CSS comments so braces inside them are never treated as blocks. */
  if (ch === '/' && css[i + 1] === '*') {
    const end = css.indexOf('*/', i + 2);
    const stop = end === -1 ? css.length : end + 2;
    out += css.slice(i, stop);
    i = stop;
    continue;
  }

  if (ch === '{') {
    const sel = buf.trim();
    buf = '';

    /* `body { ... }` restyles the whole application — drop it entirely. The
       host app already owns the page background and base font. */
    if (sel === 'body') {
      let depth = 1;
      i++;
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') depth--;
        i++;
      }
      continue;
    }

    /* Keep at-rules (@media) intact — their inner selectors are prefixed as the
       walk continues into them. */
    if (sel.startsWith('@')) {
      out += `${sel} {`;
    } else {
      out += `${prefix(sel)} {`;
    }
    i++;
    continue;
  }

  if (ch === '}') {
    /* CRITICAL: emit the buffered declarations before the closing brace. The
       first version of this script dropped them, collapsing every rule to `{}`. */
    out += buf + '}';
    buf = '';
    i++;
    continue;
  }

  buf += ch;
  i++;
}

writeFileSync(FILE, SRC.slice(0, OPEN) + out + SRC.slice(CLOSE), 'utf8');
console.log('rewrote stylesheet:', out.length, 'chars');
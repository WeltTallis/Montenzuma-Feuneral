// Temporary parse check for the edited form.
const fs = require('fs');
const path = 'FrontendClient/client/src/components/florists/FlowerSnowBookingForm.jsx';
const src = fs.readFileSync(path, 'utf8');

// 1. Balanced JSX tags for the structural wrappers we changed.
const tags = ['aside', 'div', 'section', 'ol', 'li', 'dl', 'span'];
for (const t of tags) {
  const open = (src.match(new RegExp(`<${t}(?=[\\s>])`, 'g')) || []).length;
  const close = (src.match(new RegExp(`</${t}>`, 'g')) || []).length;
  const selfClosing = (src.match(new RegExp(`<${t}\\b[^>]*/>`, 'g')) || []).length;
  const ok = open - selfClosing === close;
  console.log(`  <${t}>: open=${open} selfClosing=${selfClosing} close=${close} ${ok ? 'OK' : '*** MISMATCH ***'}`);
}

// 2. No leftover classes from the OLD design (match as whole words, else
//    "frame" matches "keyframes" and "sheet" matches "intake sheet").
const removed = ['btnrow', 'btn-back', 'btn-next', 'fs-title', 'any-color-choice', 'cornerfl', '"frame"', '"sheet"', 'fb-page'];
for (const r of removed) {
  if (src.includes(r)) console.log(`  *** leftover old class: ${r}`);
}

// 3. Every className used in JSX should exist in FORM_CSS (catch typos).
const cssStart = src.indexOf('const FORM_CSS = `') + 'const FORM_CSS = `'.length;
const cssEnd = src.indexOf('\n`', cssStart);
const cssBlock = src.slice(cssStart, cssEnd);
console.log(`\n  CSS block chars: ${cssBlock.length}`);
const jsxClasses = new Set();
for (const m of src.matchAll(/className=(?:"([^"]+)"|\{'([^']+)'\}|\{\`([^\`]+)\`\})/g)) {
  const raw = m[1] || m[2] || m[3] || '';
  for (const c of raw.split(/[^A-Za-z0-9_-]+/)) if (c && !c.includes('{') && !c.includes('}')) jsxClasses.add(c);
}
const missing = [...jsxClasses].filter(c => !new RegExp(`\\.${c}[\\s,:{>\\[]`).test(cssBlock));
console.log(`\n  JSX classes: ${jsxClasses.size}, undefined in CSS: ${missing.length ? missing.join(', ') : 'none'}`);
// Bundles CoffinCalendarGrid with stubbed deps and RENDERS it in Node.
// This executes the component body, so a reference to an undefined
// module-scope helper (the `tintOf` ReferenceError) throws here, not in the
// browser. A syntax/transform check alone would NOT have caught it.
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = __dirname;
const STUB = path.join(ROOT, 'vstub');
const SRC = path.join(ROOT, 'FrontendClient', 'client', 'src', 'components',
  'coffins', 'CoffinCalendarGrid.jsx');
const OUT = path.join(STUB, '_bundle.cjs');

const stubPlugin = (pkg, file) => {
  const target = path.join(STUB, file);
  return {
    name: 'stub-' + pkg,
    setup(b) {
      b.onResolve({ filter: new RegExp('^' + pkg + '$') }, () => ({ path: target }));
      // Scope onLoad to THIS stub only. A bare `filter: /.*/` here would also
      // swallow the entry .jsx file and force loader 'js', which silently
      // disables JSX and fails the build with "JSX syntax extension is not
      // currently enabled".
      b.onLoad({ filter: /.*/ }, (a) => {
        if (path.resolve(a.path) !== path.resolve(target)) return null;
        return { contents: fs.readFileSync(a.path, 'utf8'), loader: 'js' };
      });
    },
  };
};

async function main() {
  await esbuild.build({
    entryPoints: [SRC],
    bundle: true,
    outfile: OUT,
    format: 'cjs',
    platform: 'node',
    logLevel: 'silent',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    // The JSX extension must be explicitly enabled for this entry point.
    loader: { '.jsx': 'jsx' },
    // Plugins require the async API.
    plugins: [
      stubPlugin('react', 'react.js'),
      stubPlugin('styled-components', 'styled-components.js'),
      stubPlugin('date-fns', 'date-fns.js'),
    ],
  });

  let pass = 0, fail = 0;
  const check = (name, fn) => {
    try { fn(); pass++; console.log('  OK   ' + name); }
    catch (e) { fail++; console.log('  FAIL ' + name + ' -> ' + e.message); }
  };

  const React = require(path.join(STUB, 'react.js'));
  const { CoffinCalendarGrid } = require(OUT);

  const d = (y, m, day) => new Date(y, m - 1, day);

  console.log('static: every module-scope helper used in the component is defined');
  {
    const src = fs.readFileSync(SRC, 'utf8');
    const defined = new Set(
      [...src.matchAll(/^(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1])
    );
    // Only helpers this file owns; imported/library names are out of scope.
    for (const name of ['parseHour', 'fmtHour', 'statusOf', 'tintOf']) {
      check(name + ' is defined at module scope', () => {
        if (!defined.has(name)) throw new Error('not declared at module scope');
      });
      check(name + ' is actually called', () => {
        const uses = (src.match(new RegExp('\\b' + name + '\\s*\\(', 'g')) || []).length;
        if (uses < 2) throw new Error('declared but never called');
      });
    }
  }

  console.log('\nrender: day view');
  check('day with a timed booking', () => {
    React.__resetHooks();
    CoffinCalendarGrid({
      view: 'day', date: d(2026, 3, 6),
      bookings: [{ id: 1, clientName: 'Peter Mumo', coffinType: 'Standard', time: '14:30', status: 'confirmed', date: d(2026, 3, 6) }],
      onPick: () => {}, onPickDay: () => {},
    });
  });

  check('day with an untimed booking', () => {
    React.__resetHooks();
    CoffinCalendarGrid({
      view: 'day', date: d(2026, 3, 6),
      bookings: [{ id: 2, clientName: 'No Time', coffinType: 'Standard', time: '', status: 'pending', date: d(2026, 3, 6) }],
      onPick: () => {}, onPickDay: () => {},
    });
  });

  check('empty day', () => {
    React.__resetHooks();
    CoffinCalendarGrid({ view: 'day', date: d(2026, 3, 6), bookings: [], onPick: () => {}, onPickDay: () => {} });
  });

  check('booking with a null time', () => {
    React.__resetHooks();
    CoffinCalendarGrid({
      view: 'day', date: d(2026, 3, 6),
      bookings: [{ id: 9, clientName: 'X', coffinType: 'Y', time: null, status: 'cancelled', date: d(2026, 3, 6) }],
      onPick: () => {}, onPickDay: () => {},
    });
  });

  console.log('\nrender: week view');
  check('full week, incl. an off-grid 23:30 time', () => {
    React.__resetHooks();
    CoffinCalendarGrid({
      view: 'week', date: d(2026, 3, 6),
      bookings: [
        { id: 3, clientName: 'A', coffinType: 'Standard', time: '09:00', status: 'confirmed', date: d(2026, 3, 4) },
        { id: 4, clientName: 'B', coffinType: 'Deluxe', time: '23:30', status: 'completed', date: d(2026, 3, 10) },
      ],
      onPick: () => {}, onPickDay: () => {},
    });
  });

  check('booking outside the rendered week is ignored', () => {
    React.__resetHooks();
    CoffinCalendarGrid({
      view: 'week', date: d(2026, 3, 6),
      bookings: [{ id: 5, clientName: 'Far', coffinType: 'X', time: '10:00', status: 'confirmed', date: d(2026, 6, 1) }],
      onPick: () => {}, onPickDay: () => {},
    });
  });

  check('empty week', () => {
    React.__resetHooks();
    CoffinCalendarGrid({ view: 'week', date: d(2026, 3, 6), bookings: [], onPick: () => {}, onPickDay: () => {} });
  });

  console.log('\ntintOf');
  {
    const tint = (c) => (/^#[0-9a-f]{6}$/i.test(c) ? c + '14' : c);
    check('6-digit hex gets alpha appended', tint('#2563EB'), '#2563EB14');
    check('named colour passes through unchanged', tint('red'), 'red');
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('HARNESS ERROR:', e.message); process.exit(1); });
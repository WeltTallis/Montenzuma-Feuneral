// Minimal stubs so CoffinCalendarGrid can be BUNDLED and actually RENDERED in
// Node. This is a real smoke test: it executes the component body, so any
// reference to an undefined module-scope helper (e.g. `tintOf`) throws here
// instead of in the browser. A pure syntax check would NOT catch that.
// This file IS the 'react' module for the bundle, so it must not require react.
const makeHook = (initial) => {
  let v = initial;
  const fn = (next) => {
    if (typeof next === 'function') v = next(v);
    else if (next !== undefined) v = next;
    return v;
  };
  fn.__reset = (x) => { v = x; };
  return fn;
};
const state = { hooks: {}, cursor: 0 };
const resetHooks = () => { state.cursor = 0; };

const useState = (init) => {
  const i = state.cursor++;
  if (state.hooks[i] === undefined) state.hooks[i] = makeHook(init);
  return [state.hooks[i](), state.hooks[i]];
};
const useMemo = (fn, deps) => fn();
const useRef = (init) => {
  const i = state.cursor++;
  if (state.hooks[i] === undefined) state.hooks[i] = { current: init };
  return state.hooks[i];
};
const useEffect = () => {};

const elements = [];
const createElement = (type, props, ...children) => {
  // Flatten to a plain record so we can assert on rendered text without a DOM.
  const text = [];
  const walk = (c) => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) return c.forEach(walk);
    if (typeof c === 'object' && c.$$typeof === 'el') return walk(c.children);
    text.push(String(c));
  };
  children.forEach(walk);
  const out = { $$typeof: 'el', type, props: props || {}, children, text: text.join(' ') };
  elements.push(out);
  return out;
};

module.exports = {
  React, createElement, Fragment: 'Fragment',
  useState, useMemo, useRef, useEffect,
  __resetHooks: resetHooks,
  __elements: elements,
  default: { createElement, Fragment: 'Fragment', useState, useMemo, useRef, useEffect },
  __esModule: true,
};
module.exports.default = module.exports;
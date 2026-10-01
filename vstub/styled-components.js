// styled-components stub: every styled.X returns a pass-through component so
// the real styled definitions are evaluated (catching bad interpolations)
// without needing CSS-in-JS at runtime.
const React = require('react');

const tag = (name) => {
  const fn = (props) => React.createElement(name, props, props && props.children);
  fn.displayName = 'Styled.' + name;
  fn.withConfig = () => tag(name);
  return fn;
};

const styled = new Proxy({}, {
  get: (_t, prop) => (typeof prop === 'string' ? tag(prop) : tag('div')),
});

const keyframes = (str) => ({ __keyframes: String(str) });

module.exports = { styled, keyframes, css: (s) => s, default: { styled, keyframes, css: (s) => s } };
module.exports.default = module.exports;
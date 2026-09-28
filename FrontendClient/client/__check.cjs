const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const dir = "d:\\new\\restpoint\\FrontendClient\\client\\src\\dashboard";
const files = ["index.jsx", "opsViews.jsx", "opsPanels.jsx", "opsBoard.jsx",
  "opsScheduler.jsx", "opsAnalytics.jsx", "opsData.js", "dashboard.css"];

let bad = 0;
for (const f of files) {
  const p = path.join(dir, f);
  if (f.endsWith(".css")) {
    const css = fs.readFileSync(p, "utf8");
    const open = (css.match(/{/g) || []).length;
    const close = (css.match(/}/g) || []).length;
    const ok = open === close;
    if (!ok) bad++;
    console.log(`${ok ? "OK  " : "FAIL"} ${f}  (braces ${open}/${close})`);
    continue;
  }
  try {
    babel.transformFileSync(p, {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" }, modules: false }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
      filename: p,
    });
    console.log(`OK   ${f}`);
  } catch (e) {
    bad++;
    console.log(`FAIL ${f}: ${e.message.split("\n")[0]}`);
  }
}
console.log(bad ? `\n${bad} file(s) failed` : "\nAll changed files parse cleanly");

const fs = require("fs");
const path = "D:/new/restpoint/FrontendClient/client/src/dashboard/";

// 1. config.js sanity
const cfg = fs.readFileSync(path + "config.js", "utf8");
const bare = cfg.match(/icon:\s*(Truck|Package|Calendar|Check|Users|Flower2|Wrench)\s*[,}]/g) || [];
console.log("config.js bare icon refs:", bare.length ? bare : "NONE ✓");
console.log("config.js lucide import :", /from\s*["']lucide-react["']/.test(cfg) ? "STILL PRESENT ✗" : "gone ✓");

// 2. every dashboard-root file (excluding the embedded reference projects)
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + "/" + e.name;
    if (e.isDirectory()) {
      if (/Operations Calendar|node_modules/i.test(e.name)) continue;
      walk(p, out);
    } else if (/\.(jsx|js)$/.test(e.name)) out.push(p);
  }
  return out;
}
let risky = [];
for (const f of walk(path)) {
  const c = fs.readFileSync(f, "utf8");
  const m = c.match(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/);
  if (m) risky.push({ file: f.replace(path, ""), icons: m[1].trim().replace(/\s+/g, " ") });
}
console.log("\nlucide-react imports remaining in dashboard graph:");
console.log(risky.length ? risky.map(r => `  ${r.file} -> [${r.icons}]`).join("\n") : "  NONE ✓");

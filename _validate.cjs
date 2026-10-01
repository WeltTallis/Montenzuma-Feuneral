// Temporary validation (deleted after use).
const fs = require('fs');
const YAML = require('yaml');

let bad = 0;
const fail = (m) => { console.log('   !! FAIL: ' + m); bad++; };

for (const f of ['docker-compose.yml', 'docker-compose.prod.yml']) {
  try {
    const doc = YAML.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));
    const s = doc.services;
    const m = s.mariadb;
    console.log(`\n${f} -> PARSE OK, ${Object.keys(s).length} services`);

    // Healthcheck must be CMD-SHELL + a single string command.
    const t = m.healthcheck.test;
    if (!Array.isArray(t) || t[0] !== 'CMD-SHELL') fail(`healthcheck.test not CMD-SHELL: ${JSON.stringify(t)}`);
    if (typeof t[1] !== 'string') fail('healthcheck command is not a string');

    // The `$$` must survive YAML so Compose escapes it to a literal `$`.
    if (!t[1].includes('$$MARIADB_HEALTH_PW')) fail('lost the $$ escape before the container shell');
    if (t[1].includes('healthcheck.sh')) fail('still depends on healthcheck.sh / the stale .cnf');

    // The env var the command reads must actually be provided.
    if (m.environment.MARIADB_HEALTH_PW === undefined) fail('MARIADB_HEALTH_PW not set');

    // The innodb assertion must survive line folding as ONE statement.
    const sql = t[1].split('-e "')[1].split('"')[0];
    console.log('   SQL ->', sql.replace(/\s+/g, ' '));
    if (/SELECT\s+1\s+FROM\s+information_schema\.ENGINES/i.test(sql) !== true)
      fail('innodb assertion did not survive YAML folding');
    if (!/\|\s*grep\s+-qx\s+1/.test(t[1])) fail('missing exact-match grep guard');

    // UI must stay independent of the DB.
    const dep = s.frontend.depends_on;
    if (dep && Object.keys(dep).length) fail(`frontend has depends_on: ${JSON.stringify(dep)}`);
    else console.log('   frontend.depends_on = (none) <- independent');
  } catch (e) {
    console.log(`${f} -> PARSE FAILED: ${e.message}`);
    bad++;
  }
}
console.log(bad === 0 ? '\nALL CHECKS PASSED' : `\n${bad} CHECK(S) FAILED`);
process.exit(bad === 0 ? 0 : 1);

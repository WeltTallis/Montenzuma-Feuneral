/* Temporary verification harness for buildCases (removed after the run). */
import { buildCases } from "./opsData";

const row = (branch, slug, adm, id) => ({
  admission_number: adm,
  deceased_id: id,
  full_name: `${adm} @ ${branch}`,
  date_admitted: "2026-09-20",
  branch_name: branch,
  branch,
  _branchSlug: slug,
});

// Two branches, each with the SAME admission numbers (separate DBs, separate
// sequences) - 39 rows in branch A, 13 in branch B.
const deceased = [];
for (let i = 1; i <= 39; i += 1) {
  deceased.push(row("Nairobi", "org-nairobi", `ADM-${String(i).padStart(3, "0")}`, `nid-${i}`));
}
for (let i = 1; i <= 13; i += 1) {
  deceased.push(row("Thika", "org-thika", `ADM-${String(i).padStart(3, "0")}`, `tid-${i}`));
}

const cases = buildCases(deceased, [], []);
const nairobi = cases.filter((c) => c.branch === "Nairobi");
const thika = cases.filter((c) => c.branch === "Thika");

console.log("total cases      :", cases.length, "(expected 52)");
console.log("Nairobi cases    :", nairobi.length, "(expected 39)");
console.log("Thika cases      :", thika.length, "(expected 13)");
console.log("unique uids      :", new Set(cases.map((c) => c.uid)).size, "(expected 52)");

// A release row from Thika must attach to the THIKA case, not Nairobi's.
const rel = [{
  admission_number: "ADM-001",
  name_of_deceased: "Released person",
  date_of_removal: "2026-09-21",
  status: "completed",
  branch_name: "Thika",
  _branchSlug: "org-thika",
}];
const merged = buildCases(deceased, rel, []);
const withRelease = merged.filter((c) => c.release);
console.log("cases w/ release :", withRelease.length, "(expected 1)");
console.log("release attached :", withRelease[0]?.branch, "(expected Thika)");

// Untagged feed row (single-branch code path) still resolves when unique.
const solo = buildCases([row("Nairobi", "org-nairobi", "ADM-777", "x1")], [{
  admission_number: "ADM-777", date_of_removal: "2026-09-22", status: "completed",
}], []);
console.log("untagged match   :", solo[0]?.release ? "attached" : "MISSED", "(expected attached)");

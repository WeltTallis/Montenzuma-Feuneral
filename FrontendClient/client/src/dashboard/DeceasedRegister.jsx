import React from "react";
import { BRANCHES, BRANCH_COLOR } from "./data";

const STATUS_COLOR = {
  "in-care": "var(--d-ev-intake)",
  preparing: "var(--d-ev-coffin)",
  viewing: "var(--d-ev-flowers)",
  released: "var(--d-primary)",
};
const STATUS_LABEL = {
  "in-care": "In care", preparing: "Preparing", viewing: "Viewing", released: "Released",
};

function statusStyle(status) {
  const c = STATUS_COLOR[status];
  return {
    backgroundColor: `color-mix(in srgb, ${c} 14%, transparent)`,
    color: c,
  };
}
function branchName(id) {
  const b = BRANCHES.find((x) => x.id === id);
  return b ? b.name : id;
}

/** DeceasedRegister — today's intakes & releases table. */
export default function DeceasedRegister({ records }) {
  return (
    <div className="dash-section">
      <div className="dash-section-head">
        <h2>Deceased register — intakes &amp; releases</h2>
        <span className="sub">{records.length} records · {records.filter((r) => r.status !== "released").length} in care</span>
      </div>
      <div className="dash-tablewrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Deceased</th><th>Ref</th><th>Branch</th><th>Locker</th>
              <th>Intake</th><th>Release</th><th>Next of kin</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="strong">{r.name} <span className="muted">· {r.age} yrs</span></td>
                <td className="muted dash-num">{r.ref}</td>
                <td className="muted">{branchName(r.branch)}</td>
                <td className="strong dash-num">{r.locker}</td>
                <td className="muted dash-num">{r.intakeTime}</td>
                <td className="muted dash-num">{r.releaseTime ?? "—"}</td>
                <td className="muted">{r.nextOfKin}</td>
                <td>
                  <span className="dash-statuspill" style={statusStyle(r.status)}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={8}><div className="dash-empty"><p>No records for this selection.</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

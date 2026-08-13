import React from "react";
import { AlertTriangle, ArrowRightLeft, Church, Package, Truck, ShieldCheck } from "lucide-react";
import { BRANCH_COLOR, BRANCH_NAME, tint } from "./data";

const KIND_ICON = {

  hearse: Truck, chapel: Church, coffin: Package,

};

function BranchDot({ id }) {
  return (
    <span
      className="dash-muted-fg"
      style={{
        background: tint("var(--d-muted)", 2),
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: "999px",
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 500,
        color: BRANCH_COLOR[id] || "var(--d-muted-fg)",
        border: "1px solid var(--d-border)",
      }}
    >
      <span className="dash-dot" style={{ background: BRANCH_COLOR[id] || "var(--d-muted-fg)" }} />
      {BRANCH_NAME[id] || id}
    </span>
  );
}

/** ConflictMonitor — live cross-branch clash detection. */
export default function ConflictMonitor({ conflicts }) {
  const critical = (conflicts || []).filter((c) => c.severity === "critical").length;

  return (
    <div className="dash-section" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="dash-section-head">
        <div className="dash-brand">
          <span
            className="dash-ico"
            style={{ width: 32, height: 32, backgroundColor: tint("var(--d-danger)", 14), color: "var(--d-danger)" }}
          >
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h2>Resource Conflicts</h2>
            <span className="sub">Live cross-branch clash detection</span>
          </div>
        </div>
        {conflicts && conflicts.length > 0 ? (
          <span
            className="dash-tag"
            style={{ backgroundColor: tint("var(--d-danger)", 14), color: "var(--d-danger)" }}
          >
            {conflicts.length} open{critical ? ` · ${critical} critical` : ""}
          </span>
        ) : (
          <span
            className="dash-tag"
            style={{ backgroundColor: tint("var(--d-ring)", 12), color: "var(--d-ring)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> All clear
          </span>
        )}
      </div>

      <div className="dash-scroll">
        {(conflicts || []).length === 0 ? (
          <div className="dash-empty" style={{ minHeight: 120 }}>
            <ShieldCheck className="h-8 w-8 opacity-40" />
            <p>No scheduling conflicts for this day.</p>
          </div>
        ) : (
          <div className="dash-list" style={{ padding: 4 }}>
            {conflicts.map((c) => {
              const Icon = KIND_ICON[c.kind] || AlertTriangle;
              const color = c.severity === "critical" ? "var(--d-danger)" : "var(--d-warn)";
              return (
                <article
                  key={c.id}
                  className="dash-card"
                  style={{
                    borderColor: tint(color, 45),
                    backgroundColor: tint(color, 5),
                    margin: 6,
                  }}
                >
                  <div className="dash-rowtitle" style={{ gap: 10, marginBottom: 4 }}>
                    <span
                      className="dash-ico"
                      style={{ width: 32, height: 32, backgroundColor: tint(color, 16), color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{c.title}</h3>
                    {c.crossBranch && (
                      <span
                        className="dash-tag"
                        style={{ backgroundColor: tint(color, 16), color, marginLeft: "auto" }}
                      >
                        <ArrowRightLeft className="h-3 w-3" /> cross-branch
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--d-muted-fg)", margin: 0, marginTop: 2 }}>{c.detail}</p>
                  <div className="dash-branch-pills" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {c.branches.map((b) => (
                      <BranchDot key={b} id={b} />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: "var(--d-muted-fg)", marginTop: 6 }}>
                    {c.time} · {c.resourceLabel}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

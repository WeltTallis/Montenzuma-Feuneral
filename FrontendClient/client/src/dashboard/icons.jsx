/* ─────────────────────────────────────────────────────────────────────────
   Dashboard module icons — self-contained inline SVG components.

   Why: the installed lucide-react@0.344 does not export some icons the
   dashboard used (e.g. `IdCard`), which crashed the whole module graph at
   import time. These replacements take zero dependencies and accept the
   same props (`size`, `color`, `className`) so drop-in usage is identical.
   ───────────────────────────────────────────────────────────────────────── */

function SvgIcon({ path, circle, size = 16, color = "currentColor", className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {circle && <circle cx={circle.cx} cy={circle.cy} r={circle.r} />}
      {path && <path d={path} />}
    </svg>
  );
}

const P = {
  Truck: "M10 17h4V5H2v12h3m5 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m-4 0h4m0-9h4l4 4v5h-2m-6 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0M2 9h8",
  Package: "M21 8l-9-5-9 5v8l9 5 9-5V8zm-9-2.7L18.6 8 12 11.7 5.4 8 12 5.3zM4 10l7 3.9V19l-7-3.9V10zm16 0v5.1L13 19v-5.1l7-3.9z",
  Flower2: "M12 5a3 3 0 1 1 3 3c0 1.7-1.3 3-3 3s-3-1.3-3-3a3 3 0 0 1 3-3zm0 6v13m0-13c-1.7 0-3-1.3-3-3M12 11c1.7 0 3-1.3 3-3M5 21c0-3 3-6 7-6s7 3 7 6",
  Users: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  Calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  Check: "M20 6L9 17l-5-5",
  Wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
};

export const TruckIcon    = (p) => <SvgIcon path={P.Truck}    {...p} />;
export const PackageIcon  = (p) => <SvgIcon path={P.Package}  {...p} />;
export const FlowerIcon   = (p) => <SvgIcon path={P.Flower2}  {...p} />;
export const UsersIcon    = (p) => <SvgIcon path={P.Users}    {...p} />;
export const CalendarIcon = (p) => <SvgIcon path={P.Calendar} {...p} />;
export const CheckIcon    = (p) => <SvgIcon path={P.Check}    {...p} />;
export const WrenchIcon   = (p) => <SvgIcon path={P.Wrench}   {...p} />;

export default SvgIcon;

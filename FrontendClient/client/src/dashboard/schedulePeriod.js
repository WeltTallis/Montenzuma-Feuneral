import { DOWF, MO, pad } from "./opsData";

/**
 * Human-readable period heading used by the Analytics Day/Week toolbar.
 *
 * @param {"day"\|"week"\|"month"} view - active calendar view
 * @param {string} selDate - selected date in "YYYY-MM-DD" form
 * @returns {{ title: string, year: number, startKey: string }}
 */
export function schedulePeriod(view, selDate) {
  const [year, month, date] = selDate.split("-").map(Number);
  const start = new Date(year, month - 1, date);
  if (view === "week")
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  if (view === "week") end.setDate(start.getDate() + 6);

  const startKey = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const title =
    view === "week"
      ? start.getMonth() === end.getMonth()
        ? `${MO[start.getMonth()]} ${start.getDate()}â€“${end.getDate()}`
        : `${MO[start.getMonth()].slice(0, 3)} ${start.getDate()} â€“ ${MO[end.getMonth()].slice(0, 3)} ${end.getDate()}`
      : view === "month"
        ? MO[start.getMonth()]
        : `${DOWF[start.getDay()]}, ${MO[start.getMonth()]} ${start.getDate()}`;

  return { title, year: end.getFullYear(), startKey };
}
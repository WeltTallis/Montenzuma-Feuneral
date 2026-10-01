// date-fns stub — only the six helpers CoffinCalendarGrid imports. Local-time
// throughout (the component deliberately avoids toISOString).
const pad = (n) => String(n).padStart(2, '0');

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const format = (d, f) => {
  const s = String(f);
  return s
    .replace('yyyy', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('d', String(d.getDate()))
    .replace('EEE', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()])
    .replace('MMMM', ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'][d.getMonth()]);
};

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const startOfWeek = (d, o) => {
  const s = startOfDay(d);
  const shift = (o && o.weekStartsOn) || 0;
  const diff = (s.getDay() - shift + 7) % 7;
  return addDays(s, -diff);
};

const isSameDay = (a, b) => a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const isSameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const isToday = (d) => isSameDay(d, new Date());

module.exports = { format, addDays, startOfWeek, isSameDay, isSameMonth, isToday };
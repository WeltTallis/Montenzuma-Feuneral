import { useMemo, useState } from 'react';
import { CalendarDays, CircleDollarSign, Cake } from 'lucide-react';
import { useEmployees } from '@hr/hooks/api/useEmployees';
import { Calendar } from '@hr/components/ui/calendar';

const formatDate = (date: Date) => new Intl.DateTimeFormat('en-KE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(date);

const HRCalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data, isLoading, isError } = useEmployees({ page: 1, pageSize: 500 });
  const employees = data?.data ?? [];

  const birthdays = useMemo(() => employees.filter((employee) => {
    if (!employee.date_of_birth) return false;
    const birthday = new Date(`${employee.date_of_birth.slice(0, 10)}T12:00:00`);
    return !Number.isNaN(birthday.getTime())
      && birthday.getMonth() === selectedDate.getMonth()
      && birthday.getDate() === selectedDate.getDate();
  }), [employees, selectedDate]);

  const hasPayrollDeadline = selectedDate.getDate() === 9;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
      <header>
        <div className="flex items-center gap-2 text-emerald-800">
          <CalendarDays aria-hidden="true" className="h-5 w-5" />
          <p className="text-sm font-semibold uppercase tracking-wide">HR calendar</p>
        </div>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Staff dates &amp; payroll deadlines</h2>
        <p className="mt-1 text-sm text-slate-600">Select a date to see employee birthdays and monthly statutory reminders.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5" aria-label="Calendar">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            month={selectedDate}
            onMonthChange={(date) => setSelectedDate(date)}
            modifiers={{ payrollDeadline: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 9) }}
            modifiersClassNames={{ payrollDeadline: 'font-bold text-emerald-800 underline decoration-2 underline-offset-4' }}
            className="mx-auto w-full"
          />
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-live="polite">
          <h3 className="font-semibold text-slate-900">{formatDate(selectedDate)}</h3>

          {hasPayrollDeadline && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 font-semibold text-amber-950">
                <CircleDollarSign aria-hidden="true" className="h-4 w-4" />
                Payroll contribution deadlines
              </div>
              <p className="mt-1 text-sm text-amber-900">PAYE and SHIF for the previous month are due by the 9th. The housing levy is due within 9 working days after month end.</p>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-slate-500" role="status">Loading employee dates…</p>
          ) : isError ? (
            <p className="text-sm text-red-700" role="alert">Employee dates could not be loaded.</p>
          ) : birthdays.length > 0 ? (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Cake aria-hidden="true" className="h-4 w-4" /> Employee birthdays
              </h4>
              <ul className="mt-2 space-y-2">
                {birthdays.map((employee) => (
                  <li key={employee.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {employee.fullname}
                  </li>
                ))}
              </ul>
            </div>
          ) : !hasPayrollDeadline ? (
            <p className="text-sm text-slate-500">No HR reminders for this date.</p>
          ) : null}

          <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
            Staff dates are based on employee records. Payroll dates are reminders; submit returns and payments through the relevant government portals.
          </p>
        </section>
      </div>
    </main>
  );
};

export default HRCalendarPage;

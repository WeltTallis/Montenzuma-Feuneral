import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- Helper Functions ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const formatDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function HorizontalCalendar({ 
  eventsData = [], 
  selectedDate, 
  onDateSelect 
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const scrollContainerRef = useRef(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const today = new Date();

  // 1. Aggregate events by day for the current month view
  const eventsMap = useMemo(() => {
    const map = {};
    eventsData.forEach((event) => {
      const dateKey = formatDateKey(new Date(event.date));
      if (!map[dateKey]) map[dateKey] = { deceased: 0, hearse: 0, coffin: 0 };
      if (event.type === 'deceased') map[dateKey].deceased++;
      if (event.type === 'hearse') map[dateKey].hearse++;
      if (event.type === 'coffin') map[dateKey].coffin++;
    });
    return map;
  }, [eventsData]);

  // 2. Generate days for the current viewed month
  const daysInMonth = useMemo(() => {
    const totalDays = getDaysInMonth(year, month);
    const days = [];
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const dateKey = formatDateKey(date);
      days.push({
        date,
        dateKey,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: i,
        events: eventsMap[dateKey] || { deceased: 0, hearse: 0, coffin: 0 },
      });
    }
    return days;
  }, [year, month, eventsMap]);

  // 3. Auto-scroll to selected date when month changes or date is selected
  useEffect(() => {
    if (selectedDate && scrollContainerRef.current) {
      const selectedKey = formatDateKey(selectedDate);
      const element = document.getElementById(`cal-day-${selectedKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDate, currentMonth]);

  // Navigation Handlers
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    if (onDateSelect) onDateSelect(now);
  };

  const isToday = (date) => formatDateKey(date) === formatDateKey(today);
  const isSelected = (date) => selectedDate && formatDateKey(date) === formatDateKey(selectedDate);
  const hasEvents = (events) => events.deceased > 0 || events.hearse > 0 || events.coffin > 0;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button 
            onClick={prevMonth}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:bg-muted transition"
          >
            <ChevronLeft size={14} />
          </button>
          
          <span className="text-base font-semibold font-headings text-foreground">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          
          <button 
            onClick={nextMonth}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:bg-muted transition"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        
        <button 
          onClick={goToToday}
          className="text-xs font-body font-medium px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-primary hover:text-primary-foreground transition"
        >
          Today
        </button>
      </div>

      {/* --- SCROLLABLE DAYS BODY --- */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 px-5 py-4 overflow-x-auto"
      >
        {daysInMonth.map((day) => {
          const selected = isSelected(day.date);
          const todayDate = isToday(day.date);
          
          return (
            <button
              key={day.dateKey}
              id={`cal-day-${day.dateKey}`}
              onClick={() => onDateSelect && onDateSelect(day.date)}
              className={`
                flex-none flex flex-col items-center gap-2 px-3 pt-3 pb-3 rounded-lg border transition min-w-[80px]
                ${selected 
                  ? 'bg-primary/10 border-primary' 
                  : todayDate 
                    ? 'bg-secondary border-secondary-foreground/20' 
                    : 'bg-muted border-transparent hover:border-border'
                }
              `}
            >
              {/* Day Name (Mon, Tue) */}
              <span className={`text-xs font-body font-medium ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.dayName}
              </span>
              
              {/* Date Number (5, 6) */}
              <span className={`text-xl font-headings font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>
                {day.dayNumber}
              </span>

              {/* Event Counts */}
              <div className="flex flex-col gap-1.5 w-full">
                <EventRow color="bg-deceased" count={day.events.deceased} />
                <EventRow color="bg-hearse" count={day.events.hearse} />
                <EventRow color="bg-coffin" count={day.events.coffin} />
              </div>

              {/* Bottom Status Bar */}
              <div className={`w-full h-1 rounded-full ${hasEvents(day.events) ? 'bg-pending' : 'bg-border'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Sub-component for Event Rows ---
const EventRow = ({ color, count }) => {
  // If count is 0, render an empty placeholder row to keep spacing consistent
  if (count === 0) return <div className="flex items-center justify-between gap-1 h-[16px]" />;
  
  return (
    <div className="flex items-center justify-between gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-xs font-body text-muted-foreground">{count}</span>
    </div>
  );
};
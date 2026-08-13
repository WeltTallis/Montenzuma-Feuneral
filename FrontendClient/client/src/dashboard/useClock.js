import { useEffect, useState } from "react";

/** Returns a live `Date` that ticks every second (null until mounted). */
export default function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

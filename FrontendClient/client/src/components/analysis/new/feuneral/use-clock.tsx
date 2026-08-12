"use client"

import { useEffect, useState } from "react"

/** Returns a live `Date` that updates every second (null until mounted, to avoid hydration mismatch). */
export function useClock(): Date | null {
    const [now, setNow] = useState<Date | null>(null)
    useEffect(() => {
        setNow(new Date())
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])
    return now
}

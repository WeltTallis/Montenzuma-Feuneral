// ============================================================
// HEARSE FLEET AVAILABILITY — multi-date merge (pure, testable)
// ============================================================
// Merges the per-day buckets from /availability/check-by-dates (normalised by
// the caller to { date, avail, booked }) into ONE fleet map keyed by hearse id:
//
//   { [hearseId]: { status: 'available' | 'booked' | 'maintenance',
//                   bookedFor: [{ date, client }],
//                   hearse: { ...metadata } } }
//
// ── Why this is a TWO-pass merge ─────────────────────────────
// The booking modal creates ONE booking covering EVERY selected date
// (`booking_dates: dates`), so a hearse must be unavailable for the WHOLE
// selection when an active booking exists on ANY of those dates.
//
// The original merge walked the days in ONE loop, applying each day's `avail`
// list before that day's `booked` list — so a booking seen on day N was
// overwritten back to 'available' by day N+1's avail list:
//
//     select 3 dates, hearse already booked on date 1 (or 2):
//       day 1: booked → status 'booked'
//       day 2: avail  → status 'available'   ← WRONG, flips back
//       row renders "Free" and the taken date looks bookable.
//
// Only a conflict on the LAST selected date happened to work by accident.
// Hence: pass 1 applies EVERY day's availability, then pass 2 applies EVERY
// day's bookings — a booking on any date always wins. (The backend also
// re-validates atomically inside the create transaction and answers 409, but
// the UI must never offer a date that is already taken.)
//
// Maintenance / out-of-service hearses are applied LAST: never bookable on
// any date, even when an old booking row still references them.
// ============================================================

export function mergeFleetAvailability(hearses, dayResults, excludedStatuses = []) {
    const fleet = {};

    // 1) Seed from the full fleet list so every hearse has a row even when no
    //    bucket mentions it (the prop carries model + charge + global status).
    (hearses || []).forEach((h) => {
        fleet[String(h.id)] = {
            status: 'available',
            bookedFor: [],
            hearse: {
                id: h.id,
                hearse_code: h.hearse_code,
                hearse_name: h.hearse_name || h.plate_number || '',
                plate_number: h.plate_number || '',
                model: h.model || '',
                capacity: h.capacity,
                status: h.status || 'available',
                service_charge_ksh: Number(h.service_charge_ksh ?? h.service_charge) || 0,
            },
        };
    });

    const days = (dayResults || []).filter(Boolean);

    // PASS 1 — availability + metadata for every selected day.
    days.forEach((day) => {
        (day.avail || []).forEach((a) => {
            const key = String(a.id);
            if (!fleet[key]) fleet[key] = { status: 'available', bookedFor: [], hearse: {} };
            fleet[key].hearse = { ...fleet[key].hearse, ...a };
            // Never clobber a booking or an out-of-service mark (defensive:
            // pass 1 runs before bookings, but the invariant is explicit here).
            if (fleet[key].status !== 'booked' && fleet[key].status !== 'maintenance') {
                fleet[key].status = 'available';
            }
        });
    });

    // PASS 2 — a booking on ANY selected date makes the hearse 'booked' for
    // the whole selection. Runs strictly after pass 1 so no avail list can
    // undo it, no matter which date the conflict falls on.
    days.forEach((day) => {
        (day.booked || []).forEach((bh) => {
            const id = String(bh.hearse_id || bh.id);
            if (!fleet[id]) fleet[id] = { status: 'booked', bookedFor: [], hearse: { ...bh } };
            fleet[id].status = 'booked';
            if (!fleet[id].bookedFor.some((x) => x.date === day.date)) {
                fleet[id].bookedFor.push({
                    date: day.date,
                    client: bh.client_name || bh.booking_code || 'Booked',
                });
            }
            fleet[id].hearse = { ...fleet[id].hearse, ...bh };
        });
    });

    // 3) Out-of-service hearses are never bookable — highest precedence.
    (hearses || []).forEach((h) => {
        const key = String(h.id);
        if (fleet[key] && (excludedStatuses || []).includes(h.status)) {
            fleet[key].status = 'maintenance';
        }
    });

    return fleet;
}

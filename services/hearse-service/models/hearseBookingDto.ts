/**
 * ============================================
 * HEARSE BOOKING DTOs
 * ============================================
 * Data Transfer Objects for the hearse booking flow.
 *
 * The booking flow is intentionally simple:
 *   1. Caller sends ONLY a date  → HearseAvailabilityRequestDto
 *   2. Backend returns every hearse that is free on that date
 *      (with full details + per-day service charge)  → HearseAvailabilityResponseDto
 *   3. Caller picks one hearse, fills client details, and the
 *      backend creates the booking  → HearseBookingRequestDto / HearseBookingResponseDto
 *
 * "Total service charge" = per-day rate (min_charge_ksh) × number of
 * booking days. It is persisted on the booking so the invoice service
 * can pick it up without recomputing.
 */

// ─── Availability ───────────────────────────────────────────────

/**
 * Request: just pick a date. That's all the caller needs to send.
 */
export interface HearseAvailabilityRequestDto {
    /** Calendar date, YYYY-MM-DD */
    date: string;
}

/**
 * CSS class / label pair for the status badge shown on each card.
 * These map to the badge styles defined in the shared CSS variables.
 */
export interface HearseStatusBadge {
    /** Short label rendered inside the badge, e.g. "Active / In Morgue" */
    label: string;
    /** CSS class key, e.g. "st-active" */
    cssClass: string;
}

/**
 * Maps a raw hearse `status` enum value to a display badge.
 */
export function hearseStatusBadge(status: string): HearseStatusBadge {
    switch (status) {
        case 'available':
            return { label: 'Active / In Morgue', cssClass: 'st-active' };
        case 'maintenance':
            return { label: 'PM Done', cssClass: 'st-pmDone' };
        case 'booked':
            return { label: 'PM Requested', cssClass: 'st-pmReq' };
        case 'out_of_service':
            return { label: 'Released', cssClass: 'st-released' };
        default:
            return { label: status || 'Unknown', cssClass: 'st-active' };
    }
}

/**
 * A single hearse row returned by the availability check, decorated
 * with everything the frontend card needs.
 */
export interface HearseAvailabilityItemDto {
    id: number;
    hearse_code: string;
    hearse_name: string;
    plate_number: string;
    model: string;
    capacity: number;
    /** Raw DB status: 'available' | 'booked' | 'maintenance' | 'out_of_service' */
    status: string;
    /** Branch display fields */
    branch_id: number | null;
    branch_name: string | null;
    /** Image path / URL */
    image: string | null;
    /** Per-day service charge (KSH) — derived from min_charge_ksh */
    service_charge_ksh: number;
    /** Raw charge range for reference */
    min_charge_ksh: number;
    max_charge_ksh: number;
    /** Badge label + css class for the status badge */
    status_badge: HearseStatusBadge;
    /** True when the hearse is already booked on *this* date */
    is_booked: boolean;
}

/**
 * Response: every hearse, split into available / booked buckets.
 */
export interface HearseAvailabilityResponseDto {
    status: 'success';
    /** The date that was queried */
    date: string;
    /** Hearses that are free on `date` */
    available_hearses: HearseAvailabilityItemDto[];
    /** Hearses that are already booked on `date` */
    booked_hearses: HearseAvailabilityItemDto[];
    /** Count of available hearses */
    total_available: number;
    /** Count of booked hearses */
    total_booked: number;
}

// ─── Booking ─────────────────────────────────────────────────────

/**
 * Request body for creating (or auto-matching) a hearse booking.
 */
export interface HearseBookingRequestDto {
    /** Optional — if omitted the backend auto-matches an available hearse */
    hearse_id?: number | string;
    deceased_id?: string;
    client_name: string;
    client_phone: string;
    client_email?: string;
    destination: string;
    from_location?: string;
    to_location?: string;
    /** One or more YYYY-MM-DD strings (or ISO datetime strings) */
    booking_dates: string[];
    /** Per-day service charge (KSH) captured at booking time */
    service_charge?: number;
    special_remarks?: string;
    from_timestamp?: string;
    branch_id?: number | string;
    branch_code?: string;
    booked_by?: string;
}

/**
 * The booking object echoed back to the caller, now including the
 * total service charge that was applied.
 */
export interface HearseBookingResponseDto {
    status: 'success';
    message: string;
    booking: {
        id: number;
        booking_code: string;
        hearse_id: number | null;
        client_name: string;
        client_phone: string;
        destination: string;
        booking_dates: string[];
        booking_date: string;
        status: string;
        service_charge: number;
        total_service_charge: number;
        created_at: string;
        [key: string]: any;
    };
}


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
    label: string;
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
    status: string;
    branch_id: number | null;
    branch_name: string | null;
    image: string | null;
    service_charge_ksh: number;
    status_badge: HearseStatusBadge;
    is_booked: boolean;
}

/**
 * Response: every hearse, split into available / booked buckets.
 */
export interface HearseAvailabilityResponseDto {
    status: 'success';
    date: string;
    available_hearses: HearseAvailabilityItemDto[];
    booked_hearses: HearseAvailabilityItemDto[];
    total_available: number;
    total_booked: number;
}

/**
 * One day of a MULTI-DATE availability result.
 * A hearse is "available" for that day when it has no active booking covering it.
 */
export interface HearseDayAvailabilityDto {
    date: string;
    available_hearses: HearseAvailabilityItemDto[];
    booked_hearses: (HearseAvailabilityItemDto & {
        hearse_id: number;
        booking_id: number | null;
        booking_code: string | null;
        client_name: string | null;
        booking_dates: string[];
    })[];
    total_available: number;
    total_booked: number;
}

/**
 * Response for `GET/POST /availability/check-by-dates`.
 * hundreds of parallel calls for month-long date ranges).
 */
export interface HearseMultiDateAvailabilityResponseDto {
    status: 'success';
    dates: string[];
    days: HearseDayAvailabilityDto[];
    hearses: HearseAvailabilityItemDto[];
    invalid_dates: string[];
    past_dates: string[];
    matched_count: number;
}

// ─── Booking 

/**
 * Request body for creating (or auto-matching) a hearse booking.
 */
export interface HearseBookingRequestDto {
    hearse_id?: number | string;
    deceased_id?: string;
    client_name: string;
    client_phone: string;
    client_email?: string;
    destination: string;
    from_location?: string;
    to_location?: string;
    booking_dates: string[];
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

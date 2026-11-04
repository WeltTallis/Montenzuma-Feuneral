export interface HearseBooking {
    id?: number;
    booking_id?: number;
    booking_code?: string;
    hearse_id?: number;
    tenant_db_name?: string;
    client_name?: string;
    client_phone?: string;
    client_email?: string;
    destination?: string;
    booking_date?: string;
    booking_dates?: string | string[];
    status?: string;
    created_at?: string;
    updated_at?: string;
    branch_id?: number;
    branch_code?: string;
    booked_by?: string;
    from_timestamp?: string;
    to_timestamp?: string;
    special_requests?: string;
}

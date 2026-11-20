import { randomBytes } from 'crypto';

export interface HearseBookingCodeInput {
    hearseName?: string | null;
    plateNumber?: string | null;
    clientName: string;
    bookingDate: string;
}

function codePart(value: string | null | undefined, fallback: string, maxLength: number): string {
    return value?.replace(/[^A-Za-z0-9]/g, '').slice(0, maxLength).toUpperCase() || fallback;
}

export function generateHearseBookingCode({
    hearseName,
    plateNumber,
    clientName,
    bookingDate,
}: HearseBookingCodeInput): string {
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(bookingDate)
        ? new Date(`${bookingDate}T00:00:00.000Z`)
        : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== bookingDate) {
        throw new Error('A valid YYYY-MM-DD booking date is required to generate a booking code.');
    }

    const hearseCode = codePart(hearseName || plateNumber, 'H', 6);
    const clientCode = codePart(clientName, 'CLIENT', 8);
    const dateCode = bookingDate.replace(/-/g, '');
    const uniqueSuffix = randomBytes(8).toString('hex').toUpperCase();
    return `BK-${hearseCode}-${clientCode}-${dateCode}-${uniqueSuffix}`;
}

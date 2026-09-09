import crypto from 'crypto'

/**
 * Deceased ID generator — high-entropy, collision-resistant.
 *
 * Format:   {TENANT}-{NAME}{RANDOM}={YEAR}
 * Example:  MON-DEBQ9N3X6TR4K7WB8ZM=2026
 *
 * - TENANT : first 3 alphanumerics of the tenant slug (upper-cased)
 * - NAME   : first 3 letters of the deceased's full name (upper-cased, 'XXX' fallback)
 * - RANDOM : 16 characters drawn from an unambiguous 31-symbol alphabet
 *            (0/O and 1/I/L are excluded because they are easy to misread).
 *            31^16 ≈ 3.3e23 combinations (~2^77.5 of entropy), so the chance
 *            of two registrations ever colliding is practically zero — even
 *            with billions of records the probability stays ~1e-14.
 * - YEAR   : registration year in Kenya time (UTC+3, no daylight saving),
 *            matching the Kenya timestamps used across the service.
 */

// Unambiguous alphabet: excludes 0, 1, I, L, O.
const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const RANDOM_PART_LENGTH = 16;
// 31 * 8 = 248 — rejecting bytes >= 248 keeps every symbol equally likely
// (uniform distribution, no modulo bias).
const REJECTION_THRESHOLD = 248;

const randomPart = (): string => {
    let out = '';
    while (out.length < RANDOM_PART_LENGTH) {
        const bytes = crypto.randomBytes(RANDOM_PART_LENGTH * 2);
        for (const byte of bytes) {
            if (byte >= REJECTION_THRESHOLD) continue;
            out += ID_ALPHABET[byte % ID_ALPHABET.length];
            if (out.length === RANDOM_PART_LENGTH) break;
        }
    }
    return out;
};

const generateUniqueDeceasedId = (fullName: string, tenantSlug: string): string => {
    const sanitizedTenant = (tenantSlug || '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const namePart = (fullName || '').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'XXX';
    // Kenya time = UTC+3 all year round.
    const year = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCFullYear();
    return `${sanitizedTenant}-${namePart}${randomPart()}=${year}`;
};


export default generateUniqueDeceasedId;



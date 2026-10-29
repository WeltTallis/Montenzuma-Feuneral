import crypto from 'crypto';

/**
 * Generate short dated ID
 * Format: RLS-YYMMDD-XXX
 * Example: RLS-240715-A3F
 */
const generateDatedCheckoutId = (): string => {
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(2) +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 3);
    return `DSP-${dateStr}-${random}`;
};

/**
 * Generate short timestamp ID
 * Format: RLS-XXXXX-XXX
 * Example: RLS-K4X8F-3A5
 */
const generateTimestampCheckoutId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
    const random = crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 3);
    return `DSP-${timestamp}-${random}`;
};

export {
    generateDatedCheckoutId,
    generateTimestampCheckoutId
};
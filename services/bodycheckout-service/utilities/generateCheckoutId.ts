import crypto from 'crypto';

/**
 * Generate short dated ID
 * Format: NRB-DSP-YYMMDD-XXX
 * Example: DSP-240715-A3F
 */
const generateDatedCheckoutId = (): string => {
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(2) +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `DSP-${dateStr}-${random}`;
};




/**
 * Generate short timestamp ID
 * Format: RLS-XXXXX-XXX
 * Example: RLS-K4X8F-3A5
 */
const generateTimestampCheckoutId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `DSP-${timestamp}-${random}`;
};

export {
    generateDatedCheckoutId,
    generateTimestampCheckoutId
};

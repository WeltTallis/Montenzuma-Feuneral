
import crypto from "crypto";

/**
 * Deceased ID Generator
 *
 * Format:
 * TEN-NAMERANDOMYEAR
 *
 * Example:
 * MON-JOHQ9N3X6TR4K7WB8ZM2026
 *
 * TEN    = First 3 tenant characters
 * NAME   = First 3 alphabetic characters of deceased's name
 * RANDOM = 16 cryptographically secure characters
 * YEAR   = Kenya registration year (UTC+3)
 */

// CONFIGURATION


const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const RANDOM_PART_LENGTH = 16;

const REJECTION_THRESHOLD = 248;


const generateRandomPart = (): string => {
    let result = "";

    while (result.length < RANDOM_PART_LENGTH) {
        const bytes = crypto.randomBytes(32);

        for (const byte of bytes) {
            // Avoid modulo bias
            if (byte >= REJECTION_THRESHOLD) {
                continue;
            }

            result += ID_ALPHABET[byte % ID_ALPHABET.length];

            if (result.length === RANDOM_PART_LENGTH) {
                break;
            }
        }
    }

    return result;
};



const getKenyaYear = (): number => {
    const now = new Date();

    // Kenya uses UTC+3 throughout the year
    const kenyaTime = new Date(
        now.getTime() + 3 * 60 * 60 * 1000
    );

    return kenyaTime.getUTCFullYear();
};



const generateUniqueDeceasedId = (
    fullName: string,
    tenantSlug: string
): string => {

    try {
        // Validate inputs
        if (
            typeof fullName !== "string" ||
            !fullName.trim()
        ) {
            throw new Error("Deceased full name is required");
        }

        if (
            typeof tenantSlug !== "string" ||
            !tenantSlug.trim()
        ) {
            throw new Error("Tenant slug is required");
        }

        const sanitizedTenant = tenantSlug
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 3)
            .toUpperCase();

        if (!sanitizedTenant) {
            throw new Error("Invalid tenant slug");
        }

        const sanitizedName = fullName
            .normalize("NFKD")
            .replace(/[^a-zA-Z]/g, "")
            .substring(0, 3)
            .toUpperCase();

        const namePart = sanitizedName || "XXX";

        const random = generateRandomPart();


        const year = getKenyaYear();

        return `${sanitizedTenant}-${namePart}${random}${year}`;

    } catch (error) {

        if (error instanceof Error) {
            throw error;
        }

        throw new Error("Failed to generate deceased ID");
    }
};

export default generateUniqueDeceasedId;

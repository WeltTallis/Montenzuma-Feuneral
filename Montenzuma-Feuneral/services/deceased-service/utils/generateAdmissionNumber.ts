
type Gender = "Male" | "Female" | "M" | "F";

/**
 * Admission number generator.
 *
 * PHASE 1:
 * A1 - A900
 * B1 - B900
 * ...
 * Z1 - Z900
 *
 * PHASE 2:
 * A0001 - A0900
 * B0001 - B0900
 * ...
 * Z0001 - Z0900
 *
 * Examples:
 * MA1
 * MA900
 * MZ900
 * MA0001
 * MA0002
 * MA0900
 * MB0001
 *
 * Male and female share ONE sequence per tenant.
 *
 * Total capacity: 46,800 admissions.
 */

const generateAdmissionNumber = (
    gender: Gender,
    sequence: number
): string => {

    // Validate gender
    if (typeof gender !== "string") {
        throw new Error("Invalid gender supplied.");
    }

    const normalizedGender = gender.trim().toUpperCase();

    let genderPrefix: "M" | "F";

    if (normalizedGender === "M" || normalizedGender === "MALE") {
        genderPrefix = "M";
    } else if (
        normalizedGender === "F" ||
        normalizedGender === "FEMALE"
    ) {
        genderPrefix = "F";
    } else {
        throw new Error("Gender must be Male, Female, M or F.");
    }

    // Validate sequence
    if (!Number.isSafeInteger(sequence) || sequence < 1) {
        throw new Error(
            "Admission sequence must be a positive integer."
        );
    }

    // Configuration
    const LETTER_COUNT = 26;
    const MAX_PER_LETTER = 900;

    const PHASE_CAPACITY = LETTER_COUNT * MAX_PER_LETTER;

    const TOTAL_CAPACITY = PHASE_CAPACITY * 2;

    // Prevent cycling and duplicates
    if (sequence > TOTAL_CAPACITY) {
        throw new Error(
            `Admission capacity reached. Maximum allowed is ${TOTAL_CAPACITY}.`
        );
    }

    let adjustedSequence: number;
    let useFourDigits: boolean;

    // PHASE 1: A1 - Z900
    if (sequence <= PHASE_CAPACITY) {

        adjustedSequence = sequence - 1;
        useFourDigits = false;

    } else {

        // PHASE 2: A0001 - Z0900
        adjustedSequence = sequence - PHASE_CAPACITY - 1;
        useFourDigits = true;
    }

    // Determine letter
    const letterIndex = Math.floor(
        adjustedSequence / MAX_PER_LETTER
    );

    const letter = String.fromCharCode(65 + letterIndex);

    // Determine number
    const numberValue =
        (adjustedSequence % MAX_PER_LETTER) + 1;

    const numberPart = String(numberValue).padStart(
        useFourDigits ? 4 : 1,
        "0"
    );

    return `${genderPrefix}${letter}${numberPart}`;
};

export default generateAdmissionNumber;

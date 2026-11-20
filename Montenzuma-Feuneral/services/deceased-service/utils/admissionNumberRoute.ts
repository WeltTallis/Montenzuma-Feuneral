
import { Request, Response } from "express";
import { safeTenantQuery } from "../../../shared/dbConfig";
import generateAdmissionNumber from "./generateAdmissionNumber";
import Logger from "../../../packages/shared-logger/src/index";

type Gender = "M" | "F";

/**
 * GET /admission-number/:gender
 *
 * Generates an admission number using a shared sequence
 * for both male and female registrations.
 *
 * PHASE 1:
 * A1 - Z900
 *
 * PHASE 2:
 * A01 - Z900
 *
 * Total capacity: 46,800 admissions per tenant.
 *
 * NOTE:
 * This endpoint previews an admission number.
 * It does not reserve the number.
 */

export const getAdmissionNumber = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        // =====================================
        // 1. GET AND VALIDATE GENDER
        // =====================================

        const rawGender = req.params.gender;

        const normalizedGender =
            typeof rawGender === "string"
                ? rawGender.trim().toUpperCase()
                : "M";

        let gender: Gender;

        if (
            normalizedGender === "M" ||
            normalizedGender === "MALE"
        ) {
            gender = "M";
        } else if (
            normalizedGender === "F" ||
            normalizedGender === "FEMALE"
        ) {
            gender = "F";
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid gender. Use Male, Female, M or F."
            });
        }

        // =====================================
        // 2. GET TENANT INFORMATION
        // =====================================

        const dbName = (req as any).tenant?.db_name;

        const tenantSlug =
            (req as any).tenantSlug || "unknown";

        if (!dbName) {
            return res.status(400).json({
                success: false,
                message: "Tenant database not configured"
            });
        }

        // =====================================
        // 3. GET SHARED ADMISSION SEQUENCE
        // =====================================

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM deceased
            WHERE is_deleted = 0
               OR is_deleted IS NULL
        `;

        const countResult = await safeTenantQuery(
            dbName,
            countQuery
        );

        const total = Number(
            (countResult as any)?.[0]?.total ?? 0
        );

        if (
            !Number.isSafeInteger(total) ||
            total < 0
        ) {
            throw new Error(
                "Invalid admission record count"
            );
        }

        const nextSequence = total + 1;

        // =====================================
        // 4. GENERATE ADMISSION NUMBER
        // =====================================

        const admissionNumber = generateAdmissionNumber(
            gender,
            nextSequence
        );

        // =====================================
        // 5. LOG RESULT
        // =====================================

        Logger.info({
            message: `Admission number generated: ${admissionNumber}`,
            tenantSlug,
            gender,
            sequence: nextSequence
        });

        // =====================================
        // 6. RETURN RESPONSE
        // =====================================

        return res.status(200).json({
            success: true,
            message: "Admission number generated successfully",
            data: {
                admission_number: admissionNumber,
                sequence: nextSequence,
                gender
            }
        });

    } catch (error: unknown) {

        Logger.error({
            message: "Error generating admission number",
            error
        });

        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error";

        if (
            errorMessage.includes("Admission capacity reached")
        ) {
            return res.status(409).json({
                success: false,
                message: errorMessage
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to generate admission number"
        });
    }
};

export default getAdmissionNumber;

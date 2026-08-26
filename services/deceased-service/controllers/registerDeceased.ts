import { safeTenantExecute, safeTenantQuery } from "../../../shared/dbConfig";
import { getKenyaTimeISO } from "../../../packages/shared-utils/dist/timestamps";
import redisService from "../../../packages/shared-services/dist/redisService";
import generateAdmissionNumber from "../utils/generateAdmissionNumber";
import Logger from "../../../packages/shared-logger/src/index";
import generateUniqueDeceasedId from "../utils/deceasedId";
import { processSignature } from "../utils/uploadSignature";
import { NextOfKinModel } from "../models/NextOfKin";
import { Request, Response } from "express";
import * as z from "zod";



const SERVICE_NAME = 'deceased-service';

// ============================================
// VALIDATION SCHEMA
// ============================================

const registerDeceasedSchema = z.object({
    full_name: z.string().min(4, "Full name must have at least 4 characters"),
    cause_of_death: z.string().optional().nullable(),
    national_id: z.string().optional().nullable(),
    received_from: z.string().optional().nullable(),
    permit_no: z.string().optional().nullable(),
    age: z.number().int().min(0).optional().nullable(),
    time_received: z.string().optional().nullable(),
    body_status: z.string().optional().nullable(),
    contact_person: z.string().optional().nullable(),
    tell_no: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    date_of_death: z.string().optional().nullable(),
    signature: z.string().optional().nullable(),
    place_of_death: z.string().optional().nullable(),
    id_type: z.string().optional().nullable(),
    alternative_phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    receiving_officer: z.string().optional().nullable(),
    relationship: z.string().optional().nullable(),
});

// ============================================
// REGISTER DECEASED
// ============================================

export const registerNewDeceased = async (
    req: Request,
    res: Response
): Promise<Response> => {
    let tenantId: string | undefined;
    let tenantSlug: string | undefined;
    let full_name = "";
    let deceased_id = "";

    try {
        const tenant = (req as any).tenant;
        const dbName = tenant?.db_name;
        tenantId = tenant?.id;
        tenantSlug = (req as any).tenantSlug || "unknown";

        if (!dbName) {
            Logger.warn({ message: "Missing tenant database information" });
            return res.status(400).json({
                success: false,
                message: "Please provide valid X-tenant headers"
            });
        }

        // ==============================
        // VALIDATE BODY
        // ==============================

        const validation = registerDeceasedSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                errors: validation.error.flatten().fieldErrors
            });
        }

        const data = validation.data;
        full_name = data.full_name;

        // ==============================
        // CREATE ID
        // ==============================
        Logger.info({
            message: "Generating deceased system identification"
        });
        deceased_id = generateUniqueDeceasedId(full_name, tenantSlug);
        const now = getKenyaTimeISO();

        // ==============================
        // SAVE SIGNATURE AS PNG FILE
        // ==============================

        let signaturePath = null;
        if (data.signature && data.signature.startsWith('data:image/png;base64,')) {
            try {
                Logger.info({ message: "Saving signature via centralized upload service" });
                const base64Data = data.signature.replace(/^data:image\/png;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                signaturePath = await processSignature(buffer, `sig_${deceased_id}`, tenantSlug);
                Logger.info({
                    message: "Signature saved successfully",
                    path: signaturePath,
                    size: `${(buffer.length / 1024).toFixed(2)} KB`
                });
            } catch (sigError: any) {
                Logger.warn({
                    message: "Failed to save signature - signature will not be stored",
                    error: sigError?.message || sigError,
                    stack: sigError?.stack,
                    errorType: sigError?.constructor?.name,
                    fullError: JSON.stringify(sigError)
                });
                signaturePath = null;
            }
        }

        // ==============================
        // DUPLICATE REGISTRATION PROTECTION (Idempotency)
        // ==============================
        // REMOVED 'signature' from SELECT since it was causing issues
        const duplicateCheckQuery = `SELECT deceased_id, admission_number, created_at FROM deceased WHERE deceased_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`;
        const duplicateResult = await safeTenantQuery(dbName, duplicateCheckQuery, [deceased_id]);

        if (duplicateResult && (duplicateResult as any[]).length > 0) {
            const existing = (duplicateResult as any[])[0];
            Logger.warn({
                message: `Duplicate registration attempt blocked - deceased_id ${existing.deceased_id} already exists`,
                deceased_id: existing.deceased_id,
            });

            return res.status(200).json({
                success: true,
                message: "Deceased already registered (duplicate request detected)",
                deceased_id: existing.deceased_id,
                admission_number: existing.admission_number,
                signature_path: null,
                next_of_kin_registered: false,
                duplicate: true,
                data: {
                    deceased_id: existing.deceased_id,
                    admission_number: existing.admission_number,
                    full_name: data.full_name,
                    gender: data.gender,
                    contact_person: data.contact_person,
                    relationship: data.relationship,
                }
            });
        }

        // ==============================
        // GENERATE ADMISSION NUMBER
        // ==============================

        const countQuery = `SELECT COUNT(*) as total FROM deceased WHERE (is_deleted = 0 OR is_deleted IS NULL)`;
        const countResult = await safeTenantQuery(dbName, countQuery);
        const total = Number((countResult as any)[0]?.total || 0);
        const nextSequence = total + 1;
        const admission_number = generateAdmissionNumber(data.gender || "M", nextSequence);

        // ==============================
        // INSERT RECORD - MATCHING EXACT COLUMN ORDER FROM TABLE
        // ==============================

        // Updated INSERT query without county and currency
        const insertQuery = `
    INSERT INTO deceased
    (
        deceased_id,
        admission_number,
        cause_of_death,
        place_of_death,
        body_status,
        national_id,
        email,
        phone_number,
        alternative_phone,
        received_from,
        receiving_officer,
                date_admitted,
        time_received,
        date_of_birth,
        date_of_death,
        date_registered,
        full_name,
        gender,
        age,
        created_by,
        status,
        total_mortuary_charge,
        dispatch_date,
        extra_charges_amount,
        next_of_kin_count,
        is_deleted,
        branch_code,
        created_at,
        signature,
        relationship,
        permit_number
    )
    VALUES (?, ?, ?, ?,  ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

        await safeTenantExecute(
            dbName,
            insertQuery,
            [
                deceased_id,
                admission_number,
                data.cause_of_death || null,
                data.place_of_death || null,
                data.body_status || 'Normal Condition',
                data.national_id || null,
                data.email || null,
                data.tell_no || null,
                data.alternative_phone || null,
                data.received_from || null,
                data.receiving_officer || null,
                now, // date_admitted
                data.time_received || null,
                null, // date_of_birth (now accepts NULL)
                data.date_of_death || null,
                now, // date_registered
                data.full_name,
                data.gender || null,
                data.age || 0,
                null, // created_by
                'active', // status
                0.00, // total_mortuary_charge
                null, // dispatch_date
                0.00, // extra_charges_amount
                0, // next_of_kin_count
                0, // is_deleted
                null, // branch_code
                now, // created_at
                signaturePath, // signature
                data.relationship || null, // relationship
                data.permit_no || null // permit_number
            ]
        );

        Logger.info({ message: `Deceased registered ${deceased_id} - Admission: ${admission_number}` });

        // ==============================
        // INVALIDATE CACHE
        // ==============================
        if (tenantSlug && tenantId) {
            await redisService.serviceDel('deceased-service', tenantSlug, `deceased:detail:${deceased_id}`);
            await redisService.serviceDel('deceased-service', tenantSlug, `deceased:list:${tenantId}`);
            Logger.info(`[Cache] Deceased cache invalidated for ${tenantSlug}`);
        }

        // ==============================
        // AUTO-REGISTER NEXT OF KIN - REMOVED verified_by
        // ==============================
        let nextOfKinRegistered = false;
        const hasNokInfo = !!(data.contact_person || data.tell_no || data.relationship || data.national_id);
        if (hasNokInfo) {
            try {
                // Normalize the ID type to the next_of_kin ENUM values
                const rawIdType = String(data.id_type || '').toLowerCase().replace(/\s+/g, '-');
                const validIdType = ['national-id', 'passport', 'voters-card', 'other'].includes(rawIdType)
                    ? rawIdType
                    : (rawIdType ? 'other' : null);

                const nextOfKinData = {
                    deceased_id,
                    full_name: data.contact_person || 'Not Provided',
                    relationship: data.relationship || 'Not Specified',
                    contact: data.tell_no || '',
                    email: data.email || null,
                    alternative_contact: data.alternative_phone || null,
                    id_number: data.national_id || null,
                    id_type: validIdType,
                    address: null,
                    signature: signaturePath,
                    is_primary: true,
                };

                await NextOfKinModel.create(req, nextOfKinData);
                nextOfKinRegistered = true;
                Logger.info({ message: `Next of kin auto-registered for ${deceased_id}` });

                // Invalidate next of kin cache
                if (tenantSlug && tenantId) {
                    await redisService.serviceDel('deceased-service', tenantSlug, `nextofkin:deceased:${deceased_id}`);
                    await redisService.serviceDel('deceased-service', tenantSlug, `nextofkin:list:${tenantId}`);
                }
            } catch (nextOfKinError) {
                Logger.warn({
                    message: `Failed to auto-register next of kin for ${deceased_id}`,
                    error: nextOfKinError
                });
            }
        }

        // ==============================
        // EMIT NOTIFICATION
        // ==============================
        try {
            const axios = require('axios');
            const configuredUrl = process.env.SOCKETIO_SERVICE_URL || '';
            const candidateUrls = [
                configuredUrl,
                'http://localhost:5018',
                'http://127.0.0.1:5018',
            ].filter(Boolean);

            const emitPayload = {
                tenantSlug,
                data: {
                    id: `deceased-${deceased_id}-${Date.now()}`,
                    deceasedId: deceased_id,
                    fullName: data.full_name,
                    admissionNumber: admission_number,
                    dateOfAdmission: now,
                    title: 'New Admission',
                    message: `New deceased admitted: ${data.full_name}`,
                    type: 'new_body',
                    priority: 'medium',
                    fullContent: `Name: ${data.full_name}\nAdmission Number: ${admission_number}\nGender: ${data.gender}\nDate: ${now}`,
                }
            };

            let emitted = false;
            for (const socketioServiceUrl of candidateUrls) {
                try {
                    await axios.post(`${socketioServiceUrl}/emit/deceased-admitted`, emitPayload, { timeout: 3000 });
                    emitted = true;
                    Logger.info({ message: `Emitted deceased-admitted for ${deceased_id} via ${socketioServiceUrl}` });
                    break;
                } catch (urlError: any) {
                    Logger.warn({ message: `SocketIO URL failed: ${socketioServiceUrl}`, error: urlError.message });
                }
            }

            if (!emitted) {
                Logger.warn({ message: `All socketio URLs failed for ${deceased_id}` });
            }
        } catch (emitError: any) {
            Logger.warn({
                message: `Failed to emit deceased-admitted notification`,
                error: emitError.message
            });
        }

        return res.status(201).json({
            success: true,
            message: "Deceased registered successfully",
            deceased_id,
            admission_number,
            signature_path: signaturePath,
            next_of_kin_registered: nextOfKinRegistered,
            data: {
                deceased_id,
                admission_number,
                full_name: data.full_name,
                gender: data.gender,
                contact_person: data.contact_person,
                relationship: data.relationship
            }
        });

    } catch (error: any) {
        Logger.error({
            message: "Error registering deceased",
            error: error.message || error
        });

        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message || "Internal server error"
        });
    }
};
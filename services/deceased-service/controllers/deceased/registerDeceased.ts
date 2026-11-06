import { getTenantDB, safeTenantExecute } from "../../../../shared/dbConfig";
import { getKenyaTimeISO } from "../../../../packages/shared-utils/dist/timestamps";
import generateAdmissionNumber from "../../utils/generateAdmissionNumber";
import Logger from "../../../../packages/shared-logger/src/index";
import generateUniqueDeceasedId from "../../utils/deceasedId";
import { processSignature } from "../../utils/uploadSignature";
import { NextOfKinModel } from "../../models/NextOfKin";
import { Request, Response } from "express";
import * as z from "zod";
import { enqueueSideEffect } from "../../../app-global/utils/asyncSideEffectQueue";
import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";



const SERVICE_NAME = 'deceased-service';

// ============================================
// VALIDATION SCHEMA
// ============================================

const validCalendarDate = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const registerDeceasedSchema = z.object({
    full_name: z.string().trim().min(4, "Full name must have at least 4 characters").max(255),
    cause_of_death: z.string().optional().nullable(),
    national_id: z.string().optional().nullable(),
    received_from: z.string().optional().nullable(),
    permit_no: z.string().optional().nullable(),
    age: z.preprocess(
        (value) => value === '' || value == null ? null : Number(value),
        z.number().int().min(0).nullable().optional()
    ),
    time_received: z.string().trim().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Time must use HH:mm or HH:mm:ss format').optional().nullable(),
    body_status: optionalText(100),
    contact_person: optionalText(255),
    tell_no: optionalText(20),
    gender: z.enum(["Male", "Female", "M", "F", "male", "female"]),
    date_of_death: z.string().trim().refine(validCalendarDate, 'Date of death must be a valid YYYY-MM-DD date').optional().nullable(),
    signature: z.string().optional().nullable(),
    place_of_death: optionalText(255),
    id_type: optionalText(100),
    alternative_phone: optionalText(20),
    email: z.preprocess((value) => value === '' ? null : value, z.string().trim().email().max(255).optional().nullable()),
    receiving_officer: optionalText(255),
    relationship: optionalText(100),
    registration_request_id: z.string().trim().max(64).optional().nullable(),

});

const normalizeGenderForColumn = (rawGender: string, columnType: string): { admissionGender: 'M' | 'F'; storedGender: string } => {
    const normalized = rawGender.trim().toLowerCase();
    const admissionGender = normalized === 'male' || normalized === 'm' ? 'M' : 'F';
    const enumValues = columnType.toLowerCase().startsWith('enum(')
        ? [...columnType.matchAll(/'((?:[^']|'')*)'/g)].map((match) => match[1].replace(/''/g, "'"))
        : [];
    const allowed = admissionGender === 'M' ? ['male', 'm'] : ['female', 'f'];
    const storedGender = enumValues.length
        ? enumValues.find((value) => allowed.includes(value.toLowerCase()))
        : (admissionGender === 'M' ? 'Male' : 'Female');
    if (!storedGender) {
        throw new Error(`The tenant database gender column does not support ${admissionGender === 'M' ? 'male' : 'female'} values`);
    }
    return { admissionGender, storedGender };
};


// REGISTER DECEASED


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


        // VALIDATE BODY


        const validation = registerDeceasedSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                errors: validation.error.flatten().fieldErrors
            });
        }

        const data = validation.data;
        full_name = data.full_name;


        // CREATE ID

        Logger.info({
            message: "Generating deceased system identification"
        });
        deceased_id = generateUniqueDeceasedId(full_name, tenantSlug);
        const now = getKenyaTimeISO();
        const requestId = data.registration_request_id || String(req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || '').trim().slice(0, 64) || null;
        const pool = await getTenantDB(dbName);
        const connection = await pool.getConnection();
        let lockAcquired = false;
        let transactionStarted = false;
        let admission_number = '';
        let storedGender = '';
        let signaturePath: string | null = null;

        try {
            const lockName = `deceased-admission-${createHash('sha256').update(dbName).digest('hex').slice(0, 40)}`;
            const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]) as any;
            if (Number(lockRows?.[0]?.acquired) !== 1) {
                return res.status(503).json({ success: false, message: 'Registration is busy. Please retry shortly.' });
            }
            lockAcquired = true;
            await connection.beginTransaction();
            transactionStarted = true;

            const [columns] = await connection.query(
                `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deceased' AND COLUMN_NAME IN ('gender', 'registration_request_id')`
            ) as any;
            const genderColumn = columns.find((column: any) => column.COLUMN_NAME === 'gender');
            if (!genderColumn) throw new Error('The deceased table is missing its gender column');
            storedGender = normalizeGenderForColumn(data.gender, genderColumn.COLUMN_TYPE).storedGender;
            const supportsRequestId = columns.some((column: any) => column.COLUMN_NAME === 'registration_request_id');

            if (requestId && supportsRequestId) {
                const [existingRows] = await connection.query(
                    'SELECT deceased_id, admission_number, full_name, gender, contact_person, relationship FROM deceased WHERE registration_request_id = ? LIMIT 1',
                    [requestId]
                ) as any;
                if (existingRows.length) {
                    await connection.commit();
                    transactionStarted = false;
                    const existing = existingRows[0];
                    return res.status(200).json({
                        success: true,
                        message: 'Deceased already registered (duplicate request detected)',
                        deceased_id: existing.deceased_id,
                        admission_number: existing.admission_number,
                        signature_path: null,
                        next_of_kin_registered: false,
                        duplicate: true,
                        data: existing,
                    });
                }
            }

            const [countRows] = await connection.query('SELECT COUNT(*) AS total FROM deceased') as any;
            let sequence = Number(countRows[0]?.total || 0) + 1;
            const admissionGender = normalizeGenderForColumn(data.gender, genderColumn.COLUMN_TYPE).admissionGender;
            for (; sequence <= 46800; sequence += 1) {
                const candidate = generateAdmissionNumber(admissionGender, sequence);
                const [matches] = await connection.query('SELECT 1 FROM deceased WHERE admission_number = ? LIMIT 1', [candidate]) as any;
                if (!matches.length) {
                    admission_number = candidate;
                    break;
                }
            }
            if (!admission_number) throw new Error('Admission number capacity reached');

            const insertColumns = [
                'deceased_id', 'admission_number', 'cause_of_death', 'place_of_death', 'body_status', 'national_id',
                'email', 'phone_number', 'alternative_phone', 'received_from', 'contact_person', 'receiving_officer',
                'date_admitted', 'time_received', 'date_of_birth', 'date_of_death', 'date_registered', 'full_name',
                'gender', 'age', 'created_by', 'status', 'total_mortuary_charge', 'dispatch_date', 'extra_charges_amount',
                'next_of_kin_count', 'is_deleted', 'branch_code', 'created_at', 'signature', 'relationship', 'permit_number',
            ];
            const insertValues: unknown[] = [
                deceased_id, admission_number, data.cause_of_death || null, data.place_of_death || null,
                data.body_status || 'Normal Condition', data.national_id || null, data.email || null, data.tell_no || null,
                data.alternative_phone || null, data.received_from || null, data.contact_person || null,
                data.receiving_officer || null, now, data.time_received || null, null, data.date_of_death || null,
                now, data.full_name, storedGender, data.age ?? 0, null, 'active', 0, null, 0, 0, 0, null, now,
                null, data.relationship || null, data.permit_no || null,
            ];
            if (requestId && supportsRequestId) {
                insertColumns.push('registration_request_id');
                insertValues.push(requestId);
            }
            await connection.query(
                `INSERT INTO deceased (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`,
                insertValues
            );
            await connection.commit();
            transactionStarted = false;
        } finally {
            if (transactionStarted) await connection.rollback().catch(() => undefined);
            if (lockAcquired) await connection.query('SELECT RELEASE_LOCK(?)', [`deceased-admission-${createHash('sha256').update(dbName).digest('hex').slice(0, 40)}`]).catch(() => undefined);
            connection.release();
        }

        // Persist the optional signature only after the admission commits. A storage
        // failure therefore cannot leave a file behind for a rolled-back record.
        if (data.signature?.startsWith('data:image/png;base64,')) {
            try {
                const base64Data = data.signature.replace(/^data:image\/png;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                signaturePath = await processSignature(buffer, `sig_${deceased_id}`, tenantSlug);
                await safeTenantExecute(dbName, 'UPDATE deceased SET signature = ? WHERE deceased_id = ?', [signaturePath, deceased_id]);
            } catch (signatureError: any) {
                if (signaturePath) {
                    const uploadRoot = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
                    const safeSlug = String(tenantSlug || 'system').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'system';
                    await fs.unlink(path.join(uploadRoot, safeSlug, 'signatures', `sig_${deceased_id}.png`)).catch(() => undefined);
                }
                signaturePath = null;
                Logger.warn({ message: 'Could not persist deceased signature', error: signatureError?.message || signatureError });
            }
        }

        Logger.info({ message: `Deceased registered ${deceased_id} - Admission: ${admission_number}` });

        const sideEffects: Array<() => Promise<void>> = data.tell_no ? [
            () => enqueueSideEffect({
                kind: 'sms',
                payload: {
                    phone: data.tell_no,
                    tenantSlug,
                    event: 'body intake confirmation',
                    message: `Montenzuma Monalisa Funeral Home: Our sincere condolences. We wish to inform you that the body of ${data.full_name} has  been   received  into our care. Admission number: ${admission_number}.Please be assured that we will care for your loved one with dignity and respect. If there is anything you need, we are just a call away Call +254740045355.`,
                },
            }),
        ] : [];


        // INVALIDATE CACHE — wipe every deceased key for this tenant

        if (tenantSlug && tenantId) {
            sideEffects.push(() => enqueueSideEffect({
                kind: 'cache-clear',
                payload: { serviceName: 'deceased-service', scopes: [tenantSlug] },
            }));
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
        sideEffects.push(() => enqueueSideEffect({
            kind: 'deceased-admitted',
            payload: {
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
            },
        }));

        void Promise.allSettled(sideEffects.map((enqueue) => enqueue())).then((results) => {
            results.filter((result) => result.status === 'rejected').forEach((result) => {
                Logger.warn({ message: 'Could not enqueue deceased intake side effect', error: (result as PromiseRejectedResult).reason?.message });
            });
        });

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
            message: "Registration failed due to a server error. Please retry; the request is safe to repeat.",
        });
    }
};

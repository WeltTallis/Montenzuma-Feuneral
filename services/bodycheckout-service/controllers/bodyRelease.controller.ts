
import { getKenyaTimeISO, getKenyaDate } from '../../../packages/shared-utils/dist/timestamps'
import { generateDatedCheckoutId } from '../utilities/generateCheckoutId';
import { getTenantDB, resolveDatabase } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/dist/index';
import { Request, Response, NextFunction } from 'express';
import * as Zod from 'zod';
import axios from 'axios';
import sharp from 'sharp';

/**
 * Force a signature image into pure INK-BLUE ink on a transparent background.
 * Client pads draw with penColor #0f33e7, but flatten/palette PNG encoding
 * could darken the blue ink towards black. Rebuilding the pixels guarantees
 * every stored signature is always ink blue.
 */
async function toInkBlue(buffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const INK_BLUE = { r: 15, g: 51, b: 231 }; // #0f33e7 — same as the signature pad
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    const ink = alpha * Math.min(1, Math.pow(1 - luminance, 0.45) * 1.13);
    out[i] = INK_BLUE.r;
    out[i + 1] = INK_BLUE.g;
    out[i + 2] = INK_BLUE.b;
    out[i + 3] = Math.round(Math.min(1, Math.max(0, ink)) * 255);
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}



const now = getKenyaTimeISO();

/**
 * Process a base64 signature and upload it to the centralized uploads service.
 * Returns the URL path of the uploaded signature, or the original data URL on failure.
 */
async function processAndUploadSignature(
  signatureData: string,
  tenantSlug: string,
  filenamePrefix: string
): Promise<string> {
  if (!signatureData) return null;

  // If it's already a URL path, return as-is
  if (signatureData.startsWith('/uploads/') || signatureData.startsWith('http')) {
    return signatureData;
  }

  // If it's a base64 data URL, process and save it
  if (signatureData.startsWith('data:image')) {
    try {
      const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Force ink-blue color, then fit within 800x300 (no palette quantisation)
      const inkBuffer = await toInkBlue(buffer);
      const processedBuffer = await sharp(inkBuffer)
        .resize(800, 300, { fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();

      // Save directly to global uploads folder
      const fs = await import('fs');
      const path = await import('path');
      const globalUploadsDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
      const signatureDir = path.join(globalUploadsDir, tenantSlug || 'system', 'signatures');

      // Ensure directory exists
      await fs.promises.mkdir(signatureDir, { recursive: true });

      // Save the PNG file
      const filename = `${filenamePrefix}_${Date.now()}.png`;
      const fullPath = path.join(signatureDir, filename);
      await fs.promises.writeFile(fullPath, processedBuffer);

      // Create URL path
      const urlPath = `/uploads/${tenantSlug || 'system'}/signatures/${filename}`;

      Logger.info(`[RELEASE] Signature saved directly to disk: ${urlPath}`);
      return urlPath;
    } catch (error: any) {
      Logger.warn(`[RELEASE] Failed to process signature: ${error.message}`);
      return signatureData; // Fallback to raw data
    }
  }

  return signatureData;
}

// Validation schema
const releaseBodySchema = Zod.z.object({
  id_number: Zod.z.string().min(1, "ID number is required"),
  next_kin: Zod.z.string().min(1, "Next of kin is required"),
  tell_number: Zod.z.string().min(1, "Telephone number is required"),
  terms_accepted: Zod.z.boolean().refine(val => val === true, {
    message: "Terms must be accepted"
  }),
  everything_paid: Zod.z.boolean(),
  admission_number: Zod.z.string().optional(),
  date_of_removal: Zod.z.string().optional(),
  time_of_removal: Zod.z.string().optional(),
  name_of_deceased: Zod.z.string().optional(),
  permit_number: Zod.z.string().optional(),
  mode_of_transport: Zod.z.string().optional(),
  // Where the body is being taken after handover (home, cemetery, another mortuary…)
  final_destination: Zod.z.string().optional(),
  // Vehicle plate number for hearse / private-vehicle transport
  plate_number: Zod.z.string().optional(),
  // The release form sends release_date / release_time / time_received — accept
  // them so they can be stored in date_of_removal / time_of_removal below.
  release_date: Zod.z.string().optional(),
  release_time: Zod.z.string().optional(),
  time_received: Zod.z.string().optional(),
  relationship: Zod.z.string().optional(),
  signature: Zod.z.string().optional(),
  staff_name: Zod.z.string().optional(),
  staff_signature: Zod.z.string().optional(),
  received_by: Zod.z.string().optional(),
  items_returned: Zod.z.string().optional(),
  notes: Zod.z.string().optional(),
  released_by: Zod.z.string().optional(),
});

// ─── Kenya-time helpers ──────────────────────────────────────────────────────
// The whole platform stores timestamps in Kenya wall time (see
// packages/shared-utils/src/timestamps.ts — getKenyaTimeISO returns
// 'YYYY-MM-DD HH:mm:ss' for Africa/Nairobi). Africa/Nairobi is UTC+3 with NO
// daylight saving, so a fixed +3h shift on the UTC clock is always exact.
const KENYA_OFFSET_MS = 3 * 60 * 60 * 1000;

/** A Date whose UTC fields read as the CURRENT Kenya wall clock. */
const kenyaNow = (): Date => new Date(Date.now() + KENYA_OFFSET_MS);

// Helper function to format date for MySQL (YYYY-MM-DD)
const formatDateForMySQL = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  // Plain calendar dates ('YYYY-MM-DD…' — what the release form sends) carry
  // no time component: slice the string directly. Round-tripping them through
  // new Date() re-encodes in UTC and can shift the calendar day for inputs
  // outside UTC.
  const dateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (dateMatch) return dateMatch[1];
  try {
    const date = new Date(s);
    if (isNaN(date.getTime())) return null;
    // Full ISO instant: read the KENYA calendar day, not the UTC one.
    return new Date(date.getTime() + KENYA_OFFSET_MS).toISOString().split('T')[0];
  } catch {
    return null;
  }
};



// POST /body-release/checkout - Create new release
export const releaseBodyController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.headers['X-tenant-slug'] as string;

    if (!tenantSlug) {
      res.status(400).json({
        success: false,
        message: 'Tenant slug is required'
      });
      return;
    }

    // Validate request body
    const validatedData = releaseBodySchema.parse(req.body);

    // Generate release ID
    const releaseId = generateDatedCheckoutId();
    Logger.info(`[RELEASE] Generated release ID: ${releaseId} for tenant: ${tenantSlug}`);

    // Get current datetime in KENYA wall time (platform convention — the old
    // UTC value made created_at and the deceased register's dispatch_date
    // fallback "yesterday" for anything recorded between 00:00 and 02:59
    // Nairobi time).
    const currentDateTime = getKenyaTimeISO();


    // Process signatures through centralized upload service
    // This uploads signatures to /opt/storage/uploads/{tenant}/signatures/ instead of storing inline
    let processedSignature = validatedData.signature || null;
    let processedStaffSignature = validatedData.staff_signature || null;

    if (validatedData.signature && validatedData.signature.startsWith('data:image')) {
      processedSignature = await processAndUploadSignature(
        validatedData.signature,
        tenantSlug,
        `release_${releaseId}_kin`
      );
    }

    if (validatedData.staff_signature && validatedData.staff_signature.startsWith('data:image')) {
      processedStaffSignature = await processAndUploadSignature(
        validatedData.staff_signature,
        tenantSlug,
        `release_${releaseId}_staff`
      );
    }

    // Prepare data for insertion with properly formatted dates
    // Map frontend's "released_by" to the DB "staff_name" column.
    // If staff_name is also supplied, prefer it; otherwise use released_by.
    const officerName = validatedData.staff_name || validatedData.released_by || null;

    const releaseData = {
      release_id: releaseId,
      tenant_slug: tenantSlug,
      admission_number: validatedData.admission_number || null,
      name_of_deceased: validatedData.name_of_deceased || null,
      next_kin: validatedData.next_kin,
      id_number: validatedData.id_number,
      tell_number: validatedData.tell_number,
      relationship: validatedData.relationship || null,
      date_of_removal: formatDateForMySQL(validatedData.date_of_removal || validatedData.release_date),
      time_of_removal: now,
      permit_number: validatedData.permit_number || null,
      mode_of_transport: validatedData.mode_of_transport || null,
      final_destination: validatedData.final_destination || null,
      plate_number: validatedData.plate_number || null,
      terms_accepted: validatedData.terms_accepted ? 1 : 0,
      everything_paid: validatedData.everything_paid ? 1 : 0,
      signature: processedSignature,
      staff_name: officerName,
      staff_signature: processedStaffSignature,
      received_by: validatedData.received_by || officerName || null,
      items_returned: validatedData.items_returned || null,
      notes: validatedData.notes || null,
      created_at: currentDateTime
    };

    // Log the formatted data for debugging
    Logger.info(`[RELEASE] Formatted date_of_removal: ${releaseData.date_of_removal}`);
    Logger.info(`[RELEASE] Formatted time_of_removal: ${releaseData.time_of_removal}`);
    Logger.info(`[RELEASE] Formatted created_at: ${releaseData.created_at}`);

    // Save to database — resolve the slug the same way the deceased lookup flow does:
    // resolveDatabase understands raw db names, main tenant slugs AND branch slugs
    // (e.g. `org-home-nairobi`), then getTenantDB pools the resolved database name.
    // NEVER pass the raw slug to getTenantDB — a branch slug is not a database name.
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      res.status(400).json({
        success: false,
        message: 'No database configured for this tenant'
      });
      return;
    }
    const db = await getTenantDB(dbName);
    const query = `
      INSERT INTO body_releases (
        release_id, tenant_slug, admission_number, name_of_deceased,
        next_kin, id_number, tell_number, relationship,
        date_of_removal, time_of_removal, permit_number, mode_of_transport,
        final_destination, plate_number,
        terms_accepted, everything_paid, signature, staff_name, staff_signature,
        received_by, items_returned, notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      releaseData.release_id,
      releaseData.tenant_slug,
      releaseData.admission_number,
      releaseData.name_of_deceased,
      releaseData.next_kin,
      releaseData.id_number,
      releaseData.tell_number,
      releaseData.relationship,
      releaseData.date_of_removal,
      releaseData.time_of_removal,
      releaseData.permit_number,
      releaseData.mode_of_transport,
      releaseData.final_destination,
      releaseData.plate_number,
      releaseData.terms_accepted,
      releaseData.everything_paid,
      releaseData.signature,
      releaseData.staff_name,
      releaseData.staff_signature,
      releaseData.received_by,
      releaseData.items_returned,
      releaseData.notes,
      releaseData.created_at
    ];

    await db.execute(query, params);
    Logger.info(`[RELEASE] Successfully created release: ${releaseId} in database: ${dbName}`);

    // Emit notification for body release
    try {
      // Internal docker address — the socketio container listens on 5000
      // (5018 is only the host-published port, so the old fallback never
      // connected and release notifications were silently dropped).
      const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://restpoint_socketio_service:5000';
      await axios.post(`${socketioServiceUrl}/emit/body-released`, {
        tenantSlug,
        data: {
          id: `body-release-${releaseId}-${Date.now()}`,
          releaseId: releaseId,
          admissionNumber: validatedData.admission_number || '',
          nameOfDeceased: validatedData.name_of_deceased || '',
          nextOfKin: validatedData.next_kin,
          dateOfRemoval: validatedData.date_of_removal || '',
          modeOfTransport: validatedData.mode_of_transport || '',
          title: 'Body Released',
          message: `Body released: ${validatedData.name_of_deceased || validatedData.admission_number}`,
          type: 'release',
          priority: 'high',
          fullContent: `Release ID: ${releaseId}\nDeceased: ${validatedData.name_of_deceased || 'N/A'}\nNext of Kin: ${validatedData.next_kin}\nDate: ${validatedData.date_of_removal || 'N/A'}\nTransport: ${validatedData.mode_of_transport || 'N/A'}`,
        }
      }, { timeout: 5000 });
      Logger.info(`[RELEASE] Emitted body-released notification for ${releaseId}`);
    } catch (emitError: any) {
      Logger.warn(`[RELEASE] Failed to emit body-released notification: ${emitError.message}`);
    }

    // ── SYNC THE DECEASED REGISTER (authoritative) ──────────────────────────
    // The status MUST flip to Released in the same tenant database the release
    // row was just written to. Relying only on the cross-service call below
    // left every list and profile showing the OLD status: that call goes over
    // HTTP, and any failure (wrong internal host/port, service restart,
    // timeout) was swallowed to the log — so the release looked successful
    // while the deceased register never changed.
    if (validatedData.admission_number) {
      try {
        const admissionNumber = String(validatedData.admission_number).trim();
        const releaseDate = releaseData.date_of_removal || currentDateTime.slice(0, 10);

        const [syncResult]: any = await db.execute(
          `UPDATE deceased
              SET body_status = 'Released',
                  release_status = 'released',
                  admission_status = 'released',
                  dispatch_date = COALESCE(dispatch_date, ?),
                  updated_at = ?
            WHERE admission_number = ?
               OR TRIM(admission_number) = ?`,
          [releaseDate, currentDateTime, admissionNumber, admissionNumber]
        );

        const affectedRows = Number(syncResult?.affectedRows || 0);
        if (affectedRows > 0) {
          Logger.info(`[RELEASE] Deceased register set to Released for ${admissionNumber} (${affectedRows} row(s))`);
        } else {
          Logger.warn(`[RELEASE] No deceased register row matched admission number "${admissionNumber}" — status not synced`);
        }
      } catch (syncError: any) {
        // The release row itself is already stored; report loudly but do not
        // fail the handover that already happened at the counter.
        Logger.error(`[RELEASE] Failed to sync deceased register status: ${syncError.message}`);
      }
    }

    // ── CACHE INVALIDATION / CANONICAL SYNC (best effort) ───────────────────
    // Keeps the deceased-service Redis list + detail caches from serving the
    // pre-release status for up to their TTL.
    if (validatedData.admission_number) {
      try {
        // 5000 is the port INSIDE the container — 5003 is only the host
        // mapping, so the previous fallback URL could never connect.
        const deceasedServiceUrl = process.env.DECEASED_SERVICE_URL || 'http://restpoint_deceased_service:5000';
        await axios.post(
          `${deceasedServiceUrl}/deceased/update-status`,
          {
            admission_number: validatedData.admission_number,
            body_status: 'Released',
            is_embalmed: true
          },
          {
            headers: {
              'x-tenant-slug': tenantSlug,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );
        Logger.info(`[RELEASE] Deceased service status endpoint acknowledged for admission: ${validatedData.admission_number}`);
      } catch (error: any) {
        // Non-fatal: the register was already updated directly above, this
        // only refreshes the other service's cache.
        Logger.warn(`[RELEASE] Deceased service status call skipped (${error.message}); register was updated directly.`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Body release created successfully',
      data: {
        release_id: releaseData.release_id,
        admission_number: releaseData.admission_number,
        name_of_deceased: releaseData.name_of_deceased,
        next_kin: releaseData.next_kin,
        id_number: releaseData.id_number,
        tell_number: releaseData.tell_number,
        relationship: releaseData.relationship,
        date_of_removal: releaseData.date_of_removal,
        time_of_removal: releaseData.time_of_removal,
        permit_number: releaseData.permit_number,
        mode_of_transport: releaseData.mode_of_transport,
        final_destination: releaseData.final_destination,
        plate_number: releaseData.plate_number,
        terms_accepted: !!releaseData.terms_accepted,
        everything_paid: !!releaseData.everything_paid,
        signature: releaseData.signature,
        staff_signature: releaseData.staff_signature,
        created_at: releaseData.created_at
      }
    });
  } catch (error: any) {
    Logger.error({
      message: 'Error creating body release',
      error: error.message,
      stack: error.stack
    });

    if (error instanceof Zod.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues
      });
      return;
    }

    // Check for database-specific errors
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message: 'A release with this ID already exists'
      });
      return;
    }

    if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(400).json({
        success: false,
        message: 'Invalid admission number or deceased record not found'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

import { Request, Response } from 'express';
import type { Browser } from 'puppeteer' with { 'resolution-mode': 'import' };
import { resolveDatabase, safeTenantQuery } from '../../../../shared/dbConfig';
import { tableColumns, pickAs } from '../../utils/tenantSchema';
import Logger from '../../../../packages/shared-logger/src/index';
import { DateTime } from 'luxon';
import path from 'path';
import fs from 'fs';
import {
    formatFacilityName,
    fmtLong,
    fmtShort,
    resolveTenantBranding,
    loadLogoBase64,
    buildReportHtml,
    toInkBlueBuffer,
} from './autopsyControl';

interface TenantRequest extends Request { tenantSlug?: string }

// PUPPETEER LOADER

type PuppeteerNodeModule = typeof import('puppeteer', { with: { 'resolution-mode': 'import' } })['default'];

let puppeteerModulePromise: Promise<PuppeteerNodeModule> | null = null;

const loadPuppeteer = async (): Promise<PuppeteerNodeModule> => {
    if (!puppeteerModulePromise) {
        puppeteerModulePromise = import('puppeteer')
            .then((mod: any) => (mod.default || mod) as PuppeteerNodeModule);
    }
    return puppeteerModulePromise;
};

// EXPORT: generatePostmortemPDF — Puppeteer, GUARANTEED 1 page

export const generatePostmortemPDF = async (req: TenantRequest, res: Response): Promise<void> => {
    const tenantSlug = req.headers['x-slug'] as string || req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { deceased_id } = req.params;

    if (!deceased_id || !tenantSlug) {
        res.status(400).json({ success: false, message: 'deceased_id and tenant are required' });
        return;
    }

    let browser: Browser | null = null;

    try {
        const dbName = await resolveDatabase(tenantSlug);
        if (!dbName) {
            Logger.warn({
                message: "[POSTMORTEM-FAILED]  Failed  To  resolve  tenat database  "
            })
            res.status(404).json({ success: false, message: `No database configured for tenant: ${tenantSlug}` });
            return;
        }

        // ── 1. QUERY POSTMORTEM ──
        const postmortemQuery = `
            SELECT id, deceased_id, status, pathologist_name, external_pathologist_name,
                   external_pathologist_mobile, external_pathologist_id,
                   examination_summary, cause_of_death, immediate_cause_of_death,
                   underlying_cause_of_death, contributing_conditions,
                   manner_of_death, requesting_authority, signature,
                   created_at, updated_at
            FROM postmortem WHERE deceased_id = ?`;
        const pmResults = await safeTenantQuery(dbName, postmortemQuery, [deceased_id]);
        if (!pmResults || (pmResults as any[]).length === 0) {
            res.status(404).json({ success: false, message: 'Postmortem record not found' });
            return;
        }
        const postmortem = (pmResults as any[])[0];

        // ── 2. QUERY DECEASED ──

        const dCols = await tableColumns(dbName, 'deceased');
        const DECEASED_PDF_COLS = [
            'full_name', 'date_of_death', 'signature', 'admission_number',
            'date_of_birth', 'age', 'gender', 'place_of_death', 'national_id',
        ];
        let deceased: any = null;
        if (dCols.has('deceased_id')) {
            const deceasedQuery = `SELECT ${DECEASED_PDF_COLS.map((c) => pickAs(dCols, c, c)).join(', ')}
                FROM deceased WHERE deceased_id = ?`;
            const decResults = await safeTenantQuery(dbName, deceasedQuery, [deceased_id]);
            deceased = decResults && (decResults as any[]).length > 0 ? (decResults as any[])[0] : null;
        }

        // ── 3. QUERY NEXT OF KIN ──

        const nCols = await tableColumns(dbName, 'next_of_kin');
        let nextOfKin: any = null;
        if (nCols.size > 0 && nCols.has('deceased_id')) {
            const where = ['deceased_id = ?'];
            if (nCols.has('is_primary')) where.push('is_primary = 1');
            if (nCols.has('is_deleted')) where.push('is_deleted = 0');
            const kinSelect = ['full_name', 'relationship', 'contact']
                .map((c) => pickAs(nCols, c, c))
                .join(', ');
            const kinQuery = `SELECT ${kinSelect} FROM next_of_kin WHERE ${where.join(' AND ')} LIMIT 1`;
            const kinResults = await safeTenantQuery(dbName, kinQuery, [deceased_id]);
            nextOfKin = kinResults && (kinResults as any[]).length > 0 ? (kinResults as any[])[0] : null;
        }

        // ── 4. EXTRACT VALUES ──
        const facilityName = formatFacilityName(tenantSlug);
        const fullName = deceased?.full_name || 'Unknown';
        const admissionNumber = deceased?.admission_number || deceased_id;
        const dateOfDeath = fmtLong(deceased?.date_of_death);
        const age = deceased?.age || 'N/A';
        const gender = deceased?.gender || 'N/A';

        const pathologistName = postmortem.external_pathologist_name || postmortem.pathologist_name || 'Attending Pathologist';
        const pathologistLicense = postmortem.external_pathologist_id || '';
        const pathologistCredentials = pathologistLicense ? 'MBChB, MMed (Pathology)' : 'Pathologist';
        const examDate = fmtLong(postmortem.updated_at || postmortem.created_at);
        const mannerOfDeath = postmortem.manner_of_death || 'N/A';
        const immediateCause = postmortem.immediate_cause_of_death || postmortem.cause_of_death || 'N/A';
        const underlyingCause = postmortem.underlying_cause_of_death || 'N/A';
        const examinationSummary = postmortem.examination_summary || '';

        const kinName = nextOfKin?.full_name || deceased?.full_name || 'N/A';
        const kinRelationship = nextOfKin?.relationship || 'N/A';
        const kinPhone = nextOfKin?.contact || 'N/A';

        const issuedDate = fmtLong(new Date().toISOString());
        const verifiedDate = fmtShort(new Date().toISOString());
        const reportRef = `PM-${deceased_id}-${DateTime.now().setZone('Africa/Nairobi').toFormat('yyyyMMdd')}`;
        const fullTimestamp = DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd hh:mm:ss a');

        // ── 5. LOAD SIGNATURE ──
        let signatureBase64: string | null = null;
        const signaturePath =
            postmortem?.signature ||
            postmortem?.pathologist_signature ||
            deceased?.pathologist_signature ||
            deceased?.signature;

        if (signaturePath && typeof signaturePath === 'string') {
            try {
                let sigBuffer: Buffer | null = null;
                if (signaturePath.startsWith('data:image')) {
                    const base64Data = signaturePath.split(',')[1];
                    sigBuffer = Buffer.from(base64Data, 'base64');
                } else if (signaturePath.startsWith('http')) {
                    const axios = require('axios');
                    const response = await axios.get(signaturePath, { responseType: 'arraybuffer', timeout: 10000 });
                    sigBuffer = Buffer.from(response.data);
                } else {
                    const uploadsBase = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
                    const relativePath = signaturePath.replace(/^\/uploads\//, '');
                    const fsPath = path.join(uploadsBase, relativePath);
                    if (fs.existsSync(fsPath)) sigBuffer = fs.readFileSync(fsPath);
                }
                if (sigBuffer) {
                    try {
                        const inkBuffer = await toInkBlueBuffer(sigBuffer);
                        signatureBase64 = 'data:image/png;base64,' + inkBuffer.toString('base64');
                    } catch {
                        signatureBase64 = 'data:image/png;base64,' + sigBuffer.toString('base64');
                    }
                }
            } catch (sigError) {
                console.warn('[PDF] Failed to load signature:', sigError);
            }
        }

        // ── 6. TENANT BRANDING (logo + name, same source as Settings) ──

        const branding = await resolveTenantBranding(tenantSlug);
        const brandingName = branding.name || facilityName;   // fall back to the slug-derived name
        const logoBase64 = await loadLogoBase64(
            branding.logoUrl || process.env.FUNERAL_HOME_LOGO_URL || '',
        );

        // ── 7. BUILD HTML ──
        // await: buildReportHtml renders the barcode, which is async.
        const html = await buildReportHtml({
            tenantName: brandingName,
            tenantAddress: branding.address,
            tenantPhone: branding.phone,
            tenantEmail: branding.email,
            deceasedFullName: fullName,
            deceasedAdmission: admissionNumber,
            deceasedDateOfDeath: dateOfDeath,
            deceasedAge: age,
            deceasedGender: gender,
            examDate,
            pathologistName,
            pathologistCredentials,
            pathologistLicense,
            mannerOfDeath,
            immediateCause,
            underlyingCause,
            examinationSummary,
            kinName,
            kinRelationship,
            kinPhone,
            verifiedDate,
            issuedDate,
            logoBase64,
            signatureBase64,
        });

        // ── 8. GENERATE PDF WITH PUPPETEER ──
        const puppeteer = await loadPuppeteer();
        browser = await puppeteer.launch({
            // v25 accepts `boolean | 'shell'` only — `true` = new headless mode
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
        });

        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.startsWith('data:') || url.startsWith('about:') || url.startsWith('file:')) {
                req.continue();
            } else {
                req.abort();
            }
        });

        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

        await page.setContent(html, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await new Promise(r => setTimeout(r, 500));

        // ── 9. GENERATE PDF — preferCSSPageSize respects our @page rule ──
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
            preferCSSPageSize: true,
        });

        // ── 10. SEND RESPONSE ──
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="postmortem-${deceased_id}.pdf"`);
        res.send(pdfBuffer);

        // ── 11. SOCKET EMIT ──
        try {
            const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
            const axios = require('axios');
            const notificationPayload = {
                tenantSlug,
                data: {
                    id: `postmortem-pdf-${deceased_id}-${Date.now()}`,
                    deceasedId: deceased_id,
                    deceasedName: fullName,
                    reportRef,
                    title: 'Postmortem PDF Generated',
                    message: `Postmortem report PDF has been generated for ${fullName} (${deceased_id})`,
                    type: 'postmortem_pdf_generated',
                    priority: 'high',
                    fullContent: `Postmortem Report PDF Generated\nDeceased ID: ${deceased_id}\nName: ${fullName}\nReport Reference: ${reportRef}\nPathologist: ${pathologistName}\nCause of Death: ${immediateCause}\nManner of Death: ${mannerOfDeath}\nGenerated: ${fullTimestamp}`,
                    data: {
                        deceased_id: deceased_id,
                        deceased_name: fullName,
                        report_ref: reportRef,
                        pathologist: pathologistName,
                        cause_of_death: immediateCause,
                        manner_of_death: mannerOfDeath,
                        generated_at: fullTimestamp,
                    },
                    timestamp: new Date().toISOString(),
                    expiresAt: Date.now() + (2 * 60 * 60 * 1000),
                },
            };

            await axios.post(`${socketioServiceUrl}/emit/postmortem-pdf-generated`, notificationPayload, { timeout: 5000, headers: { 'Content-Type': 'application/json' } });
        } catch (emitError: any) {
            Logger.warn({
                message: " Failed   to  emit  pdf   generated  event ",
                error: emitError.message
            })


        }

    } catch (error: any) {
        Logger.error({
            message: "  An   Errror   Ocuured   While  Trying to   genrate   PostmortmePDF",
            error: error.message
        })

        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

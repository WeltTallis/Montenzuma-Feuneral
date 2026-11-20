# RestPoint — AI Integration Analysis & Roadmap

**Source system:** RestPoint SaaS — Funeral Home Management System (multi-tenant, Kenya-focused)
**Analyzed:** c:\Users\User\Downloads\restpoint
**Status:** No AI/ML code exists in the codebase today (confirmed via repo-wide search for openai/anthropic/gemini/llm/ocr/tesseract/etc.).

## 1. System Overview

**What it is.** RestPoint is an enterprise, multi-tenant SaaS for funeral homes and morgues (Kenya market). It manages the full deceased lifecycle — intake → postmortem → embalming → release/burial — plus KRA eTIMS tax invoicing, secure payments (M-Pesa, Pesapal, IntaSend, Flutterwave), and compliance with the Kenya Data Protection Act 2019.

**Architecture (observed).**
- Backend: Node.js + Express, TypeScript, micro-services monorepo (npm workspaces: `services/*`, `packages/*`, `shared`)
- Frontend: React at `FrontendClient/client/src` with `api/`, `modules/`, `components/`, `dashboard/`
- Database: MySQL/MariaDB — one database per tenant + shared `restpoint_operations` DB
- Cache/Queue: Redis, RabbitMQ, BullMQ
- Storage: shared host folder `/opt/storage/uploads`, bind-mounted into all services, served via nginx/tenant-service
- API Gateway: `services/api-gateway` (rate limiting, CORS, tenant identity, routing)
- Auth: JWT + RBAC (Admin, Accountant, Pathologist, Receptionist, Mortician, Driver…), MFA, audit trails, bcrypt/argon2
- Integrations: KRA eTIMS/OSRA (VAT invoices), M-Pesa/Pesapal/IntaSend/Flutterwave, SMTP email, SMS gateway

**Key services (22+):** `auth-service`, `deceased-service`, `invoice-service`, `billing-service`, `documents-service`, `analytics-service`, `sms-service`, `mpesa-service`, `tenant-service`, `coffin-service`, `hearse-service`, `florist-service`, `chemical-service`, `workshop-service`, `store-service`, `insurance-service`, `bodycheckout-service`, `extra-services`, `leave-service`, `scanner-bridge`, `socketio-service`, `app-global`, `erp-service`, `configurations`, `support-service`.

**Shared packages:** `shared-config` (DB/tenancy), `shared-utils` (time/helpers), `shared-logger`, `shared-services` (Redis/file storage), `shared-metrics` (Prometheus), `shared-stamps`.

**Representative code patterns:**
- Tenant-scoped DB queries via `safeTenantQuery/safeTenantExecute` from `shared/dbConfig`
- Tenant resolution from JWT claims + `x-tenant-slug` header (`app-global/middlewares/authMiddleware.js`, `tenantMiddleware.ts`)
- Controllers validate with zod, log via `shared-logger`, emit socket.io events to `socketio-service`
- Exports generate password-protected/styled Excel via ExcelJS (`deceased-service/controllers/exportExcelController.ts`)
- Document uploads handled by `documents-service` + `shared/centralizedUploadService.ts`
- SMS via `app-global/utils/sendTransactionalSms.ts` → `sms-service`

## 2. Where AI Can Be Integrated — Prioritized

Grouped by impact vs. effort, framed for "integration now" — practical, optional, backward-compatible, compliant-first.

### A. Highest value / quickest to add

#### 1. Intake document OCR + smart field pre-fill (`deceased-service` + `documents-service`)
**Pain point.** Staff manually type deceased details (full name, national ID, place/cause of death, next of kin) from paper death permits, IDs, and burial permits at intake. Error-prone and slow.

**AI integration.** When a user uploads a scan/photo of a death permit or ID in `documents-service`, run OCR → LLM field extraction → return structured JSON (`full_name`, `national_id`, `date_of_death`, `place_of_death`, `cause_of_death`, `received_from`). `registerDeceased` (deceased-service) pre-fills the zod-validated form; staff confirm/correct before saving.

**Files to touch:** `services/documents-service/controllers/documents.js`, `services/deceased-service/controllers/registerDeceased.ts`, new `services/ai-service`.

#### 2. Free-text normalization for cause of death / body status (`deceased-service`)
**Pain point.** `cause_of_death`, `place_of_death`, `body_status` are free text. `deceasedControl.ts` already has a hand-written alias map (~lines 600-622) for status canonicalization — brittle and incomplete.

**AI integration.** An LLM/classification endpoint maps free text → canonical codes used by `analytics-service` (status trends, gender distribution, monthly charts). Improves dashboard accuracy without schema changes.

**Files to touch:** `services/deceased-service/controllers/deceasedControl.ts` (status update path), `registerDeceased.ts`, new `ai-service` `/ai/normalize` endpoint.

#### 3. PII redaction before export/share (`documents-service` + exports)
**Pain point.** Excel/web exports include national IDs, next-of-kin phone numbers, and signatures. Kenya DPA requires minimization and protection when sharing.

**AI integration.** Before an export is finalized (`exportExcelWithCharts`) or a self-destructing web link is generated, run a PII detector (names, ID numbers, phone numbers) and mask/redact fields per tenant policy. A compliance differentiator.

**Files to touch:** `services/deceased-service/controllers/exportExcelController.ts`, `services/documents-service/controllers/documents.js`.

### B. Medium value / next phase

#### 4. AI assistant / natural-language dashboard queries (`analytics-service` or new `ai-service`)
**Pain point.** Managers click through filters to answer "How many bodies admitted this week in Nakuru?" or "Which bodies are pending postmortem for >3 days?"

**AI integration.** A chat widget (React component in `FrontendClient/client/src/components/`) sends NL queries to an AI endpoint that translates to safe, read-only, tenant-scoped, parameterized analytics queries via `analytics-service` and returns plain-language answers + chart data. Guard: read-only only; no arbitrary SQL execution.

**Files to touch:** New `services/ai-service` `/ai/query`, `services/analytics-service/services/metrics.ts` + routes, frontend `modules/analytics` + new `components/ai-chat/` widget.

#### 5. Morgue capacity & admission forecasting (`analytics-service`)
**Pain point.** Morgues run out of chamber space unpredictably.

**AI integration.** Time-series forecast on historical admissions (monthly trend data) → predicted occupancy by week, peak days, staffing recommendations. Surfaces as a "capacity outlook" card on the analytics dashboard.

**Files to touch:** `services/analytics-service/workers-analyticsWorker.ts`, `services/analytics-service/types/analytics.types.ts`, frontend `modules/analytics`.

#### 6. Invoice & billing anomaly detection (`invoice-service` / `billing-service`)
**Pain point.** Duplicate charges, unusual totals, and KRA eTIMS mismatches slip through manual review.

**AI integration.** Flag outliers per tenant (amount, payer, service type vs. historical baseline) for accountant review before eTIMS submission. Reduces rejected invoices and reconciliation work.

**Files to touch:** `services/invoice-service/routes/invoiceRoutes.ts` + controllers, `services/billing-service`.

### C. Longer-term / optional

| Idea | Service | Value |
|---|---|---|
| SMS message optimization / next-of-kin notification drafting | `sms-service` | Context-aware, compassionate auto-drafted SMS templates |
| Postmortem report summarization | `deceased-service` (autopsy) | Summarize free-text autopsy findings into structured report sections |
| Signature/handwriting verification on release authorization | `deceased-service` + uploads | Flag mismatched receiver signatures vs. on-file NOK signature |
| Fraud detection on M-Pesa payments | `mpesa-service` | Detect duplicate/odd MPESA STK push patterns |
| Body-condition photo triage | `scanner-bridge` / `deceased-service` | Photo intake → condition scoring for prioritization |

## 3. Recommended "Start Now" Design

### New service: `services/ai-service` (Express + TypeScript)
A single, tenant-aware AI service behind the API gateway, optional by default (gated on `AI_PROVIDER`), with graceful degradation (falls back to existing manual flows if AI is unavailable).

**Providers supported via one OpenAI-compatible client (`axios`):** OpenAI, Azure OpenAI, or a self-hosted local model via Ollama/Llama.cpp — important for DPA-sensitive tenants who cannot send deceased/NOK data to a public cloud LLM.

**Endpoints (v1):**
- `POST /ai/extract-document` — image/PDF → extracted fields (name, ID, dates, cause of death, received-from)
- `POST /ai/normalize-text` — free text → canonical code (cause of death, body status, place)
- `POST /ai/redact-pii` — text → PII-masked text (names, IDs, phones)
- `POST /ai/query` — natural language → analytics answer (read-only)

**Environment variables (add to `.env` / `docker-compose.yml`):**
```
AI_PROVIDER=openai            # openai | azure | ollama | disabled
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
AI_ENABLED=true
AI_REDACT_BEFORE_SEND=true    # strip PII before any LLM call
AI_AUDIT_LOG=true             # log every AI call (user, tenant, endpoint, no PII)
```

### Compliance safeguards (Kenya DPA 2019)
1. **PII redaction before any LLM call** when `AI_REDACT_BEFORE_SEND=true` — names/IDs/phones replaced with placeholders; mapping kept server-side only if needed.
2. **Per-tenant opt-in** — AI features disabled by default; enabled via tenant settings.
3. **No training on customer data** — provider contracts must exclude data retention/training; prefer self-hosted models for sensitive tenants.
4. **Audit trail** — every AI call logged (tenant, user, endpoint, timestamp, outcome) with no PII stored in logs.
5. **Human-in-the-loop** — AI never auto-writes to the DB; staff always review extracted/normalized values before save.

### Integration points (phase 1)
| Integration | Entry point | What changes |
|---|---|---|
| Intake pre-fill | `services/deceased-service/controllers/registerDeceased.ts` | After file upload, call `ai-service /ai/extract-document`; pre-fill Zod form |
| Status normalization | `services/deceased-service/controllers/deceasedControl.ts` | On status/body_status update, call `/ai/normalize-text` |
| PII-safe exports | `services/deceased-service/controllers/exportExcelController.ts` | Run `/ai/redact-pii` on exported fields |
| Chat assistant | New React component + `ai-service /ai/query` | Frontend `components/ai-chat/`, wired to analytics data |

## 4. Immediate Next Steps

1. **Create `services/ai-service`** — Express TS server, OpenAI-compatible client (`axios`), tenant middleware reuse from `app-global`, 4 endpoints above, disabled by default.
2. **Add AI env vars** to `.env` and `docker-compose.yml`; add service to docker-compose if desired.
3. **Wire intake pre-fill** — in `documents-service` upload flow, call `/ai/extract-document`; pass results to `registerDeceased` form as suggested values (staff-editable).
4. **Add frontend chat widget** — `FrontendClient/client/src/components/ai-chat/` calling the gateway-proxied `/ai/query` endpoint.
5. **Add DPA redaction** — `/ai/redact-pii` used before exports/share links.
6. **Update README/onboarding docs** with AI configuration section.

---

**Bottom line:** The cleanest place to start is a new `services/ai-service` behind the gateway, wired first into deceased intake (document OCR pre-fill) and body-status normalization, with PII redaction and human review baked in from day one so it stays Kenya-DPA compliant.

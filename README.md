RestPoint SaaS — Funeral Home Management System
RestPoint is an enterprise-grade, multi-tenant SaaS application designed to modernize and secure the operations of funeral homes and morgues. Built with a focus on data integrity, legal compliance, and operational efficiency, RestPoint streamlines everything from body intake to final release, secure payments, and government tax remittance.

StatusComplianceSecurity

🌟 Core Features
1. Deceased Intake & Lifecycle Management
Comprehensive Intake Register: Record admission numbers, receiving officers, body status, place of death, and cause of death.
Lifecycle Tracking: Monitor bodies from admission to postmortem, embalming, and final release/burial.
Next of Kin & Receiver Tracking: Securely store and manage NOK details, relationships, ID numbers, and authorized receiver signatures.
Digital Signatures: Capture and embed officer and receiver signatures directly into digital records.
2. KRA eTIMS Integration (Kenya Revenue Authority)
RestPoint is fully integrated with the KRA eTIMS (Electronic Tax Invoice Management System) via the OSRA API.

Automated Invoicing: Generate VAT-compliant tax invoices directly from the system.
Real-time Remittance: Instantly transmit invoice data to KRA, fetching the mandatory CU (Validation) Number and QR code.
Sandbox Testing: Built-in support for KRA's SIMTIMS sandbox for safe development and testing.
3. Secure Payment Processing
RestPoint integrates with local and pan-African payment gateways (e.g., Pesapal, IntaSend, Flutterwave) to handle high-value transactions securely.

Multi-Channel: Accept Mastercard, Visa, Amex, and M-Pesa through a single API.
PCI-DSS Compliant: Uses Hosted Checkout solutions to ensure sensitive card data never touches RestPoint servers.
Automated Reconciliation: Successful payments automatically trigger eTIMS invoice generation and update the general ledger.
4. Advanced Security & Data Integrity
Built to comply with the Kenya Data Protection Act (DPA) 2019.

Role-Based Access Control (RBAC): Strict permissions (Admin, Accountant, Pathologist, Receptionist).
MFA & Session Management: Multi-Factor Authentication enforcement and auto-logout on inactivity.
Audit Trails: Every record view, edit, and export is logged with user ID, IP, and timestamp.
Encryption: Data at rest (AES) and data in transit (TLS/SSL). Passwords hashed via Bcrypt/Argon2.
5. Secure, Styled Excel Exports
Exporting sensitive data is heavily secured to prevent leaks.

Password-Protected Exports: Generate styled .xlsx intake registers encrypted with standard Office Agile Encryption (AES). Excel will prompt for a PIN before opening.
Secure Web Viewer (Self-Destructing Links): Instead of sending static files, generate temporary, PIN-protected web links. The link self-destructs after 3 failed PIN attempts or after 24 hours.
Watermarking & Logging: Exported files are watermarked with user details, and every export is recorded in the audit log.
Security & Compliance Philosophy
"What is entered into RestPoint remains protected, preserved, and managed with the highest level of integrity."

RestPoint is designed so that even if a database is compromised, the data remains useless to attackers.

Data Minimization: We do not hoard unnecessary data. Credit card numbers are handled entirely by PCI-compliant gateways.
Network Isolation: Database ports are strictly blocked from the public internet; only the backend API can communicate with the database.
Secure Backups: Automated, encrypted nightly backups to isolated cloud storage (e.g., AWS S3 / Backblaze B2).
🛠️ Tech Stack
Backend: Node.js, Express, TypeScript
Frontend: React, Next.js, TailwindCSS
Database: MySQL / MariaDB (Multi-tenant architecture via database-per-tenant)
Queue/Cache: Redis / BullMQ (optional, for background jobs)
Storage: Local disk / S3-compatible storage for signatures, logos, and exports
Libraries: exceljs, xlsx-populate, axios
Getting Started (Local Development)
Prerequisites
Node.js >= 18.x
MySQL / MariaDB
KRA Developer Sandbox Credentials (for eTIMS testing)
Payment Gateway API Keys (e.g., Pesapal)
Installation
Clone the repository:
git clone https://github.com/your-org/restpoint-saas.gitcd restpoint-saas
Install dependencies:
bash

npm install
# or
yarn install
Set up environment variables:
bash

cp .env.example .env
Configure your .env file:
env

# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=rootpassword
DB_NAME=restpoint_core

# Security
JWT_SECRET=your_super_secret_jwt
BCRYPT_ROUNDS=12

# KRA eTIMS
KRA_API_BASE_URL=https://sandbox-api.kra.go.ke/osra/v1
KRA_TIN=YOUR_BUSINESS_TIN
KRA_PASSWORD=YOUR_API_PASSWORD

# Payments
PESAPAL_CONSUMER_KEY=your_key
PESAPAL_CONSUMER_SECRET=your_secret

# Storage
GLOBAL_UPLOADS_DIR=/path/to/uploads
Run database migrations:
bash

npm run migrate
Start the development server:
bash

npm run dev

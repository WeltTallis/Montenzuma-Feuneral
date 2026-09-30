/**
 * Document routes — authentication contract.
 *
 * This file used to be a single line that imported `protect` / `authorizeAny`
 * and then did nothing with them, and it was never imported by server.js. The
 * real routes are declared inline there, so the service shipped with NO
 * authentication at all: any client that could reach the published port could
 * upload files, read them, and pick the target tenant with an `x-tenant-slug`
 * header.
 *
 * server.js now mounts `protect` + `authorizeAny` on `documentsRouter` directly
 * (see the AUTHENTICATION block above the router mounts). This module is kept as
 * the single, explicit statement of that contract so the next person adding a
 * route does not have to rediscover it — and so the protection is not mistaken
 * for something that is still missing.
 *
 * Exported for reuse and for tests; importing it is optional.
 */
const { protect, authorizeAny } = require('../../app-global/middlewares/authMiddleware');

/**
 * Middleware pair to mount on any router that serves tenant documents.
 * Applied router-wide; keep /health outside the router so orchestrator
 * healthchecks continue to work without a token.
 */
const documentAuth = [protect, authorizeAny];

module.exports = { documentAuth, protect, authorizeAny };

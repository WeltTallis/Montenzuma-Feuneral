# Restpoint Scanner Bridge

A tiny, always-running background agent for the **reception computer**. It exposes a
local WebSocket endpoint (`ws://localhost:8081`) that the Restpoint web app connects
to when a user clicks **Scan Docs** on a deceased profile.

The agent:

1. Drives the physical scanner (TWAIN / WIA / eSCL via the [NAPS2 CLI](https://github.com/nathaniel-mahieu/NAPS2), or any custom `SCAN_COMMAND`) to produce a single multi-page PDF.
2. Uploads that PDF **directly to the documents-service** → `POST {apiBase}/documents/upload/{deceasedId}` — no intermediate server, no HP software, no physical scan button.
3. Streams `SCANNING → UPLOADING → COMPLETE` back to the browser so the web app can show a live spinner modal, then refresh the deceased profile's Documents tab.

The user never touches the scanner or its software — they just put the paper in the
ADF tray, click **Scan Docs** in Restpoint, and the rest is automatic.

## What ships to production

For Windows reception computers, distribute **only** `dist/Setup-Restpoint-Scanner-Bridge.exe`.
It contains the bridge executable, installs it under the current user's local app data,
creates a hidden Startup shortcut, and starts the bridge without opening a console window.
Node.js is not required on the reception computer.

## Build

```bash
npm install          # once — dev deps (esbuild, ws, typescript)
npm run build        # → dist/agent.js  (development/runtime bundle)
npm run build:installer # → dist/Setup-Restpoint-Scanner-Bridge.exe
```

## Run

| Mode                                 | Command                          |
| ------------------------------------ | -------------------------------- |
| Real scanner                         | `node dist/agent.js`             |
| Mock (no hardware, for testing/demo) | `MOCK_SCAN=1 node dist/agent.js` |

Set up the scanner driver once (see _Scanner drivers_ below), then optionally create a
`.env`-style config via environment variables (see [.env.example](./.env.example)).

## Scanner drivers

The agent shells out to a CLI and waits for the PDF it writes. The default is **NAPS2**
(`naps2` / `naps2.exe`), a free MIT-licensed tool that talks to TWAIN, WIA, SANE and
eSCL devices — including the **HP ScanJet Pro 2600 f1**.

1. Install NAPS2 → <https://github.com/nathaniel-mahieu/NAPS2>
2. Check the scanner is visible: `naps2 list`
3. If auto-detection doesn't pick your model, pin it:
   ```bash
   SCANNER_NAME="HP ScanJet Pro 2600 f1" node dist/agent.js
   ```
4. If you use a different tool (exactly the driver JAR, `scanimage`, `wia` …), override
   the whole command:
   ```bash
   SCAN_COMMAND='{NAPS2} scan --output "{OUTPUT}" --format {FORMAT} --resolution {RESOLUTION} {DUPLEX}' node dist/agent.js
   ```
   Tokens: `{NAPS2} {OUTPUT} {FORMAT} {RESOLUTION} {MODE} {DUPLEX} {SOURCE} {SCANNER}`

## Web-app → bridge protocol

JSON over `ws://localhost:{BRIDGE_PORT}` (default **8081**):

| Direction | Message                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C → S     | `{ "action": "PING" }`                                                                                                                                                                           |
| S → C     | `{ "type": "pong", "status": "OK", "version", "mock", "busy" }`                                                                                                                                  |
| C → S     | `{ "action": "GET_SCANNERS" }`                                                                                                                                                                   |
| S → C     | `{ "status": "OK", "scanners": [{ "id", "name", "location", "available" }] }`                                                                                                                    |
| C → S     | `{ "action": "START_SCAN", "deceasedId", "documentName"?, "category"?, "token"?, "tenantSlug"?, "userId"?, "apiBase"?, "resolution"?, "colorMode"?, "duplex"?, "pages"?, "source"?, "format"? }` |
| S → C     | `{ "status": "SCANNING",  "progress", "message" }`                                                                                                                                               |
| S → C     | `{ "status": "UPLOADING", "message" }`                                                                                                                                                           |
| S → C     | `{ "status": "COMPLETE",  "message", "document", "server" }`                                                                                                                                     |
| S → C     | `{ "status": "ERROR",    "message" }`                                                                                                                                                            |

`apiBase` is the Restpoint API gateway base (e.g. `https://restpoint.co.ke/api/v1/restpoint`)
— the web app passes it automatically, and the agent posts the scanned PDF straight to
`{apiBase}/documents/upload/{deceasedId}` with `Authorization: Bearer <token>` and
`x-tenant-slug` headers.

## Test (no scanner needed)

```bash
npm run build
npm test
```

`test/e2e-mock.mjs` starts a fake documents-service, spawns the compiled agent in
MOCK_SCAN mode, and asserts the whole chain: PING → START_SCAN → SCANNING →
UPLOADING → COMPLETE, the PDF payload, and the forwarded auth/tenant headers.

## Production / autostart notes

- **Windows autostart** (Task Scheduler or startup shortcut):
  `C:\Program Files\nodejs\node.exe C:\restpoint-bridge\dist\agent.js`
- The agent is single-flight by design — it services one scan at a time (matches a
  reception ADF workflow). While a scan runs it cannot answer PINGs.
- Security: by default the bridge accepts local connections only on `0.0.0.0:8081`.
  For stricter setups set `BRIDGE_ALLOWED_ORIGINS` to your web origin(s) and bind
  `BRIDGE_HOST=127.0.0.1`.

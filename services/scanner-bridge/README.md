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
(`NAPS2.Console.exe`, installed to `C:\Program Files\NAPS2`), a free MIT-licensed tool
that talks to TWAIN, WIA, SANE and eSCL devices — including the **HP ScanJet Pro 2600 f1**.

NAPS2 6.x-8.x has **no `scan` and no `list` verb** — the console tool is purely flag
driven, and the bridge speaks that flag dialect for you:

```
NAPS2.Console.exe -o out.pdf --dpi 300 --bitdepth color --source feeder --driver wia -v -f
```

1. Install NAPS2 → <https://github.com/nathaniel-mahieu/NAPS2>
2. Tell the bridge where NAPS2 is (a folder OR the executable — both work, and the
   usual install folder is auto-discovered when this is unset):
   ```
   NAPS2_PATH=C:\Program Files\NAPS2
   ```
3. Check the scanner is visible:
   ```
   "C:\Program Files\NAPS2\NAPS2.Console.exe" --driver wia --listdevices
   ```
3. If auto-detection doesn't pick your model, pin it:
   ```bash
   SCANNER_NAME="HP ScanJet Pro 2600 f1" node dist/agent.js
   ```
4. If you use a different tool (exactly the driver JAR, `scanimage`, `wia` …), override
   the whole command:
   ```bash
   SCAN_COMMAND='{NAPS2} -o "{OUTPUT}" --dpi {RESOLUTION} {MODE} {DUPLEX} {DRIVER} {SCANNER} {SOURCE}' node dist/agent.js
   ```
   Tokens: `{NAPS2} {OUTPUT} {FORMAT} {RESOLUTION} {MODE} {DUPLEX} {SOURCE} {SCANNER} {DRIVER}`
   (`{MODE}` expands to `--bitdepth color|gray|bw`, `{DUPLEX}` to `--source duplex`,
   `{DRIVER}` to `--driver wia`, `{SCANNER}` to `--device "name"`.)

### Scanner environment variables

| Variable             | Default        | Meaning                                                                        |
| -------------------- | -------------- | ------------------------------------------------------------------------------ |
| `NAPS2_PATH`         | auto-discovered | `NAPS2.Console.exe`, or just its folder (`C:\Program Files\NAPS2`). `.exe` optional. |
| `SCANNER_NAME`       | (auto-detected) | Exact/inexact NAPS2 device name → `--device`.                                |
| `SCANNER_DRIVER`     | `wia` (Windows) | `wia`, `twain`, `escl` — required before a device can be named.                |
| `SCANNER_SOURCE`     | `duplex` if `SCANNER_DUPLEX=1` | `glass`, `feeder`, `duplex` → `--source`.                     |
| `SCANNER_PROFILE`    | `--noprofile`  | Optional named NAPS2 profile (`-p`); otherwise flags win.                       |
| `SCANNER_DRIVERS`    | `wia,twain`    | Drivers probed by `GET_SCANNERS` (`escl` does network discovery — opt in only). |
| `SCANNER_AUTO_DETECT` | `true`        | When `SCANNER_NAME` is empty, bind to the first detected device — NAPS2 8.x refuses to scan without `--device`. |
| `SCANNER_DEFAULT_DPI` | `300`         | `--dpi`.                                                                       |
| `SCANNER_DEFAULT_COLOR_MODE` | `color` | `--bitdepth color\|gray\|bw`.                                                 |

## Web-app → bridge protocol

JSON over `ws://localhost:{BRIDGE_PORT}` (default **8081**):

| Direction | Message                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C → S     | `{ "action": "PING" }`                                                                                                                                                                           |
| S → C     | `{ "type": "pong", "status": "OK", "version", "mock", "busy", "naps2", "driver" }`                                                                                                                                  |
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

`npm run test:real` exercises the real-scan path without any hardware attached: it
checks that `NAPS2_PATH` resolves for a folder, a file and auto-discovery, that PING
reports the resolved binary and driver, and that `GET_SCANNERS` answers (an empty
list until a scanner is connected).

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `NAPS2 was not found at …` | Point `NAPS2_PATH` at the NAPS2 install folder or at the `NAPS2.Console.exe` inside it. |
| `The selected scanner could not be found.` | `SCANNER_NAME` names a device that is not attached. Clear it, or copy the exact name from `--listdevices`. |
| `GET_SCANNERS` returns `[]` | The driver sees no device. Check the USB/network connection, then try `SCANNER_DRIVER=twain`. |
| `Scanner timed out after …s` | The device is off, busy, or a dialog is waiting for input. |

## Production / autostart notes

- **Windows autostart** (Task Scheduler or startup shortcut):
  `C:\Program Files\nodejs\node.exe C:\restpoint-bridge\dist\agent.js`
- The agent is single-flight by design — it services one scan at a time (matches a
  reception ADF workflow). While a scan runs it cannot answer PINGs.
- Security: by default the bridge accepts local connections only on `0.0.0.0:8081`.
  For stricter setups set `BRIDGE_ALLOWED_ORIGINS` to your web origin(s) and bind
  `BRIDGE_HOST=127.0.0.1`.

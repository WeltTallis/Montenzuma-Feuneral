# Restpoint Scanner Bridge

A tiny, always-running background agent for the **reception computer**. It exposes a
local WebSocket endpoint (`ws://localhost:8081`) that the Restpoint web app connects
to when a user clicks **Scan Docs** on a deceased profile.

The agent:

1. Drives the physical scanner (TWAIN / WIA / eSCL via the [NAPS2 CLI](https://github.com/nathaniel-mahieu/NAPS2), or any custom `SCAN_COMMAND`) to produce a single multi-page PDF.
2. Uploads that PDF **directly to the documents-service** → `POST {apiBase}/documents/upload/{deceasedId}` — no intermediate server, no HP software, no physical scan button.
3. Streams `SCANNING → UPLOADING → COMPLETE` back to the browser so the web app can show a live spinner modal, then refresh the deceased profile's Documents tab.
4. **Prints** any document the user clicks Print on, silently, to any printer the reception computer already has — USB, Wi-Fi or Bluetooth — with no system print dialog.

The user never touches the scanner or its software — they just put the paper in the
ADF tray, click **Scan Docs** in Restpoint, and the rest is automatic. Printing is
the same idea: click **Print** and the paper comes out.

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
   SCAN_COMMAND='{NAPS2} -o "{OUTPUT}" --dpi {RESOLUTION} {PAGESIZE} {MODE} {DUPLEX} {DRIVER} {SCANNER} {SOURCE}' node dist/agent.js
   ```
   Tokens: `{NAPS2} {OUTPUT} {FORMAT} {RESOLUTION} {PAGESIZE} {MODE} {DUPLEX} {SOURCE} {SCANNER} {DRIVER}`
   (`{MODE}` expands to `--bitdepth color|gray|bw`, `{PAGESIZE}` to `--pagesize a4`, `{DUPLEX}` to `--source duplex`,
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
| `SCANNER_DEFAULT_DPI` | `300`         | `--dpi` (the HP ScanJet Pro 2600 f1 supports up to 600 dpi optical).            |
| `SCANNER_PAGE_SIZE` | `a4` | `--pagesize`; set to an NAPS2 size such as `letter` or `legal` if needed. |
| `SCANNER_DEFAULT_COLOR_MODE` | `color` | `--bitdepth color\|gray\|bw`.                                                 |

## Printing

The same agent prints. Clicking **Print** in the Restpoint document viewer sends
the document to the bridge, which hands it to a printer queue **silently** — no
system print dialog appears, because the point is that the receptionist clicks
once and walks away.

**You do not have to "connect" a printer to the bridge.** The bridge reads the
inventory the operating system already keeps (`Win32_Printer` on Windows, CUPS
`lpstat` on macOS/Linux), which covers USB, Wi-Fi/TCP-IP and Bluetooth printers
alike, and reports each one's transport so the web app can label it. Printers
Windows can already *see* on the network or over Bluetooth but that have no queue
yet are returned separately, and the user can install one with a single click
(`Add-Printer -ConnectionName`, which speaks `IP_<address>` for Wi-Fi and
`BTHENUM\{…}` for Bluetooth).

For the most reliable silent PDF printing on Windows, install
[SumatraPDF](https://www.sumatrapdfreader.org/download-free-pdf-viewer) — the
bridge auto-discovers it. Without it, the bridge falls back through the
mechanisms that need no extra software:

| Order | Mechanism | Used for |
| ----- | --------- | -------- |
| 1 | `SumatraPDF -print-to -silent` | PDFs (best: honours copies/duplex) |
| 2 | Windows `printto` shell verb | anything the OS has an app for |
| 3 | .NET `System.Drawing.Printing` | images (honours printer, copies, duplex) |
| 4 | `Out-Printer` | plain text |
| — | `lp` (CUPS) | everything, on macOS/Linux |

| Variable                | Default        | Meaning                                                        |
| ----------------------- | -------------- | -------------------------------------------------------------- |
| `PRINTING_ENABLED`      | `1`            | `0` makes this a scan-only bridge.                             |
| `PRINTER_NAME`          | (system default) | Queue used when the web app does not name one.                |
| `PRINTER_INCLUDE_VIRTUAL` | `0`          | Also list "Microsoft Print to PDF" and other software queues.   |
| `SUMATRA_PATH`          | auto-discovered | `SumatraPDF.exe`, or the folder containing it.                 |
| `PRINT_COMMAND`         | (built-in)     | Full override. Tokens `{FILE} {PRINTER} {COPIES} {DUPLEX}`.    |
| `PRINT_COPIES` / `PRINT_DUPLEX` | `1` / `0` | Defaults pre-filled in the print dialog.                    |
| `PRINTER_TIMEOUT_MS`    | `60000`        | Timeout for the print process.                                 |
| `PRINT_MAX_BYTES`       | `26214400` (25 MB) | Largest document the bridge will accept.                   |

```bash
MOCK_PRINT=1 node dist/agent.js   # fake a printer, for testing/demo
```

## Web-app → bridge protocol

JSON over `ws://localhost:{BRIDGE_PORT}` (default **8081**):

| Direction | Message                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C → S     | `{ "action": "PING" }`                                                                                                                                                                           |
| S → C     | `{ "type": "pong", "status": "OK", "version", "mock", "busy", "naps2", "driver", "printing", "printerCount" }`                                                                                   |
| C → S     | `{ "action": "GET_SCANNERS" }`                                                                                                                                                                   |
| S → C     | `{ "status": "OK", "scanners": [{ "id", "name", "location", "available" }] }`                                                                                                                    |
| C → S     | `{ "action": "START_SCAN", "sessionId", "deceasedId", "documentName"?, "category"?, "token"?, "tenantSlug"?, "userId"?, "apiBase"?, "resolution"?, "colorMode"?, "duplex"?, "pages"?, "source"?, "format"? }` |
| S → C     | `{ "status": "SCANNING",  "progress", "message" }`                                                                                                                                               |
| S → C     | `{ "status": "UPLOADING", "message" }`                                                                                                                                                           |
| S → C     | `{ "status": "COMPLETE",  "message", "document", "server" }`                                                                                                                                     |
| S → C     | `{ "status": "ERROR",    "message" }`                                                                                                                                                            |
| C → S     | `{ "action": "GET_PRINTERS" }`                                                                                                                                                                   |
| S → C     | `{ "status": "OK", "printers": [{ "name", "driver", "port", "connection", "isDefault", "virtual" }], "discovered": [{ "name", "connection", "instanceId" }], "default", "enabled" }` |
| C → S     | `{ "action": "CONNECT_PRINTER", "sessionId", "name"?, "instanceId"? \| "host"? }`                                                                                                                 |
| S → C     | `{ "status": "CONNECTING" \| "CONNECTED", "message", "printers"? }`                                                                                                                              |
| C → S     | `{ "action": "PRINT", "sessionId", "documentName", "printer"?, "copies"?, "duplex"?, "dataBase64"? \| "documentUrl"? , "apiBase"?, "token"?, "tenantSlug"? }`                              |
| S → C     | `{ "status": "PRINTING",  "progress", "message", "printer" }`                                                                                                                                    |
| S → C     | `{ "status": "PRINTED",   "printer", "copies", "duplex", "via", "message" }`                                                                                                                     |
| S → C     | `{ "status": "ERROR", "code": "NOT_AUTHORISED" \| "WRONG_SCOPE" \| "NO_PRINTER" \| "PRINT_FAILED", "message" }`                                                                                 |

`connection` is how the printer is attached — `wifi`, `bluetooth`, `usb`,
`network`, `serial` or `virtual` — so the web app can label it in the picker.
`discovered` lists printers the OS can already see on the network or over
Bluetooth but that have no queue yet; `CONNECT_PRINTER` installs one in a click.

### Grants are scoped

`POST {gateway}/bridge/grant` takes a `scope` and mints an encrypted, 10-minute
grant for it: `bridge:scan` (default) or `bridge:print`. The bridge records the
scope of the grant that authorised a session and enforces it per action, so a
grant fetched in order to print cannot drive the scanner and vice versa. Both
`START_SCAN` and `PRINT` require an authorised session; `GET_SCANNERS` and
`GET_PRINTERS` do not, because they only read local device metadata.

`apiBase` is the Restpoint API gateway base (e.g. `https://restpoint.co.ke/api/v1/restpoint`)
— the web app passes it automatically. The bridge redeems the signed grant with the
cloud gateway, then posts the scanned PDF to `{apiBase}/documents/upload/{deceasedId}`
using the verified bridge grant and tenant headers. The gateway decrypts the
grant and attaches the user token upstream; the browser and local agent do not
receive the underlying login token.

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

`npm run test:print` exercises the print path with no printer attached: it stands
up a fake cloud that issues scoped grants, then asserts that PING advertises the
printing capability, `GET_PRINTERS` answers before authorisation, `PRINT` is refused
without a session, an authorised print runs `PRINTING → PRINTED` with copies
honoured, and — the important one — that a print-scoped session **cannot** drive the
scanner.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `NAPS2 was not found at …` | Point `NAPS2_PATH` at the NAPS2 install folder or at the `NAPS2.Console.exe` inside it. |
| `The selected scanner could not be found.` | `SCANNER_NAME` names a device that is not attached. Clear it, or copy the exact name from `--listdevices`. |
| `GET_SCANNERS` returns `[]` | The driver sees no device. Check the USB/network connection, then try `SCANNER_DRIVER=twain`. |
| `Scanner timed out after …s` | The device is off, busy, or a dialog is waiting for input. |
| `No printer is installed on this computer` | Nothing is set up in Windows Settings → Printers. Add the printer there, or pair it over Bluetooth/Wi-Fi. |
| `GET_PRINTERS` returns `[]` on Windows | The bridge runs as the logged-in user but that account has no printers, or PowerShell/CIM is blocked. Check `Get-Printer` in PowerShell. |
| Nothing prints although `PRINTED` is returned | Windows accepted the job into the queue. The problem is at the device — offline, out of paper, wrong tray. Check the printer itself. |
| PDFs print blank / nothing | Install SumatraPDF so the bridge uses a real PDF renderer instead of the `printto` shell verb. |
| `This session was authorised for printing, not scanning` | A print grant cannot drive the scanner. Reconnect the modal so a scan grant is fetched. |
| `WRONG_SCOPE` on PRINT | The cloud did not issue a `bridge:print` grant — check the API gateway bridge handlers are deployed. |

## Production / autostart notes

- **Windows autostart** (Task Scheduler or startup shortcut):
  `C:\Program Files\nodejs\node.exe C:\restpoint-bridge\dist\agent.js`
- The agent is single-flight by design — it services one scan at a time (matches a
  reception ADF workflow). While a scan runs it cannot answer PINGs.
- Security: by default the bridge accepts local connections only on `0.0.0.0:8081`.
  For stricter setups set `BRIDGE_ALLOWED_ORIGINS` to your web origin(s) and bind
  `BRIDGE_HOST=127.0.0.1`.

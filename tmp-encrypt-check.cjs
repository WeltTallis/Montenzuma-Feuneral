/* Temporary integration check for the PIN-encryption rewrite.
 * 1) Build an exceljs workbook with images/merges/frozen panes/tab color
 * 2) Round-trip it through xlsx-populate (no password) and re-read with exceljs
 * 3) Produce the password-encrypted output and verify the OLE2 signature
 */
const ExcelJS = require('exceljs');
const XlsxPopulate = require('xlsx-populate');

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function main() {
  // ── 1. Build workbook like buildIntakeRegisterWorkbook does ──
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Intake Register', {
    views: [{ state: 'frozen', ySplit: 3, topLeftCell: 'A4' }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws.properties.tabColor = { argb: 'FF1F7A5C' };
  ws.properties.defaultRowHeight = 18;
  ws.columns = [{ width: 30 }, { width: 20 }, { width: 15 }];
  ws.mergeCells('A1:C1');
  ws.getCell('A1').value = 'Intake Register';
  ws.getCell('A1').font = { bold: true, size: 16 };
  const logoId = wb.addImage({ buffer: PNG_1PX, extension: 'png' });
  ws.addImage(logoId, { tl: { col: 0.15, row: 0.18 }, ext: { width: 82, height: 42 } });
  const sigId = wb.addImage({ buffer: PNG_1PX, extension: 'png' });
  ws.addImage(sigId, { tl: { col: 2, row: 5 }, ext: { width: 160, height: 30 } });
  ws.getCell('B3').value = 'Jane Doe';
  ws.getCell('C3').value = 42;

  const plain = Buffer.from(await wb.xlsx.writeBuffer());

  // ── 2. Round-trip through xlsx-populate WITHOUT password, re-read with exceljs ──
  const wb2 = await XlsxPopulate.fromDataAsync(plain);
  const rt = Buffer.from(await wb2.outputAsync({}));
  const re = new ExcelJS.Workbook();
  await re.xlsx.load(rt);
  const ws2 = re.worksheets[0];
  const imgs = ws2.getImages();
  console.log('roundtrip: worksheets =', re.worksheets.length);
  console.log('roundtrip: images preserved =', imgs.length);
  console.log('roundtrip: merges =', JSON.stringify(ws2.model && ws2.model.merges));
  console.log('roundtrip: freeze panes =', JSON.stringify(ws2.views));
  console.log('roundtrip: tab color =', JSON.stringify(ws2.properties && ws2.properties.tabColor));
  console.log('roundtrip: B3 value =', ws2.getCell('B3').value, ' C3 =', ws2.getCell('C3').value);

  // ── 3. Encrypted output ──
  const enc = Buffer.from(await wb2.outputAsync({ password: 'test123' }));
  const sig = enc.subarray(0, 8).toString('hex');
  console.log('encrypted: bytes =', enc.length, ' signature =', sig);
  console.log('encrypted: standard ECMA-376 encrypted package (D0CF11E0) =', sig === 'd0cf11e0a1b11ae1');
  console.log('encrypted: differs from plain =', !enc.equals(plain));
}

main().catch((e) => { console.error('FAILED:', e && (e.stack || e.message || e)); process.exit(1); });

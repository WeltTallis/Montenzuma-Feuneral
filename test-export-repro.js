const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'restpoint_user', password: 'RestPointUser2024',
    database: 'monezuma-monalisa-feuneral-home'
  });
  const q = "SELECT d.deceased_id, d.full_name, d.admission_number, d.date_of_birth, d.date_of_death, " +
    "COALESCE(nk.full_name, d.relationship, '—') AS next_of_kin, d.burial_type AS service_type, " +
    "d.body_status, d.dispatch_date AS release_date, d.dispatch_date, d.date_admitted, d.created_at " +
    "FROM deceased d " +
    "LEFT JOIN next_of_kin nk ON nk.deceased_id = d.deceased_id AND nk.is_primary = 1 AND (nk.is_deleted IS NULL OR nk.is_deleted = 0) " +
    "ORDER BY d.created_at DESC LIMIT 5000";
  const [records] = await conn.query(q);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Deceased Records');
  worksheet.columns = [
    { header: 'File ID', key: 'fileId', width: 18 },
    { header: 'Full Name', key: 'fullName', width: 22 },
    { header: 'Date of Birth', key: 'dob', width: 16 },
    { header: 'Date of Death', key: 'dod', width: 16 },
    { header: 'Next of Kin', key: 'nextOfKin', width: 20 },
    { header: 'Service', key: 'service', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Release Date', key: 'releaseDate', width: 16 },
    { header: 'Kin Signature', key: 'signature', width: 22 }
  ];
  worksheet.mergeCells('A1:I1');
  worksheet.getCell('A1').value = 'Facility - Deceased Records Export';
  worksheet.mergeCells('A2:I2');
  worksheet.getCell('A2').value = 'Generated: now   ';
  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true };
  const headerLabels = ['File ID', 'Full Name', 'Date of Birth', 'Date of Death', 'Next of Kin', 'Service', 'Status', 'Release Date', 'Kin Signature'];
  headerLabels.forEach((label, idx) => { headerRow.getCell(idx + 1).value = label; });

  records.forEach((item, index) => {
    const rowNumber = 5 + index;
    const row = worksheet.getRow(rowNumber);
    row.getCell('A').value = item.deceased_id || item.admission_number || '—';
    row.getCell('B').value = item.full_name || '—';
    row.getCell('C').value = item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString() : '—';
    row.getCell('D').value = item.date_of_death ? new Date(item.date_of_death).toLocaleDateString() : '—';
    row.getCell('E').value = item.next_of_kin || '—';
    row.getCell('F').value = item.service_type || '—';
    const rawStatus = (item.body_status || 'Pending').toLowerCase();
    let displayStatus = 'Pending';
    if (rawStatus.includes('release') || rawStatus.includes('buried') || rawStatus.includes('transfer')) displayStatus = 'Released';
    else if (rawStatus.includes('admit') || rawStatus.includes('morgue') || rawStatus.includes('care') || rawStatus.includes('embalm')) displayStatus = 'Admitted';
    row.getCell('G').value = displayStatus;
    const relDate = item.release_date || item.dispatch_date;
    row.getCell('H').value = relDate ? new Date(relDate).toLocaleDateString() : '—';
    row.getCell('I').value = item.next_of_kin ? `${item.next_of_kin}` : 'Pending...';
    const statusCell = row.getCell('G');
    if (displayStatus === 'Released') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5E5D0' } };
      statusCell.font = { bold: true, color: { argb: 'FF2C3E26' } };
    } else if (displayStatus === 'Admitted') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E0D5' } };
      statusCell.font = { bold: true, color: { argb: 'FF5A4A38' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
      statusCell.font = { bold: true, color: { argb: 'FF721C24' } };
    }
    row.getCell('A').font = { bold: true, color: { argb: 'FF8B7355' } };
    row.getCell('C').font = { color: { argb: 'FF555555' } };
    row.getCell('D').font = { color: { argb: 'FF555555' } };
    row.getCell('H').font = { color: { argb: 'FF555555' } };
    row.getCell('I').font = { italic: true, size: 12 };
    row.height = 45;
    row.alignment = { vertical: 'middle' };
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        if (!cell.fill || cell.fill.type !== 'pattern') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F7F4' } };
      });
    }
  });

  try {
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('BUFFER OK, size:', buffer.byteLength);
  } catch (e) {
    console.log('WRITE ERROR:', e.constructor.name, '-', e.message);
    if (e.stack) console.log(e.stack.split('\n').slice(0, 8).join('\n'));
  }
  await conn.end();
})().catch(e => console.log('TOP ERR:', e.message));
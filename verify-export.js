const ExcelJS = require('exceljs');
(async () => {
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('c:/Users/User/Downloads/restpoint/export-test.xlsx');
    const ws = wb.worksheets[0];
    console.log('Sheet name:', ws.name);
    const A1 = ws.getCell('A1').value;
    console.log('Title:', A1);
    for (let r = 4; r <= 6; r++) {
      const row = ws.getRow(r);
      const vals = [];
      for (let c = 1; c <= 9; c++) vals.push(row.getCell(c).value);
      console.log('Row', r, ':', JSON.stringify(vals));
    }
  } catch (e) {
    console.log('READ ERROR:', e.message);
  }
})();
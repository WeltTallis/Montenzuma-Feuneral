const fs = require('fs');
const ExcelJS = require('exceljs');
const path = require('path');

// Create workbook and worksheet
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Deceased Records');

// Define column headers
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

// Add title row (merged cells)
worksheet.mergeCells('A1:I1');
const titleCell = worksheet.getCell('A1');
titleCell.value = 'Lee Funeral Home - Deceased Records Export';
titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

// Add subtitle row
worksheet.mergeCells('A2:I2');
const subtitleCell = worksheet.getCell('A2');
subtitleCell.value = `Generated: ${new Date().toLocaleString()} • Author: System Admin`;
subtitleCell.font = { italic: true, size: 11, color: { argb: 'FFFFFFFF' } };
subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475A43' } };

// Style header row (row 4)
const headerRow = worksheet.getRow(4);
headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B7355' } };
headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
headerRow.height = 28;

// Sample data
const sampleData = [
    {
        fileId: 'LFH-2023-0142',
        fullName: 'Robert A. Vance',
        dob: '04/12/1948',
        dod: '10/20/2023',
        nextOfKin: 'Sarah Vance',
        service: 'Burial',
        status: 'Released',
        releaseDate: '10/24/2023',
        signature: 'Sarah Vance'
    },
    {
        fileId: 'LFH-2023-0141',
        fullName: 'Margaret T. Hughes',
        dob: '11/23/1952',
        dod: '10/22/2023',
        nextOfKin: 'Michael Hughes',
        service: 'Cremation',
        status: 'Admitted',
        releaseDate: '—',
        signature: 'M. Hughes'
    },
    {
        fileId: 'LFH-2023-0140',
        fullName: 'James E. Carter',
        dob: '07/05/1965',
        dod: '10/23/2023',
        nextOfKin: 'Emma Carter',
        service: 'Burial',
        status: 'Pending',
        releaseDate: '—',
        signature: 'Pending...'
    }
];

// Add data rows
sampleData.forEach((item, index) => {
    const rowNumber = 5 + index;
    const row = worksheet.getRow(rowNumber);
    
    row.getCell('A').value = item.fileId;
    row.getCell('B').value = item.fullName;
    row.getCell('C').value = item.dob;
    row.getCell('D').value = item.dod;
    row.getCell('E').value = item.nextOfKin;
    row.getCell('F').value = item.service;
    row.getCell('G').value = item.status;
    row.getCell('H').value = item.releaseDate;
    row.getCell('I').value = item.signature;
    
    // Style status cells
    const statusCell = row.getCell('G');
    if (item.status === 'Released') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5E5D0' } };
        statusCell.font = { bold: true, color: { argb: 'FF2C3E26' } };
    } else if (item.status === 'Admitted') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E0D5' } };
        statusCell.font = { bold: true, color: { argb: 'FF5A4A38' } };
    } else if (item.status === 'Pending') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
        statusCell.font = { bold: true, color: { argb: 'FF721C24' } };
    }
    
    // Style file ID
    row.getCell('A').font = { bold: true, color: { argb: 'FF8B7355' } };
    
    // Style dates
    row.getCell('C').font = { color: { argb: 'FF555555' } };
    row.getCell('D').font = { color: { argb: 'FF555555' } };
    row.getCell('H').font = { color: { argb: 'FF555555' } };
    
    // Style signature cell (italic)
    row.getCell('I').font = { italic: true, size: 12 };
    
    // Row styling
    row.height = 45;
    row.alignment = { vertical: 'middle' };
    
    // Alternate row colors
    if (index % 2 === 0) {
        row.eachCell((cell) => {
            if (!cell.fill || cell.fill.type !== 'pattern') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F7F4' } };
            }
        });
    }
});

// Export function
const exportDataToExcel = async (req, res) => {
    try {
        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Deceased_Records_Export.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting Excel:', error);
        res.status(500).json({ error: 'Failed to export Excel file' });
    }
};

module.exports = { exportDataToExcel, workbook, worksheet };
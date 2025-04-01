import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportToExcel = ({ 
  data = [], 
  headers = {}, 
  fileName = 'exported-data',
  sheetName = 'Sheet1',
  buttonStyle = {}
}) => {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // If headers are provided, use them to format the data
    const formattedData = data.map(item => {
      const formattedItem = {};
      
      // If no headers are provided, use the original data
      if (Object.keys(headers).length === 0) {
        return item;
      }
      
      // Apply custom headers to data
      Object.keys(headers).forEach(key => {
        if (item.hasOwnProperty(key)) {
          formattedItem[headers[key]] = item[key];
        }
      });
      
      return formattedItem;
    });
    
    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Get column widths based on content
    const columnWidths = [];
    formattedData.forEach(row => {
      Object.keys(row).forEach((key, index) => {
        const cellLength = String(row[key]).length;
        const headerLength = String(key).length;
        const maxLength = Math.max(cellLength, headerLength, 10); // Minimum width of 10
        
        if (!columnWidths[index] || columnWidths[index] < maxLength) {
          columnWidths[index] = maxLength;
        }
      });
    });
    
    // Set column widths
    worksheet['!cols'] = columnWidths.map(width => ({ width: width + 2 })); // Add some padding
    
    // Apply cell styling
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Bold header style
    const headerCellStyle = { 
      font: { bold: true, sz: 12 }, 
      alignment: { horizontal: 'center' },
      fill: { fgColor: { rgb: "E6E6E6" } } // Light gray background
    };
    
    // Data cell style for better readability
    const dataCellStyle = {
      alignment: { horizontal: 'left' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
    
    // Apply styling to the header row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      // Create cell object if it doesn't exist
      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {};
      }
      
      // Apply header styling
      worksheet[cellAddress].s = headerCellStyle;
    }
    
    // Apply styling to all data cells
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        
        // Create cell object if it doesn't exist
        if (!worksheet[cellAddress].s) {
          worksheet[cellAddress].s = {};
        }
        
        // Apply data cell styling
        worksheet[cellAddress].s = dataCellStyle;
      }
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and save
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: false,
      cellStyles: true
    });
    
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
  };

  const defaultButtonStyle = {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '6px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '20px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <button 
      onClick={exportToExcel}
      className="export-button"
      style={{ ...defaultButtonStyle, ...buttonStyle }}
    >
      {/* New Excel sheet icon */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2V14H2V2H14ZM14 1H2C1.45 1 1 1.45 1 2V14C1 14.55 1.45 15 2 15H14C14.55 15 15 14.55 15 14V2C15 1.45 14.55 1 14 1Z" fill="white"/>
        <path d="M4 6H7V8H4V6Z" fill="white"/>
        <path d="M9 6H12V8H9V6Z" fill="white"/>
        <path d="M4 10H7V12H4V10Z" fill="white"/>
        <path d="M9 10H12V12H9V10Z" fill="white"/>
        <path d="M4 3.5H12V4.5H4V3.5Z" fill="white"/>
      </svg>
      Export to Excel
    </button>
  );
};

export default ExportToExcel;
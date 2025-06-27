import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import styles from './InternRemarkBulkUpload.module.css';
import { UPDATE_INTERN_BULK_FEEDBACK } from '../../constants/apiConstants';

const InternRemarkBulkUpload = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null };
    }
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Map the data to match API structure with feedback support
        const mappedData = jsonData.map(row => ({
          emailId: row['Email Id'] || row['emailId'] || '',
          remark: row['Remark'] || row['remark'] || '',
          feedback: row['Feedback'] || row['feedback'] || ''
        })).filter(item => item.emailId && (item.remark || item.feedback));
        
        setPreview(mappedData);
        setUploadStatus('');
      } catch (error) {
        setUploadStatus('Error parsing Excel file. Please check the format.');
        console.error('Error parsing Excel:', error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      { 
        'Email Id': 'rahul@gmail.com', 
        'Remark': 'DJ Sir',
        'Feedback': 'Excellent performance in frontend development tasks'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'intern_remark_feedback_template.xlsx');
  };

  const handleUpload = async () => {
    const { user, token } = getUserData();

    if (!preview.length) {
      setUploadStatus('Please select a valid Excel file first.');
      return;
    }

    setLoading(true);
    setUploadStatus('');

    try {
      const payload = {
        user: user,
        token: token,
        remarkBulkUploadModalList: preview
      };

      // Updated API endpoint to handle both remarks and feedback
      const response = await axios.post(`${UPDATE_INTERN_BULK_FEEDBACK}`, payload);
      
      if (response.data.response === 'success') {
        setUploadStatus(response.data.message);
        setTimeout(() => {
          onClose();
          resetForm(); // Move resetForm here for successful uploads
          onSuccess();
        }, 10000);
      } else {
        setUploadStatus(response.data.message || 'Failed to update remarks and feedback. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setLoading(false);
      // Remove resetForm() from here - it was causing the issue
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview([]);
    setUploadStatus('');
    // Also reset the file input
    const fileInput = document.getElementById('excel-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Bulk Update Intern Remarks & Feedback</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Step 1: Download Template</h3>
            <button className={styles.downloadBtn} onClick={downloadTemplate}>
              📥 Download Template
            </button>
          </div>

          <div className={styles.section}>
            <h3>Step 2: Upload Excel File</h3>
            <div className={styles.fileUpload}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className={styles.fileInput}
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className={styles.fileLabel}>
                {file ? file.name : 'Choose Excel File'}
              </label>
            </div>
          </div>

          {preview.length > 0 && (
            <div className={styles.section}>
              <h3>Preview ({preview.length} records)</h3>
              <div className={styles.previewContainer}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      <th>Email Id</th>
                      <th>Remark</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((item, index) => (
                      <tr key={index}>
                        <td>{item.emailId}</td>
                        <td>{item.remark || '-'}</td>
                        <td className={styles.feedbackCell}>
                          {item.feedback || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <p className={styles.moreRecords}>
                    ... and {preview.length - 5} more records
                  </p>
                )}
              </div>
            </div>
          )}

          {uploadStatus && (
            <div className={`${styles.status} ${uploadStatus.includes('✅') ? styles.success : styles.error}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.resetBtn} onClick={resetForm} disabled={loading}>
            Reset
          </button>
          <button 
            className={styles.uploadBtn} 
            onClick={handleUpload} 
            disabled={loading || !preview.length}
          >
            {loading ? 'Uploading...' : `Upload ${preview.length} Records`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InternRemarkBulkUpload;
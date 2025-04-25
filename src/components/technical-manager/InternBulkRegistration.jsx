import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import styles from './InternBulkRegistration.module.css';
import { OFFICE_LIST_URL, BULK_REGISTER_INTERN_URL, INTERNSHIP_PROGRAM_LIST } from '../../constants/apiConstants';
import { faL } from '@fortawesome/free-solid-svg-icons';

const InternBulkRegistration = ({ onClose, onUploadSuccess }) => {
  const [officeList, setOfficeList] = useState([]);
  const [internshipPrograms, setInternshipPrograms] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isReviewing, setIsReviewing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  // New state for default office and program
  const [defaultOfficeId, setDefaultOfficeId] = useState('');
  const [defaultProgram, setDefaultProgram] = useState('');

  useEffect(() => {
    // Set user and token from localStorage or context
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const authToken = localStorage.getItem('token') || '';
    
    // Fetch office list and internship programs
    fetchOfficeList();
    fetchInternshipPrograms();
  }, []);

  const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      return {
        user: user,
        token: sessionStorage.getItem('token'),
        role: user ? user.role : null
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  const fetchOfficeList = async () => {
    try {
      const response = await axios.get(`${OFFICE_LIST_URL}`);
      if (response.data.response==="success") {
        setOfficeList(response.data.payload);
        if (response.data.payload.length > 0) {
          setDefaultOfficeId(response.data.payload[0].officeId);
        }
      }
    } catch (error) {
      console.error('Error fetching office list:', error);
    }
  };

  const fetchInternshipPrograms = async () => {
    try {
      const response = await axios.get(`${INTERNSHIP_PROGRAM_LIST}`);
      if (response.data && response.data.payload) {
        setInternshipPrograms(response.data.payload);
        if (response.data.payload.length > 0) {
          setDefaultProgram(response.data.payload[0].description);
        }
      }
    } catch (error) {
      console.error('Error fetching internship programs:', error);
    }
  };

  // Handle changes to default office and program selections
  const handleDefaultOfficeChange = (e) => {
    setDefaultOfficeId(e.target.value);
  };

  const handleDefaultProgramChange = (e) => {
    setDefaultProgram(e.target.value);
  };

  const handleDownloadTemplate = () => {
    // Create a worksheet with just headers first
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "emailId",
        "firstName",
        "lastName",
        "password",
        "contactNo",
        "address",
        "yearOfPassing",
        "stream",
        "institution",
        "startDate (dd-mm-yyyy)",
        "endDate (dd-mm-yyyy)",
        "completionStatus(ongoing/released/convertedToTrainee)",
        "remark"
      ],
      // Add empty row
      ["", "", "", "", "", "", "", "", "", "", "", "", ""]
    ]);
    
    // Set column widths to prevent collapsing
    const colWidths = [
      { wch: 20 },  // emailId
      { wch: 15 },  // firstName
      { wch: 15 },  // lastName
      { wch: 15 },  // password
      { wch: 15 },  // contactNo
      { wch: 20 },  // address
      { wch: 15 },  // yearOfPassing
      { wch: 15 },  // stream
      { wch: 20 },  // institution
      { wch: 20 },  // startDate
      { wch: 20 },  // endDate
      { wch: 40 },  // completionStatus
      { wch: 20 }   // remark
    ];
    
    // Apply column widths
    ws['!cols'] = colWidths;
    
    // Create empty rows (adding 10 empty rows)
    for (let i = 0; i < 10; i++) {
      XLSX.utils.sheet_add_aoa(ws, [["", "", "", "", "", "", "", "", "", "", "", "", ""]], {origin: i + 2});
    }
    
    // Create and save the workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "Intern_Bulk_Registration_Template.xlsx");
  };

  const handleFileUpload = (e) => {
    setIsLoading(true);
    const file = e.target.files[0];
  
    if (file) {
      const reader = new FileReader();
  
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
          // Skip the first row (header)
          const rows = jsonData.slice(1).filter(row => row.length > 0 && row.some(cell => cell !== ""));
  
          const formattedData = rows.map(row => ({
            emailId: row[0],
            firstName: row[1],
            lastName: row[2],
            password: row[3],
            contactNo: row[4],
            address: row[5],
            yearOfPassing: row[6],
            stream: row[7],
            institution: row[8],
            startDate: row[9],
            endDate: row[10],
            completionStatus: row[11],
            remark: row[12],
            officeId: defaultOfficeId,
            internshipProgram: defaultProgram
          }));
  
          const processedData = processExcelData(formattedData);
          setFileData(processedData);
          setIsUploaded(true);
          validateAllEntries(processedData);
        } catch (error) {
          console.error('Error processing Excel file:', error);
        } finally {
          setIsLoading(false);
        }
      };
  
      reader.readAsArrayBuffer(file);
    } else {
      setIsLoading(false);
    }
  };
  
  // Improved getBestMatch function with better string matching
  const getBestMatch = (input, options) => {
    if (!input) return options[0]; // Default to first option if input is empty
    
    // Convert to lowercase and remove spaces for comparison
    const cleanInput = String(input).toLowerCase().trim();
    
    // Direct match check first (case insensitive)
    for (const option of options) {
      if (option.toLowerCase() === cleanInput) {
        return option;
      }
    }
    
    // Check for partial matches
    for (const option of options) {
      if (option.toLowerCase().includes(cleanInput) || 
          cleanInput.includes(option.toLowerCase())) {
        return option;
      }
    }
    
    // If no match found based on inclusion, use Levenshtein distance
    let bestMatch = options[0];
    let bestScore = Infinity;
    
    for (const option of options) {
      // Calculate Levenshtein distance
      const distance = levenshteinDistance(cleanInput, option.toLowerCase());
      if (distance < bestScore) {
        bestScore = distance;
        bestMatch = option;
      }
    }
    
    return bestMatch;
  };
  
  // Helper function for Levenshtein distance calculation
  const levenshteinDistance = (a, b) => {
    const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) {
      matrix[i][0] = i;
    }
    
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i-1] === b[j-1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,      // deletion
          matrix[i][j-1] + 1,      // insertion
          matrix[i-1][j-1] + cost  // substitution
        );
      }
    }
    
    return matrix[a.length][b.length];
  };
  
  // Improved processExcelData function with better date handling
  const processExcelData = (data) => {
    const validStatuses = ['ongoing', 'released', 'convertedToTrainee'];
    
    

    return data.map(item => {
      // Process startDate - handle multiple date formats
    console.log(item);
      let startDate = '';
      if (item.startDate) {
        // Try to detect format
        if (typeof item.startDate === 'string') {
          // Handle dd-mm-yyyy format
          if (item.startDate.includes('-')) {
            const parts = item.startDate.split('-');
            if (parts.length === 3) {
              // Assuming dd-mm-yyyy format
              if (parts[2].length === 4) { // Ensure year has 4 digits
                startDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          }
        } else if (typeof item.startDate === 'number') {
          // Handle Excel date serial number
          const excelDate = new Date(Math.round((item.startDate - 25569) * 86400 * 1000));
          startDate = excelDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
        }
        
        // If conversion failed, try to parse as date string
        if (!startDate) {
          const date = new Date(item.startDate);
          if (!isNaN(date.getTime())) {
            startDate = date.toISOString().split('T')[0];
          } else {
            startDate = item.startDate; // Keep original if all parsing fails
          }
        }
      }
      
      // Process endDate - handle multiple date formats
      let endDate = '';
      if (item.endDate) {
        // Try to detect format
        if (typeof item.endDate === 'string') {
          // Handle dd-mm-yyyy format
          if (item.endDate.includes('-')) {
            const parts = item.endDate.split('-');
            if (parts.length === 3) {
              // Assuming dd-mm-yyyy format
              if (parts[2].length === 4) { // Ensure year has 4 digits
                endDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
          }
        } else if (typeof item.endDate === 'number') {
          // Handle Excel date serial number
          const excelDate = new Date(Math.round((item.endDate - 25569) * 86400 * 1000));
          endDate = excelDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
        }
        
        // If conversion failed, try to parse as date string
        if (!endDate) {
          const date = new Date(item.endDate);
          if (!isNaN(date.getTime())) {
            endDate = date.toISOString().split('T')[0];
          } else {
            endDate = item.endDate; // Keep original if all parsing fails
          }
        }
      }
      
      // Get best match for completionStatus with improved matching
      let completionStatus = 'ongoing'; // Default value
      console.log(item.completionStatus);
      if (item.completionStatus) {
        console.log(item.completionStatus);
        const statusInput = String(item.completionStatus).trim();
        completionStatus = getBestMatch(statusInput, validStatuses);
      }
      
      return {
        ...item,
        startDate,
        endDate,
        completionStatus
      };
    });
  };
  
  const validateAllEntries = (data) => {
    const newErrors = {};
    
    data.forEach((item, index) => {
      const rowErrors = validateIntern(item);
      if (Object.keys(rowErrors).length > 0) {
        newErrors[index] = rowErrors;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateIntern = (intern) => {
    const rowErrors = {};
    
    // Required fields
    const requiredFields = ['emailId', 'firstName', 'lastName', 'password', 'startDate', 'endDate'];
    requiredFields.forEach(field => {
      if (!intern[field]) {
        rowErrors[field] = `${field} is required`;
      }
    });
    
    // Email validation
    if (intern.emailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intern.emailId)) {
      rowErrors.emailId = 'Invalid email format';
    }
    
    // Date validation
    if (intern.startDate && intern.endDate) {
      const start = new Date(intern.startDate);
      const end = new Date(intern.endDate);
      
      if (isNaN(start.getTime())) {
        rowErrors.startDate = 'Invalid start date format';
      }
      
      if (isNaN(end.getTime())) {
        rowErrors.endDate = 'Invalid end date format';
      }
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        rowErrors.endDate = 'End date must be after start date';
      }
    }
    
    return rowErrors;
  };

  const handleReview = () => {
    const isValid = validateAllEntries(fileData);
    if (isValid) {
      setIsReviewing(true);
    } else {
      alert('Please fix validation errors before proceeding to review');
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditForm({...fileData[index]});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = () => {
    // Validate edited data
    const rowErrors = validateIntern(editForm);
    
    if (Object.keys(rowErrors).length === 0) {
      const updatedData = [...fileData];
      updatedData[editingIndex] = editForm;
      setFileData(updatedData);
      setEditingIndex(null);
      
      // Update errors state if there were errors for this row
      if (errors[editingIndex]) {
        const newErrors = {...errors};
        delete newErrors[editingIndex];
        setErrors(newErrors);
      }
    } else {
      // Update errors for just this row
      setErrors(prev => ({
        ...prev,
        [editingIndex]: rowErrors
      }));
      alert('Please fix validation errors before saving');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleSubmit = async () => {
    if (Object.keys(errors).length > 0) {
      alert('Please fix all validation errors before submitting');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const {user, token} = getUserData();

      const requestData = {
        user,
        token,
        internRegistrationList: fileData
      };
      
      // Send API request
      const response = await axios.post(`${BULK_REGISTER_INTERN_URL}`, requestData);
      
      if ( response.data.response === 'success') {
        setUploadSuccess(true);
        setApiMessage(response.data.message || 'Interns registered successfully');
        
        // Call the onUploadSuccess callback function if provided
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
        
        // Reset form
        setFileData(null);
        setIsUploaded(false);
        setIsReviewing(false);       
      
      } else {
        setApiMessage(response.data.message || 'Error registering interns');
      }
    } catch (error) {
      console.error('Error submitting intern data:', error);
      setApiMessage('Error submitting data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setIsReviewing(false);
  };

  // Count total errors
  const totalErrors = Object.keys(errors).length;

  // Function to handle closing the modal
  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h1 className={styles.title}>Bulk Intern Registration</h1>
          <button className={styles.closeButton} onClick={handleCloseModal}>×</button>
        </div>
        
        {uploadSuccess && (
          <div className={styles.successMessage}>
            <p>{apiMessage}</p>
            <div className={styles.actionButtons}>
              <button 
                className={styles.button} 
                onClick={() => setUploadSuccess(false)}
              >
                Register More Interns
              </button>
              <button 
                className={styles.closeButton} 
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        {!uploadSuccess && (
          <>
            {!isReviewing ? (
              <div className={styles.uploadSection}>
                {/* New section for common Office and Program selection */}
                <div className={styles.defaultSelectionSection}>
                  <h2>Step 1: Select Default Office and Program</h2>
                  <p>These settings will be applied to all interns in the bulk upload</p>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Default Office:</label>
                      <select
                        name="defaultOffice"
                        value={defaultOfficeId}
                        onChange={handleDefaultOfficeChange}
                        className={styles.selectInput}
                      >
                        <option value="">Select Office</option>
                        {officeList.map(office => (
                          <option key={office.officeId} value={office.officeId}>
                            {office.officeName}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Default Internship Program:</label>
                      <select
                        name="defaultProgram"
                        value={defaultProgram}
                        onChange={handleDefaultProgramChange}
                        className={styles.selectInput}
                      >
                        <option value="">Select Program</option>
                        {internshipPrograms.map(program => (
                          <option key={program.id} value={program.description}>
                            {program.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.downloadSection}>
                  <h2>Step 2: Download Template</h2>
                  <p>Download the Excel template and fill in the intern details</p>
                  <button 
                    className={styles.button} 
                    onClick={handleDownloadTemplate}
                  >
                    Download Template
                  </button>
                </div>
                
                <div className={styles.uploadSection}>
                  <h2>Step 3: Upload Completed Excel File</h2>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className={styles.fileInput}
                  />
                </div>
                
                {isLoading && (
                  <div className={styles.loading}>
                    <p>Processing...</p>
                  </div>
                )}
                
                {isUploaded && !isLoading && (
                  <div className={styles.previewSection}>
                    <h2>Step 4: Preview and Fix Errors</h2>
                    
                    {totalErrors > 0 && (
                      <div className={styles.errorSummary}>
                        <p className={styles.errorText}>
                          Found {totalErrors} row(s) with errors. Please fix them before proceeding.
                        </p>
                      </div>
                    )}
                    
                    <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>Remark</th>
                            
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fileData.map((item, index) => (
                            <tr 
                              key={index} 
                              className={errors[index] ? styles.errorRow : ''}
                            >
                              <td>{index + 1}</td>
                              <td>{item.emailId}</td>
                              <td>{`${item.firstName} ${item.lastName}`}</td>
                              <td>{item.startDate}</td>
                              <td>{item.endDate}</td>
                              <td>{item.completionStatus}</td>
                              <td>{item.remark}</td>
                              
                              <td>
                                <button 
                                  className={styles.editButton}
                                  onClick={() => handleEdit(index)}
                                >
                                  Edit
                                </button>
                                {errors[index] && (
                                  <div className={styles.rowErrors}>
                                    {Object.entries(errors[index]).map(([field, message]) => (
                                      <p key={field} className={styles.errorText}>
                                        {message}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.button}
                        onClick={handleReview}
                        disabled={totalErrors > 0}
                      >
                        Review and Submit
                      </button>
                      <button 
                        className={styles.cancelButton}
                        onClick={handleCloseModal}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {editingIndex !== null && (
                  <div className={styles.editModal}>
                    <div className={styles.editModalContent}>
                      <h3>Edit Intern Details</h3>
                      
                      <div className={styles.formGroup}>
                        <label>Email:</label>
                        <input
                          type="email"
                          name="emailId"
                          value={editForm.emailId || ''}
                          onChange={handleEditChange}
                          className={errors[editingIndex]?.emailId ? styles.inputError : ''}
                        />
                        {errors[editingIndex]?.emailId && (
                          <p className={styles.errorText}>{errors[editingIndex].emailId}</p>
                        )}
                      </div>
                      
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>First Name:</label>
                          <input
                            type="text"
                            name="firstName"
                            value={editForm.firstName || ''}
                            onChange={handleEditChange}
                            className={errors[editingIndex]?.firstName ? styles.inputError : ''}
                          />
                          {errors[editingIndex]?.firstName && (
                            <p className={styles.errorText}>{errors[editingIndex].firstName}</p>
                          )}
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label>Last Name:</label>
                          <input
                            type="text"
                            name="lastName"
                            value={editForm.lastName || ''}
                            onChange={handleEditChange}
                            className={errors[editingIndex]?.lastName ? styles.inputError : ''}
                          />
                          {errors[editingIndex]?.lastName && (
                            <p className={styles.errorText}>{errors[editingIndex].lastName}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Password:</label>
                        <input
                          type="password"
                          name="password"
                          value={editForm.password || ''}
                          onChange={handleEditChange}
                          className={errors[editingIndex]?.password ? styles.inputError : ''}
                        />
                        {errors[editingIndex]?.password && (
                          <p className={styles.errorText}>{errors[editingIndex].password}</p>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Contact Number:</label>
                        <input
                          type="text"
                          name="contactNo"
                          value={editForm.contactNo || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Address:</label>
                        <textarea
                          name="address"
                          value={editForm.address || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                      
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Year of Passing:</label>
                          <input
                            type="text"
                            name="yearOfPassing"
                            value={editForm.yearOfPassing || ''}
                            onChange={handleEditChange}
                          />
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label>Stream:</label>
                          <input
                            type="text"
                            name="stream"
                            value={editForm.stream || ''}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Institution:</label>
                        <input
                          type="text"
                          name="institution"
                          value={editForm.institution || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                      
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Start Date:</label>
                          <input
                            type="date"
                            name="startDate"
                            value={editForm.startDate || ''}
                            onChange={handleEditChange}
                            className={errors[editingIndex]?.startDate ? styles.inputError : ''}
                          />
                          {errors[editingIndex]?.startDate && (
                            <p className={styles.errorText}>{errors[editingIndex].startDate}</p>
                          )}
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label>End Date:</label>
                          <input
                            type="date"
                            name="endDate"
                            value={editForm.endDate || ''}
                            onChange={handleEditChange}
                            className={errors[editingIndex]?.endDate ? styles.inputError : ''}
                          />
                          {errors[editingIndex]?.endDate && (
                            <p className={styles.errorText}>{errors[editingIndex].endDate}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Completion Status:</label>
                        <select
                          name="completionStatus"
                          value={editForm.completionStatus || 'ongoing'}
                          onChange={handleEditChange}
                        >
                          <option value="ongoing">Ongoing</option>
                          <option value="released">Released</option>
                          <option value="convertedToTrainee">Converted To Trainee</option>
                        </select>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Office:</label>
                        <select
                          name="officeId"
                          value={editForm.officeId || defaultOfficeId}
                          onChange={handleEditChange}
                        >
                          {officeList.map(office => (
                            <option key={office.officeId} value={office.officeId}>
                              {office.officeName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Internship Program:</label>
                        <select
                          name="internshipProgram"
                          value={editForm.internshipProgram || defaultProgram}
                          onChange={handleEditChange}
                        >
                          {internshipPrograms.map(program => (
                            <option key={program.id} value={program.description}>
                              {program.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Internship Program:</label>
                        <select
                          name="internshipProgram"
                          value={editForm.internshipProgram || defaultProgram}
                          onChange={handleEditChange}
                        >
                          {internshipPrograms.map(program => (
                            <option key={program.id} value={program.description}>
                              {program.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Remark:</label>
                        <textarea
                          name="remark"
                          value={editForm.remark || ''}
                          onChange={handleEditChange}
                        />
                      </div>
                      
                      <div className={styles.modalButtons}>
                        <button 
                          className={styles.saveButton}
                          onClick={handleSaveEdit}
                        >
                          Save
                        </button>
                        <button 
                          className={styles.cancelButton}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.reviewSection}>
                <h2>Final Review</h2>
                <p>Please review all intern details before submitting</p>
                
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Office</th>
                        <th>Program</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileData.map((item, index) => {
                        const office = officeList.find(o => o.officeId === item.officeId);
                        
                        return (
                          <tr key={index}>
                            <td>{item.emailId}</td>
                            <td>{`${item.firstName} ${item.lastName}`}</td>
                            <td>
                              {office ? office.officeName : 'Not specified'}
                            </td>
                            <td>
                              {item.internshipProgram || 'Not specified'}
                            </td>
                            <td>{`${item.startDate} to ${item.endDate}`}</td>
                            <td>{item.completionStatus}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.backButton}
                    onClick={handleBack}
                  >
                    Back to Edit
                  </button>
                  <button 
                    className={`${styles.button} ${styles.submitButton}`}
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Submitting...' : 'Submit Registration'}
                  </button>
                  <button 
                    className={styles.cancelButton}
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InternBulkRegistration;
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import styles from './InternBulkRegistration.module.css';
import { OFFICE_LIST_URL, BULK_REGISTER_INTERN_URL, INTERNSHIP_PROGRAM_LIST } from '../../constants/apiConstants';

const InternBulkRegistration = () => {
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
        // Set default office to first office in list
      
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
          
          // Remove header row
          const headers = jsonData[0];
          const rows = jsonData.slice(1).filter(row => row.length > 0 && row.some(cell => cell !== ""));
          
          // Transform data into the required format
          const formattedData = rows.map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
              if (row[index] !== undefined) {
                rowData[header.split(' ')[0]] = row[index]; // Only use the first part of header before any space
              }
            });
            
            // Apply default office and program to each record
            return {
              ...rowData,
              officeId: defaultOfficeId,
              internshipProgram: defaultProgram
            };
          });
          
          // Process and validate the data
          const processedData = processExcelData(formattedData);
          setFileData(processedData);
          setIsUploaded(true);
          setIsLoading(false);
          
          // Validate all entries
          validateAllEntries(processedData);
        } catch (error) {
          console.error('Error processing Excel file:', error);
          setIsLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } else {
      setIsLoading(false);
    }
  };

  const processExcelData = (data) => {
    return data.map(item => {
      // Process dates from Excel format (could be string "dd-mm-yyyy" or Excel date number)
      let startDate = item.startDate;
      let endDate = item.endDate;
      
      // If startDate exists and is a string in dd-mm-yyyy format, convert to yyyy-mm-dd
      if (startDate && typeof startDate === 'string' && startDate.includes('-')) {
        const [day, month, year] = startDate.split('-');
        startDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } 
      // If it's a number (Excel date), convert to yyyy-mm-dd
      else if (startDate && typeof startDate === 'number') {
        startDate = new Date((startDate - 25569) * 86400 * 1000).toISOString().split('T')[0];
      }
      
      // Apply same logic for endDate
      if (endDate && typeof endDate === 'string' && endDate.includes('-')) {
        const [day, month, year] = endDate.split('-');
        endDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } 
      else if (endDate && typeof endDate === 'number') {
        endDate = new Date((endDate - 25569) * 86400 * 1000).toISOString().split('T')[0];
      }
      
      // Ensure completionStatus is one of the valid enum values
      let completionStatus = item.completionStatus;
      if (completionStatus && typeof completionStatus === 'string') {
        completionStatus = completionStatus.trim().toLowerCase();
        if (!['ongoing', 'released', 'convertedtotrainee'].includes(completionStatus)) {
          completionStatus = 'ongoing'; // Default to ongoing if invalid value
        }
      } else {
        completionStatus = 'ongoing'; // Default if missing
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
      
      if (response.data && response.data.status === 'success') {
        setUploadSuccess(true);
        setApiMessage(response.data.message || 'Interns registered successfully');
        // Reset form
        setFileData([]);
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bulk Intern Registration</h1>
      
      {uploadSuccess && (
        <div className={styles.successMessage}>
          <p>{apiMessage}</p>
          <button 
            className={styles.button} 
            onClick={() => setUploadSuccess(false)}
          >
            Register More Interns
          </button>
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
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InternBulkRegistration;
import React, { useState, useEffect } from 'react';
import { Upload, X, Users, FileSpreadsheet, Check, AlertCircle, Loader, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import styles from './AddCandidateToBatch.module.css';
import { ADD_CANDIDATE_TO_BATCH_URL, VERIFY_CANDIDATE_TO_BATCH_URL, FIND_EMPLOYEE_LIST_URL } from '../../constants/apiConstants';

const AddCandidateToBatch = ({ 
  onClose, 
  batchId,
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedCandidates, setUploadedCandidates] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [candidateStatus, setCandidateStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');



  // Fetch employee list when component mounts or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'select') {
      fetchEmployeeList();
    }
  }, [isOpen, activeTab]);

  const fetchEmployeeList = async () => {
    setLoading(true);
    setError('');
    try {
       const { user, token } = getUserData();
      const response = await axios.post(FIND_EMPLOYEE_LIST_URL, {
        user,
        token
      });
      
      if (response.data.statusResponse === 'success') {
        setEmployeeList(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch employee list');
      }
    } catch (err) {
      console.error('Error fetching employee list:', err);
      setError('Error fetching employee list');
    } finally {
      setLoading(false);
    }
  };

    const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
        role: sessionStorage.getItem("role"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');
    setSuccess('');
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Extract candidates based on expected format
        const candidates = jsonData.map(row => {
          const email = row['Candidate Email'] || row['candidateEmail'] || row['email'] || row['Email'];
          const name = row['Candidate Name'] || row['candidateName'] || row['name'] || row['Name'];
          
          if (email && typeof email === 'string' && email.includes('@')) {
            return { email, name: name || '' };
          }
          return null;
        }).filter(candidate => candidate !== null);
        
        const emails = candidates.map(candidate => candidate.email);
        
        if (emails.length === 0) {
          setError('No valid email addresses found in the file. Please check the format.');
          return;
        }
        
        setUploadedCandidates(emails);
        setSuccess(`Successfully loaded ${emails.length} candidates from file`);
      } catch (err) {
        console.error('Error reading Excel file:', err);
        setError('Error reading Excel file. Please ensure it contains "Candidate Email" and "Candidate Name" columns.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      { 'Candidate Email': 'john.doe@company.com', 'Candidate Name': 'John Doe' },
      { 'Candidate Email': 'jane.smith@company.com', 'Candidate Name': 'Jane Smith' },
      { 'Candidate Email': 'robert.johnson@company.com', 'Candidate Name': 'Robert Johnson' }
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
    XLSX.writeFile(workbook, 'candidate_upload_template.xlsx');
  };

  const handleEmployeeSelection = (employee) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.some(emp => emp.emailId === employee.emailId);
      if (isSelected) {
        return prev.filter(emp => emp.emailId !== employee.emailId);
      } else {
        return [...prev, employee];
      }
    });
  };

  const verifyCandidateStatus = async (emailId) => {
    try {

       const { user, token } = getUserData();
      const response = await axios.post(VERIFY_CANDIDATE_TO_BATCH_URL, {
        user,
        token,
        emailId
      });
      
      if (response.data.statusResponse === 'success') {
        return response.data.data.status;
      }
      return 'not_found';
    } catch (err) {
      console.error('Error verifying candidate:', emailId, err);
      return 'error';
    }
  };

  const verifyAllCandidates = async () => {
    setVerifying(true);
    setError('');
    
    const candidates = activeTab === 'upload' ? uploadedCandidates : selectedEmployees.map(emp => emp.emailId);
    
    if (candidates.length === 0) {
      setError('No candidates to verify');
      setVerifying(false);
      return;
    }
    
    const statusMap = {};
    
    for (const candidate of candidates) {
      const status = await verifyCandidateStatus(candidate);
      statusMap[candidate] = status;
    }
    
    setCandidateStatus(statusMap);
    setVerifying(false);
    
    const approvedCount = Object.values(statusMap).filter(status => status === 'approved').length;
    setSuccess(`Verification complete. ${approvedCount} candidates are approved for batch assignment.`);
  };

  const handleSubmit = async () => {
    const candidates = activeTab === 'upload' ? uploadedCandidates : selectedEmployees.map(emp => emp.emailId);
    const approvedCandidates = candidates.filter(candidate => candidateStatus[candidate] === 'approved');
    
    if (approvedCandidates.length === 0) {
      setError('No approved candidates to add to batch');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const { user, token } = getUserData();

      const response = await axios.post(ADD_CANDIDATE_TO_BATCH_URL, {
        user,
        token,
        batchId,
        candidateEmailList: approvedCandidates
      });
      
      if (response.data.statusResponse === 'success') {
        setSuccess(`Successfully added ${approvedCandidates.length} candidates to batch`);
    
        // Close modal after a short delay
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to add candidates to batch');
      }
    } catch (err) {
      console.error('Error adding candidates to batch:', err);
      setError('Error adding candidates to batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveTab('upload');
    setSelectedFile(null);
    setUploadedCandidates([]);
    setSelectedEmployees([]);
    setCandidateStatus({});
    setError('');
    setSuccess('');
    setSearchTerm('');
    onClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <Check className={styles['add-candidate-batch__status-icon']} style={{ color: 'green' }} />;
      case 'not_approved':
        return <AlertCircle className={styles['add-candidate-batch__status-icon']} style={{ color: 'orange' }} />;
      case 'not_found':
        return <X className={styles['add-candidate-batch__status-icon']} style={{ color: 'red' }} />;
      case 'error':
        return <AlertCircle className={styles['add-candidate-batch__status-icon']} style={{ color: 'red' }} />;
      default:
        return <Loader className={styles['add-candidate-batch__status-icon']} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'not_approved':
        return 'Not Approved';
      case 'not_found':
        return 'Not Found';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const filteredEmployees = employeeList.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.emailId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={styles['add-candidate-batch__overlay']}>
      <div className={styles['add-candidate-batch__container']}>
        <div className={styles['add-candidate-batch__header']}>
          <h2 className={styles['add-candidate-batch__title']}>
            Add Candidates to Batch
            {batchName && <span className={styles['add-candidate-batch__batch-name']}> - {batchName}</span>}
          </h2>
          <button 
            onClick={handleClose}
            className={styles['add-candidate-batch__close-btn']}
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles['add-candidate-batch__tabs']}>
          <button
            className={`${styles['add-candidate-batch__tab']} ${activeTab === 'upload' ? styles['add-candidate-batch__tab--active'] : ''}`}
            onClick={() => setActiveTab('upload')}
            disabled={submitting}
          >
            <FileSpreadsheet size={16} />
            Excel Upload
          </button>
          <button
            className={`${styles['add-candidate-batch__tab']} ${activeTab === 'select' ? styles['add-candidate-batch__tab--active'] : ''}`}
            onClick={() => setActiveTab('select')}
            disabled={submitting}
          >
            <Users size={16} />
            Select Employees
          </button>
        </div>

        <div className={styles['add-candidate-batch__content']}>
          {activeTab === 'upload' && (
            <div className={styles['add-candidate-batch__upload-section']}>
              <div className={styles['add-candidate-batch__upload-header']}>
                <button
                  onClick={downloadExcelTemplate}
                  className={styles['add-candidate-batch__template-btn']}
                  disabled={submitting}
                >
                  <Download size={16} />
                  Download Template
                </button>
                <p className={styles['add-candidate-batch__format-info']}>
                  Excel format: "Candidate Email" and "Candidate Name" columns
                </p>
              </div>
              
              <div className={styles['add-candidate-batch__file-input']}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className={styles['add-candidate-batch__file-input-hidden']}
                  id="excel-upload"
                  disabled={submitting}
                />
                <label 
                  htmlFor="excel-upload" 
                  className={styles['add-candidate-batch__file-label']}
                >
                  <Upload size={24} />
                  {selectedFile ? selectedFile.name : 'Choose Excel file'}
                </label>
              </div>
              
              {uploadedCandidates.length > 0 && (
                <div className={styles['add-candidate-batch__candidate-list']}>
                  <h4>Uploaded Candidates ({uploadedCandidates.length})</h4>
                  <div className={styles['add-candidate-batch__candidate-items']}>
                    {uploadedCandidates.map((email, index) => (
                      <div key={index} className={styles['add-candidate-batch__candidate-item']}>
                        <span className={styles['add-candidate-batch__candidate-email']}>{email}</span>
                        <div className={styles['add-candidate-batch__candidate-status']}>
                          {candidateStatus[email] && (
                            <>
                              {getStatusIcon(candidateStatus[email])}
                              <span className={styles['add-candidate-batch__status-text']}>
                                {getStatusText(candidateStatus[email])}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'select' && (
            <div className={styles['add-candidate-batch__select-section']}>
              <div className={styles['add-candidate-batch__search']}>
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles['add-candidate-batch__search-input']}
                  disabled={submitting}
                />
              </div>
              
              {selectedEmployees.length > 0 && (
                <div className={styles['add-candidate-batch__selected-count']}>
                  Selected: {selectedEmployees.length} employees
                </div>
              )}
              
              {loading ? (
                <div className={styles['add-candidate-batch__loading']}>
                  <Loader className={styles['add-candidate-batch__spinner']} />
                  Loading employees...
                </div>
              ) : (
                <div className={styles['add-candidate-batch__employee-list']}>
                  {filteredEmployees.length === 0 ? (
                    <div className={styles['add-candidate-batch__no-employees']}>
                      No employees found
                    </div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <div 
                        key={employee.emailId} 
                        className={`${styles['add-candidate-batch__employee-item']} ${
                          selectedEmployees.some(emp => emp.emailId === employee.emailId) 
                            ? styles['add-candidate-batch__employee-item--selected'] 
                            : ''
                        }`}
                        onClick={() => !submitting && handleEmployeeSelection(employee)}
                      >
                        <div className={styles['add-candidate-batch__employee-info']}>
                          <div className={styles['add-candidate-batch__employee-name']}>{employee.name}</div>
                          <div className={styles['add-candidate-batch__employee-email']}>{employee.emailId}</div>
                        </div>
                        <div className={styles['add-candidate-batch__employee-status']}>
                          {candidateStatus[employee.emailId] && (
                            <>
                              {getStatusIcon(candidateStatus[employee.emailId])}
                              <span className={styles['add-candidate-batch__status-text']}>
                                {getStatusText(candidateStatus[employee.emailId])}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className={styles['add-candidate-batch__error']}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className={styles['add-candidate-batch__success']}>
            <Check size={16} />
            {success}
          </div>
        )}

        <div className={styles['add-candidate-batch__actions']}>
          <button
            onClick={verifyAllCandidates}
            disabled={
              verifying || 
              submitting ||
              (activeTab === 'upload' && uploadedCandidates.length === 0) ||
              (activeTab === 'select' && selectedEmployees.length === 0)
            }
            className={styles['add-candidate-batch__verify-btn']}
          >
            {verifying ? (
              <>
                <Loader className={styles['add-candidate-batch__spinner']} />
                Verifying...
              </>
            ) : (
              'Verify Status'
            )}
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={
              submitting || 
              verifying ||
              Object.keys(candidateStatus).length === 0 ||
              !Object.values(candidateStatus).some(status => status === 'approved')
            }
            className={styles['add-candidate-batch__submit-btn']}
          >
            {submitting ? (
              <>
                <Loader className={styles['add-candidate-batch__spinner']} />
                Adding...
              </>
            ) : (
              'Add to Batch'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCandidateToBatch;
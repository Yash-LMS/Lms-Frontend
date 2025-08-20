import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faDownload, faUser, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FIND_EMPLOYEE_LIST_URL, COURSE_CTR_DOWNLOAD } from '../../constants/apiConstants';
import styles from './EmployeeCTRModal.module.css';

const EmployeeCTRModal = ({ isOpen, onClose, onDownloadSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [reportType, setReportType] = useState('CURRENT');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem('user')),
        token: sessionStorage.getItem('token'),
        role: sessionStorage.getItem('role')
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter employees based on search term
    const filtered = employees.filter(employee =>
      employee.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId?.toString().includes(searchTerm)
    );
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    setError(null);
    
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        setError("User session data is missing. Please log in again.");
        return;
      }

      const requestData = {
        user,
        token,
        role: "instructor", // Filter for instructors only
        status: "active" // Only active employees
      };

      const response = await axios.post(FIND_EMPLOYEE_LIST_URL, requestData);
      
      if (response.data.response === 'success') {
        setEmployees(response.data.payload || []);
      } else {
        setError(response.data.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError('Failed to fetch employee list. Please try again.');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleDownloadCTR = async () => {
    if (!selectedEmployee) {
      alert('Please select an instructor first.');
      return;
    }

    const { user, token } = getUserData();
    
    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    setIsDownloading(true);
    
    try {
      const requestData = {
        user,
        token,
        ctrFetchType: reportType,
        instructorId: selectedEmployee.employeeId // Add instructor ID to the request
      };

      const response = await axios.post(COURSE_CTR_DOWNLOAD, requestData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Create blob link to download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `CTR_Report_${reportType.toLowerCase()}_${selectedEmployee.userName.replace(/\s+/g, '_')}.xlsx`;
      
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(link.href);
      
      // Call success callback
      if (onDownloadSuccess) {
        onDownloadSuccess(`${reportType} CTR Report for ${selectedEmployee.userName} downloaded successfully!`);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error("Failed to download CTR report:", error);
      let errorMessage = "Failed to download CTR report.";
      
      if (error.response?.status === 401) {
        errorMessage = "Unauthorized. Please log in again.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      alert(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>
            <FontAwesomeIcon icon={faDownload} className={styles.headerIcon} />
            Download Instructor CTR Report
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={isDownloading}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </header>
        
        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
              <button onClick={fetchEmployees} className={styles.retryButton}>
                Retry
              </button>
            </div>
          )}
          
          {/* Report Type Selection */}
          <div className={styles.reportTypeSection}>
            <h3>Select Report Type</h3>
            <div className={styles.reportTypeOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="CURRENT"
                  checked={reportType === 'CURRENT'}
                  onChange={(e) => setReportType(e.target.value)}
                  disabled={isDownloading}
                />
                <span>Current Report</span>
                <small>Download report for current/ongoing courses</small>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  value="COMPLETE"
                  checked={reportType === 'COMPLETE'}
                  onChange={(e) => setReportType(e.target.value)}
                  disabled={isDownloading}
                />
                <span>Complete Report</span>
                <small>Download report for all completed courses</small>
              </label>
            </div>
          </div>

          {/* Employee Selection */}
          <div className={styles.employeeSection}>
            <h3>Select Instructor</h3>
            
            {/* Search Input */}
            <div className={styles.searchContainer}>
              <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={isLoadingEmployees || isDownloading}
              />
            </div>

            {/* Employee List */}
            <div className={styles.employeeList}>
              {isLoadingEmployees ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  Loading instructors...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className={styles.noEmployees}>
                  {employees.length === 0 ? 'No instructors found.' : 'No instructors match your search.'}
                </div>
              ) : (
                filteredEmployees.map((employee) => (
                  <div
                    key={employee.employeeId}
                    className={`${styles.employeeItem} ${
                      selectedEmployee?.employeeId === employee.employeeId ? styles.selected : ''
                    }`}
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <div className={styles.employeeIcon}>
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                    <div className={styles.employeeInfo}>
                      <div className={styles.employeeName}>{employee.userName}</div>
                      <div className={styles.employeeDetails}>
                        <span>ID: {employee.employeeId}</span>
                        <span>Email: {employee.emailId}</span>
                      </div>
                    </div>
                    {selectedEmployee?.employeeId === employee.employeeId && (
                      <div className={styles.selectedIndicator}>
                        ✓
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isDownloading}
          >
            Cancel
          </button>
          <button 
            className={`${styles.downloadButton} ${isDownloading ? styles.downloading : ''}`}
            onClick={handleDownloadCTR}
            disabled={!selectedEmployee || isDownloading || isLoadingEmployees}
          >
            <FontAwesomeIcon 
              icon={faDownload} 
              className={isDownloading ? styles.spinning : ''}
            />
            <span style={{marginLeft:'8px'}}>
              {isDownloading ? 'Downloading...' : 'Download Report'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCTRModal;
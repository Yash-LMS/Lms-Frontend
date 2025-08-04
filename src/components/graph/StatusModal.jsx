import React from 'react';
import ExportToExcel from '../../assets/ExportToExcel';
import styles from './TestAnalytics.module.css';

const StatusModal = ({ 
  isOpen, 
  onClose, 
  modalData, 
  currentTest 
}) => {
  if (!isOpen) return null;

  // Helper function to safely get numeric value
  const getNumericValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    const numericValue = Number(value);
    return isNaN(numericValue) ? 'N/A' : numericValue;
  };

  // Helper function to safely format percentage
  const formatPercentage = (percentage) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return 'N/A';
    }
    const numericPercentage = Number(percentage);
    if (isNaN(numericPercentage)) {
      return 'N/A';
    }
    return `${numericPercentage.toFixed(1)}%`;
  };

  // Prepare data for Excel export
  const prepareExcelData = (users, testName, status) => {
    return users.map((user, index) => ({
      'S.No': index + 1,
      'Employee ID': user.employeeId || 'N/A',
      'Name': user.name || 'N/A',
      'Email ID': user.emailId || 'N/A',
      'Mobile No': user.mobileNo || 'N/A',
      'Employee Type': user.employeeType || 'N/A',
      'Completion Status': user.completionStatus || status.toUpperCase(),
      'Score': getNumericValue(user.score),
      'Total Marks': getNumericValue(user.totalMarks),
      'Percentage': formatPercentage(user.percentage),
      'Test Name': testName
    }));
  };

  // Prepare data for Excel export
  const excelData = prepareExcelData(modalData.users, currentTest?.testName, modalData.status);
  
  // Generate filename based on test and status
  const fileName = `${currentTest?.testName?.replace(/[^a-zA-Z0-9]/g, '_')}_${modalData.status}_Users_${new Date().toISOString().split('T')[0]}`;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.modalContentWide}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{modalData.title}</h3>
          <button className={styles.modalCloseBtn} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {modalData.users && modalData.users.length > 0 ? (
            <div className={styles.usersList}>
              <div className={styles.usersCount}>
                Total: {modalData.users.length} user{modalData.users.length !== 1 ? 's' : ''}
              </div>
              
              {/* Export to Excel Button */}
              <div className={styles.exportSection}>
                <ExportToExcel
                  data={excelData}
                  fileName={fileName}
                  sheetName={`${modalData.status.charAt(0).toUpperCase() + modalData.status.slice(1)} Users`}
                  buttonStyle={{
                    backgroundColor: '#007bff',
                    fontSize: '14px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}
                />
              </div>
              
              <div className={styles.tableHeading}>
                <h4>Employee Details</h4>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th style={{width: '60px'}}>S.No</th>
                      <th style={{width: '100px'}}>Employee ID</th>
                      <th style={{width: '150px'}}>Name</th>
                      <th style={{width: '200px'}}>Email ID</th>
                      <th style={{width: '120px'}}>Mobile No</th>
                      <th style={{width: '120px'}}>Employee Type</th>
                      <th style={{width: '140px'}}>Status</th>
                      <th style={{width: '80px'}}>Score</th>
                      <th style={{width: '100px'}}>Total Marks</th>
                      <th style={{width: '100px'}}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.users.map((user, index) => (
                      <tr key={`user-${index}-${user.employeeId || index}`} className={`${styles.tableRow} ${styles[`row${modalData.status.charAt(0).toUpperCase() + modalData.status.slice(1)}`]}`}>
                        <td style={{textAlign: 'center'}}>{index + 1}</td>
                        <td className={styles.employeeId}>{user.employeeId || 'N/A'}</td>
                        <td className={styles.employeeName}>{user.name || 'N/A'}</td>
                        <td className={styles.employeeEmail}>{user.emailId || 'N/A'}</td>
                        <td className={styles.employeeMobile}>{user.mobileNo || 'N/A'}</td>
                        <td>
                          <span className={`${styles.employeeTypeBadge} ${styles[`badge${user.employeeType?.replace(/[^a-zA-Z0-9]/g, '') || 'Default'}`]}`}>
                            {user.employeeType || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status${user.completionStatus?.replace(/[^a-zA-Z0-9]/g, '') || modalData.status.charAt(0).toUpperCase() + modalData.status.slice(1)}`]}`}>
                            {user.completionStatus || modalData.status.toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.scoreCell}>
                          {getNumericValue(user.score)}
                        </td>
                        <td className={styles.totalMarksCell}>
                          {getNumericValue(user.totalMarks)}
                        </td>
                        <td>
                          <div className={styles.percentageCell}>
                            <span className={styles.percentageText}>
                              {formatPercentage(user.percentage)}
                            </span>
                            {user.percentage !== undefined && user.percentage !== null && !isNaN(user.percentage) && (
                              <div className={styles.percentageBarSmall}>
                                <div 
                                  className={styles.percentageFillSmall} 
                                  style={{ width: `${Number(user.percentage) || 0}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className={styles.noUsers}>
              No users found for this status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
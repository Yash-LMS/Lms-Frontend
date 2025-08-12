import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faFileAlt, faSpinner, faCalendarAlt, faClock, faTrash } from "@fortawesome/free-solid-svg-icons";
import styles from "./ViewTestsModal.module.css";
import { VIEW_BATCH_TEST_URL, DELETE_BATCH_TEST_URL } from "../../constants/apiConstants";
import ExportToExcel from "../../assets/ExportToExcel";

const ViewTestsModal = ({ isOpen, onClose, batchId, batchName }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deletingTestId, setDeletingTestId] = useState(null);

  // Get user and token from sessionStorage
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

  // Check if user has technical_manager role
  const isTechnicalManager = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      return user?.role === "technical_manager";
    } catch (error) {
      console.error("Error checking user role:", error);
      return false;
    }
  };

  const fetchTests = async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { user, token } = getUserData();
      const requestData = {
        batchId: batchId,
        user: user,
        token: token
      };

      console.log(requestData);

      const response = await axios.post(VIEW_BATCH_TEST_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data && response.data.response === "success") {
        setTests(response.data.payload || []);
      } else {
        setError(response.data?.message || "Failed to fetch tests");
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "An error occurred while fetching tests"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete test function
  const handleDeleteTest = async (test) => {
    setDeletingTestId(test.testId || test.batchTestHistoryId);
    setError(null);
    setSuccessMessage(null);

    try {
      const { user, token } = getUserData();
      const requestData = {
        batchId: batchId,
        batchTestHistoryId: test.batchTestHistoryId || test.testId, // Use batchTestHistoryId from the test object
        user: user,
        token: token
      };

      console.log("Delete request data:", requestData);

      const response = await axios.post(DELETE_BATCH_TEST_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data && response.data.response === "success") {
        setSuccessMessage(`Test "${test.testName}" deleted successfully`);
        // Remove the deleted test from the local state
        setTests(prevTests => prevTests.filter(t => 
          (t.testId || t.batchTestHistoryId) !== (test.testId || test.batchTestHistoryId)
        ));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(response.data?.message || "Failed to delete test");
      }
    } catch (err) {
      console.error("Error deleting test:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "An error occurred while deleting the test"
      );
    } finally {
      setDeletingTestId(null);
    }
  };

  useEffect(() => {
    if (isOpen && batchId) {
      fetchTests();
    }
  }, [isOpen, batchId]);

  const handleClose = () => {
    setTests([]);
    setError(null);
    setSuccessMessage(null);
    setDeletingTestId(null);
    onClose();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Calculate test status based on dates
  const getTestStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Unknown';
    
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'Upcoming';
    if (now > end) return 'Expired';
    return 'Active';
  };

  // Prepare data for Excel export
  const prepareExportData = () => {
    return tests.map((test, index) => ({
      serialNumber: index + 1,
      testName: test.testName || 'N/A',
      startDate: formatDate(test.startDate),
      endDate: formatDate(test.endDate),
      status: getTestStatus(test.startDate, test.endDate)
    }));
  };

  // Define headers for Excel export
  const exportHeaders = {
    serialNumber: 'S.No.',
    testName: 'Test Name',
    startDate: 'Start Date',
    endDate: 'End Date',
    status: 'Status'
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Tests in Batch</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.batchInfo}>
            <h3>{batchName}</h3>
          </div>

          {successMessage && (
            <div className={styles.successMessage}>
              {successMessage}
            </div>
          )}

          {loading && (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon icon={faSpinner} spin />
              <p>Loading tests...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <button
                className={styles.retryButton}
                onClick={fetchTests}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && tests.length === 0 && (
            <div className={styles.noTests}>
              <FontAwesomeIcon icon={faFileAlt} size="2x" />
              <p>No tests found in this batch</p>
            </div>
          )}

          {!loading && !error && tests.length > 0 && (
            <div className={styles.testsContainer}>
              <div className={styles.testHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>Total Tests: {tests.length}</h4>
                  <ExportToExcel
                    data={prepareExportData()}
                    headers={exportHeaders}
                    fileName={`${batchName}_tests_${new Date().toISOString().split('T')[0]}`}
                    sheetName="Tests"
                    buttonStyle={{
                      backgroundColor: '#109304ff',
                      fontSize: '14px',
                      padding: '8px 16px'
                    }}
                  />
                </div>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.testsTable}>
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>
                        <FontAwesomeIcon icon={faFileAlt} className={styles.headerIcon} />
                        Test Name
                      </th>
                      <th>
                        <FontAwesomeIcon icon={faCalendarAlt} className={styles.headerIcon} />
                        Start Date
                      </th>
                      <th>
                        <FontAwesomeIcon icon={faCalendarAlt} className={styles.headerIcon} />
                        End Date
                      </th>
                      <th>Status</th>
                      {isTechnicalManager() && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tests.map((test, index) => {
                      const testStatus = getTestStatus(test.startDate, test.endDate);
                      const currentTestId = test.testId || test.batchTestHistoryId;
                      const isDeleting = deletingTestId === currentTestId;
                      
                      return (
                        <tr key={currentTestId || index}>
                          <td className={styles.serialNumber}>{index + 1}</td>
                          <td className={styles.testName}>
                            {test.testName || 'N/A'}
                          </td>
                          <td className={styles.startDate}>
                            {formatDate(test.startDate)}
                          </td>
                          <td className={styles.endDate}>
                            {formatDate(test.endDate)}
                          </td>
                          <td className={styles.testStatus}>
                            <span className={`${styles.statusBadge} ${
                              testStatus === 'Active' ? styles.active : 
                              testStatus === 'Upcoming' ? styles.upcoming : 
                              testStatus === 'Expired' ? styles.expired : 
                              styles.unknown
                            }`}>
                              {testStatus}
                            </span>
                          </td>
                          {isTechnicalManager() && (
                            <td className={styles.actions}>
                              <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteTest(test)}
                                title="Delete Test"
                                disabled={loading || isDeleting}
                              >
                                {isDeleting ? (
                                  <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                  <FontAwesomeIcon icon={faTrash} />
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTestsModal;
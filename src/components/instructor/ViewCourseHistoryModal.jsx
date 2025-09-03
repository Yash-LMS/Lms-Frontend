import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faFileAlt, faSpinner, faUser, faClock, faBook } from "@fortawesome/free-solid-svg-icons";
import styles from "./ViewTestsModal.module.css"; // Reusing the same styles
import { VIEW_BATCH_COURSE_URL } from "../../constants/apiConstants";
import ExportToExcel from "../../assets/ExportToExcel";

const ViewCourseHistoryModal = ({ isOpen, onClose, batchId, batchName }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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

  const fetchCourses = async () => {
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

      const response = await axios.post(VIEW_BATCH_COURSE_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data && response.data.response === "success") {
        setCourses(response.data.payload || []);
      } else {
        setError(response.data?.message || "Failed to fetch courses");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "An error occurred while fetching courses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && batchId) {
      fetchCourses();
    }
  }, [isOpen, batchId]);

  const handleClose = () => {
    setCourses([]);
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  // Format validity period for display
  const formatValidity = (validity) => {
    if (!validity) return 'N/A';
    return `${validity} days`;
  };

  // Prepare data for Excel export
  const prepareExportData = () => {
    return courses.map((course, index) => ({
      serialNumber: index + 1,
      courseName: course.courseName || 'N/A',
      instructorName: course.instructorName || 'N/A',
      validity: formatValidity(course.validity)
    }));
  };

  // Define headers for Excel export
  const exportHeaders = {
    serialNumber: 'S.No.',
    courseName: 'Course Name',
    instructorName: 'Instructor Name',
    validity: 'Validity Period'
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Courses in Batch</h2>
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
              <p>Loading courses...</p>
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
                onClick={fetchCourses}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && courses.length === 0 && (
            <div className={styles.noTests}>
              <FontAwesomeIcon icon={faBook} size="2x" />
              <p>No courses found in this batch</p>
            </div>
          )}

          {!loading && !error && courses.length > 0 && (
            <div className={styles.testsContainer}>
              <div className={styles.testHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>Total Courses: {courses.length}</h4>
                  <ExportToExcel
                    data={prepareExportData()}
                    headers={exportHeaders}
                    fileName={`${batchName}_courses_${new Date().toISOString().split('T')[0]}`}
                    sheetName="Courses"
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
                        <FontAwesomeIcon icon={faBook} className={styles.headerIcon} />
                        Course Name
                      </th>
                      <th>
                        <FontAwesomeIcon icon={faUser} className={styles.headerIcon} />
                        Instructor Name
                      </th>
                      <th>
                        <FontAwesomeIcon icon={faClock} className={styles.headerIcon} />
                        Validity Period
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course, index) => {
                      const currentCourseId = course.courseId || course.batchCourseHistoryId;
                      
                      return (
                        <tr key={currentCourseId || index}>
                          <td className={styles.serialNumber}>{index + 1}</td>
                          <td className={styles.testName}>
                            {course.courseName || 'N/A'}
                          </td>
                          <td className={styles.instructorName}>
                            {course.instructorName || 'N/A'}
                          </td>
                          <td className={styles.validity}>
                            <span className={styles.validityBadge}>
                              {formatValidity(course.validity)}
                            </span>
                          </td>
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

export default ViewCourseHistoryModal;
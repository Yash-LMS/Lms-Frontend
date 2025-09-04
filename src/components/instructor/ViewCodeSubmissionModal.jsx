import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ViewCodeSubmissionModal.module.css';
import { VIEW_CODING_SUBMISSION_LIST } from "../../constants/apiConstants";

const ViewCodeSubmissionModal = ({ taskId, onClose, isOpen }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Utility function to get user data
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

  // Fetch submissions data
  const fetchSubmissions = async () => {
    if (!taskId || !isOpen) return;

    setLoading(true);
    setError(null);

    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        setError("User not authenticated");
        return;
      }

      const requestData = {
        user: user,
        token: token,
        taskId: taskId
      };

      const response = await axios.post(`${VIEW_CODING_SUBMISSION_LIST}`, requestData);
      
      if (response.data && response.data.response === 'success') {
        setSubmissions(response.data.payload || []);
      } else {
        setError(response.data?.message || 'Failed to fetch submissions');
      }
    } catch (err) {
      setError('Error fetching submissions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle evaluate action
  const handleEvaluate = async (allotmentId) => {
    try {
      const { user, token } = getUserData();
      
      const requestData = {
        user: user,
        token: token,
        allotmentId: allotmentId
      };

      const response = await axios.post('/api/evaluateSubmission', requestData);
      
      if (response.data && response.data.response === 'success') {
        fetchSubmissions();
      } else {
        alert('Evaluation failed: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Error during evaluation: ' + err.message);
    }
  };

  // Get status badge class
  const getStatusClass = (status, type) => {
    if (type === 'test') {
      switch (status) {
        case 'pending': return styles.statusPending;
        case 'started': return styles.statusStarted;
        case 'completed': return styles.statusCompleted;
        default: return styles.statusDefault;
      }
    } else if (type === 'evaluation') {
      switch (status) {
        case 'pending': return styles.statusPending;
        case 'evaluated': return styles.statusEvaluated;
        default: return styles.statusDefault;
      }
    }
    return styles.statusDefault;
  };

  // Show evaluate button condition
  const showEvaluateButton = (submission) => {
    return submission.testCompletionStatus === 'completed' && 
           submission.evaluationStatus === 'pending';
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubmissions();
    }
  }, [taskId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Code Submissions</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loading}>Loading submissions...</div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={fetchSubmissions} className={styles.retryButton}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && submissions.length === 0 && (
            <div className={styles.noData}>No submissions found</div>
          )}

          {!loading && !error && submissions.length > 0 && (
            <div className={styles.tableContainer}>
              <table className={styles.submissionsTable}>
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Technology</th>
                    <th>Time (Minutes)</th>
                    <th>Test Status</th>
                    <th>Evaluation Status</th>
                    <th>Score</th>
                    <th>Max Marks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => (
                    <tr key={submission.allotmentId || index}>
                      <td className={styles.taskName}>{submission.taskName}</td>
                      <td className={styles.technology}>{submission.technology}</td>
                      <td className={styles.time}>
                        {submission.timeInMinutes ? submission.timeInMinutes.toFixed(1) : 'N/A'}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(submission.testCompletionStatus, 'test')}`}>
                          {submission.testCompletionStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(submission.evaluationStatus, 'evaluation')}`}>
                          {submission.evaluationStatus}
                        </span>
                      </td>
                      <td className={styles.score}>
                        {submission.score !== undefined ? submission.score : 'N/A'}
                      </td>
                      <td className={styles.maxMarks}>{submission.maxMarks}</td>
                      <td className={styles.actions}>
                        {showEvaluateButton(submission) && (
                          <button 
                            className={styles.evaluateButton}
                            onClick={() => handleEvaluate(submission.allotmentId)}
                          >
                            Evaluate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeFooterButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCodeSubmissionModal;
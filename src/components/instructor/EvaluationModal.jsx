import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './EvaluationModal.module.css';
import { VIEW_CODING_SUBMISSION_FILE, EVALUATE_CODE_ASSIGNMENT } from '../../constants/apiConstants';

const EvaluationModal = ({ allotmentId, maxScore, onClose, isOpen, onEvaluationComplete }) => {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  
  // Evaluation form state
  const [score, setScore] = useState('');
  const [remark, setRemark] = useState('');
  const [formError, setFormError] = useState('');

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

  // Fetch submitted file
  const fetchSubmittedFile = async () => {
    if (!allotmentId || !isOpen) return;

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
        testAllotmentId: allotmentId
      };

      const response = await axios.post(`${VIEW_CODING_SUBMISSION_FILE}`, requestData, {
        responseType: 'blob' // Important for file content
      });

      // Get filename from response headers if available
      const contentDisposition = response.headers['content-disposition'];
      let extractedFileName = 'submitted_file';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          extractedFileName = fileNameMatch[1];
        }
      }

      setFileName(extractedFileName);

      // Convert blob to text for code display
      const text = await response.data.text();
      setFileContent(text);

    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Unauthorized access');
      } else {
        setError('Error fetching file: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get file extension for syntax highlighting class
  const getFileExtension = (filename) => {
    return filename.split('.').pop()?.toLowerCase() || 'txt';
  };

  // Get language class for syntax highlighting
  const getLanguageClass = (extension) => {
    const langMap = {
      'java': 'language-java',
      'py': 'language-python',
      'cpp': 'language-cpp',
      'js': 'language-javascript',
      'jsx': 'language-javascript'
    };
    return langMap[extension] || 'language-text';
  };

  // Validate evaluation form
  const validateForm = () => {
    if (!score || score === '') {
      setFormError('Score is required');
      return false;
    }

    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScore) {
      setFormError(`Score must be a number between 0 and ${maxScore}`);
      return false;
    }

    if (!remark.trim()) {
      setFormError('Remark is required');
      return false;
    }

    setFormError('');
    return true;
  };

  // Handle evaluation submission
  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setEvaluating(true);
    
    try {
      const { user, token } = getUserData();
      
      const requestData = {
        user: user,
        token: token,
        testAllotmentId: allotmentId, // Fixed: using testAllotmentId instead of allotmentId
        score: parseFloat(score),
        remark: remark.trim()
      };

      // Fixed: using proper API constant instead of hardcoded URL
      const response = await axios.post(`${EVALUATE_CODE_ASSIGNMENT}`, requestData);
      
      // Handle different response structures
      if (response.data) {
        // Check for different success indicators
        if (response.data.response === 'success') {
          onEvaluationComplete && onEvaluationComplete();
          onClose();
        } else {
          setFormError(response.data?.message ||  'Failed to submit evaluation');
        }
      } else {
        setFormError('Invalid response from server');
      }
    } catch (err) {
      if (err.response) {
        // Handle HTTP error responses
        const errorMessage = err.response.data?.message || 
                           err.response.data?.errorMessage || 
                           `HTTP ${err.response.status}: ${err.response.statusText}`;
        setFormError('Error submitting evaluation: ' + errorMessage);
      } else if (err.request) {
        // Handle network errors
        setFormError('Network error: Unable to connect to server');
      } else {
        // Handle other errors
        setFormError('Error submitting evaluation: ' + err.message);
      }
    } finally {
      setEvaluating(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScore('');
      setRemark('');
      setFormError('');
      fetchSubmittedFile();
    } else {
      setFileContent('');
      setFileName('');
      setError(null);
    }
  }, [allotmentId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Evaluate Code Submission</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loading}>Loading submitted file...</div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={fetchSubmittedFile} className={styles.retryButton}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && fileContent && (
            <div className={styles.contentContainer}>
              {/* File Display Section */}
              <div className={styles.fileSection}>
                <div className={styles.fileHeader}>
                  <h3>Submitted File: {fileName}</h3>
                  <span className={styles.fileType}>
                    {getFileExtension(fileName).toUpperCase()}
                  </span>
                </div>
                
                <div className={styles.codeContainer}>
                  <pre className={styles.codeBlock}>
                    <code className={getLanguageClass(getFileExtension(fileName))}>
                      {fileContent}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Evaluation Form Section */}
              <div className={styles.evaluationSection}>
                <h3>Evaluation</h3>
                <form onSubmit={handleEvaluationSubmit} className={styles.evaluationForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="score" className={styles.label}>
                      Score (Max: {maxScore})
                    </label>
                    <input
                      type="number"
                      id="score"
                      min="0"
                      max={maxScore}
                      step="0.1"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className={styles.scoreInput}
                      placeholder={`Enter score (0-${maxScore})`}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="remark" className={styles.label}>
                      Remark
                    </label>
                    <textarea
                      id="remark"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className={styles.remarkTextarea}
                      placeholder="Enter evaluation remarks..."
                      rows="4"
                    />
                  </div>

                  {formError && (
                    <div className={styles.formError}>{formError}</div>
                  )}

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      disabled={evaluating}
                      className={styles.submitButton}
                    >
                      {evaluating ? 'Submitting...' : 'Submit Evaluation'}
                    </button>
                  </div>
                </form>
              </div>
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

export default EvaluationModal;
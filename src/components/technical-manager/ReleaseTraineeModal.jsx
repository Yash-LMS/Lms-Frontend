import React, { useState } from 'react';
import axios from 'axios';
import styles from './ReleaseTraineeModal.module.css';
import { RELEASE_TRAINEE_FROM_COURSE_URL } from '../../constants/apiConstants';

const ReleaseTraineeModal = ({ isOpen, onClose, student, onReleaseSuccess }) => {
  const [remark, setRemark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleRelease = async () => {
    if (!remark.trim()) {
      setError('Please provide a remark for releasing the trainee.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { user, token } = getUserData();
      if (!user || !token) {
        setError('Authentication information not found');
        setIsLoading(false);
        return;
      }

      const requestData = {
        user,
        token,
        allotmentId: student.allotmentId,
        remark: remark.trim()
      };

      const response = await axios.post(RELEASE_TRAINEE_FROM_COURSE_URL, requestData);
      
      if (response.data.response === 'success') {
        onReleaseSuccess(response.data.message);
        handleClose();
      } else {
        setError(response.data.message || 'Failed to release trainee');
      }
    } catch (error) {
      console.error('Error releasing trainee:', error);
      setError('An error occurred while releasing the trainee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRemark('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Release Trainee from Course</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.studentInfo}>
            <h3>Student Information</h3>
            <p><strong>Name:</strong> {student?.traineeName || 'N/A'}</p>
            <p><strong>Email:</strong> {student?.emailId || 'N/A'}</p>
            <p><strong>Course:</strong> {student?.courseName || 'N/A'}</p>
            <p><strong>Instructor:</strong> {student?.instructorName || 'N/A'}</p>
            <p><strong>Current Progress:</strong> {student?.completionPercentage || 0}%</p>
          </div>
          
          <div className={styles.remarkSection}>
            <label htmlFor="remark" className={styles.remarkLabel}>
              Reason for Release <span className={styles.required}>*</span>
            </label>
            <textarea
              id="remark"
              className={styles.remarkTextarea}
              placeholder="Please provide a reason for releasing this trainee from the course..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className={styles.releaseButton}
            onClick={handleRelease}
            disabled={isLoading || !remark.trim()}
          >
            {isLoading ? 'Releasing...' : 'Release Trainee'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReleaseTraineeModal;
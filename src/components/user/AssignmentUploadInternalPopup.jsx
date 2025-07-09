import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import styles from './AssignmentUploadInternalPopup.module.css';
import {VIEW_INTERNAL_ASSIGNMENT_ALLOTMENT_URL, SUBMIT_INTERNAL_ASSIGNMENT_URL,ASSIGNMENT_UPDATE_STATUS_VIEW_URL } from '../../constants/apiConstants';

const AssignmentUploadInternalPopup = ({ allotmentId, trackingId, courseTrackingStatus }) => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const allowedExtensions = ['xlsx', 'xls', 'csv', 'zip', 'pdf', 'doc', 'docx', 'txt'];
  const maxFileSize = 100 * 1024 * 1024; // 100MB

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

  const updateAssignmentStatusViewed = async () => {
    const { user, token } = getUserData();

    if (!user || !token) {
      console.error('User not authenticated for status update');
      return;
    }

    setIsUpdatingStatus(true);
    
    try {
      const requestData = {
        courseTrackingId: trackingId,
        user,
        token,
      };

      const response = await axios.post(ASSIGNMENT_UPDATE_STATUS_VIEW_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.response === 'success') {
        console.log('Assignment status updated to viewed successfully');
      } else {
        console.error('Failed to update assignment status:', response.data.message);
      }
    } catch (err) {
      console.error('Error updating assignment status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchAssignmentDetails = async () => {
    const { user, token } = getUserData();

    if (!user || !token) {
      setError('User not authenticated. Please login again.');
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        allotmentId: allotmentId,
        user,
        token,
      };

      const response = await axios.post(VIEW_INTERNAL_ASSIGNMENT_ALLOTMENT_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.response === 'success') {
        setAssignment(response.data.payload);
      } else {
        setError(response.data.message || 'Failed to fetch assignment details');
      }
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      setError('Failed to fetch assignment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentDetails();
    
    if (courseTrackingStatus === 'not_viewed') {
      updateAssignmentStatusViewed();
    }
  }, [allotmentId, courseTrackingStatus, trackingId]);

  const isEndDatePassed = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const end = new Date(endDate);
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return today > end;
  };

  const canUpload = () => {
    return assignment && 
           assignment.status === 'pending' && 
           !isEndDatePassed(assignment.endDate);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'submitted':
        return styles.statusSubmitted;
      case 'expired':
        return styles.statusExpired;
      default:
        return styles.statusDefault;
    }
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      setUploadError('Please select a file');
      return false;
    }

    if (selectedFile.size > maxFileSize) {
      setUploadError('File size exceeds 100MB limit');
      return false;
    }

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      setUploadError(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
      return false;
    }

    setUploadError('');
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setUploadProgress(0);
      setUploadStatus('');
      setTimeRemaining(null);
    } else {
      setFile(null);
      setUploadProgress(0);
      setUploadStatus('');
      setTimeRemaining(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins > 0 ? mins + 'm ' : ''}${secs}s remaining`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !validateFile(file)) {
      return;
    }

    const { user, token } = getUserData();

    if (!user || !token) {
      setUploadError('User not authenticated. Please login again.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');
    setUploadError('');
    setTimeRemaining(null);

    const uploadStartTime = Date.now();

    try {
      const formData = new FormData();

      const requestData = {
        allotmentId: allotmentId,
        trackingId: trackingId,
        user,
        token,
      };

      formData.append('requestDate', new Blob([JSON.stringify(requestData)], { type: "application/json" }));
      formData.append('file', file);

      const response = await axios.post(SUBMIT_INTERNAL_ASSIGNMENT_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentCompleted = Math.round((loaded * 100) / total);
          setUploadProgress(percentCompleted);
          setUploadStatus(`Uploading... ${percentCompleted}%`);

          const elapsedTime = (Date.now() - uploadStartTime) / 1000;
          const uploadSpeed = loaded / elapsedTime;
          const bytesRemaining = total - loaded;
          const secondsRemaining = uploadSpeed > 0 ? bytesRemaining / uploadSpeed : 0;

          if (secondsRemaining > 0 && percentCompleted < 100) {
            setTimeRemaining(formatTime(secondsRemaining));
          } else {
            setTimeRemaining(null);
          }
        },
      });

      if (response.data.response === 'success') {
        setUploadStatus('Upload completed successfully!');
        setUploadProgress(100);
        setTimeRemaining(null);
          setShowUploadPopup(false);
          fetchAssignmentDetails(); // Refresh assignment details
          setShowUploadPopup(false);
      } else {
        setUploadError(response.data.message || 'Upload failed');
        setTimeRemaining(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
      setTimeRemaining(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOverlayClick = (e) => {
    // Close modal only if clicking on the overlay itself, not the popup content
    if (e.target === e.currentTarget && !isUploading) {
      setShowUploadPopup(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading assignment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Assignment Details</h2>
      </div>

      {assignment && (
        <div className={styles.content}>
          <div className={styles.assignmentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Allotment ID:</span>
              <span className={styles.value}>{assignment.allotmentId}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>Title:</span>
              <span className={styles.value}>{assignment.title}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>Description:</span>
              <span className={styles.value}>{assignment.description}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>Allotment Date:</span>
              <span className={styles.value}>{formatDate(assignment.allotmentDate)}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>End Date:</span>
              <span className={styles.value}>{formatDate(assignment.endDate)}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>Status:</span>
              <span className={`${styles.value} ${getStatusColor(assignment.status)}`}>
                {assignment.status.toUpperCase()}
              </span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>Total Marks:</span>
              <span className={styles.value}>{assignment.totalMarks}</span>
            </div>

            {isUpdatingStatus && (
              <div className={styles.statusUpdate}>
                <em>Updating view status...</em>
              </div>
            )}
          </div>

          {canUpload() && (
            <div className={styles.uploadSection}>
              <button
                className={styles.uploadButton}
                onClick={() => setShowUploadPopup(true)}
              >
                Submit Assignment
              </button>
            </div>
          )}

          {assignment.status === 'expired' && (
            <div className={styles.expiredNotice}>
              This assignment has expired and can no longer be submitted.
            </div>
          )}

          {assignment.status === 'submitted' && (
            <div className={styles.submittedNotice}>
              Assignment has been submitted successfully.
            </div>
          )}
        </div>
      )}

      {showUploadPopup && (
        <div className={styles.overlay} onClick={handleOverlayClick}>
          <div className={styles.popup}>
            <div className={styles.popupHeader}>
              <h3>Submit Assignment</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowUploadPopup(false)}
                disabled={isUploading}
                aria-label="Close popup"
              >
                ×
              </button>
            </div>

            <div className={styles.popupContent}>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.fileInputContainer}>
                  <label htmlFor="file" className={styles.fileLabel}>
                    Choose File
                  </label>
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                    accept=".xlsx,.xls,.csv,.zip,.pdf,.doc,.docx,.txt"
                    disabled={isUploading}
                  />
                </div>

                {file && (
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                  </div>
                )}

                <div className={styles.allowedTypes}>
                  <strong>Allowed file types:</strong> Excel, CSV, ZIP, PDF, Word, TXT
                  <br />
                  <strong>Maximum size:</strong> 100MB
                </div>

                {uploadError && <div className={styles.uploadError}>{uploadError}</div>}

                {isUploading && (
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className={styles.progressText}>
                      {uploadStatus}
                      {timeRemaining && <span> - {timeRemaining}</span>}
                    </div>
                  </div>
                )}

                <div className={styles.buttonContainer}>
                  <button
                    type="button"
                    onClick={() => setShowUploadPopup(false)}
                    className={styles.cancelButton}
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={!file || isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Submit Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentUploadInternalPopup;
import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from './AssignmentUploadPopup.module.css';
import { SUBMIT_ASSIGNMENT_URL } from '../../constants/apiConstants';

const AssignmentUploadPopup = ({ allotmentId, onClose,onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);

  // To track upload start time for speed calculation
  const uploadStartTimeRef = useRef(null);

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

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      setError('Please select a file');
      return false;
    }

    if (selectedFile.size > maxFileSize) {
      setError('File size exceeds 100MB limit');
      return false;
    }

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`);
      return false;
    }

    setError('');
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

  // Format seconds as "Xm Ys remaining"
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
      setError('User not authenticated. Please login again.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');
    setError('');
    setTimeRemaining(null);
    uploadStartTimeRef.current = Date.now();

    try {
      const formData = new FormData();

      const requestData = {
        allotmentId: allotmentId,
        user,
        token,
      };

      // Append JSON part as Blob with correct key 'requestDate'
      formData.append('requestDate', new Blob([JSON.stringify(requestData)], { type: "application/json" }));
      formData.append('file', file);

      const response = await axios.post(SUBMIT_ASSIGNMENT_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          const percentCompleted = Math.round((loaded * 100) / total);
          setUploadProgress(percentCompleted);
          setUploadStatus(`Uploading... ${percentCompleted}%`);

          // Calculate time remaining
          const elapsedTime = (Date.now() - uploadStartTimeRef.current) / 1000; // seconds
          const uploadSpeed = loaded / elapsedTime; // bytes per second
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
        onClose();
        onSuccess();
      } else {
        setError(response.data.message || 'Upload failed');
        setTimeRemaining(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setTimeRemaining(null);
    } finally {
      setIsUploading(false);
      onSuccess();
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>Submit Assignment</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close popup"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.allotmentInfo}>
            <strong>Allotment ID:</strong> {allotmentId}
          </div>

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

            {error && <div className={styles.error}>{error}</div>}

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
                onClick={handleClose}
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
  );
};

export default AssignmentUploadPopup;

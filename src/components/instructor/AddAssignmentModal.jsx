import React, { useState, useRef } from 'react';
import axios from 'axios';
import { CREATE_ASSIGNMENT_URL } from "../../constants/apiConstants";
import styles from './AddAssignmentModal.module.css';

const AddAssignmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalMarks: ''
  });

  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  

  // Allowed file types
  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip'];

  if (!isOpen) return null;

    const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      return {
        user,
        token,
        role: user?.role || null,
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const isValidType = allowedFileTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
      
      if (!isValidType) {
        setErrors(prev => ({
          ...prev,
          file: 'Only PDF, DOC, DOCX, JPG, PNG, and ZIP files are allowed'
        }));
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          file: 'File size should not exceed 100MB'
        }));
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
      setErrors(prev => ({
        ...prev,
        file: ''
      }));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors(prev => ({
      ...prev,
      file: ''
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      case 'zip':
        return '🗜️';
      default:
        return '📎';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Assignment title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Assignment description is required';
    }

    if (!formData.totalMarks) {
      newErrors.totalMarks = 'Total marks is required';
    } else if (isNaN(formData.totalMarks) || parseInt(formData.totalMarks) <= 0) {
      newErrors.totalMarks = 'Total marks must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const { user, token } = getUserData();

    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    const assignmentData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      totalMarks: parseInt(formData.totalMarks)
    };

    const requestData = {
      user: user,
      token: token,
      assignment: assignmentData,
    };

    try {
      // Create FormData for multipart request
      const formDataToSend = new FormData();
      
      // Add the JSON data as a blob
      formDataToSend.append('requestData', new Blob([JSON.stringify(requestData)], {
        type: 'application/json'
      }));
      
      // Add the file if it exists
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      const response = await axios.post(CREATE_ASSIGNMENT_URL, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      console.log("Create assignment response:", response.data);

      if (response.data && (response.data.response === "success")) {
        // Reset form after successful submission
        setFormData({
          title: '',
          description: '',
          totalMarks: ''
        });
        setSelectedFile(null);
        setUploadProgress(0);
        setErrors({});
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

          onSuccess();

        console.log("Assignment created successfully:", response.data);
      } else {
        const errorMessage = response.data?.message || response.data?.payload || "Failed to create assignment";
        setErrors(prev => ({
          ...prev,
          submit: errorMessage
        }));
      }
    } catch (err) {
      console.error("Failed to add assignment:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.payload ||
        err.message ||
        "An error occurred while creating the assignment";
      
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));

      if (err.response?.status === 401) {
        alert("Unauthorized access. Please log in again.");
      }
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) {
      return; // Prevent closing while uploading
    }
    
    setFormData({
      title: '',
      description: '',
      totalMarks: ''
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>Create New Assignment</h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isUploading}
          >
            ×
          </button>
        </header>
        
        <form className={styles.courseForm} onSubmit={handleSubmit}>
          {errors.submit && (
            <div className={styles.errorMessage}>
              {errors.submit}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="title">Assignment Title *</label>
            <input 
              type="text" 
              id="title" 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter assignment title"
              className={`${styles.formInput} ${errors.title ? styles.errorInput : ''}`}
              required
              disabled={isUploading}
            />
            {errors.title && <span className={styles.errorText}>{errors.title}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description *</label>
            <textarea 
              id="description" 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter assignment description"
              className={`${styles.formInput} ${errors.description ? styles.errorInput : ''}`}
              rows="4"
              required
              disabled={isUploading}
            />
            {errors.description && <span className={styles.errorText}>{errors.description}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="totalMarks">Total Marks *</label>
            <input 
              type="number" 
              id="totalMarks" 
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleInputChange}
              placeholder="Enter total marks"
              className={`${styles.formInput} ${errors.totalMarks ? styles.errorInput : ''}`}
              min="1"
              required
              disabled={isUploading}
            />
            {errors.totalMarks && <span className={styles.errorText}>{errors.totalMarks}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="file">Assignment File (Optional)</label>
            <div className={styles.fileUploadContainer}>
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                className={styles.fileInput}
                disabled={isUploading}
              />
              {!selectedFile && (
                <label htmlFor="file" className={`${styles.fileLabel} ${isUploading ? styles.disabled : ''}`}>
                  <div className={styles.fileUploadIcon}>📁</div>
                  <span>Choose File: </span>
                  <small>PDF, DOC, DOCX, JPG, PNG, ZIP (Max 100MB)</small>
                </label>
              )}
            </div>
            {errors.file && <span className={styles.errorText}>{errors.file}</span>}
            
            {selectedFile && (
              <div className={styles.filePreview}>
                <div className={styles.fileInfo}>
                  <div className={styles.fileIcon}>
                    {getFileIcon(selectedFile.name)}
                  </div>
                  <div className={styles.fileDetails}>
                    <span className={styles.fileName}>{selectedFile.name}</span>
                    <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={removeFile}
                    title="Remove file"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {isUploading && uploadProgress > 0 && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className={styles.progressText}>{uploadProgress}% uploaded</span>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isUploading || loading}
            >
              {isUploading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssignmentModal;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './UpdatePassword.module.css';
import { UPDATE_PASSWORD } from '../../constants/apiConstants';
import DashboardSidebar from '../../assets/DashboardSidebar';
import InstructorSidebar from '../instructor/InstructorSidebar';
import { UPDATE_RESUME_URL, DOWNLOAD_YOUR_RESUME_URL } from '../../constants/apiConstants';

// Utility function to get user data from sessionStorage
const getUserData = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const token = sessionStorage.getItem("token");
    const role = user?.role || null;
    
    return {
      user,
      token,
      role,
    };
  } catch (error) {
    console.error("Error parsing user data:", error);
    return { user: null, token: null, role: null };
  }
};

const ProfileManagement = () => {
  const [formData, setFormData] = useState({
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [response, setResponse] = useState(null);
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState("password");
  
  // Resume related state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeResponse, setResumeResponse] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    const { role: userRole } = getUserData();
    setRole(userRole);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { user, token } = getUserData();
    
    if (!user || !token) {
      setResponse({
        success: false,
        message: 'User authentication data not found. Please login again.'
      });
      return;
    }
    
    setLoading(true);
    setResponse(null);
    
    try {
      const response = await axios.post(`${UPDATE_PASSWORD}`, {
        user: user,
        token: token,
        password: formData.password
      });
      
      if (response.data.response === "success") {
        setResponse({
          success: true,
          message: response.data.message || 'Password updated successfully'
        });
        
        setFormData({
          password: ''
        });
      } else {
        setResponse({
          success: false,
          message: response.data.message || 'Failed to update password'
        });
      }
      
    } catch (error) {
      setResponse({
        success: false,
        message: error.response?.data?.message || 'Failed to update password'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setResumeResponse({
          success: false,
          message: 'Please upload a valid document file (PDF, DOC, DOCX)'
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setResumeResponse({
          success: false,
          message: 'File size should not exceed 5MB'
        });
        return;
      }
      
      setResumeFile(file);
      setResumeResponse(null);
    }
  };

const handleResumeUpload = async (e) => {
  e.preventDefault();
  
  if (!resumeFile) {
    setResumeResponse({
      success: false,
      message: 'Please select a resume file to upload'
    });
    return;
  }

  const { user, token } = getUserData();
  
  if (!user || !token) {
    setResumeResponse({
      success: false,
      message: 'User authentication data not found. Please login again.'
    });
    return;
  }

  setResumeLoading(true);
  setResumeResponse(null);

  try {
    // Create FormData for file upload according to your API structure
    const uploadData = new FormData();
    
    // Add the requestData part with user and token as a JSON blob
    const requestData = {
      user: user,
      token: token
    };
    
    // Create a blob with the correct content type for JSON
    const requestDataBlob = new Blob([JSON.stringify(requestData)], {
      type: 'application/json'
    });
    
    uploadData.append('requestData', requestDataBlob);
    
    // Add the resume file with the exact parameter name from your API
    uploadData.append('resume', resumeFile);

    const response = await axios.post(UPDATE_RESUME_URL, uploadData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
    });

    if (response.data.response === "success") {
      setResumeResponse({
        success: true,
        message: response.data.message || 'Resume uploaded successfully'
      });
      setResumeFile(null);
      // Reset file input
      const fileInput = document.getElementById('resume-file');
      if (fileInput) fileInput.value = '';
    } else {
      setResumeResponse({
        success: false,
        message: response.data.message || 'Failed to upload resume'
      });
    }

  } catch (error) {
    setResumeResponse({
      success: false,
      message: error.response?.data?.message || 'Failed to upload resume'
    });
  } finally {
    setResumeLoading(false);
  }
};

  const handleResumeDownload = async () => {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      setResumeResponse({
        success: false,
        message: 'User authentication data not found. Please login again.'
      });
      return;
    }

    setDownloadLoading(true);
    setResumeResponse(null);

    try {
      const response = await axios.post(DOWNLOAD_YOUR_RESUME_URL, {
        user: user,
        token: token
      }, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or set default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'resume.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setResumeResponse({
        success: true,
        message: 'Resume downloaded successfully'
      });

    } catch (error) {
      if (error.response?.status === 401) {
        setResumeResponse({
          success: false,
          message: 'Unauthorized access. Please login again.'
        });
      } else {
        setResumeResponse({
          success: false,
          message: error.response?.data?.message || 'Failed to download resume'
        });
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderPasswordTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <div className={styles.headerIcon}></div>
        </div>
        <h2 className={styles.title}>Update Password</h2>
        <p className={styles.subtitle}>Enter the details to update user password</p>
      </div>

      {response && (
        <div className={`${styles.alert} ${response.success ? styles.alertSuccess : styles.alertError}`}>
          <div className={`${styles.alertIcon} ${response.success ? styles.checkIcon : styles.alertCircleIcon}`}></div>
          <span>{response.message}</span>
        </div>
      )}

      <form onSubmit={handlePasswordSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>
            New Password
          </label>
          <div className={styles.inputWrapper}>
            <div className={`${styles.inputIcon} ${styles.lockIcon}`}></div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="Enter new password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={styles.eyeButton}
              disabled={loading}
            >
              <div className={`${styles.eyeIcon} ${showPassword ? styles.eyeOffIcon : styles.eyeOnIcon}`}></div>
            </button>
          </div>
          {errors.password && (
            <span className={styles.errorMessage}>{errors.password}</span>
          )}
        </div>

        <button
          type="submit"
          className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
          disabled={loading}
        >
          {loading ? (
            <div className={styles.spinner}></div>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );

  const renderResumeTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <div className={styles.headerIcon}></div>
        </div>
        <h2 className={styles.title}>Resume Management</h2>
        <p className={styles.subtitle}>Upload or download your resume</p>
      </div>

      {resumeResponse && (
        <div className={`${styles.alert} ${resumeResponse.success ? styles.alertSuccess : styles.alertError}`}>
          <div className={`${styles.alertIcon} ${resumeResponse.success ? styles.checkIcon : styles.alertCircleIcon}`}></div>
          <span>{resumeResponse.message}</span>
        </div>
      )}

      <div className={styles.resumeSection}>
        <form onSubmit={handleResumeUpload} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="resume-file" className={styles.label}>
              Upload Resume
            </label>
            <div className={styles.fileInputWrapper}>
              <input
                type="file"
                id="resume-file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeFileChange}
                className={styles.fileInput}
                disabled={resumeLoading}
              />
              <div className={styles.fileInputDisplay}>
                {resumeFile ? resumeFile.name : 'Choose file...'}
              </div>
            </div>
            <small className={styles.helpText}>
              Supported formats: PDF, DOC, DOCX (Max size: 5MB)
            </small>
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} ${resumeLoading ? styles.loading : ''}`}
            disabled={resumeLoading || !resumeFile}
          >
            {resumeLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              'Upload Resume'
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <button
          onClick={handleResumeDownload}
          className={`${styles.downloadButton} ${downloadLoading ? styles.loading : ''}`}
          disabled={downloadLoading}
        >
          {downloadLoading ? (
            <div className={styles.spinner}></div>
          ) : (
            'Download Current Resume'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {role === "instructor" ? (
        <InstructorSidebar activeTab={activeTab} />
      ) : role === "user" ? (
        <DashboardSidebar activeTab={activeTab} />
      ) : null}
      
      <div className={styles.formWrapper}>
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'password' ? styles.activeTabButton : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Update Password
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'resume' ? styles.activeTabButton : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            Resume Management
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'password' ? renderPasswordTab() : renderResumeTab()}
      </div>
    </div>
  );
};

export default ProfileManagement;
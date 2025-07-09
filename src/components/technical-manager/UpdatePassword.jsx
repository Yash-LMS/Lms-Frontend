import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './UpdatePassword.module.css';
import { UPDATE_USER_PASSWORD } from '../../constants/apiConstants';
import Sidebar from './Sidebar';

// Utility function to get user data from sessionStorage
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

const UpdatePassword = () => {
  const [formData, setFormData] = useState({
    emailId: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [response, setResponse] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.emailId) {
      newErrors.emailId = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailId)) {
      newErrors.emailId = 'Invalid email format';
    }
    
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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Get user data from sessionStorage
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
      const response = await axios.post(`${UPDATE_USER_PASSWORD}`, {
        user: user,
        token: token,
        emailId: formData.emailId,
        password: formData.password
      });
      
      // Handle the API response structure: {response: "success", payload: null, message: "Password updated"}
      if (response.data.response === "success") {
        setResponse({
          success: true,
          message: response.data.message || 'Password updated successfully'
        });
        
        // Reset form on success
        setFormData({
          emailId: '',
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.container}>
      <Sidebar activeTab="password" />
      <div className={styles.formWrapper}>
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

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="emailId" className={styles.label}>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <div className={`${styles.inputIcon} ${styles.mailIcon}`}></div>
              <input
                type="email"
                id="emailId"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.emailId ? styles.inputError : ''}`}
                placeholder="Enter email address"
                disabled={loading}
              />
            </div>
            {errors.emailId && (
              <span className={styles.errorMessage}>{errors.emailId}</span>
            )}
          </div>

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
    </div>
  );
};

export default UpdatePassword;
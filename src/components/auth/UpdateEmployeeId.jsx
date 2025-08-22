import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Form.module.css';
import { EMPLOYEE_UPDATE_URL } from '../../constants/apiConstants';

const UpdateEmployeeId = ({ setLoginStatus }) => {
    const navigate = useNavigate();
    const [loadRender, setLoadRender] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');
    const [userRole, setUserRole] = useState('');
    
    const [formData, setFormData] = useState({
        employeeId: ''
    });

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

    const handleLogout = () => {
        // Clear all session data
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        
        // Update login status if provided
        if (setLoginStatus) {
            setLoginStatus(false);
        }
        
        // Navigate to login page
        navigate('/login');
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value.trim()
        });
        setUpdateError(''); // Clear any previous errors
    };

    const validateEmployeeId = (employeeId) => {
        // Basic validation - adjust according to your requirements
        if (!employeeId) {
            return 'Employee ID is required';
        }
        
        if (employeeId.length < 3) {
            return 'Employee ID must be at least 3 characters long';
        }
        
        if (employeeId.length > 20) {
            return 'Employee ID must not exceed 20 characters';
        }
        
        // Check for valid characters (alphanumeric, hyphens, underscores)
        const validPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validPattern.test(employeeId)) {
            return 'Employee ID can only contain letters, numbers, hyphens, and underscores';
        }
        
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdateError('');
        setUpdateSuccess('');
        setLoadRender(true);

        // Validate employee ID
        const validationError = validateEmployeeId(formData.employeeId);
        if (validationError) {
            setUpdateError(validationError);
            setLoadRender(false);
            return;
        }

        const { user, token } = getUserData();
        
        if (!user || !token) {
            setUpdateError('Session expired. Please login again.');
            setLoadRender(false);
            return;
        }

        try {
            const requestData = {
                user: user,
                token: token,
                employeeId: formData.employeeId
            };
            
            const response = await axios.post(EMPLOYEE_UPDATE_URL, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.response === "success") {
                // Update user data in sessionStorage
                const updatedUser = { ...user, employeeId: formData.employeeId, hasEmployeeId: true };
                
                setUpdateSuccess('Employee ID updated successfully! You will be logged out redirected in 3 seconds...');
                
                // Redirect after a short delay
                setTimeout(() => {
                    handleLogout();
                }, 3000);
                
            } else {
                setUpdateError(response.data.message || "Unable to update Employee ID. Please try again.");
            }
        } catch (err) {
            console.error('Employee ID update error:', err);
            setUpdateError(err.response?.data?.message || err.message || "Update failed. Please try again.");
        } finally {
            setLoadRender(false);
        }
    };
    
    // Dynamic content based on user role
    const getPageTitle = () => {
        return userRole === 'instructor' ? 'Set Your Instructor Employee ID' : 'Set Your Employee ID';
    };

    const getSubtitle = () => {
        return userRole === 'instructor' 
            ? 'Please enter your unique instructor employee ID to continue'
            : 'Please enter your employee ID to complete your profile setup';
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <h2 className={styles.title}>{getPageTitle()}</h2>
                <p className={styles.subtitle}>{getSubtitle()}</p>
                
                {updateError && <div className={styles.errorMessage}>{updateError}</div>}
                {updateSuccess && <div className={styles.successMessage}>{updateSuccess}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Employee ID *</label>
                        <input
                            type="text"
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleInputChange}
                            placeholder="Enter your employee ID"
                            className={styles.input}
                            required
                            maxLength="20"
                            style={{ padding: '13px' }}
                        />
                        <small className={styles.fileHint}>
                            Employee ID should be 3-20 characters long and contain only letters, numbers, hyphens, and underscores
                        </small>
                    </div>
                    
                    <div className={styles.buttonGroup}>
                        <button
                            type="submit"
                            disabled={loadRender}
                            className={styles.submitButton}
                        >
                            {loadRender ? 'Updating...' : 'Update Employee ID'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateEmployeeId;
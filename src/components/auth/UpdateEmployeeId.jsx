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
        
        // Only allow numeric input
        const numericValue = value.replace(/[^0-9]/g, '');
        
        setFormData({
            ...formData,
            [name]: numericValue
        });
        setUpdateError(''); // Clear any previous errors
    };

    const validateEmployeeId = (employeeId) => {
        // Validation for integer-only employee ID
        if (!employeeId) {
            return 'Employee ID is required';
        }
        
        // Check if it's a valid integer
        if (!/^\d+$/.test(employeeId)) {
            return 'Employee ID must contain only numbers';
        }
        
        // Check for minimum length (at least 1 digit, but you can adjust)
        if (employeeId.length < 3) {
            return 'Employee ID must be at least 3 digits long';
        }
        
        // Check for maximum length
        if (employeeId.length > 10) {
            return 'Employee ID must not exceed 10 digits';
        }
        
        // Prevent leading zeros (optional - remove if leading zeros are allowed)
        if (employeeId.length > 1 && employeeId.startsWith('0')) {
            return 'Employee ID cannot start with zero';
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
                employeeId: parseInt(formData.employeeId, 10) // Convert to integer before sending
            };
            
            const response = await axios.post(EMPLOYEE_UPDATE_URL, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.response === "success") {
                // Update user data in sessionStorage
                const updatedUser = { ...user, employeeId: parseInt(formData.employeeId, 10), hasEmployeeId: true };
                
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
                            placeholder="Enter your employee ID (numbers only)"
                            className={styles.input}
                            required
                            maxLength="10"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            style={{ padding: '13px' }}
                        />
                        <small className={styles.fileHint}>
                            Employee ID should be 3-10 digits long and contain only numbers
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
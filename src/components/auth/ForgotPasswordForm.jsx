import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Form.module.css';
import { USER_ACCOUNT_OTP_GENERATE, USER_ACCOUNT_OTP_VALIDATE } from '../../constants/apiConstants';

const ForgotPasswordForm = () => {
    const navigate = useNavigate();
    const [loadRender, setLoadRender] = useState(false);
    const [step, setStep] = useState(1); // 1: Email entry, 2: OTP verification and new password
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [formData, setFormData] = useState({
        emailId: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [recoveryId, setRecoveryId] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateEmail = (email) => {
        return email.endsWith('@yash.com');
    };

    const handleGenerateOTP = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setLoadRender(true);

        // Validate email
        if (!validateEmail(formData.emailId)) {
            setMessage('Email must end with @yash.com');
            setIsError(true);
            setLoadRender(false);
            return;
        }

        try {
            const response = await axios.get(USER_ACCOUNT_OTP_GENERATE, {
                params: { 
                    emailId: formData.emailId
                } 
            });
            
            if (response.data.response === "success") {
                setRecoveryId(response.data.payload.recoveryId);
                setMessage('OTP has been sent to your email.');
                setStep(2);
            } else {
                setMessage(response.data.message || "Failed to generate OTP. Please try again.");
                setIsError(true);
            }
        } catch (err) {
            setMessage(err.message || "An error occurred. Please try again later.");
            setIsError(true);
        } finally {
            setLoadRender(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setLoadRender(true);

        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage('Passwords do not match');
            setIsError(true);
            setLoadRender(false);
            return;
        }

        try {
            const response = await axios.get(USER_ACCOUNT_OTP_VALIDATE, {
                params: { 
                    recoveryId: recoveryId,
                    otp: formData.otp,
                    newPassword: formData.newPassword
                } 
            });
            
            if (response.data.response === "success") {
                setMessage('Password has been reset successfully!');
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setMessage(response.data.message || "Failed to reset password. Please try again.");
                setIsError(true);
            }
        } catch (err) {
            setMessage(err.message || "An error occurred. Please try again later.");
            setIsError(true);
        } finally {
            setLoadRender(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper} style={{ marginTop: '110px' }}>
                <h2 className={styles.title}>Forgot Password</h2>
                
                {message && (
                    <div className={isError ? styles.errorMessage : styles.successMessage}>
                        {message}
                    </div>
                )}
                
                {step === 1 ? (
                    <form onSubmit={handleGenerateOTP}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                name="emailId"
                                value={formData.emailId}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Email"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loadRender}
                            className={styles.submitButton}
                        >
                            {loadRender ? 'Loading...' : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Enter OTP</label>
                            <input
                                type="text"
                                name="otp"
                                value={formData.otp}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter OTP"
                                required
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="New Password"
                                required
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Confirm Password"
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loadRender}
                            className={styles.forgotPasswordButton}
                        >
                            {loadRender ? 'Loading...' : 'Reset Password'}
                        </button>
                    </form>
                )}
                
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <button 
                        onClick={() => navigate('/login')} 
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#a53bf6e0', 
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;
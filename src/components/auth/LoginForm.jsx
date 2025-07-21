import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Form.module.css'; 
import { LOGIN_URL,VERSION_CHECK_URL } from '../../constants/apiConstants';

const LoginForm = ({ setLoginStatus }) => {
    const navigate = useNavigate();
    const [loadRender, setLoadRender] = useState(false);
    const [formData, setFormData] = useState({
        emailId: '',
        password: ''
    });

    const [login, setLogin] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [user, setUser] = useState(null);
    const [versionMismatch, setVersionMismatch] = useState(false);
    const [isCheckingVersion, setIsCheckingVersion] = useState(true);

    // Get version from environment variables
    const CLIENT_VERSION = process.env.REACT_APP_VERSION || 'V1';
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

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

    const needsProfileCompletion = (userData) => {
        const resumeNotUpdated = !userData.resumeStatus || userData.resumeStatus === 'not_updated';
        const photoNotUpdated = !userData.photoStatus || userData.photoStatus === 'not_updated';
        
        return resumeNotUpdated || photoNotUpdated;
    };

    const redirectUser = (userData) => {
        if (userData.role === 'user' && needsProfileCompletion(userData)) {
            navigate("/complete-profile");
            return;
        }

        if (userData.role === 'instructor' && needsProfileCompletion(userData)) {
            navigate("/complete-profile");
            return;
        }
        
        if (userData.role === 'instructor') {
            navigate("/instructor-dashboard");
        } else if (userData.role === 'user') {
            navigate("/user-dashboard");
        } else {
            navigate("/manager-dashboard");
        }
    };

    // Version check function
    const checkVersion = async () => {
        try {
            setIsCheckingVersion(true);
            const response = await axios.get(VERSION_CHECK_URL);
            const serverVersion = response.data;
            
            if (CLIENT_VERSION !== serverVersion) {
                setVersionMismatch(true);
                setLoginError(`Version mismatch detected. Client: ${CLIENT_VERSION}, Server: ${serverVersion}. Please clear cache and cookies.`);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Version check failed:', error);
            // If version check fails, we can either:
            // 1. Allow login (assuming version is okay)
            // 2. Block login (strict version control)
            // Here we'll allow login but log the error
            console.warn('Version check failed, proceeding with login');
            return true;
        } finally {
            setIsCheckingVersion(false);
        }
    };

    // Function to clear cache and cookies
    const clearCacheAndCookies = () => {
        try {
            // Clear sessionStorage
            sessionStorage.clear();
            
            // Clear localStorage
            localStorage.clear();
            
            // Clear cookies (for current domain)
            document.cookie.split(";").forEach((c) => {
                const eqPos = c.indexOf("=");
                const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
            });
            
            // Force reload the page to clear any cached resources
            window.location.reload(true);
        } catch (error) {
            console.error('Error clearing cache and cookies:', error);
            alert('Please manually clear your browser cache and cookies, then refresh the page.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // If version mismatch detected, don't proceed with login
        if (versionMismatch) {
            return;
        }
        
        setLoginError('');
        setLoadRender(true);

        // Check version before proceeding with login
        const versionValid = await checkVersion();
        if (!versionValid) {
            setLoadRender(false);
            return;
        }

        try {
            const response = await axios.get(LOGIN_URL, {
                params: { 
                    emailId: formData.emailId, 
                    password: formData.password 
                } 
            });
            
            if(response.data.response === "success") {
                const userData = response.data.payload.user;
                setUser(userData);
                sessionStorage.setItem('user', JSON.stringify(userData));
                sessionStorage.setItem('token', response.data.payload.token);
                sessionStorage.setItem('role', userData.role);
                setLoginStatus(true);
                setLogin(true);
                
                redirectUser(userData);
            } else {
                setLoginError(response.data.message || "Unable to login try again");
                setFormData({ emailId: '', password: '' });
            }
        } catch (err) {
            setLoginError(err.message); 
            setFormData({ emailId: '', password: '' });
        } finally {
            setLoadRender(false);
        }
    };

    useEffect(() => {
        // Check version on component mount
        const initializeComponent = async () => {
            const versionValid = await checkVersion();
            
            if (versionValid) {
                const { user, token } = getUserData();
                
                if(user == null) {
                    return;
                }
                
                redirectUser(user);
            }
        };

        initializeComponent();
    }, []);

    // If checking version, show loading state
    if (isCheckingVersion) {
        return (
            <div className={styles.container}>
                <div className={styles.formWrapper} style={{ marginTop: '110px' }}>
                    <div className={styles.title}>Checking application version...</div>
                </div>
            </div>
        );
    }

    // If version mismatch detected, show warning
    if (versionMismatch) {
        return (
            <div className={styles.container}>
                <div className={styles.formWrapper} style={{ marginTop: '110px' }}>
                    <h2 className={styles.title} style={{ color: '#dc3545' }}>Version Mismatch Detected</h2>
                    <div className={styles.errorMessage} style={{ marginBottom: '20px' }}>
                        {loginError}
                    </div>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <p>Your application version is outdated. Please clear your browser cache and cookies to get the latest version.</p>
                        <p><strong>Client Version:</strong> {CLIENT_VERSION}</p>
                    </div>
                    <button
                        onClick={clearCacheAndCookies}
                        className={styles.submitButton}
                        style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                    >
                        Clear Cache & Cookies
                    </button>
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <small>
                            If the problem persists, please manually:
                            <br />
                            1. Clear your browser cache and cookies
                            <br />
                            2. Close and reopen your browser
                            <br />
                            3. Refresh this page
                        </small>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper} style={{ marginTop: '110px' }}>
                <h2 className={styles.title}>Login</h2>
                {loginError && <div className={styles.errorMessage}>{loginError}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            name="emailId"
                            value={formData.emailId}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder='Email'
                            required
                            disabled={versionMismatch}
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder='Password'
                            required
                            disabled={versionMismatch}
                        />
                        <div className={styles.forgotPassword}>
                            <button 
                                type="button" 
                                onClick={handleForgotPassword}
                                className={styles.forgotPasswordBtn}
                                disabled={versionMismatch}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loadRender || versionMismatch}
                        className={styles.submitButton} 
                    >
                        {loadRender ? 'Loading...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
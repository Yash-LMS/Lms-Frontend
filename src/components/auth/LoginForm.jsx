import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Form.module.css'; 
import { LOGIN_URL } from '../../constants/apiConstants';

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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // const validateEmail = (email) => {
    //     return email.endsWith('@yash.com');
    // };

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

    // Function to check if user needs to complete profile (only for 'user' role)
    const needsProfileCompletion = (userData) => {
        // Only check profile completion for users with 'user' role
   
        
        // Check if user has uploaded documents based on DocumentStatus enum
        const resumeNotUpdated = !userData.resumeStatus || userData.resumeStatus === 'not_updated';
        const photoNotUpdated = !userData.photoStatus || userData.photoStatus === 'not_updated';
        
        return resumeNotUpdated || photoNotUpdated;
    };

    // Function to redirect user based on role and profile completion status
    const redirectUser = (userData) => {
        // Only check profile completion for users with 'user' role
        if (userData.role === 'user' && needsProfileCompletion(userData)) {
            navigate("/complete-profile");
            return;
        }

        if (userData.role === 'instructor' && needsProfileCompletion(userData)) {
            navigate("/complete-profile");
            return;
        }
        
        // Redirect to appropriate dashboard based on role
        if (userData.role === 'instructor') {
            navigate("/instructor-dashboard");
        } else if (userData.role === 'user') {
            navigate("/user-dashboard");
        } else {
            navigate("/manager-dashboard");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(''); // Reset login error
        setLoadRender(true);

        // // Validate email
        // if (!validateEmail(formData.emailId)) {
        //     setLoginError('Email must end with @yash.com');
        //     setLoadRender(false);
        //     return;
        // }

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
                sessionStorage.setItem('role', userData.role); // Store role separately if needed
                setLoginStatus(true);
                setLogin(true);
                
                // Redirect based on profile completion status
                redirectUser(userData);
            } else {
                setLoginError(response.data.message || "Unable to login try again");
                setFormData({ emailId: '', password: '' });
            }
        } catch (err) {
            // Set a generic error message for invalid credentials
            setLoginError(err.message); 
            setFormData({ emailId: '', password: '' });
        } finally {
            setLoadRender(false);
        }
    };

    useEffect(() => {
        const { user, token } = getUserData();
        
        if(user == null) {
            return;
        }
        
        // Check if user is already logged in and redirect accordingly
        redirectUser(user);
    }, []);

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
                        />
                        <div className={styles.forgotPassword}>
                            <button 
                                type="button" 
                                onClick={handleForgotPassword}
                                className={styles.forgotPasswordBtn}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loadRender}
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
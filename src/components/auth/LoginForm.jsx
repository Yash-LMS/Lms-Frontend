import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser  } from '../../features/auth/authActions';
import styles from './Form.module.css'; 

const LoginForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, user } = useSelector((state) => state.user);
    const [loadRender, setLoadRender] = useState(false)
    const [formData, setFormData] = useState({
        emailId: '',
        password: ''
    });

    const [loginError, setLoginError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateEmail = (email) => {
        return email.endsWith('@yash.com');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(''); // Reset login error

        // Validate email
        if (!validateEmail(formData.emailId)) {
            setLoginError('Email must end with @yash.com');
            return;
        }

        try {
            await dispatch(loginUser(formData)).unwrap(); 
        } catch (err) {
            // Set a generic error message for invalid credentials
            setLoginError(err.message); 
            setFormData ({ emailId: '', password: '' });
        }
    };

    useEffect(() => {
        if(!loading){
            setLoadRender(false)
        }
    },[loading])
    useEffect(() => {   
        if (sessionStorage.getItem('user')) {
            if (user.role === 'instructor') {
                navigate("/instructor-dashboard");
            } else if (user.role === 'user') {
                navigate("/user-dashboard");
            } else {
                navigate("/manager-dashboard"); 
            }
        }

    }, [user, navigate]); 

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}  style={{ marginTop: '110px' }}>
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
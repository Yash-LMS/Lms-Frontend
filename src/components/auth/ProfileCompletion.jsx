import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Form.module.css';
import { PROFILE_UPDATE_URL } from '../../constants/apiConstants'; // Using the same constant

const ProfileCompletion = ({ setLoginStatus }) => {
    const navigate = useNavigate();
    const [loadRender, setLoadRender] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');
    
    const [formData, setFormData] = useState({
        profilePhoto: null,
        resumeDocument: null
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

    // Check if user should be on this page
    useEffect(() => {
        const { user, token } = getUserData();
        
        if (!user || !token) {
            navigate('/login');
            return;
        }
        
        // Only allow users with 'user' role to access this page
        if (user.role !== 'user') {
            if (user.role === 'instructor') {
                navigate("/instructor-dashboard");
            } else {
                navigate("/manager-dashboard");
            }
        }
    }, []);

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            // Validate file types
            if (name === 'profilePhoto') {
                const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!validImageTypes.includes(files[0].type)) {
                    setUploadError('Please upload a valid image file (JPEG, JPG, PNG, GIF)');
                    return;
                }
                // Check file size (max 5MB)
                if (files[0].size > 5 * 1024 * 1024) {
                    setUploadError('Image file size should be less than 5MB');
                    return;
                }
            }
            
            if (name === 'resumeDocument') {
                const validDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!validDocTypes.includes(files[0].type)) {
                    setUploadError('Please upload a valid document file (PDF, DOC, DOCX)');
                    return;
                }
                // Check file size (max 10MB)
                if (files[0].size > 10 * 1024 * 1024) {
                    setUploadError('Document file size should be less than 10MB');
                    return;
                }
            }
            
            setFormData({
                ...formData,
                [name]: files[0]
            });
            setUploadError(''); // Clear any previous errors
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploadError('');
        setUploadSuccess('');
        setLoadRender(true);

        // Validate that both files are selected
        if (!formData.profilePhoto || !formData.resumeDocument) {
            setUploadError('Please select both profile photo and resume document');
            setLoadRender(false);
            return;
        }

        const { user, token } = getUserData();
        
        if (!user || !token) {
            setUploadError('Session expired. Please login again.');
            setLoadRender(false);
            return;
        }

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
            
            // Add files with the exact parameter names from your API
            uploadData.append('image', formData.profilePhoto);
            uploadData.append('resume', formData.resumeDocument);
            
            const response = await axios.post(PROFILE_UPDATE_URL, uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.response === "success") {
                // Update user data in sessionStorage
                const updatedUser = { ...user, hasProfilePhoto: true, hasResume: true };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                
                setUploadSuccess('Profile completed successfully! Redirecting...');
                
                // Redirect to user dashboard after a short delay
                setTimeout(() => {
                    navigate("/user-dashboard");
                }, 2000);
                
            } else {
                setUploadError(response.data.message || "Unable to upload files. Please try again.");
            }
        } catch (err) {
            setUploadError(err.response?.data?.message || err.message || "Upload failed. Please try again.");
        } finally {
            setLoadRender(false);
        }
    };

    const handleSkipForNow = () => {
        // Only redirect to user dashboard since this component is only for users
        navigate("/user-dashboard");
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <h2 className={styles.title}>Complete Your Profile</h2>
                <p className={styles.subtitle}>Please upload your profile photo and resume to continue</p>
                
                {uploadError && <div className={styles.errorMessage}>{uploadError}</div>}
                {uploadSuccess && <div className={styles.successMessage}>{uploadSuccess}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Profile Photo *</label>
                        <input
                            type="file"
                            name="profilePhoto"
                            accept="image/*"
                            onChange={handleFileChange}
                            className={styles.input}
                            required
                            style={{ padding: '13px' }}
                        />
                        <small className={styles.fileHint}>
                            Accepted formats: JPEG, JPG, PNG, GIF (Max size: 5MB)
                        </small>
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Resume Document *</label>
                        <input
                            type="file"
                            name="resumeDocument"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className={styles.input}
                            required
                            style={{ padding: '13px' }}
                        />
                        <small className={styles.fileHint}>
                            Accepted formats: PDF, DOC, DOCX (Max size: 10MB)
                        </small>
                    </div>
                    
                    <div className={styles.buttonGroup}>
                        <button
                            type="submit"
                            disabled={loadRender}
                            className={styles.submitButton}
                        >
                            {loadRender ? 'Uploading...' : 'Complete Profile'}
                        </button>
                        
                        {/* <button
                            type="button"
                            onClick={handleSkipForNow}
                            className={styles.skipButton}
                            disabled={loadRender}
                        >
                            Skip for Now
                        </button> */}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCompletion;
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchOfficeList } from "../../features/offices/officeAction";
import { registerUser  } from "../../features/auth/authActions";
import styles from './Form.module.css'; 
import SuccessModal from '../../assets/SuccessModal';

const RegisterForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.offices);
    const officeList = useSelector((state) => state.offices.officeList);
    
    const [formData, setFormData] = useState({
        emailId: "",
        password: "",
        firstName: "",
        lastName: "",
        mobileNo: "",
        officeId: "", 
    });

    const [successMessage, setSuccessMessage] = useState("");
    const [formError, setFormError] = useState({});
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false); 

    useEffect(() => {
        dispatch(fetchOfficeList());
    }, [dispatch]);

    // Removed the problematic useEffect that was setting errors for officeId

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Validate the field immediately
        validateField(name, value);
    };

    const validateField = (name, value) => {
        let errorMessage = "";

        if (name === "emailId") {
            if (!validateEmail(value)) {
                errorMessage = "Email must be in the format: example@yash.com";
            }
        } else if (name === "password") {
            if (!validatePassword(value)) {
                errorMessage = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
            }
        } else if (name === "firstName") {
            if (!validateName(value)) {
                errorMessage = "First Name must start with a capital letter.";
            }
        } else if (name === "lastName") {
            if (!validateName(value)) {
                errorMessage = "Last Name must start with a capital letter.";
            }
        } else if (name === "mobileNo") {
            if (!validatePhoneNumber(value)) {
                errorMessage = "Phone Number must be exactly 10 digits.";
            }
        } else if (name === "officeId") {
            if (!value) {
                errorMessage = "Please select an office.";
            }
        }

        setFormError((prevErrors) => ({
            ...prevErrors,
            [name]: errorMessage,
        }));
    };

    const validateEmail = (emailId) => {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@yash\.com$/;
        return emailPattern.test(emailId);
    };

    const validatePassword = (password) => {
        const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/;
        return passwordPattern.test(password);
    };

    const validateName = (name) => {
        return name.charAt(0) === name.charAt(0).toUpperCase();
    };

    const validatePhoneNumber = (mobileNo) => {
        const phonePattern = /^\d{10}$/; // 10 digits
        return phonePattern.test(mobileNo);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingSubmit(true);
        setSuccessMessage("");

        const errors = {};
        Object.keys(formData).forEach((key) => {
            validateField(key, formData[key]);
            if (!formData[key]) {
                errors[key] = "This field is required.";
            }
        });

        // Check if there are any current validation errors
        const currentErrors = { ...formError };
        delete currentErrors.general; // Remove general errors
        
        // Check if form has errors (either from existing formError or new errors)
        if (Object.values(currentErrors).some(error => error !== "") || Object.keys(errors).length > 0) {
            setFormError(prev => ({ ...prev, ...errors }));
            setLoadingSubmit(false);
            return;
        }

        try {
            await dispatch(registerUser(formData));
            setSuccessMessage("User registered successfully! Please contact admin for account activation.");
            setShowSuccessModal(true);
            setFormData({
                emailId: "",
                password: "",
                firstName: "",
                lastName: "",
                mobileNo: "",
                officeId: "", 
            });
            // Clear errors after successful submission
            setFormError({});
        } catch (err) {
            setFormError({ general: err.message });
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false); 
    };

    // Calculate if the office list has no options available
    const noOfficesAvailable = !loading && (!officeList || officeList.length === 0);

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <h2 className={styles.title}>Register</h2>
                {formError.general && <div className={styles.errorMessage}>{formError.general}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="First Name"
                        />
                        {formError.firstName && <div className={styles.errorMessage}>{formError.firstName}</div>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={styles.input} 
                            placeholder="Last Name"
                        />
                        {formError.lastName && <div className={styles.errorMessage}>{formError.lastName}</div>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            name="emailId"
                            value={formData.emailId}
                            onChange={handleChange}
                            className={styles.input} 
                            placeholder="Email"
                        />
                        {formError.emailId && <div className={styles.errorMessage}>{formError.emailId}</div>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="Password"
                        />
                        {formError.password && <div className={styles.errorMessage}>{formError.password}</div>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Phone Number</label>
                        <input
                            type="tel"
                            name="mobileNo"
                            value={formData.mobileNo}
                            onChange={handleChange}
                            className={styles.input} 
                            placeholder="Phone Number"
                        />
                        {formError.mobileNo && <div className={styles.errorMessage}>{formError.mobileNo}</div>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Office</label>
                        <select
                            name="officeId"
                            value={formData.officeId || ""}
                            onChange={handleChange}
                            className={styles.input}
                            style={{ height: '40px', width: '100%' }}
                        >
                            <option value="">Select Office</option>
                            {loading ? (
                                <option>Loading...</option>
                            ) : officeList && officeList.length > 0 ? (
                                officeList.map((office) => (
                                    <option key={office.officeId} value={office.officeId}>
                                        {office.officeName}
                                    </option>
                                ))
                            ) : (
                                <option disabled>No offices available</option>
                            )}
                        </select>
                        {formError.officeId && <div className={styles.errorMessage}>{formError.officeId}</div>}
                        {noOfficesAvailable && <div className={styles.errorMessage}>No offices available. Please contact administrator.</div>}
                    </div>

                    <button
                        type="submit"
                        disabled={loadingSubmit || noOfficesAvailable}
                        className={styles.submitButton} 
                    >
                        {loadingSubmit ? "Loading..." : "Register"}
                    </button>
                </form>
            </div>

            {showSuccessModal && (
                <SuccessModal 
                    message={successMessage}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default RegisterForm;
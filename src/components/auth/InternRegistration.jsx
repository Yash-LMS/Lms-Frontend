import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './InternRegistration.module.css';
import { OFFICE_LIST_URL, REGISTER_INTERN_URL, INTERNSHIP_PROGRAM_LIST } from '../../constants/apiConstants';
import SuccessModal from '../../assets/SuccessModal';

const InternRegistration = () => {
  const [formData, setFormData] = useState({
    emailId: '',
    firstName: '',
    lastName: '',
    password: '',
    officeId: '',
    internshipProgram: '',
    contactNo: '',
    address: '',
    yearOfPassing: '',
    stream: '',
    institution: '',
    startDate: '',
    endDate: ''
  });

  const [offices, setOffices] = useState([]);
  const [internshipPrograms, setInternshipPrograms] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Generate year of passing options (from 2020 to 5 years ahead)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2020 + 6 }, (_, i) => 2020 + i);

  useEffect(() => {
    // Fetch office list and internship programs when component mounts
    fetchOfficeList();
    fetchInternshipPrograms();
  }, []);

  const fetchOfficeList = async () => {
    try {
      const response = await axios.get(`${OFFICE_LIST_URL}`);
      if (response.data && response.data.payload) {
        setOffices(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching office list:', error);
    }
  };
  
  const fetchInternshipPrograms = async () => {
    try {
      const response = await axios.get(`${INTERNSHIP_PROGRAM_LIST}`);
      if (response.data && response.data.payload) {
        setInternshipPrograms(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching internship programs:', error);
    }
  };
  
  // Validation functions
  const validateEmail = (email) => {
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailPattern.test(email);
  };
  
  const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/;
    return passwordPattern.test(password);
  };

  const validateName = (name) => {
    if (!name.trim()) return false;
    return name.charAt(0) === name.charAt(0).toUpperCase();
  };

  const validatePhoneNumber = (phone) => {
    const phonePattern = /^\d{10}$/; // 10 digits
    return phonePattern.test(phone);
  };
  
  const validateAddress = (address) => {
    return address.trim().length >= 10; // Minimum 10 characters
  };
  
  const validateInstitution = (institution) => {
    return institution.trim().length >= 3; // Minimum 3 characters
  };
  
  const validateStream = (stream) => {
    return stream.trim().length >= 2; // Minimum 2 characters
  };
  
  const validateDates = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // End date must be after start date and internship duration should be at least 30 days
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    return end > start && daysDiff >= 30;
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.emailId) {
      newErrors.emailId = 'Email is required';
    } else if (!validateEmail(formData.emailId)) {
      newErrors.emailId = 'Invalid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and special character';
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = 'First name must start with a capital letter';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Last name must start with a capital letter';
    }

    // Office validation
    if (!formData.officeId) {
      newErrors.officeId = 'Please select an office';
    }

    // Internship program validation
    if (!formData.internshipProgram) {
      newErrors.internshipProgram = 'Please select an internship program';
    }

    // Contact number validation
    if (!formData.contactNo) {
      newErrors.contactNo = 'Contact number is required';
    } else if (!validatePhoneNumber(formData.contactNo)) {
      newErrors.contactNo = 'Contact number must be 10 digits';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (!validateAddress(formData.address)) {
      newErrors.address = 'Address must be at least 10 characters';
    }

    // Year of passing validation
    if (!formData.yearOfPassing) {
      newErrors.yearOfPassing = 'Year of passing is required';
    }

    // Stream validation
    if (!formData.stream.trim()) {
      newErrors.stream = 'Stream is required';
    } else if (!validateStream(formData.stream)) {
      newErrors.stream = 'Stream must be at least 2 characters';
    }

    // Institution validation
    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution is required';
    } else if (!validateInstitution(formData.institution)) {
      newErrors.institution = 'Institution must be at least 3 characters';
    }

    // Date validations
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && !validateDates(formData.startDate, formData.endDate)) {
      newErrors.endDate = 'End date must be at least 30 days after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear the specific error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const response = await axios.post(`${REGISTER_INTERN_URL}`, formData);
       
        if(response.data.response === "success") {
          setSuccessMessage(response.data.message || 'Registration successful! Your internship application has been submitted.');
          setShowSuccessModal(true);
          
          // Reset form after successful submission
          setFormData({
            emailId: '',
            firstName: '',
            lastName: '',
            password: '',
            officeId: '',
            internshipProgram: '',
            contactNo: '',
            address: '',
            yearOfPassing: '',
            stream: '',
            institution: '',
            startDate: '',
            endDate: ''
          });
        } else {
          setErrorMessage(response.data.message || 'Registration failed. Please try again.');
        }
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Registration failed. Please try again later.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Intern Registration</h1>
      
      {errorMessage && (
        <div className={`${styles.message} ${styles.error}`}>
          {errorMessage}
        </div>
      )}
      
      {showSuccessModal && (
        <SuccessModal 
          message={successMessage}
          onClose={handleCloseSuccessModal}
        />
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Personal Information */}
          <div className={styles.formGroup}>
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              className={errors.firstName ? styles.inputError : ''}
            />
            {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              className={errors.lastName ? styles.inputError : ''}
            />
            {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="emailId">Email Address *</label>
            <input
              type="email"
              id="emailId"
              name="emailId"
              value={formData.emailId}
              onChange={handleChange}
              placeholder="example@email.com"
              className={errors.emailId ? styles.inputError : ''}
            />
            {errors.emailId && <span className={styles.error}>{errors.emailId}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters with uppercase, lowercase and special character"
              className={errors.password ? styles.inputError : ''}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="contactNo">Contact Number *</label>
            <input
              type="tel"
              id="contactNo"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleChange}
              placeholder="10-digit number (e.g. 1234567890)"
              className={errors.contactNo ? styles.inputError : ''}
            />
            {errors.contactNo && <span className={styles.error}>{errors.contactNo}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address">Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your full address"
              className={errors.address ? styles.inputError : ''}
            />
            {errors.address && <span className={styles.error}>{errors.address}</span>}
          </div>

          {/* Educational Information */}
          <div className={styles.formGroup}>
            <label htmlFor="institution">Institution *</label>
            <input
              type="text"
              id="institution"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="Your college or university name"
              className={errors.institution ? styles.inputError : ''}
            />
            {errors.institution && <span className={styles.error}>{errors.institution}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stream">Stream *</label>
            <input
              type="text"
              id="stream"
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              placeholder="e.g. Computer Science, Electronics"
              className={errors.stream ? styles.inputError : ''}
            />
            {errors.stream && <span className={styles.error}>{errors.stream}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="yearOfPassing">Year of Passing *</label>
            <select
              id="yearOfPassing"
              name="yearOfPassing"
              value={formData.yearOfPassing}
              onChange={handleChange}
              className={errors.yearOfPassing ? styles.inputError : ''}
            >
              <option value="">Select Year of Graduation</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.yearOfPassing && <span className={styles.error}>{errors.yearOfPassing}</span>}
          </div>

          {/* Internship Details */}
          <div className={styles.formGroup}>
            <label htmlFor="officeId">Office *</label>
            <select
              id="officeId"
              name="officeId"
              value={formData.officeId}
              onChange={handleChange}
              className={errors.officeId ? styles.inputError : ''}
            >
              <option value="">Select Office Location</option>
              {offices.map((office) => (
                <option key={office.officeId} value={office.officeId}>
                  {office.officeName} - {office.city}
                </option>
              ))}
            </select>
            {errors.officeId && <span className={styles.error}>{errors.officeId}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="internshipProgram">Internship Program *</label>
            <select
              id="internshipProgram"
              name="internshipProgram"
              value={formData.internshipProgram}
              onChange={handleChange}
              className={errors.internshipProgram ? styles.inputError : ''}
            >
              <option value="">Select Programming Language</option>
              {internshipPrograms.map((program) => (
                <option key={program.id} value={program.description}>
                  {program.description}
                </option>
              ))}
            </select>
            {errors.internshipProgram && <span className={styles.error}>{errors.internshipProgram}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="startDate">Start Date *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]} // Cannot select past dates
              className={errors.startDate ? styles.inputError : ''}
            />
            {errors.startDate && <span className={styles.error}>{errors.startDate}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate">End Date *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate || new Date().toISOString().split('T')[0]} // Cannot be before start date
              className={errors.endDate ? styles.inputError : ''}
            />
            {errors.endDate && <span className={styles.error}>{errors.endDate}</span>}
          </div>
        </div>
        
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InternRegistration;
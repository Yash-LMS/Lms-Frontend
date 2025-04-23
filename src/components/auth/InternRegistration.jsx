// InternRegistration.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './InternRegistration.module.css';
import { OFFICE_LIST_URL, INTERNSHIP_PROGRAM_LIST, REGISTER_INTERN_URL } from '../../constants/apiConstants';


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
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Fetch office list and internship programs when component mounts
    fetchOfficeList();
    fetchInternshipPrograms();
  }, []);

  const fetchOfficeList = async () => {
    try {
      const response = await axios.get(`${OFFICE_LIST_URL}`);
      if (response.data && response.data.payload) {  // Change from data.data to data.payload
        setOffices(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching office list:', error);
    }
  };
  
  const fetchInternshipPrograms = async () => {
    try {
      const response = await axios.get(`${INTERNSHIP_PROGRAM_LIST}`);
      if (response.data && response.data.payload) {  // Change from data.data to data.payload
        setInternshipPrograms(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching internship programs:', error);
    }
  };
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.emailId) {
      newErrors.emailId = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.emailId)) {
      newErrors.emailId = 'Invalid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and special character';
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
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
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Year of passing validation
    if (!formData.yearOfPassing) {
      newErrors.yearOfPassing = 'Year of passing is required';
    }

    // Stream validation
    if (!formData.stream.trim()) {
      newErrors.stream = 'Stream is required';
    }

    // Institution validation
    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution is required';
    }

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    // End date validation
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const response = await axios.post(`${REGISTER_INTERN_URL}`, formData);
       
        if(response.data.response==="success")
        {
        setSubmitMessage({
          type: 'success',
          text: response.data.message
        });
    }else{

        setSubmitMessage({
            type: 'error',
            text: response.data.message
          });
    }
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
      } catch (error) {
        setSubmitMessage({
          type: 'error',
          text: error.response?.data?.message || 'Registration failed. Please try again later.'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Intern Registration</h1>
      
      {submitMessage.text && (
        <div className={`${styles.message} ${styles[submitMessage.type]}`}>
          {submitMessage.text}
        </div>
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
              className={errors.stream ? styles.inputError : ''}
            />
            {errors.stream && <span className={styles.error}>{errors.stream}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="yearOfPassing">Year of Passing *</label>
            <input
              type="text"
              id="yearOfPassing"
              name="yearOfPassing"
              value={formData.yearOfPassing}
              onChange={handleChange}
              className={errors.yearOfPassing ? styles.inputError : ''}
            />
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
              <option value="">Select Office</option>
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
              <option value="">Select Program</option>
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
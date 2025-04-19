import { useState } from 'react';
import styles from './AddOffice.module.css';
import { ADD_OFFICE_URL } from '../../constants/apiConstants';
import axios from 'axios';

const AddOffice = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [office, setOffice] = useState({
    officeId: '',
    officeName: '',
    address: '',
    city: ''
  });
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setOffice({ officeId: '', officeName: '', address: '', city: '' });
    setErrors({});
    setSubmitMessage({ type: '', message: '' });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOffice({ ...office, [name]: value });
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateOfficeData = () => {
    const newErrors = {};
    const { officeId, officeName, address, city } = office;

    if (!officeId || officeId.trim() === '') {
      newErrors.officeId = 'Office ID is required';
    } else if (officeId.includes(' ')) {
      newErrors.officeId = 'Office ID should not contain spaces';
    }

    if (!officeName || officeName.trim() === '') {
      newErrors.officeName = 'Office Name is required';
    }

    if (!address || address.trim() === '') {
      newErrors.address = 'Address is required';
    }

    if (!city || city.trim() === '') {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const { user, token } = getUserData();
    
    if (!user || !token) {
      setSubmitMessage({ type: 'error', message: 'You must be logged in to add an office' });
      return;
    }

    if (!validateOfficeData()) {
      return;
    }
  
    setIsLoading(true);
    try {
      const payload = {
        user,
        token,
        office: office
      };
  
      const response = await axios.post(`${ADD_OFFICE_URL}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data.response === 'success') {
        setSubmitMessage({ type: 'success', message: response.data.message || 'Office added successfully!' });
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        // Handle specific error cases if API returns them
        if (response.data.error === 'office_exists') {
          setSubmitMessage({ type: 'error', message: 'An office with this ID already exists.' });
        } else {
          setSubmitMessage({ type: 'error', message: response.data.message || 'Failed to add office.' });
        }
      }
    } catch (error) {
      console.error('Error adding office:', error);
      
      // Handle specific HTTP error codes
      if (error.response) {
        if (error.response.status === 409) {
          setSubmitMessage({ type: 'error', message: 'This office already exists in the system.' });
        } else if (error.response.status === 401 || error.response.status === 403) {
          setSubmitMessage({ type: 'error', message: 'You are not authorized to add offices.' });
        } else {
          setSubmitMessage({ type: 'error', message: error.response.data?.message || 'Server error. Please try again.' });
        }
      } else if (error.request) {
        // The request was made but no response was received
        setSubmitMessage({ type: 'error', message: 'No response from server. Please check your connection.' });
      } else {
        // Something happened in setting up the request
        setSubmitMessage({ type: 'error', message: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.addButton} 
        onClick={openModal}
      >
        Add Office
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Add New Office</h2>
              <button className={styles.closeButton} onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {submitMessage.message && (
                <div className={`${styles.message} ${styles[submitMessage.type]}`}>
                  {submitMessage.message}
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label htmlFor="officeId">Office ID *</label>
                <input
                  type="text"
                  id="officeId"
                  name="officeId"
                  value={office.officeId}
                  onChange={handleChange}
                  placeholder='Enter Office ID'
                  required
                  className={errors.officeId ? styles.inputError : ''}
                  disabled={isLoading}
                />
                {errors.officeId && <span className={styles.errorText}>{errors.officeId}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="officeName">Office Name *</label>
                <input
                  type="text"
                  id="officeName"
                  name="officeName"
                  value={office.officeName}
                  onChange={handleChange}
                  placeholder='Enter Office Name'
                  required
                  className={errors.officeName ? styles.inputError : ''}
                  disabled={isLoading}
                />
                {errors.officeName && <span className={styles.errorText}>{errors.officeName}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="address">Address *</label>
                <textarea
                  id="address"
                  name="address"
                  value={office.address}
                  onChange={handleChange}
                  placeholder='Enter Address'
                  required
                  className={errors.address ? styles.inputError : ''}
                  disabled={isLoading}
                />
                {errors.address && <span className={styles.errorText}>{errors.address}</span>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={office.city}
                  onChange={handleChange}
                  placeholder='Enter City'  
                  required
                  className={errors.city ? styles.inputError : ''}
                  disabled={isLoading}
                />
                {errors.city && <span className={styles.errorText}>{errors.city}</span>}
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={closeModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOffice;
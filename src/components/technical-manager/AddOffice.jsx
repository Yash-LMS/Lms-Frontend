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
  

    const{user,token}=getUserData();

    if (!validateOfficeData()) {
      return;
    }
  
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
        setSubmitMessage({ type: 'error', message: response.data.message || 'Failed to add office.' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', message: 'An error occurred. Please try again.' });
      console.error('Error adding office:', error);
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
                  className={errors.officeId ? styles.inputError : ''}
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
                  className={errors.officeName ? styles.inputError : ''}
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
                  className={errors.address ? styles.inputError : ''}
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
                  className={errors.city ? styles.inputError : ''}
                />
                {errors.city && <span className={styles.errorText}>{errors.city}</span>}
              </div>
              
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelButton} onClick={closeModal}>
                  Cancel
                </button>
                <button onClick={handleSubmit} className={styles.submitButton}>
                  Add Office
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
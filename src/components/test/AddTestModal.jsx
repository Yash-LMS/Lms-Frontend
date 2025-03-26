import React, { useState } from 'react';
import styles from './AddTestModal.module.css';

const AddTestModal = ({ isOpen, onClose, onSubmit }) => {
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState('');
  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null;

  const validateForm = () => {
    const errors = {};
    
    if (!testName.trim()) {
      errors.testName = 'Test name is required';
    }
    
    if (!duration) {
      errors.duration = 'Duration is required';
    } else if (isNaN(duration) || parseFloat(duration) <= 0) {
      errors.duration = 'Duration must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
        e.preventDefault();
        const testName = e.target.testName.value;
        const duration = e.target.duration.value;
        onSubmit(testName, duration);
      
      // Reset form
      setTestName('');
      setDuration('');
      setFormErrors({});
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Create New Test</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="testName">Test Name</label>
            <input
              type="text"
              id="testName"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className={formErrors.testName ? styles.inputError : ''}
              placeholder='Enter Test Name'
            />
            {formErrors.testName && <span className={styles.errorMessage}>{formErrors.testName}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="duration">Duration (minutes)</label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              step="0.5"
              className={formErrors.duration ? styles.inputError : ''}
              placeholder='Enter Duration'
            />
            {formErrors.duration && <span className={styles.errorMessage}>{formErrors.duration}</span>}
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
            >
              Create Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTestModal;
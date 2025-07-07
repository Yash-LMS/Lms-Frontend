import React, { useState } from 'react';
import styles from './InstructorDashboard.module.css';

const AddAssignmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    description: '',
    startDate: '',
    endDate: '',
    totalMarks: ''
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Assignment description is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (!formData.totalMarks) {
      newErrors.totalMarks = 'Total marks is required';
    } else if (isNaN(formData.totalMarks) || parseInt(formData.totalMarks) <= 0) {
      newErrors.totalMarks = 'Total marks must be a positive number';
    }

    // Check if end date is after start date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    // Check if start date is not in the past
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to beginning of day
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const assignmentData = {
      description: formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      totalMarks: parseInt(formData.totalMarks)
    };
    
    console.log("Assignment data being submitted:", assignmentData);
    
    onSubmit(assignmentData);
    
    // Reset form
    setFormData({
      description: '',
      startDate: '',
      endDate: '',
      totalMarks: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      description: '',
      startDate: '',
      endDate: '',
      totalMarks: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>Create New Assignment</h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
          >
            ×
          </button>
        </header>
        
        <form className={styles.courseForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="description">Description *</label>
            <textarea 
              id="description" 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter assignment description"
              className={`${styles.formInput} ${errors.description ? styles.errorInput : ''}`}
              rows="4"
              required
            />
            {errors.description && <span className={styles.errorText}>{errors.description}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="startDate">Start Date *</label>
            <input 
              type="date" 
              id="startDate" 
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={`${styles.formInput} ${errors.startDate ? styles.errorInput : ''}`}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
              required
            />
            {errors.startDate && <span className={styles.errorText}>{errors.startDate}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate">End Date *</label>
            <input 
              type="date" 
              id="endDate" 
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={`${styles.formInput} ${errors.endDate ? styles.errorInput : ''}`}
              min={formData.startDate || new Date().toISOString().split('T')[0]} // End date should be after start date
              required
            />
            {errors.endDate && <span className={styles.errorText}>{errors.endDate}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="totalMarks">Total Marks *</label>
            <input 
              type="number" 
              id="totalMarks" 
              name="totalMarks"
              value={formData.totalMarks}
              onChange={handleInputChange}
              placeholder="Enter total marks"
              className={`${styles.formInput} ${errors.totalMarks ? styles.errorInput : ''}`}
              min="1"
              max="1000"
              required
            />
            {errors.totalMarks && <span className={styles.errorText}>{errors.totalMarks}</span>}
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelBtn}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Create Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssignmentModal;
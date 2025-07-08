import React, { useState } from 'react';
import styles from './InstructorDashboard.module.css';

const AddAssignmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
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

    if (!formData.title.trim()) {
      newErrors.title = 'Assignment title is required';
    }

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const assignmentData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      startDate: formData.startDate, // Keep as string, will be converted in parent component
      endDate: formData.endDate, // Keep as string, will be converted in parent component
      totalMarks: parseInt(formData.totalMarks)
    };
    
    console.log("Assignment data being submitted:", assignmentData);
    
    onSubmit(assignmentData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      totalMarks: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      title: '',
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
            <label htmlFor="title">Assignment Title *</label>
            <input 
              type="text" 
              id="title" 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter assignment title"
              className={`${styles.formInput} ${errors.title ? styles.errorInput : ''}`}
              required
            />
            {errors.title && <span className={styles.errorText}>{errors.title}</span>}
          </div>

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
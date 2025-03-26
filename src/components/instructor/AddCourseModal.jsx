import React from 'react';
import styles from './InstructorDashboard.module.css';

const AddCourseModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const courseName = e.target.courseName.value;
    const totalHours = e.target.totalHours.value;
    const description = e.target.description.value;
    const imageFile = e.target.imageFile.files[0];
    
    const course = {
      courseName,
      totalHours,
      description
    };
    
    onSubmit(course, imageFile);
  };
  

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>Create New Course</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        
        <form className={styles.courseForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="courseName">Course Name</label>
            <input 
              type="text" 
              id="courseName" 
              placeholder="Enter course name"
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="totalHours">Total Hours</label>
            <input 
              type="number" 
              id="totalHours" 
              placeholder="Enter total hours"
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea  
              id="description" 
              placeholder="Enter Short Description"
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="imageFile">Upload Image</label>
            <input 
              type="file" 
              id="imageFile" 
              className={styles.formInput}
              accept="image/*"
              required
            />
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Create Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourseModal;
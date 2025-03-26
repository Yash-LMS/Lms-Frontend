import React, { useEffect } from 'react';
import styles from './InstructorDashboard.module.css';

const EditCourseModal = ({ isOpen, onClose, onSubmit, course }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const courseName = e.target.courseName.value;
    const totalHours = e.target.totalHours.value;
    const description = e.target.description.value;
    const courseCompletionStatus = e.target.courseCompletionStatus.value;
    
    // Include courseCompletionStatus in the data passed to onSubmit
    onSubmit({ 
      courseId: course.courseId, 
      courseName, 
      totalHours, 
      description,
      courseCompletionStatus 
    });
  };

  useEffect(() => {
    if (course) {
      // Populate the form with existing course data if editing
      document.getElementById('courseName').value = course.courseName;
      document.getElementById('totalHours').value = course.totalHours;
      document.getElementById('description').value = course.description;
      
      // Set the courseCompletionStatus dropdown to the current value
      if (document.getElementById('courseCompletionStatus')) {
        document.getElementById('courseCompletionStatus').value = course.courseCompletionStatus || 'DRAFT';
      }
    }
  }, [course]);

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>Edit Course</h2>
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

          {/* New field for Course Completion Status */}
          <div className={styles.formGroup}>
            <label htmlFor="courseCompletionStatus">Course Status</label>
            <select
              id="courseCompletionStatus"
              name="courseCompletionStatus"
              className={styles.formInput}
              required
            >
              <option value="DRAFT">Draft</option>
              <option value="INPROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
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
              Update Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourseModal;
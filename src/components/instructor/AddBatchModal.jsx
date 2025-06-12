import React from 'react';
import styles from './InstructorDashboard.module.css';

const AddBatchModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const batchName = e.target.batchName.value;
    
    const batch = {
      batchName
    };
    
    onSubmit({batch});
  };
  

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>Create New Batch</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        
        <form className={styles.courseForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="batchName">Batch Name</label>
            <input 
              type="text" 
              id="batchName" 
              placeholder="Enter batch name"
              className={styles.formInput}
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
              Create Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatchModal;
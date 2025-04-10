import React, { useState } from "react";
import styles from "./Popup.module.css";

const CategoryPopup = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add API call here to save category data
    console.log("Category data:", { category, subCategory });
    // Reset form
    setCategory("");
    setSubCategory("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContainer}>
        <div className={styles.popupHeader}>
          <h2>Add Questions Category</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.popupForm}>
          <div className={styles.formGroup}>
            <label htmlFor="category">Category:</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className={styles.formControl}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="subCategory">Sub-Category:</label>
            <input
              type="text"
              id="subCategory"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              required
              className={styles.formControl}
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryPopup;
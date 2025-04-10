import React, { useState } from "react";
import styles from "./Popup.module.css";

const OfficePopup = ({ isOpen, onClose }) => {
  const [officeName, setOfficeName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add API call here to save office data
    console.log("Office data:", { officeName, address, city });
    // Reset form
    setOfficeName("");
    setAddress("");
    setCity("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContainer}>
        <div className={styles.popupHeader}>
          <h2>Add Office</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.popupForm}>
          <div className={styles.formGroup}>
            <label htmlFor="officeName">Office Name:</label>
            <input
              type="text"
              id="officeName"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              required
              className={styles.formControl}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="address">Address:</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className={styles.formControl}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="city">City:</label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
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

export default OfficePopup;
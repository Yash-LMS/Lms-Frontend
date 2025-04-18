import React, { useState } from "react";
import styles from "./ShowScoresConfirmation.module.css";

const ShowScoresConfirmation = ({ onConfirm, onCancel }) => {
  const [showScores, setShowScores] = useState(false);
  const [showDetailedScores, setShowDetailedScores] = useState(false);

  const handleConfirm = () => {
    onConfirm({
      showScores,
      showDetailedScores
    });
  };

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.confirmationDialog}>
        <div className={styles.confirmationHeader}>
          <h2>Confirm Test Allotment</h2>
        </div>
        <div className={styles.confirmationContent}>
          <p>You are about to save test allotment changes. Please confirm the following options:</p>
          
          <div className={styles.optionContainer}>
            <div className={styles.optionItem}>
              <label htmlFor="showScores" className={styles.optionLabel}>
                <input
                  type="checkbox"
                  id="showScores"
                  checked={showScores}
                  onChange={() => setShowScores(!showScores)}
                  className={styles.checkbox}
                />
                <span className={styles.optionText}>Show test scores to user</span>
              </label>
            </div>
            
            <div className={styles.optionItem}>
              <label htmlFor="showDetailedScores" className={styles.optionLabel}>
                <input
                  type="checkbox"
                  id="showDetailedScores"
                  checked={showDetailedScores}
                  onChange={() => setShowDetailedScores(!showDetailedScores)}
                  className={styles.checkbox}
                />
                <span className={styles.optionText}>Show detailed test scores to user</span>
              </label>
            </div>
          </div>
        </div>
        <div className={styles.confirmationActions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmButton} onClick={handleConfirm}>
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowScoresConfirmation;
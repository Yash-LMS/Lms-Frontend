import React, { useState, useEffect } from "react";
import styles from "./SectionReorderModal.module.css";

const SectionReorderModal = ({
  sections,
  isEditMode,
  toggleEditMode,
  onSaveChanges,
  expandedSections,
  toggleSection,
  handleEditSection,
}) => {
  const [orderedSections, setOrderedSections] = useState([]);

  useEffect(() => {
    // Initialize with sections sorted by sequenceId
    const sortedSections = [...sections].sort(
      (a, b) => a.sequenceId - b.sequenceId
    );
    setOrderedSections(sortedSections);
  }, [sections]);

  const handleMoveSection = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === orderedSections.length - 1)
    ) {
      return; // Can't move further up/down
    }

    const items = Array.from(orderedSections);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap the items
    const temp = items[index];
    items[index] = items[newIndex];
    items[newIndex] = temp;

    // Update sequenceIds to match new order
    const updatedItems = items.map((item, idx) => ({
      ...item,
      sequenceId: idx + 1, // Start from 1
    }));

    setOrderedSections(updatedItems);
  };

  const handleSave = () => {
    onSaveChanges(orderedSections);
  };

  // If not in edit mode, don't render anything
  if (!isEditMode) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.reorderHeader}>
          <h3>Reorder Sections</h3>
          <div className={styles.buttonGroup}>
            <button
              className={styles.cancelButton}
              onClick={toggleEditMode}
            >
              Cancel
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </div>

        <p className={styles.instructions}>
          Use the up and down arrows to reorder sections. Click "Save Changes" when finished.
        </p>

        <div className={styles.sectionsDropArea}>
          {orderedSections.map((section, index) => (
            <div
              key={section.sectionId.toString()}
              className={styles.draggableSectionCard}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionInfo}>
                  <span className={styles.sectionSequence}>
                    {section.sequenceId}.
                  </span>
                  <h3 className={styles.sectionTitle}>{section.title}</h3>
                </div>
                <div className={styles.sectionActions}>
                  <div className={styles.moveButtons}>
                    <button
                      className={styles.moveBtn}
                      onClick={() => handleMoveSection(index, "up")}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      className={styles.moveBtn}
                      onClick={() => handleMoveSection(index, "down")}
                      disabled={index === orderedSections.length - 1}
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
               
                </div>
              </div>

              {expandedSections[section.sectionId] && section.topics && (
                <div className={styles.topicsPreview}>
                  <p className={styles.topicsCount}>
                    {section.topics.length} topic(s)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionReorderModal;
import React, { useState, useEffect } from "react";
import styles from "./TopicReorderModal.module.css";

const TopicReorderModal = ({
  topics,
  sectionId,
  isEditMode,
  toggleEditMode,
  onSaveChanges,
}) => {
  const [orderedTopics, setOrderedTopics] = useState([]);

  useEffect(() => {
    // Initialize with topics sorted by topicsSequenceId
    const sortedTopics = [...topics].sort(
      (a, b) => a.topicsSequenceId - b.topicsSequenceId
    );
    setOrderedTopics(sortedTopics);
  }, [topics]);

  const handleMoveTopic = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === orderedTopics.length - 1)
    ) {
      return; // Can't move further up/down
    }

    const items = Array.from(orderedTopics);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap the items
    const temp = items[index];
    items[index] = items[newIndex];
    items[newIndex] = temp;

    // Update topicsSequenceId to match new order - create new objects to avoid read-only issues
    const updatedItems = items.map((item, idx) => ({
      ...item,
      topicsSequenceId: idx + 1, // Start from 1
    }));

    setOrderedTopics(updatedItems);
  };

  const handleSave = () => {
    onSaveChanges(orderedTopics, sectionId);
  };

  const handleCancel = () => {
    toggleEditMode(sectionId);
  };

  // If not in edit mode, don't render anything
  if (!isEditMode) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.reorderHeader}>
          <h3>Reorder Topics</h3>
          <div className={styles.buttonGroup}>
            <button
              className={styles.cancelButton}
              onClick={handleCancel}
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
          Use the up and down arrows to reorder topics. Click "Save Changes" when finished.
        </p>

        <div className={styles.topicsDropArea}>
          {orderedTopics.map((topic, index) => (
            <div
              key={topic.topicId.toString()}
              className={styles.draggableTopicCard}
            >
              <div className={styles.topicHeader}>
                <div className={styles.topicInfo}>
                  <span className={styles.topicSequence}>
                    {topic.topicsSequenceId}.
                  </span>
                  <h4 className={styles.topicTitle}>{topic.topicName}</h4>
                  <span className={`${styles.topicType} ${styles[topic.topicType?.toLowerCase()]}`}>
                    {topic.topicType}
                  </span>
                </div>
                <div className={styles.topicActions}>
                  <div className={styles.moveButtons}>
                    <button
                      onClick={() => handleMoveTopic(index, "up")}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveTopic(index, "down")}
                      disabled={index === orderedTopics.length - 1}
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicReorderModal;
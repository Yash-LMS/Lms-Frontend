import React, { useState, useEffect } from 'react';
import styles from './TopicReorderModal.module.css';

const TopicReorderModal = ({ 
  topics, 
  sectionId, 
  isEditMode, 
  toggleEditMode, 
  onSaveChanges 
}) => {
  const [reorderedTopics, setReorderedTopics] = useState([]);

  useEffect(() => {
    if (topics) {
      // Initialize with sorted topics
      const sortedTopics = [...topics].sort((a, b) => a.topicsSequenceId - b.topicsSequenceId);
      setReorderedTopics(sortedTopics);
    }
  }, [topics]);

  const moveTopicUp = (index) => {
    if (index > 0) {
      const newTopics = [...reorderedTopics];
      [newTopics[index], newTopics[index - 1]] = [newTopics[index - 1], newTopics[index]];
      
      // Update sequence IDs
      newTopics.forEach((topic, idx) => {
        topic.topicsSequenceId = idx + 1;
      });
      
      setReorderedTopics(newTopics);
    }
  };

  const moveTopicDown = (index) => {
    if (index < reorderedTopics.length - 1) {
      const newTopics = [...reorderedTopics];
      [newTopics[index], newTopics[index + 1]] = [newTopics[index + 1], newTopics[index]];
      
      // Update sequence IDs
      newTopics.forEach((topic, idx) => {
        topic.topicsSequenceId = idx + 1;
      });
      
      setReorderedTopics(newTopics);
    }
  };

  const handleSave = () => {
    onSaveChanges(reorderedTopics, sectionId);
  };

  const handleCancel = () => {
    toggleEditMode(sectionId);
  };

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

        <div className={styles.instructions}>
          Use the up/down arrows to reorder topics. Changes will be saved when you click "Save Changes".
        </div>

        <div className={styles.topicsDropArea}>
          {reorderedTopics.map((topic, index) => (
            <div key={topic.topicId} className={styles.draggableTopicCard}>
              <div className={styles.topicHeader}>
                <div className={styles.topicInfo}>
                  <span className={styles.topicSequence}>
                    {topic.topicsSequenceId}.
                  </span>
                  <h4 className={styles.topicTitle}>{topic.topicName}</h4>
                  <span className={`${styles.topicType} ${styles[topic.topicType]}`}>
                    {topic.topicType}
                  </span>
                </div>
                <div className={styles.topicActions}>
                  <div className={styles.moveButtons}>
                    <button
                      className={styles.moveBtn}
                      onClick={() => moveTopicUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className={styles.moveBtn}
                      onClick={() => moveTopicDown(index)}
                      disabled={index === reorderedTopics.length - 1}
                      title="Move down"
                    >
                      ↓
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
import React, { useState } from 'react';
import styles from './TestList.module.css';
import { useNavigate } from 'react-router-dom';
import QuestionModal from './QuestionModal';

const TestList = ({ tests, loading, error, onAddQuestions, onEditTest }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const navigate = useNavigate();

  if (loading) {
    return <div className={styles.loading}>Loading tests...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error loading tests: {error}</div>;
  }

  if (!tests || tests.length === 0) {
    return <div className={styles.noTests}>No tests found. Create a new test to get started.</div>;
  }

  // Function to get status badge style
  const getStatusBadgeClass = (testStatus) => {
    switch (testStatus) {
      case 'approved':
        return styles.statusApproved;
      case 'pending':
        return styles.statusPending;
      case 'not_approved':
        return styles.statusNotApproved;
      case 'hold':
        return styles.statusHold;
      case 'rejected':
        return styles.statusRejected;
      default:
        return '';
    }
  };

  const handleOpenModal = (test) => {
    setSelectedTest(test);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTest(null);
  };

  const handleSaveQuestion = (questionData) => {
    onAddQuestions(selectedTest.testId, questionData);
  };

  const handlePreviewClick = (testId) => {
    navigate(`/test/preview/${testId}`);
  };


  return (
    <div className={styles.testList}>
      {tests.map((test) => (
        <div key={test.testId} className={styles.testCard}>
          <div className={styles.testTag}>TEST</div> 
          <div className={styles.testHeader}>
            <h3 className={styles.testName}>{test.testName}</h3>
            <span className={`${styles.statusBadge} ${getStatusBadgeClass(test.testStatus)}`}>
              {test.testStatus.toUpperCase()}
            </span>
          </div>
          
          <div className={styles.testDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Duration:</span>
              <span>{test.duration} minutes</span>
            </div>
          </div>
          
          <div className={styles.testActions}>
            <button 
              className={styles.previewButton}
              onClick={() => handlePreviewClick(test.testId)}
            >
              Preview
            </button>
            <button 
              className={styles.addQuestionsButton}
              onClick={() => handleOpenModal(test)}
            >
              Add Questions
            </button>
          </div>
        </div>
      ))}

      {/* Question Modal */}
      <QuestionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveQuestion}
        testId={selectedTest?.testId}
      />
    </div>
  );
};

export default TestList;
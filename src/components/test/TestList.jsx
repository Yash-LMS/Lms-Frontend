import React, { useState } from 'react';
import styles from './TestList.module.css';
import { useNavigate } from 'react-router-dom';
import QuestionModal from './QuestionModal';
import BulkUploadQuestionModal from './BulkUploadQuestionModal';

const TestList = ({ tests, loading, error, onAddQuestions, onEditTest }) => {
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
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
      case 'rejected':
        return styles.statusRejected;
      default:
        return '';
    }
  };

  const handleOpenQuestionModal = (test) => {
    setSelectedTest(test);
    setIsQuestionModalOpen(true);
  };

  const handleOpenBulkUploadModal = (test) => {
    setSelectedTest(test);
    setIsBulkUploadModalOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setSelectedTest(null);
  };

  const handleCloseBulkUploadModal = () => {
    setIsBulkUploadModalOpen(false);
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
            <div className={styles.questionActionButtons}>
              <button 
                className={styles.addQuestionsButton}
                onClick={() => handleOpenQuestionModal(test)}
              >
                Add Single Question
              </button>
              <button 
                className={styles.uploadButton}
                onClick={() => handleOpenBulkUploadModal(test)}
              >
                Bulk Upload
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Question Modal */}
      <QuestionModal 
        isOpen={isQuestionModalOpen}
        onClose={handleCloseQuestionModal}
        onSave={handleSaveQuestion}
        testId={selectedTest?.testId}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadQuestionModal 
        isOpen={isBulkUploadModalOpen}
        onClose={handleCloseBulkUploadModal}
        testId={selectedTest?.testId}
      />
    </div>
  );
};

export default TestList;
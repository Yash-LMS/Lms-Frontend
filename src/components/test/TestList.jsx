import React, { useState } from "react";
import styles from "./TestList.module.css";
import { useNavigate } from "react-router-dom";
import QuestionModal from "./QuestionModal";
import BulkUploadQuestionModal from "./BulkUploadQuestionModal";
import QuestionViewerModal from "./QuestionRandomModal";
import QuestionCategoryImport from "./QuestionCategoryImport";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPlus, faDownload, faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";

const TestList = ({
  tests,
  loading,
  error,
  onAddQuestions,
  onEditTest,
  user,
  token,
}) => {
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isImportRandomModalOpen, setIsImportRandomModalOpen] = useState(false);
  const [isImportAllModalOpen, setIsImportAllModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;
  
  const navigate = useNavigate();

  if (loading) {
    return <div className={styles.loading}>Loading tests...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error loading tests: {error}</div>;
  }

  if (!tests || tests.length === 0) {
    return (
      <div className={styles.noTests}>
        No tests found. Create a new test to get started.
      </div>
    );
  }
  
  // Calculate pagination
  const indexOfLastTest = currentPage * cardsPerPage;
  const indexOfFirstTest = indexOfLastTest - cardsPerPage;
  const currentTests = tests.slice(indexOfFirstTest, indexOfLastTest);
  const totalPages = Math.ceil(tests.length / cardsPerPage);

  // Pagination handlers
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Function to get status badge style
  const getStatusBadgeClass = (testStatus) => {
    switch (testStatus) {
      case "approved":
        return styles.statusApproved;
      case "pending":
        return styles.statusPending;
      case "rejected":
        return styles.statusRejected;
      default:
        return "";
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

  const handleOpenImportRandomModal = (test) => {
    setSelectedTest(test);
    setIsImportRandomModalOpen(true);
  };

  const handleOpenImportAllModal = (test) => {
    setSelectedTest(test);
    setIsImportAllModalOpen(true);
  };

  const handleCloseQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setSelectedTest(null);
  };

  const handleCloseBulkUploadModal = () => {
    setIsBulkUploadModalOpen(false);
    setSelectedTest(null);
  };

  const handleCloseImportRandomModal = () => {
    setIsImportRandomModalOpen(false);
    setSelectedTest(null);
  };

  const handleCloseImportAllModal = () => {
    setIsImportAllModalOpen(false);
    setSelectedTest(null);
  };

  const handleSaveQuestion = (questionData) => {
    onAddQuestions(selectedTest.testId, questionData);
  };

  const handlePreviewClick = (testId) => {
    navigate(`/test/preview/${testId}`);
  };

  return (
    <div className={styles.testListContainer}>
      <div className={styles.testList}>
        {currentTests.map((test) => (
          <div key={test.testId} className={styles.testCard}>
            <div className={styles.testTag}>TEST</div>
            <div className={styles.testHeader}>
              <h3 className={styles.testName}>{test.testName}</h3>
              <span
                className={`${styles.statusBadge} ${getStatusBadgeClass(
                  test.testStatus
                )}`}
              >
                {test.testStatus.toUpperCase()}
              </span>
            </div>

            <div className={styles.testDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Duration:</span>
                <span>{test.duration} minutes</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Feedback:</span>
                <span>{test.feedback}</span>
              </div>
            </div>

            <div className={styles.testActions}>
              <div className={styles.questionButtonsContainer}>
                <div className={styles.questionActionButtons}>
                  <button
                    className={styles.previewButton}
                    onClick={() => handlePreviewClick(test.testId)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    <span style={{marginLeft:'5px'}}>Preview</span>
                  </button>
                  <button
                    className={styles.addQuestionsButton}
                    onClick={() => handleOpenQuestionModal(test)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span style={{marginLeft:'5px'}}>Add Single Question</span>
                  </button>
                  <button
                    className={styles.uploadButton}
                    onClick={() => handleOpenBulkUploadModal(test)}
                  >
                    <FontAwesomeIcon icon={faArrowUpFromBracket} />
                    <span style={{marginLeft:'5px'}}>Bulk Upload</span>
                  </button>
                </div>
                <div className={styles.questionActionButtons}>
                <button
                  className={styles.importButton}
                  onClick={() => handleOpenImportRandomModal(test)}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  <span style={{marginLeft:'5px'}}>Import Random Questions</span>
                </button>
                <button
                  className={styles.importButton}
                  onClick={() => handleOpenImportAllModal(test)}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  <span style={{marginLeft:'5px'}}>Import All Questions</span>
                </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Controls - Removing conditional rendering */}
      <div className={styles.paginationControls}>
        <button 
          className={styles.paginationButton} 
          onClick={prevPage} 
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className={styles.pageIndicator}>
          Page {currentPage} of {totalPages || 1}
        </span>
        <button 
          className={styles.paginationButton} 
          onClick={nextPage} 
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>

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

      {/* Import Questions Modal */}
      <QuestionViewerModal
        isOpen={isImportRandomModalOpen}
        onClose={handleCloseImportRandomModal}
        testId={selectedTest?.testId}
      />

      <QuestionCategoryImport
        isOpen={isImportAllModalOpen}
        onClose={handleCloseImportAllModal}
        testId={selectedTest?.testId}
      />
    </div>
  );
};

export default TestList;
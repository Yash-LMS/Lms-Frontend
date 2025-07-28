import React, { useState } from "react";
import axios from "axios";
import styles from "./TestList.module.css";
import { useNavigate } from "react-router-dom";
import QuestionModal from "./QuestionModal";
import BulkUploadQuestionModal from "./BulkUploadQuestionModal";
import QuestionViewerModal from "./QuestionRandomModal";
import QuestionCategoryImport from "./QuestionCategoryImport";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPlus, faDownload, faArrowUpFromBracket, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { RESEND_Test_APPROVAL } from "../../constants/apiConstants";

const TestList = ({
  tests,
  loading,
  error,
  onAddQuestions,
  onEditTest,
  user,
  token,
  onSucesss
}) => {
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isImportRandomModalOpen, setIsImportRandomModalOpen] = useState(false);
  const [isImportAllModalOpen, setIsImportAllModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [resendingTests, setResendingTests] = useState(new Set());
  const [testMessages, setTestMessages] = useState({}); // Store success/error messages per test
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;
  
  const navigate = useNavigate();

  // Get user data function
  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
        role: sessionStorage.getItem("role"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  // Resend test for approval
  const handleResendForApproval = async (test) => {
    const userData = getUserData();
    
    if (!userData.user || !userData.token) {
      setTestMessages(prev => ({
        ...prev,
        [test.testId]: { type: 'error', message: 'User authentication data not found. Please login again.' }
      }));
      return;
    }

    setResendingTests(prev => new Set(prev).add(test.testId));
    // Clear any existing message for this test
    setTestMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[test.testId];
      return newMessages;
    });

    try {
      const requestData = {
        testId: test.testId,
        user: userData.user,
        token: userData.token
      };

      const response = await axios.post(RESEND_Test_APPROVAL, requestData);
      
      if (response.data && response.data.response === "success") {
        setTestMessages(prev => ({
          ...prev,
          [test.testId]: { type: 'success', message: response.data.message || 'Test has been successfully resent for approval!' }
        }));
        // Optionally trigger a refresh of the tests list
        if (onEditTest) {
          onEditTest(); // This might trigger a refresh in the parent component
        }
      } else {
        setTestMessages(prev => ({
          ...prev,
          [test.testId]: { type: 'error', message: response.data.message || 'Failed to resend test for approval' }
        }));
      }
    } catch (error) {
      console.error("Error resending test for approval:", error);
      
      let errorMessage = 'An error occurred while resending the test for approval. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Unauthorized access. Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setTestMessages(prev => ({
        ...prev,
        [test.testId]: { type: 'error', message: errorMessage }
      }));
    } finally {
      setResendingTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(test.testId);
        return newSet;
      });
      onSucesss();
    }
  };

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

            {/* Resend Approval Button - Only show for rejected tests */}
            {test.testStatus === "rejected" && (
              <div className={styles.resendContainer}>
                {/* Display success/error message */}
                {testMessages[test.testId] && (
                  <div className={`${styles.messageContainer} ${
                    testMessages[test.testId].type === 'success' 
                      ? styles.successMessage 
                      : styles.errorMessage
                  }`}>
                    {testMessages[test.testId].message}
                  </div>
                )}
                <button
                  className={styles.resendButton}
                  onClick={() => handleResendForApproval(test)}
                  disabled={resendingTests.has(test.testId)}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  <span style={{marginLeft:'5px'}}>
                    {resendingTests.has(test.testId) ? "Resending..." : "Resend for Approval"}
                  </span>
                </button>
              </div>
            )}

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
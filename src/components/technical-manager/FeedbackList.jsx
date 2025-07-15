import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FeedbackList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEdit,
  faTrash,
  faQuestion,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const FeedbackList = ({ feedbacks, loading, error, onRetry }) => {
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  // Modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Calculate pagination
  const indexOfLastFeedback = currentPage * cardsPerPage;
  const indexOfFirstFeedback = indexOfLastFeedback - cardsPerPage;
  const currentFeedbacks = feedbacks
    ? feedbacks.slice(indexOfFirstFeedback, indexOfLastFeedback)
    : [];
  const totalPages = feedbacks ? Math.ceil(feedbacks.length / cardsPerPage) : 0;

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

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowViewModal(false);
    setSelectedFeedback(null);
  };

  const handleEditFeedback = (feedback) => {
    console.log("Edit feedback:", feedback);
    // Navigate to edit feedback page or show modal
  };

  const handleDeleteFeedback = (feedback) => {
    console.log("Delete feedback:", feedback);
    // Show confirmation dialog and delete feedback
  };

  const getQuestionTypeDisplay = (type) => {
    switch (type?.toLowerCase()) {
      case 'text':
        return 'Text Description';
      case 'rating':
        return 'Rating (5 Stars)';
      case 'conditional':
        return 'Yes/No';
      default:
        return type || 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading feedbacks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>
          {typeof error === "string"
            ? error
            : error.message || "An error occurred."}
        </p>
        <button className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className={styles.noCourses}>
        No Feedbacks found. Create a new feedback to get started.
      </div>
    );
  }

  return (
    <div className={styles.courseListContainer}>
      <div className={styles.courseList}>
        {currentFeedbacks.map((feedback) => (
          <div key={feedback.feedBackId} className={styles.courseCard}>
            <div className={styles.courseTag}>FEEDBACK</div>
            <div className={styles.courseHeader}>
              <h3>{feedback.feedbackName}</h3>
            </div>
            
            <div className={styles.courseInfo}>
              <div className={styles.detailLabel}>
                <span>Number of Questions: </span>
                {feedback.feedbackQuestionList?.length || 0}
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                className={styles.previewButton}
                onClick={() => handleViewFeedback(feedback)}
                title="View Questions"
              >
                <FontAwesomeIcon icon={faEye} style={{ marginRight: '8px' }} />
                View Questions
              </button>
            </div>
          </div>
        ))}
      </div>

      {feedbacks && feedbacks.length > cardsPerPage && (
        <div className={styles.paginationControls}>
          <button
            className={styles.paginationButton}
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.pageIndicator}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.paginationButton}
            onClick={nextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* View Questions Modal */}
      {showViewModal && selectedFeedback && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Questions for: {selectedFeedback.feedbackName}</h2>
              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {selectedFeedback.feedbackQuestionList && selectedFeedback.feedbackQuestionList.length > 0 ? (
                <div className={styles.questionsList}>
                  {selectedFeedback.feedbackQuestionList.map((question, index) => (
                    <div key={question.feedBackQuestionId || index} className={styles.questionItem}>
                      <div className={styles.questionHeader}>
                        <span className={styles.questionNumber}>Q{index + 1}</span>
                        <span className={styles.questionType}>
                          {getQuestionTypeDisplay(question.feedbackQuestionType)}
                        </span>
                      </div>
                      <div className={styles.questionDescription}>
                        {question.questionDescription}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noQuestions}>
                  No questions found for this feedback.
                </div>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.closeModalButton}
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
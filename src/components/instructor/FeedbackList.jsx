import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BatchList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEdit,
  faTrash,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";

const FeedbackList = ({ feedbacks, loading, error, onRetry }) => {
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

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
    console.log("View feedback:", feedback);
    // Navigate to feedback detail page or show modal
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
    switch (type) {
      case 'TEXT':
        return 'Text Description';
      case 'RATING':
        return 'Rating (5 Stars)';
      case 'CONDITIONAL':
        return 'Yes/No';
      default:
        return type;
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
      <div className={styles.noFeedbacks}>
        No Feedbacks found. Create a new feedback to get started.
      </div>
    );
  }

  return (
    <div className={styles.feedbackListContainer}>
      <div className={styles.feedbackList}>
        {currentFeedbacks.map((feedback) => (
          <div key={feedback.feedbackId} className={styles.feedbackCard}>
            <div className={styles.feedbackTag}>FEEDBACK</div>
            <div className={styles.feedbackHeader}>
              <h3>{feedback.feedbackName}</h3>
              <span
                className={`${styles.statusBadge} ${
                  styles[feedback.status?.toLowerCase() || "pending"]
                }`}
              >
                {feedback.status?.toUpperCase() || "PENDING"}
              </span>
            </div>
            
            <div className={styles.feedbackInfo}>
              <div className={styles.questionCount}>
                <FontAwesomeIcon icon={faQuestion} />
                <span>{feedback.feedbackQuestions?.length || 0} Questions</span>
              </div>
              
              {feedback.feedbackQuestions && feedback.feedbackQuestions.length > 0 && (
                <div className={styles.questionTypes}>
                  <small>Question Types:</small>
                  <div className={styles.typeList}>
                    {[...new Set(feedback.feedbackQuestions.map(q => q.feedbackQuestionType))]
                      .map(type => (
                        <span key={type} className={styles.typeTag}>
                          {getQuestionTypeDisplay(type)}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}
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
    </div>
  );
};

export default FeedbackList;
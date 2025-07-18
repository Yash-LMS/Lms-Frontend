import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { USER_FEEDBACK_QUESTIONS_VIEW_URL, USER_FEEDBACK_QUESTIONS_SUBMIT_URL } from '../../constants/apiConstants';
import styles from './FeedbackModal.module.css';

const FeedbackModal = ({ isOpen, onClose, course, user, token, onSuccess, onError }) => {
  const [feedbackData, setFeedbackData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isOpen && course) {
      fetchFeedbackQuestions();
    }
  }, [isOpen, course]);

  const fetchFeedbackQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const requestData = {
        user,
        token,
        allotmentId: course.allotmentId
      };

      const response = await axios.post(USER_FEEDBACK_QUESTIONS_VIEW_URL, requestData);
      
      if (response.data && response.data.response === 'success') {
        setFeedbackData(response.data.payload);
        // Initialize answers array based on questions
        const initialAnswers = response.data.payload.feedbackQuestionDtoList.map((question, index) => ({
          questionIndex: index,
          questionId: question.feedBackQuestionId,
          feedbackQuestionType: question.feedbackQuestionType,
          answer: question.feedbackQuestionType === 'rating' ? '0' : ''
        }));
        setAnswers(initialAnswers);
      } else {
        setError('Failed to load feedback questions');
      }
    } catch (error) {
      console.error('Error fetching feedback questions:', error);
      setError('Failed to load feedback questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prevAnswers => 
      prevAnswers.map(answer => 
        answer.questionIndex === questionIndex 
          ? { ...answer, answer: value }
          : answer
      )
    );
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required fields
      const hasEmptyAnswers = answers.some(answer => {
        if (answer.feedbackQuestionType === 'rating') {
          return answer.answer === '0' || answer.answer === '';
        }
        return !answer.answer.trim();
      });

      if (hasEmptyAnswers) {
        setError('Please answer all questions before submitting.');
        return;
      }

      const requestData = {
        user,
        token,
        courseId: course.course.courseId,
        allotmentId: course.allotmentId,
        feedbackAnswerList: answers
      };

      console.log('Submitting feedback with data:', requestData);

      const response = await axios.post(USER_FEEDBACK_QUESTIONS_SUBMIT_URL, requestData);

      console.log('Feedback submission response:', response.data);
      
      if (response.data && response.data.response === 'success') {
        setSuccessMessage('Feedback submitted successfully!');
        // Close modal after showing success message briefly
        setTimeout(() => {
          onSuccess('Feedback submitted successfully!');
          onClose();
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit feedback. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question, index) => {
    const answer = answers.find(a => a.questionIndex === index);
    
    switch (question.feedbackQuestionType) {
      case 'text':
        return (
          <textarea
            className={styles.textInput}
            value={answer?.answer || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder="Enter your response..."
            rows={4}
          />
        );
      
      case 'rating':
        return (
          <div className={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`${styles.starButton} ${
                  parseInt(answer?.answer || 0) >= star ? styles.starActive : styles.starInactive
                }`}
                onClick={() => handleAnswerChange(index, star.toString())}
              >
                ★
              </button>
            ))}
            <span className={styles.ratingText}>
              {answer?.answer && parseInt(answer.answer) > 0 
                ? `${answer.answer} out of 5 stars` 
                : 'No rating selected'}
            </span>
          </div>
        );
      
      case 'conditional':
        return (
          <div className={styles.conditionalContainer}>
            <button
              type="button"
              className={`${styles.conditionalButton} ${
                answer?.answer === 'Yes' ? styles.conditionalActive : styles.conditionalInactive
              }`}
              onClick={() => handleAnswerChange(index, 'Yes')}
            >
              Yes
            </button>
            <button
              type="button"
              className={`${styles.conditionalButton} ${
                answer?.answer === 'No' ? styles.conditionalActive : styles.conditionalInactive
              }`}
              onClick={() => handleAnswerChange(index, 'No')}
            >
              No
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.feedbackModal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {feedbackData?.feedbackName || 'Course Feedback'}
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <div className={styles.modalContent}>
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading feedback form...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {successMessage && (
            <div className={styles.successMessage}>
              {successMessage}
            </div>
          )}

          {!loading && !error && feedbackData && (
            <div className={styles.questionsContainer}>
              <p className={styles.courseInfo}>
                Course: <strong>{course.course.courseName}</strong>
              </p>
              
              {feedbackData.feedbackQuestionDtoList.map((question, index) => (
                <div key={index} className={styles.questionBlock}>
                  <div className={styles.questionNumber}>
                    Q{index + 1}
                  </div>
                  <label className={styles.questionLabel}>
                    {question.questionDescription}
                    {question.feedbackQuestionType === 'rating' && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  {renderQuestionInput(question, index)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={submitting || loading || !feedbackData}
          >
            {submitting ? (
              <>
                <span className={styles.submitSpinner}></span>
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
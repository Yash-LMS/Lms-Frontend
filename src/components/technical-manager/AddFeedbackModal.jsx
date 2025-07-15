import React, { useState } from 'react';
import axios from 'axios';
import styles from './AddFeedbackModal.module.css';
import { CREATE_FEEDBACK_URL } from '../../constants/apiConstants';

const AddFeedbackModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    feedbackName: '',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionDescription: '',
    feedbackQuestionType: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const feedbackQuestionTypes = [
    { value: 'text', label: 'Description' },
    { value: 'rating', label: 'Rating (5 Stars)' },
    { value: 'conditional', label: 'Yes/No' }
  ];

  if (!isOpen) return null;

  const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      return {
        user,
        token,
        role: user?.role || null,
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.questionDescription.trim()) {
      setErrors(prev => ({
        ...prev,
        questionDescription: 'Question description is required'
      }));
      return;
    }

    if (!currentQuestion.feedbackQuestionType) {
      setErrors(prev => ({
        ...prev,
        feedbackQuestionType: 'Question type is required'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }]
    }));

    setCurrentQuestion({
      questionDescription: '',
      feedbackQuestionType: ''
    });

    setErrors(prev => ({
      ...prev,
      questionDescription: '',
      feedbackQuestionType: ''
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const getQuestionTypeLabel = (type) => {
    const questionType = feedbackQuestionTypes.find(q => q.value === type);
    return questionType ? questionType.label : type;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.feedbackName.trim()) {
      newErrors.feedbackName = 'Feedback name is required';
    }

    if (formData.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const { user, token } = getUserData();

    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    setLoading(true);

    // Prepare the request payload according to the API structure (ApiRequestModelFeedback)
    const requestData = {
      user: user,
      token: token,
      feedbackName: formData.feedbackName.trim(),
      feedbackQuestionList: formData.questions.map(q => ({
        questionDescription: q.questionDescription.trim(),
        feedbackQuestionType: q.feedbackQuestionType // This should match the enum values
      }))
    };

    console.log("Feedback data being sent:", requestData);
    console.log("Number of questions:", requestData.feedbackQuestionList.length);

    try {
      console.log("Sending request to:", CREATE_FEEDBACK_URL);
      console.log("Request data:", requestData);

      const response = await axios.post(CREATE_FEEDBACK_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("Create feedback response:", response.data);

      // Check for successful response based on the API structure
      if (response.data && (response.data.response === "success" || response.data.response === "Success")) {
        // Reset form after successful submission
        setFormData({
          feedbackName: '',
          questions: []
        });
        setCurrentQuestion({
          questionDescription: '',
          feedbackQuestionType: ''
        });
        setErrors({});

        onSuccess(response.data.message || "Feedback created successfully");
      } else {
        const errorMessage = response.data?.message || response.data?.payload || "Failed to create feedback";
        setErrors(prev => ({
          ...prev,
          submit: errorMessage
        }));
      }
    } catch (err) {
      console.error("Failed to add feedback:", err);
      
      let errorMessage = "An error occurred while creating the feedback";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.payload) {
        errorMessage = err.response.data.payload;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));

      // Handle specific error cases
      if (err.response?.status === 401) {
        alert("Unauthorized access. Please log in again.");
      } else if (err.response?.status === 403) {
        alert("You don't have permission to create feedback.");
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return; // Prevent closing while loading
    }
    
    setFormData({
      feedbackName: '',
      questions: []
    });
    setCurrentQuestion({
      questionDescription: '',
      feedbackQuestionType: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>Create New Feedback</h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </header>
        
        <form className={styles.courseForm} onSubmit={handleSubmit}>
          {errors.submit && (
            <div className={styles.errorMessage}>
              {errors.submit}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="feedbackName">Feedback Name *</label>
            <input 
              type="text" 
              id="feedbackName" 
              name="feedbackName"
              value={formData.feedbackName}
              onChange={handleInputChange}
              placeholder="Enter feedback name"
              className={`${styles.formInput} ${errors.feedbackName ? styles.errorInput : ''}`}
              required
              disabled={loading}
            />
            {errors.feedbackName && <span className={styles.errorText}>{errors.feedbackName}</span>}
          </div>

          <div className={styles.questionSection}>
            <h3>Add Questions</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="questionDescription">Question Description *</label>
              <textarea 
                id="questionDescription" 
                name="questionDescription"
                value={currentQuestion.questionDescription}
                onChange={handleQuestionInputChange}
                placeholder="Enter question description"
                className={`${styles.formInput} ${errors.questionDescription ? styles.errorInput : ''}`}
                rows="3"
                disabled={loading}
              />
              {errors.questionDescription && <span className={styles.errorText}>{errors.questionDescription}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="feedbackQuestionType">Question Type *</label>
              <select 
                id="feedbackQuestionType" 
                name="feedbackQuestionType"
                value={currentQuestion.feedbackQuestionType}
                onChange={handleQuestionInputChange}
                className={`${styles.formInput} ${errors.feedbackQuestionType ? styles.errorInput : ''}`}
                disabled={loading}
              >
                <option value="">Select Question Type</option>
                {feedbackQuestionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.feedbackQuestionType && <span className={styles.errorText}>{errors.feedbackQuestionType}</span>}
            </div>

            <button 
              type="button" 
              className={styles.addQuestionBtn}
              onClick={addQuestion}
              disabled={loading}
            >
              Add Question
            </button>
          </div>

          {formData.questions.length > 0 && (
            <div className={styles.questionsPreview}>
              <h3>Questions Preview</h3>
              {formData.questions.map((question, index) => (
                <div key={index} className={styles.questionItem}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>Q{index + 1}</span>
                    <span className={styles.questionType}>
                      {getQuestionTypeLabel(question.feedbackQuestionType)}
                    </span>
                    <button
                      type="button"
                      className={styles.removeQuestionBtn}
                      onClick={() => removeQuestion(index)}
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                  <p className={styles.questionText}>{question.questionDescription}</p>
                </div>
              ))}
            </div>
          )}

          {errors.questions && <span className={styles.errorText}>{errors.questions}</span>}

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFeedbackModal;
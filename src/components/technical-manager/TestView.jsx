import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from "../test/TestPreview.module.css";
import { viewManagerTestQuestions} from '../../features/test/testActions';

const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      return {
        user: user,
        token: sessionStorage.getItem('token'),
        role: user ? user.role : null  // Restore role extraction
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

const TestPreview = () => {
  const { testId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(1);

  // Select test data and loading state from Redux store
  const { questions, loading, error } = useSelector((state) => state.tests);
  
  // Get user role and check for technical manager
  const { user, token, role } = getUserData();
  const isAuthorized = role === 'technical_manager';

  // Fetch test questions when component mounts
  useEffect(() => {
    const fetchTestQuestions = async () => {
      if (!user || !token) {
        alert("User session data is missing. Please log in again.");
        navigate("/login");
        return;
      }

      try {
        await dispatch(
            viewManagerTestQuestions({
            testId: parseInt(testId),
            user,  // Pass full user object
            token,
          })
        ).unwrap();
      } catch (err) {
        console.error("Error fetching test questions:", err);
        // Handle unauthorized access
        alert("You are not authorized to view this test.");
        navigate('/instructor/test');
      }
    };

    fetchTestQuestions();
  }, [testId, dispatch, navigate]);

  // Handle loading and error states
  if (loading) {
    return <div className={styles.loading}>Loading test questions...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error loading test: {error}</div>;
  }

  // Modify question extraction logic
  const extractQuestions = () => {
    if (Array.isArray(questions)) return questions;
    if (questions && Array.isArray(questions.questions)) return questions.questions;
    if (questions && questions[0] && questions[0].questionId) return questions;
    return [];
  };

  const testQuestions = extractQuestions();

  // Check if questions exist
  if (!testQuestions || testQuestions.length === 0) {
    return <div className={styles.noQuestions}>No questions found for this test.</div>;
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < testQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate('/manager-dashboard');
  };

  // Get current question details
  const currentQuestionData = testQuestions[currentQuestion - 1];

  // Dynamically generate options based on question object
  const generateOptions = () => {
    const optionKeys = ['option1', 'option2', 'option3', 'option4', 'option5', 'option6'];
    
    return optionKeys
      .filter(key => currentQuestionData[key] !== null && currentQuestionData[key] !== undefined)
      .map((key) => ({
        optionId: key,
        optionText: currentQuestionData[key],
        isCorrect: currentQuestionData.correctOption && currentQuestionData.correctOption.includes(key)
      }));
  };

  const options = generateOptions();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div className={styles.testInfo}>
          <span>Test Type: {'MCQ'}</span>
          <span>Question Type: {currentQuestionData.questionType}</span>
          <span>Question: {currentQuestion}</span>
         
          <button 
            className={styles.backButton} 
            onClick={handleBackToDashboard}
          >
           &larr; Back to Dashboard
          </button>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.mainContent}>
          <div className={styles.questionSection}>
            <div className={styles.questionHeader}>
              Q {currentQuestion}
            </div>
            <div className={styles.questionText}>
              <div className={styles.questionDescription}>
                {currentQuestionData.description || 'No question text available'}
                <span className={styles.questionMarks}>
                  Marks: {currentQuestionData.marks || 1}
                </span>
              </div>
            </div>

            <div className={styles.optionsContainer}>
              {options.map((option) => (
                <label 
                  key={option.optionId} 
                  className={`${styles.optionLabel} ${
                    isAuthorized && option.isCorrect ? styles.correctOption : ''
                  }`}
                >
                  <input
                    type={currentQuestionData.questionType === 'multiple_choice' ? "checkbox" : "radio"}
                    name="answer"
                    value={option.optionId}
                    className={styles.radioInput}
                    checked={option.isCorrect} 
                    readOnly 
                  />
                  {option.optionText}
                  {isAuthorized && option.isCorrect && (
                    <span className={styles.correctOptionMarker}></span>
                  )}
                </label>
              ))}
            </div>

            <div className={styles.navigationContainer}>
              <button 
                className={styles.prevButton} 
                onClick={handlePrevQuestion}
                disabled={currentQuestion === 1}
              >
                Prev
              </button>
              <button 
                className={styles.nextButton} 
                onClick={handleNextQuestion}
                disabled={currentQuestion === testQuestions.length}
              >
                Next
              </button>
            </div>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.questionsSection}>
              <h3>Questions</h3>
              {testQuestions.map((_, index) => (
                <div 
                  key={index} 
                  className={`${styles.questionBadge} ${
                    index + 1 === currentQuestion ? styles.activeQuestion : ''
                  }`}
                  onClick={() => setCurrentQuestion(index + 1)}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPreview;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import SuccessModal from '../../assets/SuccessModal'; 
import styles from './TestPreview.module.css';
import { viewTestQuestions } from '../../features/test/testActions';
import { UPDATE_TEST_QUESTION_URL } from '../../constants/apiConstants';

const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      return {
        user: user,
        token: sessionStorage.getItem('token'),
        role: user ? user.role : null
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // State for SuccessModal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Select test data and loading state from Redux store
  const { questions, loading, error: reduxError } = useSelector((state) => state.tests);
  
  // Get user role to determine if instructor
  const { role } = getUserData();
  const isInstructor = role === 'instructor';

  // Enhanced Quill editor modules and formats
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'script',
    'color', 'background',
    'link'
  ];

  // Helper function to format text content for ReactQuill
  const formatTextForQuill = (text) => {
    if (!text) return '';
    
    // If it's already HTML, return as is
    if (text.includes('<') && text.includes('>')) {
      return text;
    }
    
    // Convert plain text to HTML with proper formatting
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');
  };

  // Helper function to clean text for saving
  const cleanTextForSaving = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get plain text but preserve line breaks
    let plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // If the original content had HTML formatting, preserve it
    if (htmlContent.includes('<p>') || htmlContent.includes('<br>') || 
        htmlContent.includes('<strong>') || htmlContent.includes('<em>')) {
      return htmlContent;
    }
    
    return plainText;
  };

  // Fetch test questions when component mounts
  useEffect(() => {
    const fetchTestQuestions = async () => {
      const { user, token } = getUserData();

      if (!user || !token) {
        alert("User session data is missing. Please log in again.");
        navigate("/login");
        return;
      }

      try {
        await dispatch(
          viewTestQuestions({
            testId: parseInt(testId),
            user,
            token,
          })
        ).unwrap();
      } catch (err) {
        console.error("Error fetching test questions:", err);
      }
    };

    fetchTestQuestions();
  }, [testId, dispatch, navigate]);

  // Handle loading and error states
  if (loading) {
    return <div className={styles.loading}>Loading test questions...</div>;
  }

  if (reduxError) {
    return <div className={styles.error}>Error loading test: {reduxError}</div>;
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
      setIsEditMode(false);
      setEditedQuestion(null);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < testQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setIsEditMode(false);
      setEditedQuestion(null);
    }
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate('/instructor/view/test');
  };

  // Get current question details
  const currentQuestionData = testQuestions[currentQuestion - 1];

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setEditedQuestion(null);
      setError(null);
    } else {
      setIsEditMode(true);
      // Prepare question for editing with options array
      const options = generateOptionsForEdit();
      setEditedQuestion({
        ...currentQuestionData,
        description: formatTextForQuill(currentQuestionData.description),
        options
      });
    }
  };

  // Generate options array for editing
  const generateOptionsForEdit = () => {
    const optionKeys = ['option1', 'option2', 'option3', 'option4', 'option5', 'option6', 'option7', 'option8'];
    
    return optionKeys
      .filter(key => currentQuestionData[key] !== null && currentQuestionData[key] !== undefined && String(currentQuestionData[key]).trim() !== '')
      .map((key) => ({
        id: key,
        text: currentQuestionData[key]
      }));
  };

  // Dynamically generate options based on question object
  const generateOptions = () => {
    const optionKeys = ['option1', 'option2', 'option3', 'option4', 'option5', 'option6', 'option7', 'option8'];
    
    return optionKeys
      .filter(key => currentQuestionData[key] !== null && currentQuestionData[key] !== undefined && String(currentQuestionData[key]).trim() !== '')
      .map((key) => ({
        optionId: key,
        optionText: currentQuestionData[key],
        isCorrect: currentQuestionData.correctOption && currentQuestionData.correctOption.includes(key)
      }));
  };

  // Parse correct options for highlighting
  const parseCorrectOptions = (question) => {
    if (!question || !question.correctOption) return [];
    
    const correctOptionsString = String(question.correctOption).trim();
    
    if (correctOptionsString === '') return [];
    
    if (question.questionType === 'single_choice') {
      return [correctOptionsString];
    } else if (question.questionType === 'multiple_choice') {
      // Handle both formats: slash-separated (new) and comma-separated (old)
      if (correctOptionsString.includes('/')) {
        return correctOptionsString.split('/').filter(opt => opt.trim() !== '');
      } else if (correctOptionsString.includes(',')) {
        return correctOptionsString.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
      } else {
        return [correctOptionsString];
      }
    }
    return [];
  };

  // Check if an option is correct
  const isCorrectOption = (question, optionId) => {
    const correctOptions = parseCorrectOptions(question);
    return correctOptions.includes(optionId);
  };

  // Handle description change with ReactQuill
  const handleDescriptionChange = (content) => {
    setEditedQuestion(prev => ({
      ...prev,
      description: content
    }));
  };

  // Handle basic input changes
  const handleInputChange = (field, value) => {
    setEditedQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle option text change
  const handleOptionTextChange = (optionId, newText) => {
    setEditedQuestion(prev => {
      const optionIndex = prev.options.findIndex(opt => opt.id === optionId);
      
      if (optionIndex !== -1) {
        const newOptions = [...prev.options];
        newOptions[optionIndex].text = newText;
        
        return {
          ...prev,
          options: newOptions,
          [optionId]: newText
        };
      }
      return prev;
    });
  };

  // Toggle correct option for a question
  const handleCorrectOptionToggle = (optionId) => {
    setEditedQuestion(prev => {
      // For single_choice questions, unselect all other options
      if (prev.questionType === 'single_choice') {
        return {
          ...prev,
          correctOption: optionId
        };
      } else if (prev.questionType === 'multiple_choice') {
        // For multiple_choice, toggle this option in the list
        const correctOptionsString = prev.correctOption ? String(prev.correctOption).trim() : '';
        let currentOptions = [];
        
        if (correctOptionsString === '') {
          currentOptions = [];
        } else if (correctOptionsString.includes('/')) {
          currentOptions = correctOptionsString.split('/').filter(opt => opt.trim() !== '');
        } else if (correctOptionsString.includes(',')) {
          currentOptions = correctOptionsString.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
        } else {
          currentOptions = [correctOptionsString];
        }
        
        const isSelected = currentOptions.includes(optionId);
        
        if (isSelected) {
          // Remove this option if it's already selected
          if (currentOptions.length > 1) {
            const newCorrectOptions = currentOptions.filter(opt => opt !== optionId);
            return {
              ...prev,
              correctOption: newCorrectOptions.join('/')
            };
          }
        } else {
          // Add this option if it's not already selected
          const newCorrectOptions = [...currentOptions, optionId];
          return {
            ...prev,
            correctOption: newCorrectOptions.join('/')
          };
        }
      }
      return prev;
    });
  };

  // Switch question type between single and multiple choice
  const changeQuestionType = (newType) => {
    setEditedQuestion(prev => {
      const updatedQuestion = { ...prev, questionType: newType };
      
      // Reset correct options based on new type
      if (newType === 'single_choice') {
        const correctOptions = parseCorrectOptions(prev);
        
        if (correctOptions.length > 0) {
          updatedQuestion.correctOption = correctOptions[0];
        } else {
          const firstOption = prev.options[0];
          if (firstOption) {
            updatedQuestion.correctOption = firstOption.id;
          } else {
            updatedQuestion.correctOption = '';
          }
        }
      } else {
        const correctOptions = parseCorrectOptions(prev);
        if (correctOptions.length > 0) {
          updatedQuestion.correctOption = correctOptions.join('/');
        }
      }
      
      return updatedQuestion;
    });
  };

  // Add new option to a question
  const handleAddOption = () => {
    if (!editedQuestion) return;
    
    // Maximum 8 options
    if (editedQuestion.options.length >= 8) {
      setError('Maximum 8 options allowed per question');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Find the next available option slot (option1 to option8)
    const optionKeys = ['option1', 'option2', 'option3', 'option4', 'option5', 'option6', 'option7', 'option8'];
    let newOptionId = null;
    
    for (const key of optionKeys) {
      if (!editedQuestion[key] || String(editedQuestion[key]).trim() === '') {
        newOptionId = key;
        break;
      }
    }
    
    if (!newOptionId) {
      setError('Maximum 8 options allowed per question');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    const optionNumber = newOptionId.replace('option', '');
    const newOptionText = `Option ${optionNumber}`;
    
    setEditedQuestion(prev => {
      const newOptions = [...prev.options, {
        id: newOptionId,
        text: newOptionText
      }];
      
      const updatedQuestion = {
        ...prev,
        options: newOptions,
        [newOptionId]: newOptionText
      };
      
      // If this is the first option and it's single choice, make it correct by default
      if (newOptions.length === 1 && prev.questionType === 'single_choice') {
        updatedQuestion.correctOption = newOptionId;
      }
      
      // If this is the first option and it's multiple choice with no correct options
      if (newOptions.length === 1 && prev.questionType === 'multiple_choice' && !prev.correctOption) {
        updatedQuestion.correctOption = newOptionId;
      }
      
      return updatedQuestion;
    });
  };

  // Delete option from a question  
  const handleDeleteOption = (optionId) => {
    if (!editedQuestion) return;
    
    // Ensure at least two options remain
    if (editedQuestion.options.length <= 2) {
      setError('At least two options must be present');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Find the option's index
    const optionIndex = editedQuestion.options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) return;
    
    setEditedQuestion(prev => {
      // Check if this is a correct option using the new parsing method
      const correctOptions = parseCorrectOptions(prev);
      const isCorrectOption = correctOptions.includes(optionId);
      
      let newCorrectOption = prev.correctOption;
      
      if (isCorrectOption) {
        // If this is a correct option in a single choice question
        if (prev.questionType === 'single_choice') {
          // Find another option to make correct
          const otherOption = prev.options.find(opt => opt.id !== optionId);
          if (otherOption) {
            newCorrectOption = otherOption.id;
          }
        } else {
          // For multiple choice, remove this from correct options
          const filteredCorrectOptions = correctOptions.filter(opt => opt !== optionId);
          
          // If no correct options would remain, don't allow deletion
          if (filteredCorrectOptions.length === 0) {
            setError('Question must have at least one correct option');
            setTimeout(() => setError(null), 3000);
            return prev;
          }
          
          newCorrectOption = filteredCorrectOptions.join('/');
        }
      }
      
      // Remove the option
      const newOptions = prev.options.filter(opt => opt.id !== optionId);
      
      // Create updated question object
      const updatedQuestion = { ...prev };
      updatedQuestion.options = newOptions;
      updatedQuestion.correctOption = newCorrectOption;
      
      // Remove from original format (set to null instead of delete to maintain structure)
      updatedQuestion[optionId] = null;
      
      return updatedQuestion;
    });
  };

  // Show success modal
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  // Hide success modal
  const hideSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
  };
  
  const handleSaveQuestion = async () => {
    const { user, token } = getUserData();
  
    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      navigate("/login");
      return;
    }
  
    setSaving(true);
    setError(null);
    
    try {
      // Prepare question data by removing the options array (keep original format)
      const { options, ...questionToSave } = editedQuestion;
  
      // Clean the description for saving
      questionToSave.description = cleanTextForSaving(questionToSave.description);
  
      // Convert correctOption format back to comma-separated if it's slash-separated
      if (questionToSave.correctOption && questionToSave.correctOption.includes('/')) {
        questionToSave.correctOption = questionToSave.correctOption.replace(/\//g, ',');
      }
  
      const response = await axios.post(UPDATE_TEST_QUESTION_URL, {
        question: questionToSave,
        testId: parseInt(testId),
        user: user,
        token: token,
      });
  
      if (response.data && response.data.response === 'success') {
        showSuccess('Question updated successfully!');
        
        // Refresh test questions to get the latest data
        await dispatch(
          viewTestQuestions({
            testId: parseInt(testId),
            user,
            token,
          })
        ).unwrap();
        
        // Exit edit mode
        setIsEditMode(false);
        setEditedQuestion(null);
      } else {
        setError(response.data?.message || 'Failed to update question');
      }
    } catch (err) {
      console.error("Error updating question:", err);
      setError('Error updating question. Please try again.');
    } finally {
      setSaving(false);
    }
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
              <span>Q {currentQuestion}</span>
              {isInstructor && (
                <div className={styles.editControls}>
                  {isEditMode ? (
                    <>
                      <button 
                        className={styles.saveButton}
                        onClick={handleSaveQuestion}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        className={styles.cancelButton}
                        onClick={handleEditToggle}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      className={styles.editButton}
                      onClick={handleEditToggle}
                    >
                      Edit Question
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {isEditMode ? (
              // Edit Mode
              <div className={styles.editSection}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Question Description:</label>
                  <div className={styles.quillContainer}>
                    <ReactQuill
                      value={editedQuestion?.description || ''}
                      onChange={handleDescriptionChange}
                      modules={modules}
                      formats={formats}
                      placeholder="Enter your question here"
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Marks:</label>
                  <input
                    type="number"
                    className={styles.marksInput}
                    value={editedQuestion?.marks || 1}
                    onChange={(e) => handleInputChange('marks', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Question Type:</label>
                  <div className={styles.radioGroup}>
                    <label>
                      <input 
                        type="radio" 
                        name="questionType"
                        checked={editedQuestion?.questionType === 'single_choice'}
                        onChange={() => changeQuestionType('single_choice')} 
                      /> 
                      Single Choice
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="questionType"
                        checked={editedQuestion?.questionType === 'multiple_choice'}
                        onChange={() => changeQuestionType('multiple_choice')} 
                      /> 
                      Multiple Choice
                    </label>
                  </div>
                </div>

                <div className={styles.optionsSection}>
                  <div className={styles.optionsHeader}>
                    <h4>Options:</h4>
                    <button 
                      className={styles.addOptionButton}
                      onClick={handleAddOption}
                      disabled={editedQuestion?.options && editedQuestion.options.length >= 8}
                    >
                      + Add Option
                    </button>
                  </div>
                  
                  {editedQuestion?.options && editedQuestion.options.map((option, index) => (
                    <div 
                      key={option.id} 
                      className={`${styles.optionEdit} ${
                        isCorrectOption(editedQuestion, option.id) ? styles.correctOption : ''
                      }`}
                    >
                      <div className={styles.optionHeader}>
                        <label className={styles.correctCheckbox}>
                          {editedQuestion.questionType === 'single_choice' ? (
                            <input
                              type="radio"
                              name="correctOption"
                              checked={isCorrectOption(editedQuestion, option.id)}
                              onChange={() => handleCorrectOptionToggle(option.id)}
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={isCorrectOption(editedQuestion, option.id)}
                              onChange={() => handleCorrectOptionToggle(option.id)}
                            />
                          )}
                          Correct
                        </label>
                        <button 
                          className={styles.removeOptionButton}
                          onClick={() => handleDeleteOption(option.id)}
                          disabled={editedQuestion.options.length <= 2}
                          title={editedQuestion.options.length <= 2 ? "At least 2 options required" : "Remove option"}
                        >
                          ×
                        </button>
                      </div>
                      <input
                        type="text"
                        className={styles.optionInput}
                        value={option.text}
                        onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                        placeholder={`Enter option ${index + 1}...`}
                      />
                      {isCorrectOption(editedQuestion, option.id) && (
                        <span className={styles.correctOptionMarker}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // View Mode
              <div className={styles.questionText}>
                <div className={styles.questionDescription}>
                  <div dangerouslySetInnerHTML={{ __html: currentQuestionData.description || 'No question text available' }} />
                  <span className={styles.questionMarks}>
                    Marks: {currentQuestionData.marks || 1}
                  </span>
                </div>
              </div>
            )}

            {!isEditMode && (
              <div className={styles.optionsContainer}>
                {options.map((option) => (
                  <label 
                    key={option.optionId} 
                    className={`${styles.optionLabel} ${
                      isInstructor && option.isCorrect ? styles.correctOption : ''
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
                    {isInstructor && option.isCorrect && (
                      <span className={styles.correctOptionMarker}>✓</span>
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className={styles.navigationContainer}>
              <button 
                className={styles.prevButton} 
                onClick={handlePrevQuestion}
                disabled={currentQuestion === 1 || saving || isEditMode}
                title={isEditMode ? "Save or cancel changes to navigate" : ""}
              >
                Prev
              </button>
              <button 
                className={styles.nextButton} 
                onClick={handleNextQuestion}
                disabled={currentQuestion === testQuestions.length || saving || isEditMode}
                title={isEditMode ? "Save or cancel changes to navigate" : ""}
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
                  } ${isEditMode ? styles.disabled : ''}`}
                  onClick={() => {
                    if (!saving && !isEditMode) {
                      setCurrentQuestion(index + 1);
                      setEditedQuestion(null);
                    } else if (isEditMode) {
                      setError('Please save or cancel your changes before navigating to another question.');
                      setTimeout(() => setError(null), 3000);
                    }
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={hideSuccessModal}
        />
      )}
    </div>
  );
};

export default TestPreview;
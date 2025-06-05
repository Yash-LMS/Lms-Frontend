import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import styles from './QuestionEdit.module.css';
import { FIND_QUESTION_BY_USER_URL, UPDATE_QUESTION_URL } from '../../constants/apiConstants';

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

const QuestionEdit = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);
  const [saving, setSaving] = useState(false);

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

  // Get user role to determine if instructor
  const { role } = getUserData();
  const isInstructor = role === 'instructor';

  // Fetch questions when component mounts
  const fetchQuestions = async () => {
    const { user, token } = getUserData();
  
    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      navigate("/login");
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post(FIND_QUESTION_BY_USER_URL, {
        user: user,
        token: token,
      });
  
      if (response.data && response.data.response === "success") {
        const fetchedQuestions = response.data.payload || [];
  
        // Transform questions to include options array for better management
        const transformedQuestions = fetchedQuestions.map((question) => {
          const options = [];
          for (let i = 1; i <= 8; i++) {
            const optionKey = `option${i}`;
            if (
              question[optionKey] !== null &&
              question[optionKey] !== undefined &&
              String(question[optionKey]).trim() !== ""
            ) {
              options.push({
                id: optionKey,
                text: question[optionKey],
              });
            }
          }
  
          return {
            ...question,
            options,
          };
        });
  
        setQuestions(transformedQuestions);
        if (transformedQuestions.length > 0) {
          setEditedQuestion({ ...transformedQuestions[currentQuestion - 1] });
        }
      } else {
        setError(response.data?.message || "Failed to fetch questions");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Error loading questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions when component mounts
  useEffect(() => {
    fetchQuestions();
  }, [navigate]);

  // Handle loading and error states
  if (loading) {
    return <div className={styles.loading}>Loading questions...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error loading questions: {error}</div>;
  }

  // Check if questions exist
  if (!questions || questions.length === 0) {
    return <div className={styles.noQuestions}>No questions found. Create some questions first.</div>;
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 1) {
      const newIndex = currentQuestion - 2;
      setCurrentQuestion(currentQuestion - 1);
      setEditedQuestion({ ...questions[newIndex] });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length) {
      const newIndex = currentQuestion;
      setCurrentQuestion(currentQuestion + 1);
      setEditedQuestion({ ...questions[newIndex] });
    }
  };

  const handleQuestionSelect = (index) => {
    setCurrentQuestion(index + 1);
    setEditedQuestion({ ...questions[index] });
  };

  // Navigate back to dashboard
  const handleBackToDashboard = () => {
    navigate('/instructor-dashboard');
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
          [optionId]: newText // Also update the original format
        };
      }
      return prev;
    });
  };

  // Toggle correct option for a question - UPDATED TO MATCH QuestionCategoryImport
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
        // Handle both comma-separated (old format) and slash-separated (new format)
        const correctOptionsString = prev.correctOption ? String(prev.correctOption).trim() : '';
        let currentOptions = [];
        
        if (correctOptionsString === '') {
          currentOptions = [];
        } else if (correctOptionsString.includes('/')) {
          // New format with slashes
          currentOptions = correctOptionsString.split('/').filter(opt => opt.trim() !== '');
        } else if (correctOptionsString.includes(',')) {
          // Old format with commas - convert to new format
          currentOptions = correctOptionsString.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
        } else {
          // Single option
          currentOptions = [correctOptionsString];
        }
        
        const isSelected = currentOptions.includes(optionId);
        
        if (isSelected) {
          // Remove this option if it's already selected
          if (currentOptions.length > 1) { // Ensure at least one option remains selected
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

  // Add new option to a question
  const handleAddOption = () => {
    if (!editedQuestion) return;
    
    // Maximum 8 options
    if (editedQuestion.options.length >= 8) {
      setError('Maximum 8 options allowed per question');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Find the next available option slot
    let nextOptionNumber = editedQuestion.options.length + 1;
    let newOptionId = `option${nextOptionNumber}`;
    
    // Make sure this option ID doesn't already exist
    while ((editedQuestion[newOptionId] !== null && editedQuestion[newOptionId] !== undefined && 
            String(editedQuestion[newOptionId]).trim() !== '') && nextOptionNumber <= 8) {
      nextOptionNumber++;
      newOptionId = `option${nextOptionNumber}`;
    }
    
    if (nextOptionNumber > 8) {
      setError('Maximum 8 options allowed per question');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    const newOptionText = `Option ${nextOptionNumber}`;
    
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
      
      // Remove from original format
      delete updatedQuestion[optionId];
      
      return updatedQuestion;
    });
  };

  // Switch question type between single and multiple choice
  const changeQuestionType = (newType) => {
    setEditedQuestion(prev => {
      const updatedQuestion = { ...prev, questionType: newType };
      
      // Reset correct options based on new type
      if (newType === 'single_choice') {
        // For single choice, select only the first correct option
        const correctOptions = parseCorrectOptions(prev);
        
        if (correctOptions.length > 0) {
          updatedQuestion.correctOption = correctOptions[0];
        } else {
          // If no correct options, select the first available option
          const firstOption = prev.options[0];
          if (firstOption) {
            updatedQuestion.correctOption = firstOption.id;
          } else {
            updatedQuestion.correctOption = '';
          }
        }
      } else {
        // For multiple choice, keep current selection but ensure it's in slash format
        const correctOptions = parseCorrectOptions(prev);
        if (correctOptions.length > 0) {
          updatedQuestion.correctOption = correctOptions.join('/');
        }
      }
      
      return updatedQuestion;
    });
  };

  // Parse correct options for highlighting - UPDATED TO MATCH QuestionCategoryImport
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

  // Check if an option is correct - UPDATED TO MATCH QuestionCategoryImport
  const isCorrectOption = (question, optionId) => {
    const correctOptions = parseCorrectOptions(question);
    return correctOptions.includes(optionId);
  };

  // Save question 
  const handleSaveQuestion = async () => {
    const { user, token } = getUserData();
  
    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      navigate("/login");
      return;
    }
  
    setSaving(true);
    try {
      // Prepare question data by removing the options array (keep original format)
      const { options, ...questionToSave } = editedQuestion;
  
      // Convert correctOption format back to comma-separated if it's slash-separated
      if (questionToSave.correctOption && questionToSave.correctOption.includes('/')) {
        questionToSave.correctOption = questionToSave.correctOption.replace(/\//g, ',');
      }
  
      const response = await axios.post(UPDATE_QUESTION_URL, {
        questionsLibrary: questionToSave,
        user: user,
        token: token,
      });
  
      if (response.data && response.data.response === 'success') {
        alert('Question updated successfully!');
        
        // Update the current question to reflect the latest data
        const updatedQuestion = questions[currentQuestion - 1];
        setEditedQuestion(updatedQuestion);
      } else {
        alert(response.data?.message || 'Failed to update question');
      }
    } catch (err) {
      console.error("Error updating question:", err);
      alert('Error updating question. Please try again.');
    } finally {
      setSaving(false);
      await fetchQuestions();
    }
  };

  // Get current question details
  const currentQuestionData = editedQuestion || questions[currentQuestion - 1];

  if (!currentQuestionData) {
    return <div className={styles.loading}>Loading question data...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div className={styles.testInfo}>
          <span>Edit Mode: Question Library</span>
          <span>Question Type: {currentQuestionData.questionType}</span>
          <span>Question: {currentQuestion} of {questions.length}</span>
         
          <button 
            className={styles.backButton} 
            onClick={handleBackToDashboard}
          >
           ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.mainContent}>
          <div className={styles.questionSection}>
            <div className={styles.questionHeader}>
              <span>Edit Question {currentQuestion}</span>
              <button 
                className={styles.saveButton}
                onClick={handleSaveQuestion}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.editSection}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Question Description:</label>
                <div className={styles.quillContainer}>
                  <ReactQuill
                    value={currentQuestionData.description || ''}
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
                  value={currentQuestionData.marks || 1}
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
                      checked={currentQuestionData.questionType === 'single_choice'}
                      onChange={() => changeQuestionType('single_choice')} 
                    /> 
                    Single Choice
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="questionType"
                      checked={currentQuestionData.questionType === 'multiple_choice'}
                      onChange={() => changeQuestionType('multiple_choice')} 
                    /> 
                    Multiple Choice
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.optionsSection}>
              <div className={styles.optionsHeader}>
                <h4>Options:</h4>
                <button 
                  className={styles.addOptionButton}
                  onClick={handleAddOption}
                  disabled={currentQuestionData.options && currentQuestionData.options.length >= 8}
                >
                  + Add Option
                </button>
              </div>
              
              {currentQuestionData.options && currentQuestionData.options.map((option, index) => (
                <div 
                  key={option.id} 
                  className={`${styles.optionEdit} ${
                    isInstructor && isCorrectOption(currentQuestionData, option.id) ? styles.correctOption : ''
                  }`}
                >
                  <div className={styles.optionHeader}>
                    <label className={styles.correctCheckbox}>
                      {currentQuestionData.questionType === 'single_choice' ? (
                        <input
                          type="radio"
                          name="correctOption"
                          checked={isCorrectOption(currentQuestionData, option.id)}
                          onChange={() => handleCorrectOptionToggle(option.id)}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={isCorrectOption(currentQuestionData, option.id)}
                          onChange={() => handleCorrectOptionToggle(option.id)}
                        />
                      )}
                     
                    </label>
                    <button 
                      className={styles.removeOptionButton}
                      onClick={() => handleDeleteOption(option.id)}
                      disabled={currentQuestionData.options.length <= 2}
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
                  {isInstructor && isCorrectOption(currentQuestionData, option.id) && (
                    <span className={styles.correctOptionMarker}></span>
                  )}
                </div>
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
                disabled={currentQuestion === questions.length}
              >
                Next
              </button>
            </div>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.questionsSection}>
              <h3>Questions</h3>
              <div className={styles.questionBubblesContainer}>
                {questions.map((_, index) => (
                  <div 
                    key={index} 
                    className={`${styles.questionBadge} ${
                      index + 1 === currentQuestion ? styles.activeQuestion : ''
                    }`}
                    onClick={() => handleQuestionSelect(index)}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionEdit;
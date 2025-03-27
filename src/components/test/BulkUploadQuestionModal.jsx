import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { addQuestions } from '../../features/test/testActions';
import styles from './BulkUploadQuestionModal.module.css';

const BulkUploadQuestionModal = ({ isOpen, onClose, testId }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [questions, setQuestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { loading } = useSelector((state) => state.tests);
  const questionsPerPage = 5;

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem('user')),
        token: sessionStorage.getItem('token'),
        role: sessionStorage.getItem('role'),
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return { user: null, token: null, role: null };
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Sno', 'Description', "Marks",'TYPE (single_choice/multiple_choice)', 'option1(A)', 'option2(B)', 'option3(C)', 'option4(D)', 'option5(E)', 'option6(F)', 'option7(G)', 'option8(H)', 'Correct Answer (a,b,c if multiple, b if single)'],
     ]);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions Template');
    
    XLSX.writeFile(workbook, 'question_upload_template.xlsx');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setErrorMessage('');
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Remove header row
        const processedData = data.slice(1).map((row, index) => {
          // Validate basic structure
          if (row.length < 12) {
            throw new Error(`Row ${index + 2} is incomplete`);
          }

          // Prepare options dynamically
          const options = [];
          for (let i = 4; i <= 11; i++) {
            if (row[i]) {
              options.push({
                id: `option${options.length + 1}`,
                text: row[i],
                isCorrect: false
              });
            }
          }

          // Process correct answers
          const correctAnswerStr = row[12] ? row[12].toString().toLowerCase() : '';
          const correctOptions = correctAnswerStr.split(',').map(a => a.trim());

          // Mark correct options
          options.forEach((opt, idx) => {
            opt.isCorrect = correctOptions.includes(String.fromCharCode(97 + idx));
          });

          return {
            id: row[0] || index + 1,
            description: row[1] || '',
            questionType: row[3] === 'multiple_choice' ? 'multiple_choice' : 'single_choice',
            marks: row[2], 
            options
          };
        });

        setQuestions(processedData);
        setIsPreviewMode(true);
        setCurrentPage(1);
      } catch (error) {
        setErrorMessage(`Error processing file: ${error.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Update option text
  const handleOptionTextChange = (questionIndex, optionIndex, newText) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex].text = newText;
    setQuestions(updatedQuestions);
  };

  // Toggle correct option
  const handleCorrectOptionToggle = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    const currentQuestion = updatedQuestions[questionIndex];
    const currentOption = currentQuestion.options[optionIndex];

    // For single-choice, unselect all other options
    if (currentQuestion.questionType === 'single_choice') {
      currentQuestion.options.forEach(opt => opt.isCorrect = false);
    }

    // Toggle the current option
    currentOption.isCorrect = !currentOption.isCorrect;
    
    setQuestions(updatedQuestions);
  };

  // Add new option
  const handleAddOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    const currentQuestion = updatedQuestions[questionIndex];
    
    // Limit to 8 options
    if (currentQuestion.options.length >= 8) {
      setErrorMessage('Maximum 8 options allowed per question');
      return;
    }

    currentQuestion.options.push({
      id: `option${currentQuestion.options.length + 1}`,
      text: `Option ${currentQuestion.options.length + 1}`,
      isCorrect: false
    });

    setQuestions(updatedQuestions);
  };

  // Delete option
  const handleDeleteOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    const currentQuestion = updatedQuestions[questionIndex];
    
    // Ensure at least two options remain
    if (currentQuestion.options.length <= 2) {
      setErrorMessage('At least two options must be present');
      return;
    }

    // Validate option deletion for different question types
    if (currentQuestion.questionType === 'single_choice') {
      // For single choice, ensure one correct option remains
      const correctOptionsCount = currentQuestion.options.filter(opt => opt.isCorrect).length;
      if (correctOptionsCount <= 1 && currentQuestion.options[optionIndex].isCorrect) {
        setErrorMessage('Must have one correct option for single-choice question');
        return;
      }
    } else {
      // For multiple choice, ensure at least one correct option remains
      const correctOptionsCount = currentQuestion.options.filter(opt => opt.isCorrect).length;
      if (correctOptionsCount <= 1 && currentQuestion.options[optionIndex].isCorrect) {
        setErrorMessage('Must have at least one correct option for multiple-choice question');
        return;
      }
    }

    // Remove the option
    currentQuestion.options.splice(optionIndex, 1);

    // Reindex options
    currentQuestion.options.forEach((opt, idx) => {
      opt.id = `option${idx + 1}`;
    });

    setQuestions(updatedQuestions);
  };

  // Delete question
  const handleDeleteQuestion = (questionIndex) => {
    const updatedQuestions = [...questions];
    
    // Ensure at least one question remains
    if (updatedQuestions.length <= 1) {
      setErrorMessage('At least one question must be present');
      return;
    }

    // Remove the question
    updatedQuestions.splice(questionIndex, 1);

    setQuestions(updatedQuestions);
    setCurrentPage(Math.min(currentPage, Math.ceil(updatedQuestions.length / questionsPerPage)));
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    // Validate questions before submission
    const validationErrors = questions.map((question, index) => {
      // Check if question description exists
      if (!question.description.trim()) {
        return `Question ${index + 1}: Description is required`;
      }

      // Check correct options for each question type
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (question.questionType === 'single_choice' && correctOptions.length !== 1) {
        return `Question ${index + 1}: Must have exactly one correct option`;
      }
      if (question.questionType === 'multiple_choice' && correctOptions.length < 1) {
        return `Question ${index + 1}: Must have at least one correct option`;
      }

      return null;
    }).filter(error => error !== null);

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join('. '));
      return;
    }

    const { user, token, role } = getUserData();
    if (!user || !token) {
      setErrorMessage('User session data is missing. Please log in again.');
      return;
    }

    const questionList = questions.map(question => {
      const optionFields = {};
      question.options.forEach((option, index) => {
        optionFields[`option${index + 1}`] = option.text;
      });

      const correctOptions = question.options
        .filter(option => option.isCorrect)
        .map((option, index) => `option${index + 1}`)
        .join('/');

      return {
        description: question.description,
        questionType: question.questionType,
        marks: question.marks,
        ...optionFields,
        correctOption: correctOptions
      };
    });

    try {
      const resultAction = await dispatch(
        addQuestions({
          user,
          token,
          role,
          testId,
          questionList
        })
      );

      if (addQuestions.fulfilled.match(resultAction)) {
        setSuccessMessage('All questions uploaded successfully!');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrorMessage('Failed to upload questions: ' + resultAction.payload);
      }
    } catch (error) {
      setErrorMessage('Failed to upload questions: ' + error.message);
    }
  };

  const renderQuestionPreview = () => {
    // Calculate pagination
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);

    // Calculate total pages
    const totalPages = Math.ceil(questions.length / questionsPerPage);

    return (
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Save Question</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {currentQuestions.map((question, questionDisplayIndex) => {
          // Calculate the actual question index in the original array
          const questionIndex = indexOfFirstQuestion + questionDisplayIndex;
          
          return (
            <div key={question.id} className={styles.questionContainer}>
              <div className={styles.questionTextArea}>
                <input 
                  type="text" 
                  value={question.description}
                  onChange={(e) => {
                    const updatedQuestions = [...questions];
                    updatedQuestions[questionIndex].description = e.target.value;
                    setQuestions(updatedQuestions);
                  }}
                  placeholder="Enter your question here"
                />
              </div>

              <div className={styles.marksSection}>
                <label>Marks</label>
                <input 
                  type="number" 
                  value={question.marks}
                  onChange={(e) => {
                    const updatedQuestions = [...questions];
                    updatedQuestions[questionIndex].marks = e.target.value;
                    setQuestions(updatedQuestions);
                  }}
                  placeholder="1"
                />
              </div>

              <div className={styles.questionTypeSection}>
                <label>Question Type</label>
                <div className={styles.radioGroup}>
                  <label>
                    <input 
                      type="radio" 
                      name={`questionType-${questionIndex}`}
                      checked={question.questionType === 'single_choice'}
                      onChange={() => {
                        const updatedQuestions = [...questions];
                        updatedQuestions[questionIndex].questionType = 'single_choice';
                        // Ensure only one option is correct for single choice
                        const correctOptions = updatedQuestions[questionIndex].options.filter(opt => opt.isCorrect);
                        if (correctOptions.length > 1) {
                          updatedQuestions[questionIndex].options.forEach(opt => opt.isCorrect = false);
                          correctOptions[0].isCorrect = true;
                        }
                        setQuestions(updatedQuestions);
                      }}
                    /> 
                    Single Choice
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name={`questionType-${questionIndex}`}
                      checked={question.questionType === 'multiple_choice'}
                      onChange={() => {
                        const updatedQuestions = [...questions];
                        updatedQuestions[questionIndex].questionType = 'multiple_choice';
                        setQuestions(updatedQuestions);
                      }}
                    /> 
                    Multiple Choice
                  </label>
                </div>
              </div>

              <div className={styles.answerOptionsSection}>
                <label>Answer Options</label>
                <button className={styles.addOptionButton}>+ Add Option</button>
                
                {question.options.map((option, optionIndex) => (
                  <div 
                    key={option.id} 
                    className={`${styles.optionRow} ${option.isCorrect ? styles.correctOption : ''}`}
                  >
                    {question.questionType === 'single_choice' ? (
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        checked={option.isCorrect}
                        onChange={() => handleCorrectOptionToggle(questionIndex, optionIndex)}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        name={`question-${questionIndex}`}
                        checked={option.isCorrect}
                        onChange={() => handleCorrectOptionToggle(questionIndex, optionIndex)}
                      />
                    )}
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionTextChange(questionIndex, optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <button 
                      onClick={() => handleDeleteOption(questionIndex, optionIndex)}
                      disabled={question.options.length <= 2}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Pagination Controls */}
        <div className={styles.paginationControls}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>{`Page ${currentPage} of ${totalPages}`}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={() => setIsPreviewMode(false)}
          >
            Cancel
          </button>
          <button 
            className={styles.saveButton}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save All Questions'}
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      {!isPreviewMode ? (
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>Bulk Upload Questions</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          {errorMessage && (
            <div className={styles.errorMessage}>{errorMessage}</div>
          )}
          {successMessage && (
            <div className={styles.successMessage}>{successMessage}</div>
          )}

          <div className={styles.uploadSection}>
            <button 
              onClick={downloadTemplate} 
              className={styles.downloadTemplateButton}
            >
              Download Template
            </button>
            <div className={styles.fileUploadContainer}>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className={styles.fileInput}
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                className={styles.uploadButton}
              >
                Upload Excel File
              </button>
            </div>
          </div>
        </div>
      ) : (
        renderQuestionPreview()
      )}
    </div>
  );
};

export default BulkUploadQuestionModal;
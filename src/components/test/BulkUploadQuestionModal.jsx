import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { addQuestions } from '../../features/test/testActions';
import styles from './BulkUploadQuestionModal.module.css';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

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
      ['code-block'], // Add code block support
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'script',
    'color', 'background',
    'link',
    'code-block' // Add code block format
  ];

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

  // Enhanced function to format text content properly
  const formatTextContent = (text) => {
    if (!text) return '<p></p>';
    
    // Convert to string if it's not already
    const textStr = text.toString();
    
    // If it already contains HTML tags, return as is
    if (textStr.includes('<') && textStr.includes('>')) {
      return textStr;
    }
    
    // Enhanced parsing for code and formatting
    let formattedText = textStr;
    
    // Handle code blocks (text between triple backticks or common code patterns)
    // Pattern 1: Triple backticks
    formattedText = formattedText.replace(/```([\s\S]*?)```/g, '<pre class="ql-syntax">$1</pre>');
    
    // Pattern 2: Inline code (single backticks)
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Pattern 3: Common programming patterns (functions, variables, etc.)
    // Detect lines that look like code (contain common programming syntax)
    const lines = formattedText.split('\n');
    const processedLines = lines.map(line => {
      const trimmedLine = line.trim();
      
      // Check if line looks like code (contains programming syntax)
      const codePatterns = [
        /^\s*(function|const|let|var|if|for|while|class|def|public|private|protected)\s/,
        /^\s*[\w\$_]+\s*\([^)]*\)\s*[{=]/,
        /^\s*[\w\$_]+\s*=\s*.+[;,]/,
        /^\s*[{}()[\];]/,
        /^\s*\/\/|^\s*\/\*|^\s*\*/,
        /^\s*#include|^\s*import|^\s*from/,
        /^\s*<\w+.*>.*<\/\w+>/,
        /^\s*\w+\.\w+\(/
      ];
      
      const looksLikeCode = codePatterns.some(pattern => pattern.test(trimmedLine));
      
      if (looksLikeCode && !line.includes('<pre') && !line.includes('<code')) {
        return line; // Keep as is for code block formatting
      }
      
      return line;
    });
    
    // If multiple lines and many look like code, wrap in code block
    const codeLines = processedLines.filter(line => {
      const trimmedLine = line.trim();
      const codePatterns = [
        /^\s*(function|const|let|var|if|for|while|class|def|public|private|protected)\s/,
        /^\s*[\w\$_]+\s*\([^)]*\)\s*[{=]/,
        /^\s*[\w\$_]+\s*=\s*.+[;,]/,
        /^\s*[{}()[\];]/
      ];
      return codePatterns.some(pattern => pattern.test(trimmedLine));
    });
    
    if (lines.length > 1 && codeLines.length > lines.length * 0.3) {
      // If more than 30% of lines look like code, treat as code block
      formattedText = `<pre class="ql-syntax">${formattedText}</pre>`;
    } else {
      // Handle line breaks properly
      formattedText = formattedText.replace(/\n/g, '<br>');
      
      // Wrap in paragraph if not already wrapped
      if (!formattedText.includes('<p>') && !formattedText.includes('<pre>')) {
        formattedText = `<p>${formattedText}</p>`;
      }
    }
    
    return formattedText;
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
        
      const filteredData = data.slice(1).filter((row, index) => {
        // Check if Sno (first column) exists and is not empty
        const sno = row[0];
        return sno !== null && sno !== undefined && sno !== '' && sno.toString().trim() !== '';
      });

      const processedData = filteredData.map((row, index) => {
        // Validate basic structure
        if (row.length < 12) {
          throw new Error(`Row with Sno ${row[0]} is incomplete`);
        }

        
          // Prepare options dynamically - FIX: Handle zero values properly
          const options = [];
          for (let i = 4; i <= 11; i++) {
            // Check for null, undefined, and empty string, but allow 0 and other falsy values like false
            if (row[i] !== null && row[i] !== undefined && row[i] !== '') {
              options.push({
                id: `option${options.length + 1}`,
                text: row[i].toString(), // Convert to string to handle numbers properly
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

          // FIX: Enhanced description formatting for code and other content
          const description = row[1] || '';
          const formattedDescription = formatTextContent(description);

          return {
            id: row[0] || index + 1,
            description: formattedDescription,
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

  // Handle description change with ReactQuill
  const handleDescriptionChange = (questionIndex, content) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].description = content;
    setQuestions(updatedQuestions);
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

  // In the handleSubmit function, update the questionList processing:
  const handleSubmit = async () => {
    setErrorMessage('');

    // Validate questions before submission
    const validationErrors = questions.map((question, index) => {
      // Check if question description exists and is not empty HTML
      const hasContent = question.description.trim() !== "" && 
                       question.description !== "<p><br></p>" &&
                       question.description !== "<p></p>";
                       
      if (!hasContent) {
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

      // Find the actual option numbers that are marked as correct
      const correctOptions = question.options
        .map((option, index) => ({ index: index + 1, isCorrect: option.isCorrect }))
        .filter(option => option.isCorrect)
        .map(option => `option${option.index}`)
        .join('/');

      return {
        description: question.description, // HTML content from ReactQuill
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

        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        {currentQuestions.map((question, questionDisplayIndex) => {
          // Calculate the actual question index in the original array
          const questionIndex = indexOfFirstQuestion + questionDisplayIndex;
          
          return (
            <div key={question.id} className={styles.questionContainer}>
              <div className={styles.questionTextArea}>
                {/* Replace input with ReactQuill */}
                <div className={styles.quillContainer}>
                  <ReactQuill
                    value={question.description}
                    onChange={(content) => handleDescriptionChange(questionIndex, content)}
                    modules={modules}
                    formats={formats}
                    placeholder="Enter your question here"
                  />
                </div>
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
                        const currentQuestion = updatedQuestions[questionIndex];
                        
                        // Change question type to single choice
                        currentQuestion.questionType = 'single_choice';
                        
                        // Clear all current correct options
                        currentQuestion.options.forEach(opt => opt.isCorrect = false);
                        
                        // If there are options, select the first one as default
                        if (currentQuestion.options.length > 0) {
                          currentQuestion.options[0].isCorrect = true;
                        }
                        
                        setQuestions(updatedQuestions);
                        setErrorMessage('Please select the correct option for the single-choice question.');
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
                        const currentQuestion = updatedQuestions[questionIndex];
                        
                        // Change question type to multiple choice
                        currentQuestion.questionType = 'multiple_choice';
                        
                        // Clear all current correct options
                        currentQuestion.options.forEach(opt => opt.isCorrect = false);
                        
                        setQuestions(updatedQuestions);
                        setErrorMessage('Please select at least one correct option for the multiple-choice question.');
                      }}
                    /> 
                    Multiple Choice
                  </label>
                </div>
              </div>

              <div className={styles.answerOptionsSection}>
                <label>Answer Options</label>
                <button 
                  className={styles.addOptionButton}
                  onClick={() => handleAddOption(questionIndex)}
                >
                  + Add Option
                </button>
                
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
              
              <div className={styles.questionActions}>
                <button 
                  className={styles.deleteQuestionButton}
                  onClick={() => handleDeleteQuestion(questionIndex)}
                  disabled={questions.length <= 1}
                >
                  Delete Question
                </button>
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
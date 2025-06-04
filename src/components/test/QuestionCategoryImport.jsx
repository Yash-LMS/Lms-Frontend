import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import styles from './QuestionRandomModal.module.css';
import { 
  VIEW_QUESTION_DISTINCT_CATEGORY_URL, 
  VIEW_QUESTION_BY_CATEGORY_Library_URL,
  VIEW_QUESTION_DISTINCT_SUB_CATEGORY_URL,
  ADD_QUESTION_URL 
} from '../../constants/apiConstants';
import SuccessModal from "../../assets/SuccessModal";

const QuestionCategoryImport = ({ 
  testId, 
  onClose,
  isOpen
}) => {
  // If modal is not open, don't render anything
  if (!isOpen) return null;

  const [categories, setCategories] = useState([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState({}); // Map of category to array of subcategories
  const [selectedItems, setSelectedItems] = useState([
    { category: '', subcategory: '', questionLevel: 'easy', questionCount: 1 }
  ]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [editMode, setEditMode] = useState({}); // Track which questions are in edit mode

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

  // Fetch distinct categories on component mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems([{ category: '', subcategory: '', questionLevel: 'easy', questionCount: 1 }]);
      setQuestions([]);
      setError(null);
      setSelectedQuestions({});
      setEditMode({});
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${VIEW_QUESTION_DISTINCT_CATEGORY_URL}`);
      if (response.data.response === 'success') {
        setCategories(response.data.payload || []);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (err) {
      setError('Error fetching categories: ' + err.message);
    }
  };

  const fetchSubCategories = async (category) => {
    // If we already have subcategories for this category, no need to fetch again
    if (subcategoriesMap[category]) {
      return;
    }

    try {
      const response = await axios.get(`${VIEW_QUESTION_DISTINCT_SUB_CATEGORY_URL}?category=${category}`);
      if (response.data.response === 'success') {
        // Store subcategories for this category
        setSubcategoriesMap(prev => ({
          ...prev,
          [category]: response.data.payload || []
        }));
      } else {
        setError('Failed to fetch subcategories');
      }
    } catch (err) {
      setError('Error fetching subcategories: ' + err.message);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...selectedItems];
    
    // If category is changing, reset the subcategory
    if (field === 'category') {
      newItems[index] = { 
        ...newItems[index], 
        [field]: value,
        subcategory: '' // Reset subcategory when category changes
      };
      
      // Fetch subcategories for this category if not already fetched
      if (value) {
        fetchSubCategories(value);
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setSelectedItems(newItems);
  };

  const addItem = () => {
    setSelectedItems([
      ...selectedItems,
      { category: '', subcategory: '', questionLevel: 'easy', questionCount: 1 }
    ]);
  };

  const removeItem = (index) => {
    if (selectedItems.length > 1) {
      const newItems = selectedItems.filter((_, i) => i !== index);
      setSelectedItems(newItems);
    }
  };

  const fetchQuestions = async () => {
    // Validate inputs
    if (selectedItems.some(item => !item.category)) {
      setError('Please select a category for all items');
      return;
    }

    setLoading(true);
    setError(null);
    const { user, token } = getUserData();
    try {
      const payload = {
        user: user,
        token: token,
        libraryQuestionList: selectedItems.map(item => ({
          category: item.category,
          subCategory: item.subcategory,
          questionLevel: item.questionLevel
        }))
      };

      const response = await axios.post(`${VIEW_QUESTION_BY_CATEGORY_Library_URL}`, payload);
      
      if (response.data.response === 'success') {
        console.log(response.data.payload);
        
        // Transform the question data to have an options array for each question
        const transformedQuestions = response.data.payload.map(question => {
          // Create an options array from the option fields
          const options = [];
          for (let i = 1; i <= 8; i++) {
            const optionKey = `option${i}`;
            if (question[optionKey]) {
              options.push({
                id: optionKey,
                text: question[optionKey]
              });
            }
          }
          
          // Return the question with the options array added
          return {
            ...question,
            options
          };
        });
        
        setQuestions(transformedQuestions);
        // Reset selected questions
        setSelectedQuestions({});
        setEditMode({});
      } else {
        setError(response.data.message || 'Failed to fetch questions');
      }
    } catch (err) {
      setError('Error fetching questions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle question selection
  const toggleQuestionSelection = (questionIndex) => {
    // Don't allow selection if question is in edit mode
    if (editMode[questionIndex]) return;

    setSelectedQuestions(prev => {
      const newSelections = { ...prev };
      if (newSelections[questionIndex]) {
        delete newSelections[questionIndex];
      } else {
        newSelections[questionIndex] = true;
      }
      return newSelections;
    });
  };

  // Handle checkbox click specifically - without affecting the card click behavior
  const handleCheckboxClick = (e, questionIndex) => {
    e.stopPropagation(); // Prevent event bubbling (card click)
    toggleQuestionSelection(questionIndex);
  };

  // Select all questions function
  const selectAllQuestions = () => {
    const allQuestions = {};
    
    // Only select questions that are not in edit mode
    questions.forEach((_, index) => {
      if (!editMode[index]) {
        allQuestions[index] = true;
      }
    });
    
    setSelectedQuestions(allQuestions);
  };

  // Deselect all questions function
  const deselectAllQuestions = () => {
    setSelectedQuestions({});
  };

  // Toggle all questions selection
  const toggleSelectAll = () => {
    const selectedCount = Object.keys(selectedQuestions).length;
    const selectableCount = questions.length - Object.keys(editMode).length;
    
    if (selectedCount === selectableCount) {
      deselectAllQuestions();
    } else {
      selectAllQuestions();
    }
  };

  // Toggle edit mode for a question
  const toggleEditMode = (questionIndex) => {
    setEditMode(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
    
    // Deselect the question if it's selected and going into edit mode
    if (selectedQuestions[questionIndex]) {
      setSelectedQuestions(prev => {
        const newSelections = { ...prev };
        delete newSelections[questionIndex];
        return newSelections;
      });
    }
  };

  // Handle description change with ReactQuill
  const handleDescriptionChange = (questionIndex, content) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].description = content;
    setQuestions(updatedQuestions);
  };

  // Handle option text change
  const handleOptionTextChange = (questionIndex, optionId, newText) => {
    const updatedQuestions = [...questions];
    const optionIndex = updatedQuestions[questionIndex].options.findIndex(opt => opt.id === optionId);
    
    if (optionIndex !== -1) {
      updatedQuestions[questionIndex].options[optionIndex].text = newText;
      // Also update the original format option field
      updatedQuestions[questionIndex][optionId] = newText;
      setQuestions(updatedQuestions);
    }
  };

  // Toggle correct option for a question
  const handleCorrectOptionToggle = (questionIndex, optionId) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    // For single_choice questions, unselect all other options
    if (question.questionType === 'single_choice') {
      question.correctOption = optionId;
    } else if (question.questionType === 'multiple_choice') {
      // For multiple_choice, toggle this option in the list
      const currentOptions = question.correctOption ? question.correctOption.split('/') : [];
      const isSelected = currentOptions.includes(optionId);
      
      if (isSelected) {
        // Remove this option if it's already selected
        if (currentOptions.length > 1) { // Ensure at least one option remains selected
          question.correctOption = currentOptions.filter(opt => opt !== optionId).join('/');
        }
      } else {
        // Add this option if it's not already selected
        currentOptions.push(optionId);
        question.correctOption = currentOptions.join('/');
      }
    }
    
    setQuestions(updatedQuestions);
  };

  // Add new option to a question
  const handleAddOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    // Maximum 8 options
    if (question.options.length >= 8) {
      setError('Maximum 8 options allowed per question');
      return;
    }
    
    // Create a new option
    const newOptionId = `option${question.options.length + 1}`;
    const newOptionText = `Option ${question.options.length + 1}`;
    
    // Add to options array
    question.options.push({
      id: newOptionId,
      text: newOptionText
    });
    
    // Also add to the original format
    question[newOptionId] = newOptionText;
    
    // If this is the first option and it's single choice, make it correct by default
    if (question.options.length === 1 && question.questionType === 'single_choice') {
      question.correctOption = newOptionId;
    }
    
    // If this is the first option and it's multiple choice with no correct options
    if (question.options.length === 1 && question.questionType === 'multiple_choice' && !question.correctOption) {
      question.correctOption = newOptionId;
    }
    
    setQuestions(updatedQuestions);
  };

  // Delete option from a question  
  const handleDeleteOption = (questionIndex, optionId) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    // Ensure at least two options remain
    if (question.options.length <= 2) {
      setError('At least two options must be present');
      return;
    }
    
    // Find the option's index
    const optionIndex = question.options.findIndex(opt => opt.id === optionId);
    if (optionIndex === -1) return;
    
    // Check if this is a correct option
    const isCorrectOption = question.correctOption === optionId || 
                           (question.correctOption && question.correctOption.split('/').includes(optionId));
    
    if (isCorrectOption) {
      // If this is a correct option in a single choice question
      if (question.questionType === 'single_choice') {
        // Find another option to make correct
        const otherOption = question.options.find(opt => opt.id !== optionId);
        if (otherOption) {
          question.correctOption = otherOption.id;
        }
      } else {
        // For multiple choice, remove this from correct options
        const correctOptions = question.correctOption.split('/').filter(opt => opt !== optionId);
        
        // If no correct options would remain, don't allow deletion
        if (correctOptions.length === 0) {
          setError('Question must have at least one correct option');
          return;
        }
        
        question.correctOption = correctOptions.join('/');
      }
    }
    
    // Remove the option
    question.options.splice(optionIndex, 1);
    
    // Also remove from original format
    delete question[optionId];
    
    // Reindex options
    const newOptions = [];
    for (let i = 0; i < question.options.length; i++) {
      const oldOption = question.options[i];
      const newOptionId = `option${i + 1}`;
      
      // Check if this was a correct option
      let isThisCorrect = false;
      if (question.questionType === 'single_choice') {
        isThisCorrect = question.correctOption === oldOption.id;
      } else {
        isThisCorrect = question.correctOption && question.correctOption.split('/').includes(oldOption.id);
      }
      
      // Update correctOption references
      if (isThisCorrect) {
        if (question.questionType === 'single_choice') {
          question.correctOption = newOptionId;
        } else {
          const correctOptions = question.correctOption.split('/');
          const updatedCorrectOptions = correctOptions.map(opt => 
            opt === oldOption.id ? newOptionId : opt
          );
          question.correctOption = updatedCorrectOptions.join('/');
        }
      }
      
      // Create new option with new ID
      newOptions.push({
        id: newOptionId,
        text: oldOption.text
      });
      
      // Update in original format
      question[newOptionId] = oldOption.text;
      if (oldOption.id !== newOptionId) {
        delete question[oldOption.id];
      }
    }
    
    // Replace options array
    question.options = newOptions;
    
    setQuestions(updatedQuestions);
  };

  // Switch question type between single and multiple choice
  const changeQuestionType = (questionIndex, newType) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    question.questionType = newType;
    
    // Reset correct options based on new type
    if (newType === 'single_choice') {
      // For single choice, just select the first option
      const firstOption = question.options[0];
      if (firstOption) {
        question.correctOption = firstOption.id;
      } else {
        question.correctOption = '';
      }
    } else {
      // For multiple choice, default to the current correctOption
      // If it's already in the format with slashes, keep it
      // If not, just use the current single option
      if (!question.correctOption || !question.correctOption.includes('/')) {
        // Keep it as is, since it's probably a single option like "option1"
      }
    }
    
    setQuestions(updatedQuestions);
  };

  // Get count of selected questions
  const selectedCount = Object.keys(selectedQuestions).length;

  // Parse correct options for highlighting
  const parseCorrectOptions = (question) => {
    if (!question.correctOption) return [];
    
    if (question.questionType === 'single_choice') {
      return [question.correctOption];
    } else if (question.questionType === 'multiple_choice') {
      return question.correctOption.split('/');
    }
    return [];
  };

  // Check if an option is correct
  const isCorrectOption = (question, optionId) => {
    const correctOptions = parseCorrectOptions(question);
    return correctOptions.includes(optionId);
  };

  // Handle import of selected questions
  const handleImportQuestions = async () => {
    if (selectedCount === 0) {
      setError('Please select at least one question to import');
      return;
    }

    const questionsToImport = questions
      .filter((_, index) => selectedQuestions[index])
      .map(question => {
        // Restructure question to match API expectations
        // Remove the options array that we added for UI
        const { options, ...questionData } = question;
        return questionData;
      });
      
    setLoading(true);
    
    try {
      const { user, token } = getUserData();
      
      // Prepare API request payload
      const apiPayload = {
        user: user,
        token: token,
        testId: testId,
        questionList: questionsToImport
      };

      console.log(apiPayload);
      
      // Make API call to add questions to the test
      const response = await axios.post(ADD_QUESTION_URL, apiPayload);
      
      if (response.data.response === 'success') {
        // Replace alert with success modal
        setSuccessMessage("Questions added successfully!");
        setShowSuccessModal(true);
      } else {
        setError(response.data.message || 'Failed to import questions');
      }
    } catch (err) {
      setError('Error importing questions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose(); // Close the main modal after success
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Import All Questions</h2>
          {testId && <div className={styles.testId}>Test ID: {testId}</div>}
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.selectionArea}>
            <h3>Select Questions</h3>
            
            {selectedItems.map((item, index) => (
              <div key={index} className={styles.selectionRow}>
                <select
                  value={item.category}
                  onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                {/* Subcategory dropdown - only appears after category is selected */}
                <select
                  value={item.subcategory}
                  onChange={(e) => handleItemChange(index, 'subcategory', e.target.value)}
                  className={styles.select}
                  disabled={!item.category}
                >
                  <option value="">Select Subcategory</option>
                  {item.category && subcategoriesMap[item.category] && 
                    subcategoriesMap[item.category].map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))
                  }
                </select>
                
                <select
                  value={item.questionLevel}
                  onChange={(e) => handleItemChange(index, 'questionLevel', e.target.value)}
                  className={styles.select}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                
                <button 
                  onClick={() => removeItem(index)}
                  className={styles.removeButton}
                  disabled={selectedItems.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            
            <div className={styles.buttonGroup}>
              <button onClick={addItem} className={styles.addButton}>
                Add Category
              </button>
              
              <button 
                onClick={fetchQuestions} 
                className={styles.fetchButton}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Fetch Questions'}
              </button>
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
          </div>

          {questions.length > 0 && (
            <>
              <div className={styles.questionsHeader}>
                <h3>Questions ({questions.length})</h3>
                <div className={styles.selectionInfo}>
                  <button 
                    onClick={toggleSelectAll}
                    className={styles.selectAllButton}
                    disabled={loading || questions.length === 0}
                  >
                    {selectedCount === questions.length - Object.keys(editMode).length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span>{selectedCount} questions selected</span>
                  <button 
                    onClick={handleImportQuestions}
                    className={styles.importButton}
                    disabled={selectedCount === 0 || loading}
                  >
                    {loading ? 'Importing...' : 'Import Selected'}
                  </button>
                </div>
              </div>
              
              <div className={styles.questionsContainer}>
                
                {questions.map((question, index) => (
                  <div 
                    key={index} 
                    className={`${styles.questionCard} ${selectedQuestions[index] ? styles.selectedCard : ''} ${editMode[index] ? styles.editModeCard : ''}`}
                    onClick={() => !editMode[index] && toggleQuestionSelection(index)}
                  >
                   
                    <div className={styles.questionHeader}>
                      <span className={styles.questionNumber}>Q{index + 1}</span>
                      <span className={styles.questionType}>
                        {question.questionType === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                      </span>
                      <span className={styles.marks}>{question.marks} marks</span>
                      <div className={styles.questionControls}>
                        <button 
                          className={styles.editButton} 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEditMode(index);
                          }}
                        >
                          {editMode[index] ? 'Save' : 'Edit'}
                        </button>
                        {!editMode[index] && (
                          <div className={styles.checkbox}>
                            <input 
                              type="checkbox" 
                              checked={!!selectedQuestions[index]} 
                              onChange={(e) => handleCheckboxClick(e, index)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {editMode[index] ? (
                      <div className={styles.editModeContainer}>
                        {/* Question description editor */}
                        <div className={styles.quillContainer}>
                          <ReactQuill
                            value={question.description}
                            onChange={(content) => handleDescriptionChange(index, content)}
                            modules={modules}
                            formats={formats}
                            placeholder="Enter your question here"
                          />
                        </div>

                        {/* Marks input */}
                        <div className={styles.marksEditor}>
                          <label>Marks:</label>
                          <input 
                            type="number" 
                            value={question.marks}
                            onChange={(e) => {
                              const updatedQuestions = [...questions];
                              updatedQuestions[index].marks = e.target.value;
                              setQuestions(updatedQuestions);
                            }}
                            className={styles.marksInput}
                          />
                        </div>

                        {/* Question type selector */}
                        <div className={styles.questionTypeEditor}>
                          <label>Question Type:</label>
                          <div className={styles.radioGroup}>
                            <label>
                              <input 
                                type="radio" 
                                name={`questionType-${index}`}
                                checked={question.questionType === 'single_choice'}
                                onChange={() => changeQuestionType(index, 'single_choice')} 
                              /> 
                              Single Choice
                            </label>
                            <label>
                              <input 
                                type="radio" 
                                name={`questionType-${index}`}
                                checked={question.questionType === 'multiple_choice'}
                                onChange={() => changeQuestionType(index, 'multiple_choice')} 
                              /> 
                              Multiple Choice
                            </label>
                          </div>
                        </div>

                        {/* Options editor with Add Option button */}
                        <div className={styles.optionsEditor}>
                          <div className={styles.optionsHeader}>
                            <h4>Options:</h4>
                            <button 
                              className={styles.addOptionButton}
                              onClick={() => handleAddOption(index)}
                              disabled={question.options.length >= 8}
                            >
                              + Add Option
                            </button>
                          </div>
                          
                          {question.options.map((option, optionIndex) => (
                            <div key={option.id} className={styles.optionEditor}>
                              {question.questionType === 'single_choice' ? (
                                <input
                                  type="radio"
                                  name={`question-${index}-options`}
                                  checked={isCorrectOption(question, option.id)}
                                  onChange={() => handleCorrectOptionToggle(index, option.id)}
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  name={`question-${index}-options`}
                                  checked={isCorrectOption(question, option.id)}
                                  onChange={() => handleCorrectOptionToggle(index, option.id)}
                                />
                              )}
                              <input
                                type="text"
                                value={option.text}
                                onChange={(e) => handleOptionTextChange(index, option.id, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                className={styles.optionInput}
                              />
                              <button 
                                className={styles.removeOptionButton}
                                onClick={() => handleDeleteOption(index, option.id)}
                                disabled={question.options.length <= 2}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: question.description || 'No question text available' }} />
                        
                        <div className={styles.options}>
                          {question.options.map((option, optionIndex) => {
                            const isCorrect = isCorrectOption(question, option.id);
                            
                            return (
                              <div 
                                key={option.id} 
                                className={`${styles.option} ${isCorrect ? styles.correctOption : ''}`}
                              >
                                <span className={styles.optionKey}>{optionIndex + 1}</span>
                                <span className={styles.optionValue}>{option.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal 
          message={successMessage} 
          onClose={handleSuccessModalClose} 
        />
      )}
    </div>
  );
};

export default QuestionCategoryImport;
import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './QuestionViewerModal.module.css';
import { 
  VIEW_QUESTION_DISTINCT_CATEGORY_URL, 
  VIEW_RANDOM_QUESTION_Library_URL,
  ADD_QUESTION_URL 
} from '../../constants/apiConstants';
import SuccessModal from "../../assets/SuccessModal";

const QuestionViewerModal = ({ 
  testId, 
  onClose,
  isOpen
}) => {
  // If modal is not open, don't render anything
  if (!isOpen) return null;

  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([
    { category: '', questionLevel: 'easy', questionCount: 1 }
  ]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      setSelectedItems([{ category: '', questionLevel: 'easy', questionCount: 1 }]);
      setQuestions([]);
      setError(null);
      setSelectedQuestions({});
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

  const handleItemChange = (index, field, value) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const addItem = () => {
    setSelectedItems([
      ...selectedItems,
      { category: '', questionLevel: 'easy', questionCount: 1 }
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
          questionLevel: item.questionLevel,
          questionCount: parseInt(item.questionCount, 10)
        }))
      };

      const response = await axios.post(`${VIEW_RANDOM_QUESTION_Library_URL}`, payload);
      
      if (response.data.response === 'success') {
        console.log(response.data.payload);
        setQuestions(response.data.payload);
        // Reset selected questions
        setSelectedQuestions({});
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

  // Get count of selected questions
  const selectedCount = Object.keys(selectedQuestions).length;

  // Parse correct options for highlighting
  const parseCorrectOptions = (question) => {
    if (question.questionType === 'single_choice') {
      return [question.correctOption];
    } else if (question.questionType === 'multiple_choice') {
      return question.correctOption.split('/');
    }
    return [];
  };

  // Render option with correct highlighting
  const renderOption = (question, optionKey, optionValue) => {
    if (!optionValue) return null; // Don't render empty options

    const correctOptions = parseCorrectOptions(question);
    const isCorrect = correctOptions.includes(optionKey);

    return (
      <div 
        key={optionKey} 
        className={`${styles.option} ${isCorrect ? styles.correctOption : ''}`}
      >
        <span className={styles.optionKey}>{optionKey.replace('option', '')}</span>
        <span className={styles.optionValue}>{optionValue}</span>
      </div>
    );
  };

  // Handle import of selected questions
  const handleImportQuestions = async () => {
    if (selectedCount === 0) {
      setError('Please select at least one question to import');
      return;
    }

    const questionsToImport = questions.filter((_, index) => selectedQuestions[index]);
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
          <h2 className={styles.modalTitle}>Import Random Questions</h2>
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
                
                <select
                  value={item.questionLevel}
                  onChange={(e) => handleItemChange(index, 'questionLevel', e.target.value)}
                  className={styles.select}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={item.questionCount}
                  onChange={(e) => handleItemChange(index, 'questionCount', e.target.value)}
                  className={styles.numberInput}
                />
                
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
                    className={`${styles.questionCard} ${selectedQuestions[index] ? styles.selectedCard : ''}`}
                    onClick={() => toggleQuestionSelection(index)}
                  >
                   
                    <div className={styles.questionHeader}>
                      <span className={styles.questionNumber}>Q{index + 1}</span>
                      <span className={styles.questionType}>
                        {question.questionType === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                      </span>
                      <span className={styles.marks}>{question.marks} marks</span>
                      <div className={styles.checkbox}>
                        <input 
                          type="checkbox" 
                          checked={!!selectedQuestions[index]} 
                          onChange={() => {}} // Handled by the div click
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    <div dangerouslySetInnerHTML={{ __html: question.description || 'No question text available' }} />
                    
                    <div className={styles.options}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => {
                        const optionKey = `option${num}`;
                        return renderOption(question, optionKey, question[optionKey]);
                      })}
                    </div>
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

export default QuestionViewerModal;
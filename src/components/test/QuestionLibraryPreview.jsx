import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './QuestionLibraryPreview.module.css';
import { 
  VIEW_QUESTION_DISTINCT_CATEGORY_URL, 
  VIEW_QUESTION_DISTINCT_SUB_CATEGORY_URL,
  VIEW_QUESTION_BY_CATEGORY_Library_URL
} from '../../constants/apiConstants';

const QuestionLibraryPreview = ({ isOpen, onClose }) => {
  // If modal is not open, don't render anything
  if (!isOpen) return null;

  const [categories, setCategories] = useState([]);
  const [subcategoriesMap, setSubcategoriesMap] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [questionLevel, setQuestionLevel] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);

  // Function to get user data from session storage
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

  // Fetch distinct categories on component mount
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('');
      setSelectedSubcategory('');
      setQuestionLevel('all');
      setQuestions([]);
      setShowQuestions(false);
      fetchCategories();
    }
  }, [isOpen]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory);
    }
  }, [selectedCategory]);

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

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedSubcategory('');
    setShowQuestions(false);
  };

  const handleSubcategoryChange = (e) => {
    setSelectedSubcategory(e.target.value);
    setShowQuestions(false);
  };

  const handleLevelChange = (e) => {
    setQuestionLevel(e.target.value);
    setShowQuestions(false);
  };

  const fetchQuestions = async () => {
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError(null);
    const { user, token } = getUserData();

    try {
      const payload = {
        user: user,
        token: token,
        libraryQuestionList: [{
          category: selectedCategory,
          subCategory: selectedSubcategory,
          questionLevel: questionLevel === 'all' ? '' : questionLevel
        }]
      };

      const response = await axios.post(`${VIEW_QUESTION_BY_CATEGORY_Library_URL}`, payload);
      
      if (response.data.response === 'success') {
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
          
          return {
            ...question,
            options
          };
        });
        
        setQuestions(transformedQuestions);
        setShowQuestions(true);
      } else {
        setError(response.data.message || 'Failed to fetch questions');
      }
    } catch (err) {
      setError('Error fetching questions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Preview Questions</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {!showQuestions ? (
            <div className={styles.selectionArea}>
              <h3>Select Category and Subcategory</h3>
              
              <div className={styles.selectionRow}>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className={styles.select}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                <select
                  value={selectedSubcategory}
                  onChange={handleSubcategoryChange}
                  className={styles.select}
                  disabled={!selectedCategory}
                >
                  <option value="">All Subcategories</option>
                  {selectedCategory && subcategoriesMap[selectedCategory] && 
                    subcategoriesMap[selectedCategory].map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))
                  }
                </select>
                
                <select
                  value={questionLevel}
                  onChange={handleLevelChange}
                  className={styles.select}
                >
                  <option value="all">Select Level</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div className={styles.buttonGroup}>
                <button 
                  onClick={fetchQuestions} 
                  className={styles.previewButton}
                  disabled={loading || !selectedCategory}
                >
                  {loading ? 'Loading...' : 'Preview Questions'}
                </button>
              </div>
              
              {error && <div className={styles.error}>{error}</div>}
            </div>
          ) : (
            <>
              <div className={styles.previewHeader}>
                <h3>Questions ({questions.length})</h3>
                <button 
                  onClick={() => setShowQuestions(false)} 
                  className={styles.backButton}
                >
                  Back to Selection
                </button>
              </div>
              
              {questions.length === 0 ? (
                <div className={styles.noQuestions}>
                  No questions found for the selected criteria.
                </div>
              ) : (
                <div className={styles.questionsContainer}>
                  {questions.map((question, index) => (
                    <div key={index} className={styles.questionCard}>
                      <div className={styles.questionHeader}>
                        <span className={styles.questionNumber}>Q{index + 1}</span>
                        <span className={styles.questionType}>
                          {question.questionType === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                        </span>
                        {/* <span className={styles.difficulty}>{question.difficultyLevel}</span> */}
                        <span className={styles.marks}>{question.marks} marks</span>
                      </div>
                      
                      <div className={styles.questionContent}>
                        <div 
                          className={styles.questionText}
                          dangerouslySetInnerHTML={{ __html: question.description || 'No question text available' }} 
                        />
                        
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
                                {isCorrect && <span className={styles.correctBadge}>Correct</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionLibraryPreview;
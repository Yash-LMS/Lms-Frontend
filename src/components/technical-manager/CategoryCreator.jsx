import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CategoryCreator.module.css';
import { VIEW_QUESTION_ALL_CATEGORY_URL, CREATE_QUESTION_CATEGORY_URL } from '../../constants/apiConstants';

const CategoryCreator = ({fetchAllCategories}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [existingCategories, setExistingCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'import'
  const [message, setMessage] = useState({ show: false, type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [hasCategories, setHasCategories] = useState(true);
  const [categoriesData, setCategoriesData] = useState([]);

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

  const fetchExistingCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${VIEW_QUESTION_ALL_CATEGORY_URL}`);
      
      if (response.data.response === 'success') {
        // Process categories to get unique values (case-insensitive)
        const uniqueCategories = getUniqueCategories(response.data.payload);
        setExistingCategories(uniqueCategories);
        setHasCategories(uniqueCategories.length > 0);
      } else {
        setHasCategories(false);
        showMessage('error', 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setHasCategories(false);
      showMessage('error', 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to filter unique categories ignoring case
  const getUniqueCategories = (categoriesArray) => {
    if (!Array.isArray(categoriesArray) || categoriesArray.length === 0) {
      return [];
    }
    
    const uniqueMap = new Map();
    
    categoriesArray.forEach(category => {
      if (category) {
        const lowerCaseCategory = category.toLowerCase();
        
        // If this category (ignoring case) is not already in our map, add it
        // We use the original case version as the value
        if (!uniqueMap.has(lowerCaseCategory)) {
          uniqueMap.set(lowerCaseCategory, category);
        }
      }
    });
    
    // Return just the values (original case preserved)
    return Array.from(uniqueMap.values());
  };

  useEffect(() => {
    fetchExistingCategories();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      setMessage({ show: false, type: '', text: '' });
    }, 5000);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    // Clear any previous messages when opening the modal
    setMessage({ show: false, type: '', text: '' });
    
    // If in import mode and no categories exist yet, switch to manual entry
    if (inputMode === 'import' && !hasCategories) {
      setInputMode('manual');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCategory('');
    setSubCategory('');
    setSelectedCategory('');
    setInputMode('manual');
    setMessage({ show: false, type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let categoryToSubmit = category;
    if (inputMode === 'import' && selectedCategory) {
      categoryToSubmit = selectedCategory;
    }
    
    if (!categoryToSubmit || !subCategory) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    try {
      // Get user authentication data
      const { user, token } = getUserData();
      
      if (!user || !token) {
        showMessage('error', 'You must be logged in to create a category');
        return;
      }

      setIsLoading(true);
      const response = await axios.post(`${CREATE_QUESTION_CATEGORY_URL}`, {
        category: categoryToSubmit,
        subCategory: subCategory,
        user: user,
        token: token
      });

      if (response.data.response === 'success') {
        showMessage('success', 'Category added successfully!');
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
        fetchAllCategories();
      } else {
        showMessage('error', `Failed to add category: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showMessage('error', 'An error occurred while creating the category');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInputMode = (mode) => {
    // If there are no categories and trying to switch to import mode, show a message
    if (mode === 'import' && !hasCategories) {
      showMessage('error', 'No categories available to import');
      return;
    }
    
    setInputMode(mode);
    if (mode === 'manual') {
      setSelectedCategory('');
    } else {
      setCategory('');
      // Refresh categories when switching to import mode
      fetchExistingCategories();
    }
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.createButton}
        onClick={handleOpenModal}
      >
        Create Question Category
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Create New Category</h2>
              <button 
                className={styles.closeButton} 
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {message.show && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className={styles.inputTypeToggle}>
                  <button 
                    type="button"
                    className={`${styles.toggleButton} ${inputMode === 'manual' ? styles.active : ''}`}
                    onClick={() => toggleInputMode('manual')}
                  >
                    Manual Entry
                  </button>
                  <button 
                    type="button"
                    className={`${styles.toggleButton} ${inputMode === 'import' ? styles.active : ''}`}
                    onClick={() => toggleInputMode('import')}
                    disabled={!hasCategories}
                  >
                    Import Category
                  </button>
                </div>

                {inputMode === 'manual' ? (
                  <div className={styles.formGroup}>
                    <label htmlFor="category">Category:</label>
                    <input
                      type="text"
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Enter category name"
                      className={styles.input}
                      required
                    />
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label htmlFor="existingCategory">Select Category:</label>
                    {isLoading ? (
                      <div className={styles.loadingText}>Loading categories...</div>
                    ) : !hasCategories ? (
                      <div className={styles.noDataMessage}>
                        No categories available. Please switch to manual entry.
                      </div>
                    ) : (
                      <select
                        id="existingCategory"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={styles.select}
                        required
                      >
                        <option value="">-- Select a category --</option>
                        {existingCategories.map((cat, index) => (
                          <option key={index} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="subCategory">Sub-Category:</label>
                  <input
                    type="text"
                    id="subCategory"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="Enter sub-category name"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <button 
                    type="button" 
                    className={styles.cancelBtn} 
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryCreator;
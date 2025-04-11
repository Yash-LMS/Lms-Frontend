import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CategoryCreator.module.css';
import { VIEW_QUESTION_ALL_CATEGORY_URL, CREATE_QUESTION_CATEGORY_URL } from '../../constants/apiConstants';

const CategoryCreator = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [existingCategories, setExistingCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'import'
  const [message, setMessage] = useState({ show: false, type: '', text: '' });

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

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${VIEW_QUESTION_ALL_CATEGORY_URL}`);
      
      if (response.data.response === 'success') {
        // Process categories to get unique values (case-insensitive)
        const uniqueCategories = getUniqueCategories(response.data.payload);
        setExistingCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showMessage('error', 'Failed to load categories');
    }
  };

  // Function to filter unique categories ignoring case
  const getUniqueCategories = (categoriesArray) => {
    const uniqueMap = new Map();
    
    categoriesArray.forEach(category => {
      const lowerCaseCategory = category.toLowerCase();
      
      // If this category (ignoring case) is not already in our map, add it
      // We use the original case version as the value
      if (!uniqueMap.has(lowerCaseCategory)) {
        uniqueMap.set(lowerCaseCategory, category);
      }
    });
    
    // Return just the values (original case preserved)
    return Array.from(uniqueMap.values());
  };

  useEffect(() => {
    fetchCategories();
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
      } else {
        showMessage('error', `Failed to add category: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showMessage('error', 'An error occurred while creating the category');
    }
  };

  const toggleInputMode = (mode) => {
    setInputMode(mode);
    if (mode === 'manual') {
      setSelectedCategory('');
    } else {
      setCategory('');
    }
    fetchCategories();
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
                  >
                    Create
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
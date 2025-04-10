import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
        setExistingCategories(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {

    fetchCategories();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let categoryToSubmit = category;
    if (inputMode === 'import' && selectedCategory) {
      categoryToSubmit = selectedCategory;
    }
    
    if (!categoryToSubmit || !subCategory) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Get user authentication data
      const { user, token } = getUserData();
      
      if (!user || !token) {
        alert('You must be logged in to create a category');
        return;
      }

      const response = await axios.post(`${CREATE_QUESTION_CATEGORY_URL}`, {
        category: categoryToSubmit,
        subCategory: subCategory,
        user: user,
        token: token
      });

      if (response.data.response === 'success') {
        alert('Category added successfully!');
        handleCloseModal();
      } else {
        alert(`Failed to add category: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('An error occurred while creating the category');
    }
  };

  const toggleInputMode = (mode) => {
    setInputMode(mode);
    if (mode === 'manual') {
      setSelectedCategory('');
    } else {
      setCategory('');
    }
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.createButton}
        onClick={handleOpenModal}
      >
        Create Category
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
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
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
                    className={styles.cancelButton} 
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
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
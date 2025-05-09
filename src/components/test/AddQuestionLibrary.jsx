import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./AddQuestionLibrary.module.css";
import SuccessModal from "../../assets/SuccessModal";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  VIEW_QUESTION_ALL_CATEGORY_URL,
  ADD_QUESTION_Library_URL,
  VIEW_QUESTION_ALL_SUB_CATEGORY_URL,
} from "../../constants/apiConstants";
import BulkUploadQuestionLibrary from "./BulkUploadQuestionLibrary";
import QuestionLibraryPreview from './QuestionLibraryPreview';

const AddQuestionLibrary = () => {
  const quillRef = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [isBulkUploadModelOpen, setIsBulkUploadModelOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  // Add a key state for forcing re-render
  const [formKey, setFormKey] = useState(0);

  const initialQuestion = {
    id: 1,
    description: "",
    questionType: "single_choice",
    difficultyLevel: "medium",
    marks: 1,
    options: [
      { id: "option1", text: "", isCorrect: false },
      { id: "option2", text: "", isCorrect: false },
    ],
  };

  const [questions, setQuestions] = useState([{ ...initialQuestion }]);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Enhanced Quill editor modules and formats
  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "indent",
    "script",
    "color",
    "background",
    "link",
  ];

  const openModal = () => {
    setIsBulkUploadModelOpen(true);
  };

  const closeModal = () => {
    setIsBulkUploadModelOpen(false);
  };

  const handleUploadSuccess = () => {
    // You can add logic here to refresh question list or show success message
    console.log("Questions uploaded successfully!");
    // Optionally fetch updated questions or show a notification
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory("");
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { token } = getUserData();
      const response = await axios.get(`${VIEW_QUESTION_ALL_CATEGORY_URL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data && response.data.response === "success") {
        // Get the payload data
        const categoriesData = response.data.payload || [];
        
        // Create a map to store unique categories in a case-insensitive manner
        const uniqueCategoriesMap = new Map();
        
        // Process each category to ensure uniqueness
        categoriesData.forEach(category => {
          // Convert to lowercase for case-insensitive comparison
          const lowerCaseCategory = category.toLowerCase();
          
          // Only add if not already in the map (keeping the original case)
          if (!uniqueCategoriesMap.has(lowerCaseCategory)) {
            uniqueCategoriesMap.set(lowerCaseCategory, category);
          }
        });
        
        // Convert the map values back to an array
        const uniqueCategories = Array.from(uniqueCategoriesMap.values());
        
        // Set the unique categories to state
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to load categories. Please try again.");
    }
  };

  const fetchSubcategories = async (category) => {
    try {
      const { token } = getUserData();
      const response = await axios.get(`${VIEW_QUESTION_ALL_SUB_CATEGORY_URL}`, {
        params: { category },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.response === "success") {
        setSubcategories(response.data.payload || []);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setError("Failed to load subcategories. Please try again.");
    }
  };

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

  const handleQuestionTextChange = (questionId, content) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, description: content } : q
      )
    );
  };

  const handleQuestionMarksChange = (questionId, number) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, marks: number } : q))
    );
  };

  const handleQuestionTypeChange = (questionId, type) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          // Reset all correct answers when changing question type
          const resetOptions = q.options.map((opt) => ({
            ...opt,
            isCorrect: false,
          }));

          return {
            ...q,
            questionType: type,
            options: resetOptions,
          };
        }
        return q;
      })
    );
  };

  const handleDifficultyChange = (questionId, difficulty) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, difficultyLevel: difficulty } : q
      )
    );
  };

  const handleOptionTextChange = (questionId, optionId, text) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optionId ? { ...opt, text } : opt
            ),
          };
        }
        return q;
      })
    );
  };

  const handleCorrectAnswerChange = (questionId, optionId) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((opt) => {
              if (q.questionType === "single_choice") {
                // For single choice, only one option can be correct
                return { ...opt, isCorrect: opt.id === optionId };
              } else {
                // For multiple choice, toggle the selected option
                return opt.id === optionId
                  ? { ...opt, isCorrect: !opt.isCorrect }
                  : opt;
              }
            }),
          };
        }
        return q;
      })
    );
  };

  const addOption = (questionId) => {
    const question = questions.find((q) => q.id === questionId);

    if (question.options.length >= 8) {
      setErrorMessage("Maximum 8 options allowed per question");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Generate the next option ID (option3, option4, etc.)
    const nextOptionNumber = question.options.length + 1;
    const newOptionId = `option${nextOptionNumber}`;

    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [
              ...q.options,
              { id: newOptionId, text: "", isCorrect: false },
            ],
          };
        }
        return q;
      })
    );
  };

  const removeOption = (questionId, optionId) => {
    const question = questions.find((q) => q.id === questionId);

    if (question.options.length <= 2) {
      setErrorMessage("Minimum 2 options required per question");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Remove the option but keep the option IDs in order
    const updatedOptions = question.options.filter(
      (opt) => opt.id !== optionId
    );

    // Renumber the options to ensure they're sequential (option1, option2, etc.)
    const renumberedOptions = updatedOptions.map((opt, index) => ({
      ...opt,
      id: `option${index + 1}`,
    }));

    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: renumberedOptions,
          };
        }
        return q;
      })
    );
  };

  const addNewQuestion = () => {
    const newQuestionId = Math.max(...questions.map((q) => q.id)) + 1;
    const newQuestion = {
      id: newQuestionId,
      description: "",
      questionType: "single_choice",
      difficultyLevel: "medium",
      marks: 1,
      options: [
        { id: "option1", text: "", isCorrect: false },
        { id: "option2", text: "", isCorrect: false },
      ],
    };

    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId) => {
    if (questions.length <= 1) {
      setErrorMessage("At least one question is required");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const validateQuestions = () => {
    // First check if category and subcategory are selected
    if (!selectedCategory) {
      setErrorMessage("A category must be selected");
      return false;
    }

    if (!selectedSubcategory) {
      setErrorMessage("A subcategory must be selected");
      return false;
    }

    for (const question of questions) {
      // Check if there's any content (including HTML tags)
      const hasContent =
        question.description.trim() !== "" &&
        question.description !== "<p><br></p>" &&
        question.description !== "<p></p>";

      if (!hasContent) {
        setErrorMessage(
          `Question ${
            questions.indexOf(question) + 1
          }: Question text is required`
        );
        return false;
      }

      if (!question.options.some((opt) => opt.isCorrect)) {
        setErrorMessage(
          `Question ${
            questions.indexOf(question) + 1
          }: At least one correct answer must be selected`
        );
        return false;
      }

      const emptyOptions = question.options.some((opt) => !opt.text.trim());
      if (emptyOptions) {
        setErrorMessage(
          `Question ${
            questions.indexOf(question) + 1
          }: All options must have text`
        );
        return false;
      }
    }

    return true;
  };

  const prepareQuestionData = (question) => {
    // Create an object with option1, option2, etc. fields
    const optionFields = {};
    question.options.forEach((option) => {
      optionFields[option.id] = option.text;
    });

    // Generate the correctOption string (comma-separated for multiple)
    const correctOptions = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .join("/");

    return {
      description: question.description, // HTML content from React Quill
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      marks: question.marks,
      category: selectedCategory,
      subCategory: selectedSubcategory,
      ...optionFields,
      correctOption: correctOptions,
    };
  };
  
  const resetForm = () => {
    // Increment the form key to force a complete re-render
    setFormKey(prevKey => prevKey + 1);
    
    // Reset all form state to initial values
    setQuestions([{ ...initialQuestion }]);
    setSelectedCategory("");
    setSelectedSubcategory("");
    setErrorMessage("");
    
    // Set success message
    setSuccessMessage("Questions saved successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSubmit = async () => {
    setErrorMessage("");
  
    if (!validateQuestions()) {
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
  
    // Get user data from session storage
    const { user, token, role } = getUserData();
  
    if (!user || !token) {
      setErrorMessage("User session data is missing. Please log in again.");
      return;
    }
  
    // Prepare all questions data for submission
    const questionList = questions.map((question) =>
      prepareQuestionData(question)
    );
  
    const requestBody = {
      user,
      token,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      questionsLibraryList: questionList,
    };
  
    console.log(requestBody);
  
    try {
      setLoading(true);
      const response = await axios.post(
        `${ADD_QUESTION_Library_URL}`,
        requestBody
      );
  
      if (response.data && response.data.response === "success") {
        // Show success modal
        setShowSuccessModal(true);
        
        // Reset the form completely
        resetForm();
  
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      } else {
        setErrorMessage(
          "Failed to save questions: " +
            (response.data?.message || "Unknown error")
        );
      }
    } catch (error) {
      setErrorMessage(
        "Failed to save questions: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const navigateBack = () => {
    window.history.back();
  };

  const openPreviewModal = () => {
    setIsPreviewModalOpen(true);
  };
  
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
  };

  return (
    <div className={styles.container} key={formKey}>
      <div className={styles.pageHeader}>
        <h2>Add Questions to Library</h2>
        <div className={styles.backNavigation}>
          <button 
            className={styles.uploadButton}
            onClick={openModal}
          >
            Bulk Upload Questions
          </button>

          <button 
            className={styles.previewButton}
            onClick={openPreviewModal}
          >
            Preview Library Questions
          </button>
          
          <button
            className={styles.backButton}
            onClick={() => navigate("/instructor-dashboard")}
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.globalCategorySelector}>
        <div className={styles.formGroup}>
          <label>Select Global Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Select a category</option>
            {categories.map((category, idx) => (
              <option key={idx} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Select Global Subcategory</label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className={styles.selectInput}
            disabled={!selectedCategory || subcategories.length === 0}
          >
            <option value="">Select a subcategory</option>
            {subcategories.map((subcategory, idx) => (
              <option key={idx} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </select>
        </div>
      </div>

      {questions.map((question, index) => (
        <div key={`${formKey}-question-${question.id}`} className={styles.questionContainer}>
          <div className={styles.questionHeader}>
            <h3>Question {index + 1}</h3>
            <div className={styles.questionActions}>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className={styles.removeQuestionButton}
                >
                  Remove Question
                </button>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor={`description-${question.id}`}>Question Text</label>
            <div className={styles.quillContainer}>
              <ReactQuill
                ref={index === 0 ? quillRef : null}
                theme="snow"
                value={question.description}
                onChange={(content) =>
                  handleQuestionTextChange(question.id, content)
                }
                modules={modules}
                formats={formats}
                placeholder="Enter your question here"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor={`marks-${question.id}`}>Marks</label>
              <input
                id={`marks-${question.id}`}
                type="number"
                min="1"
                value={question.marks}
                onChange={(e) =>
                  handleQuestionMarksChange(question.id, Number(e.target.value))
                }
                className={styles.questionInput}
                placeholder="Enter marks"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor={`difficulty-${question.id}`}>Difficulty</label>
              <select
                id={`difficulty-${question.id}`}
                value={question.difficultyLevel}
                onChange={(e) =>
                  handleDifficultyChange(question.id, e.target.value)
                }
                className={styles.selectInput}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Question Type</label>
            <div className={styles.questionTypeContainer}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`questionType-${question.id}`}
                  value="single_choice"
                  checked={question.questionType === "single_choice"}
                  onChange={(e) =>
                    handleQuestionTypeChange(question.id, e.target.value)
                  }
                  className={styles.radioInput}
                />
                Single Choice
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`questionType-${question.id}`}
                  value="multiple_choice"
                  checked={question.questionType === "multiple_choice"}
                  onChange={(e) =>
                    handleQuestionTypeChange(question.id, e.target.value)
                  }
                  className={styles.radioInput}
                />
                Multiple Choice
              </label>
            </div>
          </div>

          <div className={styles.optionsContainer}>
            <div className={styles.optionsHeader}>
              <h4>Answer Options</h4>
              <button
                type="button"
                onClick={() => addOption(question.id)}
                className={styles.addOptionButton}
                disabled={question.options.length >= 8}
              >
                + Add Option
              </button>
            </div>

            {question.options.map((option) => (
              <div key={`${formKey}-option-${question.id}-${option.id}`} className={styles.optionItem}>
                <div
                  className={`${styles.optionContent} ${
                    option.isCorrect ? styles.correctOption : ""
                  }`}
                >
                  <div className={styles.correctAnswerInput}>
                    {question.questionType === "single_choice" ? (
                      <input
                        type="radio"
                        name={`correctOption-${question.id}`}
                        checked={option.isCorrect}
                        onChange={() =>
                          handleCorrectAnswerChange(question.id, option.id)
                        }
                        className={styles.correctRadio}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={() =>
                          handleCorrectAnswerChange(question.id, option.id)
                        }
                        className={styles.correctCheckbox}
                      />
                    )}
                  </div>
                  <div className={styles.optionLabelContainer}>
                    <span className={styles.optionLabel}>{option.id}:</span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        handleOptionTextChange(
                          question.id,
                          option.id,
                          e.target.value
                        )
                      }
                      className={styles.optionInput}
                      placeholder="Option text"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(question.id, option.id)}
                    className={styles.removeOptionButton}
                    disabled={question.options.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {index === questions.length - 1 && (
            <div className={styles.addQuestionButtonContainer}>
              <button
                type="button"
                onClick={addNewQuestion}
                className={styles.addQuestionButton}
              >
                + Add Another Question
              </button>
            </div>
          )}

          {index < questions.length - 1 && (
            <hr className={styles.questionDivider} />
          )}
        </div>
      ))}

      <div className={styles.pageActions}>
        <button
          type="button"
          onClick={navigateBack}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={styles.saveButton}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save All Questions"}
        </button>
      </div>

      {isPreviewModalOpen && (
        <QuestionLibraryPreview 
          isOpen={isPreviewModalOpen}
          onClose={closePreviewModal}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message="Questions saved successfully!"
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {isBulkUploadModelOpen && (
        <BulkUploadQuestionLibrary 
          isOpen={isBulkUploadModelOpen}
          onClose={closeModal}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default AddQuestionLibrary;
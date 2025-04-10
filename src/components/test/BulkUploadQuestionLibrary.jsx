import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import styles from "./BulkUploadQuestionLibrary.module.css";
import { VIEW_QUESTION_DISTINCT_CATEGORY_URL, ADD_QUESTION_Library_URL, VIEW_QUESTION_ALL_SUB_CATEGORY_URL } from "../../constants/apiConstants";

const BulkUploadQuestionLibrary = ({ isOpen, onClose, onUploadSuccess }) => {
  const [step, setStep] = useState("upload"); // upload, selectCategory, review, success
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { token } = getUserData();
      const response = await axios.get(`${VIEW_QUESTION_DISTINCT_CATEGORY_URL}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.response === "success") {
        setCategories(response.data.payload || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setGeneralError("Failed to load categories. Please try again.");
    }
  };

  const fetchSubcategories = async (category) => {
    try {
      const { token } = getUserData();
      const response = await axios.get(`${VIEW_QUESTION_ALL_SUB_CATEGORY_URL}?category=${encodeURIComponent(category)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.response === "success") {
        setSubcategories(response.data.payload || []);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setGeneralError("Failed to load subcategories. Please try again.");
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

  const downloadTemplate = () => {
    // Create a template Excel file - removed Category column
    const template = [
      [
        "Sno", "Level(easy/medium/hard)", "Description", "Marks", 
        "TYPE (single_choice/multiple_choice)", "option1(A)", "option2(B)", 
        "option3(C)", "option4(D)", "option5(E)", "option6(F)", "option7(G)", 
        "option8(H)", "Correct Answer (a,b,c if multiple, b if single)"
      ],
    
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Question Template");
    
    // Auto-size columns
    const wscols = template[0].map(() => ({ wch: 20 }));
    worksheet['!cols'] = wscols;
    
    // Generate Excel file
    XLSX.writeFile(workbook, "question_upload_template.xlsx");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrors([]);
    setGeneralError("");
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedSubcategory("");
    
    if (category) {
      fetchSubcategories(category);
    } else {
      setSubcategories([]);
    }
  };

  const handleSubcategoryChange = (e) => {
    setSelectedSubcategory(e.target.value);
  };

  const parseCorrectOptions = (correctAnswerString, optionsCount) => {
    if (!correctAnswerString) return [];
    
    // Convert to lowercase and remove spaces
    const normalized = correctAnswerString.toLowerCase().replace(/\s/g, '');
    
    // Check if it's a comma-separated list
    if (normalized.includes(',')) {
      // For multiple choice
      return normalized.split(',')
        .map(letter => {
          // Convert letter (a,b,c) to option index (0,1,2)
          const index = letter.charCodeAt(0) - 97;
          return index >= 0 && index < optionsCount ? `option${index + 1}` : null;
        })
        .filter(option => option !== null);
    } else {
      // For single choice
      const index = normalized.charCodeAt(0) - 97;
      return index >= 0 && index < optionsCount ? [`option${index + 1}`] : [];
    }
  };

  const parseExcelData = (data) => {
    const newErrors = [];
    const parsedQuestions = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[2]) continue;
      
      const rowNumber = i + 1;
      const questionErrors = [];
      
      // Validate difficulty level (now at index 1)
      const level = (row[1] || "").toLowerCase();
      if (!["easy", "medium", "hard"].includes(level)) {
        questionErrors.push(`Row ${rowNumber}: Invalid difficulty level "${row[1]}". Must be easy, medium, or hard.`);
      }
      
      // Validate question type (now at index 4)
      const qType = (row[4] || "").toLowerCase();
      if (!["single_choice", "multiple_choice"].includes(qType)) {
        questionErrors.push(`Row ${rowNumber}: Invalid question type "${row[4]}". Must be single_choice or multiple_choice.`);
      }
      
      // Get options (shifted by 1)
      const options = [];
      for (let j = 5; j <= 12; j++) {
        if (row[j]) {
          options.push({
            id: `option${j - 4}`,
            text: row[j],
            isCorrect: false
          });
        }
      }
      
      // Need at least 2 options
      if (options.length < 2) {
        questionErrors.push(`Row ${rowNumber}: At least 2 options are required`);
      }
      
      // Parse correct answers (now at index 13)
      const correctOptionIds = parseCorrectOptions(row[13], options.length);
      if (correctOptionIds.length === 0) {
        questionErrors.push(`Row ${rowNumber}: No valid correct answer specified`);
      }
      
      // Set correct options
      options.forEach(option => {
        option.isCorrect = correctOptionIds.includes(option.id);
      });
      
      // For single choice questions, ensure only one answer is selected
      if (qType === "single_choice" && correctOptionIds.length > 1) {
        questionErrors.push(`Row ${rowNumber}: Multiple correct answers selected for single choice question`);
      }
      
      // Add question with all errors
      if (questionErrors.length > 0) {
        newErrors.push(...questionErrors);
      }
      
      parsedQuestions.push({
        id: i,
        description: row[2] || "",
        category: selectedCategory,
        subcategory: selectedSubcategory,
        difficultyLevel: level || "medium",
        questionType: qType || "single_choice",
        marks: parseInt(row[3]) || 1,
        options: options,
        rowErrors: questionErrors
      });
    }
    
    setErrors(newErrors);
    return parsedQuestions;
  };

  const handleProceedToCategory = () => {
    if (!file) {
      setGeneralError("Please select a file to upload");
      return;
    }
    
    setStep("selectCategory");
  };

  const handleProceedToReview = async () => {
    if (!selectedCategory) {
      setGeneralError("Please select a category");
      return;
    }
    
    setLoading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to array of arrays
          const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Parse the data
          const parsedQuestions = parseExcelData(excelData);
          setQuestions(parsedQuestions);
          
          if (errors.length === 0 && parsedQuestions.length > 0) {
            setStep("review");
          }
          
          setLoading(false);
        } catch (error) {
          console.error("Error parsing Excel:", error);
          setGeneralError("Failed to parse Excel file. Please ensure it's a valid Excel file.");
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setGeneralError("Error reading file");
        setLoading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Upload error:", error);
      setGeneralError("Failed to process file");
      setLoading(false);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionTextChange = (questionIndex, optionId, text) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    const optionIndex = question.options.findIndex(opt => opt.id === optionId);
    
    if (optionIndex !== -1) {
      question.options[optionIndex].text = text;
      setQuestions(updatedQuestions);
    }
  };

  const handleCorrectAnswerChange = (questionIndex, optionId) => {
    const updatedQuestions = [...questions];
    const question = updatedQuestions[questionIndex];
    
    if (question.questionType === "single_choice") {
      // For single choice, only one can be correct
      question.options.forEach(option => {
        option.isCorrect = option.id === optionId;
      });
    } else {
      // For multiple choice, toggle
      const optionIndex = question.options.findIndex(opt => opt.id === optionId);
      if (optionIndex !== -1) {
        question.options[optionIndex].isCorrect = !question.options[optionIndex].isCorrect;
      }
    }
    
    setQuestions(updatedQuestions);
  };

  const prepareQuestionData = (question) => {
    // Create an object with option1, option2, etc. fields
    const optionFields = {};
    question.options.forEach(option => {
      optionFields[option.id] = option.text;
    });

    // Generate the correctOption string (comma-separated for multiple)
    const correctOptions = question.options
      .filter(option => option.isCorrect)
      .map(option => option.id)
      .join("/");

    return {
      description: question.description,
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      marks: question.marks,
      category: question.category,
      subcategory: question.subcategory,
      ...optionFields,
      correctOption: correctOptions,
    };
  };

  const handleSave = async () => {
    if (questions.length === 0) {
      setGeneralError("No questions to save");
      return;
    }
    
    // Validate all questions
    let hasErrors = false;
    const validatedQuestions = questions.map(question => {
      const isValid = question.description && 
                     question.category &&
                     question.options.length >= 2 &&
                     question.options.some(opt => opt.isCorrect) &&
                     !question.options.some(opt => !opt.text.trim());
      
      if (!isValid) hasErrors = true;
      return { ...question, isValid };
    });
    
    if (hasErrors) {
      setGeneralError("Some questions have errors. Please review and fix them before saving.");
      setQuestions(validatedQuestions);
      return;
    }
    
    // Get user data
    const { user, token } = getUserData();
    if (!user || !token) {
      setGeneralError("User session data is missing. Please log in again.");
      return;
    }
    
    // Prepare all questions data
    const questionList = questions.map(question => prepareQuestionData(question));
    
    const requestBody = {
      user,
      token,
      questionsLibraryList: questionList
    };
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${ADD_QUESTION_Library_URL}`, requestBody);
      
      if (response.data && response.data.response === "success") {
        setStep("success");
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setGeneralError("Failed to save questions: " + (response.data?.message || "Unknown error"));
      }
    } catch (error) {
      setGeneralError("Failed to save questions: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setStep("upload");
    setFile(null);
    setQuestions([]);
    setErrors([]);
    setGeneralError("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>
            {step === "upload" ? "Bulk Upload Questions" : 
             step === "selectCategory" ? "Select Category and Subcategory" :
             step === "review" ? "Review Questions" : 
             "Upload Successful"}
          </h2>
          <button className={styles.closeButton} onClick={closeModal}>×</button>
        </div>

        {generalError && <div className={styles.errorMessage}>{generalError}</div>}

        {step === "upload" && (
          <div className={styles.uploadContainer}>
            <p>Upload questions in bulk using our Excel template.</p>
            
            <div className={styles.templateDownload}>
              <button onClick={downloadTemplate} className={styles.downloadButton}>
                Download Template
              </button>
              <span>Download and fill this template before uploading</span>
            </div>
            
            <div className={styles.fileUpload}>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleFileChange}
                className={styles.fileInput}
                id="excelUpload"
              />
              <label htmlFor="excelUpload" className={styles.fileInputLabel}>
                Choose Excel File
              </label>
              <span>{file ? file.name : "No file chosen"}</span>
            </div>
            
            <div className={styles.actionButtons}>
              <button onClick={closeModal} className={styles.cancelButton}>Cancel</button>
              <button 
                onClick={handleProceedToCategory} 
                className={styles.uploadButton}
                disabled={!file || loading}
              >
                Next: Select Category
              </button>
            </div>
          </div>
        )}

        {step === "selectCategory" && (
          <div className={styles.categorySelectContainer}>
            <p>Select a category and subcategory for all questions in this batch.</p>
            
            <div className={styles.formGroup}>
              <label>Category <span className={styles.requiredField}>*</span></label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className={styles.selectInput}
                required
              >
                <option value="">Select category</option>
                {categories.map((category, idx) => (
                  <option key={idx} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>Subcategory</label>
              <select
                value={selectedSubcategory}
                onChange={handleSubcategoryChange}
                className={styles.selectInput}
                disabled={!selectedCategory}
              >
                <option value="">Select subcategory (optional)</option>
                {subcategories.map((subcategory, idx) => (
                  <option key={idx} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.actionButtons}>
              <button onClick={() => setStep("upload")} className={styles.backButton}>Back</button>
              <button 
                onClick={handleProceedToReview} 
                className={styles.uploadButton}
                disabled={!selectedCategory || loading}
              >
                {loading ? "Processing..." : "Upload and Review"}
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className={styles.reviewContainer}>
            <p>Review and edit your questions before saving. {questions.length} questions found.</p>
            <div className={styles.categoryInfo}>
              <strong>Category:</strong> {selectedCategory} 
              {selectedSubcategory && <> | <strong>Subcategory:</strong> {selectedSubcategory}</>}
            </div>
            
            <div className={styles.questionsReview}>
              {questions.map((question, index) => (
                <div key={index} className={`${styles.questionItem} ${question.rowErrors?.length > 0 ? styles.errorQuestion : ''}`}>
                  <div className={styles.questionHeader}>
                    <h4>Question {index + 1}</h4>
                    {question.rowErrors?.length > 0 && (
                      <span className={styles.errorBadge}>Has Errors</span>
                    )}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Question Text</label>
                    <textarea
                      value={question.description}
                      onChange={(e) => handleQuestionChange(index, 'description', e.target.value)}
                      className={styles.textArea}
                      rows={3}
                    />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Difficulty</label>
                      <select
                        value={question.difficultyLevel}
                        onChange={(e) => handleQuestionChange(index, 'difficultyLevel', e.target.value)}
                        className={styles.selectInput}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Marks</label>
                      <input
                        type="number"
                        min="1"
                        value={question.marks}
                        onChange={(e) => handleQuestionChange(index, 'marks', parseInt(e.target.value))}
                        className={styles.numberInput}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Question Type</label>
                      <select
                        value={question.questionType}
                        onChange={(e) => handleQuestionChange(index, 'questionType', e.target.value)}
                        className={styles.selectInput}
                      >
                        <option value="single_choice">Single Choice</option>
                        <option value="multiple_choice">Multiple Choice</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.optionsContainer}>
                    <h5>Options</h5>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className={`${styles.optionRow} ${option.isCorrect ? styles.correctOption : ''}`}>
                        <div className={styles.optionCheckContainer}>
                          {question.questionType === "single_choice" ? (
                            <input
                              type="radio"
                              name={`correctOption-${index}`}
                              checked={option.isCorrect}
                              onChange={() => handleCorrectAnswerChange(index, option.id)}
                              className={styles.optionRadio}
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={option.isCorrect}
                              onChange={() => handleCorrectAnswerChange(index, option.id)}
                              className={styles.optionCheckbox}
                            />
                          )}
                        </div>
                        <div className={styles.optionTextContainer}>
                          <span className={styles.optionLabel}>
                            {String.fromCharCode(97 + optIndex).toUpperCase()}:
                          </span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => handleOptionTextChange(index, option.id, e.target.value)}
                            className={styles.optionInput}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {question.rowErrors?.length > 0 && (
                    <div className={styles.questionErrors}>
                      {question.rowErrors.map((error, errIndex) => (
                        <div key={errIndex} className={styles.questionError}>{error}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className={styles.actionButtons}>
              <button onClick={() => setStep("selectCategory")} className={styles.backButton}>Back</button>
              <button 
                onClick={handleSave} 
                className={styles.saveButton}
                disabled={loading || questions.length === 0}
              >
                {loading ? "Saving..." : "Save All Questions"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✓</div>
            <h3>Upload Successful!</h3>
            <p>{questions.length} questions have been added to your question library.</p>
            <button onClick={closeModal} className={styles.closeSuccessButton}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadQuestionLibrary;
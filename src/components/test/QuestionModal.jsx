import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addQuestions } from "../../features/test/testActions";
import styles from "./QuestionModal.module.css";
import SuccessModal from "../../assets/SuccessModal";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill styles

const QuestionModal = ({ isOpen, onClose, testId }) => {
  const dispatch = useDispatch();
  const quillRef = useRef(null);

  const { loading, error, questionAddSuccess } = useSelector(
    (state) => state.tests
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [questions, setQuestions] = useState([
    {
      id: 1,
      description: "",
      questionType: "single_choice",
      marks: 1,
      options: [
        { id: "option1", text: "", isCorrect: false },
        { id: "option2", text: "", isCorrect: false },
      ],
    },
  ]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savingQuestionId, setSavingQuestionId] = useState(null);

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

  // If modal is not open, don't render anything
  if (!isOpen) return null;

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

  const validateQuestion = (question) => {
    // Check if there's any content (including HTML tags)
    const hasContent = question.description.trim() !== "" && 
                       question.description !== "<p><br></p>" &&
                       question.description !== "<p></p>";
                       
    if (!hasContent) {
      setErrorMessage(`Question text is required`);
      return false;
    }

    if (!question.options.some((opt) => opt.isCorrect)) {
      setErrorMessage(`At least one correct answer must be selected`);
      return false;
    }

    const emptyOptions = question.options.some((opt) => !opt.text.trim());
    if (emptyOptions) {
      setErrorMessage(`All options must have text`);
      return false;
    }

    return true;
  };

  const validateQuestions = () => {
    for (const question of questions) {
      // Check if there's any content (including HTML tags)
      const hasContent = question.description.trim() !== "" && 
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
      marks: question.marks,
      ...optionFields,
      correctOption: correctOptions,
    };
  };

  const saveQuestion = async (questionId) => {
    setErrorMessage("");
    setSavingQuestionId(questionId);

    const questionToSave = questions.find((q) => q.id === questionId);

    if (!validateQuestion(questionToSave)) {
      setTimeout(() => setErrorMessage(""), 3000);
      setSavingQuestionId(null);
      return;
    }

    // Get user data from session storage
    const { user, token, role } = getUserData();

    if (!user || !token) {
      setErrorMessage("User session data is missing. Please log in again.");
      setSavingQuestionId(null);
      return;
    }

    // Prepare question data for submission
    const questionData = prepareQuestionData(questionToSave);

    try {
      // Dispatch the action to add the single question
      const resultAction = await dispatch(
        addQuestions({
          user,
          token,
          role,
          testId,
          questionList: [questionData],
        })
      );

      if (addQuestions.fulfilled.match(resultAction)) {
        if (resultAction.payload.status === "success") {
          setSuccessMessage(`Question saved successfully!`);

          // Remove the saved question from the list
          setQuestions(questions.filter((q) => q.id !== questionId));

          setTimeout(() => setSuccessMessage(""), 2000);
        } else {
          setErrorMessage(
            "Failed to save question: " + resultAction.payload.message
          );
        }
      } else {
        setErrorMessage("Failed to save question: " + resultAction.payload);
      }
    } catch (error) {
      setErrorMessage("Failed to save question: " + error.message);
    } finally {
      setSavingQuestionId(null);
      setTimeout(() => setErrorMessage(""), 3000);
    }
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

    console.log(questionList);

    try {
      // Dispatch the action to add questions
      const resultAction = await dispatch(
        addQuestions({
          user,
          token,
          role,
          testId,
          questionList,
        })
      );

      if (addQuestions.fulfilled.match(resultAction)) {
        setSuccessMessage("All questions saved successfully!");
        setShowSuccessModal(true);

        // Reset form after successful save
        setQuestions([
          {
            id: 1,
            description: "",
            questionType: "single_choice",
            marks: 1,
            options: [
              { id: "option1", text: "", isCorrect: false },
              { id: "option2", text: "", isCorrect: false },
            ],
          },
        ]);

        setTimeout(() => {
          setShowSuccessModal(false);
          onClose(); // Close modal after successful save
        }, 2000);
      } else {
        setErrorMessage("Failed to save questions: " + resultAction.payload);
      }
    } catch (error) {
      setErrorMessage("Failed to save questions: " + error.message);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Add Questions</h2>
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
        {error && <div className={styles.errorMessage}>{error}</div>}
        {questions.map((question, index) => (
          <div key={question.id} className={styles.questionContainer}>
            <div className={styles.questionHeader}>
              <h3>Question {index + 1}</h3>
              <div className={styles.questionActions}>
                <button
                  type="button"
                  onClick={() => saveQuestion(question.id)}
                  className={styles.saveButton}
                  disabled={savingQuestionId === question.id}
                >
                  {savingQuestionId === question.id
                    ? "Saving..."
                    : "Save Question"}
                </button>
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
              <label htmlFor={`description-${question.id}`}>
                Question Text
              </label>
              <div className={styles.quillContainer}>
                <ReactQuill
                  ref={index === 0 ? quillRef : null}
                  theme="snow"
                  value={question.description}
                  onChange={(content) => handleQuestionTextChange(question.id, content)}
                  modules={modules}
                  formats={formats}
                  placeholder="Enter your question here"
                />
              </div>
            </div>

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
                  disabled={question.options.length >= 6}
                >
                  + Add Option
                </button>
              </div>

              {question.options.map((option) => (
                <div key={option.id} className={styles.optionItem}>
                  <div className={styles.optionContent}>
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

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={onClose}
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
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

export default QuestionModal;
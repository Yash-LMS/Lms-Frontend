import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styles from "./CodingAssignmentModal.module.css";
import { CREATE_CODING_ASSIGNMENT_URL } from "../../constants/apiConstants";
import axios from "axios";

const CodingAssignmentModal = ({ isOpen, onClose }) => {
  const quillRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [assignment, setAssignment] = useState({
    taskName: "",
    description: "",
    technology: "",
    maxMarks: 10,
  });

  // Quill editor modules and formats
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
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
    "bold", "italic", "underline", "strike",
    "list", "bullet", "indent",
    "script",
    "color", "background",
    "link",
  ];

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

  const handleTaskNameChange = (e) => {
    if (e.target.value.length <= 500) {
      setAssignment((prev) => ({
        ...prev,
        taskName: e.target.value,
      }));
    }
  };

  const handleDescriptionChange = (content) => {
    setAssignment((prev) => ({
      ...prev,
      description: content,
    }));
  };

  const handleTechnologyChange = (e) => {
    setAssignment((prev) => ({
      ...prev,
      technology: e.target.value,
    }));
  };

  const handleMaxMarksChange = (e) => {
    setAssignment((prev) => ({
      ...prev,
      maxMarks: Number(e.target.value),
    }));
  };

  const validateAssignment = () => {
    if (!assignment.taskName.trim()) {
      setErrorMessage("Task name is required");
      return false;
    }
    if (assignment.taskName.length > 500) {
      setErrorMessage("Task name cannot exceed 500 characters");
      return false;
    }
    // Check if there's any content for description, including HTML tags
    const hasContent =
      assignment.description.trim() !== "" &&
      assignment.description !== "<p><br></p>" &&
      assignment.description !== "<p></p>";

    if (!hasContent) {
      setErrorMessage("Assignment description is required");
      return false;
    }

    if (!assignment.technology.trim()) {
      setErrorMessage("Technology is required");
      return false;
    }

    if (!assignment.maxMarks || assignment.maxMarks <= 0) {
      setErrorMessage("Max marks must be greater than 0");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateAssignment()) {
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const { user, token } = getUserData();

    if (!user || !token) {
      setErrorMessage("User session data is missing. Please log in again.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setLoading(true);

    try {
      const requestPayload = {
        user: user,
        token: token,
        codingTask: {
          taskName: assignment.taskName,
          description: assignment.description,
          technology: assignment.technology,
          maxMarks: assignment.maxMarks,
          // instructorName and instructorId will be set from backend
        },
      };

      const response = await axios.post(`${CREATE_CODING_ASSIGNMENT_URL}`, requestPayload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = response.data.payload;

      if (response.data.response === "success") {
        setSuccessMessage(response.data.message);

        // Reset form after successful save
        setAssignment({
          taskName: "",
          description: "",
          technology: "",
          maxMarks: 10,
        });

        setTimeout(() => {
          setSuccessMessage("");
          onClose();
        }, 2000);
      } else {
        setErrorMessage(result.message || "Failed to create coding assignment");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message || "Failed to create coding assignment");
      } else {
        setErrorMessage("Failed to create assignment: " + error.message);
      }
    } finally {
      setLoading(false);
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Create Coding Assignment</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

        <div className={styles.assignmentContainer}>
          <div className={styles.formGroup}>
            <label htmlFor="taskName">Task Name</label>
            <input
              id="taskName"
              type="text"
              value={assignment.taskName}
              onChange={handleTaskNameChange}
              className={styles.assignmentInput}
              placeholder="Enter task name (max 500 characters)"
              required
            />
            <small>{assignment.taskName.length}/500 characters</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Assignment Description</label>
            <div className={styles.quillContainer}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={assignment.description}
                onChange={handleDescriptionChange}
                modules={modules}
                formats={formats}
                placeholder="Enter your coding assignment description here. Include requirements, constraints, and any specific instructions..."
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="technology">Technology/Language</label>
            <input
              id="technology"
              type="text"
              value={assignment.technology}
              onChange={handleTechnologyChange}
              className={styles.assignmentInput}
              placeholder="e.g., Java, Python, React, Node.js"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="maxMarks">Maximum Marks</label>
            <input
              id="maxMarks"
              type="number"
              min="1"
              max="100"
              value={assignment.maxMarks}
              onChange={handleMaxMarksChange}
              className={styles.assignmentInput}
              placeholder="Enter maximum marks"
              required
            />
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className={styles.saveButton} disabled={loading}>
            {loading ? "Creating..." : "Create Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodingAssignmentModal;

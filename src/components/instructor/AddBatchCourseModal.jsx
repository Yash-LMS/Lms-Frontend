import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import styles from "./AddBatchCourseModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FIND_COURSE_FOR_BATCH_URL, ADD_COURSE_TO_BATCH_URL } from "../../constants/apiConstants";

// Utility function
const getUserData = () => {
  try {
    return {
      user: JSON.parse(sessionStorage.getItem("user")),
      token: sessionStorage.getItem("token"),
    };
  } catch (error) {
    console.error("Error parsing user data:", error);
    return { user: null, token: null };
  }
};

const AddBatchCourseModal = ({ 
  isOpen, 
  onClose, 
  selectedBatch,
  onCourseAdded
}) => {
  const [courseList, setCourseList] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch available courses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCourseList();
      setError("");
      setSuccessMessage("");
      setSelectedCourse(null);
    }
  }, [isOpen]);

  const fetchCourseList = async () => {
    setLoading(true);
    try {
      const userData = getUserData();
      const response = await axios.post(FIND_COURSE_FOR_BATCH_URL, {
        user: userData.user,
        token: userData.token,
      });
      
      console.log("Course list response:", response.data);
      
      // Check if response is successful and has payload
      if (response.data && response.data.response === "success" && response.data.payload) {
        // Transform the course data for react-select
        const courseOptions = response.data.payload.map(course => ({
          value: course.courseId || course.id,
          label: course.courseName || course.name,
          data: course
        }));
        
        setCourseList(courseOptions);
      } else {
        setError("No courses available or failed to fetch courses");
        setCourseList([]);
      }
    } catch (error) {
      console.error("Error fetching course list:", error);
      setError("Failed to fetch courses. Please try again.");
      setCourseList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCourse) {
      setError("Please select a course");
      setSuccessMessage("");
      return;
    }

    if (!selectedBatch || !selectedBatch.batchId) {
      setError("No batch selected");
      setSuccessMessage("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const userData = getUserData();
      
      // Format the request according to backend expectations
      const requestData = {
        user: userData.user,
        token: userData.token,
        batchId: selectedBatch.batchId,
        courseId: selectedCourse.value,
      };

      console.log(requestData);
      const response = await axios.post(ADD_COURSE_TO_BATCH_URL, requestData);

      console.log("Add course response:", response.data);

      // Check if the response indicates success
      if (response.data && (response.data.status === "success" || response.data.status === "SUCCESS")) {
        // Call the success callback
        if (onCourseAdded) {
          onCourseAdded(response.data);
        }

        // Show success message
        setSuccessMessage("Course Added in Batch Successfully");
        setError("");
        
        // Reset form
        setSelectedCourse(null);
        
        // Close modal after a delay to show success message
        setTimeout(() => {
          onClose();
          setSuccessMessage("");
        }, 2000);
      } else {
        // Handle failed response
        setError("Failed to add course to batch");
        setSuccessMessage("");
        console.error("Failed to add course:", response.data);
      }
    } catch (error) {
      console.error("Error adding course to batch:", error);
      
      let errorMessage = "Failed to add course to batch. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || 
                     `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check your connection.";
      }
      
      setError(errorMessage);
      setSuccessMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      setSelectedCourse(null);
      setError("");
      setSuccessMessage("");
    }
  };

  if (!isOpen) return null;

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#8e6cef' : '#ddd',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(200, 0, 255, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#8e6cef',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#8e6cef' 
        : state.isFocused 
        ? '#f8f9fa' 
        : 'white',
      color: state.isSelected ? 'white' : '#333',
    }),
  };

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add Course to Batch</h2>
          <button 
            className={styles.closeButton} 
            onClick={handleClose}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.batchInfo}>
            <label>Selected Batch:</label>
            <div className={styles.batchName}>
              {selectedBatch?.batchName || "No batch selected"}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="course-select">Select Course:</label>
              <Select
                id="course-select"
                value={selectedCourse}
                onChange={setSelectedCourse}
                options={courseList}
                styles={customSelectStyles}
                placeholder={loading ? "Loading courses..." : "Choose a course..."}
                isLoading={loading}
                isDisabled={loading || submitting}
                isClearable
                isSearchable
                noOptionsMessage={() => courseList.length === 0 ? "No courses available" : "No options"}
              />
            </div>

            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || submitting || !selectedCourse}
              >
                {submitting ? (
                  <>
                    <span className={styles.spinner}></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    Add Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBatchCourseModal;
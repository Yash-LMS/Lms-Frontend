import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import styles from "./AddBatchTestModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";
import { VIEW_TRAINEE_ASSIGNMENT_URL , ALLOT_ASSIGNMENT_BATCH_URL } from "../../constants/apiConstants";

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

// Utility function to format date for input (YYYY-MM-DD)
const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return formatDateForInput(today);
};

const AddBatchAssignmentModal = ({ 
  isOpen, 
  onClose, 
  selectedBatch,
}) => {
  const [assignmentList, setAssignmentList] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Updated state for date fields
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState("");

  // Fetch available assignments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAssignmentList();
      setError("");
      setSuccessMessage("");
      setSelectedAssignment(null);
      // Reset date fields to default values
      setStartDate(getTodayDate());
      setEndDate("");
    }
  }, [isOpen]);

  const fetchAssignmentList = async () => {
    setLoading(true);
    try {
      const userData = getUserData();
      if (!userData.user || !userData.token) {
        console.error("Missing user data or token");
        setError("User authentication required");
        setLoading(false);
        return;
      }

      const response = await axios.post(VIEW_TRAINEE_ASSIGNMENT_URL , {
        user: userData.user,
        token: userData.token,
      });
      
      console.log("Assignment list response:", response.data);
      
      // Check if response has payload
      if (response.data && response.data.response==='success') {
        // Transform the assignment data for react-select
        const assignmentOptions = response.data.payload.map(assignment => ({
          value: assignment.assignmentId,
          label: assignment.title || `Assignment ${assignment.assignmentId}`,
          data: assignment
        }));
        
        setAssignmentList(assignmentOptions);
      } else {
        setError("No assignments available or failed to fetch assignments");
        setAssignmentList([]);
      }
    } catch (error) {
      console.error("Error fetching assignment list:", error);
      setError("Failed to fetch assignments. Please try again.");
      setAssignmentList([]);
    } finally {
      setLoading(false);
    }
  };

  // Validate date range
  const validateDates = () => {
    if (!startDate || !endDate) {
      return "Both start date and end date are required";
    }

    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (start < today) {
      return "Start date cannot be in the past";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAssignment) {
      setError("Please select an assignment");
      setSuccessMessage("");
      return;
    }

    if (!selectedBatch || !selectedBatch.batchId) {
      setError("No batch selected");
      setSuccessMessage("");
      return;
    }

    // Validate dates
    const dateValidationError = validateDates();
    if (dateValidationError) {
      setError(dateValidationError);
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
        assignmentId: selectedAssignment.value,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };

      console.log("Add assignment request data:", requestData);
      const response = await axios.post(ALLOT_ASSIGNMENT_BATCH_URL, requestData);

      console.log("Add assignment response:", response.data);

      // Check if the response indicates success
      if (response.data && (response.data.response === "success" || response.data.response === "SUCCESS")) {
        // Show success message
        setSuccessMessage("Assignment Added to Batch Successfully");
        setError("");
        
        // Reset form
        setSelectedAssignment(null);
        setStartDate(getTodayDate());
        setEndDate("");
        
        // Close modal after a delay to show success message
        setTimeout(() => {
          onClose();
          setSuccessMessage("");
        }, 2000);
      } else {
        // Handle failed response
        setError(response.data.message || "Failed to add assignment to batch");
        setSuccessMessage("");
        console.error("Failed to add assignment:", response.data);
      }
    } catch (error) {
      console.error("Error adding assignment to batch:", error);
      
      let errorMessage = "Failed to add assignment to batch. Please try again.";
      
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
      setSelectedAssignment(null);
      setError("");
      setSuccessMessage("");
      setStartDate(getTodayDate());
      setEndDate("");
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
          <h2>Add Assignment to Batch</h2>
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
              <label htmlFor="assignment-select">Select Assignment:</label>
              <Select
                id="assignment-select"
                value={selectedAssignment}
                onChange={setSelectedAssignment}
                options={assignmentList}
                styles={customSelectStyles}
                placeholder={loading ? "Loading assignments..." : "Choose an assignment..."}
                isLoading={loading}
                isDisabled={loading || submitting}
                isClearable
                isSearchable
                noOptionsMessage={() => assignmentList.length === 0 ? "No assignments available" : "No options"}
              />
            </div>

            {/* Date Fields */}
            <div className={styles.dateFieldsContainer}>
              <div className={styles.formGroup}>
                <label htmlFor="start-date">Start Date:</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.dateInput}
                  min={getTodayDate()}
                  disabled={submitting}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="end-date">End Date:</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.dateInput}
                  min={startDate || getTodayDate()}
                  disabled={submitting}
                  required
                />
              </div>
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
                disabled={loading || submitting || !selectedAssignment}
              >
                {submitting ? (
                  <>
                    <span className={styles.spinner}></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    Add Assignment
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

export default AddBatchAssignmentModal;
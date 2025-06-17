import React, { useState, useEffect } from "react";
import Select from "react-select";
import axios from "axios";
import styles from "./AddBatchTestModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FIND_TEST_FOR_BATCH_URL , ADD_TEST_TO_BATCH_URL } from "../../constants/apiConstants";

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

const AddBatchTestModal = ({ 
  isOpen, 
  onClose, 
  selectedBatch,
  onTestAdded
}) => {
  const [testList, setTestList] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // New state for additional fields
  const [validity, setValidity] = useState(1);
  const [showResult, setShowResult] = useState("enabled");
  const [showDetailedReport, setShowDetailedReport] = useState("enabled");

  // Fetch available tests when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTestList();
      setError("");
      setSuccessMessage("");
      setSelectedTest(null);
      // Reset new fields to default values
      setValidity(1);
      setShowResult("enabled");
      setShowDetailedReport("enabled");
    }
  }, [isOpen]);

  const fetchTestList = async () => {
    setLoading(true);
    try {
      const userData = getUserData();
      if (!userData.user || !userData.token) {
        console.error("Missing user data or token");
        setError("User authentication required");
        setLoading(false);
        return;
      }

      const response = await axios.post(FIND_TEST_FOR_BATCH_URL , {
        user: userData.user,
        token: userData.token,
      });
      
      console.log("Test list response:", response.data);
      
      // Check if response has payload
      if (response.data && response.data.response==='success') {
        // Transform the test data for react-select
        const testOptions = response.data.payload.map(test => ({
          value: test.testId || test.id,
          label: test.testName || test.name,
          data: test
        }));
        
        setTestList(testOptions);
      } else {
        setError("No tests available or failed to fetch tests");
        setTestList([]);
      }
    } catch (error) {
      console.error("Error fetching test list:", error);
      setError("Failed to fetch tests. Please try again.");
      setTestList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidityChange = (increment) => {
    setValidity(prev => {
      const newValue = prev + increment;
      return newValue < 1 ? 1 : newValue;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTest) {
      setError("Please select a test");
      setSuccessMessage("");
      return;
    }

    if (!selectedBatch || !selectedBatch.batchId) {
      setError("No batch selected");
      setSuccessMessage("");
      return;
    }

    if (validity < 1) {
      setError("Validity must be at least 1 day");
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
        batchTest: {
          ...selectedTest.data,
          validity: validity,
          showResult: showResult,
          showDetailedReport: showDetailedReport
        }
      };

      console.log("Add test request data:", requestData);
      const response = await axios.post(ADD_TEST_TO_BATCH_URL, requestData);

      console.log("Add test response:", response.data);

      // Check if the response indicates success
      if (response.data && (response.data.response === "success" || response.data.response === "SUCCESS")) {
        // Call the success callback
        if (onTestAdded) {
          onTestAdded(response.data);
        }

        // Show success message
        setSuccessMessage("Test Added to Batch Successfully");
        setError("");
        
        // Reset form
        setSelectedTest(null);
        setValidity(1);
        setShowResult("enabled");
        setShowDetailedReport("enabled");
        
        // Close modal after a delay to show success message
        setTimeout(() => {
          onClose();
          setSuccessMessage("");
        }, 2000);
      } else {
        // Handle failed response
        setError("Failed to add test to batch");
        setSuccessMessage("");
        console.error("Failed to add test:", response.data);
      }
    } catch (error) {
      console.error("Error adding test to batch:", error);
      
      let errorMessage = "Failed to add test to batch. Please try again.";
      
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
      setSelectedTest(null);
      setError("");
      setSuccessMessage("");
      setValidity(1);
      setShowResult("enabled");
      setShowDetailedReport("enabled");
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
          <h2>Add Test to Batch</h2>
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
              <label htmlFor="test-select">Select Test:</label>
              <Select
                id="test-select"
                value={selectedTest}
                onChange={setSelectedTest}
                options={testList}
                styles={customSelectStyles}
                placeholder={loading ? "Loading tests..." : "Choose a test..."}
                isLoading={loading}
                isDisabled={loading || submitting}
                isClearable
                isSearchable
                noOptionsMessage={() => testList.length === 0 ? "No tests available" : "No options"}
              />
            </div>

            {/* Validity Field */}
            <div className={styles.formGroup}>
              <label htmlFor="validity">Validity (Days):</label>
              <div className={styles.counterContainer}>
                <button
                  type="button"
                  className={styles.counterButton}
                  onClick={() => handleValidityChange(-1)}
                  disabled={validity <= 1 || submitting}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <input
                  id="validity"
                  type="number"
                  value={validity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setValidity(value < 1 ? 1 : value);
                  }}
                  className={styles.counterInput}
                  min="1"
                  disabled={submitting}
                />
                <button
                  type="button"
                  className={styles.counterButton}
                  onClick={() => handleValidityChange(1)}
                  disabled={submitting}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>

            {/* Permission Toggles */}
            <div className={styles.permissionSection}>
              <h3 className={styles.permissionTitle}>Test Permissions</h3>
              
              <div className={styles.toggleGroup}>
                <div className={styles.toggleContainer}>
                  <label className={styles.toggleLabel}>Show Result:</label>
                  <div className={styles.toggleButtons}>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${showResult === "enabled" ? styles.toggleActive : ""}`}
                      onClick={() => setShowResult("enabled")}
                      disabled={submitting}
                    >
                      Enabled
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${showResult === "disabled" ? styles.toggleActive : ""}`}
                      onClick={() => setShowResult("disabled")}
                      disabled={submitting}
                    >
                      Disabled
                    </button>
                  </div>
                </div>

                <div className={styles.toggleContainer}>
                  <label className={styles.toggleLabel}>Show Detailed Report:</label>
                  <div className={styles.toggleButtons}>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${showDetailedReport === "enabled" ? styles.toggleActive : ""}`}
                      onClick={() => setShowDetailedReport("enabled")}
                      disabled={submitting}
                    >
                      Enabled
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${showDetailedReport === "disabled" ? styles.toggleActive : ""}`}
                      onClick={() => setShowDetailedReport("disabled")}
                      disabled={submitting}
                    >
                      Disabled
                    </button>
                  </div>
                </div>
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
                disabled={loading || submitting || !selectedTest}
              >
                {submitting ? (
                  <>
                    <span className={styles.spinner}></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    Add Test
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

export default AddBatchTestModal;
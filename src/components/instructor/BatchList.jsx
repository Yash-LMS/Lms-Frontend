import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BatchList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileText,
  faBookOpen,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import AddBatchCourseModal from "./AddBatchCourseModal";
import AddCandidateToBatch from "./AddCandidateToBatch";
import AddBatchTestModal from "./AddBatchTestModal";

const BatchList = ({
  batches,
  loading,
  error,
  onAddTest,
  onAddCourse,
  onAddCandidate,
}) => {
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  // Modal state for Add Course
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedBatchForCourse, setSelectedBatchForCourse] = useState(null);

  // Modal state for Add Candidate
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [selectedBatchForCandidate, setSelectedBatchForCandidate] =
    useState(null);

  //Modal state for Add Test
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedBatchForTest, setSelectedBatchForTest] = useState(null);

  // Calculate pagination
  const indexOfLastBatch = currentPage * cardsPerPage;
  const indexOfFirstBatch = indexOfLastBatch - cardsPerPage;
  const currentBatches = batches
    ? batches.slice(indexOfFirstBatch, indexOfLastBatch)
    : [];
  const totalPages = batches ? Math.ceil(batches.length / cardsPerPage) : 0;

  // Pagination handlers
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Course Modal handlers
  const handleAddCourse = (batch) => {
    setSelectedBatchForCourse(batch);
    setIsCourseModalOpen(true);
  };

  const handleCloseCourseModal = () => {
    setIsCourseModalOpen(false);
    setSelectedBatchForCourse(null);
  };

  const handleCourseAdded = (response) => {
    console.log("Course added successfully:", response);

    if (onAddCourse) {
      onAddCourse(selectedBatchForCourse, response);
    }
  };

  // Test Modal handlers
  const handleAddTest = (batch) => {
    setSelectedBatchForTest(batch);
    setIsTestModalOpen(true);
  };

  const handleCloseTestModal = () => {
    setIsTestModalOpen(false);
    setSelectedBatchForTest(null);
  };

  const handleTestAdded = (response) => {
    console.log("Test added successfully:", response);
    if (onAddTest) {
      onAddTest(selectedBatchForTest, response);
    }
  };

  // Candidate Modal handlers
  const handleAddCandidate = (batch) => {
    setSelectedBatchForCandidate(batch);
    setIsCandidateModalOpen(true);
  };

  const handleCloseCandidateModal = () => {
    setIsCandidateModalOpen(false);
    setSelectedBatchForCandidate(null);
  };

  const handleCandidateAdded = () => {
    // Handle success - you can show a success message or refresh data
    console.log(
      "Candidates added successfully to batch:",
      selectedBatchForCandidate?.batchId
    );

    // If you have a callback from parent component, call it
    if (onAddCandidate) {
      onAddCandidate(selectedBatchForCandidate);
    }

    // You might want to show a success notification here
    // showSuccessNotification("Candidates added to batch successfully!");
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading batches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>
          {typeof error === "string"
            ? error
            : error.message || "An error occurred."}
        </p>
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className={styles.noCourses}>
        No Batches found. Create a new batch to get started.
      </div>
    );
  }

  return (
    <div className={styles.courseListContainer}>
      <div className={styles.courseList}>
        {currentBatches.map((batch) => (
          <div key={batch.batchId} className={styles.courseCard}>
            <div className={styles.courseTag}>BATCH</div>
            <div className={styles.courseHeader}>
              <h3>{batch.batchName}</h3>
              <span
                className={`${styles.statusBadge} ${
                  styles[batch.batchStatus?.toLowerCase() || "pending"]
                }`}
              >
                {batch.batchStatus.toUpperCase() || "PENDING"}
              </span>
            </div>
            <div className={styles.cardActions}>
              <button
                className={styles.addButton}
                onClick={() => handleAddTest(batch)}
              >
                <FontAwesomeIcon icon={faFileText} />
                <span style={{ marginLeft: "5px" }}>Add Test</span>
              </button>
              <button
                className={styles.previewButton}
                onClick={() => handleAddCourse(batch)}
              >
                <FontAwesomeIcon icon={faBookOpen} />
                <span style={{ marginLeft: "5px" }}>Add Course</span>
              </button>
              <button
                className={styles.editButton}
                onClick={() => handleAddCandidate(batch)}
              >
                <FontAwesomeIcon icon={faUserPlus} />
                <span style={{ marginLeft: "5px" }}>Add Candidate</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {batches && batches.length > cardsPerPage && (
        <div className={styles.paginationControls}>
          <button
            className={styles.paginationButton}
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.pageIndicator}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.paginationButton}
            onClick={nextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Course Modal */}
      <AddBatchCourseModal
        isOpen={isCourseModalOpen}
        onClose={handleCloseCourseModal}
        selectedBatch={selectedBatchForCourse}
        onCourseAdded={handleCourseAdded}
      />

      {/* Add Test Modal */}
      <AddBatchTestModal
        isOpen={isTestModalOpen}
        onClose={handleCloseTestModal}
        selectedBatch={selectedBatchForTest}
        onTestAdded={handleTestAdded}
      />

      {/* Add Candidate Modal */}
      <AddCandidateToBatch
        isOpen={isCandidateModalOpen}
        onClose={handleCloseCandidateModal}
        batchId={selectedBatchForCandidate?.batchId}
        batchName={selectedBatchForCandidate?.batchName}
        onCandidateAdded={handleCandidateAdded}
      />
    </div>
  );
};

export default BatchList;
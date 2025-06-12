import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BatchList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileText, faBookOpen, faUserPlus } from "@fortawesome/free-solid-svg-icons";

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
  
  // Calculate pagination
  const indexOfLastBatch = currentPage * cardsPerPage;
  const indexOfFirstBatch = indexOfLastBatch - cardsPerPage;
  const currentBatches = batches ? batches.slice(indexOfFirstBatch, indexOfLastBatch) : [];
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
          {typeof error === 'string' ? error : error.message || "An error occurred."}
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
                  styles[batch.batchStatus?.toLowerCase() || 'pending']
                }`}
              >
                {batch.batchStatus || 'PENDING'}
              </span>
            </div>
            <div className={styles.cardActions}>
              <button
                className={styles.addButton}
                onClick={() => onAddTest(batch)}
              >
                <FontAwesomeIcon icon={faFileText} />
                <span style={{ marginLeft: "5px" }}>Add Test</span>
              </button>
              <button
                className={styles.previewButton}
                onClick={() => onAddCourse(batch)}
              >
                <FontAwesomeIcon icon={faBookOpen} />
                <span style={{ marginLeft: "5px" }}>Add Course</span>
              </button>
              <button
                className={styles.editButton}
                onClick={() => onAddCandidate(batch)}
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
    </div>
  );
};

export default BatchList;
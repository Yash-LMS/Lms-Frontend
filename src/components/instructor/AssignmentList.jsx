import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./BatchList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faEye,
  faCalendarAlt,
  faClipboardList,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";

const AssignmentList = ({ assignments, loading, error, onRetry }) => {
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  // Calculate pagination
  const indexOfLastAssignment = currentPage * cardsPerPage;
  const indexOfFirstAssignment = indexOfLastAssignment - cardsPerPage;
  const currentAssignments = assignments
    ? assignments.slice(indexOfFirstAssignment, indexOfLastAssignment)
    : [];
  const totalPages = assignments ? Math.ceil(assignments.length / cardsPerPage) : 0;

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

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get assignment status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return styles.approved;
      case "pending":
        return styles.pending;
      case "rejected":
        return styles.rejected;
      default:
        return styles.pending;
    }
  };

  // Check if assignment is overdue
  const isOverdue = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const assignmentEndDate = new Date(endDate);
    return assignmentEndDate < today;
  };

  // Assignment action handlers
  const handleViewAssignment = (assignment) => {
    console.log("Viewing assignment:", assignment);
    // Navigate to assignment details page
    // navigate(`/assignment/${assignment.assignmentId}`);
  };

  const handleEditAssignment = (assignment) => {
    console.log("Editing assignment:", assignment);
    // Navigate to edit assignment page
    // navigate(`/assignment/edit/${assignment.assignmentId}`);
  };

  const handleViewSubmissions = (assignment) => {
    console.log("Viewing submissions for assignment:", assignment);
    // Navigate to submissions page
    // navigate(`/assignment/${assignment.assignmentId}/submissions`);
  };

  const handleGradeAssignment = (assignment) => {
    console.log("Grading assignment:", assignment);
    // Navigate to grading page
    // navigate(`/assignment/${assignment.assignmentId}/grade`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading assignments...</p>
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
        <button className={styles.retryButton} onClick={onRetry}>
          Try Again
        </button>
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className={styles.noCourses}>
        No assignments found. Create a new assignment to get started.
      </div>
    );
  }

  return (
    <div className={styles.courseListContainer}>
      <div className={styles.courseList}>
        {currentAssignments.map((assignment) => (
          <div key={assignment.assignmentId || assignment.id} className={styles.courseCard}>
            <div className={styles.courseTag}>ASSIGNMENT</div>
            <div className={styles.courseHeader}>
              <span
                className={`${styles.statusBadge} ${getStatusColor(assignment.status || assignment.assignmentStatus)}`}
              >
                {(assignment.status || assignment.assignmentStatus || "PENDING").toUpperCase()}
              </span>
            </div>
            
            <div className={styles.assignmentDetails}>
              <p className={styles.description}>
                {assignment.description?.length > 100
                  ? `${assignment.description.substring(0, 100)}...`
                  : assignment.description || 'No description available'}
              </p>
              
              <div className={styles.assignmentMeta}>
                <div className={styles.metaItem}>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>Start: {formatDate(assignment.startDate)}</span>
                </div>
                <div className={styles.metaItem}>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>
                    End: {formatDate(assignment.endDate)}
                    {isOverdue(assignment.endDate) && (
                      <span className={styles.overdueText}> (Overdue)</span>
                    )}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <FontAwesomeIcon icon={faClipboardList} />
                  <span>Total Marks: {assignment.totalMarks || 0}</span>
                </div>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                className={styles.previewButton}
                onClick={() => handleViewAssignment(assignment)}
              >
                <FontAwesomeIcon icon={faEye} />
                <span style={{ marginLeft: "5px" }}>View</span>
              </button>
              
              <button
                className={styles.editButton}
                onClick={() => handleEditAssignment(assignment)}
              >
                <FontAwesomeIcon icon={faEdit} />
                <span style={{ marginLeft: "5px" }}>Edit</span>
              </button>
              
              <button
                className={styles.addButton}
                onClick={() => handleViewSubmissions(assignment)}
              >
                <FontAwesomeIcon icon={faClipboardList} />
                <span style={{ marginLeft: "5px" }}>Submissions</span>
              </button>
              
              <button
                className={styles.addCourseButton}
                onClick={() => handleGradeAssignment(assignment)}
              >
                <FontAwesomeIcon icon={faGraduationCap} />
                <span style={{ marginLeft: "5px" }}>Grade</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {assignments && assignments.length > cardsPerPage && (
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

export default AssignmentList;
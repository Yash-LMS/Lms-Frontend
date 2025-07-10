import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./AssignmentList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faEye,
  faCalendarAlt,
  faClipboardList,
  faGraduationCap,
  faTimes,
  faDownload,
  faComment,
  faCheck,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { VIEW_ASSIGNMENT_SUBMISSION_URL, ASSIGNMENT_SUBMISSION_FEEDBACK_URL, DOWNLOAD_ASSIGNMENT_FILES, DOWNLOAD_ASSIGNMENT_INSTRUCTION_FILE } from "../../constants/apiConstants";

const AssignmentList = ({ assignments, loading, error, onRetry }) => {
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  // Modal states
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState(null);

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    marks: '',
    feedback: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Get user data function
  const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      const role = user?.role || null;
      
      return {
        user,
        token,
        role,
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

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

  // Fetch submissions for an assignment
  const fetchSubmissions = async (assignmentId) => {
    setSubmissionsLoading(true);
    setSubmissionsError(null);
    
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        throw new Error("User authentication required");
      }

      const response = await axios.post(VIEW_ASSIGNMENT_SUBMISSION_URL, {
        user: user,
        token: token,
        assignmentId: assignmentId,
      });

      if (response.data && response.data.response === "success") {
        setSubmissions(response.data.payload || []);
      } else {
        throw new Error(response.data?.message || "Failed to fetch submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setSubmissionsError(error.message || "Failed to fetch submissions");
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Handle view submissions
  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);
    await fetchSubmissions(assignment.assignmentId);
  };

    const handleDownloadInstructionFile = async (assignment) => {
    setSelectedAssignment(assignment);
    await handleDownload(assignment.assignmentId);
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!selectedSubmission || !feedbackForm.marks || !feedbackForm.feedback) {
      alert("Please provide both marks and feedback");
      return;
    }

    setFeedbackSubmitting(true);
    
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        throw new Error("User authentication required");
      }

      const response = await axios.post(ASSIGNMENT_SUBMISSION_FEEDBACK_URL, {
        user: user,
        token: token,
        allotmentId: selectedSubmission.allotmentId,
        marks: parseFloat(feedbackForm.marks),
        feedback: feedbackForm.feedback,
      });

      if (response.data && response.data.response === "success") {
       
        
        setShowFeedbackModal(false);
        setFeedbackForm({ marks: '', feedback: '' });
        setSelectedSubmission(null);
        
        // Refresh submissions list
        if (selectedAssignment) {
          await fetchSubmissions(selectedAssignment.assignmentId);
        }
      } else {
        throw new Error(response.data?.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Handle feedback modal open - Reset form fields
  const handleOpenFeedback = (submission) => {
    setSelectedSubmission(submission);
    // Reset form fields instead of using previous values
    setFeedbackForm({
      marks: '',
      feedback: '',
    });
    setShowFeedbackModal(true);
  };

  // Handle file download

const handleDownloadFile = async (allotmentId) => {
    try {
      const { user, token } = getUserData();

      const response = await axios.post(
        `${DOWNLOAD_ASSIGNMENT_FILES}`, // your API endpoint
        { allotmentId, user, token }, // request body
        {
          responseType: 'blob', // important to receive file as blob
        }
      );

      // Extract filename from content-disposition header if present
      const disposition = response.headers['content-disposition'];
      let filename = 'downloaded-file';
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      // Get the content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Create a blob URL with the correct content type and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      // Handle errors here (e.g. unauthorized, file not found)
      if (error.response && error.response.data) {
        // Try to parse error JSON from blob
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorMsg = JSON.parse(reader.result);
            alert(errorMsg.message || 'Error downloading file');
          } catch {
            alert('Error downloading file');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        alert('Error downloading file');
      }
    }
  };

  
const handleDownload = async (assignmentId) => {
    try {
      const { user, token } = getUserData();


      const response = await axios.post(
        `${DOWNLOAD_ASSIGNMENT_INSTRUCTION_FILE}`, // your API endpoint
        { assignmentId, user, token }, // request body
        {
          responseType: 'blob', // important to receive file as blob
        }
      );

      // Extract filename from content-disposition header if present
      const disposition = response.headers['content-disposition'];
      let filename = 'instructions';
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      // Get the content type from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Create a blob URL with the correct content type and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      // Handle errors here (e.g. unauthorized, file not found)
      if (error.response && error.response.data) {
        // Try to parse error JSON from blob
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorMsg = JSON.parse(reader.result);
            alert(errorMsg.message || 'Error downloading file');
          } catch {
            alert('Error downloading file');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        alert('Error downloading file');
      }
    }
  };



  // Extract filename from filepath
  const getFileNameFromPath = (filePath) => {
    if (!filePath) return 'assignment_file';
    return filePath.split('\\').pop() || filePath.split('/').pop() || 'assignment_file';
  };

  // Close modals
  const closeSubmissionsModal = () => {
    setShowSubmissionsModal(false);
    setSelectedAssignment(null);
    setSubmissions([]);
    setSubmissionsError(null);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedSubmission(null);
    setFeedbackForm({ marks: '', feedback: '' });
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
        <div key={assignment.assignmentId} className={styles.courseCard}>
          <div className={styles.courseTag}>ASSIGNMENT</div>
          <div className={styles.courseHeader}>
            <h3>{assignment.title}</h3>
            <span
              className={`${styles.statusBadge} ${getStatusColor(assignment.approvalStatus)}`}
            >
              {(assignment.approvalStatus).toUpperCase()}
            </span>
          </div>
          
          <div className={styles.assignmentDetails}>
            <div className={styles.assignmentMeta}>              
              <div className={styles.metaItem}>
                <p className={styles.description}>
                  {assignment.description?.length > 100
                    ? `${assignment.description.substring(0, 100)}...`
                    : assignment.description || 'No description available'}
                </p>
              </div>
              <div className={styles.metaItem}>
                <span>Total Marks: {assignment.totalMarks || 0}</span>
              </div>
            </div>
            
            {/* Count Display Section */}
            <div className={styles.countSection}>
              <div className={styles.countGrid}>
                <div className={styles.countColumn}>
                  <div className={styles.countColumnHeader}>
                    <span className={styles.columnTitle}>Submissions</span>
                  </div>
                  <div className={styles.countItems}>
                    <div className={styles.countItem}>
                      <div className={styles.countLabel}>Submitted</div>
                      <div className={styles.countValue}>{assignment.submittedCount || 0}</div>
                    </div>
                    <div className={styles.countItem}>
                      <div className={styles.countLabel}>Pending</div>
                      <div className={styles.countValue}>{assignment.pendingCount || 0}</div>
                    </div>
                    <div className={styles.countItem}>
                      <div className={styles.countLabel}>Expired</div>
                      <div className={styles.countValue}>{assignment.expiredCount || 0}</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.countColumn}>
                  <div className={styles.countColumnHeader}>
                    <span className={styles.columnTitle}>Evaluations</span>
                  </div>
                  <div className={styles.countItems}>
                    <div className={styles.countItem}>
                      <div className={styles.countLabel}>Evaluated</div>
                      <div className={styles.countValue}>{assignment.evaluationCount || 0}</div>
                    </div>
                    <div className={styles.countItem}>
                      <div className={styles.countLabel}>Pending</div>
                      <div className={styles.countValue}>{assignment.pendingEvaluationCount || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Total Allotment Row */}
              <div className={styles.totalAllotmentRow}>
                <div className={styles.totalAllotmentItem}>
                  <span className={styles.totalAllotmentLabel}>Total Allotments:</span>
                  <span className={styles.totalAllotmentValue}>{assignment.totalAllotment || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.cardActions}>
            <button
              className={styles.previewButton}
              onClick={() => handleViewSubmissions(assignment)}
            >
              <FontAwesomeIcon icon={faEye} />
              <span style={{ marginLeft: "5px" }}>View Submissions</span>
            </button>

            <button
              className={styles.downloadBtn}
              onClick={() => handleDownloadInstructionFile(assignment)}
            >
              <FontAwesomeIcon icon={faDownload} />
              <span style={{ marginLeft: "5px" }}>Download Instruction</span>
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

    {/* Submissions Modal */}
    {showSubmissionsModal && (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Assignment Submissions - {selectedAssignment?.title}</h3>
            <button className={styles.closeButton} onClick={closeSubmissionsModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className={styles.modalBody}>
            {submissionsLoading && (
              <div className={styles.loadingContainer}>
                <p>Loading submissions...</p>
              </div>
            )}
            
            {submissionsError && (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{submissionsError}</p>
              </div>
            )}
            
            {!submissionsLoading && !submissionsError && submissions.length === 0 && (
              <div className={styles.noSubmissions}>
                <p>No submissions found for this assignment.</p>
              </div>
            )}
            
            {!submissionsLoading && !submissionsError && submissions.length > 0 && (
              <div className={styles.submissionsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Allotment ID</th>
                      <th>Allotment Date</th>
                      <th>End Date</th>
                      <th>Submission Date</th>
                      <th>Status</th>
                      <th>Marks</th>
                      <th>Evaluation Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.allotmentId}>
                        <td>{submission.allotmentId}</td>
                        <td>{formatDate(submission.allotmentDate)}</td>
                        <td>{formatDate(submission.endDate)}</td>
                        <td>{formatDate(submission.submissionDate)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${submission.status === 'submitted' ? styles.approved : styles.pending}`}>
                            {submission.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </td>
                        <td>
                          {submission.marks !== null && submission.marks !== undefined ? (
                            <span className={styles.marksDisplay}>
                              {submission.marks} / {submission.totalMarks}
                            </span>
                          ) : (
                            <span className={styles.notGraded}>Not Graded</span>
                          )}
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${submission.evaluationStatus === 'evaluated' ? styles.approved : styles.pending}`}>
                            {submission.evaluationStatus?.toUpperCase() || 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            {submission.fileStatus === "IN_FILE" && (
                              <button
                                className={styles.downloadButton}
                                onClick={() => handleDownloadFile(submission.allotmentId)}
                                title="Download Submission"
                              >
                                <FontAwesomeIcon icon={faDownload} />
                              </button>
                            )}

                            {submission.evaluationStatus === 'pending' && (
                              <button
                                className={styles.feedbackButton}
                                onClick={() => handleOpenFeedback(submission)}
                                title="Provide Feedback"
                              >
                                <FontAwesomeIcon icon={faComment} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Feedback Modal */}
    {showFeedbackModal && (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Provide Feedback</h3>
            <button className={styles.closeButton} onClick={closeFeedbackModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className={styles.modalBody}>
            {selectedSubmission && (
              <div className={styles.submissionInfo}>
                <p><strong>Allotment ID:</strong> {selectedSubmission.allotmentId}</p>
                <p><strong>Assignment:</strong> {selectedAssignment?.title}</p>
                <p><strong>Submission Status:</strong> {selectedSubmission.status}</p>
                <p><strong>File:</strong> {getFileNameFromPath(selectedSubmission.filePath)}</p>
                {selectedSubmission.marks !== null && selectedSubmission.marks !== undefined && (
                  <p><strong>Current Marks:</strong> {selectedSubmission.marks} / {selectedSubmission.totalMarks}</p>
                )}
                {selectedSubmission.feedBack && (
                  <p><strong>Previous Feedback:</strong> {selectedSubmission.feedBack}</p>
                )}
              </div>
            )}

            <div className={styles.feedbackForm}>
              <div className={styles.formGroup}>
                <label htmlFor="marks">
                  Marks (out of {selectedSubmission?.totalMarks || 0}):
                </label>
                <input
                  type="number"
                  id="marks"
                  min="0"
                  max={selectedSubmission?.totalMarks || 100}
                  value={feedbackForm.marks}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, marks: e.target.value })}
                  placeholder="Enter marks"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="feedback">Feedback:</label>
                <textarea
                  id="feedback"
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  placeholder="Provide detailed feedback..."
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  className={styles.cancelButton}
                  onClick={closeFeedbackModal}
                  disabled={feedbackSubmitting}
                >
                  Cancel
                </button>
                <button
                  className={styles.submitButton}
                  onClick={handleSubmitFeedback}
                  disabled={feedbackSubmitting || !feedbackForm.marks || !feedbackForm.feedback}
                >
                  {feedbackSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faStar} className={styles.spinning} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default AssignmentList;
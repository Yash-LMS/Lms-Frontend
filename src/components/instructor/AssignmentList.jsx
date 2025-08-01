import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./AssignmentList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faTimes,
  faDownload,
  faComment,
  faCheck,
  faStar,
  faFilter,
  faChevronDown,
  faFileExcel,
  faExclamationTriangle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { VIEW_ASSIGNMENT_SUBMISSION_URL, ASSIGNMENT_SUBMISSION_FEEDBACK_URL, DOWNLOAD_ASSIGNMENT_FILES, DOWNLOAD_ASSIGNMENT_INSTRUCTION_FILE } from "../../constants/apiConstants";
import ExportToExcel from "../../assets/ExportToExcel";

const AssignmentList = ({ assignments, loading, error, onRetry }) => {
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  const [showViewFeedbackModal, setShowViewFeedbackModal] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Download states
  const [downloadError, setDownloadError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  // Get unique categories and subcategories
  const getFilterOptions = () => {
    if (!assignments || assignments.length === 0) {
      return { categories: [], categorySubcategoryMap: {} };
    }

    const categories = new Set();
    const categorySubcategoryMap = {};

    assignments.forEach(assignment => {
      const category = assignment.category || 'Uncategorized';
      const subCategory = assignment.subCategory || 'General';
      
      categories.add(category);
      
      if (!categorySubcategoryMap[category]) {
        categorySubcategoryMap[category] = new Set();
      }
      categorySubcategoryMap[category].add(subCategory);
    });

    // Convert sets to arrays and sort
    const sortedCategories = Array.from(categories).sort();
    const sortedCategorySubcategoryMap = {};
    
    Object.keys(categorySubcategoryMap).forEach(category => {
      sortedCategorySubcategoryMap[category] = Array.from(categorySubcategoryMap[category]).sort();
    });

    return {
      categories: sortedCategories,
      categorySubcategoryMap: sortedCategorySubcategoryMap
    };
  };

  const { categories, categorySubcategoryMap } = getFilterOptions();

  // Get subcategories for selected category
  const getSubcategoriesForCategory = (category) => {
    return categorySubcategoryMap[category] || [];
  };

  // Filter assignments based on selected filters
  const getFilteredAssignments = () => {
    if (!assignments) return [];

    let filtered = assignments;

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(assignment => 
        (assignment.category || 'Uncategorized') === selectedCategory
      );
    }

    // Apply subcategory filter
    if (selectedSubCategory) {
      filtered = filtered.filter(assignment => 
        (assignment.subCategory || 'General') === selectedSubCategory
      );
    }

    return filtered;
  };

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subcategories = getSubcategoriesForCategory(selectedCategory);
      if (subcategories.length > 0 && !subcategories.includes(selectedSubCategory)) {
        setSelectedSubCategory('');
      }
    } else {
      setSelectedSubCategory('');
    }
  }, [selectedCategory]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubCategory]);

  // Auto-clear success/error messages
  useEffect(() => {
    if (downloadSuccess) {
      const timer = setTimeout(() => setDownloadSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [downloadSuccess]);

  useEffect(() => {
    if (downloadError) {
      const timer = setTimeout(() => setDownloadError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [downloadError]);

  useEffect(() => {
    if (feedbackSuccess) {
      const timer = setTimeout(() => setFeedbackSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackSuccess]);

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

  // Get filtered assignments for pagination
  const filteredAssignments = getFilteredAssignments();

  // Calculate pagination based on filtered results
  const indexOfLastAssignment = currentPage * cardsPerPage;
  const indexOfFirstAssignment = indexOfLastAssignment - cardsPerPage;
  const currentAssignments = filteredAssignments.slice(indexOfFirstAssignment, indexOfLastAssignment);
  const totalPages = Math.ceil(filteredAssignments.length / cardsPerPage);

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

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setCurrentPage(1);
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

  // Handle view feedback
const handleViewFeedback = (submission) => {
  setViewingSubmission(submission);
  setShowViewFeedbackModal(true);
};

// Close view feedback modal
const closeViewFeedbackModal = () => {
  setShowViewFeedbackModal(false);
  setViewingSubmission(null);
};

  // Check if assignment is overdue
  const isOverdue = (endDate) => {
    if (!endDate) return false;
    const today = new Date();
    const assignmentEndDate = new Date(endDate);
    return assignmentEndDate < today;
  };

  // Prepare data for Excel export
  const prepareExportData = () => {
    if (!submissions || submissions.length === 0) return [];

    return submissions.map(submission => ({
      allotmentId: submission.allotmentId,
      traineeName: submission.traineeName,
      employeeType: submission.employeeType?.toUpperCase() || 'N/A',
      allotmentDate: formatDate(submission.allotmentDate),
      endDate: formatDate(submission.endDate),
      submissionDate: formatDate(submission.submissionDate),
      status: submission.status?.toUpperCase() || 'PENDING',
      marks: submission.marks !== null && submission.marks !== undefined ? 
        `${submission.marks}/${submission.totalMarks}` : 'Not Graded',
      evaluationStatus: submission.evaluationStatus?.toUpperCase() || 'PENDING',
      feedback: submission.feedBack || 'No feedback provided',
      fileStatus: submission.fileStatus || 'N/A'
    }));
  };

  // Excel export headers mapping
  const getExportHeaders = () => ({
    allotmentId: 'Allotment ID',
    traineeName: 'Trainee Name',
    employeeType: 'Employee Type',
    allotmentDate: 'Allotment Date',
    endDate: 'End Date',
    submissionDate: 'Submission Date',
    status: 'Status',
    marks: 'Marks',
    evaluationStatus: 'Evaluation Status',
    feedback: 'Feedback',
    fileStatus: 'File Status'
  });

  // Generate filename for export
  const getExportFileName = () => {
    const assignmentTitle = selectedAssignment?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Assignment';
    const currentDate = new Date().toISOString().split('T')[0];
    return `${assignmentTitle}_Submissions_${currentDate}`;
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
      setFeedbackError("Please provide both marks and feedback");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError(null);
    setFeedbackSuccess(false);
    
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
        setFeedbackSuccess(true);
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
      setFeedbackError(error.message || "Failed to submit feedback");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Handle feedback modal open - Reset form fields
  const handleOpenFeedback = (submission) => {
    setSelectedSubmission(submission);
    setFeedbackForm({
      marks: '',
      feedback: '',
    });
    setFeedbackError(null);
    setFeedbackSuccess(false);
    setShowFeedbackModal(true);
  };

  // Handle file download
  const handleDownloadFile = async (allotmentId) => {
    setDownloadError(null);
    setDownloadSuccess(null);
    
    try {
      const { user, token } = getUserData();

      const response = await axios.post(
        `${DOWNLOAD_ASSIGNMENT_FILES}`,
        { allotmentId, user, token },
        {
          responseType: 'blob',
        }
      );

      const disposition = response.headers['content-disposition'];
      let filename = 'downloaded-file';
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(`File "${filename}" downloaded successfully`);

    } catch (error) {
      if (error.response && error.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorMsg = JSON.parse(reader.result);
            setDownloadError(errorMsg.message || 'Error downloading file');
          } catch {
            setDownloadError('Error downloading file');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        setDownloadError('Error downloading file');
      }
    }
  };

  const handleDownload = async (assignmentId) => {
    setDownloadError(null);
    setDownloadSuccess(null);
    
    try {
      const { user, token } = getUserData();

      const response = await axios.post(
        `${DOWNLOAD_ASSIGNMENT_INSTRUCTION_FILE}`,
        { assignmentId, user, token },
        {
          responseType: 'blob',
        }
      );

      const disposition = response.headers['content-disposition'];
      let filename = 'instructions';
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(`Instruction file "${filename}" downloaded successfully`);

    } catch (error) {
      if (error.response && error.response.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorMsg = JSON.parse(reader.result);
            setDownloadError(errorMsg.message || 'Error downloading instruction file');
          } catch {
            setDownloadError('Error downloading instruction file');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        setDownloadError('Error downloading instruction file');
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
    setFeedbackError(null);
    setFeedbackSuccess(false);
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
      {/* Global Success/Error Messages */}
      {downloadSuccess && (
        <div className={styles.successContainer}>
          <div className={styles.successMessage}>
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>{downloadSuccess}</span>
          </div>
        </div>
      )}
      
      {downloadError && (
        <div className={styles.errorContainer}>
          <div className={styles.errorMessage}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>{downloadError}</span>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <button 
            className={styles.filterToggle}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>Filters</span>
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className={`${styles.chevron} ${showFilters ? styles.rotated : ''}`}
            />
          </button>
          
          {(selectedCategory || selectedSubCategory) && (
            <div className={styles.activeFilters}>
              <span className={styles.filterCount}>
                {filteredAssignments.length} of {assignments.length} assignments
              </span>
              <button className={styles.clearFilters} onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className={styles.filterControls}>
            <div className={styles.filterGroup}>
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="subcategory">Subcategory:</label>
              <select
                id="subcategory"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className={styles.filterSelect}
                disabled={!selectedCategory}
              >
                <option value="">All Subcategories</option>
                {selectedCategory && getSubcategoriesForCategory(selectedCategory).map(subCategory => (
                  <option key={subCategory} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredAssignments.length !== assignments.length && (
        <div className={styles.resultsInfo}>
          <p>
            Showing {filteredAssignments.length} of {assignments.length} assignments
            {selectedCategory && ` in "${selectedCategory}"`}
            {selectedSubCategory && ` > "${selectedSubCategory}"`}
          </p>
        </div>
      )}

      {/* Assignment Cards */}
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
                <div className={styles.metaItem}> 
                  <span className={styles.categoryTag}>
                   Category:  {assignment.category || 'Uncategorized'}
                  </span>
                </div>  
                <div className={styles.metaItem}>
                  {assignment.subCategory && (
                    <span className={styles.subCategoryTag}>
                     Subcategory: {assignment.subCategory}
                    </span>
                  )}
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

      {/* No Results Message */}
      {filteredAssignments.length === 0 && (
        <div className={styles.noResults}>
          <p>No assignments found matching the selected filters.</p>
          <button className={styles.clearFiltersBtn} onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredAssignments.length > cardsPerPage && (
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
              <div className={styles.modalHeaderActions}>
                <button className={styles.closeButton} onClick={closeSubmissionsModal}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
            
            <div className={styles.modalBody}>
              {/* Feedback Success Message */}
              {feedbackSuccess && (
                <div className={styles.successContainer}>
                  <div className={styles.successMessage}>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Feedback submitted successfully!</span>
                  </div>
                </div>
              )}

              {submissionsLoading && (
                <div className={styles.loadingContainer}>
                  <p>Loading submissions...</p>
                </div>
              )}
              
              {submissionsError && (
                <div className={styles.errorContainer}>
                  <p className={styles.errorMessage}>
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{submissionsError}</span>
                  </p>
                </div>
              )}
              
              {!submissionsLoading && !submissionsError && submissions.length === 0 && (
                <div className={styles.noSubmissions}>
                  <p>No submissions found for this assignment.</p>
                </div>
              )}

               {/* Export to Excel Button */}
                {!submissionsLoading && !submissionsError && submissions.length > 0 && (
                  <ExportToExcel
                    data={prepareExportData()}
                    headers={getExportHeaders()}
                    fileName={getExportFileName()}
                    sheetName="Submissions"
                    buttonStyle={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginRight: '10px'
                    }}
                  />
                )}
              
              {!submissionsLoading && !submissionsError && submissions.length > 0 && (
                <div className={styles.submissionsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Allotment ID</th>
                         <th>Name</th>
                        <th>Employee Type</th>
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
                          <td>{submission.traineeName}</td>
                            <td>{submission.employeeType.toUpperCase()}</td>
                          
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

                              {submission.evaluationStatus === 'pending' && submission.status === 'submitted' && (
                                <button
                                  className={styles.feedbackButton}
                                  onClick={() => handleOpenFeedback(submission)}
                                  title="Provide Feedback"
                                >
                                  <FontAwesomeIcon icon={faComment} />
                                </button>
                              )}

                               {submission.evaluationStatus === 'evaluated' && (
      <button
        className={styles.viewFeedbackButton}
        onClick={() => handleViewFeedback(submission)}
        title="View Feedback"
      >
        <FontAwesomeIcon icon={faEye} />
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

      {/* View Feedback Modal */}
{showViewFeedbackModal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>
      <div className={styles.modalHeader}>
        <h3>Feedback Details</h3>
        <button className={styles.closeButton} onClick={closeViewFeedbackModal}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className={styles.modalBody}>
        {viewingSubmission && (
          <div className={styles.feedbackDetails}>
            <div className={styles.submissionInfo}>
              <p><strong>Allotment ID:</strong> {viewingSubmission.allotmentId}</p>
              <p><strong>Trainee Name:</strong> {viewingSubmission.traineeName}</p>
              <p><strong>Assignment:</strong> {selectedAssignment?.title}</p>
              <p><strong>Submission Date:</strong> {formatDate(viewingSubmission.submissionDate)}</p>
            </div>
            
            <div className={styles.evaluationDetails}>
              <div className={styles.marksSection}>
                <h4>Marks Awarded</h4>
                <div className={styles.marksDisplay}>
                  <span className={styles.marksValue}>
                    {viewingSubmission.marks} / {viewingSubmission.totalMarks}
                  </span>
                  <span className={styles.marksPercentage}>
                    ({Math.round((viewingSubmission.marks / viewingSubmission.totalMarks) * 100)}%)
                  </span>
                </div>
              </div>
              
              <div className={styles.feedbackSection}>
                <h4>Feedback</h4>
                <div className={styles.feedbackText}>
                  {viewingSubmission.feedBack || 'No feedback provided'}
                </div>
              </div>
            </div>
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
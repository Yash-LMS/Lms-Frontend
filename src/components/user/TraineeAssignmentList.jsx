import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TraineeAssignmentList.module.css';
import AssignmentUploadPopup from './AssignmentUploadPopup';
import { VIEW_ASSIGNMENT_TRAINEE_URL,DOWNLOAD_ASSIGNMENT_INSTRUCTION_ALLOTMENTID_FILE } from '../../constants/apiConstants';
import DashboardSidebar from '../../assets/DashboardSidebar';

const TraineeAssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dashboardCounts, setDashboardCounts] = useState({
    pending: 0,
    submitted: 0,
    expired: 0,
    total: 0
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // Show 6 items per page (adjustable)

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

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

  const handleDownloadInstructionFile = async (allotmentId) => {
  try {
    const { user, token } = getUserData();

    const response = await axios.post(
      `${DOWNLOAD_ASSIGNMENT_INSTRUCTION_ALLOTMENTID_FILE}`,
      { allotmentId, user, token },
      {
        responseType: 'blob',
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
    console.error('Download error:', error); // Add console.error for debugging
    if (error.response && error.response.data) {
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

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const{user,token}=getUserData();
      const requestData = {
       user:user,
       token:token
      };

      const response = await axios.post(`${VIEW_ASSIGNMENT_TRAINEE_URL}`, requestData);
      
      if (response.data.response === 'success') {
        const assignmentData = response.data.payload;
        setAssignments(assignmentData);
        calculateDashboardCounts(assignmentData);
      } else {
        setError(response.data.message || 'Failed to fetch assignments');
      }
    } catch (err) {
      setError('Error fetching assignments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardCounts = (assignmentData) => {
    const counts = {
      pending: 0,
      submitted: 0,
      expired: 0,
      total: assignmentData.length
    };

    assignmentData.forEach(assignment => {
      if (assignment.status === 'pending') counts.pending++;
      else if (assignment.status === 'submitted') counts.submitted++;
      else if (assignment.status === 'expired') counts.expired++;
    });

    setDashboardCounts(counts);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'submitted': return styles.statusSubmitted;
      case 'expired': return styles.statusExpired;
      default: return '';
    }
  };

  const handleSubmitClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowUploadPopup(true);
  };

  const handleClosePopup = () => {
    setShowUploadPopup(false);
    setSelectedAssignment(null);
  };

  const isExpired = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    return today > end;
  };

  const canSubmit = (assignment) => {
    return assignment.status === 'pending' && !isExpired(assignment.endDate);
  };

  // Filter function
  const getFilteredAssignments = () => {
    if (activeFilter === 'all') {
      return assignments;
    }
    return assignments.filter(assignment => assignment.status === activeFilter);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Pagination logic
  const filteredAssignments = getFilteredAssignments();
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) return <div className={styles.loading}>Loading assignments...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <DashboardSidebar activeTab="assignment" />

      <div className={styles.header}>
        <h1>My Assignments</h1>

        {/* Dashboard */}
        <div className={styles.dashboard}>
          <div 
            className={`${styles.dashboardItem} ${activeFilter === 'all' ? styles.active : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            <div className={styles.dashboardCount}>{dashboardCounts.total}</div>
            <div className={styles.dashboardLabel}>Total Assignments</div>
          </div>
          <div 
            className={`${styles.dashboardItem} ${styles.pending} ${activeFilter === 'pending' ? styles.active : ''}`}
            onClick={() => handleFilterChange('pending')}
          >
            <div className={styles.dashboardCount}>{dashboardCounts.pending}</div>
            <div className={styles.dashboardLabel}>Pending</div>
          </div>
          <div 
            className={`${styles.dashboardItem} ${styles.submitted} ${activeFilter === 'submitted' ? styles.active : ''}`}
            onClick={() => handleFilterChange('submitted')}
          >
            <div className={styles.dashboardCount}>{dashboardCounts.submitted}</div>
            <div className={styles.dashboardLabel}>Submitted</div>
          </div>
          <div 
            className={`${styles.dashboardItem} ${styles.expired} ${activeFilter === 'expired' ? styles.active : ''}`}
            onClick={() => handleFilterChange('expired')}
          >
            <div className={styles.dashboardCount}>{dashboardCounts.expired}</div>
            <div className={styles.dashboardLabel}>Expired</div>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      <div className={styles.assignmentList}>
        {currentAssignments.length === 0 ? (
          <div className={styles.noAssignments}>
            {activeFilter === 'all' 
              ? 'No assignments found' 
              : `No ${activeFilter} assignments found`
            }
          </div>
        ) : (
          currentAssignments.map((assignment) => (
            <div key={assignment.allotmentId} className={styles.assignmentCard}>
              <div className={styles.assignmentHeader}>
                <h3 className={styles.assignmentTitle}>{assignment.title}</h3>
                <span className={`${styles.status} ${getStatusClass(assignment.status)}`}>
                  {assignment.status.toUpperCase()}
                </span>
              </div>
              
              <div className={styles.assignmentDetails}>
                <p className={styles.description}>{assignment.description}</p>
                
                <div className={styles.assignmentInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Allotment Date:</span>
                    <span className={styles.value}>{formatDate(assignment.allotmentDate)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>End Date:</span>
                    <span className={styles.value}>{formatDate(assignment.endDate)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Total Marks:</span>
                    <span className={styles.value}>{assignment.totalMarks}</span>
                  </div>
                </div>
                
                
        <div className={styles.assignmentActions}>
  {canSubmit(assignment) && (
    <button
      className={styles.submitButton}
      onClick={() => handleSubmitClick(assignment)}
    >
      Submit Assignment
    </button>
  )}

  {assignment.storageStatus === 'IN_FILE' && (
    <button 
      className={styles.submitButton}
      onClick={() => handleDownloadInstructionFile(assignment.allotmentId)}
    >
      Download Instruction
    </button>
  )}
</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {filteredAssignments.length > 0 && totalPages > 1 && (
        <div className={styles.paginationControls}>
          <button
            className={styles.paginationButton}
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className={styles.pageIndicator}>
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            className={styles.paginationButton}
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Popup */}
      {showUploadPopup && selectedAssignment && (
        <AssignmentUploadPopup
          allotmentId={selectedAssignment.allotmentId}
          onClose={handleClosePopup}
          onSuccess={fetchAssignments}
        />
      )}
      
    </div>
  );
};

export default TraineeAssignmentList;
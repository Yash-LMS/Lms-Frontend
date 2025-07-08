import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  findAssignments,
  approveAssignment,
  rejectAssignment,
} from "../../features/manager/managerActions";
import styles from "./TestRequests.module.css";
import SuccessModal from "../../assets/SuccessModal";
import Sidebar from "./Sidebar";

const AssignmentRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, assignments } = useSelector((state) => state.manager);
  const [assignmentRequests, setAssignmentRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState("assignmentRequests");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const assignmentStatusOptions = ["PENDING", "APPROVED", "REJECTED"];

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

  useEffect(() => {
    fetchAssignments();
  }, [dispatch, statusFilter]);

  // Update local state when Redux state changes
  useEffect(() => {
    if (assignments && Array.isArray(assignments)) {
      setAssignmentRequests(assignments);
    }
  }, [assignments]);

  const fetchAssignments = () => {
    const { user, token } = getUserData();
    if (user && token) {
      dispatch(
        findAssignments({
          user,
          token,
          status: statusFilter === "all" ? "" : statusFilter, 
        })
      );
    }
  };

  const handleApprove = (assignmentId) => {
    const { user, token } = getUserData();

    // Validate assignmentId before proceeding
    if (!assignmentId) {
      console.error("Assignment ID is null or undefined");
      return;
    }

    // Get the assignment name for the success message
    const assignment = assignmentRequests.find((a) => a.id === assignmentId);
    const assignmentName = assignment ? assignment.assignmentName : "Assignment";

    console.log("Approving assignment with ID:", assignmentId); // Debug log

    dispatch(
      approveAssignment({
        user,
        token,
        assignmentId: assignmentId, // Ensure assignmentId is properly passed
      })
    ).then((action) => {
      console.log("Approve assignment response:", action); // Debug log
      if (action.payload && action.payload.response === 'success') {
        // Show success modal
        setSuccessMessage(`${assignmentName} has been successfully approved.`);
        setShowSuccessModal(true);
        // Refresh the assignment list
        fetchAssignments();
      } else {
        // Handle error case
        console.error("Failed to approve assignment:", action.payload);
      }
    }).catch((error) => {
      console.error("Error approving assignment:", error);
    });
  };

  const handleReject = (assignmentId) => {
    const { user, token } = getUserData();

    // Validate assignmentId before proceeding
    if (!assignmentId) {
      console.error("Assignment ID is null or undefined");
      return;
    }

    // Get the assignment name for the success message
    const assignment = assignmentRequests.find((a) => a.id === assignmentId);
    const assignmentName = assignment ? assignment.assignmentName : "Assignment";

    console.log("Rejecting assignment with ID:", assignmentId); // Debug log

    dispatch(
      rejectAssignment({
        user,
        token,
        assignmentId: assignmentId,
      })
    ).then((action) => {
      console.log("Reject assignment response:", action); // Debug log
      if (action.payload && action.payload.response === 'success') {
        // Show success message for rejection
        setSuccessMessage(`${assignmentName} has been successfully rejected.`);
        setShowSuccessModal(true);
        // Refresh the assignment list
        fetchAssignments();
      } else {
        // Handle error case
        console.error("Failed to reject assignment:", action.payload);
      }
    }).catch((error) => {
      console.error("Error rejecting assignment:", error);
    });
  };

  // Filter assignments based on search term and status
  const getFilteredAssignments = () => {
    if (!assignmentRequests) return [];

    return assignmentRequests.filter((assignment) => {
      // Search filter
      const matchesSearch =
        assignment.assignmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.instructorName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || 
        assignment.approvalStatus?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  };

  const handlePreviewClick = (assignmentId) => {
    navigate(`/assignment/view/${assignmentId}`);
  };

  // Get filtered assignments
  const filteredAssignments = getFilteredAssignments();

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  return (
    <div className={styles.testRequestsWrapper}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} />

      {/* Main Content */}
      <div className={styles.testRequestsContent}>
        <header className={styles.pageHeader}>
          <h1>Assignment Requests</h1>
          <div className={styles.filters}>
            <input
              type="search"
              placeholder="Search by assignment name or instructor..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {assignmentStatusOptions.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.testTable}>
              <thead>
                <tr>
                  <th>Assignment Name</th>
                  <th>Instructor</th>
                  <th>Request Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.title}</td>
                      <td>{assignment.instructorName}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[assignment.approvalStatus]
                          }`}
                        >
                          {assignment.approvalStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {assignment.approvalStatus === "pending" && (
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.approveButton}
                              onClick={() => handleApprove(assignment.assignmentId || assignment.id)}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.rejectButton}
                              onClick={() => handleReject(assignment.assignmentId || assignment.id)}
                            >
                              Reject
                            </button>
                            {/* <button
                              className={styles.btnPreview}
                              onClick={() => handlePreviewClick(assignment.id)}
                            >
                              Preview
                            </button> */}
                          </div>
                        )}
                        {assignment.approvalStatus !== "pending" && (
                          <span className={styles.completedText}>
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={styles.noData}>
                      No assignment requests found for the selected status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success Modal for approvals and rejections */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => {
            setShowSuccessModal(false);
            // Optionally refresh the list when modal is closed
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
};

export default AssignmentRequests;
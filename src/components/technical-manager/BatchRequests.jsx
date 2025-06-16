import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  findBatches,
  approveBatch,
  rejectBatch,
} from "../../features/manager/managerActions";
import styles from "./TestRequests.module.css";
import SuccessModal from "../../assets/SuccessModal";
import Sidebar from "./Sidebar";

const BatchRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, batches } = useSelector((state) => state.manager);
  const [batchRequests, setBatchRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState("batchRequests");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const batchStatusOptions = ["PENDING", "APPROVED", "REJECTED"];

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
    fetchBatches();
  }, [dispatch, statusFilter]);

  // Update local state when Redux state changes
  useEffect(() => {
    if (batches && Array.isArray(batches)) {
      setBatchRequests(batches);
    }
  }, [batches]);

  const fetchBatches = () => {
    const { user, token } = getUserData();
    if (user && token) {
      dispatch(
        findBatches({
          user,
          token,
          batchStatus: statusFilter === "all" ? "" : statusFilter, 
        })
      );
    }
  };

  const handleApprove = (batchId) => {
    const { user, token } = getUserData();

    // Validate batchId before proceeding
    if (!batchId) {
      console.error("Batch ID is null or undefined");
      return;
    }

    // Get the batch name for the success message
    const batch = batchRequests.find((b) => b.id === batchId);
    const batchName = batch ? batch.batchName : "Batch";

    console.log("Approving batch with ID:", batchId); // Debug log

    dispatch(
      approveBatch({
        user,
        token,
        batchId: batchId, // Ensure batchId is properly passed
      })
    ).then((action) => {
      console.log("Approve batch response:", action); // Debug log
      if (action.payload && action.payload.response === 'success') {
        // Show success modal
        setSuccessMessage(`${batchName} has been successfully approved.`);
        setShowSuccessModal(true);
        // Refresh the batch list
        fetchBatches();
      } else {
        // Handle error case
        console.error("Failed to approve batch:", action.payload);
      }
    }).catch((error) => {
      console.error("Error approving batch:", error);
    });
  };

  const handleReject = (batchId) => {
    const { user, token } = getUserData();

    // Validate batchId before proceeding
    if (!batchId) {
      console.error("Batch ID is null or undefined");
      return;
    }

    // Get the batch name for the success message
    const batch = batchRequests.find((b) => b.id === batchId);
    const batchName = batch ? batch.batchName : "Batch";

    console.log("Rejecting batch with ID:", batchId); // Debug log

    dispatch(
      rejectBatch({
        user,
        token,
        batchId: batchId,
      })
    ).then((action) => {
      console.log("Reject batch response:", action); // Debug log
      if (action.payload && action.payload.response === 'success') {
        // Show success message for rejection
        setSuccessMessage(`${batchName} has been successfully rejected.`);
        setShowSuccessModal(true);
        // Refresh the batch list
        fetchBatches();
      } else {
        // Handle error case
        console.error("Failed to reject batch:", action.payload);
      }
    }).catch((error) => {
      console.error("Error rejecting batch:", error);
    });
  };

  // Filter batches based on search term and status
  const getFilteredBatches = () => {
    if (!batchRequests) return [];

    return batchRequests.filter((batch) => {
      // Search filter
      const matchesSearch =
        batch.batchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.instructorName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || 
        batch.batchStatus?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  };

  const handlePreviewClick = (batchId) => {
    navigate(`/batch/view/${batchId}`);
  };

  // Get filtered batches
  const filteredBatches = getFilteredBatches();

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
          <h1>Batch Requests</h1>
          <div className={styles.filters}>
            <input
              type="search"
              placeholder="Search by batch name or instructor..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {batchStatusOptions.map((status) => (
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
                  <th>Batch Name</th>
                  {/* <th>Instructor</th> */}
                  <th>Created At</th>
                  <th>Request Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => (
                    <tr key={batch.id}>
                      <td>{batch.batchName}</td>
                      {/* <td>{batch.createdBy}</td> */}
                      <td>{batch.createDate}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[batch.batchStatus]
                          }`}
                        >
                          {batch.batchStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {batch.batchStatus === "pending" && (
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.approveButton}
                              onClick={() => handleApprove(batch.batchId || batch.id)}
                            >
                              Approve
                            </button>
                            <button
                              className={styles.rejectButton}
                              onClick={() => handleReject(batch.batchId || batch.id)}
                            >
                              Reject
                            </button>
                            {/* <button
                              className={styles.btnPreview}
                              onClick={() => handlePreviewClick(batch.id)}
                            >
                              Preview
                            </button> */}
                          </div>
                        )}
                        {batch.batchStatus !== "pending" && (
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
                      No batch requests found for the selected status.
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
            fetchBatches();
          }}
        />
      )}
    </div>
  );
};

export default BatchRequests;
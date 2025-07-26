import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  findTestByStatus,
  approveTest,
  rejectTest,
} from "../../features/manager/managerActions";
import styles from "./TestRequests.module.css";
import SuccessModal from "../../assets/SuccessModal";
import Sidebar from "./Sidebar";
import { DELETE_TEST_URL } from "../../constants/apiConstants";
import axios from "axios";

const TestRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.manager);
  const [testRequests, setTestRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState("testRequests");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [currentTestId, setCurrentTestId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  const testStatusOptions = ["PENDING", "APPROVED", "REJECTED"];

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
    fetchTests();
  }, [dispatch, statusFilter]);

  const fetchTests = () => {
    const { user, token } = getUserData();
    if (user && token) {
      dispatch(
        findTestByStatus({
          user,
          token,
          testStatus: statusFilter === "all" ? "" : statusFilter,
        })
      ).then((action) => {
        if (action.payload && Array.isArray(action.payload)) {
          setTestRequests(action.payload);
        } else if (action.payload && Array.isArray(action.payload.payload)) {
          setTestRequests(action.payload.payload);
        } else {
          console.error("Unexpected response format:", action.payload);
        }
      });
    }
  };

  const openFeedbackModal = (testId) => {
    setCurrentTestId(testId);
    setActionType("reject");
    setFeedbackText("");
    setShowFeedbackModal(true);
  };

  const handleApprove = (testId) => {
    const { user, token } = getUserData();

    // Get the test name for the success message
    const test = testRequests.find((t) => (t.testId || t.id) === testId);
    const testName = test ? test.testName : "Test";

    dispatch(
      approveTest({
        user,
        token,
        testId,
        feedBack: "", // Empty feedback for approval
      })
    ).then((action) => {
      if (action.payload) {
        // Show success modal
        setSuccessMessage(`${testName} has been successfully approved.`);
        setShowSuccessModal(true);
        fetchTests(); // Refresh the test list
      }
    });
  };

  const handleDeleteTest = async (testId) => {
  const { user, token } = getUserData();
  try {
    const response = await axios.post(
      DELETE_TEST_URL,
      { testId, user, token },
      { headers: { "Content-Type": "application/json" } }
    );
    if (response.data && response.data.response === "success") {
      setDeleteMessage("Test deleted successfully.");
      setShowDeleteModal(true);
      fetchTests();
    } else {
      setDeleteMessage(response.data?.message || "Failed to delete test.");
      setShowDeleteModal(true);
    }
  } catch (error) {
    setDeleteMessage("Error deleting test. Please try again.");
    setShowDeleteModal(true);
  }
};

  const handleFeedbackSubmit = () => {
    const { user, token } = getUserData();

    dispatch(
      rejectTest({
        user,
        token,
        testId: currentTestId,
        feedBack: feedbackText,
      })
    ).then((action) => {
      if (action.payload) {
        fetchTests(); // Refresh the test list
      }
    });

    // Close the modal
    setShowFeedbackModal(false);

    // Reset form values
    setCurrentTestId(null);
    setActionType(null);
    setFeedbackText("");
  };

  // Filter tests based on search term
  const getFilteredTests = () => {
    if (!testRequests) return [];

    return testRequests.filter((test) => {
      const matchesSearch =
        test.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.creatorName?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  };

  const handlePreviewClick = (testId) => {
    navigate(`/test/view/${testId}`);
  };

  // Get filtered tests
  const filteredTests = getFilteredTests();

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
          <h1>Test Requests</h1>
          <div className={styles.filters}>
            <input
              type="search"
              placeholder="Search by test name or creator..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {testStatusOptions.map((status) => (
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
                  <th>Test Name</th>
                  <th>Instructor</th>
                  <th>Duration (min)</th>
                  <th>System Remark</th>
                  <th>Request Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => (
                    <tr key={test.testId || test.id}>
                      <td>{test.testName}</td>
                      <td>{test.instructorName}</td>
                      <td>{test.duration}</td>
                      <td>{test.systemRemark || "New"}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[test.testStatus]
                          }`}
                        >
                          {test.testStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {test.testStatus === "pending" && (
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.approveButton}
                              onClick={() =>
                                handleApprove(test.testId || test.id)
                              }
                            >
                              Approve
                            </button>
                            <button
                              className={styles.rejectButton}
                              onClick={() =>
                                openFeedbackModal(test.testId || test.id)
                              }
                            >
                              Reject
                            </button>
                            <button
                              className={styles.deleteButton}
                               onClick={() =>
                                handleDeleteTest(test.testId || test.id)
                              }
                            >
                              Delete
                            </button>
                            <button
                              className={styles.btnPreview}
                              onClick={() =>
                                handlePreviewClick(test.testId || test.id)
                              }
                            >
                              Preview
                            </button>
                          </div>
                        )}
                        {test.testStatus !== "pending" && (
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
                      No test requests found for the selected status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Modal (only for rejections) */}
      {showFeedbackModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.feedbackModal}>
            <h2 className={styles.modalTitle}>Reject Test</h2>
            <p className={styles.modalInstructions}>
              Please provide your reason for rejection:
            </p>
            <textarea
              className={styles.feedbackTextarea}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter your feedback here..."
              rows={5}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowFeedbackModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.rejectButton}
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for approvals */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {showDeleteModal && (
       <SuccessModal
    message={deleteMessage}
    onClose={() => setShowDeleteModal(false)}
  />
)}
    </div>
  );
};

export default TestRequests;

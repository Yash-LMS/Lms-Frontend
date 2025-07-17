import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./FeedbackManagement.module.css";
import FeedbackList from "./FeedbackList";
import AddFeedbackModal from "./AddFeedbackModal";
import SuccessModal from "../../assets/SuccessModal";
import { useNavigate } from "react-router-dom";
import InstructorSidebar from "../instructor/InstructorSidebar";
import Sidebar from "./Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { VIEW_FEEDBACK_URL } from "../../constants/apiConstants";

const FeedbackManagement = () => {
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState("feedback");
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const feedbackStatusOptions = ["ALL", "APPROVED", "PENDING", "REJECTED"];
  const [role, setRole] = useState();

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

  // Fetch feedbacks using axios
  const fetchFeedbacks = async () => {
    const { user, token } = getUserData();

    if (!user || !token) {
      setError("User session data is missing. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        user: user,
        token: token,
      };

      console.log("Fetching feedbacks from:", VIEW_FEEDBACK_URL);
      console.log("Request data:", requestData);

      const response = await axios.post(VIEW_FEEDBACK_URL, requestData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("View feedback response:", response.data);

      // Check for successful response based on the API structure
      if (response.data && (response.data.response === "success" || response.data.response === "Success")) {
        const feedbackData = response.data.payload || [];
        setFeedbacks(feedbackData);
        console.log("Feedbacks fetched successfully:", feedbackData);
      } else {
        const errorMessage = response.data?.message || response.data?.payload || "Failed to fetch feedbacks";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      
      let errorMessage = "An error occurred while fetching feedbacks";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.payload) {
        errorMessage = err.response.data.payload;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);

      // Handle specific error cases
      if (err.response?.status === 401) {
        alert("Unauthorized access. Please log in again.");
        // Optionally redirect to login
        // navigate('/login');
      } else if (err.response?.status === 403) {
        alert("You don't have permission to view feedbacks.");
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { user, token, role } = getUserData();
    
    if (user && role) {
      setRole(role);
      fetchFeedbacks();
    } else {
      setError("Please log in to access this page.");
      // Optionally redirect to login
      // navigate('/login');
    }
  }, []);

  const getFilteredFeedbacks = () => {
    if (!feedbacks || !Array.isArray(feedbacks)) return [];

    return feedbacks.filter((feedback) => {
      if (!feedback) return false;

      const feedbackName = feedback.feedbackName || '';
      
      const matchesSearch = feedbackName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (feedback.status &&
          feedback.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  };

  const filteredFeedbacks = getFilteredFeedbacks();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleRetry = () => {
    fetchFeedbacks();
  };

  const handleShowSuccessModal = (message) => {
    setShowAddFeedback(false);
    setSuccessMessage(message);
    setShowSuccessModal(true);
    // Refresh the feedback list after successful creation
    fetchFeedbacks();
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  const handleCloseAddFeedback = () => {
    setShowAddFeedback(false);
  };

  return (
    <div className={styles.adminDashboard}>
      {role === "technical_manager" ? (
        <Sidebar activeTab={activeTab} />
      ) : role === "instructor" ? (
        <InstructorSidebar activeTab={activeTab} />
      ) : null}

      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h1>Feedback Management</h1>
            <button
              className={styles.addBatchBtn}
              onClick={() => setShowAddFeedback(true)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span style={{ marginLeft: "5px" }}>Create New Feedback</span>
            </button>
          </div>
          <div className={styles.headerRight}>
            <input
              type="search"
              placeholder="Search feedbacks..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {feedbackStatusOptions.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </header>

        {(searchTerm || statusFilter !== "all") && (
          <div className={styles.searchResultsInfo}>
            <p>
              {filteredFeedbacks.length === 0
                ? "No feedbacks match your search criteria"
                : `Found ${filteredFeedbacks.length} feedback${
                    filteredFeedbacks.length !== 1 ? "s" : ""
                  }`}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                className={styles.clearFiltersBtn}
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Add Feedback Modal Component */}
        <AddFeedbackModal
          isOpen={showAddFeedback}
          onClose={handleCloseAddFeedback}
          onSuccess={handleShowSuccessModal}
        />

        <FeedbackList
          feedbacks={filteredFeedbacks}
          loading={loading}
          error={error}
          onRetry={handleRetry}
        />

        {showSuccessModal && (
          <SuccessModal
            message={successMessage}
            onClose={handleCloseSuccessModal}
          />
        )}
      </main>
    </div>
  );
};

export default FeedbackManagement;
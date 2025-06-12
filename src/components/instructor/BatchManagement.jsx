import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./BatchManagement.module.css";
import AddBatchModal from "./AddBatchModal";
import BatchList from "./BatchList";
import SuccessModal from "../../assets/SuccessModal";
import { useNavigate } from "react-router-dom";
import InstructorSidebar from "../instructor/InstructorSidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { CREATE_BATCH_URL, VIEW_BATCH_URL } from "../../constants/apiConstants";

const BatchManagement = () => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState("batches");
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const batchStatusOptions = ["ALL", "APPROVED", "PENDING", "REJECTED"];

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

  // Fetch batches using axios
  const fetchBatches = async () => {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      setError("User session data is missing. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the request payload matching the backend ApiResponseModelBatch structure
      const requestData = {
        user: user, // Send user object as is
        token: token, // Send token as string
        batch: null // Not needed for view operation
      };

      console.log("Fetching batches with data:", JSON.stringify(requestData, null, 2));

      const response = await axios.post(VIEW_BATCH_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log("View batch response:", response.data);

      if (response.data && response.data.response === "success") {
        setBatches(response.data.payload || []);
        console.log("Batches fetched successfully:", response.data.payload);
      } else {
        setError(response.data?.message || "Failed to fetch batches");
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
      console.error("Error response:", err.response?.data);
      
      setError(err.response?.data?.message || "An error occurred while fetching batches");
      
      // Handle unauthorized access
      if (err.response?.status === 401) {
        alert("Unauthorized access. Please log in again.");
        // Optionally redirect to login
        // navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleAddQuestions = (batch) => {
    setSelectedBatch(batch);
    setShowQuestionModal(true);
    console.log("Adding questions to batch:", batch);
  };

  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    console.log("Editing batch:", batch);
  };

  // Create batch using axios
  const handleSubmitNewBatch = async (batchNameData) => {
    const { user, token, role } = getUserData();
    console.log("User data:", user);
    console.log("Token:", token);
    console.log("Role:", role);
    console.log("Received batchNameData:", batchNameData);

    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    // Extract the actual batch name from the data
    let actualBatchName;
    if (typeof batchNameData === 'string') {
      actualBatchName = batchNameData;
    } else if (batchNameData && batchNameData.batch && batchNameData.batch.batchName) {
      actualBatchName = batchNameData.batch.batchName;
    } else if (batchNameData && batchNameData.batchName) {
      actualBatchName = batchNameData.batchName;
    } else {
      actualBatchName = batchNameData;
    }

    console.log("Extracted batch name:", actualBatchName);

    setLoading(true);
    setError(null);

    // Create the request payload matching the backend ApiResponseModelBatch structure
    const batchData = {
      user: user, // Send user object as is
      token: token, // Send token as string
      batch: {
        batchName: actualBatchName // Ensure only the string value is sent
      }
    };

    console.log("Sending batch data:", JSON.stringify(batchData, null, 2));

    try {
      const response = await axios.post(CREATE_BATCH_URL, batchData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log("Create batch response:", response.data);

      if (response.data && response.data.status === "SUCCESS") {
        setShowAddBatch(false);
        setSuccessMessage("Batch added successfully!");
        setShowSuccessModal(true);
        
        // Refresh the batch list
        await fetchBatches();
        console.log("Batch created successfully:", response.data);
      } else {
        alert(response.data?.message || "Failed to create batch");
      }
    } catch (err) {
      console.error("Failed to add batch:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || "An error occurred while creating the batch";
      alert(errorMessage);
      
      // Handle unauthorized access
      if (err.response?.status === 401) {
        alert("Unauthorized access. Please log in again.");
        // Optionally redirect to login
        // navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Improved filter function to match batchStatus from BatchList
  const getFilteredBatches = () => {
    if (!batches || !Array.isArray(batches)) return [];

    return batches.filter((batch) => {
      // Robust null and undefined checks
      if (!batch || !batch.batchName) return false;

      // Case-insensitive search term matching
      const matchesSearch = batch.batchName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Improved status filtering with ALL option and case-insensitive comparison
      const matchesStatus =
        statusFilter === "all" ||
        (batch.batchStatus &&
          batch.batchStatus.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
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

  // Retry function for error handling
  const handleRetry = () => {
    fetchBatches();
  };

  return (
    <div className={styles.adminDashboard}>
      <InstructorSidebar activeTab={activeTab} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h1>Batch Management</h1>
            <button
              className={styles.addBatchBtn}
              onClick={() => setShowAddBatch(true)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span style={{ marginLeft: '5px' }}>Create New Batch</span>
            </button>
          </div>
          <div className={styles.headerRight}>
            <input
              type="search"
              placeholder="Search batches..."
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

        {/* Error Display */}
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryBtn} onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        {/* Display search results info when filtering */}
        {(searchTerm || statusFilter !== "all") && (
          <div className={styles.searchResultsInfo}>
            <p>
              {filteredBatches.length === 0
                ? "No batches match your search criteria"
                : `Found ${filteredBatches.length} batch${
                    filteredBatches.length !== 1 ? "es" : ""
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

        {/* Batch List Component */}
        <BatchList
          tests={filteredBatches}
          loading={loading}
          error={error}
          onAddQuestions={handleAddQuestions}
          onEditTest={handleEditBatch}
        />

        {/* Add Batch Modal Component */}
        <AddBatchModal
          isOpen={showAddBatch}
          onClose={() => setShowAddBatch(false)}
          onSubmit={handleSubmitNewBatch}
        />

        {/* Success Modal */}
        {showSuccessModal && (
          <SuccessModal
            message={successMessage}
            onClose={() => setShowSuccessModal(false)}
          />
        )}
      </main>
    </div>
  );
};

export default BatchManagement;
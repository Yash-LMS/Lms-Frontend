import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./BatchManagement.module.css";
import BatchList from "./BatchList";
import AddBatchModal from "./AddBatchModal";
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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
      const requestData = {
        user: user,
        token: token,
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
        setError("Failed to fetch batches");
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("An error occurred while fetching batches");
      
      if (err.response?.status === 401) {
        alert("Unauthorized access. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Handlers for batch actions
  const handleAddTest = (batch) => {
    console.log("Adding test to batch:", batch);
    // Navigate to add test page or open modal
    // navigate(`/add-test/${batch.batchId}`);
  };

  const handleAddCourse = (batch) => {
    console.log("Adding course to batch:", batch);
    // Navigate to add course page or open modal
    // navigate(`/add-course/${batch.batchId}`);
  };

  const handleAddCandidate = (batch) => {
    console.log("Adding candidate to batch:", batch);
    // Navigate to add candidate page or open modal
    // navigate(`/add-candidate/${batch.batchId}`);
  };

  // Create batch using axios
  const handleSubmitNewBatch = async (batchNameData) => {
    const { user, token } = getUserData();

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

    const batchData = {
      user: user,
      token: token,
      batch: {
        batchName: actualBatchName
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
      const errorMessage = err.response?.data?.message || err.message || "An error occurred while creating the batch";
      alert(errorMessage);
      
      if (err.response?.status === 401) {
        alert("Unauthorized access. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter function
  const getFilteredBatches = () => {
    if (!batches || !Array.isArray(batches)) return [];

    return batches.filter((batch) => {
      if (!batch || !batch.batchName) return false;

      const matchesSearch = batch.batchName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (batch.batchStatus &&
          batch.batchStatus.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  };

  const filteredBatches = getFilteredBatches();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleRetry = () => {
    fetchBatches();
  };

  return (
    <div className={styles.adminDashboard}>
      <InstructorSidebar activeTab={activeTab} />

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

         {/* Add Batch Modal Component */}
         <AddBatchModal
          isOpen={showAddBatch}
          onClose={() => setShowAddBatch(false)}
          onSubmit={handleSubmitNewBatch}
        />

        <BatchList
          batches={filteredBatches}
          loading={loading}
          error={error}
          onAddTest={handleAddTest}
          onAddCourse={handleAddCourse}
          onAddCandidate={handleAddCandidate}
        />

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
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./AssignmentManagement.module.css";
import AssignmentList from "./AssignmentList";
import AddAssignmentModal from "./AddAssignmentModal";
import SuccessModal from "../../assets/SuccessModal";
import { useNavigate } from "react-router-dom";
import InstructorSidebar from "../instructor/InstructorSidebar";
import Sidebar from "../technical-manager/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { CREATE_ASSIGNMENT_URL, VIEW_ASSIGNMENT_URL } from "../../constants/apiConstants";

const AssignmentManagement = () => {
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState("assignments");
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const assignmentStatusOptions = ["ALL", "APPROVED", "PENDING", "REJECTED"];
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

  // Fetch assignments using axios
  const fetchAssignments = async () => {
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

      const response = await axios.post(VIEW_ASSIGNMENT_URL, requestData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("View assignment response:", response.data);

      if (response.data && (response.data.response === "success")) {
        setAssignments(response.data.payload || []);
        console.log("Assignments fetched successfully:", response.data.payload);
      } else {
        const errorMessage = response.data?.message || response.data?.payload || "Failed to fetch assignments";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.payload ||
        err.message ||
        "An error occurred while fetching assignments";
      setError(errorMessage);

      if (err.response?.status === 401) {
        alert("Unauthorized access. Please log in again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { user, token, role } = getUserData();
    
    if (user && role) {
      setRole(role);
      fetchAssignments();
    }
  }, []);


  // Filter function
  const getFilteredAssignments = () => {
    if (!assignments || !Array.isArray(assignments)) return [];

    return assignments.filter((assignment) => {
      if (!assignment) return false;

      // Handle both title and assignmentName for flexibility
      const assignmentName = assignment.title || assignment.assignmentName || assignment.name || '';
      
      const matchesSearch = assignmentName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (assignment.status &&
          assignment.status.toLowerCase() === statusFilter.toLowerCase()) ||
        (assignment.assignmentStatus &&
          assignment.assignmentStatus.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  };

  const filteredAssignments = getFilteredAssignments();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleRetry = () => {
    fetchAssignments();
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
            <h1>Assignment Management</h1>
            <button
              className={styles.addBatchBtn}
              onClick={() => setShowAddAssignment(true)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span style={{ marginLeft: "5px" }}>Create New Assignment</span>
            </button>
          </div>
          <div className={styles.headerRight}>
            <input
              type="search"
              placeholder="Search assignments..."
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

        {(searchTerm || statusFilter !== "all") && (
          <div className={styles.searchResultsInfo}>
            <p>
              {filteredAssignments.length === 0
                ? "No assignments match your search criteria"
                : `Found ${filteredAssignments.length} assignment${
                    filteredAssignments.length !== 1 ? "s" : ""
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

        {/* Add Assignment Modal Component */}
        <AddAssignmentModal
          isOpen={showAddAssignment}
          onClose={() => setShowAddAssignment(false)}
          onSuccess={fetchAssignments}
        />

        <AssignmentList
          assignments={filteredAssignments}
          loading={loading}
          error={error}
          onRetry={handleRetry}
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

export default AssignmentManagement;
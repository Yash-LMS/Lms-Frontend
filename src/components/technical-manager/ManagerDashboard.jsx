import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { findDashboardInformation } from "../../features/manager/managerActions";
import styles from "./ManagerDashboard.module.css";
import Sidebar from "./Sidebar";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [dashboardItems, setDashboardItems] = useState([]);
  const { loading, error, dashboardInfo } = useSelector((state) => state.manager);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("course");

  // Status and type filter options
  const statusOptions = ["all", "approved", "pending", "rejected"];
  const typeOptions = ["course", "test"];

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
    fetchDashboardInformation();
  }, [dispatch]);

  const fetchDashboardInformation = () => {
    const { user, token } = getUserData();
    if (user && token) {
      dispatch(
        findDashboardInformation({ 
          user, 
          token, 
          filter: typeFilter, 
          status: statusFilter 
        })
      ).then((action) => {
        if (action.payload && Array.isArray(action.payload.payload)) {
          setDashboardItems(action.payload.payload);
        } else {
          console.error("Unexpected response format:", action.payload);
        }
      });
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchDashboardInformation();
  }, [typeFilter, statusFilter]);

  const getStatusClass = (item) => {
    const status = item.courseStatus || item.testStatus;
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return styles.statusApproved;
      case "PENDING":
        return styles.statusPending;
      case "REJECTED":
        return styles.statusRejected;
      default:
        return "";
    }
  };

  // Filter items based on search term and filters
  const getFilteredItems = () => {
    if (!dashboardItems) return [];

    return dashboardItems.filter((item) => {
      const name = item.courseName || item.testName;
      const instructorName = item.instructor || item.instructorName;
      const matchesSearch = 
        (name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (instructorName?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus =
        statusFilter === "all" ||
        (item.courseStatus || item.testStatus)?.toLowerCase() === statusFilter;
      
      const matchesType = 
        (typeFilter === "course" ? item.courseName : item.testName);

      return matchesSearch && matchesStatus && matchesType;
    });
  };

  // Get filtered items
  const filteredItems = getFilteredItems();

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle type filter change
  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
  };

  return (
    <div className={styles.adminDashboard}>
      <Sidebar activeTab={activeTab} />

      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h1>Dashboard Management</h1>
            <div className={styles.typeFilter}>
              {typeOptions.map((type) => (
                <label key={type} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="typeFilter"
                    value={type}
                    checked={typeFilter === type}
                    onChange={handleTypeFilterChange}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.filterContainer}>
              <input
                type="search"
                placeholder="Search items..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {loading && <p>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.courseRequests}>
          {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.courseId || item.testId}
                className={styles.courseCard}
              >
                {/* Course Item */}
                {item.courseName && (
                  <>
                    <div className={styles.courseHeader}>
                      <h2 className={styles.courseName}>{item.courseName}</h2>
                      <span
                        className={`${styles.courseStatus} ${getStatusClass(item)}`}
                      >
                        {item.courseStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.courseDetails}>
                      <p>
                        <strong>Instructor:</strong> {item.instructor}
                      </p>
                      <p>
                        <strong>Total Hours:</strong> {item.totalHours}
                      </p>
                      <p>
                        <strong>Course Status:</strong>{" "}
                        {item.courseStatus.toUpperCase()}
                      </p>
                    </div>
                  </>
                )}

                {/* Test Item */}
                {item.testName && (
                  <>
                    <div className={styles.courseHeader}>
                      <h2 className={styles.courseName}>{item.testName}</h2>
                      <span
                        className={`${styles.courseStatus} ${getStatusClass(item)}`}
                      >
                        {item.testStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.courseDetails}>
                      <p>
                        <strong>Instructor:</strong> {item.instructorName}
                      </p>
                      <p>
                        <strong>Duration:</strong> {item.duration}
                      </p>
                      <p>
                        <strong>Test Status:</strong>{" "}
                        {item.testStatus?.toUpperCase()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className={styles.noCourses}>No items found</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
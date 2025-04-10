import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { findDashboardInformation } from "../../features/manager/managerActions";
import styles from "./ManagerDashboard.module.css";
import Sidebar from "./Sidebar";
import CategoryPopup from "./CategoryPopup";
import OfficePopup from "./OfficePopup";
import AddOffice from "./AddOffice";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [dashboardItems, setDashboardItems] = useState([]);
  const { loading, error, dashboardInfo } = useSelector(
    (state) => state.manager
  );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("course");
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'table'
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);
  const [isOfficePopupOpen, setIsOfficePopupOpen] = useState(false);

  // Status and type filter options
  const statusOptions = ["all", "approved", "pending", "rejected"];
  const typeOptions = ["course", "test"];
  const viewOptions = ["card", "table"];

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
          status: statusFilter,
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
        name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructorName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (item.courseStatus || item.testStatus)?.toLowerCase() === statusFilter;

      const matchesType =
        typeFilter === "course" ? item.courseName : item.testName;

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

  // Handle view mode change
  const handleViewModeChange = (e) => {
    setViewMode(e.target.value);
  };

  const handleCoursePreviewClick = (courseId) => {
    navigate(`/course/view/${courseId}`);
  };

  const handleTestPreviewClick = (testId) => {
    navigate(`/test/view/${testId}`);
  };

  // Popup handlers
  const openCategoryPopup = () => setIsCategoryPopupOpen(true);
  const closeCategoryPopup = () => setIsCategoryPopupOpen(false);
  const openOfficePopup = () => setIsOfficePopupOpen(true);
  const closeOfficePopup = () => setIsOfficePopupOpen(false);

  // Render card view content
  const renderCardView = () => {
    return (
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
                      className={`${styles.courseStatus} ${getStatusClass(
                        item
                      )}`}
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

                    {item.lastModifiedDate && item.lastModifiedTime && (
                      <p>
                        <strong>Last Modified:</strong>{" "}
                        {`${item.lastModifiedDate}, ${item.lastModifiedTime}`}
                      </p>
                    )}
                    {item.modifiedValue && (
                      <p>
                        <strong>Modified Value:</strong> {item.modifiedValue}
                      </p>
                    )}

                    <button
                      className={`${styles.btn} ${styles.btnPreview}`}
                      onClick={() =>
                        handleCoursePreviewClick(item.courseId || item.id)
                      }
                    >
                      Preview
                    </button>
                  </div>
                </>
              )}

              {/* Test Item */}
              {item.testName && (
                <>
                  <div className={styles.courseHeader}>
                    <h2 className={styles.courseName}>{item.testName}</h2>
                    <span
                      className={`${styles.courseStatus} ${getStatusClass(
                        item
                      )}`}
                    >
                      {item.testStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.courseDetails}>
                    <p>
                      <strong>Instructor:</strong> {item.instructorName}
                    </p>
                    <p>
                      <strong>Duration (in min):</strong> {item.duration}
                    </p>
                    <p>
                      <strong>Test Status:</strong>{" "}
                      {item.testStatus?.toUpperCase()}
                    </p>

                    <button
                      className={styles.btnPreview}
                      onClick={() => handleTestPreviewClick(item.testId)}
                    >
                      Preview
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className={styles.noCourses}>No items found</p>
        )}
      </div>
    );
  };

  // Render table view content
  const renderTableView = () => {
    return (
      <div className={styles.tableContainer}>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>{typeFilter === "course" ? "Course Name" : "Test Name"}</th>
              <th>Instructor</th>
              <th>{typeFilter === "course" ? "Total Hours" : "Duration (min)"}</th>
              <th>Status</th>
              {typeFilter === "course" && <th>Last Modified</th>}
              {typeFilter === "course" && <th>Modified Value</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.courseId || item.testId}>
                  <td>{item.courseName || item.testName}</td>
                  <td>{item.instructor || item.instructorName}</td>
                  <td>{item.totalHours || item.duration}</td>
                  <td>
                    <span
                      className={`${styles.tableStatus} ${getStatusClass(item)}`}
                    >
                      {(item.courseStatus || item.testStatus)?.toUpperCase()}
                    </span>
                  </td>
                  {typeFilter === "course" && (
                    <td>
                      {item.lastModifiedDate && item.lastModifiedTime
                        ? `${item.lastModifiedDate}, ${item.lastModifiedTime}`
                        : "-"}
                    </td>
                  )}
                  {typeFilter === "course" && (
                    <td>{item.modifiedValue || "-"}</td>
                  )}
                  <td>
                    <button
                      className={`${styles.btn} ${styles.btnPreview}`}
                      onClick={() =>
                        item.courseName
                          ? handleCoursePreviewClick(item.courseId)
                          : handleTestPreviewClick(item.testId)
                      }
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={typeFilter === "course" ? 7 : 5} className={styles.noItems}>
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.adminDashboard}>
      <Sidebar activeTab={activeTab} />

      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h1>Manager Dashboard</h1>

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
            <AddOffice />
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

        <div className={styles.controlsContainer}>
          <div className={styles.viewToggle}>
            <div className={styles.viewToggleLabel}>View Mode:</div>
            <div className={styles.viewModeOptions}>
              {viewOptions.map((option) => (
                <label key={option} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="viewMode"
                    value={option}
                    checked={viewMode === option}
                    onChange={handleViewModeChange}
                    className={styles.radioFilter}
                  />
                  <span className={styles.radioText}>
                    {option.charAt(0).toUpperCase() + option.slice(1)} View
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.actionButton} 
              onClick={openCategoryPopup}
            >
              Add Questions Category
            </button>
            <button 
              className={styles.actionButton}
              onClick={openOfficePopup}
            >
              Add Office
            </button>
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {viewMode === "card" ? renderCardView() : renderTableView()}
      </main>

      {/* Popup Components */}
      <CategoryPopup isOpen={isCategoryPopupOpen} onClose={closeCategoryPopup} />
      <OfficePopup isOpen={isOfficePopupOpen} onClose={closeOfficePopup} />
    </div>
  );
};

export default ManagerDashboard;
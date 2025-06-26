import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  findDashboardInformation,
  findCoursesCount,
  findTestsCount,
  findEmployeesCount,
  findInternsCount,
} from "../../features/manager/managerActions";
import styles from "./ManagerDashboard.module.css";
import Sidebar from "./Sidebar";
import AddOffice from "./AddOffice";
import CategoryCreator from "./CategoryCreator";
import axios from "axios";
import { FETCH_CATEGORIES_URL, UPDATE_CATEGORY_URL } from "../../constants/apiConstants";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [dashboardItems, setDashboardItems] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const {
    loading,
    error,
    dashboardInfo,
    courseCount,
    testCount,
    employeeCount,
    internCount,
  } = useSelector((state) => state.manager);

  const controlsSectionRef = React.useRef(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("course");
  const [viewMode, setViewMode] = useState("card"); // 'card' or 'table'
  
  // Category update modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [categoryToUpdate, setCategoryToUpdate] = useState(null);
  const [updatedCategory, setUpdatedCategory] = useState("");
  const [updatedSubCategory, setUpdatedSubCategory] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;

  // Status and type filter options
  const statusOptions = ["all", "approved", "pending", "rejected"];
  const typeOptions = ["course", "test", "categories"];
  const viewOptions = ["card", "table"];

  // Function to format hours (e.g., 3.2 -> "3 hours 12 minutes")
  const formatHours = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) {
      return "0 minutes";
    }
    
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    
    let result = "";
    
    if (hours > 0) {
      result += `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    if (minutes > 0) {
      if (result) result += " ";
      result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return result || "0 minutes";
  };

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
    fetchCounts(); // Fetch counts when component mounts
    
    if (typeFilter === "categories") {
      fetchCategoriesData();
      setViewMode("table");
    } else {
      fetchDashboardInformation();
    }
  }, [dispatch, typeFilter, statusFilter]);

  // New function to fetch all counts
  const fetchCounts = async () => {
    const { user, token } = getUserData();
    if (user && token) {
      // Dispatch all count actions
      dispatch(findCoursesCount({ user, token }));
      dispatch(findTestsCount({ user, token }));
      dispatch(findEmployeesCount({ user, token }));
      dispatch(findInternsCount({ user, token }));
    }
  };

  const fetchCategoriesData = async () => {
    try {
      const { user, token } = getUserData();
  
      if (!user || !token) {
        console.error("User or token is missing.");
        return;
      }
  
      const response = await axios.post(`${FETCH_CATEGORIES_URL}`, {
        user,
        token,
      });
  
      if (response.data.response === "success") {
        setCategoriesData(response.data.payload);
        console.log("Categories loaded:", response.data.payload);
      } else {
        setCategoriesData([]);
        console.error("Failed to fetch categories or no data found.");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategoriesData([]);
    }
  };

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
          setCurrentPage(1); // Reset to first page when fetching new data
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

  // Start category update process - opens the modal with current values
  const openUpdateCategoryModal = (category) => {
    setCategoryToUpdate(category);
    setUpdatedCategory(category.category);
    setUpdatedSubCategory(category.subCategory);
    setIsUpdateModalOpen(true);
  };

  // Close the update modal
  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setCategoryToUpdate(null);
    setUpdatedCategory("");
    setUpdatedSubCategory("");
  };

  // Handle update category with new values
  const handleUpdateCategory = async () => {
    try {
      const { user, token } = getUserData();
      
      if (!user || !token || !categoryToUpdate) {
        console.error("User, token, or category data is missing.");
        return;
      }
      
      const response = await axios.post(`${UPDATE_CATEGORY_URL}`, {
        user,
        token,
        categoryId: categoryToUpdate.categoryId,
        category: updatedCategory,
        subCategory: updatedSubCategory
      });
      
      if (response.data.response === "success") {
        // Close modal and refresh categories
        closeUpdateModal();
        fetchCategoriesData();
        console.log("Category updated successfully");
      } else {
        console.error("Failed to update category:", response.data.message);
        alert("Failed to update category: " + response.data.message);
      }
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Error updating category. Please try again.");
    }
  };

  // Filter items based on search term and filters
  const getFilteredItems = () => {
    if (typeFilter === "categories") {
      // Filter categories data
      return categoriesData.filter(item => {
        return item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

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
  
  // Calculate pagination
  const indexOfLastItem = currentPage * cardsPerPage;
  const indexOfFirstItem = indexOfLastItem - cardsPerPage;
  const currentItems = typeFilter !== "categories" 
    ? filteredItems.slice(indexOfFirstItem, indexOfLastItem)
    : filteredItems; // Don't paginate categories
  const totalPages = Math.ceil(filteredItems.length / cardsPerPage);

  // Pagination handlers
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle type filter change
  const handleTypeFilterChange = (e) => {
    const newType = e.target.value;
    setTypeFilter(newType);
    setCurrentPage(1); // Reset to first page when changing type
    
    // Force table view when categories is selected
    if (newType === "categories") {
      setViewMode("table");
    }
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

  const handleStatsCardClick = (type) => {
    setTypeFilter(type);

    // Wait for state update and DOM changes to complete
    setTimeout(() => {
      if (controlsSectionRef.current) {
        const yOffset = -80; // Adjust this value to control scroll position (negative = less scrolling)
        const element = controlsSectionRef.current;
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;

        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  // Render card view content with pagination
  const renderCardView = () => {
    return (
      <>
        <div className={styles.courseRequests}>
          {Array.isArray(currentItems) && currentItems.length > 0 ? (
            currentItems.map((item) => (
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
                        <strong>Estimated Hours:</strong> {item.totalHours}
                      </p>
                      <p>
                        <strong>Actual Hours: </strong> {formatHours(item.courseLengthInHours)}
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
        
        {/* Pagination Controls */}
        {filteredItems.length > 0 && typeFilter !== "categories" && (
          <div className={styles.paginationControls}>
            <button 
              className={styles.paginationButton} 
              onClick={prevPage} 
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className={styles.pageIndicator}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className={styles.paginationButton} 
              onClick={nextPage} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  // Render table view content
  const renderTableView = () => {
    if (typeFilter === "categories") {
      return (
        <div className={styles.tableContainer}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Sub-Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <tr key={`category-${index}`}>
                    <td>{item.category}</td>
                    <td>{item.subCategory}</td>
                    <td>
                      <button
                        className={styles.updateButton}
                        onClick={() => openUpdateCategoryModal(item)}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className={styles.noItems}>
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className={styles.tableContainer}>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>{typeFilter === "course" ? "Course Name" : "Test Name"}</th>
              <th>Instructor</th>
              <th>
                {typeFilter === "course" ? "Total Hours" : "Duration (min)"}
              </th>
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
                      className={`${styles.tableStatus} ${getStatusClass(
                        item
                      )}`}
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
                <td
                  colSpan={typeFilter === "course" ? 7 : 5}
                  className={styles.noItems}
                >
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Category Update Modal
  const renderUpdateCategoryModal = () => {
    if (!isUpdateModalOpen) return null;
    
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h2>Update Category</h2>
            <button 
              className={styles.closeButton}
              onClick={closeUpdateModal}
            >
              ×
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="categoryName">Category Name:</label>
              <input
                type="text"
                id="categoryName"
                value={updatedCategory}
                onChange={(e) => setUpdatedCategory(e.target.value)}
                className={styles.formInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="subCategoryName">Sub-Category Name:</label>
              <input
                type="text"
                id="subCategoryName"
                value={updatedSubCategory}
                onChange={(e) => setUpdatedSubCategory(e.target.value)}
                className={styles.formInput}
              />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelButton}
              onClick={closeUpdateModal}
            >
              Cancel
            </button>
            <button 
              className={styles.saveButton}
              onClick={handleUpdateCategory}
              disabled={!updatedCategory || !updatedSubCategory}
            >
              Save Changes
            </button>
          </div>
        </div>
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
          </div>
          <div className={styles.headerRight}>
            <div className={styles.filterContainer}>
              <input
                type="search"
                placeholder={`Search ${typeFilter}...`}
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {typeFilter !== "categories" && (
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
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Stats Section with Click Navigation */}
        <div className={styles.dashboardStats}>
          <div
            className={styles.statCard}
            onClick={() => handleStatsCardClick("course")}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.statValue}>{courseCount || 0}</div>
            <div className={styles.statLabel}>Total Courses</div>
          </div>
          <div
            className={styles.statCard}
            onClick={() => handleStatsCardClick("test")}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.statValue}>{testCount || 0}</div>
            <div className={styles.statLabel}>Total Tests</div>
          </div>
          <div
            className={styles.statCard}
            onClick={() => navigate("/manager/employee")}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.statValue}>{employeeCount || 0}</div>
            <div className={styles.statLabel}>Total Employees</div>
          </div>
          <div
            className={styles.statCard}
            onClick={() => navigate("/manager/intern")}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.statValue}>{internCount || 0}</div>
            <div className={styles.statLabel}>Total Interns</div>
          </div>
        </div>

        <div className={styles.controlsContainer} ref={controlsSectionRef}>
          {typeFilter !== "categories" && (
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
                      disabled={typeFilter === "categories" && option === "card"}
                    />
                    <span className={styles.radioText}>
                      {option.charAt(0).toUpperCase() + option.slice(1)} View
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actionButtons}>
            <AddOffice />
            <CategoryCreator
               fetchAllCategories={fetchCategoriesData} 
            />
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {typeFilter === "categories" || viewMode === "table" ? renderTableView() : renderCardView()}
        
        {/* Render the update category modal */}
        {renderUpdateCategoryModal()}
      </main>
    </div>
  );
};

export default ManagerDashboard;
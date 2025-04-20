import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import { viewAllotedTest } from "../../features/user/userActions";
import DashboardSidebar from "../../assets/DashboardSidebar";
import ResultPopup from "./ResultPopup"; // Import the ResultPopup component
import TestResultPopup from "./TestResultPopup";
import styles from "./MyTests.module.css";

const MyTests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { allottedTest, loading, error } = useSelector(
    (state) => state.employee
  );

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // State for result popup
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const[showDetailedResult,setShowDetailedResult]=useState(false);

  useEffect(() => {
    dispatch(viewAllotedTest());
  }, [dispatch]);

  // Add debugging to check payload structure
  useEffect(() => {
    if (allottedTest) {
      console.log("Allotted Test Data:", allottedTest);
    }
  }, [allottedTest]);

  const handleViewResults = (allotmentId) => {
    setSelectedTestId(allotmentId);
   setShowDetailedResult(true);
  };
  // Status badge styling helper
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: styles.pendingBadge,
      started: styles.startedBadge,
      completed: styles.completedBadge,
      expired: styles.expiredBadge,
    };
    return statusClasses[status] || styles.pendingBadge;
  };

  // Function to check if a test can be started based on dates (ignoring time)
  const canStartTest = (test) => {
    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);
    
    // Reset time to midnight (00:00:00) for all dates to compare only the date portion
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const testStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const testEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    
    const dateRangeValid = nowDate >= testStartDate && nowDate <= testEndDate;
    const statusValid = test.completionStatus === "pending";
    
    
    // Include both start and end dates in the valid range
    return dateRangeValid && statusValid;
  };

  // Function to handle button click based on test status
  const handleActionButtonClick = (test) => {
    if (test.completionStatus === "completed") {
      // Show result popup
      setSelectedTestId(test.allotmentId);
      setShowResultPopup(true);
    } else if (canStartTest(test)) {
      // Navigate to test page
      navigate('/user/test', { 
        state: { testAllotmentId: test.allotmentId } 
      });
    }
    // For other statuses, button is disabled
  };

  // Function to generate appropriate button text (ignoring time)
  const getActionButtonText = (test) => {
    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);
    
    // Reset time to midnight for all dates
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const testStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const testEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    if (test.completionStatus === "completed") {
      return "View Results";
    } else if (nowDate < testStartDate) {
      return "Not Available Yet";
    } else if (nowDate > testEndDate) {
      return "Expired";
    } else if (test.completionStatus === "started") {
      return "Already Started";
    } else {
      return "Start Test";
    }
  };

  // Check if button should be enabled
  const isButtonEnabled = (test) => {
    return test.completionStatus === "completed" || canStartTest(test);
  };

  // Modified filter logic to handle potential nested structure variations
  const filteredTests = allottedTest
    ? allottedTest.filter((test) => {
        // Handle different data structures that might exist
        const testName = test.test?.testName || test.testName || "";
        
        const matchesSearch = searchQuery === "" || 
          testName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const status = test.completionStatus || test.status || "pending";
        const matchesStatus = statusFilter === "all" || status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  // Format date function with error handling - removing time component
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString;
    }
  };

  // Helper function to safely get test properties
  const getTestProperty = (test, path, defaultValue = "N/A") => {
    try {
      if (path === "testName") {
        return test.test?.testName || test.testName || defaultValue;
      } else if (path === "instructorName") {
        return test.test?.instructorName || test.instructorName || defaultValue;
      } else if (path === "duration") {
        return test.test?.duration || test.duration || defaultValue;
      }
      return defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // Close the result popup
  const handleCloseResultPopup = () => {
    setShowResultPopup(false);
    setSelectedTestId(null);
  };

  const handleCloseDetailResultPopup = () => {
    setShowDetailedResult(false);
    setSelectedTestId(null);
  };

  return (
    <div className={styles.myTestsContainer}>
      <DashboardSidebar activeLink="tests" />
      
      <div className={styles.testContent}>
        <header className={styles.pageHeader}>
          <h1>My Tests</h1>
          <div className={styles.filters}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Tests</option>
              <option value="pending">Pending</option>
              <option value="started">Started</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {loading && <div className={styles.loading}>Loading tests...</div>}
        
        {error && (
          <div className={styles.error}>
            {typeof error === "string"
              ? error
              : error.message || "An error occurred"}
          </div>
        )}

        {!loading &&
          !error &&
          (!allottedTest || allottedTest.length === 0) && (
            <div className={styles.noData}>
              <p>
                No tests have been allotted to you yet. Please check back later.
              </p>
            </div>
          )}

        {!loading && !error && allottedTest && allottedTest.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.testTable}>
              <thead>
                <tr>
                  <th>Allotment Id</th>
                  <th>Test Name</th>
                  <th>Instructor</th>
                  <th>Duration (min)</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.length > 0 ? (
                  filteredTests.map((test, index) => {
                    // Button is enabled for completed tests (to view results) or for startable tests
                    const buttonEnabled = isButtonEnabled(test);
                    const buttonText = getActionButtonText(test);
                    
                    return (
                      <tr key={test.id || index}>
                        <td>{test.allotmentId}</td>
                        <td>{getTestProperty(test, "testName")}</td>
                        <td>{getTestProperty(test, "instructorName")}</td>
                        <td>{getTestProperty(test, "duration")}</td>
                        <td>{formatDate(test.startDate)}</td>
                        <td>{formatDate(test.endDate)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${getStatusBadgeClass(test.completionStatus || test.status || "pending")}`}>
                            {(test.completionStatus || test.status || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`${styles.actionButton} ${
                              buttonEnabled ? styles.activeButton : styles.disabledButton
                            }`}
                            onClick={() => handleActionButtonClick(test)}
                            disabled={!buttonEnabled}
                          >
                            {buttonText}
                          </button>

                          {(test.completionStatus === "completed") && (
                  <button
                    className={`${styles.actionButton}`}
                    onClick={() => handleViewResults(test.allotmentId)}
                  >
                    View Answer
                  </button>
                )}

                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className={styles.noData}>
                      No tests found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Render the ResultPopup when showResultPopup is true */}
        {showResultPopup && (
          <ResultPopup
            testAllotmentId={selectedTestId}
            onClose={handleCloseResultPopup}
          />
        )}

{showDetailedResult && (
          <TestResultPopup
            testAllotmentId={selectedTestId}
            onClose={handleCloseDetailResultPopup}
          />
        )}

      </div>
    </div>
  );
};

export default MyTests;
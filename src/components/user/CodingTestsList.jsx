import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import DashboardSidebar from "../../assets/DashboardSidebar";
import styles from "./MyTests.module.css"; // Reusing the same CSS file
import { VIEW_CODING_TASK } from "../../constants/apiConstants";

const CodingTestsList = () => {
  const navigate = useNavigate();
  
  // State for coding tests data
  const [codingTests, setCodingTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [evaluationFilter, setEvaluationFilter] = useState("all");

  // Get user data from session storage
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

  // Fetch coding tests from API
  const fetchCodingTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { user, token } = getUserData();
      
      if (!user || !token) {
        setError('User not authenticated');
        return;
      }

      const requestData = {
        user: user,
        token: token
      };

      const response = await axios.post(`${VIEW_CODING_TASK}`, requestData);
      
      if (response.data.response === 'success') {
        setCodingTests(response.data.payload || []);
        console.log('Coding Tests Data:', response.data.payload);
      } else if (response.data.response === 'not_found') {
        setCodingTests([]);
      } else if (response.data.response === 'unauthorized') {
        setError('Unauthorized access. Please login again.');
        // Optionally redirect to login
      } else {
        setError(response.data.message || 'Failed to fetch coding tests');
      }
    } catch (err) {
      console.error('Error fetching coding tests:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to connect to server. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodingTests();
  }, []);

  // Status badge styling helper for completion status
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: styles.pendingBadge,
      started: styles.startedBadge,
      completed: styles.completedBadge,
      expired: styles.expiredBadge,
    };
    return statusClasses[status] || styles.pendingBadge;
  };

  // Evaluation status badge styling helper
  const getEvaluationBadgeClass = (status) => {
    const statusClasses = {
      pending: styles.pendingBadge, // Yellow
      evaluated: styles.completedBadge, // Green
    };
    return statusClasses[status] || styles.pendingBadge;
  };

  // Function to handle button click based on test status
  const handleActionButtonClick = (test) => {
    if (test.completionStatus === "completed") {
      // For completed tests, show results or navigate to results page
      console.log("View results for test:", test.allotmentId);
      // You can implement a results modal or navigation here
      alert(`Results for ${test.taskName}\nScore: ${test.score || 'Pending'}/${test.maxMarks}\nEvaluation: ${test.evaluationStatus}`);
    } else if (test.completionStatus === "pending" || test.completionStatus === "started") {
      // Navigate to coding test IDE with allotment ID in state
      navigate(`/test/coding/preview/${test.allotmentId}`, {
        state: { testAllotmentId: test.allotmentId },
      });
    }
  };

  // Function to generate appropriate button text
  const getActionButtonText = (test) => {
    switch (test.completionStatus) {
      case "completed":
        return "View Results";
      case "started":
        return "Continue Test";
      case "expired":
        return "Expired";
      case "pending":
      default:
        return "Start Test";
    }
  };

  // Check if button should be enabled
  const isButtonEnabled = (test) => {
    return test.completionStatus !== "expired";
  };

  // Filter tests based on search query and filters
  const filteredTests = codingTests.filter((test) => {
    const matchesSearch = 
      searchQuery === "" || 
      test.taskName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || 
      test.completionStatus === statusFilter;

    const matchesEvaluation = 
      evaluationFilter === "all" || 
      test.evaluationStatus === evaluationFilter;

    return matchesSearch && matchesStatus && matchesEvaluation;
  });

  return (
    <div className={styles.myTestsContainer}>
      <DashboardSidebar activeTab="coding-tests" />

      <div className={styles.testContent}>
        <header className={styles.pageHeader}>
          <h1>My Coding Tests</h1>
          <div className={styles.filters}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="started">Started</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
            
            <select
              className={styles.filterSelect}
              value={evaluationFilter}
              onChange={(e) => setEvaluationFilter(e.target.value)}
            >
              <option value="all">All Evaluations</option>
              <option value="pending">Pending Evaluation</option>
              <option value="evaluated">Evaluated</option>
            </select>
            
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search coding tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {loading && <div className={styles.loading}>Loading coding tests...</div>}

        {error && (
          <div className={styles.error}>
            {error}
            <button 
              onClick={fetchCodingTests}
              style={{ 
                marginLeft: '10px', 
                padding: '5px 10px',
                backgroundColor: '#6c5ce7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && codingTests.length === 0 && (
          <div className={styles.noData}>
            <p>No coding tests have been allotted to you yet. Please check back later.</p>
          </div>
        )}

        {!loading && !error && codingTests.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.testTable}>
              <thead>
                <tr>
                  <th>Allotment ID</th>
                  <th>Task Name</th>
                  <th>Max Marks</th>
                  <th>Score</th>
                  <th>Completion Status</th>
                  <th>Evaluation Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.length > 0 ? (
                  filteredTests.map((test, index) => {
                    const buttonEnabled = isButtonEnabled(test);
                    const buttonText = getActionButtonText(test);

                    return (
                      <tr key={test.allotmentId || index}>
                        <td>{test.allotmentId}</td>
                        <td>{test.taskName || 'N/A'}</td>
                        <td>{test.maxMarks || 'N/A'}</td>
                        <td>
                          {test.completionStatus === 'completed' && test.score !== null 
                            ? `${test.score}/${test.maxMarks}` 
                            : test.completionStatus === 'completed' 
                              ? 'Pending Evaluation' 
                              : '-'
                          }
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${getStatusBadgeClass(
                              test.completionStatus || "pending"
                            )}`}
                          >
                            {(test.completionStatus || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${getEvaluationBadgeClass(
                              test.evaluationStatus || "pending"
                            )}`}
                          >
                            {(test.evaluationStatus || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={`${styles.actionButton} ${
                                buttonEnabled
                                  ? styles.activeButton
                                  : styles.disabledButton
                              }`}
                              onClick={() => handleActionButtonClick(test)}
                              disabled={!buttonEnabled}
                            >
                              {buttonText}
                            </button>

                            {test.completionStatus === "completed" && test.evaluationStatus === "evaluated" && (
                              <button
                                className={styles.viewButton}
                                onClick={() => console.log("View detailed results for:", test.allotmentId)}
                                title="View detailed test results and feedback"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className={styles.noData}>
                      No coding tests found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingTestsList;
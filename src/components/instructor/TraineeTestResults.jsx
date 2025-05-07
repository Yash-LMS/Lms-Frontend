import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styles from "./TraineeTestResults.module.css";
import Sidebar from "./InstructorSidebar";
import ExportToExcel from "../../assets/ExportToExcel";
import { viewTraineeResults } from "../../features/test/testActions";

const TraineeTestResult = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("result");
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Add sort state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  // Get trainee results from Redux state
  const { traineeResults, loading, error } = useSelector(state => state.tests);

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
    fetchTraineeResults();
  }, []);

  useEffect(() => {
    // Check if traineeResults exists and has data
    if (traineeResults) {
      // First check if traineeResults is an array directly
      if (Array.isArray(traineeResults)) {
        processResults(traineeResults);
      } 
      // Then check if traineeResults.payload is an array
      else if (traineeResults.payload && Array.isArray(traineeResults.payload)) {
        processResults(traineeResults.payload);
      }
      // Finally check if traineeResults has a data property (common API response structure)
      else if (traineeResults.data && Array.isArray(traineeResults.data)) {
        processResults(traineeResults.data);
      }
      // If we have results but can't find the array, log the structure for debugging
      else if (traineeResults) {
        console.log("Unexpected traineeResults structure:", traineeResults);
        setIsLoading(false);
      }
    }
  }, [traineeResults]);

  // Function to process the results once we've found the array
  const processResults = (resultsArray) => {
    if (resultsArray && resultsArray.length >= 0) {
      // Calculate pass percentage for each result and add sequence number
      const resultsWithPassPercentage = resultsArray.map((result, index) => {
        const passPercentage = calculatePassPercentage(result.score, result.totalMarks);
        return { 
          ...result, 
          passPercentage,
          sequenceNumber: index + 1  // Add sequential numbering
        };
      });

      setResults(resultsWithPassPercentage);
      setFilteredResults(resultsWithPassPercentage);
      setIsLoading(false);
    } else {
      // Empty array is valid data, just no results
      setResults([]);
      setFilteredResults([]);
      setIsLoading(false);
    }
  };

  const fetchTraineeResults = async () => {
    setIsLoading(true);
    try {
      const { user, token } = getUserData();

      if (!user || !token) {
        console.error("User or token is missing.");
        setIsLoading(false);
        return;
      }

      // Get the email ID directly from the user object in session storage
      const emailId = user.emailId || user.email;

      if (!emailId) {
        console.error("Trainee email ID is missing from user object.");
        setIsLoading(false);
        return;
      }

      // Dispatch the Redux action to fetch trainee results
      dispatch(viewTraineeResults({ emailId, user, token }));
    } catch (error) {
      console.error("Error fetching trainee results:", error);
      setIsLoading(false);
    }
  };

  // Update isLoading based on Redux loading state
  useEffect(() => {
    if (loading !== undefined) {
      setIsLoading(loading);
    }
  }, [loading]);

  useEffect(() => {
    filterResults();
  }, [searchTerm, filterBy, results, sortConfig]);

  const filterResults = () => {
    let filtered = [...results];

    // Search functionality
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((result) =>
        Object.values(result).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters based on selection
    switch (filterBy) {
      case "score_high_to_low":
        filtered.sort((a, b) => b.passPercentage - a.passPercentage);
        break;
      case "score_low_to_high":
        filtered.sort((a, b) => a.passPercentage - b.passPercentage);
        break;
      case "internal_tests":
        filtered = filtered.filter(
          (result) => result.testType && result.testType.toLowerCase() === "internal"
        );
        break;
      case "external_tests":
        filtered = filtered.filter(
          (result) => result.testType && result.testType.toLowerCase() === "external"
        );
        break;
      default:
        // No additional filtering for "all"
        break;
    }

    // Apply column sorting if a sort configuration is set
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Handle null or undefined values
        const aValue = a[sortConfig.key] !== undefined ? a[sortConfig.key] : '';
        const bValue = b[sortConfig.key] !== undefined ? b[sortConfig.key] : '';
        
        // Handle numeric values
        if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
          return sortConfig.direction === 'ascending'
            ? parseFloat(aValue) - parseFloat(bValue)
            : parseFloat(bValue) - parseFloat(aValue);
        }

        // Handle string values
        if ((aValue || '').toString().toLowerCase() < (bValue || '').toString().toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if ((aValue || '').toString().toLowerCase() > (bValue || '').toString().toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredResults(filtered);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirectionIcon = (name) => {
    if (sortConfig.key !== name) {
      return <span className={styles.sortIcon}>↕</span>;
    }
    return sortConfig.direction === "ascending" ? (
      <span className={styles.sortIcon}>▲</span> // Up arrow
    ) : (
      <span className={styles.sortIcon}>▼</span>
    ); // Down arrow
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterByChange = (e) => {
    setFilterBy(e.target.value);
  };

  // Removed view results handlers

  const calculatePassPercentage = (score, totalMarks) => {
    if (!score || !totalMarks || totalMarks === 0) return "0";
    return ((score / totalMarks) * 100).toFixed(0);
  };

  const getPassPercentageClass = (percentage) => {
    percentage = parseInt(percentage) || 0;
    if (percentage >= 70) return styles.highPass;
    if (percentage >= 40) return styles.mediumPass;
    return styles.lowPass;
  };

  const excelHeaders = {
    sequenceNumber: "Sequence Number",
    name: "Name",
    emailId: "Email",
    testName: "Test Name",
    testType: "Test Type",
    courseName: "Course Name",
    score: "Score",
    totalMarks: "Total Marks",
    passPercentage: "Pass Percentage",
    correctAnswers: "Correct Answers",
    incorrectAnswers: "Incorrect Answers",
    questionSkipped: "Skipped Questions",
    totalQuestion: "Total Questions",
  };

  const exportData = filteredResults.map((result) => {
    const passPercentage = calculatePassPercentage(result.score, result.totalMarks);
    return {
      ...result,
      passPercentage: `${passPercentage}%`, // Add pass percentage to each result
    };
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with zero if needed
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed) and pad
      const year = date.getFullYear(); // Get full year
      return `${day}-${month}-${year}`; // Return formatted date
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string if formatting fails
    }
  };

  // Get email from user object in session storage
  const { user } = getUserData();
  const traineeEmail = user?.emailId || user?.email || "trainee";

  return (
    <div className={styles.container}>
      <div className={styles.sidebarWrapper}>
        <Sidebar activeTab={activeTab} />
      </div>

      <div className={styles.contentArea}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Test Results</h1>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by test name, type or any parameter..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filter by:</label>
            <select
              value={filterBy}
              onChange={handleFilterByChange}
              className={styles.filterSelect}
            >
              <option value="all">All Results</option>
              <option value="score_high_to_low">Percentage (High to Low)</option>
              <option value="score_low_to_high">Percentage (Low to High)</option>
              <option value="internal_tests">Internal Tests</option>
              <option value="external_tests">External Tests</option>
            </select>
          </div>

          <div className={styles.headerActions}>
            <ExportToExcel
              data={exportData}
              headers={excelHeaders}
              fileName={`Test-Results-${traineeEmail}`}
              sheetName="Results"
              buttonStyle={{
                marginBottom: "0",
              }}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => requestSort('sequenceNumber')} className={styles.sortableHeader}>
                  Sequence ID {getSortDirectionIcon('sequenceNumber')}
                </th>
                <th onClick={() => requestSort('name')} className={styles.sortableHeader}>
                  Name {getSortDirectionIcon('name')}
                </th>
                <th onClick={() => requestSort('emailId')} className={styles.sortableHeader}>
                  Email {getSortDirectionIcon('emailId')}
                </ th>
                <th onClick={() => requestSort('testName')} className={styles.sortableHeader}>
                  Test Name {getSortDirectionIcon('testName')}
                </th>
                <th onClick={() => requestSort('testType')} className={styles.sortableHeader}>
                  Test Type {getSortDirectionIcon('testType')}
                </th>
                <th onClick={() => requestSort('courseName')} className={styles.sortableHeader}>
                  Course Name {getSortDirectionIcon('courseName')}
                </th>
                <th onClick={() => requestSort('score')} className={styles.sortableHeader}>
                  Score {getSortDirectionIcon('score')}
                </th>
                <th onClick={() => requestSort('totalMarks')} className={styles.sortableHeader}>
                  Total Marks {getSortDirectionIcon('totalMarks')}
                </th>
                <th onClick={() => requestSort('passPercentage')} className={styles.sortableHeader}>
                  Pass % {getSortDirectionIcon('passPercentage')}
                </th>
                <th onClick={() => requestSort('correctAnswers')} className={styles.sortableHeader}>
                  Correct {getSortDirectionIcon('correctAnswers')}
                </th>
                <th onClick={() => requestSort('incorrectAnswers')} className={styles.sortableHeader}>
                  Incorrect {getSortDirectionIcon('incorrectAnswers')}
                </th>
                <th onClick={() => requestSort('questionSkipped')} className={styles.sortableHeader}>
                  Unattempted {getSortDirectionIcon('questionSkipped')}
                </th>
                <th onClick={() => requestSort('totalQuestion')} className={styles.sortableHeader}>
                  Total {getSortDirectionIcon('totalQuestion')}
                </th>
                <th onClick={() => requestSort('submissionDate')} className={styles.sortableHeader}>
                  Submission Date {getSortDirectionIcon('submissionDate')}
                </th>
                <th onClick={() => requestSort('submissionTime')} className={styles.sortableHeader}>
                  Submission Time {getSortDirectionIcon('submissionTime')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="16" className={styles.noRecords}>
                    Loading results...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="16" className={styles.noRecords}>
                    No records available
                  </td>
                </tr>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result, index) => {
                  const passPercentage = calculatePassPercentage(
                    result.score,
                    result.totalMarks
                  );
                  const percentageClass =
                    getPassPercentageClass(passPercentage);
                  return (
                    <tr key={result.sequenceNumber || result.allotmentId || result.id || Math.random().toString()}>
                      <td>{result.sequenceNumber || (index + 1)}</td>
                      <td>{result.name || "-"}</td>
                      <td>{result.emailId || "-"}</td>
                      <td>{result.testName || "-"}</td>
                      <td>{result.testType ? result.testType.toUpperCase() : "-"}</td>
                      <td>
                        {result.testType && result.testType.toLowerCase() === "internal"
                          ? result.courseName || "-"
                          : "EXTERNAL"}
                      </td>
                      <td>{result.score || "0"}</td>
                      <td>{result.totalMarks || "0"}</td>
                      <td>
                        <span
                          className={`${styles.passPercentage} ${percentageClass}`}
                        >
                          {passPercentage}%
                        </span>
                      </td>
                      <td>{result.correctAnswers || "0"}</td>
                      <td>{result.incorrectAnswers || "0"}</td>
                      <td>{result.questionSkipped || "0"}</td>
                      <td>{result.totalQuestion || "0"}</td>
                      <td>{formatDate(result.submissionDate)}</td>
                      <td>{result.submissionTime || "-"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="16" className={styles.noRecords}>
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TraineeTestResult;
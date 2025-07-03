import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./TraineeResults.module.css";
import { ALL_TRAINEE_RESULT } from "../../constants/apiConstants";
import Sidebar from "./Sidebar";
import ExportToExcel from "../../assets/ExportToExcel";
import TestResultPopup from "./TestResultPopup";
import TestImageView from "./TestImageView";

const AllResults = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("results");
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const[showDetailedResult,setShowDetailedResult]=useState(false);
  const[selectedTestId,setSelectedTestId]=useState(null);
  const[showImageModal,setShowImageModal]=useState(false);

  // Add date filter states
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: ""
  });

  // Add sort state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

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
    fetchAllResults();
  }, []);

  const fetchAllResults = async () => {
    setIsLoading(true);
    try {
      const { user, token } = getUserData();

      if (!user || !token) {
        console.error("User  or token is missing.");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(`${ALL_TRAINEE_RESULT}`, {
        user,
        token,
      });

      console.log("API Response:", response.data); // Log the API response

      if (response.data.response === "success") {
        // Calculate pass percentage for each result
        const resultsWithPassPercentage = response.data.payload.map((result) => {
          const passPercentage = calculatePassPercentage(result.score, result.totalMarks);
          return { ...result, passPercentage }; // Add passPercentage to each result
        });

        setResults(resultsWithPassPercentage);
        setFilteredResults(resultsWithPassPercentage);
      } else {
        console.error("Failed to fetch results:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching trainee results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterResults();
  }, [searchTerm, filterBy, results, sortConfig, dateFilter]);

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

    // Date filter functionality
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((result) => {
        const submissionDate = new Date(result.submissionDate);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

        // Set time to beginning/end of day for proper comparison
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate && endDate) {
          return submissionDate >= startDate && submissionDate <= endDate;
        } else if (startDate) {
          return submissionDate >= startDate;
        } else if (endDate) {
          return submissionDate <= endDate;
        }
        return true;
      });
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
          (result) => result.testType.toLowerCase() === "internal"
        );
        break;
      case "external_tests":
        filtered = filtered.filter(
          (result) => result.testType.toLowerCase() === "external"
        );
        break;
      default:
        // No additional filtering for "all"
        break;
    }

    // Apply column sorting if a sort configuration is set
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Handle numeric values
        if (!isNaN(parseFloat(a[sortConfig.key])) && !isNaN(parseFloat(b[sortConfig.key]))) {
          return sortConfig.direction === 'ascending'
            ? parseFloat(a[sortConfig.key]) - parseFloat(b[sortConfig.key])
            : parseFloat(b[sortConfig.key]) - parseFloat(a[sortConfig.key]);
        }

        // Handle string values
        if ((a[sortConfig.key] || '').toString().toLowerCase() < (b[sortConfig.key] || '').toString().toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if ((a[sortConfig.key] || '').toString().toLowerCase() > (b[sortConfig.key] || '').toString().toLowerCase()) {
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

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearDateFilter = () => {
    setDateFilter({
      startDate: "",
      endDate: ""
    });
  };

  const handleViewResults = (allotmentId) => {
    setSelectedTestId(allotmentId);
   setShowDetailedResult(true);
  };

   const handleViewImages = (allotmentId) => {
    setSelectedTestId(allotmentId);
   setShowImageModal(true);
  };

   const handleCloseDetailResultPopup  = () => {
    setShowDetailedResult(false);
    setSelectedTestId(null);
  };

  const handleCloseTestImageView = () => {
    setShowImageModal(false);
    setSelectedTestId(null);
  };

  const calculatePassPercentage = (score, totalMarks) => {
    return ((score / totalMarks) * 100).toFixed(0);
  };

  const getPassPercentageClass = (percentage) => {
    percentage = parseInt(percentage);
    if (percentage >= 70) return styles.highPass;
    if (percentage >= 40) return styles.mediumPass;
    return styles.lowPass;
  };

  const excelHeaders = {
    allotmentId: "Allotment ID",
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
    submissionDate: "Submission Date",
    submissionTime: "Submission Time",
  };

  const exportData = filteredResults.map((result) => {
    const passPercentage = calculatePassPercentage(result.score, result.totalMarks);
    return {
      ...result,
      passPercentage: `${passPercentage}%`, // Add pass percentage to each result
    };
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with zero if needed
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-indexed) and pad
    const year = date.getFullYear(); // Get full year
    return `${day}-${month}-${year}`; // Return formatted date
  };

  return (
    <div className={styles.container}>
      <div>
        <Sidebar activeTab={activeTab} />
      </div>

      <div className={styles.contentArea}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>All Test Results</h1>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by name, email or any parameter..."
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

          {/* Date Filter Section */}
          <div className={styles.dateFilterGroup}>
            <label className={styles.filterLabel}>Filter by Date:</label>
            <div className={styles.dateInputContainer}>
              <input
                type="date"
                name="startDate"
                value={dateFilter.startDate}
                onChange={handleDateFilterChange}
                className={styles.dateInput}
                placeholder="Start Date"
              />
              <span className={styles.dateSeparator}>to</span>
              <input
                type="date"
                name="endDate"
                value={dateFilter.endDate}
                onChange={handleDateFilterChange}
                className={styles.dateInput}
                placeholder="End Date"
              />
              {(dateFilter.startDate || dateFilter.endDate) && (
                <button
                  onClick={clearDateFilter}
                  className={styles.clearDateFilter}
                  title="Clear date filter"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            <ExportToExcel
              data={exportData}
              headers={excelHeaders}
              fileName="All-Test-Results"
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
                <th onClick={() => requestSort('allotmentId')} className={styles.sortableHeader}>
                  Allotment ID {getSortDirectionIcon('allotmentId')}
                </th>
                <th onClick={() => requestSort('name')} className={styles.sortableHeader}>
                  Name {getSortDirectionIcon('name')}
                </th>
                <th onClick={() => requestSort('emailId')} className={styles.sortableHeader}>
                  Email {getSortDirectionIcon('emailId')}
                </th>
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
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="16" className={styles.noRecords}>
                    Loading results...
                  </td>
                </tr>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result) => {
                  const passPercentage = calculatePassPercentage(
                    result.score,
                    result.totalMarks
                  );
                  const percentageClass =
                    getPassPercentageClass(passPercentage);
                  return (
                    <tr key={result.allotmentId || result.id}>
                      <td>{result.allotmentId || result.id}</td>
                      <td>{result.name}</td>
                      <td>{result.emailId}</td>
                      <td>{result.testName}</td>
                      <td>{result.testType.toUpperCase()}</td>
                      <td>
                        {result.testType === "internal"
                          ? result.courseName
                          : "EXTERNAL"}
                      </td>
                      <td>{result.score}</td>
                      <td>{result.totalMarks}</td>
                      <td>
                        <span
                          className={`${styles.passPercentage} ${percentageClass}`}
                        >
                          {passPercentage}%
                        </span>
                      </td>
                      <td>{result.correctAnswers}</td>
                      <td>{result.incorrectAnswers}</td>
                      <td>{result.questionSkipped}</td>
                      <td>{result.totalQuestion}</td>
                      <td>{formatDate(result.submissionDate)}</td>
                      <td>{result.submissionTime}</td>
                      <td>
                          <button onClick={() => handleViewResults(result.allotmentId)} className={styles.viewBtn }>
                          View Result
                          </button>
                      </td>
                      <button onClick={() => handleViewImages(result.allotmentId)} className={styles.viewBtn }>
                          Invigilation
                      </button>
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

      {showDetailedResult && (
          <TestResultPopup
            testAllotmentId={selectedTestId}
            onClose={handleCloseDetailResultPopup}
          />
        )}

        {showImageModal && (
          <TestImageView
            testAllotmentId={selectedTestId}
            onClose={handleCloseTestImageView}
          />
        )}
    </div>
  );
};

export default AllResults;
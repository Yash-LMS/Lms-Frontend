import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import styles from "./TraineeResults.module.css";
import {
  VIEW_TRAINEE_RESULT,
  VIEW_TRAINEE_LIST,
} from "../../constants/apiConstants";
import Sidebar from "./Sidebar";
import ExportToExcel from "../../assets/ExportToExcel";
import TestResultPopup from "./TestResultPopup";

const TraineeResults = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("results");
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [traineeList, setTraineeList] = useState([]);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const[showDetailedResult,setShowDetailedResult]=useState(false);
  const[selectedTestId,setSelectedTestId]=useState(null);

  // Add sort state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
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
    fetchTraineeList();
  }, []);

  // Fetch trainee results when a trainee is selected
  useEffect(() => {
    if (selectedEmailId) {
      fetchTraineeResults();
    }
  }, [selectedEmailId]);

  const fetchTraineeList = async () => {
    setIsLoading(true);
    try {
      const { user, token } = getUserData();

      if (!user || !token) {
        console.error("User or token is missing.");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(`${VIEW_TRAINEE_LIST}`, {
        user,
        token,
      });

      if (response.data.response === "success") {
        setTraineeList(response.data.payload);
        console.log("Trainee list loaded:", response.data.payload);
      }
    } catch (error) {
      console.error("Error fetching trainee list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTraineeResults = async () => {
    setIsLoading(true);
    try {
      const { user, token } = getUserData();

      if (!user || !token) {
        console.error("User  or token is missing.");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(`${VIEW_TRAINEE_RESULT}`, {
        user,
        emailId: selectedEmailId,
        token,
      });

      if (response.data.response === "success") {
        const resultsWithPassPercentage = response.data.payload.map(
          (result) => {
            const passPercentage = calculatePassPercentage(
              result.score,
              result.totalMarks
            );
            return { ...result, passPercentage };
          }
        );
        setResults(resultsWithPassPercentage);
        setFilteredResults(resultsWithPassPercentage);
        console.log("Results loaded:", response.data.payload);
      } else {
        setResults([]);
        setFilteredResults([]);
        console.log("No results found or error in response");
      }
    } catch (error) {
      console.error("Error fetching trainee results:", error);
      setResults([]);
      setFilteredResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterResults();
  }, [searchTerm, filterBy, results, sortConfig]);

  // Request sort handler
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Get sort direction icon
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
        if (
          !isNaN(parseFloat(a[sortConfig.key])) &&
          !isNaN(parseFloat(b[sortConfig.key]))
        ) {
          if (parseFloat(a[sortConfig.key]) < parseFloat(b[sortConfig.key])) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (parseFloat(a[sortConfig.key]) > parseFloat(b[sortConfig.key])) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }

        // Handle special case for pass percentage
        if (sortConfig.key === "passPercentage") {
          if (parseFloat(a.passPercentage) < parseFloat(b.passPercentage)) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (parseFloat(a.passPercentage) > parseFloat(b.passPercentage)) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }

        // Handle string values
        if (
          (a[sortConfig.key] || "").toString().toLowerCase() <
          (b[sortConfig.key] || "").toString().toLowerCase()
        ) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (
          (a[sortConfig.key] || "").toString().toLowerCase() >
          (b[sortConfig.key] || "").toString().toLowerCase()
        ) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredResults(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterByChange = (e) => {
    setFilterBy(e.target.value);
  };

  const handleTraineeChange = (selectedOption) => {
    setSelectedTrainee(selectedOption);
    setSelectedEmailId(selectedOption?.value);
    // Reset filters when a new trainee is selected
    setSearchTerm("");
    setFilterBy("all");
    setSortConfig({ key: null, direction: "ascending" }); // Reset sorting
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

  const handleNavigation = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  // Format trainee list for react-select
  const traineeOptions = traineeList.map((trainee) => ({
    value: trainee.emailId,
    label: `${trainee.name} (${trainee.emailId})`,
  }));

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
  };

  const exportData = filteredResults.map((result) => {
    const passPercentage = calculatePassPercentage(
      result.score,
      result.totalMarks
    );
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

  // Custom styles for React Select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: "4px",
      borderColor: "#ddd",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#2c7be5",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#2c7be5"
        : state.isFocused
        ? "#eaf2fa"
        : null,
      color: state.isSelected ? "white" : "black",
    }),
    // Add menu style to set a higher z-index
    menu: (provided) => ({
      ...provided,
      zIndex: 9999, // High z-index to ensure the dropdown appears above other elements
      width: "100%", // Ensures the menu is the same width as the control
    }),
    // Optionally adjust menuPortal for cases where the menu needs to break out of parent containers
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  const handleViewResults = (allotmentId) => {
    setSelectedTestId(allotmentId);
   setShowDetailedResult(true);
  };

  const handleCloseDetailResultPopup = () => {
    setShowDetailedResult(false);
    setSelectedTestId(null);
  };


  return (
    <div className={styles.container}>
      {/* Sidebar component with fixed width */}
      <div>
        <Sidebar activeTab={activeTab} />
      </div>

      {/* Main content */}
      <div className={styles.contentArea}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Trainee Test Results</h1>
        </div>

        {/* Trainee selection dropdown */}
        <div className={styles.traineeSelectContainer}>
          <label className={styles.selectLabel}>Select Trainee:</label>
          <Select
            value={selectedTrainee}
            onChange={handleTraineeChange}
            options={traineeOptions}
            placeholder="Select a trainee to view results..."
            isClearable
            isSearchable
            styles={customSelectStyles}
            menuPortalTarget={document.body}
            isLoading={isLoading && traineeList.length === 0}
          />
        </div>

        {selectedEmailId && (
          <>
            <div className={styles.filters}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Search by email or any parameter..."
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
                  <option value="score_high_to_low">
                    Percentage (High to Low)
                  </option>
                  <option value="score_low_to_high">
                    Percentage (Low to High)
                  </option>
                  <option value="internal_tests">Internal Tests</option>
                  <option value="external_tests">External Tests</option>
                </select>
              </div>

              <div className={styles.headerActions}>
                <ExportToExcel
                  data={exportData}
                  headers={excelHeaders}
                  fileName="Trainee-Test-Results"
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
                    <th
                      onClick={() => requestSort("allotmentId")}
                      className={styles.sortableHeader}
                    >
                      Allotment ID {getSortDirectionIcon("allotmentId")}
                    </th>
                    <th
                      onClick={() => requestSort("name")}
                      className={styles.sortableHeader}
                    >
                      Name {getSortDirectionIcon("name")}
                    </th>
                    <th
                      onClick={() => requestSort("emailId")}
                      className={styles.sortableHeader}
                    >
                      Email {getSortDirectionIcon("emailId")}
                    </th>
                    <th
                      onClick={() => requestSort("testName")}
                      className={styles.sortableHeader}
                    >
                      Test Name {getSortDirectionIcon("testName")}
                    </th>
                    <th
                      onClick={() => requestSort("testType")}
                      className={styles.sortableHeader}
                    >
                      Test Type {getSortDirectionIcon("testType")}
                    </th>
                    <th
                      onClick={() => requestSort("courseName")}
                      className={styles.sortableHeader}
                    >
                      Course Name {getSortDirectionIcon("courseName")}
                    </th>
                    <th
                      onClick={() => requestSort("score")}
                      className={styles.sortableHeader}
                    >
                      Score {getSortDirectionIcon("score")}
                    </th>
                    <th
                      onClick={() => requestSort("totalMarks")}
                      className={styles.sortableHeader}
                    >
                      Total Marks {getSortDirectionIcon("totalMarks")}
                    </th>
                    <th
                      onClick={() => requestSort("passPercentage")}
                      className={styles.sortableHeader}
                    >
                      Pass % {getSortDirectionIcon("passPercentage")}
                    </th>
                    <th
                      onClick={() => requestSort("correctAnswers")}
                      className={styles.sortableHeader}
                    >
                      Correct {getSortDirectionIcon("correctAnswers")}
                    </th>
                    <th
                      onClick={() => requestSort("incorrectAnswers")}
                      className={styles.sortableHeader}
                    >
                      Incorrect {getSortDirectionIcon("incorrectAnswers")}
                    </th>
                    <th
                      onClick={() => requestSort("questionSkipped")}
                      className={styles.sortableHeader}
                    >
                      Unattempted {getSortDirectionIcon("questionSkipped")}
                    </th>
                    <th
                      onClick={() => requestSort("totalQuestion")}
                      className={styles.sortableHeader}
                    >
                      Total {getSortDirectionIcon("totalQuestion")}
                    </th>
                    <th
                      onClick={() => requestSort("submissionDate")}
                      className={styles.sortableHeader}
                    >
                      Submission Date
                      {getSortDirectionIcon("submissionDate")}
                    </th>
                    <th
                      onClick={() => requestSort("submissionTime")}
                      className={styles.sortableHeader}
                    >
                      Submission Time
                      {getSortDirectionIcon("submissionTime")}
                    </th>
                    
                    <th> Action</th>


                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="13" className={styles.noRecords}>
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
                          <td>
                            {formatDate(result.submissionDate)}
                          </td>
                          <td>
                            {result.submissionTime}
                          </td>
                          <td>
  <button onClick={() => handleViewResults(result.allotmentId)}>
    View Result
  </button>
</td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="13" className={styles.noRecords}>
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!selectedEmailId && !isLoading && (
          <div className={styles.noTraineeSelected}>
            <p>Please select a trainee to view their test results.</p>
          </div>
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

export default TraineeResults;

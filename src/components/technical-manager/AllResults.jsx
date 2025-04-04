import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./TraineeResults.module.css";
import { ALL_TRAINEE_RESULT } from "../../constants/apiConstants";
import Sidebar from "./Sidebar";
import ExportToExcel from "../../assets/ExportToExcel";

const AllResults = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("results");
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [filterValue, setFilterValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
        setResults(response.data.payload);
        setFilteredResults(response.data.payload);
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
  }, [searchTerm, filterBy, results]);

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
        filtered.sort((a, b) => b.score - a.score);
        break;
      case "score_low_to_high":
        filtered.sort((a, b) => a.score - b.score);
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

    setFilteredResults(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterByChange = (e) => {
    setFilterBy(e.target.value);
    setFilterValue(""); // Reset filter value when filter type changes
  };

  const handleTraineeChange = (selectedOption) => {
    setSelectedTrainee(selectedOption);
    setSelectedEmailId(selectedOption?.value);
    // Reset filters when a new trainee is selected
    setSearchTerm("");
    setFilterBy("all");
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

  return (
    <div className={styles.container}>
      <div className={styles.sidebarWrapper}>
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
              <option value="score_high_to_low">Score (High to Low)</option>
              <option value="score_low_to_high">Score (Low to High)</option>
              <option value="internal_tests">Internal Tests</option>
              <option value="external_tests">External Tests</option>
            </select>
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
                <th>Allotment ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Test Name</th>
                <th>Test Type</th>
                <th>Course Name</th>
                <th>Score</th>
                <th>Total Marks</th>
                <th>Pass %</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Unattempted</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="12" className={styles.noRecords}>
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12" className={styles.noRecords}>
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

export default AllResults;

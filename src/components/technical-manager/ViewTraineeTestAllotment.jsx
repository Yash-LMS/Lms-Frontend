import React, { useState, useEffect } from "react";
import styles from "./ViewTraineeTestAllotment.module.css";
import axios from "axios";
import ExportToExcel from "../../assets/ExportToExcel";
import {
  FIND_TEST_URL,
  FIND_TRAINEE_URL,
  VIEW_TRAINEE_ALLOTED_COURSE_URL,
} from "../../constants/apiConstants";
import Sidebar from "./Sidebar";

const ViewTraineeTestAllotment = () => {
  const [filterType, setFilterType] = useState("all");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [userList, setUserList] = useState([]);
  const [testList, setTestList] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("allotted");
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [exportData, setExportData] = useState([]);
  const [exportHeaders, setExportHeaders] = useState({});

  useEffect(() => {
    // Define headers once
    const headers = {
      allotmentId: "Allotment ID",
      name: "Trainee Name",
      emailId: "Email Address",
      testName: "Test Name",
      instructorName: "Instructor",
      duration: "Duration (hrs)",
      marks: "Marks",
      startDate: "Start Date",
      endDate: "End Date",
      completionStatus: "Status",
    };

    // Format data for export to handle dates properly
    const formattedData = displayedResults.map((result) => ({
      ...result,
      startDate: formatDate(result.startDate),
      endDate: formatDate(result.endDate),
    }));

    // Update state with formatted data and headers
    setExportData(formattedData);
    setExportHeaders(headers);
  }, [displayedResults]);

  // Check if screen size is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setShowSidebar(window.innerWidth > 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Fetch users and tests on component mount
  useEffect(() => {
    fetchUserList();
    fetchTestList();
  }, []);

  // Auto-fetch results when conditions are met
  useEffect(() => {
    const shouldFetchData =
      filterType === "all" ||
      (filterType === "user" && selectedUser) ||
      (filterType === "test" && selectedTest) ||
      (filterType === "both" && selectedUser && selectedTest);

    if (shouldFetchData) {
      setError(null);
      fetchFilteredResults();
    }
  }, [filterType, selectedUser, selectedTest]);

  // Apply search filter whenever results or search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayedResults(filteredResults);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const results = filteredResults.filter(
        (result) =>
          result.name.toLowerCase().includes(lowerCaseSearch) ||
          result.testName.toLowerCase().includes(lowerCaseSearch)
      );
      setDisplayedResults(results);
    }
  }, [filteredResults, searchTerm]);

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

  const fetchUserList = async () => {
    try {
      const { user, token } = getUserData();
      const response = await axios.post(`${FIND_TRAINEE_URL}`, {
        user,
        token,
      });

      if (response.data.response === "success") {
        setUserList(response.data.payload);
      } else {
        setError("Failed to fetch trainee list");
      }
    } catch (err) {
      setError("Error fetching trainee list");
      console.error(err);
    }
  };

  const fetchTestList = async () => {
    try {
      const { user, token } = getUserData();
      const response = await axios.post(`${FIND_TEST_URL}`, {
        user,
        token,
      });

      if (response.data.response === "success") {
        setTestList(response.data.payload);
      } else {
        console.log("Failed to fetch test list");
      }
    } catch (err) {
      setError("Error fetching test list");
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    // Reset selections when filter type changes
    if (e.target.value === "all") {
      setSelectedUser("");
      setSelectedTest("");
    }
  };

  const fetchFilteredResults = async () => {
    setLoading(true);
    setError("");
    const { user, token } = getUserData();
    try {
      const requestData = {
        user,
        token,
        testId:
          filterType === "test" || filterType === "both"
            ? parseInt(selectedTest)
            : 0,
        emailId:
          filterType === "user" || filterType === "both" ? selectedUser : "",
        testFilter: filterType,
      };

      const response = await axios.post(
        `${VIEW_TRAINEE_ALLOTED_COURSE_URL}`,
        requestData
      );

      if (response.data.response === "success") {
        setFilteredResults(response.data.payload);
        setDisplayedResults(response.data.payload);
      } else {
        console.log(response.data.message || "Failed to fetch results");
      }
    } catch (err) {
      setError("Error applying filter");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilterType("all");
    setSelectedUser("");
    setSelectedTest("");
    setFilteredResults([]);
    setDisplayedResults([]);
    setSearchTerm("");
    setError("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    // Get day, month, and year
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
    const year = date.getFullYear();

    // Return formatted date in dd-MM-YYYY format
    return `${day}-${month}-${year}`;
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <>
      {isMobile && (
        <button onClick={toggleSidebar} className={styles.menuToggle}>
          {showSidebar ? "✕" : "☰"}
        </button>
      )}

      <div
        className={`${styles.sidebarContainer} ${
          showSidebar ? styles.active : ""
        }`}
      >
        <Sidebar activeTab={activeTab} />
      </div>

      <div className={styles.container}>
        <h1 className={styles.title}>Trainee Course Allotment</h1>

        <div className={styles.filterSection}>
          <h2 className={styles.filterTitle}>Filter Options</h2>

          <div className={styles.filterTypeContainer}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="filterType"
                  value="all"
                  checked={filterType === "all"}
                  onChange={handleFilterChange}
                  className={styles.radioInput}
                />
                All Allotments
              </label>
            </div>

            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="filterType"
                  value="user"
                  checked={filterType === "user"}
                  onChange={handleFilterChange}
                  className={styles.radioInput}
                />
                By Trainee
              </label>
            </div>

            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="filterType"
                  value="test"
                  checked={filterType === "test"}
                  onChange={handleFilterChange}
                  className={styles.radioInput}
                />
                By Test
              </label>
            </div>

            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="filterType"
                  value="both"
                  checked={filterType === "both"}
                  onChange={handleFilterChange}
                  className={styles.radioInput}
                />
                By Both
              </label>
            </div>

            <button onClick={handleReset} className={styles.resetButton}>
              Reset
            </button>
          </div>

          <div className={styles.dropdownContainer}>
            {(filterType === "user" || filterType === "both") && (
              <div className={styles.selectGroup}>
                <label htmlFor="userSelect" className={styles.selectLabel}>
                  Select Trainee
                </label>
                <select
                  id="userSelect"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="">-- Select Trainee --</option>
                  {userList.map((user) => (
                    <option key={user.emailId} value={user.emailId}>
                      {user.name} ({user.emailId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(filterType === "test" || filterType === "both") && (
              <div className={styles.selectGroup}>
                <label htmlFor="testSelect" className={styles.selectLabel}>
                  Select Test
                </label>
                <select
                  id="testSelect"
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="">-- Select Test --</option>
                  {testList.map((test) => (
                    <option key={test.testId} value={test.testId}>
                      {test.testName} (Instructor: {test.instructorName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search Bar Addition */}
          {filteredResults.length > 0 && (
            <div className={styles.searchContainer}>
              <label htmlFor="searchInput" className={styles.searchLabel}>
                Search by Trainee or Test Name:
              </label>
              <div className={styles.searchInputWrapper}>
                <input
                  id="searchInput"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Type to search..."
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    className={styles.clearSearchButton}
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {loading && <div className={styles.loadingIndicator}>Loading...</div>}

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div
            className="export-container"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "10px",
            }}
          >
            <ExportToExcel
              data={exportData}
              headers={exportHeaders}
              fileName="trainee-test-results"
              sheetName="Test Results"
            />
          </div>
        </div>

        <div className={styles.resultsSection}>
          {displayedResults.length > 0 ? (
            <div className={styles.tableContainer}>
              <div className={styles.resultsCount}>
                Showing {displayedResults.length}{" "}
                {displayedResults.length === 1 ? "result" : "results"}
                {searchTerm &&
                  filteredResults.length !== displayedResults.length &&
                  ` (filtered from ${filteredResults.length})`}
              </div>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>Allotment ID</th>
                    <th>Trainee Name</th>
                    <th>Email</th>
                    <th>Test Name</th>
                    <th>Instructor</th>
                    <th>Duration (hrs)</th>
                    <th>Marks</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedResults.map((result) => (
                    <tr key={result.allotmentId}>
                      <td>{result.allotmentId}</td>
                      <td>{result.name}</td>
                      <td>{result.emailId}</td>
                      <td>{result.testName}</td>
                      <td>{result.instructorName}</td>
                      <td>{result.duration}</td>
                      <td>{result.marks}</td>
                      <td>{formatDate(result.startDate)}</td>
                      <td>{formatDate(result.endDate)}</td>
                      <td>
                        <span
                          className={
                            result.completionStatus === "COMPLETED"
                              ? styles.statusCompleted
                              : result.completionStatus === "IN_PROGRESS"
                              ? styles.statusInProgress
                              : styles.statusPending
                          }
                        >
                          {result.completionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className={styles.noResults}>
              No results match your search criteria
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default ViewTraineeTestAllotment;

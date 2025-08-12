import React, { useState, useEffect } from "react";
import styles from "./ViewTraineeTestAllotment.module.css";
import axios from "axios";
import ExportToExcel from "../../assets/ExportToExcel";
import {
  FIND_TEST_URL,
  FIND_TRAINEE_URL,
  VIEW_TRAINEE_ALLOTED_TEST_URL,
  SHOW_RESULT_PERMISSION_URL,
  SHOW_DETAIL_RESULT_PERMISSION_URL,
  EXTEND_TEST_END_DATE_URL,
  RESET_TEST_URL,
  DELETE_TEST_ALLOTMENT_URL
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
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("allotted");
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [masterShowScores, setMasterShowScores] = useState("disabled");
  const [masterShowDetailedScores, setMasterShowDetailedScores] = useState("disabled");

  // New states for date extension functionality
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedAllotment, setSelectedAllotment] = useState(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [extending, setExtending] = useState(false);
  
  // New states for modal messages
  const [modalMessage, setModalMessage] = useState("");
  const [modalMessageType, setModalMessageType] = useState(""); // "success" or "error"

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
      showResult: "Show Scores",
      showDetailedReport: "Show Detailed Scores"
    };

    // Format data for export to handle dates properly
    const formattedData = displayedResults.map((result) => ({
      ...result,
      startDate: formatDate(result.startDate),
      endDate: formatDate(result.endDate),
      showResult: result.showResult === "enabled" ? "Yes" : "No",
      showDetailedReport: result.showDetailedReport === "enabled" ? "Yes" : "No"
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

  // Update master toggle states when results are loaded
  useEffect(() => {
    if (filteredResults.length > 0) {
      // Check if all results have the same permission value
      const allShowScoresEnabled = filteredResults.every(result => result.showResult === "enabled");
      const allShowDetailedEnabled = filteredResults.every(result => result.showDetailedReport === "enabled");
      
      setMasterShowScores(allShowScoresEnabled ? "enabled" : "disabled");
      setMasterShowDetailedScores(allShowDetailedEnabled ? "enabled" : "disabled");
    }
  }, [filteredResults]);

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
      setHasSearched(true);
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
        `${VIEW_TRAINEE_ALLOTED_TEST_URL}`,
        requestData
      );

      if (response.data.response === "success") {
        console.log("Filtered results:", response.data.payload);
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
    setHasSearched(false);
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

  // Convert date to YYYY-MM-DD format for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Helper function to render status with appropriate class
  const renderStatus = (status) => {
    let statusClass;
    switch (status) {
      case "completed":
        statusClass = styles.statusCompleted;
        break;
      case "started":
        statusClass = styles.statusStarted;
        break;
      case "pending":
        statusClass = styles.statusPending;
        break;
      case "expired":
        statusClass = styles.statusExpired;
        break;
      default:
        statusClass = styles.statusPending;
    }
    
    return (
      <span className={statusClass}>
        {status}
      </span>
    );
  };

  // New function to handle extend date button click
  const handleExtendDateClick = (allotment) => {
    setSelectedAllotment(allotment);
    setNewEndDate(formatDateForInput(allotment.endDate));
    setExtendReason("");
    setModalMessage("");
    setModalMessageType("");
    setShowExtendModal(true);
  };


 


  // New function to handle date extension submission
  const handleExtendDate = async () => {
    // Clear previous messages
    setModalMessage("");
    setModalMessageType("");

    if (!newEndDate) {
      setModalMessage("Please provide new end date for extension.");
      setModalMessageType("error");
      return;
    }

    const currentEndDate = new Date(selectedAllotment.endDate);
    const selectedNewDate = new Date(newEndDate);
    
    if (selectedNewDate <= currentEndDate) {
      setModalMessage("New end date must be after the current end date.");
      setModalMessageType("error");
      return;
    }

    try {
      setExtending(true);
      const { user, token } = getUserData();
      
      const response = await axios.post(EXTEND_TEST_END_DATE_URL, {
        user,
        token,
        testAllotmentId: selectedAllotment.allotmentId,
        endDate: newEndDate,
      });

      if (response.data.response === "success") {
        // Update the local state to reflect the change
        const updatedResults = filteredResults.map(result => {
          if (result.allotmentId === selectedAllotment.allotmentId) {
            return { ...result, endDate: newEndDate };
          }
          return result;
        });
        
        setFilteredResults(updatedResults);
        
        // Also update displayed results if they're being filtered
        if (searchTerm) {
          const updatedDisplayed = displayedResults.map(result => {
            if (result.allotmentId === selectedAllotment.allotmentId) {
              return { ...result, endDate: newEndDate };
            }
            return result;
          });
          setDisplayedResults(updatedDisplayed);
        } else {
          setDisplayedResults(updatedResults);
        }

        setModalMessage("End date extended successfully!");
        setModalMessageType("success");
        
        // Auto-close modal after 2 seconds on success
        setTimeout(() => {
          handleCloseExtendModal();
        }, 2000);
      } else {
        setModalMessage(response.data.message || "Failed to extend end date");
        setModalMessageType("error");
      }
    } catch (error) {
      console.error("Error extending end date:", error);
      setModalMessage("Error extending end date. Please try again.");
      setModalMessageType("error");
    } finally {
      setExtending(false);
      fetchUserList();
      fetchTestList();
      fetchFilteredResults();
    }
  };

    const handleTestReset = async (allotmentId) => {
    // Clear previous messages
    setModalMessage("");
    setModalMessageType("");

    try {
      setExtending(true);
      const { user, token } = getUserData();
      
      const response = await axios.post(RESET_TEST_URL, {
        user,
        token,
        testAllotmentId: allotmentId,
    
      });

      if (response.data.response === "success") {
        // Update the local state to reflect the change
        const updatedResults = filteredResults.map(result => {
          if (result.allotmentId === selectedAllotment.allotmentId) {
            return { ...result, endDate: newEndDate };
          }
          return result;
        });
        
        setFilteredResults(updatedResults);
        
        // Also update displayed results if they're being filtered
        if (searchTerm) {
          const updatedDisplayed = displayedResults.map(result => {
            if (result.allotmentId === selectedAllotment.allotmentId) {
              return { ...result, endDate: newEndDate };
            }
            return result;
          });
          setDisplayedResults(updatedDisplayed);
        } else {
          setDisplayedResults(updatedResults);
        }

        setModalMessage(response.data.message);
        setModalMessageType("success");
        
        // Auto-close modal after 2 seconds on success
        setTimeout(() => {
          handleCloseExtendModal();
        }, 2000);
      } else {
        setModalMessage(response.data.message || "Failed to reset test");
        setModalMessageType("error");
      }
    } catch (error) {
      console.error("Error in reseting test:", error);
      setModalMessage("Error in reseting test");
      setModalMessageType("error");
    } finally {
       setSelectedAllotment(null);
       fetchUserList();
       fetchTestList();
       fetchFilteredResults();
    }
  };


  const handleDeleteTest = async (allotmentId) => {
    // Clear previous messages
    setModalMessage("");
    setModalMessageType("");

    try {
      setExtending(true);
      const { user, token } = getUserData();
      
      const response = await axios.post(DELETE_TEST_ALLOTMENT_URL, {
        user,
        token,
        testAllotmentId: allotmentId,
    
      });

      if (response.data.response === "success") {
        // Update the local state to reflect the change
        const updatedResults = filteredResults.map(result => {
          if (result.allotmentId === selectedAllotment.allotmentId) {
            return { ...result, endDate: newEndDate };
          }
          return result;
        });
        
        setFilteredResults(updatedResults);
        
        // Also update displayed results if they're being filtered
        if (searchTerm) {
          const updatedDisplayed = displayedResults.map(result => {
            if (result.allotmentId === selectedAllotment.allotmentId) {
              return { ...result, endDate: newEndDate };
            }
            return result;
          });
          setDisplayedResults(updatedDisplayed);
        } else {
          setDisplayedResults(updatedResults);
        }

        setModalMessage(response.data.message);
        setModalMessageType("success");
        
        // Auto-close modal after 2 seconds on success
        setTimeout(() => {
          handleCloseExtendModal();
        }, 2000);
      } else {
        setModalMessage(response.data.message || "Failed to reset test");
        setModalMessageType("error");
      }
    } catch (error) {
      console.error("Error in reseting test:", error);
      setModalMessage("Error in reseting test");
      setModalMessageType("error");
    } finally {
       setSelectedAllotment(null);
       fetchUserList();
       fetchTestList();
       fetchFilteredResults();
    }
  };


  // Function to close the extend modal
  const handleCloseExtendModal = () => {
    setShowExtendModal(false);
    setSelectedAllotment(null);
    setNewEndDate("");
    setExtendReason("");
    setModalMessage("");
    setModalMessageType("");
  };

  // Toggle permission handlers
  const handleToggleShowScores = async (allotmentId, currentValue) => {
    try {
      setUpdating(true);
      const { user, token } = getUserData();
      const newValue = currentValue === "enabled" ? "disabled" : "enabled";
      
      const response = await axios.post(SHOW_RESULT_PERMISSION_URL, {
        user,
        token,
        testAllotmentId: allotmentId,
        testPermission: newValue
      });
      
      if (response.data.response === "success") {
        // Update the local state to reflect the change
        const updatedResults = filteredResults.map(result => {
          if (result.allotmentId === allotmentId) {
            return { ...result, showResult: newValue };
          }
          return result;
        });
        
        setFilteredResults(updatedResults);
        
        // Also update displayed results if they're being filtered
        if (searchTerm) {
          const updatedDisplayed = displayedResults.map(result => {
            if (result.allotmentId === allotmentId) {
              return { ...result, showResult: newValue };
            }
            return result;
          });
          setDisplayedResults(updatedDisplayed);
        } else {
          setDisplayedResults(updatedResults);
        }
      } else {
        console.log("Failed to update permission");
      }
    } catch (error) {
      console.error("Error updating show scores permission:", error);
    } finally {
      setUpdating(false);
    }
  };
  
  const handleToggleShowDetailedScores = async (allotmentId, currentValue) => {
    try {
      setUpdating(true);
      const { user, token } = getUserData();
      const newValue = currentValue === "enabled" ? "disabled" : "enabled";
      
      const response = await axios.post(SHOW_DETAIL_RESULT_PERMISSION_URL, {
        user,
        token,
        testAllotmentId: allotmentId,
        testPermission: newValue
      });
      
      if (response.data.response === "success") {
        // Update the local state to reflect the change
        const updatedResults = filteredResults.map(result => {
          if (result.allotmentId === allotmentId) {
            return { ...result, showDetailedReport: newValue };
          }
          return result;
        });
        
        setFilteredResults(updatedResults);
        
        // Also update displayed results if they're being filtered
        if (searchTerm) {
          const updatedDisplayed = displayedResults.map(result => {
            if (result.allotmentId === allotmentId) {
              return { ...result, showDetailedReport: newValue };
            }
            return result;
          });
          setDisplayedResults(updatedDisplayed);
        } else {
          setDisplayedResults(updatedResults);
        }
      } else {
        console.log("Failed to update detailed permission");
      }
    } catch (error) {
      console.error("Error updating show detailed scores permission:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle master toggle for Show Scores
  const handleMasterToggleShowScores = async () => {
    try {
      setUpdating(true);
      const { user, token } = getUserData();
      const newValue = masterShowScores === "enabled" ? "disabled" : "enabled";
      
      // Create an array of promises for all API calls
      const promises = displayedResults.map(result => 
        axios.post(SHOW_RESULT_PERMISSION_URL, {
          user,
          token,
          testAllotmentId: result.allotmentId,
          testPermission: newValue
        })
      );
      
      // Wait for all promises to resolve
      await Promise.all(promises);
      
      // Update all results with the new value
      const updatedResults = filteredResults.map(result => ({
        ...result,
        showResult: newValue
      }));
      
      setFilteredResults(updatedResults);
      setDisplayedResults(updatedResults.filter(result => 
        !searchTerm || 
        result.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.testName.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      setMasterShowScores(newValue);
    } catch (error) {
      console.error("Error updating master show scores permission:", error);
    } finally {
      setUpdating(false);
    }
  };
  
  // Handle master toggle for Show Detailed Scores
  const handleMasterToggleShowDetailedScores = async () => {
    try {
      setUpdating(true);
      const { user, token } = getUserData();
      const newValue = masterShowDetailedScores === "enabled" ? "disabled" : "enabled";
      
      // Create an array of promises for all API calls
      const promises = displayedResults.map(result => 
        axios.post(SHOW_DETAIL_RESULT_PERMISSION_URL, {
          user,
          token,
          testAllotmentId: result.allotmentId,
          testPermission: newValue
        })
      );
      
      // Wait for all promises to resolve
      await Promise.all(promises);
      
      // Update all results with the new value
      const updatedResults = filteredResults.map(result => ({
        ...result,
        showDetailedReport: newValue
      }));
      
      setFilteredResults(updatedResults);
      setDisplayedResults(updatedResults.filter(result => 
        !searchTerm || 
        result.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.testName.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
      setMasterShowDetailedScores(newValue);
    } catch (error) {
      console.error("Error updating master show detailed scores permission:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {isMobile && (
        <button onClick={toggleSidebar} className={styles.menuToggle}>
          {showSidebar ? "✕" : "☰"}
        </button>
      )}

      <div>
        <Sidebar activeTab={activeTab} />
      </div>

      <div className={styles.container}>
        <div className={styles.pageHeader}><h1>Trainee Test Allotment</h1></div>

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
          {loading ? (
            <div className={styles.loadingIndicator}>Loading...</div>
          ) : (
            <>
              {/* Display table if we have results or have searched */}
              {(displayedResults.length > 0 || hasSearched) && (
                <div className={styles.tableContainer}>
                  {displayedResults.length > 0 ? (
                    <>
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
                            <th>Duration (mins)</th>
                            <th>Marks</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>
                              Show Scores <br />
                              <label className={styles.toggleSwitch}>
                                <input
                                  type="checkbox"
                                  checked={masterShowScores === "enabled"}
                                  onChange={handleMasterToggleShowScores}
                                  disabled={updating || displayedResults.length === 0}
                                />
                                <span className={styles.slider}></span>
                              </label>
                            </th>
                            <th>
                              Show Detailed <br />
                              <label className={styles.toggleSwitch}>
                                <input
                                  type="checkbox"
                                  checked={masterShowDetailedScores === "enabled"}
                                  onChange={handleMasterToggleShowDetailedScores}
                                  disabled={updating || displayedResults.length === 0}
                                />
                                <span className={styles.slider}></span>
                              </label>
                            </th>
                            <th>Actions</th>
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
                                {renderStatus(result.completionStatus)}
                              </td>
                              <td>
                                <label className={styles.toggleSwitch}>
                                  <input
                                    type="checkbox"
                                    checked={result.showResult === "enabled"}
                                    onChange={() => handleToggleShowScores(result.allotmentId, result.showResult)}
                                    disabled={updating}
                                  />
                                  <span className={styles.slider}></span>
                                </label>
                              </td>
                              <td>
                                <label className={styles.toggleSwitch}>
                                  <input
                                    type="checkbox"
                                    checked={result.showDetailedReport === "enabled"}
                                    onChange={() => handleToggleShowDetailedScores(result.allotmentId, result.showDetailedReport)}
                                    disabled={updating}
                                  />
                                  <span className={styles.slider}></span>
                                </label>
                              </td>
                              <td>
                                <button
                                  className={styles.extendButton}
                                  onClick={() => handleExtendDateClick(result)}
                                  disabled={extending}
                                  title="Extend End Date"
                                >
                                  Extend
                                </button>

                              {/* Reset button - only show if completionStatus is 'completed' */}
{result.completionStatus === 'completed' && (
  <button
    className={styles.resetButton}
    onClick={() => handleTestReset(result.allotmentId)}
    title="Reset test"
  >
    Reset
  </button>
)}

{/* Delete button - only show if testType is not 'internal' */}
{result.testType !== 'internal' && (
  <button
    className={styles.resetButton}
    onClick={() => handleDeleteTest(result.allotmentId)}
    title="Delete test allotment"
  >
    Delete
  </button>
)}


                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <>
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
                            <th>Show Scores</th>
                            <th>Show Detailed</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan="13" className={styles.noRecordsCell}>
                              No records available
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Extend Date Modal */}
        {showExtendModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Extend End Date</h3>
                <button 
                  className={styles.closeButton}
                  onClick={handleCloseExtendModal}
                  disabled={extending}
                >
                  ✕
                </button>
              </div>
              
              <div className={styles.modalBody}>
                {/* Message Display in Modal */}
                {modalMessage && (
                  <div 
                    className={modalMessageType === "success" ? styles.successMessage : styles.errorMessage}
                  >
                    {modalMessage}
                  </div>
                )}

                <div className={styles.modalRow}>
                  <strong>Trainee:</strong> {selectedAllotment?.name}
                </div>
                <div className={styles.modalRow}>
                  <strong>Test:</strong> {selectedAllotment?.testName}
                </div>
                <div className={styles.modalRow}>
                  <strong>Current End Date:</strong> {formatDate(selectedAllotment?.endDate)}
                </div>
                
                <div className={styles.inputGroup}>
                  <label htmlFor="newEndDate" className={styles.inputLabel}>
                    New End Date: <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="newEndDate"
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className={styles.dateInput}
                    min={formatDateForInput(new Date(Date.now() + 24 * 60 * 60 * 1000))} // Tomorrow
                    disabled={extending}
                  />
                </div>

              </div>
              
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelButton}
                  onClick={handleCloseExtendModal}
                  disabled={extending}
                >
                  Cancel
                </button>
                <button
                  className={styles.confirmButton}
                  onClick={handleExtendDate}
                  disabled={extending || !newEndDate}
                >
                  {extending ? "Extending..." : "Extend Date"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewTraineeTestAllotment;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import styles from "./TestAllotment.module.css";
import TestBulkAllotment from "./TestBulkAllotment";
import {
  ALLOT_TEST_URL,
  FIND_TEST_URL,
  FIND_TRAINEE_URL,
} from "../../constants/apiConstants";

import Sidebar from "./Sidebar";
import ShowScoresConfirmation from "./ShowScoresConfirmation";

const TestAllotment = () => {
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [testList, setTestList] = useState([]);

  const [errorRows, setErrorRows] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStatus, setPopupStatus] = useState("");
  const [activeTab, setActiveTab] = useState("testAllot");
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [masterShowScores, setMasterShowScores] = useState("disabled");
  const [masterShowDetailedScores, setMasterShowDetailedScores] = useState("disabled");

  const [rows, setRows] = useState([
    {
      emailId: "",
      testId: "",
      startDate: "",
      endDate: "",
      showScores: "disabled",
      showDetailedScores: "disabled",
    },
  ]);
  


  // Custom styles for React Select to match the design of original select fields
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      border: '1px solid #ccc',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #888',
      },
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      position: 'absolute',
      width: '100%',
      marginTop: '4px',
      overflow: 'visible'
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '200px'
    })
  };

  const customSelectClassName = {
    container: (state) => `${styles.reactSelectContainer}`,
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


  
  const fetchUserList = async () => {
    try {
      const userData = getUserData();
      if (!userData.user || !userData.token) {
        console.error("Missing user data or token");
        return;
      }

      const response = await axios.post(`${FIND_TRAINEE_URL}`, {
        user: userData.user,
        token: userData.token,
      });

      if (response.data && response.data.payload) {
        setUserList(response.data.payload);
      } else {
        setUserList([]);
      }
    } catch (error) {
      console.error("Error fetching user list:", error);
      setUserList([]);
    }
  };

  const fetchTestList = async () => {
    try {
      const userData = getUserData();
      if (!userData.user || !userData.token) {
        console.error("Missing user data or token");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(`${FIND_TEST_URL}`, {
        user: userData.user,
        token: userData.token,
      });

      if (response.data && response.data.payload) {
        setTestList(response.data.payload);
      } else {
        setTestList([]);
      }
    } catch (error) {
      console.error("Error fetching test list:", error);
      setTestList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserList();
    fetchTestList();
  }, []);

  const initiateUpdate = () => {
    const validRows = rows.filter(
      (row) => row.emailId && row.testId && row.startDate && row.endDate
    );

    if (validRows.length === 0) {
      setPopupStatus("Please fill in all fields for at least one row.");
      setShowPopup(true);
      return;
    }

    handleConfirmUpdate();
  };

  const handleConfirmUpdate = async () => {
    try {
      const userData = getUserData();
      if (!userData.user || !userData.token) {
        setPopupStatus("You need to be logged in to perform this action.");
        setShowPopup(true);
        return;
      }

      const validRows = rows.filter(
        (row) => row.emailId && row.testId && row.startDate && row.endDate
      );

      // Create the proper request structure to match ApiRequestModelTest
      const requestData = {
        user: userData.user,
        token: userData.token,
        testAllotmentList: validRows.map((row) => ({
          emailId: row.emailId,
          testId: parseInt(row.testId),
          startDate: row.startDate, // yyyy-mm-dd format
          endDate: row.endDate, // yyyy-mm-dd format
          showScores: row.showScores,
          showDetailedScores: row.showDetailedScores
        })),
      };

      await axios.post(`${ALLOT_TEST_URL}`, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      setPopupStatus("Success! Tests have been allotted.");
      setRows([{ emailId: "", testId: "", startDate: "", endDate: "" }]);
      setShowPopup(true);
    } catch (error) {
      console.error("Error updating tests:", error);
      setPopupStatus("Error updating tests. Please try again.");
      setShowPopup(true);
    } finally {
    }
  };


  const addRow = () => {
    setRows([
      ...rows,
      {
        emailId: "",
        testId: "",
        startDate: "",
        endDate: "",
        showScores: masterShowScores,
        showDetailedScores: masterShowDetailedScores,
      },
    ]);
  };
  

  const deleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setRows(updatedRows);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const toggleBulkUploadModal = () => {
    setShowBulkUploadModal(!showBulkUploadModal);
  };

  const handleToggleChange = (index, field) => {
    const updatedRows = [...rows];
    updatedRows[index][field] =
      updatedRows[index][field] === "enabled" ? "disabled" : "enabled";
    setRows(updatedRows);
  };
  
  const handleMasterToggle = (field, value) => {
    if (field === "showScores") setMasterShowScores(value);
    if (field === "showDetailedScores") setMasterShowDetailedScores(value);
  
    const updatedRows = rows.map((row) => ({
      ...row,
      [field]: value,
    }));
    setRows(updatedRows);
  };
  

  const handleBulkUploadSuccess = () => {
    setShowBulkUploadModal(false);
    setPopupStatus("Success! Tests have been bulk allotted.");
    setShowPopup(true);
  };

  // Transform user list and test list into options format for React Select
  const userOptions = userList.map(user => ({
    value: user.emailId,
    label: user.name
  }));
  
  const testOptions = testList.map(test => ({
    value: test.testId.toString(),
    label: test.testName
  }));


 

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} />

      <div className={styles.dashboardContent}>
        <div className={styles.mainContent}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Test Allotment</h1>
          </header>

          <div className={styles.cardLayout}>
            {isLoading ? (
              <div className={styles.loadingState}>Loading test data...</div>
            ) : testList && testList.length > 0 ? (
              <div className={styles.contentWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Test</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                </table>

                <div className={styles.tableScrollContainer}>
                <table className={styles.dataTable}>
  <thead>
    <tr>
      <th>Employee</th>
      <th>Test</th>
      <th>Start Date</th>
      <th>End Date</th>
      <th>
        Show Scores <br />
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={masterShowScores === "enabled"}
            onChange={() =>
              handleMasterToggle(
                "showScores",
                masterShowScores === "enabled" ? "disabled" : "enabled"
              )
            }
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
            onChange={() =>
              handleMasterToggle(
                "showDetailedScores",
                masterShowDetailedScores === "enabled" ? "disabled" : "enabled"
              )
            }
          />
          <span className={styles.slider}></span>
        </label>
      </th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    {rows.map((row, index) => (
      <tr
        key={index}
        className={errorRows.includes(index) ? styles.errorRow : ""}
      >
        <td>
          <div className={styles.selectFieldContainer}>
            <Select
              options={userOptions}
              value={
                userOptions.find((option) => option.value === row.emailId) ||
                null
              }
              onChange={(selectedOption) =>
                handleRowChange(index, "emailId", selectedOption ? selectedOption.value : "")
              }
              placeholder="Select Employee"
              isClearable
              isSearchable
              styles={selectStyles}
              menuPortalTarget={document.body}
              classNamePrefix="react-select"
              className={styles.reactSelect}
            />
          </div>
        </td>
        <td>
          <div className={styles.selectFieldContainer}>
            <Select
              options={testOptions}
              value={
                testOptions.find((option) => option.value === row.testId) ||
                null
              }
              onChange={(selectedOption) =>
                handleRowChange(index, "testId", selectedOption ? selectedOption.value : "")
              }
              placeholder="Select Test"
              isClearable
              isSearchable
              styles={selectStyles}
              menuPortalTarget={document.body}
              classNamePrefix="react-select"
              className={styles.reactSelect}
            />
          </div>
        </td>
        <td>
          <input
            type="date"
            className={styles.dateField}
            value={row.startDate}
            onChange={(e) =>
              handleRowChange(index, "startDate", e.target.value)
            }
          />
        </td>
        <td>
          <input
            type="date"
            className={styles.dateField}
            value={row.endDate}
            onChange={(e) =>
              handleRowChange(index, "endDate", e.target.value)
            }
          />
        </td>
        <td>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={row.showScores === "enabled"}
              onChange={() => handleToggleChange(index, "showScores")}
            />
            <span className={styles.slider}></span>
          </label>
        </td>
        <td>
          <label className={styles.toggleSwitch}>
            <input
              type="checkbox"
              checked={row.showDetailedScores === "enabled"}
              onChange={() => handleToggleChange(index, "showDetailedScores")}
            />
            <span className={styles.slider}></span>
          </label>
        </td>
        <td>
          <button
            className={styles.deleteButton}
            onClick={() => deleteRow(index)}
            disabled={rows.length === 1}
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

                </div>

                <div className={styles.buttonGroup}>
                  <button className={styles.addButton} onClick={addRow}>
                    Add
                  </button>
                  <button
                    className={styles.updateButton}
                    onClick={initiateUpdate}
                  >
                    Save Changes
                  </button>
                  <button
                    className={styles.bulkButton}
                    onClick={toggleBulkUploadModal}
                  >
                    Bulk Upload
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.noData}>
                <p>No approved tests available for allotment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Popup */}
      {showPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <p>{popupStatus}</p>
            <button className={styles.closeButton} onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}

      
      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Bulk Test Allotment</h2>
              <button
                className={styles.modalCloseButton}
                onClick={toggleBulkUploadModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <TestBulkAllotment onUploadSuccess={handleBulkUploadSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAllotment;
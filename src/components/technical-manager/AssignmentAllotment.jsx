import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import styles from "./AssignmentAllotment.module.css";
import Sidebar from "./Sidebar";

import {
  ALLOT_ASSIGNMENT_URL,
  VIEW_TRAINEE_ASSIGNMENT_URL,
  FIND_TRAINEE_URL,
} from "../../constants/apiConstants";

const AssignmentAllotment = () => {
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [assignmentList, setAssignmentList] = useState([]);
  const [rows, setRows] = useState([{ 
    emailId: "", 
    assignmentId: "", 
    startDate: "", 
    endDate: "" 
  }]);
  const [errorRows, setErrorRows] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStatus, setPopupStatus] = useState("");
  const [activeTab, setActiveTab] = useState("allot");
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  // Custom styles for React Select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      border: '1px solid #ccc',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #888',
      },
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
    const fetchUserList = async () => {
      try {
        const userData = getUserData();
        const response = await axios.post(`${FIND_TRAINEE_URL}`, {
          user: userData.user,
          token: userData.token,
        });
        setUserList(response.data.payload);
      } catch (error) {
        console.error("Error fetching user list:", error);
      }
    };
    fetchUserList();
  }, []);

  useEffect(() => {
    const fetchAssignmentList = async () => {
      try {
        const {user, token} = getUserData();
        const response = await axios.post(`${VIEW_TRAINEE_ASSIGNMENT_URL}`, {
          user,
          token,
        });
        setAssignmentList(response.data.payload);
      } catch (error) {
        console.error("Error fetching assignment list:", error);
      }
    };
    fetchAssignmentList();
  }, []);

  // Format date for API (converts to ISO string for backend)
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString();
  };

  // Validate date range
  const validateDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return true; // Allow empty dates
    return new Date(startDate) <= new Date(endDate);
  };

  const handleUpdate = async () => {
    try {
      const userData = getUserData();

      // Check if there are no assignments available
      if (assignmentList.length === 0) {
        setPopupStatus("Error: No assignment available for allotment.");
        setShowPopup(true);
        return;
      }

      // Remove any rows with empty required fields
      const validRows = rows.filter((row) => row.emailId && row.assignmentId);

      if (validRows.length === 0) {
        setPopupStatus(
          "Please select both employee and assignment for at least one row."
        );
        setShowPopup(true);
        return;
      }

      // Validate date ranges
      const invalidDateRows = validRows.filter(row => 
        (row.startDate && row.endDate && !validateDateRange(row.startDate, row.endDate))
      );

      if (invalidDateRows.length > 0) {
        setPopupStatus("Error: Start date cannot be later than end date.");
        setShowPopup(true);
        return;
      }

      // Transform data to match backend model
      const assignmentAllotmentList = validRows.map(row => ({
        assignmentId: parseInt(row.assignmentId),
        emailId: row.emailId,
        startDate: formatDateForAPI(row.startDate),
        endDate: formatDateForAPI(row.endDate)
      }));

      const response = await axios.post(
        `${ALLOT_ASSIGNMENT_URL}`,
        {
          user: userData.user,
          token: userData.token,
          assignmentAllotmentList: assignmentAllotmentList,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data && (response.data.response === "success")) {
        setPopupStatus("Success! Assignments have been allotted.");
        setRows([{ emailId: "", assignmentId: "", startDate: "", endDate: "" }]); // Reset rows
        setShowPopup(true);
      }
      else {
        // Handle failed response
        setPopupStatus("Failed to allot assignment. Please try again.");
        setShowPopup(true);
        console.error("Failed to allot assignment:", response.data);
      }
      
    } catch (error) {
      console.error("Error updating assignment:", error);
      setPopupStatus("Error updating assignment. Please try again.");
      setShowPopup(true);
    }
  };

  const addRow = () => {
    setRows([...rows, { emailId: "", assignmentId: "", startDate: "", endDate: "" }]);
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

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Transform user list and assignment list into options format for React Select
  const userOptions = (userList || []).map(user => ({
    value: user.emailId,
    label: user.name
  }));
  
  const assignmentOptions = (assignmentList || []).map(assignment => ({
    value: assignment.assignmentId,
    label: assignment.description
  }));

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} />

      <div className={styles.mainContent}>
        <header className={styles.pageHeader}>
          <h1>Assignment Allotment</h1>
        </header>

        <div className={styles.tableContainer}>
          {assignmentList && assignmentList.length > 0 ? (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Assignment</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th className={styles.actionColumn}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={index}
                        className={
                          errorRows.includes(index) ? styles.errorRow : ""
                        }
                      >
                        <td className={styles.formField}>
                          <Select
                            options={userOptions}
                            value={userOptions.find(option => option.value === row.emailId) || null}
                            onChange={(selectedOption) => 
                              handleRowChange(index, "emailId", selectedOption ? selectedOption.value : "")
                            }
                            placeholder="Select Employee"
                            isClearable
                            isSearchable
                            styles={selectStyles}
                            menuPortalTarget={document.body}
                            className={styles.reactSelect}
                          />
                        </td>
                        <td className={styles.formField}>
                          <Select
                            options={assignmentOptions}
                            value={assignmentOptions.find(option => option.value === row.assignmentId) || null}
                            onChange={(selectedOption) => 
                              handleRowChange(index, "assignmentId", selectedOption ? selectedOption.value : "")
                            }
                            placeholder="Select Assignment"
                            isClearable
                            isSearchable
                            styles={selectStyles}
                            menuPortalTarget={document.body}
                            className={styles.reactSelect}
                          />
                        </td>
                        <td className={styles.formField}>
                          <input
                            type="date"
                            value={row.startDate}
                            onChange={(e) => handleRowChange(index, "startDate", e.target.value)}
                            className={styles.dateInput}
                            min={getTodayDate()}
                          />
                        </td>
                        <td className={styles.formField}>
                          <input
                            type="date"
                            value={row.endDate}
                            onChange={(e) => handleRowChange(index, "endDate", e.target.value)}
                            className={styles.dateInput}
                            min={row.startDate || getTodayDate()}
                          />
                        </td>
                        <td className={styles.actionColumn}>
                          <button
                            onClick={() => deleteRow(index)}
                            className={styles.deleteButton}
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
                <button onClick={addRow} className={styles.addButton}>
                  Add
                </button>
                <button onClick={handleUpdate} className={styles.updateButton}>
                  Save Changes
                </button>
                <button
                  onClick={toggleBulkUploadModal}
                  className={styles.uploadButton}
                >
                  Bulk Upload
                </button>
              </div>
            </>
          ) : (
            <p className={styles.errorMessage}>
              No approved assignment available for allotment.
            </p>
          )}
        </div>

        {/* Notification Popup */}
        {showPopup && (
          <div className={styles.popup}>
            <div className={styles.popupContent}>
              <p>{popupStatus}</p>
              <button onClick={closePopup} className={styles.closeButton}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Bulk Assignment Allotment</h2>
                <button
                  onClick={toggleBulkUploadModal}
                  className={styles.modalCloseButton}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentAllotment;
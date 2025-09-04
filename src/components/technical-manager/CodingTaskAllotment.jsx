import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import styles from "./CodingTaskAllotment.module.css";
import {
  VIEW_CODING_TASK_URL,
  ALLOT_CODING_TASK_URL,
  FIND_TRAINEE_URL,
} from "../../constants/apiConstants";
import Sidebar from "./Sidebar";

const CodingTaskAllotment = () => {
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [codingTaskList, setCodingTaskList] = useState([]);
  const [errorRows, setErrorRows] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStatus, setPopupStatus] = useState("");
  const [activeTab, setActiveTab] = useState("codingTaskAllot");
  const [isLoading, setIsLoading] = useState(true);

  const [rows, setRows] = useState([
    {
      emailId: "",
      taskId: "",
    },
  ]);

  // Custom styles for React Select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      border: "1px solid #ccc",
      boxShadow: "none",
      "&:hover": {
        border: "1px solid #888",
      },
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      position: "absolute",
      width: "100%",
      marginTop: "4px",
      overflow: "visible",
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: "200px",
    }),
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

  const fetchCodingTaskList = async () => {
    try {
      const userData = getUserData();
      if (!userData.user || !userData.token) {
        console.error("Missing user data or token");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(`${VIEW_CODING_TASK_URL}`, {
        user: userData.user,
        token: userData.token,
      });

      if (response.data && response.data.payload) {
        setCodingTaskList(response.data.payload);
      } else {
        setCodingTaskList([]);
      }
    } catch (error) {
      console.error("Error fetching coding task list:", error);
      setCodingTaskList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserList();
    fetchCodingTaskList();
  }, []);

  const initiateUpdate = () => {
    const validRows = rows.filter(
      (row) => row.emailId && row.taskId
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
        (row) => row.emailId && row.emailId.trim() !== "" && 
                 row.taskId && row.taskId.trim() !== ""
      );

      // Create the proper request structure
      const requestData = {
        user: userData.user,
        token: userData.token,
        codingTestAllotmentList: validRows.map((row) => ({
          emailId: row.emailId,
          taskId: parseInt(row.taskId),
        })),
      };

      const response = await axios.post(`${ALLOT_CODING_TASK_URL}`, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      if (
        response.data &&
        (response.data.response === "success")
      ) {
        setPopupStatus("Success! Coding tasks have been allotted.");
        setRows([{ emailId: "", taskId: "" }]);
        setShowPopup(true);
      } else {
        setPopupStatus("Failed to allot coding tasks. Please try again.");
        setShowPopup(true);
        console.error("Failed to allot coding task:", response.data);
      }
    } catch (error) {
      console.error("Error updating coding tasks:", error);
      setPopupStatus("Error updating coding tasks. Please try again.");
      setShowPopup(true);
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        emailId: "",
        taskId: "",
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

  // Transform user list and coding task list into options format for React Select
  const userOptions = userList.map((user) => ({
    value: user.emailId,
    label: user.name,
  }));

  const codingTaskOptions = codingTaskList.map((task) => ({
    value: task.taskId?.toString() || task.id?.toString(),
    label: task.codingTaskName || task.taskName || task.name,
  }));

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} />

      <div className={styles.dashboardContent}>
        <div className={styles.mainContent}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Coding Task Allotment</h1>
          </header>

          <div className={styles.cardLayout}>
            {isLoading ? (
              <div className={styles.loadingState}>Loading coding task data...</div>
            ) : codingTaskList && codingTaskList.length > 0 ? (
              <div className={styles.contentWrapper}>
                <div className={styles.tableScrollContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Coding Task</th>
                        <th>Action</th>
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
                          <td>
                            <div className={styles.selectFieldContainer}>
                              <Select
                                options={userOptions}
                                value={
                                  userOptions.find(
                                    (option) => option.value === row.emailId
                                  ) || null
                                }
                                onChange={(selectedOption) =>
                                  handleRowChange(
                                    index,
                                    "emailId",
                                    selectedOption ? selectedOption.value : ""
                                  )
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
                                options={codingTaskOptions}
                                value={
                                  codingTaskOptions.find(
                                    (option) => option.value === row.taskId
                                  ) || null
                                }
                                onChange={(selectedOption) =>
                                  handleRowChange(
                                    index,
                                    "taskId",
                                    selectedOption ? selectedOption.value : ""
                                  )
                                }
                                placeholder="Select Coding Task"
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
                </div>
              </div>
            ) : (
              <div className={styles.noData}>
                <p>No coding tasks available for allotment.</p>
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
    </div>
  );
};

export default CodingTaskAllotment;
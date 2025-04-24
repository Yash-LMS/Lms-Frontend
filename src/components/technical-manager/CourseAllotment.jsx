import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import styles from "./CourseAllotment.module.css";
import CourseBulkAllotment from "./CourseBulkAllotment";
import Sidebar from "./Sidebar";

import {
  ALLOT_COURSE_URL,
  FIND_COURSE_URL,
  FIND_TRAINEE_URL,
} from "../../constants/apiConstants";

const CourseAllotment = () => {
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [rows, setRows] = useState([{ emailId: "", courseId: "" }]);
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
    const fetchCourseList = async () => {
      try {
        const userData = getUserData();
        const response = await axios.post(`${FIND_COURSE_URL}`, {
          user: userData.user,
          token: userData.token,
        });
        setCourseList(response.data.payload);
      } catch (error) {
        console.error("Error fetching course list:", error);
      }
    };
    fetchCourseList();
  }, []);

  const handleUpdate = async () => {
    try {
      const userData = getUserData();

      // Check if there are no courses available
      if (courseList.length === 0) {
        setPopupStatus("Error: No courses available for allotment.");
        setShowPopup(true);
        return;
      }

      // Remove any rows with empty fields
      const validRows = rows.filter((row) => row.emailId && row.courseId);

      if (validRows.length === 0) {
        setPopupStatus(
          "Please select both employee and course for at least one row."
        );
        setShowPopup(true);
        return;
      }

      await axios.post(
        `${ALLOT_COURSE_URL}`,
        {
          user: userData.user,
          token: userData.token,
          allotmentList: validRows,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // Always show success message and reset rows
      setPopupStatus("Success! Courses have been allotted.");
      setRows([{ emailId: "", courseId: "" }]); // Reset rows
      setShowPopup(true);
    } catch (error) {
      console.error("Error updating courses:", error);
      setPopupStatus("Error updating courses. Please try again.");
      setShowPopup(true);
    }
  };

  const addRow = () => {
    setRows([...rows, { emailId: "", courseId: "" }]);
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

  // Transform user list and course list into options format for React Select
  const userOptions = (userList || []).map(user => ({
    value: user.emailId,
    label: user.name
  }));
  
  const courseOptions = (courseList || []).map(course => ({
    value: course.courseId,
    label: course.courseName
  }));

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} />

      <div className={styles.mainContent}>
        <header className={styles.pageHeader}>
          <h1>Course Allotment</h1>
        </header>

        <div className={styles.tableContainer}>
          {courseList && courseList.length > 0 ? (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Course</th>
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
                            options={courseOptions}
                            value={courseOptions.find(option => option.value === row.courseId) || null}
                            onChange={(selectedOption) => 
                              handleRowChange(index, "courseId", selectedOption ? selectedOption.value : "")
                            }
                            placeholder="Select Course"
                            isClearable
                            isSearchable
                            styles={selectStyles}
                            menuPortalTarget={document.body}
                            className={styles.reactSelect}
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
              No approved courses available for allotment.
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
                <h2>Bulk Course Allotment</h2>
                <button
                  onClick={toggleBulkUploadModal}
                  className={styles.modalCloseButton}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <CourseBulkAllotment />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseAllotment;
import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import styles from "./CourseBulkAllotment.module.css";
import { ALLOT_COURSE_URL, FIND_COURSE_URL, FIND_EMPLOYEE_INFO_URL } from "../../constants/apiConstants";

const CourseBulkAllotment = () => {
  const [file, setFile] = useState(null);
  const [courseList, setCourseList] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [userTable, setUserTable] = useState([]);
  const [message, setMessage] = useState({ show: false, type: "", text: "" });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const userData = getUserData();
        const response = await axios.post(FIND_COURSE_URL, {
          user: userData.user,
          token: userData.token,
        });
        setCourseList(response.data.payload);
      } catch (error) {
        console.error("Error fetching courses:", error);
        showMessage("error", "Failed to fetch courses. Please try again.");
      }
    };
    fetchCourses();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    // Auto hide after 5 seconds
    setTimeout(() => {
      setMessage({ show: false, type: "", text: "" });
    }, 5000);
  };

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null };
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selectedCourseId) {
      showMessage("error", "Please select a file and a course.");
      return;
    }

    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = async (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (!data || data.length < 2) {
        showMessage("error", "Invalid file. Ensure it contains email IDs.");
        return;
      }

      const emailList = data.slice(1).map((row) => row[0]);
      verifyEmails(emailList);
    };
  };

  const verifyEmails = async (emailList) => {
    const userData = getUserData();
    const verifiedUsers = [];

    for (let email of emailList) {
      try {
        const response = await axios.post(FIND_EMPLOYEE_INFO_URL, {
          user: userData.user,
          token: userData.token,
          emailId: email,
        });

        if (response.data.response === "success") {
          verifiedUsers.push({
            emailId: response.data.payload.emailId,
            name: response.data.payload.name,
            officeId: response.data.payload.officeId,
            courseId: selectedCourseId,
            courseName: courseList.find((c) => c.courseId === selectedCourseId)?.courseName || "",
            status: "Approved",
          });
        } else {
          verifiedUsers.push({
            emailId: email,
            name: "Not Found",
            officeId: "N/A",
            courseId: selectedCourseId,
            courseName: courseList.find((c) => c.courseId === selectedCourseId)?.courseName || "",
            status: "Not Found",
          });
        }
      } catch (error) {
        console.error(`Error verifying email ${email}:`, error);
      }
    }

    setUserTable(verifiedUsers);
    showMessage("success", `Verified ${emailList.length} emails. ${verifiedUsers.filter(u => u.status === "Approved").length} approved.`);
  };

  const handleAllotCourses = async () => {
    const userData = getUserData();
    const approvedUsers = userTable.filter((user) => user.status === "Approved");

    if (approvedUsers.length === 0) {
      showMessage("error", "No approved users to allot courses.");
      return;
    }

    try {
      await axios.post(ALLOT_COURSE_URL, {
        user: userData.user,
        token: userData.token,
        allotmentList: approvedUsers.map(({ emailId, courseId }) => ({ emailId, courseId })),
      });

      showMessage("success", "Courses successfully allotted.");
      setUserTable([]);
      if (typeof onUploadSuccess === 'function') {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Error allotting courses:", error);
      showMessage("error", "Failed to allot courses. Please try again.");
    }
  };

  // New function to download the Excel file
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ "Candidate Email ID": "" }]); // Create a sheet with the header
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Course_Bulk_Allotment_Template.xlsx"); // Download the file
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {message.show && (
          <div className={message.type === "success" ? styles.successMessage : styles.errorMessage}>
            {message.text}
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label>Select Course:</label>
          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
            <option value="">Select a Course</option>
            {courseList.map((course) => (
              <option key={course.courseId} value={course.courseId}>
                {course.courseName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload & Verify</button>
        </div>

        {/* New button to download the template */}
        <button onClick={handleDownloadTemplate} className={styles.downloadButton}>
          Download Template
        </button>

        {userTable.length > 0 && (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Email ID</th>
                    <th>Employee Name</th>
                    <th>Course ID</th>
                    <th>Course Name</th>
                    <th>Status</th>
                    <th>Office ID</th>
                  </tr>
                </thead>
                <tbody>
                  {userTable.map((user, index) => (
                    <tr key={index} className={user.status === "Approved" ? styles.approved : styles.notFound}>
                      <td>{index + 1}</td>
                      <td>{user.emailId}</td>
                      <td>{user.name}</td>
                      <td>{user.courseId}</td>
                      <td>{user.courseName}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${user.status === "Approved" ? styles.approvedBadge : styles.notFoundBadge}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.officeId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={handleAllotCourses} disabled={!userTable.some((user) => user.status === "Approved")}>
              Allot Courses
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseBulkAllotment;
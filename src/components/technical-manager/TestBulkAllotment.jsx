import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  ALLOT_TEST_URL,
  FIND_TEST_URL,
  FIND_EMPLOYEE_INFO_URL,
} from "../../constants/apiConstants";
import styles from "./TestBulkAllotment.module.css";

const TestBulkAllotment = () => {
  const [file, setFile] = useState(null);
  const [testList, setTestList] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [userTable, setUserTable] = useState([]);
  const [message, setMessage] = useState({ show: false, type: "", text: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTestList();
  }, []);

  const fetchTestList = async () => {
    try {
      const userData = getUserData();
      const response = await axios.post(FIND_TEST_URL, {
        user: userData.user,
        token: userData.token,
      });
      setTestList(response.data.payload);
    } catch (error) {
      console.error("Error fetching tests:", error);
      showMessage("error", "Failed to fetch tests.");
    }
  };

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
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

  // Format date to dd-mm-yyyy
  const formatToDisplayDate = (dateStr) => {
    if (!dateStr) return "";

    // Handle various formats that might come from Excel or inputs
    let date;

    // If it's already in dd-mm-yyyy format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    // Try to parse as Date object
    try {
      // Handle m/d/yy format
      if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split("/");
        date = new Date(`20${year}`, month - 1, day);
      }
      // Handle other date formats
      else {
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) throw new Error("Invalid date");

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      console.error("Error parsing date:", e, dateStr);
      return dateStr; // Return original if parsing fails
    }
  };

  // Format date from dd-mm-yyyy to yyyy-mm-dd for HTML date input
  const formatToHtmlDate = (dateStr) => {
    if (!dateStr || !isValidDateFormat(dateStr)) return "";

    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  };

  // Format date from yyyy-mm-dd (HTML date input) to dd-mm-yyyy
  const formatFromHtmlDate = (htmlDateStr) => {
    if (!htmlDateStr) return "";

    const [year, month, day] = htmlDateStr.split("-");
    return `${day}-${month}-${year}`;
  };

  // Validate dd-mm-yyyy format and date validity
  const isValidDateFormat = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return false;

    // Check for dd-mm-yyyy format
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!dateRegex.test(dateStr)) return false;

    // Extract parts and validate
    const [, day, month, year] = dateStr.match(dateRegex);
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Basic validation
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1) return false;

    // Days in month validation
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum > daysInMonth) return false;

    return true;
  };

  // Parse Excel date values to dd-mm-yyyy format
  const parseExcelDate = (value) => {
    if (!value) return "";

    // Check if value is a Date object (Excel might convert it)
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, "0");
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const year = value.getFullYear();
      return `${day}-${month}-${year}`;
    }

    // Handle string dates already in dd-mm-yyyy format
    if (typeof value === "string") {
      // If already in dd-mm-yyyy format
      if (isValidDateFormat(value)) {
        return value;
      }

      // Try to convert other string formats to dd-mm-yyyy
      return formatToDisplayDate(value);
    }

    // Handle Excel serial date numbers
    if (typeof value === "number") {
      const excelDate = XLSX.SSF.parse_date_code(value);
      const day = String(excelDate.d).padStart(2, "0");
      const month = String(excelDate.m).padStart(2, "0");
      const year = excelDate.y;
      return `${day}-${month}-${year}`;
    }

    return String(value); // Return as is if we can't parse
  };

  const handleDeleteRow = (index) => {
    const updatedUserTable = userTable.filter((_, i) => i !== index);
    setUserTable(updatedUserTable);
  };

  const handleUpload = async () => {
    if (!file) {
      showMessage("error", "Please select an Excel file.");
      return;
    }

    if (!selectedTestId) {
      showMessage("error", "Please select a test first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];

        // Configure XLSX to handle dates as strings
        const sheet = workbook.Sheets[sheetName];

        // Get all cell references
        const range = XLSX.utils.decode_range(sheet["!ref"]);

        // Force string type for date cells
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_ref = XLSX.utils.encode_cell({ r: R, c: C });
            if (!sheet[cell_ref]) continue;

            // Set raw = true to get unparsed values
            sheet[cell_ref].z = "@";
          }
        }

        // Get JSON with raw values
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
          dateNF: "dd-mm-yyyy",
        });

        console.log("Raw Excel data:", jsonData);

        // Get selected test name
        const selectedTest = testList.find(
          (test) => test.testId === selectedTestId
        );

        let updatedUserTable = await Promise.all(
          jsonData.map(async (row) => {
            const email = row["Candidate Email ID"];

            // Process dates with our custom function
            let startDate = parseExcelDate(row["Start Date (dd-mm-yyyy)"]);
            let endDate = parseExcelDate(row["End Date (dd-mm-yyyy)"]);

            // Debug
            console.log("Processed dates:", { email, startDate, endDate });

            let name = "";
            let officeId = "";
            let status = "Not Found";

            // Verify Email from Backend
            try {
              const userData = getUserData();
              const response = await axios.post(FIND_EMPLOYEE_INFO_URL, {
                user: userData.user,
                token: userData.token,
                emailId: email,
              });

              if (
                response.data.response === "success" &&
                response.data.payload
              ) {
                name = response.data.payload.name;
                officeId = response.data.payload.officeId;
                status = "Verified";
              }
            } catch (error) {
              console.warn(`Email not found: ${email}`);
            }

            // Validate dates
            const startDateValid = isValidDateFormat(startDate);
            const endDateValid = isValidDateFormat(endDate);

            if (status === "Verified") {
              status =
                startDateValid && endDateValid ? "Verified" : "Incorrect Date";
            }

            return {
              emailId: email,
              name: name,
              officeId: officeId,
              startDate: startDate,
              endDate: endDate,
              startDateValid: startDateValid,
              endDateValid: endDateValid,
              status: status,
              editable: true, // Always allow editing for better user experience
            };
          })
        );

        setUserTable(updatedUserTable);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        showMessage(
          "error",
          "Failed to process the Excel file. Please check the format."
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadFormat = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        "Candidate Email ID": "",
        "Start Date (dd-mm-yyyy)": "",
        "End Date (dd-mm-yyyy)": "",
      },
    ]);
  
    // Set column widths
    worksheet["!cols"] = [
      { width: 30 }, // Email column width
      { width: 20 }, // Start Date column width
      { width: 20 }, // End Date column width
    ];
  
    // Apply text format to date columns to prevent auto-conversion
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
  
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      // Start Date column (B)
      const startDateCell = `B${row + 1}`;
      if (!worksheet[startDateCell]) worksheet[startDateCell] = { t: "s", v: "" };
  
      // End Date column (C)
      const endDateCell = `C${row + 1}`;
      if (!worksheet[endDateCell]) worksheet[endDateCell] = { t: "s", v: "" };
    }
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Format");
    XLSX.writeFile(workbook, "TestBulkAllotment_Format.xlsx");
  };

  const handleDateChange = (index, field, value) => {
    const updatedTable = [...userTable];

    // For HTML date input (yyyy-mm-dd format)
    if (field === "htmlStartDate") {
      const formattedDate = formatFromHtmlDate(value);
      updatedTable[index].startDate = formattedDate;
      updatedTable[index].startDateValid = isValidDateFormat(formattedDate);
    } else if (field === "htmlEndDate") {
      const formattedDate = formatFromHtmlDate(value);
      updatedTable[index].endDate = formattedDate;
      updatedTable[index].endDateValid = isValidDateFormat(formattedDate);
    }
    // For text input (maintaining dd-mm-yyyy format)
    else if (field === "startDate") {
      updatedTable[index].startDate = value;
      updatedTable[index].startDateValid = isValidDateFormat(value);
    } else if (field === "endDate") {
      updatedTable[index].endDate = value;
      updatedTable[index].endDateValid = isValidDateFormat(value);
    }

    // Update status
    const allDatesValid =
      updatedTable[index].startDateValid && updatedTable[index].endDateValid;

    if (updatedTable[index].name) {
      // Only update status if the user was found
      updatedTable[index].status = allDatesValid
        ? "Verified"
        : "Incorrect Date";
    }

    setUserTable(updatedTable);
  };

  const handleSubmitAllotment = async () => {
    // Check if all records are verified
    const allVerified = userTable.every((user) => user.status === "Verified");

    if (!allVerified) {
      showMessage(
        "error",
        "Please correct all date formats before submitting."
      );
      return;
    }

    try {
      const userData = getUserData();
      const testAllotmentList = userTable.map((user) => {
        // Convert dd-mm-yyyy to yyyy-mm-dd
        const formatDate = (dateStr) => {
          if (!dateStr) return dateStr;
          const [day, month, year] = dateStr.split("-");
          return `${year}-${month}-${day}`;
        };

        return {
          emailId: user.emailId,
          testId: parseInt(selectedTestId),
          startDate: formatDate(user.startDate), // Convert to yyyy-mm-dd
          endDate: formatDate(user.endDate), // Convert to yyyy-mm-dd
        };
      });

      const response = await axios.post(ALLOT_TEST_URL, {
        user: userData.user,
        token: userData.token,
        testAllotmentList: testAllotmentList,
      });

      if (response.data.response === "success") {
        showMessage("success", "Test allotment completed successfully!");
        setUserTable([]);
        setFile(null);
      } else {
        showMessage("error", response.data.message || "Failed to allot tests.");
      }
    } catch (error) {
      console.error("Error submitting test allotments:", error);
      showMessage(
        "error",
        "An error occurred while submitting test allotments."
      );
    }
  };

  const handleClear = () => {
    // Reset file input using ref
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }

    setFile(null);
    setSelectedTestId("");
    setUserTable([]);
    setMessage({ show: false, type: "", text: "" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {message.show && (
          <div
            className={
              message.type === "success"
                ? styles.successMessage
                : styles.errorMessage
            }
          >
            {message.text}
          </div>
        )}

        <div className={styles.formGroup}>
          <label>Select Test:</label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
          >
            <option value="">Select a test</option>
            {testList.map((test) => (
              <option key={test.testId} value={test.testId}>
                {test.testName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Upload Excel File:</label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </div>

        <div className={styles.actionsContainer}>
          <button onClick={handleUpload}>Upload & Verify</button>
          <button onClick={handleDownloadFormat}>Download Format</button>
          <button onClick={handleClear}>Clear</button>
        </div>

        {userTable.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Email ID</th>
                  <th>Employee Name</th>
                  <th>Office ID</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {userTable.map((user, index) => (
                  <tr
                    key={index}
                    className={
                      user.status === "Verified"
                        ? styles.approved
                        : styles.notFound
                    }
                  >
                    <td>{index + 1}</td>
                    <td>{user.emailId}</td>
                    <td>{user.name || "-"}</td>
                    <td>{user.officeId || "-"}</td>
                    <td>
                      <input
                        type="date"
                        value={formatToHtmlDate(user.startDate)}
                        onChange={(e) =>
                          handleDateChange(
                            index,
                            "htmlStartDate",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={formatToHtmlDate(user.endDate)}
                        onChange={(e) =>
                          handleDateChange(index, "htmlEndDate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          user.status === "Verified"
                            ? styles.approvedBadge
                            : styles.notFoundBadge
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteRow(index)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {userTable.length > 0 && (
          <button
            className={styles.submitButton}
            onClick={handleSubmitAllotment}
            disabled={userTable.some((user) => user.status !== "Verified")}
          >
            Submit Allotment
          </button>
        )}
      </div>
    </div>
  );
};

export default TestBulkAllotment;

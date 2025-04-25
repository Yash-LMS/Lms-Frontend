import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import styles from "./InternBulkRegistration.module.css";
import { REGISTER_INTERN_URL } from "../../constants/apiConstants";

const InternBulkRegistration = ({ onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [userTable, setUserTable] = useState([]);
  const [message, setMessage] = useState({ show: false, type: "", text: "" });
  const [loading, setLoading] = useState(false);

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

  // Format date to dd/mm/yyyy
  const formatDate = (date) => {
    if (!date) return "";
    
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Format Excel date to dd/mm/yyyy
  const formatExcelDate = (excelDate) => {
    if (typeof excelDate !== 'number') return excelDate;
    
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return formatDate(date);
  };

  const handleUpload = async () => {
    if (!file) {
      showMessage("error", "Please select a file.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = async (event) => {
      try {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data || data.length < 1) {
          showMessage("error", "Invalid file format or empty file.");
          setLoading(false);
          return;
        }

        // Validate the data structure with all required fields
        const requiredFields = [
          "emailId", 
          "firstName", 
          "lastName", 
          "password", 
          "officeId", 
          "internshipProgram", 
          "contactNo", 
          "address", 
          "yearOfPassing", 
          "stream", 
          "institution", 
          "startDate", 
          "endDate"
        ];
        
        const missingFields = [];
        
        requiredFields.forEach(field => {
          if (!data[0].hasOwnProperty(field)) {
            missingFields.push(field);
          }
        });

        if (missingFields.length > 0) {
          showMessage("error", `Missing required fields: ${missingFields.join(", ")}`);
          setLoading(false);
          return;
        }

        // Process the data and prepare for validation display
        const processedData = data.map((row, index) => ({
          ...row,
          status: "Pending",
          id: index + 1  // Just for display purposes, not sent to backend
        }));

        setUserTable(processedData);
        setLoading(false);
        showMessage("success", `Successfully processed ${processedData.length} records.`);
      } catch (error) {
        console.error("Error processing file:", error);
        showMessage("error", "Failed to process the file. Please check the format.");
        setLoading(false);
      }
    };
  };

  const handleRegisterInterns = async () => {
    if (userTable.length === 0) {
      showMessage("error", "No interns to register.");
      return;
    }

    setLoading(true);
    try {
      const { user, token } = getUserData();

      // Format dates to dd/mm/yyyy and remove id
      const formattedData = userTable.map(intern => {
        // Destructure to remove id and status (not needed for backend)
        const { id, status, ...internData } = intern;
        
        // Format dates to dd/mm/yyyy
        if (typeof internData.startDate === 'number') {
          internData.startDate = formatExcelDate(internData.startDate);
        }
        
        if (typeof internData.endDate === 'number') {
          internData.endDate = formatExcelDate(internData.endDate);
        }

        // Check if yearOfPassing is in Excel number format and convert
        if (typeof internData.yearOfPassing === 'number' && internData.yearOfPassing < 9999) {
          internData.yearOfPassing = internData.yearOfPassing.toString();
        }
        
        return {
          ...internData,
        };
      });

      const response = await axios.post(REGISTER_INTERN_URL, {
        user,
        token,
        internList: formattedData
      });

      if (response.data && response.data.response === "success") {
        showMessage("success", "Interns successfully registered!");
        setUserTable([]);
        if (typeof onUploadSuccess === 'function') {
          onUploadSuccess();
        }
        // Close after a brief delay to show success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        showMessage("error", response.data?.message || "Failed to register interns.");
      }
    } catch (error) {
      console.error("Error registering interns:", error);
      showMessage("error", "Failed to register interns. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        "emailId": "",
        "firstName": "",
        "lastName": "",
        "password": "",
        "officeId": "",
        "internshipProgram": "",
        "contactNo": "",
        "address": "",
        "yearOfPassing": "",
        "stream": "",
        "institution": "",
        "startDate": "",
        "endDate": ""
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Intern_Bulk_Registration_Template.xlsx");
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Bulk Register Interns</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {message.show && (
          <div className={message.type === "success" ? styles.successMessage : styles.errorMessage}>
            {message.text}
          </div>
        )}
        
        <div className={styles.modalContent}>
          <p className={styles.instructions}>
            Upload an Excel file with intern details. The file should contain all required columns including emailId, firstName, 
            lastName, password, officeId, internshipProgram, contactNo, address, yearOfPassing, stream, institution, startDate (DD/MM/YYYY), and endDate (DD/MM/YYYY).
          </p>
          
          <div className={styles.fileUploadContainer}>
            <div className={styles.fileInputWrapper}>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange} 
                className={styles.fileInput}
              />
              <button 
                onClick={handleUpload} 
                className={styles.uploadButton}
                disabled={loading}
              >
                {loading ? "Processing..." : "Upload & Verify"}
              </button>
            </div>
            
            <button 
              onClick={handleDownloadTemplate} 
              className={styles.templateButton}
              disabled={loading}
            >
              Download Template
            </button>
          </div>

          {userTable.length > 0 && (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Email ID</th>
                      <th>Name</th>
                      <th>Office ID</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Institution</th>
                      <th>Stream</th>
                      <th>Program</th>
                      <th>YOP</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userTable.map((intern) => (
                      <tr key={intern.id}>
                        <td>{intern.id}</td>
                        <td>{intern.emailId}</td>
                        <td>{`${intern.firstName} ${intern.lastName}`}</td>
                        <td>{intern.officeId}</td>
                        <td>{intern.contactNo}</td>
                        <td>{intern.address}</td>
                        <td>{intern.institution}</td>
                        <td>{intern.stream}</td>
                        <td>{intern.internshipProgram}</td>
                        <td>{intern.yearOfPassing}</td>
                        <td>{typeof intern.startDate === 'number' 
                          ? formatExcelDate(intern.startDate)
                          : intern.startDate}
                        </td>
                        <td>{typeof intern.endDate === 'number'
                          ? formatExcelDate(intern.endDate) 
                          : intern.endDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelButton} 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  className={styles.submitButton} 
                  onClick={handleRegisterInterns}
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Register Interns"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternBulkRegistration;
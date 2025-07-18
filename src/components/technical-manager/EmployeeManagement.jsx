import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import JSZip from "jszip"; // You'll need to install this: npm install jszip
import {
  findEmployeeList,
  updateUserRoleAndStatus,
  findEmployeesCount,
} from "../../features/manager/managerActions";
import styles from "./EmployeeManagement.module.css";
import Sidebar from "./Sidebar";
import ExportToExcel from "../../assets/ExportToExcel";
import { 
  EMPLOYEE_PROFILE_IMAGE_URL,
  DOWNLOAD_RESUME_URL 
} from "../../constants/apiConstants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faCheckSquare, faSquare } from "@fortawesome/free-solid-svg-icons";

const EmployeeManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingResumes, setDownloadingResumes] = useState({});
  const [resumeAvailability, setResumeAvailability] = useState({});
  
  // New states for bulk operations
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState({ current: 0, total: 0 });
  
  const { employeeCount } = useSelector((state) => state.manager);

  // Function to get user data from sessionStorage
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

  // Employee list from Redux state
  const { users, loading: reduxLoading } = useSelector(
    (state) => state.manager
  );

  // State for filters
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("not_active");

  const roles = ["instructor", "technical_manager", "user"];

  // Status options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "not_active", label: "Not Active" },
    { value: "blocked", label: "Blocked" },
  ];

  // Function to check if resume exists
  const checkResumeAvailability = async (emailId) => {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      return false;
    }

    try {
      const response = await axios.post(
        DOWNLOAD_RESUME_URL,
        {
          user: user,
          token: token,
          emailId: emailId
        },
        {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      return response.status === 200;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      console.warn(`Could not check resume availability for ${emailId}:`, error.message);
      return true;
    }
  };

  // Function to download single resume (returns blob data)
  const downloadSingleResumeBlob = async (emailId, employeeName) => {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      throw new Error("Session expired. Please login again.");
    }

    try {
      const response = await axios.post(
        DOWNLOAD_RESUME_URL,
        {
          user: user,
          token: token,
          emailId: emailId
        },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        // Get filename from response headers or create default
        const contentDisposition = response.headers['content-disposition'];
        let filename = `${employeeName}_resume.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        } else {
          filename = `${employeeName.replace(/\s+/g, '_')}_resume.pdf`;
        }

        return {
          blob: response.data,
          filename: filename,
          success: true
        };
      }
    } catch (error) {
      console.error(`Error downloading resume for ${emailId}:`, error);
      return {
        blob: null,
        filename: null,
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  };

  // Function to download resume (original single download function)
  const downloadResume = async (emailId, employeeName) => {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      setError("Session expired. Please login again.");
      return;
    }

    setDownloadingResumes(prev => ({ ...prev, [emailId]: true }));

    try {
      const result = await downloadSingleResumeBlob(emailId, employeeName);
      
      if (result.success) {
        // Create blob URL and trigger download
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        console.log(`Resume downloaded successfully for ${emailId}`);
      } else {
        setError(`Failed to download resume for ${employeeName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      setError(`Error downloading resume for ${employeeName}: ${error.message}`);
    } finally {
      setDownloadingResumes(prev => ({ ...prev, [emailId]: false }));
    }
  };

  // Function to handle bulk resume download
  const downloadBulkResumes = async () => {
    if (selectedEmployees.size === 0) {
      setError("Please select at least one employee to download resumes.");
      return;
    }

    setBulkDownloading(true);
    setBulkDownloadProgress({ current: 0, total: selectedEmployees.size });

    const zip = new JSZip();
    const selectedUsers = filteredUsers.filter(user => selectedEmployees.has(user.emailId));
    const resumeFolder = zip.folder("Employee_Resumes");
    
    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    try {
      // Download resumes one by one using for loop
      for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i];
        const employeeName = user.name || `${user.firstName || ""} ${user.lastName || ""}`;
        
        setBulkDownloadProgress({ current: i + 1, total: selectedUsers.length });
        
        try {
          console.log(`Downloading resume ${i + 1}/${selectedUsers.length} for ${user.emailId}`);
          
          const result = await downloadSingleResumeBlob(user.emailId, employeeName);
          
          if (result.success) {
            // Add the resume to the ZIP file
            resumeFolder.file(result.filename, result.blob);
            successCount++;
            console.log(`Successfully added ${result.filename} to ZIP`);
          } else {
            failureCount++;
            failures.push({ email: user.emailId, name: employeeName, error: result.error });
            console.warn(`Failed to download resume for ${user.emailId}: ${result.error}`);
          }
        } catch (error) {
          failureCount++;
          failures.push({ email: user.emailId, name: employeeName, error: error.message });
          console.error(`Error processing resume for ${user.emailId}:`, error);
        }
        
        // Add a small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (successCount > 0) {
        // Generate and download the ZIP file
        console.log(`Generating ZIP file with ${successCount} resumes`);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        
        // Create download link for ZIP
        const url = window.URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Employee_Resumes_${new Date().toISOString().split('T')[0]}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        console.log(`ZIP file downloaded successfully with ${successCount} resumes`);
      }

      // Show summary message
      let message = `Bulk download completed. `;
      if (successCount > 0) {
        message += `Successfully downloaded ${successCount} resume(s). `;
      }
      if (failureCount > 0) {
        message += `Failed to download ${failureCount} resume(s). `;
        if (failures.length > 0) {
          message += `Failed employees: ${failures.map(f => f.name).join(', ')}`;
        }
      }
    
    } catch (error) {
      console.error('Error during bulk download:', error);
      setError(`Error during bulk download: ${error.message}`);
    } finally {
      setBulkDownloading(false);
      setBulkDownloadProgress({ current: 0, total: 0 });
      
    }
  };

  // Function to handle individual employee selection
  const handleEmployeeSelection = (emailId) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmployees(newSelected);
    
    // Update select all state
    setSelectAll(newSelected.size === filteredUsers.filter(user => user.role === "user" || user.role === "instructor").length);
  };

  // Function to handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees(new Set());
      setSelectAll(false);
    } else {
      const eligibleUsers = filteredUsers.filter(user => user.role === "user" || user.role === "instructor");
      setSelectedEmployees(new Set(eligibleUsers.map(user => user.emailId)));
      setSelectAll(true);
    }
  };

  // Function to clear all selections
  const clearAllSelections = () => {
    setSelectedEmployees(new Set());
    setSelectAll(false);
  };

  // Component for displaying employee profile image
  const EmployeeProfileImage = ({ emailId }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [showFullImage, setShowFullImage] = useState(false);

    useEffect(() => {
      const fetchImage = async () => {
        try {
          const { token } = getUserData();
          const response = await fetch(
            `${EMPLOYEE_PROFILE_IMAGE_URL}?emailId=${encodeURIComponent(emailId)}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const blob = await response.blob();
            const imageObjectUrl = URL.createObjectURL(blob);
            setImageUrl(imageObjectUrl);
            setImageError(false);
          } else {
            setImageError(true);
          }
        } catch (error) {
          console.error('Error fetching employee image:', error);
          setImageError(true);
        } finally {
          setImageLoading(false);
        }
      };

      if (emailId) {
        fetchImage();
      }

      return () => {
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }
      };
    }, [emailId]);

    if (imageLoading) {
      return (
        <div className={styles.profileImageContainer}>
          <div className={styles.profileImagePlaceholder}>
            <span className={styles.loadingText}>Loading...</span>
          </div>
        </div>
      );
    }

    if (imageError || !imageUrl) {
      return (
        <div className={styles.profileImageContainer}>
          <div className={styles.profileImagePlaceholder}>
            <span className={styles.placeholderText}>No Image</span>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.profileImageContainer}>
        <div
          className={styles.profileImageWrapper}
          onMouseEnter={() => setShowFullImage(true)}
          onMouseLeave={() => setShowFullImage(false)}
        >
          <img
            src={imageUrl}
            alt={`Profile of ${emailId}`}
            className={styles.profileImage}
            onError={() => setImageError(true)}
          />
          {showFullImage && (
            <div className={styles.fullImageOverlay}>
              <div className={styles.fullImageContainer}>
                <img
                  src={imageUrl}
                  alt={`Full profile of ${emailId}`}
                  className={styles.fullImage}
                  onError={() => setImageError(true)}
                />
                <div className={styles.fullImageInfo}>
                  <p className={styles.fullImageEmail}>{emailId}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Check resume availability for all users when component mounts or users change
  useEffect(() => {
    const checkAllResumes = async () => {
      if (users && users.length > 0) {
        const resumeChecks = {};
        
        const usersToCheck = users.filter(user => 
          (user.role === "user" || user.role === "instructor") && 
          user.employeeType !== "intern"
        );

        const promises = usersToCheck.map(async (user) => {
          const hasResume = await checkResumeAvailability(user.emailId);
          resumeChecks[user.emailId] = hasResume;
        });

        await Promise.all(promises);
        setResumeAvailability(resumeChecks);
      }
    };

    checkAllResumes();
  }, [users]);

  // Clear selections when filters change
  useEffect(() => {
    clearAllSelections();
  }, [roleFilter, statusFilter, searchTerm]);

  // Fetch user list on component mount and when filters change
  useEffect(() => {
    const { user, token } = getUserData();
    if (user && token) {
      setLoading(true);

      const payload = {
        user,
        token,
        role: roleFilter,
        status: statusFilter,
      };

      console.log("API Call Parameters:", payload);

      dispatch(findEmployeeList(payload))
        .unwrap()
        .then((response) => {
          console.log("API Response:", response);
          setLoading(false);
        })
        .catch((err) => {
          console.error("API Error:", err);
          setError(err.message || "Failed to fetch users");
          setLoading(false);
        });
    }
    fetchCounts();
  }, [dispatch, roleFilter, statusFilter]);

  // New function to fetch count
  const fetchCounts = async () => {
    const { user, token } = getUserData();
    if (user && token) {
      dispatch(findEmployeesCount({ user, token }));
    }
  };

  // Handle role change - using emailId as the primary identifier
  const handleRoleChange = (emailId, newRole) => {
    const { user, token } = getUserData();
    const userToUpdate = users.find((emp) => emp.emailId === emailId);

    if (!userToUpdate) {
      console.error(`User with email ${emailId} not found`);
      return;
    }

    if (userToUpdate.role === newRole) {
      console.log("No change in role detected. Skipping update.");
      return;
    }

    const userApproval = {
      emailId: emailId,
      role: newRole,
      status: userToUpdate.userStatus || userToUpdate.status,
    };

    console.log("Updating user role with payload:", {
      user,
      token,
      userApproval,
    });

    dispatch(
      updateUserRoleAndStatus({
        user,
        token,
        userApproval,
      })
    )
      .unwrap()
      .then((response) => {
        console.log("Role update response:", response);
        dispatch(
          findEmployeeList({
            user,
            token,
            role: roleFilter,
            status: statusFilter,
          })
        );
      })
      .catch((err) => {
        console.error("Role update error:", err);
        setError(err.message || "Failed to update role");
      });
  };

  // Handle status change - using emailId as the primary identifier
  const handleStatusChange = (emailId, newStatus) => {
    const { user, token } = getUserData();
    const userToUpdate = users.find((emp) => emp.emailId === emailId);

    if (!userToUpdate) {
      console.error(`User with email ${emailId} not found`);
      return;
    }

    const currentStatus = userToUpdate.userStatus || userToUpdate.status;
    if (currentStatus === newStatus) {
      console.log("No change in status detected. Skipping update.");
      return;
    }

    const userApproval = {
      emailId: emailId,
      status: newStatus,
      role: userToUpdate.role,
    };

    console.log("Updating user status with payload:", {
      user,
      token,
      userApproval,
    });

    dispatch(
      updateUserRoleAndStatus({
        user,
        token,
        userApproval,
      })
    )
      .unwrap()
      .then((response) => {
        console.log("Status update response:", response);
        dispatch(
          findEmployeeList({
            user,
            token,
            role: roleFilter,
            status: statusFilter,
          })
        );
      })
      .catch((err) => {
        console.error("Status update error:", err);
        setError(err.message || "Failed to update status");
      });
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Filter users based on search term and exclude interns
  const filteredUsers =
    users && users.length > 0
      ? users.filter((user) => {
          if (user.employeeType === "intern") {
            return false;
          }

          if (!searchTerm) {
            return true;
          }

          const searchTermLower = searchTerm.toLowerCase();
          const name =
            user.name || `${user.firstName || ""} ${user.lastName || ""}`;

          return (
            name.toLowerCase().includes(searchTermLower) ||
            user.emailId.toLowerCase().includes(searchTermLower) ||
            user.officeId?.toLowerCase().includes(searchTermLower) ||
            user.role.toLowerCase().includes(searchTermLower) ||
            user.status?.toLowerCase().includes(searchTermLower)
          );
        })
      : [];

  const isLoading = reduxLoading || loading;

  const [activeTab, setActiveTab] = useState("employee");

  const showProfileImageColumn = filteredUsers.some(user => user.role === "user");
  const showDownloadColumn = filteredUsers.some(user => user.role === "user" || user.role === "instructor");
  const showSelectionColumn = filteredUsers.some(user => user.role === "user" || user.role === "instructor");

  // Define Excel headers for employee management
  const excelHeaders = {
    firstName: "First Name",
    lastName: "Last Name",
    emailId: "Email ID",
    officeId: "Office ID",
    mobileNo: "Mobile No.",
    role: "Role",
    status: "User Status",
  };

  return (
    <div className={styles.container}>
      <Sidebar activeTab={activeTab} />

      <div className={styles.card}>
        <div className={styles.pageHeader}>
          <h1>Employee Management</h1>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Employees :</div>
            <div className={styles.statValue}>{employeeCount || 0}</div>
          </div>
          <div className={styles.searchField}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search employees..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button
                className={styles.clearSearchButton}
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filter by Role:</label>
            <select
              className={styles.select}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>

            <label className={styles.filterLabel}>Filter by Status:</label>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            {(roleFilter !== "all" || statusFilter !== "all") && (
              <button
                className={styles.clearFiltersButton}
                onClick={() => {
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        <div className={styles.searchResultCount}>
          Found <span>{filteredUsers.length}</span> results
          {selectedEmployees.size > 0 && (
            <span className={styles.selectedCount}>
              {" "}| Selected: {selectedEmployees.size}
            </span>
          )}
        </div>

        <div className={styles.headerActions}>
          <div className={styles.actionButtons}>
            <ExportToExcel
              data={filteredUsers}
              headers={excelHeaders}
              fileName="Employee-Management-Results"
              sheetName="Employees"
              buttonStyle={{
                marginRight: "10px",
              }}
            />
            
            {showSelectionColumn && (
              <div className={styles.bulkActions}>
                {selectedEmployees.size > 0 && (
                  <>
                    <button
                      className={styles.bulkDownloadButton}
                      onClick={downloadBulkResumes}
                      disabled={bulkDownloading}
                    >
                      {bulkDownloading ? (
                        <span>
                          <span className={styles.spinner}></span>
                          Downloading {bulkDownloadProgress.current}/{bulkDownloadProgress.total}...
                        </span>
                      ) : (
                        <span>
                          <FontAwesomeIcon icon={faDownload} /> Download Selected ({selectedEmployees.size})
                        </span>
                      )}
                    </button>
                    <button
                      className={styles.clearSelectionsButton}
                      onClick={clearAllSelections}
                      disabled={bulkDownloading}
                    >
                      Clear Selections
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.cardContent}>
          {isLoading ? (
            <div className={styles.loadingMessage}>Loading users...</div>
          ) : error ? (
            <div className={styles.errorMessage}>{error}</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {showSelectionColumn && (
                      <th>
                        <button
                          className={styles.selectAllButton}
                          onClick={handleSelectAll}
                          disabled={bulkDownloading}
                        >
                          <FontAwesomeIcon icon={selectAll ? faCheckSquare : faSquare} />
                          <span className={styles.selectAllText}>Select All</span>
                        </button>
                      </th>
                    )}
                    {showProfileImageColumn && <th>Profile</th>}
                    <th>Name</th>
                    <th>Email ID</th>
                    <th>Office ID</th>
                    <th>Mobile No.</th>
                    <th>Role</th>
                    <th>User Status</th>
                    <th>Action</th>
                    {showDownloadColumn && <th>Resume</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.emailId || Math.random()}>
                        {showSelectionColumn && (
                          <td>
                            {(user.role === "user" || user.role === "instructor") ? (
                              <button
                                className={styles.selectButton}
                                onClick={() => handleEmployeeSelection(user.emailId)}
                                disabled={bulkDownloading}
                              >
                                <FontAwesomeIcon 
                                  icon={selectedEmployees.has(user.emailId) ? faCheckSquare : faSquare} 
                                />
                              </button>
                            ) : (
                              <span className={styles.notApplicable}>N/A</span>
                            )}
                          </td>
                        )}
                        {showProfileImageColumn && (
                          <td>
                            {(user.role === "user" || user.role === "instructor") ? (
                              <EmployeeProfileImage emailId={user.emailId} />
                            ) : (
                              <div className={styles.profileImageContainer}>
                                <div className={styles.profileImagePlaceholder}>
                                  <span className={styles.placeholderText}>N/A</span>
                                </div>
                              </div>
                            )}
                          </td>
                        )}
                        <td>
                          {user.name ||
                            `${user.firstName || ""} ${user.lastName || ""}`}
                        </td>
                        <td>{user.emailId}</td>
                        <td>{user.officeId}</td>
                        <td>{user.mobileNo}</td>
                        <td>
                          <select
                            className={styles.tableSelect}
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.emailId, e.target.value)
                            }
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              (user.userStatus || user.status) === "active"
                                ? styles.statusActive
                                : (user.userStatus || user.status) === "blocked"
                                ? styles.statusBlocked
                                : styles.statusNotActive
                            }`}
                          >
                            {(user.userStatus || user.status) === "active"
                              ? "Active"
                              : (user.userStatus || user.status) === "blocked"
                              ? "Blocked"
                              : "Not Active"}
                          </span>
                        </td>
                        <td>
                          <select
                            className={styles.tableSelect}
                            value={user.userStatus || user.status}
                            onChange={(e) =>
                              handleStatusChange(user.emailId, e.target.value)
                            }
                          >
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        {showDownloadColumn && (
                          <td>
                            {(user.role === "user" || user.role === "instructor") ? (
                              <button
                                className={`${styles.downloadButton} ${
                                  resumeAvailability[user.emailId] === false ? styles.disabledButton : ''
                                }`}
                                onClick={() => downloadResume(
                                  user.emailId, 
                                  user.name || `${user.firstName || ""} ${user.lastName || ""}`
                                )}
                                disabled={
                                  downloadingResumes[user.emailId] || 
                                  resumeAvailability[user.emailId] === false ||
                                  bulkDownloading
                                }
                                title={
                                  resumeAvailability[user.emailId] === false 
                                    ? "Resume not available" 
                                    : `Download resume for ${user.name || user.firstName || user.emailId}`
                                }
                              >
                                {downloadingResumes[user.emailId] ? (
                                  <span className={styles.downloadingText}>
                                    <span className={styles.spinner}></span>
                                    Downloading...
                                  </span>
                                ) : resumeAvailability[user.emailId] === false ? (
                                  <span className={styles.noResumeText}>
                                    No Resume
                                  </span>
                                ) : (
                                  <span title="Download Submission">
                                    <FontAwesomeIcon icon={faDownload} />
                                  </span>
                                )}
                              </button>
                            ) : (
                              <span className={styles.notApplicable}>N/A</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={
                        (showSelectionColumn ? 1 : 0) + 
                        (showProfileImageColumn ? 1 : 0) + 
                        (showDownloadColumn ? 1 : 0) + 
                        8
                      } className={styles.emptyMessage}>
                        {searchTerm
                          ? "No results found. Try a different search term."
                          : "No users found with the selected filters. Try changing your filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagementPage;
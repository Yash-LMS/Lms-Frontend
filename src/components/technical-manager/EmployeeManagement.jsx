import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
import { faDownload } from "@fortawesome/free-solid-svg-icons";

const EmployeeManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingResumes, setDownloadingResumes] = useState({});
  const [resumeAvailability, setResumeAvailability] = useState({}); // New state to track resume availability
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
          method: 'HEAD', // Use HEAD request to check if file exists without downloading
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        }
      );

      return response.status === 200;
    } catch (error) {
      // If error is 404, resume doesn't exist
      if (error.response && error.response.status === 404) {
        return false;
      }
      // For other errors, assume resume might exist (to avoid false negatives due to network issues)
      console.warn(`Could not check resume availability for ${emailId}:`, error.message);
      return true;
    }
  };

  // Function to download resume
  const downloadResume = async (emailId, employeeName) => {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      setError("Session expired. Please login again.");
      return;
    }

    // Set loading state for this specific resume
    setDownloadingResumes(prev => ({ ...prev, [emailId]: true }));

    try {
      const response = await axios.post(
        DOWNLOAD_RESUME_URL,
        {
          user: user,
          token: token,
          emailId: emailId
        },
        {
          responseType: 'blob', // Important for file downloads
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        // Create blob URL and trigger download
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Try to get filename from response headers
        const contentDisposition = response.headers['content-disposition'];
        let filename = `${employeeName}_resume`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        } else {
          // Default filename with common extensions
          filename = `${employeeName.replace(/\s+/g, '_')}_resume.pdf`;
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        console.log(`Resume downloaded successfully for ${emailId}`);
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          setError("Unauthorized access. Please login again.");
        } else if (error.response.status === 404) {
          setError(`Resume not found for ${employeeName}`);
          // Update resume availability state
          setResumeAvailability(prev => ({ ...prev, [emailId]: false }));
        } else {
          setError(`Failed to download resume for ${employeeName}: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(`Error downloading resume for ${employeeName}: ${error.message}`);
      }
    } finally {
      // Clear loading state for this specific resume
      setDownloadingResumes(prev => ({ ...prev, [emailId]: false }));
    }
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

      // Cleanup function to revoke object URL
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
        
        // Only check for users with "user" or "instructor" roles
        const usersToCheck = users.filter(user => 
          (user.role === "user" || user.role === "instructor") && 
          user.employeeType !== "intern"
        );

        // Check resume availability for each user
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

  // Fetch user list on component mount and when filters change
  useEffect(() => {
    const { user, token } = getUserData();
    if (user && token) {
      setLoading(true);

      // Create a request payload object
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
          // First filter out interns
          if (user.employeeType === "intern") {
            return false;
          }

          // Then apply search term filtering
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

  // Check if any user has "user" role to determine if profile image column should be shown
  const showProfileImageColumn = filteredUsers.some(user => user.role === "user");

  // Check if any user has "user" or "instructor" role to determine if download column should be shown
  const showDownloadColumn = filteredUsers.some(user => user.role === "user" || user.role === "instructor");

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

            {/* Clear all filters button */}
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
        </div>

        <div className={styles.headerActions}>
          <ExportToExcel
            data={filteredUsers}
            headers={excelHeaders}
            fileName="Employee-Management-Results"
            sheetName="Employees"
            buttonStyle={{
              marginBottom: "20px",
            }}
          />
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
                                  resumeAvailability[user.emailId] === false
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
                      <td colSpan={showProfileImageColumn && showDownloadColumn ? 8 : showProfileImageColumn || showDownloadColumn ? 7 : 6} className={styles.emptyMessage}>
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
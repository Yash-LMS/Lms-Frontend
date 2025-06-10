import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  findEmployeeList,
  updateUserRoleAndStatus,
  findEmployeesCount,
} from "../../features/manager/managerActions";
import styles from "./EmployeeManagement.module.css";
import Sidebar from "./Sidebar";
import ExportToExcel from "../../assets/ExportToExcel";

const EmployeeManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalEmployeeCount, setTotalEmployeeCount] = useState(0);

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
  const {
    users,
    loading: reduxLoading,
    employeeCount,
  } = useSelector((state) => state.manager);

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

  // Fetch total employee count once on component mount
  useEffect(() => {
    fetchTotalEmployeeCount();
  }, []);

  // Fetch user list when filters change
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
  }, [dispatch, roleFilter, statusFilter]);

  // New function to fetch total employee count (without filters)
  const fetchTotalEmployeeCount = async () => {
    const { user, token } = getUserData();
    if (user && token) {
      try {
        // Fetch all employees without filters to get the total count
        const allEmployeesPayload = {
          user,
          token,
          role: "all",
          status: "all",
        };
        
        const response = await dispatch(findEmployeeList(allEmployeesPayload)).unwrap();
        
        // Calculate total count excluding interns
        const totalCount = response && response.length > 0
          ? response.filter((emp) => emp.employeeType !== "intern").length
          : 0;
        
        setTotalEmployeeCount(totalCount);
      } catch (error) {
        console.error("Error fetching total employee count:", error);
        setTotalEmployeeCount(0);
      }
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

  // Define Excel headers for employee management
  const excelHeaders = {
    firstName: "First Name",
    lastName: "Last Name",
    emailId: "Email ID",
    officeId: "Office ID",
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
            <div className={styles.statValue}>{totalEmployeeCount}</div>
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
            <label className={styles.filterLabel}>Filter by Role</label>
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
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filter by Status</label>
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
          </div>
        </div>

        {searchTerm && (
          <div className={styles.searchResultCount}>
            Found <span>{filteredUsers.length}</span> results for "{searchTerm}"
          </div>
        )}

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
                    <th>Name</th>
                    <th>Email ID</th>
                    <th>Office ID</th>
                    <th>Role</th>
                    <th>User Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.emailId || Math.random()}>
                        <td>
                          {user.name ||
                            `${user.firstName || ""} ${user.lastName || ""}`}
                        </td>
                        <td>{user.emailId}</td>
                        <td>{user.officeId}</td>
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className={styles.emptyMessage}>
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
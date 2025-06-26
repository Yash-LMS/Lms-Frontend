import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import styles from "./InternManagement.module.css";
import {
  FIND_INTERN_LIST_URL,
  UPDATE_INTERN_STATUS_URL,
  FIND_INTERN_IMAGE_URL,
  UPDATE_COMPLETION_STATUS_URL,
  UPDATE_INTERN_FEEDBACK_URL,
  INTERN_FEEDBACK_VIEW_URL,
} from "../../constants/apiConstants";
import { findInternsCount } from "../../features/manager/managerActions";
import Sidebar from "./Sidebar";
import InternBulkRegistration from "./InternBulkRegistration";
import ExportToExcel from "../../assets/ExportToExcel";

const InternManagement = () => {
  const dispatch = useDispatch();
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("not_active");
  const [selectedCompletionStatus, setSelectedCompletionStatus] =
    useState("all");
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remark, setRemark] = useState("");
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState("");
  const [activeTab, setActiveTab] = useState("intern");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBulkRegistrationModal, setShowBulkRegistrationModal] =
    useState(false);
  const [internImages, setInternImages] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedNewCompletionStatus, setSelectedNewCompletionStatus] =
    useState("");

  // New state for date filtering
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);

  const { internCount } = useSelector((state) => state.manager);

  const [showViewFeedbackModal, setShowViewFeedbackModal] = useState(false);
  const [viewFeedbackData, setViewFeedbackData] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [hoveredImage, setHoveredImage] = useState(null);
  const [imageHoverPosition, setImageHoverPosition] = useState({ x: 0, y: 0 });

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "not_active", label: "Not Active" },
    { value: "blocked", label: "Blocked" },
  ];

  const completionStatusOptions = [
    { value: "ongoing", label: "Ongoing" },
    { value: "released", label: "Released" },
    { value: "convertedToTrainee", label: "Converted to Trainee" },
  ];

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

  useEffect(() => {
    fetchInterns();
    fetchCounts();
  }, [selectedStatus, selectedCompletionStatus]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all blob URLs to prevent memory leaks
      Object.values(internImages).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [internImages]);

  const fetchCounts = async () => {
    const { user, token } = getUserData();
    if (user && token) {
      dispatch(findInternsCount({ user, token }));
    }
  };

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const { user, token } = getUserData();

      // Prepare the request payload
      const payload = {
        user,
        token,
        status: selectedStatus,
      };

      // Only add completionStatus to payload if not "all"
      if (selectedCompletionStatus !== "all") {
        payload.completionStatus = selectedCompletionStatus;
      }

      const response = await axios.post(FIND_INTERN_LIST_URL, payload);

      if (response.data && response.data.response === "success") {
        let result = response.data.payload || [];

        // If the API doesn't support filtering by completionStatus, we'll filter on the client side
        if (selectedCompletionStatus !== "all") {
          result = result.filter(
            (intern) =>
              (intern.completionStatus || "ongoing") ===
              selectedCompletionStatus
          );
        }

        setInterns(result);
        setError(null);

        // Fetch intern images after loading the intern data
        if (result.length > 0) {
          fetchInternImages(result);
        }
      } else {
        setInterns([]);
      }
    } catch (error) {
      console.error("Error fetching interns:", error);
      setInterns([]);
      setError("Failed to fetch interns data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all intern images in a batch
  const fetchInternImages = async (internList) => {
    const { token } = getUserData();

    try {
      const imagePromises = internList.map(async (intern) => {
        try {
          const response = await axios.get(
            `${FIND_INTERN_IMAGE_URL}?emailId=${encodeURIComponent(
              intern.emailId
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              responseType: "blob", // Tell axios to expect binary data
            }
          );

          // Create a blob URL from the response data
          const imageUrl = URL.createObjectURL(response.data);
          return { emailId: intern.emailId, imageUrl };
        } catch (error) {
          console.error(`Error fetching image for ${intern.emailId}:`, error);
          return { emailId: intern.emailId, imageUrl: null };
        }
      });

      const imagesResult = await Promise.all(imagePromises);

      // Convert array to object with emailId as keys
      const imagesMap = imagesResult.reduce((acc, curr) => {
        acc[curr.emailId] = curr.imageUrl;
        return acc;
      }, {});

      setInternImages(imagesMap);
    } catch (error) {
      console.error("Error fetching intern images:", error);
    }
  };

  const handleViewFeedback = async (intern) => {
    setFeedbackLoading(true);
    try {
      const { user, token } = getUserData();

      const response = await axios.post(INTERN_FEEDBACK_VIEW_URL, {
        user,
        token,
        emailId: intern.emailId,
      });

      console.log(response.data);

      if (response.data && response.data.response === "success") {
        setViewFeedbackData(response.data.payload);
        setSelectedIntern(intern);

        setShowViewFeedbackModal(true);
      } else {
        setViewFeedbackData(null);
        alert("No feedback found for this intern.");
      }
    } catch (error) {
      console.error("Error fetching intern feedback:", error);
      alert("Failed to fetch feedback data");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleStatusChangeInitiate = (intern, newStatus) => {
    if (intern.status.toLowerCase() === newStatus.toLowerCase()) return;

    if (newStatus === "active") {
      setSelectedIntern(intern);
      setSelectedNewStatus(newStatus);
      setRemark("");
      setShowRemarkModal(true);
    } else {
      updateInternStatus(intern, newStatus);
    }
  };

  const updateInternStatus = async (intern, newStatus) => {
    try {
      const { user, token } = getUserData();

      const response = await axios.post(UPDATE_INTERN_STATUS_URL, {
        user,
        token,
        emailId: intern.emailId,
        remark: `Status updated from ${intern.status} to ${newStatus}`,
        status: newStatus,
      });

      if (response.data && response.data.response === "success") {
        setInterns(
          interns.map((i) =>
            i.emailId === intern.emailId ? { ...i, status: newStatus } : i
          )
        );
      }
    } catch (error) {
      console.error("Error updating intern status", error);
    }
  };

  const handleCompletionStatusChange = async (intern, newCompletionStatus) => {
    // If changing to released, show feedback modal first
    if (newCompletionStatus === "released") {
      setSelectedIntern(intern);
      setSelectedNewCompletionStatus(newCompletionStatus);
      setFeedback("");
      setShowFeedbackModal(true);
    } else {
      // For other status changes, proceed directly
      updateCompletionStatus(intern, newCompletionStatus);
    }
  };

  const updateCompletionStatus = async (intern, newCompletionStatus) => {
    try {
      const { user, token } = getUserData();

      const response = await axios.post(UPDATE_COMPLETION_STATUS_URL, {
        user,
        token,
        emailId: intern.emailId,
        completionStatus: newCompletionStatus,
      });

      if (response.data && response.data.response === "success") {
        setInterns(
          interns.map((i) =>
            i.emailId === intern.emailId
              ? { ...i, completionStatus: newCompletionStatus }
              : i
          )
        );
      }
    } catch (error) {
      console.error("Error updating internship completion status", error);
    }
  };

  // New function to handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!selectedIntern || !feedback.trim()) {
      return;
    }

    try {
      const { user, token } = getUserData();

      // First submit the feedback
      const feedbackResponse = await axios.post(UPDATE_INTERN_FEEDBACK_URL, {
        user,
        token,
        emailId: selectedIntern.emailId,
        feedback: feedback,
      });

      if (
        feedbackResponse.data &&
        feedbackResponse.data.response === "success"
      ) {
        // Then update the completion status
        const statusResponse = await axios.post(UPDATE_COMPLETION_STATUS_URL, {
          user,
          token,
          emailId: selectedIntern.emailId,
          completionStatus: selectedNewCompletionStatus,
        });

        if (statusResponse.data && statusResponse.data.response === "success") {
          setInterns(
            interns.map((i) =>
              i.emailId === selectedIntern.emailId
                ? { ...i, completionStatus: selectedNewCompletionStatus }
                : i
            )
          );

          // Close the modal and reset states
          setShowFeedbackModal(false);
          setSelectedIntern(null);
          setSelectedNewCompletionStatus("");
          setFeedback("");
        }
      }
    } catch (error) {
      console.error("Error submitting feedback or updating status", error);
    }
  };

  const handleSubmitStatusChange = async () => {
    if (!selectedIntern || !selectedNewStatus) return;

    try {
      const { user, token } = getUserData();

      const response = await axios.post(UPDATE_INTERN_STATUS_URL, {
        user,
        token,
        emailId: selectedIntern.emailId,
        remark:
          remark ||
          `Status updated from ${selectedIntern.status} to ${selectedNewStatus}`,
        status: selectedNewStatus,
      });

      if (response.data && response.data.response === "success") {
        setInterns(
          interns.map((intern) =>
            intern.emailId === selectedIntern.emailId
              ? { ...intern, status: selectedNewStatus }
              : intern
          )
        );
        setShowRemarkModal(false);
        setSelectedIntern(null);
        setSelectedNewStatus("");
        setRemark("");
      }
    } catch (error) {
      console.error("Error updating status with remark", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  // Enhanced filtering function with date filters
  const filteredInterns = interns.filter((intern) => {
    // Apply the search filter with null/undefined handling
    const matchesSearch =
      !searchTerm || // Handle null/undefined searchTerm
      searchTerm.trim() === "" ||
      (intern.firstName && intern.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (intern.lastName && intern.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (intern.emailId && intern.emailId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (intern.institution && intern.institution.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (intern.internshipProgram && intern.internshipProgram.toLowerCase().includes(searchTerm.toLowerCase()));
  
    // Apply date filters
    let matchesDateFilter = true;
  
    if (startDateFilter || endDateFilter) {
      const internStartDate = new Date(intern.startDate);
      const internEndDate = new Date(intern.endDate);
  
      if (startDateFilter) {
        const filterStartDate = new Date(startDateFilter);
        // Check if intern's start date is on or after the filter start date
        matchesDateFilter =
          matchesDateFilter && internStartDate >= filterStartDate;
      }
  
      if (endDateFilter) {
        const filterEndDate = new Date(endDateFilter);
        // Check if intern's end date is on or before the filter end date
        matchesDateFilter = matchesDateFilter && internEndDate <= filterEndDate;
      }
    }
  
    return matchesSearch && matchesDateFilter;
  });

  // New function to clear date filters
  const clearDateFilters = () => {
    setStartDateFilter("");
    setEndDateFilter("");
  };

  // New function to check if date filters are active
  const hasActiveDateFilters = () => {
    return startDateFilter || endDateFilter;
  };

  const excelHeaders = {
    firstName: "First Name",
    lastName: "Last Name",
    emailId: "Email ID",
    address: "Address",
    institution: "Institution",
    stream: "Stream",
    yearOfPassing: "Year Of Passing",
    internshipProgram: "Program",
    startDate: "Start Date",
    endDate: "End Date",
    duration: "Duration (in months)",
    remark: "Remark",
    feedback: "Feedback",
    status: "Account Status",
    completionStatus: "Completion Status",
  };

  const handleFilterChange = (e) => {
    setSelectedStatus(e.target.value);
    setError(null);
  };

  const handleCompletionFilterChange = (e) => {
    setSelectedCompletionStatus(e.target.value);
    setError(null);
  };

  const getNoDataMessage = () => {
    if (searchTerm) {
      return "No results found. Try a different search term.";
    } else if (
      selectedStatus !== "all" ||
      selectedCompletionStatus !== "all" ||
      hasActiveDateFilters()
    ) {
      let message = "No interns found with ";
      let filters = [];

      if (selectedStatus !== "all") {
        filters.push(
          `status "${
            statusOptions.find((option) => option.value === selectedStatus)
              ?.label || selectedStatus
          }"`
        );
      }

      if (selectedCompletionStatus !== "all") {
        filters.push(
          `completion status "${
            completionStatusOptions.find(
              (option) => option.value === selectedCompletionStatus
            )?.label || selectedCompletionStatus
          }"`
        );
      }

      if (hasActiveDateFilters()) {
        let dateFilterText = "date range";
        if (startDateFilter && endDateFilter) {
          dateFilterText = `dates between ${formatDate(
            startDateFilter
          )} and ${formatDate(endDateFilter)}`;
        } else if (startDateFilter) {
          dateFilterText = `start date from ${formatDate(startDateFilter)}`;
        } else if (endDateFilter) {
          dateFilterText = `end date until ${formatDate(endDateFilter)}`;
        }
        filters.push(dateFilterText);
      }

      message += filters.join(" and ");
      message += ". Try different filters.";
      return message;
    } else {
      return "No interns found.";
    }
  };

  const handleBulkRegistrationSuccess = () => {
    fetchInterns();
  };

  // Function to get appropriate style class for completion status
  const getCompletionStatusClass = (status) => {
    switch (status) {
      case "ongoing":
        return styles.completionOngoing;
      case "released":
        return styles.completionReleased;
      case "convertedToTrainee":
        return styles.completionConverted;
      default:
        return styles.completionOngoing;
    }
  };

  // Function to get display text for completion status
  const getCompletionStatusDisplay = (status) => {
    switch (status) {
      case "ongoing":
        return "Ongoing";
      case "released":
        return "Released";
      case "convertedToTrainee":
        return "Converted to Trainee";
      default:
        return "Ongoing";
    }
  };

  // Function to handle image loading errors
  const handleImageError = (e) => {
    e.target.src = "/placeholder-profile.png"; // Replace with your default placeholder image path
    e.target.classList.add(styles.placeholderImage);
  };

  const handleImageHover = (imageUrl, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setImageHoverPosition({
      x: rect.right + 10, // Position to the right of the image
      y: rect.top,
    });
    setHoveredImage(imageUrl);
  };

  const handleImageLeave = () => {
    setHoveredImage(null);
  };

  return (
    <div className={styles.container}>
      <Sidebar activeTab={activeTab} />

      <div className={styles.card}>
        <div className={styles.pageHeader}>
          <h1>Intern Management</h1>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Interns :</div>
            <div className={styles.statValue}>{internCount || 0}</div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchField}>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search interns..."
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  className={styles.clearSearchButton}
                  onClick={clearSearch}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              className={styles.bulkRegisterButton}
              onClick={() => setShowBulkRegistrationModal(true)}
            >
              Bulk Register
            </button>
          </div>
        </div>

        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filter by Status:</label>
            <select
              value={selectedStatus}
              onChange={handleFilterChange}
              className={styles.select}
            >
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <label className={styles.filterLabel}>
              Filter by Completion Status:
            </label>
            <select
              value={selectedCompletionStatus}
              onChange={handleCompletionFilterChange}
              className={styles.select}
            >
              <option value="all">All Completion Status</option>
              {completionStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            {/* Date Filter Toggle Button */}
            <button
              className={`${styles.dateFilterToggle} ${
                showDateFilters ? styles.active : ""
              }`}
              onClick={() => setShowDateFilters(!showDateFilters)}
            >
              Date Filter {hasActiveDateFilters() ? "●" : ""}
            </button>

            {/* Clear all filters button */}
            {(selectedStatus !== "all" ||
              selectedCompletionStatus !== "all" ||
              hasActiveDateFilters()) && (
              <button
                className={styles.clearFiltersButton}
                onClick={() => {
                  setSelectedStatus("all");
                  setSelectedCompletionStatus("all");
                  clearDateFilters();
                  setShowDateFilters(false);
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Section */}
        {showDateFilters && (
          <div className={styles.dateFilterSection}>
            <div className={styles.dateFilterGroup}>
              <div className={styles.dateInputGroup}>
                <label htmlFor="startDateFilter">Start Date From:</label>
                <input
                  type="date"
                  id="startDateFilter"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <label htmlFor="endDateFilter">End Date Until:</label>
                <input
                  type="date"
                  id="endDateFilter"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              {hasActiveDateFilters() && (
                <button
                  className={styles.clearDateFiltersButton}
                  onClick={clearDateFilters}
                >
                  Clear Date Filters
                </button>
              )}
            </div>
            {hasActiveDateFilters() && (
              <div className={styles.activeDateFilters}>
                <span>Active date filters: </span>
                {startDateFilter && (
                  <span className={styles.filterTag}>
                    Start from: {formatDate(startDateFilter)}
                  </span>
                )}
                {endDateFilter && (
                  <span className={styles.filterTag}>
                    End until: {formatDate(endDateFilter)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.searchResultCount}>
          Found <span>{filteredInterns.length}</span> results
        </div>

        <div className={styles.exportExcel}>
          <ExportToExcel
            data={filteredInterns}
            headers={excelHeaders}
            fileName="Intern-Management-Results"
            sheetName="Interns"
            buttonStyle={{
              marginBottom: "20px",
            }}
          />
        </div>

        <div className={styles.cardContent}>
          {loading ? (
            <div className={styles.loading}>Loading interns...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Institution</th>
                    <th>Stream</th>
                    <th>Year Of Passing</th>
                    <th>Program</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration (in months)</th>
                    <th>Account Status</th>
                    <th>Completion Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterns.length > 0 ? (
                    filteredInterns.map((intern) => (
                      <tr key={intern.emailId}>
                        <td className={styles.profileImageCell}>
                          {internImages[intern.emailId] ? (
                            <img
                              src={internImages[intern.emailId]}
                              alt={`${intern.firstName}'s profile`}
                              className={styles.profileImage}
                              onError={handleImageError}
                              onMouseEnter={(e) =>
                                handleImageHover(
                                  internImages[intern.emailId],
                                  e
                                )
                              }
                              onMouseLeave={handleImageLeave}
                            />
                          ) : (
                            <img
                              src="/placeholder-profile.png"
                              alt={`${intern.firstName}'s profile`}
                              className={`${styles.profileImage} ${styles.placeholderImage}`}
                              onMouseEnter={(e) =>
                                handleImageHover("/placeholder-profile.png", e)
                              }
                              onMouseLeave={handleImageLeave}
                            />
                          )}
                        </td>
                        <td>{`${intern.firstName} ${intern.lastName}`}</td>
                        <td>{intern.emailId}</td>
                        <td>{intern.address}</td>
                        <td>{intern.institution}</td>
                        <td>{intern.stream}</td>
                        <td>{intern.yearOfPassing}</td>
                        <td>{intern.internshipProgram}</td>
                        <td>{formatDate(intern.startDate)}</td>
                        <td>{formatDate(intern.endDate)}</td>
                        <td>{intern.duration}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              intern.status === "active"
                                ? styles.statusActive
                                : intern.status === "blocked"
                                ? styles.statusBlocked
                                : styles.statusNotActive
                            }`}
                          >
                            {intern.status === "not_active"
                              ? "Not Active"
                              : intern.status.charAt(0).toUpperCase() +
                                intern.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td>
                          <div className={styles.completionStatusContainer}>
                            <span
                              className={`${
                                styles.statusBadge
                              } ${getCompletionStatusClass(
                                intern.completionStatus || "ongoing"
                              )}`}
                            >
                              {getCompletionStatusDisplay(
                                intern.completionStatus || "ongoing"
                              )}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionContainer}>
                            <select
                              className={styles.tableSelect}
                              value={intern.status}
                              onChange={(e) =>
                                handleStatusChangeInitiate(
                                  intern,
                                  e.target.value
                                )
                              }
                            >
                              {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>

                            <select
                              className={styles.tableSelect}
                              value={intern.completionStatus || "ongoing"}
                              onChange={(e) =>
                                handleCompletionStatusChange(
                                  intern,
                                  e.target.value
                                )
                              }
                            >
                              {completionStatusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>

                            {/* Add this new button */}
                            <button
                              className={styles.feedbackButton}
                              onClick={() => handleViewFeedback(intern)}
                              disabled={feedbackLoading}
                              title="View Feedback"
                            >
                              Feedback
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={14} className={styles.noData}>
                        {getNoDataMessage()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showRemarkModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              Status Change: {selectedIntern?.status} → {selectedNewStatus}
            </h2>
            <p className={styles.modalDescription}>
              Please provide a remark for activating {selectedIntern?.firstName}{" "}
              {selectedIntern?.lastName}.
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="remark">Remark:</label>
              <textarea
                id="remark"
                className={styles.remarkTextarea}
                placeholder="Enter your remark here..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
              />
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowRemarkModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleSubmitStatusChange}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Feedback Modal */}
      {showFeedbackModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              Provide Feedback Before Release
            </h2>
            <p className={styles.modalDescription}>
              Please provide feedback for {selectedIntern?.firstName}{" "}
              {selectedIntern?.lastName} before changing their status to
              Released.
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="feedback">Feedback:</label>
              <textarea
                id="feedback"
                className={styles.remarkTextarea}
                placeholder="Enter your feedback for the intern..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
              />
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowFeedbackModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim()}
              >
                Submit Feedback & Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Feedback Modal */}
      {showViewFeedbackModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              Feedback for {selectedIntern?.firstName}{" "}
              {selectedIntern?.lastName}
            </h2>
            <div className={styles.feedbackContent}>
              {viewFeedbackData ? (
                <div className={styles.feedbackDisplay}>
                  <div className={styles.feedbackText}>
                    {viewFeedbackData || "No feedback available"}
                  </div>
                  {viewFeedbackData.createdDate && (
                    <div className={styles.feedbackDate}>
                      Date: {formatDate(viewFeedbackData.createdDate)}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.noFeedback}>
                  No feedback available for this intern.
                </div>
              )}
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowViewFeedbackModal(false);
                  setViewFeedbackData(null);
                  setSelectedIntern(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Hover Overlay */}
      {hoveredImage && (
        <div
          className={styles.imageHoverOverlay}
          style={{
            left: imageHoverPosition.x,
            top: imageHoverPosition.y,
          }}
        >
          <img
            src={hoveredImage}
            alt="Full size profile"
            className={styles.hoverImage}
          />
        </div>
      )}

      {showBulkRegistrationModal && (
        <InternBulkRegistration
          onClose={() => setShowBulkRegistrationModal(false)}
          onUploadSuccess={handleBulkRegistrationSuccess}
        />
      )}
    </div>
  );
};

export default InternManagement;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  findCoursesByStatus,
  approveCourse,
  rejectCourse,
} from "../../features/manager/managerActions";
import styles from "./CourseRequests.module.css";
import SuccessModal from "../../assets/SuccessModal";
import Sidebar from "./Sidebar";

const CourseRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.manager);
  const [courseRequests, setCourseRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState("requests");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [actionType, setActionType] = useState(null);

  const courseStatusOptions = ["PENDING", "APPROVED", "REJECTED"];

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
    fetchCourses();
  }, [dispatch, statusFilter]);

  const fetchCourses = () => {
    const { user, token } = getUserData();
    if (user && token) {
      dispatch(
        findCoursesByStatus({
          user,
          token,
          courseStatus: statusFilter === "all" ? "" : statusFilter,
        })
      ).then((action) => {
        if (action.payload && Array.isArray(action.payload)) {
          setCourseRequests(action.payload);
        } else if (action.payload && Array.isArray(action.payload.payload)) {
          setCourseRequests(action.payload.payload);
        } else {
          console.error("Unexpected response format:", action.payload);
        }
      });
    }
  };

  const openFeedbackModal = (courseId) => {
    setCurrentCourseId(courseId);
    setActionType("reject");
    setFeedbackText("");
    setShowFeedbackModal(true);
  };

  const handleApprove = (courseId) => {
    const { user, token } = getUserData();

    // Get the course name for the success message
    const course = courseRequests.find(
      (c) => (c.courseId || c.id) === courseId
    );
    const courseName = course ? course.courseName : "Course";

    dispatch(
      approveCourse({
        user,
        token,
        courseId,
        feedBack: "", // Empty feedback for approval
      })
    ).then((action) => {
      if (action.payload) {
        // Show success modal
        setSuccessMessage(`${courseName} has been successfully approved.`);
        setShowSuccessModal(true);
        fetchCourses(); // Refresh the course list
      }
    });
  };

  const handleFeedbackSubmit = () => {
    const { user, token } = getUserData();

    dispatch(
      rejectCourse({
        user,
        token,
        courseId: currentCourseId,
        feedBack: feedbackText,
      })
    ).then((action) => {
      if (action.payload) {
        fetchCourses(); // Refresh the course list
      }
    });

    // Close the modal
    setShowFeedbackModal(false);

    // Reset form values
    setCurrentCourseId(null);
    setActionType(null);
    setFeedbackText("");
  };

  // Filter courses based on search term
  const getFilteredCourses = () => {
    if (!courseRequests) return [];

    return courseRequests.filter((course) => {
      const matchesSearch =
        course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructorName?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  };

  const handlePreviewClick = (courseId) => {
    navigate(`/course/view/${courseId}`);
  };

  // Get filtered courses
  const filteredCourses = getFilteredCourses();

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  return (
    <div className={styles.courseRequestsWrapper}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab}  />
      {/* Main Content */}
      <div className={styles.courseRequestsContent}>
        <header className={styles.pageHeader}>
          <h1>Course Requests</h1>
          <div className={styles.filters}>
            <input
              type="search"
              placeholder="Search by course name or instructor..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {courseStatusOptions.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.courseTable}>
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Instructor</th>
                  <th>Total Hours</th>
                  <th>Completion Status</th>
                  <th>System Remark</th>
                  <th>Request Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <tr key={course.courseId || course.id}>
                      <td>{course.courseName}</td>
                      <td>{course.instructorName}</td>
                      <td>{course.totalHours}</td>
                      <td>{course.courseCompletionStatus || "DRAFT"}</td>
                        <td>{course.systemRemark}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[course.courseStatus]
                          }`}
                        >
                          {course.courseStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {course.courseStatus === "pending" && (
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.approveButton}
                              onClick={() =>
                                handleApprove(course.courseId || course.id)
                              }
                            >
                              Approve
                            </button>
                            <button
                              className={styles.rejectButton}
                              onClick={() =>
                                openFeedbackModal(course.courseId || course.id)
                              }
                            >
                              Reject
                            </button>
                            <button
                              className={`${styles.btn} ${styles.btnPreview}`}
                              onClick={() =>
                                handlePreviewClick(course.courseId || course.id)
                              }
                            >
                              Preview
                            </button>
                          </div>
                        )}
                        {course.courseStatus !== "pending" && (
                          <span className={styles.completedText}>
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.noData}>
                      No course requests found for the selected status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Modal (only for rejections) */}
      {showFeedbackModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.feedbackModal}>
            <h2 className={styles.modalTitle}>Reject Course</h2>
            <p className={styles.modalInstructions}>
              Please provide your reason for rejection:
            </p>
            <textarea
              className={styles.feedbackTextarea}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter your feedback here..."
              rows={5}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowFeedbackModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.rejectButton}
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim()}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for approvals */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};

export default CourseRequests;

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
import axios from "axios";
import { VIEW_FEEDBACK_FOR_ALLOTMENT_URL } from "../../constants/apiConstants";

const CourseRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.manager);
  const [courseRequests, setCourseRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState("requests");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState("");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

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

  const fetchFeedbackList = async () => {
    const { user, token } = getUserData();
    if (user && token) {
      setLoadingFeedback(true);
      try {
        const response = await axios.post(VIEW_FEEDBACK_FOR_ALLOTMENT_URL, {
          user,
          token,
        });
        
        let feedbackData = [];
        if (response.data && Array.isArray(response.data)) {
          feedbackData = response.data;
        } else if (response.data && Array.isArray(response.data.payload)) {
          feedbackData = response.data.payload;
        } else {
          console.error("Unexpected feedback response format:", response.data);
          setFeedbackList([]);
          return;
        }
        
        setFeedbackList(feedbackData);
      } catch (error) {
        console.error("Error fetching feedback list:", error);
        setFeedbackList([]);
      } finally {
        setLoadingFeedback(false);
      }
    }
  };

  const openFeedbackModal = (courseId) => {
    setCurrentCourseId(courseId);
    setActionType("reject");
    setFeedbackText("");
    setShowFeedbackModal(true);
  };

  const openApprovalModal = (courseId) => {
    setCurrentCourseId(courseId);
    setActionType("approve");
    setSelectedFeedbackId("");
    setShowApprovalModal(true);
    fetchFeedbackList(); // Fetch feedback list when opening approval modal
  };

  const handleApprove = () => {
    const { user, token } = getUserData();

    // Get the course name for the success message
    const course = courseRequests.find(
      (c) => (c.courseId || c.id) === currentCourseId
    );
    const courseName = course ? course.courseName : "Course";

    // Find the selected feedback object using feedbackId (not id)
    const selectedFeedback = feedbackList.find(
      (feedback) => feedback.feedbackId.toString() === selectedFeedbackId
    );

    if (!selectedFeedback) {
      console.error("Selected feedback not found. selectedFeedbackId:", selectedFeedbackId);
      console.error("Available feedback list:", feedbackList);
      alert("Please select a valid feedback option.");
      return;
    }


    const approvalData = {
        user,
        token,
        courseId: currentCourseId,
        feedBack: "", 
        feedbackId: selectedFeedback.feedbackId,
      }


    dispatch(approveCourse(approvalData))
    .then((action) => {
      if (action.payload && action.payload.response === "success") {
        // Show success modal
        setSuccessMessage(`${courseName} has been successfully approved.`);
        setShowSuccessModal(true);
        fetchCourses(); // Refresh the course list
        
        // Close approval modal and reset state
        setShowApprovalModal(false);
        setCurrentCourseId(null);
        setSelectedFeedbackId("");
      } else {
        console.error("Approval failed:", action.payload);
        const errorMessage = action.payload?.message || action.payload?.error || "Failed to approve course. Please try again.";
        alert(errorMessage);
      }
    })
    .catch((error) => {
      console.error("Approval error:", error);
      alert("An error occurred while approving the course. Please try again.");
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
                                openApprovalModal(course.courseId || course.id)
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

      {/* Approval Modal with Feedback Allocation */}
      {showApprovalModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.feedbackModal}>
            <h2 className={styles.modalTitle}>Approve Course</h2>
            <p className={styles.modalInstructions}>
              Please select a feedback to allocate to this course:
            </p>
            
            {loadingFeedback ? (
              <div className={styles.loadingFeedback}>Loading feedback options...</div>
            ) : (
              <select
                className={styles.feedbackSelect}
                value={selectedFeedbackId}
                onChange={(e) => setSelectedFeedbackId(e.target.value)}
              >
                <option value="">Select Feedback</option>
                {feedbackList.map((feedback) => (
                  <option key={feedback.feedbackId} value={feedback.feedbackId}>
                    {feedback.feedbackName}
                  </option>
                ))}
              </select>
            )}
            
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowApprovalModal(false);
                  setCurrentCourseId(null);
                  setSelectedFeedbackId("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.approveButton}
                onClick={handleApprove}
                disabled={!selectedFeedbackId || loadingFeedback}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

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
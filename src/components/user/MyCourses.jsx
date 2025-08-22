import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import { viewAllotedCourses } from "../../features/user/userActions";
import DashboardSidebar from "../../assets/DashboardSidebar";
import FeedbackModal from "./FeedbackModal";
import styles from "./MyCourses.module.css";
import { COURSE_IMAGE_VIEW_URL, USER_COURSE_CERTIFICATE_URL, USER_COURSE_VERIFY_MANUALLY_URL } from "../../constants/apiConstants";
import Image from "../Image/DefaultCourse.png";
import axios from 'axios';

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

const MyCourses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = getUserData();
  const { 
    allottedCourses, 
    loading, 
    error
  } = useSelector((state) => state.employee);

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // State for view toggle (default is card)
  const [viewMode, setViewMode] = useState("card");

  // State for feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // State to track submitted feedback by allotmentId
  const [submittedFeedback, setSubmittedFeedback] = useState(new Set());

  // State for certificate download - track by allotmentId
  const [downloadingCertificateId, setDownloadingCertificateId] = useState(null);
  const [certificateDownloadError, setCertificateDownloadError] = useState(null);

  // State for verify completion - track by allotmentId
  const [verifyingCompletionId, setVerifyingCompletionId] = useState(null);
  const [verifyCompletionError, setVerifyCompletionError] = useState(null);
  
  // State for success messages
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [courseImages, setCourseImages] = useState({});
  const defaultImageUrl = Image; 

  const needsProfileCompletion = (userData) => {
    const resumeNotUpdated = !userData.resumeStatus || userData.resumeStatus === 'not_updated';
    const photoNotUpdated = !userData.photoStatus || userData.photoStatus === 'not_updated';
    
    return resumeNotUpdated || photoNotUpdated;
  };

    const updateEmployeeId = (userData) => {
    const employeeIdNotUpdated =   userData.employeeId === null || userData.employeeId === 0 ;
   
    
    return employeeIdNotUpdated;
  };

  const redirectUser = (userData) => {
    if (userData.role === 'user' && needsProfileCompletion(userData)) {
      navigate("/complete-profile");
      return;
    }

 if (userData.role === 'user' && updateEmployeeId(userData)) {
      navigate("/update-employeeId");
      return;
    }


    if (userData.role === 'instructor' && needsProfileCompletion(userData)) {
      navigate("/complete-profile");
      return;
    }

     if (userData.role === 'instructor' && updateEmployeeId(userData)) {
      navigate("/update-employeeId");
      return;
    }

    
    if (userData.role === 'instructor') {
      navigate("/instructor-dashboard");
    } else if (userData.role === 'user') {
      navigate("/user-dashboard");
    } else {
      navigate("/manager-dashboard");
    }
  };

  function formatDate(dateString) {
  const date = new Date(dateString);
  const day = ("0" + date.getDate()).slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}



  useEffect(() => {
    const{user,token}=getUserData();
    redirectUser(user);
  }, []);

  useEffect(() => {
    // Load submitted feedback from localStorage on component mount
    const savedFeedback = localStorage.getItem('submittedFeedback');
    if (savedFeedback) {
      try {
        setSubmittedFeedback(new Set(JSON.parse(savedFeedback)));
      } catch (error) {
        console.error("Error parsing saved feedback data:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Function to fetch image for a single course
    const fetchCourseImage = async (courseId) => {
      try {
        const response = await fetch(`${COURSE_IMAGE_VIEW_URL}?courseId=${courseId}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          // Create a blob URL for the image
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          
          setCourseImages(prevImages => ({
            ...prevImages,
            [courseId]: imageUrl
          }));
        } else {
          // If image not found, use default
          setCourseImages(prevImages => ({
            ...prevImages,
            [courseId]: defaultImageUrl
          }));
        }
      } catch (error) {
        console.error(`Error fetching image for course ${courseId}:`, error);
        setCourseImages(prevImages => ({
          ...prevImages,
          [courseId]: defaultImageUrl
        }));
      }
    };

    // Fetch images for all courses
    if (allottedCourses && allottedCourses.length > 0) {
      allottedCourses.forEach(course => {
        const courseId = course.course.courseId;
        fetchCourseImage(courseId);
      });
    }

    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      Object.values(courseImages).forEach(url => {
        if (url && !url.includes(defaultImageUrl)) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [allottedCourses]);

  useEffect(() => {
    dispatch(viewAllotedCourses());
  }, [dispatch]);

  const handleVerifyCompletion = async (allotmentId) => {
    try {
      if (!user || !token) {
        showMessage("User not authenticated.");
        return;
      }

      // Reset previous error
      setVerifyCompletionError(null);

      // Set loading state for this specific course
      setVerifyingCompletionId(allotmentId);

      const requestData = { 
        user, 
        token, 
        allotmentId 
      };

      const response = await axios.post(`${USER_COURSE_VERIFY_MANUALLY_URL}`, requestData);

      if (response.data) {
        if (response.data.response === 'success') {
          showMessage("Course completion verified successfully!");
          // Refresh the courses to get updated completion status
          dispatch(viewAllotedCourses());
        } else {
          setVerifyCompletionError(response.data.message || "Verification failed");
          showMessage(response.data.message || "Verification failed");
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error verifying course completion:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.message || 
                          "An error occurred while verifying course completion. Please try again.";
      setVerifyCompletionError(errorMessage);
      showMessage(errorMessage);
    } finally {
      // Clear loading state after verification attempt (success or failure)
      setVerifyingCompletionId(null);
    }
  };

  const handleDownloadCertificate = async (allotmentId) => {
    try {
      if (!user || !token) {
        showMessage("User not authenticated.");
        return;
      }

      // Reset previous error
      setCertificateDownloadError(null);

      // Set loading state for this specific certificate
      setDownloadingCertificateId(allotmentId);

      const requestData = { user, token, allotmentId };

      const response = await axios.post(`${USER_COURSE_CERTIFICATE_URL}`, requestData, {
        responseType: "blob", // Ensures response is treated as a file
        validateStatus: function (status) {
          // Allow all status codes to be processed, not just 2xx
          return true;
        }
      });

      if (response.status === 406) {
        const courseStatus = response.headers['x-course-status'];
        setCertificateDownloadError(`Cannot download certificate: Course ${courseStatus}`);
        showMessage(`Cannot download certificate: Course ${courseStatus}`);
        return;
      }

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `Course_Certificate_${allotmentId}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Clean up resources
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Show success message
        showMessage("Certificate downloaded successfully!");
      } else {
        throw new Error("Failed to generate certificate");
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
      setCertificateDownloadError("An error occurred while downloading the certificate. Please try again.");
      showMessage("An error occurred while downloading the certificate. Please try again.");
    } finally {
      // Clear loading state after download attempt (success or failure)
      setDownloadingCertificateId(null);
    }
  };

  // Helper function to show messages
  const showMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
      setSuccessMessage("");
    }, 5000);
  };

  // Feedback modal handlers
  const handleFeedbackSuccess = (message) => {
    // Mark feedback as submitted for this course
    const newSubmittedFeedback = new Set(submittedFeedback);
    newSubmittedFeedback.add(selectedCourse.allotmentId);
    setSubmittedFeedback(newSubmittedFeedback);
    
    // Save to localStorage
    localStorage.setItem('submittedFeedback', JSON.stringify([...newSubmittedFeedback]));
    
    showMessage(message);
    setShowFeedbackModal(false);
    setSelectedCourse(null);
  };

  const handleFeedbackError = (message) => {
    showMessage(message);
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    setSelectedCourse(null);
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      approved: styles.approved,
      pending: styles.inProgress,
      completed: styles.completed,
    };
    return statusClasses[status] || styles.approved;
  };

   const getTrainingStatusClass = (status) => {
    const trainingStatusClasses = {
      DUE: styles.due,
      OVERDUE: styles.overdue,
      COMPLETED: styles.completed,
    };
    return trainingStatusClasses[status] || styles.due;
  };

  // Check if feedback has been submitted for a course
  const isFeedbackSubmitted = (allotmentId) => {
    return submittedFeedback.has(allotmentId);
  };

  // Filter and search logic
  const filteredCourses = allottedCourses
    ? allottedCourses.filter((course) => {
        const matchesSearch = course.course.courseName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesStatus =
          filterStatus === "all" || course.allotmentStatus === filterStatus;
        return matchesSearch && matchesStatus;
      })
    : [];

  // Function to format completion status to 2 decimal places ONLY if it has decimals
  const formatCompletionStatus = (status) => {
    const value = parseFloat(status);
    // Check if the number has decimal places
    return Number.isInteger(value) ? value : value.toFixed(2);
  };

  // Render action buttons for both card and table view
  const renderActionButtons = (course, isTableView = false) => {
    return (
      <div className={isTableView ? styles.tableActions : ""}>
        <button
          className={`${styles.continueButton} ${isTableView ? styles.tableButton : ""}`}
          onClick={() => navigate(`/user/courseContent/${course.course.courseId}/${course.allotmentId}`)}
        >
          {course.completionStatus === 0 ? "Start" : "Continue"}
        </button>

        {/* Show Verify Completion button only if completionStatus is NOT 100% */}
        {course.completionStatus < 100 && (
          <button
            className={`${styles.verifyButton} ${isTableView ? styles.tableButton : ""}`}
            onClick={() => handleVerifyCompletion(course.allotmentId)}
            disabled={verifyingCompletionId === course.allotmentId}
          >
            {verifyingCompletionId === course.allotmentId ? "Verifying..." : "Verify"}
          </button>
        )}

        {/* Show Submit Feedback button if completionStatus is 100% and feedback not submitted */}
        {course.completionStatus >= 100 && !isFeedbackSubmitted(course.allotmentId) && (
          <button
            className={`${styles.feedbackButton} ${isTableView ? styles.tableButton : ""}`}
            onClick={() => {
              setSelectedCourse(course);
              setShowFeedbackModal(true);
            }}
          >
            Feedback
          </button>
        )}

        {/* Show Feedback Already Submitted message if feedback was submitted */}
        {course.completionStatus >= 100 && isFeedbackSubmitted(course.allotmentId) && !isTableView && (
          <div className={styles.feedbackSubmittedMessage}>
            ✓ Feedback Submitted
          </div>
        )}

        {course.completionStatus >= 100 && (
          <button
            className={`${styles.downloadButton} ${isTableView ? styles.tableButton : ""}`}
            onClick={() => handleDownloadCertificate(course.allotmentId)}
            disabled={downloadingCertificateId === course.allotmentId}
          >
            {downloadingCertificateId === course.allotmentId ? "Downloading..." : "Certificate"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.myCoursesContainer}>
      <DashboardSidebar activeTab="dashboard" />
      <header className={styles.coursesHeader}>
        <h1>My Courses</h1>
        <div className={styles.coursesFilters}>
          {/* View Toggle Radio Buttons */}
          <div className={styles.viewToggle}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="viewMode"
                value="card"
                checked={viewMode === "card"}
                onChange={(e) => setViewMode(e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>Card View</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="viewMode"
                value="table"
                checked={viewMode === "table"}
                onChange={(e) => setViewMode(e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>Table View</span>
            </label>
          </div>

          <select
            className={styles.filterDropdown}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Courses</option>
            <option value="pending">In Progress</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="search"
            className={styles.searchCourses}
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className={styles.successMessage}>
          {successMessage}
        </div>
      )}

      {loading && <div className={styles.loadingState}>Loading courses...</div>}
      {error && (
        <div className={styles.errorMessage}>
          {typeof error === "string"
            ? error
            : error.message || "An error occurred"}
        </div>
      )}

      {!loading &&
        !error &&
        (!allottedCourses || allottedCourses.length === 0) && (
          <div className={styles.noData}>
            <p>
              No courses have been allotted to you yet. Please check back later.
            </p>
          </div>
        )}

      {!loading && !error && allottedCourses && allottedCourses.length > 0 && (
        <>
          {/* Card View */}
          {viewMode === "card" && (
            <div className={styles.coursesGrid}>
              {filteredCourses.map((course) => (
                <div key={course.id} className={styles.courseCard}>
                  <div className={styles.courseImage}>
                    <img
                      src={courseImages[course.course.courseId] || defaultImageUrl} 
                      alt={`${course.courseName} thumbnail`} 
                      className={styles.thumbnail}
                    />
                    <span
                      className={`${styles.courseStatus} ${getStatusClass(
                        course.allotmentStatus
                      )}`}
                    >
                      {course.allotmentStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.courseContent}>
                    <h3 className={styles.courseTitle}>
                      {course.course.courseName}
                    </h3>
                    <p className={styles.courseInstructor}>
                      Instructor: {course.course.instructor}
                    </p>
                    <p className={styles.courseDuration}>
                      Description: {course.course.description}
                    </p>
                    <p className={styles.courseDuration}>
                      Total Hours: {course.course.totalHours}
                    </p>
                    <p className={styles.courseDuration}>
                      End Date: {formatDate(course.endDate)}
                    </p>
                    <p className={styles.courseDuration}>
                      Validity: {course.validity} days
                    </p>
                    <div className={styles.statusContainer}>
                    <p className={styles.courseDuration}>
                      Training Status: 
                    </p>
                    <span
                      className={`${styles.trainingStatus} ${getTrainingStatusClass(
                        course.trainingStatus
                      )}`}
                    >
                      {course.trainingStatus.toUpperCase()}
                    </span>
                    </div>

                    <div className={styles.progressContainer}>
                      <div className={styles.progressInfo}>
                        <span>Progress</span>
                        <span>{formatCompletionStatus(course.completionStatus)}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${course.completionStatus}%` }}
                        ></div>
                      </div>
                    </div>

                    {renderActionButtons(course, false)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <div className={styles.tableContainer}>
              <table className={styles.coursesTable}>
                <thead>
                  <tr>
                    <th>Course Image</th>
                    <th>Course Name</th>
                    <th>Instructor</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                    <th>End Date</th>
                    <th>Validity</th>
                    <th>Training Status</th>
                    <th>Progress</th>
                    <th>Feedback Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <img
                          src={courseImages[course.course.courseId] || defaultImageUrl}
                          alt={`${course.courseName} thumbnail`}
                          className={styles.tableImage}
                        />
                      </td>
                      <td>
                        <div className={styles.tableCourseInfo}>
                          <strong>{course.course.courseName}</strong>
                          <small>{course.course.description}</small>
                        </div>
                      </td>
                      <td>{course.course.instructor}</td>
                      <td>{course.course.totalHours}h</td>
                      <td>
                        <span
                          className={`${styles.tableStatus} ${getStatusClass(
                            course.allotmentStatus
                          )}`}
                        >
                          {course.allotmentStatus.toUpperCase()}
                        </span>
                      </td>
                    
                      <td>{formatDate(course.endDate)}</td>
                      <td>{course.validity} days</td>
                      <td>
                        <span
                      className={`${styles.trainingStatus} ${getTrainingStatusClass(
                        course.trainingStatus
                      )}`}
                    >
                      {course.trainingStatus.toUpperCase()}
                    </span>
                      </td>
                      <td>
                        <div className={styles.tableProgressContainer}>
                          <div className={styles.tableProgressBar}>
                            <div
                              className={styles.tableProgressFill}
                              style={{ width: `${course.completionStatus}%` }}
                            ></div>
                          </div>
                          <span className={styles.tableProgressText}>
                            {formatCompletionStatus(course.completionStatus)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {course.completionStatus >= 100 && isFeedbackSubmitted(course.allotmentId) ? (
                          <span className={styles.feedbackSubmittedBadge}>✓ Submitted</span>
                        ) : course.completionStatus >= 100 ? (
                          <span className={styles.feedbackPendingBadge}>Pending</span>
                        ) : (
                          <span className={styles.feedbackNotApplicable}>N/A</span>
                        )}
                      </td>
                      <td>
                        {renderActionButtons(course, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* New Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleFeedbackClose}
        course={selectedCourse}
        user={user}
        token={token}
        onSuccess={handleFeedbackSuccess}
        onError={handleFeedbackError}
      />
    </div>
  );
};

export default MyCourses;
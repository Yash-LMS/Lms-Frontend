import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import { viewAllotedCourses, userCourseFeedback } from "../../features/user/userActions";
import DashboardSidebar from "../../assets/DashboardSidebar";
import styles from "./MyCourses.module.css";
import { COURSE_IMAGE_VIEW_URL,  USER_COURSE_CERTIFICATE_URL } from "../../constants/apiConstants";
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
    error,
    feedbackSubmission 
  } = useSelector((state) => state.employee);

  // State for search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // State for feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  // State for certificate download
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [certificateDownloadError, setCertificateDownloadError] = useState(null);

  const [courseImages, setCourseImages] = useState({});
  const defaultImageUrl = Image; 

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

  // Effect to handle feedback submission result
  useEffect(() => {
    if (feedbackSubmission.success) {
      // Show success message
      alert("Feedback submitted successfully!");
      setShowFeedbackModal(false);
      setFeedbackText("");
    }
    
    if (feedbackSubmission.error) {
      // Show error message
      alert("Failed to submit feedback. Please try again.");
    }
  }, [feedbackSubmission]);

  const handleDownloadCertificate = async (allotmentId) => {
    try {
      if (!user || !token) {
        alert("User not authenticated.");
        return;
      }

      // Reset previous error
      setCertificateDownloadError(null);

      // Set loading state before download starts
      setDownloadingCertificate(true);

      const requestData = { user, token, allotmentId };

      const response = await axios.post(`${USER_COURSE_CERTIFICATE_URL}`, requestData, {
        responseType: "blob", // Ensures response is treated as a file
      });

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
      } else {
        throw new Error("Failed to generate certificate");
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
      setCertificateDownloadError("An error occurred while downloading the certificate. Please try again.");
      alert("An error occurred while downloading the certificate. Please try again.");
    } finally {
      // Remove loading state after download attempt (success or failure)
      setDownloadingCertificate(false);
    }
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      approved: styles.approved,
      pending: styles.inProgress,
      completed: styles.completed,
    };
    return statusClasses[status] || styles.approved;
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

  const handleFeedbackSubmit = () => {
    if (!selectedCourse || !feedbackText.trim()) return;

    // Dispatch feedback submission
    dispatch(userCourseFeedback({
      user,
      token,
      courseId: selectedCourse.course.courseId,
      feedback: feedbackText,
    }));
  };

  // Function to format completion status to 2 decimal places ONLY if it has decimals
  const formatCompletionStatus = (status) => {
    const value = parseFloat(status);
    // Check if the number has decimal places
    return Number.isInteger(value) ? value : value.toFixed(2);
  };

  return (
    <div className={styles.myCoursesContainer}>
      <DashboardSidebar activeLink="dashboard" />
      <header className={styles.coursesHeader}>
        <h1>My Courses</h1>
        <div className={styles.coursesFilters}>
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
          <div className={styles.error}>
            <p>
              No courses have been allotted to you yet. Please check back later.
            </p>
          </div>
        )}

      {!loading && !error && allottedCourses && allottedCourses.length > 0 && (
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

                <button
                  className={styles.continueButton}
                  onClick={() => navigate(`/user/courseContent/${course.course.courseId}/${course.allotmentId}`)}
                >
                  {course.completionStatus === 0
                    ? "Start Learning"
                    : "Continue Learning"}
                </button>

                {/* Show Submit Feedback button if completionStatus is 95% or more */}
                {course.completionStatus >= 95 && (
                  <button
                    className={styles.feedbackButton}
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowFeedbackModal(true);
                    }}
                  >
                    Feedback
                  </button>
                )}

                {course.completionStatus >= 100 && (
                  <button
                    className={styles.downloadButton}
                    onClick={() => handleDownloadCertificate(course.allotmentId)}
                    disabled={downloadingCertificate}
                  >
                    {downloadingCertificate ? (
                      <span className={styles.loadingSpinner}>
                        Downloading Certificate...
                      </span>
                    ) : (
                      "Download Certificate"
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.feedbackModal}>
            <h2 className={styles.modalTitle}>Submit Feedback</h2>
            <p className={styles.modalInstructions}>
              Please provide your feedback for the course:
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
                className={styles.submitButton}
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim() || feedbackSubmission.loading}
              >
                {feedbackSubmission.loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
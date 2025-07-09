import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./InstructorDashboard.module.css";
import { COURSE_IMAGE_VIEW_URL, RESEND_COURSE_APPROVAL } from "../../constants/apiConstants";
import Image from "../Image/DefaultCourse.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEye, faPen } from "@fortawesome/free-solid-svg-icons";

const CourseList = ({
  courses,
  loading,
  error,
  onAddDetails,
  onEditCourse,
}) => {
  const navigate = useNavigate();
  const [courseImages, setCourseImages] = useState({});
  const defaultImageUrl = Image;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  // For re-appeal feedback and loading
  const [reappealLoading, setReappealLoading] = useState({});
  const [reappealMsg, setReappealMsg] = useState({});

  // Calculate pagination
  const indexOfLastCourse = currentPage * cardsPerPage;
  const indexOfFirstCourse = indexOfLastCourse - cardsPerPage;
  const currentCourses = courses ? courses.slice(indexOfFirstCourse, indexOfLastCourse) : [];
  const totalPages = courses ? Math.ceil(courses.length / cardsPerPage) : 0;

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem('user')),
        token: sessionStorage.getItem('token'),
        role: sessionStorage.getItem('role')
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  // API call for re-appeal
  const resendCourseForApproval = async (courseId) => {
    const { user, token } = getUserData();
    if (!user || !token) {
      throw new Error('User or token not found in session storage');
    }
    const apiRequestModelCourse = { user, token, courseId };
    try {
      const response = await axios.post(`${RESEND_COURSE_APPROVAL}`, apiRequestModelCourse);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Handler for Re-appeal button click
  const handleReappeal = async (courseId) => {
    setReappealLoading((prev) => ({ ...prev, [courseId]: true }));
    setReappealMsg((prev) => ({ ...prev, [courseId]: null }));
    try {
      const data = await resendCourseForApproval(courseId);
      if (data && data.response === 'success') {
        setReappealMsg((prev) => ({
          ...prev,
          [courseId]: { type: "success", text: data.message || "Re-appeal sent successfully!" }
        }));
      } else {
        setReappealMsg((prev) => ({
          ...prev,
          [courseId]: { type: "error", text: data.message || "Failed to send re-appeal." }
        }));
      }
    } catch (error) {
      setReappealMsg((prev) => ({
        ...prev,
        [courseId]: { type: "error", text: "Failed to send re-appeal. Please try again." }
      }));
    } finally {
      setReappealLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  // Function to format hours (e.g., 3.2 -> "3 hours 12 minutes")
  const formatHours = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) {
      return "0 minutes";
    }
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    let result = "";
    if (hours > 0) result += `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) {
      if (result) result += " ";
      result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return result || "0 minutes";
  };

  // Pagination handlers
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Function to fetch image for a single course using axios
  const fetchCourseImage = useCallback(async (courseId) => {
    if (courseImages[courseId]) return;
    try {
      const response = await axios.get(COURSE_IMAGE_VIEW_URL, {
        params: { courseId },
        responseType: 'blob'
      });
      const imageUrl = URL.createObjectURL(response.data);
      setCourseImages((prevImages) => ({
        ...prevImages,
        [courseId]: imageUrl,
      }));
    } catch (error) {
      setCourseImages((prevImages) => ({
        ...prevImages,
        [courseId]: defaultImageUrl,
      }));
    }
  }, [courseImages, defaultImageUrl]);

  useEffect(() => {
    if (currentCourses && currentCourses.length > 0) {
      currentCourses.forEach((course) => {
        if (!courseImages[course.courseId]) {
          fetchCourseImage(course.courseId);
        }
      });
    }
  }, [currentCourses, currentPage, fetchCourseImage, courseImages]);

  // Cleanup effect for revoking object URLs
  useEffect(() => {
    return () => {
      Object.values(courseImages).forEach((url) => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [courseImages]);

  if (loading) {
    return <p>Loading courses...</p>;
  }

  if (error) {
    return (
      <p className={styles.errorMessage}>
        {error.message || "An error occurred."}
      </p>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className={styles.noCourses}>
        No Courses found. Create a new course to get started.
      </div>
    );
  }

  const handlePreviewClick = (courseId) => {
    navigate(`/course/preview/${courseId}`);
  };

  return (
    <div className={styles.courseListContainer}>
      <div className={styles.courseList}>
        {currentCourses.map((course) => (
          <div key={course.courseId} className={styles.courseCard}>
            <div className={styles.courseImage}>
              <img
                src={courseImages[course.courseId] || defaultImageUrl}
                alt={`${course.courseName} thumbnail`}
                className={styles.thumbnail}
              />
            </div>
            <div className={styles.courseTag}>COURSE</div>
            <div className={styles.courseHeader}>
              <h3>{course.courseName}</h3>
              <span
                className={`${styles.statusBadge} ${
                  styles[course.courseCompletionStatus?.toLowerCase()]
                }`}
              >
                {course.courseCompletionStatus}
              </span>
            </div>
            <div className={styles.testDetails}>
              <div className={styles.courseInfo}>
                <span className={styles.detailLabel}>Estimated Hours:</span>
                <span> {formatHours(course.totalHours)} </span>
              </div>
              <div className={styles.courseInfo}>
                <span className={styles.detailLabel}>Actual Hours:</span>
                <span> {formatHours(course.courseLengthInHours)} </span>
              </div>
              <div className={styles.courseInfo}>
                <span className={styles.detailLabel}>Status:</span>
                <span> {(course.courseStatus ?? "PENDING").toUpperCase()} </span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <button
                className={styles.addButton}
                onClick={() => onEditCourse(course)}
              >
                <FontAwesomeIcon icon={faPen} />
                <span style={{ marginLeft: "5px" }}>Edit Course</span>
              </button>
              <button
                className={styles.previewButton}
                onClick={() => handlePreviewClick(course.courseId)}
              >
                <FontAwesomeIcon icon={faEye} />
                <span style={{ marginLeft: "2px" }}>Preview</span>
              </button>
              <button
                className={styles.editButton}
                onClick={() => onAddDetails(course)}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span style={{ marginLeft: "5px" }}>Add Sections</span>
              </button>

              {/* Re-appeal button */}
              {course.courseStatus === "rejected" && (
                <button
                  className={styles.reappealButton}
                  disabled={reappealLoading[course.courseId]}
                  onClick={() => handleReappeal(course.courseId)}
                  style={{ marginLeft: "5px" }}
                >
                  {reappealLoading[course.courseId] ? "Re-appealing..." : "Re-appeal"}
                </button>
              )}
            </div>
            {/* Inline message for re-appeal */}
            {reappealMsg[course.courseId] && (
              <div
                className={
                  reappealMsg[course.courseId].type === "success"
                    ? styles.successMsg
                    : styles.errorMsg
                }
                style={{ marginTop: "6px", fontSize: "0.95em" }}
              >
                {reappealMsg[course.courseId].text}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {courses && courses.length > 0 && (
        <div className={styles.paginationControls}>
          <button
            className={styles.paginationButton}
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={styles.pageIndicator}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.paginationButton}
            onClick={nextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseList;

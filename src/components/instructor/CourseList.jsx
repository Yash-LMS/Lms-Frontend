import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./InstructorDashboard.module.css";
import { COURSE_IMAGE_VIEW_URL } from "../../constants/apiConstants";
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
  
  // Calculate pagination
  const indexOfLastCourse = currentPage * cardsPerPage;
  const indexOfFirstCourse = indexOfLastCourse - cardsPerPage;
  const currentCourses = courses ? courses.slice(indexOfFirstCourse, indexOfLastCourse) : [];
  const totalPages = courses ? Math.ceil(courses.length / cardsPerPage) : 0;

  // Pagination handlers
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Function to fetch image for a single course using axios
  const fetchCourseImage = useCallback(async (courseId) => {
    // Check if image is already fetched or being fetched
    if (courseImages[courseId]) {
      return;
    }

    try {
      const response = await axios.get(COURSE_IMAGE_VIEW_URL, {
        params: {
          courseId: courseId
        },
        responseType: 'blob' // Important: specify blob response type for image data
      });

      // Create a blob URL for the image
      const imageUrl = URL.createObjectURL(response.data);

      setCourseImages((prevImages) => ({
        ...prevImages,
        [courseId]: imageUrl,
      }));
    } catch (error) {
      console.error(`Error fetching image for course ${courseId}:`, error);
      setCourseImages((prevImages) => ({
        ...prevImages,
        [courseId]: defaultImageUrl,
      }));
    }
  }, [courseImages, defaultImageUrl]);

  useEffect(() => {
    // Fetch images for all current courses (only for the visible ones)
    if (currentCourses && currentCourses.length > 0) {
      currentCourses.forEach((course) => {
        // Only fetch if we don't already have the image
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
                  styles[course.courseCompletionStatus.toLowerCase()]
                }`}
              >
                {course.courseCompletionStatus}
              </span>
            </div>
            <div className={styles.testDetails}>
              <div className={styles.courseInfo}>
                <span className={styles.detailLabel}>Total Hours:</span>
                <span> {course.totalHours} </span>
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
            </div>
          </div>
        ))}
      </div>
      
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
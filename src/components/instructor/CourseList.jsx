import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    // Function to fetch image for a single course
    const fetchCourseImage = async (courseId) => {
      try {
        const response = await fetch(
          `${COURSE_IMAGE_VIEW_URL}?courseId=${courseId}`,
          {
            method: "GET",
          }
        );

        if (response.ok) {
          // Create a blob URL for the image
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);

          setCourseImages((prevImages) => ({
            ...prevImages,
            [courseId]: imageUrl,
          }));
        } else {
          // If image not found, use default
          setCourseImages((prevImages) => ({
            ...prevImages,
            [courseId]: defaultImageUrl,
          }));
        }
      } catch (error) {
        console.error(`Error fetching image for course ${courseId}:`, error);
        setCourseImages((prevImages) => ({
          ...prevImages,
          [courseId]: defaultImageUrl,
        }));
      }
    };

    // Fetch images for all courses
    if (courses && courses.length > 0) {
      courses.forEach((course) => {
        fetchCourseImage(course.courseId);
      });
    }

    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      Object.values(courseImages).forEach((url) => {
        if (url && !url.includes(defaultImageUrl)) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [courses]);

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

  const handlePreviewClick = (courseId) => {
    navigate(`/course/preview/${courseId}`);
  };

  return (
    <div className={styles.courseList}>
      {courses.map((course) => (
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
  );
};

export default CourseList;

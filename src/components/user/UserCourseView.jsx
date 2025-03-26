import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  viewCourseDetails,
} from "../../features/course/courseActions";
import styles from "../instructor/CoursePreview.module.css";

const UserCourseView = () => {
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedCourse, loading, error } = useSelector(
    (state) => state.courses
  );
  const [expandedSections, setExpandedSections] = useState({});

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
    const fetchCourseDetails = async () => {
      const { user, token } = getUserData();

      if (!user || !token) {
        alert("User  session data is missing. Please log in again.");
        navigate("/login");
        return;
      }

      try {
        await dispatch(
          viewCourseDetails({
            courseId: parseInt(courseId),
            user,
            token,
          })
        ).unwrap();
      } catch (err) {
        console.error("Error fetching course details:", err);
      }
    };

    fetchCourseDetails();
  }, [courseId, dispatch, navigate]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prevState) => ({
      ...prevState,
      [sectionId]: !prevState[sectionId],
    }));
  };


  if (loading) {
    return <div className={styles.loading}>Loading course details...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        {error.message || "An error occurred while loading the course."}
      </div>
    );
  }

  if (!selectedCourse) {
    return <div className={styles.notFound}>Course not found</div>;
  }

  const { user, token } = getUserData();

  return (
    <div className={styles.coursePreviewContainer}>
      <div className={styles.backNavigation}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          &larr; Back to Dashboard
        </button>
      </div>

      <div className={styles.courseHeader}>
        <h1 className={styles.courseName}>{selectedCourse.courseName}</h1>
        <div className={styles.courseMetadata}>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Total Hours:</span>
            <span className={styles.metadataValue}>
              {selectedCourse.totalHours}
            </span>
          </div>
          {selectedCourse.courseStatus && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Status:</span>
              <span
                className={`${styles.statusBadge} ${
                  styles[selectedCourse.courseStatus.toLowerCase()]
                }`}
              >
                {selectedCourse.courseStatus}
              </span>
            </div>
          )}
          {selectedCourse.courseCompletionStatus && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Completion Status:</span>
              <span
                className={`${styles.statusBadge} ${
                  styles[selectedCourse.courseCompletionStatus.toLowerCase()]
                }`}
              >
                {selectedCourse.courseCompletionStatus}
              </span>
            </div>
          )}
          {selectedCourse.instructorName && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Instructor:</span>
              <span className={styles.metadataValue}>
                {selectedCourse.instructorName}
              </span>
            </div>
          )}
        </div>
      </div>

      {selectedCourse.description && (
        <div className={styles.courseDescription}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <p>{selectedCourse.description}</p>
        </div>
      )}

      <div className={styles.courseSections}>
        <h2 className={styles.sectionTitle}>Course Content</h2>

        {selectedCourse.sectionList && selectedCourse.sectionList.length > 0 ? (
          <div className={styles.sectionsList}>
            {selectedCourse.sectionList.map((section) => (
              <div key={section.sectionId} className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionName}>
                    <span className={styles.sectionSequence}>
                      {section.sequenceId}.
                    </span>{" "}
                    {section.title}
                  </h3>
                  <div className={styles.sectionActions}>
                    <span
                      className={styles.expandIcon}
                      onClick={() => toggleSection(section.sectionId)}
                    >
                      {expandedSections[section.sectionId] ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {expandedSections[section.sectionId] && section.topics && (
                  <div className={styles.topicsList}>
                    {section.topics.map((topic) => (
                      <div key={topic.topicId} className={styles.topicItem}>
                        <div className={styles.topicDetails}>
                          <span className={styles.topicSequence}>
                            {topic.topicsSequenceId}.
                          </span>
                          <span className={styles.topicName}>
                            {topic.topicName}
                          </span>
                          <span
                            className={`${styles.topicType} ${
                              styles[topic.topicType]
                            }`}
                          >
                            {topic.topicType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noSections}>
            No sections added to this course yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default UserCourseView;
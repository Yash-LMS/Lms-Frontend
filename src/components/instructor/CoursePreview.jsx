import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  viewCourseDetails,
  editSectionDetail,
  deleteTopicFile,
} from "../../features/course/courseActions";
import EditSectionModal from "./EditSectionModal";
import VideoPlayer from "./VideoPlayer";
import FilePreview from "./FilePreview";
import styles from "./CoursePreview.module.css";

const CoursePreview = () => {
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedCourse, loading, error } = useSelector(
    (state) => state.courses
  );
  const [expandedSections, setExpandedSections] = useState({});
  const [showEditSection, setShowEditSection] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState(null);

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
        alert("User session data is missing. Please log in again.");
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

  const handleEditSection = (section) => {
    setSelectedSection(section);
    setShowEditSection(true);
  };

  const handleEditSubmit = async (updatedSection) => {
    const { user, token } = getUserData();

    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    try {
      const resultAction = await dispatch(
        editSectionDetail({
          section: updatedSection,
          user,
          token,
        })
      );

      if (editSectionDetail.fulfilled.match(resultAction)) {
        console.log("Section updated successfully:", resultAction.payload);
        setShowEditSection(false);
        await dispatch(
          viewCourseDetails({
            courseId: parseInt(courseId),
            user,
            token,
          })
        ).unwrap();
      } else {
        throw new Error("Failed to update section");
      }
    } catch (error) {
      console.error("Failed to update section:", error);
      alert("Failed to update section.");
    }
  };

  const handleDeleteFile = async (topicId) => {
    try {
      const { user, token } = getUserData();

      if (!user) {
        console.error("User is undefined");
        alert("User session data is missing. Please log in again.");
        return;
      }

      if (!token) {
        console.error("Token is undefined");
        alert("Authentication token is missing. Please log in again.");
        return;
      }

      if (!topicId) {
        console.error("TopicId is required");
        alert("Invalid topic ID");
        return;
      }

      const requestBody = {
        user: user,
        token: token,
        topicId: topicId,
      };

      const resultAction = await dispatch(deleteTopicFile(requestBody));

      if (deleteTopicFile.fulfilled.match(resultAction)) {
        console.log("File deleted successfully:", resultAction.payload);
        await dispatch(
          viewCourseDetails({
            courseId: parseInt(courseId),
            user,
            token,
          })
        ).unwrap();
      } else {
        const error = resultAction.payload || resultAction.error;
        throw new Error(error?.message || "Failed to delete file");
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert(
        "Failed to delete file: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleOpenVideoPlayer = (topic) => {
    setSelectedTopicId(topic.topicId);
    setShowVideoPlayer(true);
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedTopicId(null);
  };

  const handleOpenFilePreview = (topicId) => {
    setCurrentTopicId(topicId);
    setShowFilePreview(true);
  };

  const handleCloseFilePreview = () => {
    setShowFilePreview(false);
    setCurrentTopicId(null);
  };

  // New method to handle test preview navigation
  const handlePreviewClick = (testId) => {
    navigate(`/test/preview/${testId}`);
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
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEditSection(section)}
                    >
                      Edit
                    </button>
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
                        <div className={styles.topicLinks}>
                          {topic.videoURL && topic.videoURL !== "" && (
                            <button
                              onClick={() => handleOpenVideoPlayer(topic)}
                              className={styles.resourceLink}
                            >
                              Watch Video
                            </button>
                          )}
                          {topic.docsURL && topic.docsURL !== "" && (
                            <button
                              onClick={() =>
                                handleOpenFilePreview(topic.topicId)
                              }
                              className={styles.resourceLink}
                            >
                              View Docs
                            </button>
                          )}
                          {/* New button for test preview */}
                          {topic.topicType === "test" && topic.testId && (
                            <button
                              onClick={() => handlePreviewClick(topic.testId)}
                              className={styles.resourceLink}
                            >
                              View Test
                            </button>
                          )}
                          {topic.file && topic.file !== "" && (
                            <a
                              href={URL.createObjectURL(new Blob([topic.file]))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.resourceLink}
                            >
                              Download File
                            </a>
                          )}
                          {topic.videoURL && topic.videoURL !== "" ? (
                            <button
                              onClick={() => handleDeleteFile(topic.topicId)}
                              title="Remove file"
                            >
                              Remove File
                            </button>
                          ) : (
                            topic.topicType == "video" && (
                              <p className={styles.noVideoMessage}>
                                No video available
                              </p>
                            )
                          )}
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

      {showEditSection && selectedSection && (
        <EditSectionModal
          isOpen={showEditSection}
          onClose={() => setShowEditSection(false)}
          section={selectedSection}
          onSubmit={handleEditSubmit}
        />
      )}

      {showVideoPlayer && selectedTopicId && (
        <div className={styles.videoPlayerModal}>
          <div className={styles.videoPlayerContent}>
            <div className={styles.videoPlayerHeader}>
              <button
                className={styles.closeButton}
                onClick={handleCloseVideoPlayer}
              >
                &times;
              </button>
            </div>
            <div className={styles.videoPlayerBody}>
              <VideoPlayer
                courseId={parseInt(courseId)}
                topicId={selectedTopicId}
                user={user}
                token={token}
              />
            </div>
          </div>
        </div>
      )}

      {showFilePreview && currentTopicId && (
        <FilePreview
          topicId={currentTopicId}
          onClose={handleCloseFilePreview}
        />
      )}
    </div>
  );
};

export default CoursePreview;

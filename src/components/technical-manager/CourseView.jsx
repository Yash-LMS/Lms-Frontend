import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { viewCourseDetails } from "../../features/course/courseActions";
import VideoPlayer from "../instructor/VideoPlayer";
import FilePreview from "../instructor/FilePreview";
import styles from "../instructor/CoursePreview.module.css";

const CourseView = () => {
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
          {selectedCourse.modifiedValue && (
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Modified Value:</span>
              <span className={styles.metadataValue}>
                {selectedCourse.modifiedValue}
              </span>
            </div>
          )}
          {selectedCourse.lastModifiedDate &&
            selectedCourse.lastModifiedTime && (
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Last Modified:</span>
                <span className={styles.metadataValue}>
                  {`${selectedCourse.lastModifiedDate}, ${selectedCourse.lastModifiedTime}`}
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
            {[...selectedCourse.sectionList]
              // Sort sections by sequenceId in ascending order
              .sort((a, b) => {
                // Convert to numbers to ensure correct numeric sorting
                const seqA = parseInt(a.sequenceId);
                const seqB = parseInt(b.sequenceId);
                return seqA - seqB;
              })
              .map((section) => (
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
                      {[...section.topics]
                        // Sort topics by topicsSequenceId in ascending order
                        .sort((a, b) => {
                          // Convert to numbers to ensure correct numeric sorting
                          const seqA = parseInt(a.topicsSequenceId);
                          const seqB = parseInt(b.topicsSequenceId);
                          return seqA - seqB;
                        })
                        .map((topic) => (
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
                            </div>
                            {(topic.modifiedValue ||
                              (topic.lastModifiedDate &&
                                topic.lastModifiedTime)) && (
                              <div className={styles.topicMetadataContainer}>
                                {topic.modifiedValue && (
                                  <p className={styles.topicMetadata}>
                                    <strong>Modified Value:</strong>
                                    <span className={styles.modifiedBadge}>
                                      {topic.modifiedValue}
                                    </span>
                                  </p>
                                )}
                                {topic.lastModifiedDate &&
                                  topic.lastModifiedTime && (
                                    <p className={styles.topicMetadata}>
                                      <strong>Last Modified:</strong>
                                      <span
                                        className={styles.timeStamp}
                                      >{`${topic.lastModifiedDate} ${topic.lastModifiedTime}`}</span>
                                    </p>
                                  )}
                              </div>
                            )}
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

export default CourseView;

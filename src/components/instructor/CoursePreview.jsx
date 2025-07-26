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
import SectionReorderModal from "./SectionReorderModal";
import TopicReorderModal from "./TopicReorderModal";
import SuccessModal from "../../assets/SuccessModal";
import styles from "./CoursePreview.module.css";
import { UPDATE_SECTION_SEQUENCE, UPDATE_TOPIC_SEQUENCE, DELETE_SECTION_URL } from "../../constants/apiConstants";
import axios from "axios";

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
  
  // State for section reordering
  const [isEditMode, setIsEditMode] = useState(false);
  const [sequenceUpdateLoading, setSequenceUpdateLoading] = useState(false);

  const [isTopicEditMode, setIsTopicEditMode] = useState({});
  const [topicSequenceUpdateLoading, setTopicSequenceUpdateLoading] = useState(false);

  
  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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


  useEffect(() => {
   
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

  const handleDeleteSection = async (section, courseId) => {
  const { user, token } = getUserData(); 

  try {
    const response = await axios.post(
      DELETE_SECTION_URL,
      {
        sectionId: section.sectionId,
        user,
        token,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.response === "success") {
      // Handle success (e.g., refresh section list, show message)
      alert("Section deleted successfully!");
      fetchCourseDetails();
    } else {
      // Handle failure
      alert(response.data?.message || "Failed to delete section.");
    }
  } catch (error) {
    console.error("Error deleting section:", error);
    alert("Error deleting section. Please try again.");
  }
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

  const handlePreviewClick = (testId) => {
    navigate(`/test/preview/${testId}`);
  };

  // Toggle edit mode for section sequencing
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Direct API call to update section sequence using hooks
  const updateSectionSequence = async (updatedSections) => {
    const { user, token } = getUserData();
  
    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }
  
    // Create the sequence update models
    const sectionSequenceUpdateModels = updatedSections.map(section => ({
      sectionId: section.sectionId,
      sequenceId: section.sequenceId
    }));
  
    console.log(sectionSequenceUpdateModels);
  
    try {
      setSequenceUpdateLoading(true);
      
      // Using Axios instead of fetch
      const response = await axios.post(UPDATE_SECTION_SEQUENCE, {
        user,
        token,
        sectionSequenceUpdateModels
      });
  
      console.log(response.data);

      // Axios automatically throws errors for non-2xx responses and parses JSON
      if (response.data && response.data.response === "success") {
        await fetchCourseDetails();
        setIsEditMode(false);
        
        // Show success modal
        setSuccessMessage("Section sequence updated successfully!");
        setShowSuccessModal(true);
      
      } else {
        throw new Error("Failed to update section sequence");
      }
    } catch (error) {
      console.error("Failed to update section sequence:", error);
      const errorMessage = error.response?.data?.message || error.message;
      alert("Failed to update section sequence: " + errorMessage);
    } finally {
      setSequenceUpdateLoading(false);
    }
  };

  // Handle save changes for section sequence update
  const handleSaveSequenceChanges = async (updatedSections) => {
    await updateSectionSequence(updatedSections);
  };

  const toggleTopicEditMode = (sectionId) => {
  setIsTopicEditMode(prev => ({
    ...prev,
    [sectionId]: !prev[sectionId]
  }));
};

// Direct API call to update topic sequence
const updateTopicSequence = async (updatedTopics, sectionId) => {
  const { user, token } = getUserData();

  if (!user || !token) {
    alert("User session data is missing. Please log in again.");
    return;
  }

  // Create the sequence update models for topics
  const topicSequenceUpdateModels = updatedTopics.map(topic => ({
    topicId: topic.topicId,
    sequenceId: topic.topicsSequenceId
  }));

  console.log('Topic sequence update models:', topicSequenceUpdateModels);

  try {
    setTopicSequenceUpdateLoading(true);
    
    // Using Axios to update topic sequence
    const response = await axios.post(UPDATE_TOPIC_SEQUENCE, {
      user,
      token,
      topicSequenceUpdateModels
    });

    console.log('Topic sequence update response:', response.data);

    // Axios automatically throws errors for non-2xx responses and parses JSON
    if (response.data && response.data.response === "success") {
      await fetchCourseDetails();
      setIsTopicEditMode(prev => ({
        ...prev,
        [sectionId]: false
      }));
      
      // Show success modal
      setSuccessMessage("Topic sequence updated successfully!");
      setShowSuccessModal(true);
    
    } else {
      throw new Error("Failed to update topic sequence");
    }
  } catch (error) {
    console.error("Failed to update topic sequence:", error);
    const errorMessage = error.response?.data?.message || error.message;
    alert("Failed to update topic sequence: " + errorMessage);
  } finally {
    setTopicSequenceUpdateLoading(false);
  }
};

// Handle save changes for topic sequence update
const handleSaveTopicSequenceChanges = async (updatedTopics, sectionId) => {
  await updateTopicSequence(updatedTopics, sectionId);
};

  // Close success modal
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
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
                  {`${selectedCourse.lastModifiedDate} ${selectedCourse.lastModifiedTime}`}
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
        <div className={styles.sectionTitleContainer}>
          <h2 className={styles.sectionTitle}>Course Content</h2>
          {!isEditMode && (
            <button 
              className={styles.editModeToggle} 
              onClick={toggleEditMode}
            >
              Re-Order Mode
            </button>
          )}
        </div>
  
        {selectedCourse.sectionList && selectedCourse.sectionList.length > 0 ? (
          <>
            {/* Add section sequence editor in edit mode */}
            {isEditMode ? (
              <SectionReorderModal
                sections={selectedCourse.sectionList}
                isEditMode={isEditMode}
                toggleEditMode={toggleEditMode}
                onSaveChanges={handleSaveSequenceChanges}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                handleEditSection={handleEditSection}
              />
            ) : (
              <div className={styles.sectionsList}>
                {selectedCourse.sectionList
                  .slice() // Create a copy to avoid mutating the original array
                  .sort((a, b) => a.sequenceId - b.sequenceId) // Sort by sequenceId
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
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEditSection(section)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteSection(section)}
                        >
                          Delete
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
    {/* Topic reorder controls */}
    <div className={styles.topicHeader}>
      {!isTopicEditMode[section.sectionId] && (
        <button 
          className={styles.editModeToggle} 
          onClick={() => toggleTopicEditMode(section.sectionId)}
        >
          Re-Order Topics
        </button>
      )}
    </div>

    {/* Show topic reorder modal if in edit mode for this section */}
    {isTopicEditMode[section.sectionId] ? (
      <TopicReorderModal
        topics={section.topics}
        sectionId={section.sectionId}
        isEditMode={isTopicEditMode[section.sectionId]}
        toggleEditMode={toggleTopicEditMode}
        onSaveChanges={handleSaveTopicSequenceChanges}
      />
    ) : (
      // Regular topic display
      section.topics
        .slice() // Create a copy
        .sort((a, b) => a.topicsSequenceId - b.topicsSequenceId) // Sort by topicsSequenceId
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
            {((topic.videoURL && topic.videoURL !== "") || 
              (topic.docsURL && topic.docsURL !== "")) ? (
              <button
                onClick={() => handleDeleteFile(topic.topicId)}
                title="Remove file"
                className={styles.removeFileButton}
              >
                Remove File
              </button>
            ) : (
              topic.topicType === "video" && (
                <p className={styles.noVideoMessage}>
                  No video available
                </p>
              )
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
      ))
    )}
  </div>
)}
                  </div>
                ))}
              </div>
            )}
          </>
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
  
      {sequenceUpdateLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>Updating sequence...</div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal 
          message={successMessage}
          onClose={handleCloseSuccessModal}
        />
      )}
    </div>
  );
};

export default CoursePreview;
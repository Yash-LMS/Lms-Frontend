import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./CourseContent.module.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { VIEW_USER_COURSE_DETAIL_URL } from "../../constants/apiConstants";
import ResultPopup from "./ResultPopup";
import UserVideoPlayer from "./UserVideoPlayer";
import UserFilePreview from "./UserFilePreview";
import AssignmentUploadInternalPopup from "./AssignmentUploadInternalPopup";

const CourseContent = () => {
  const [contentOpen, setContentOpen] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [sectionExpanded, setSectionExpanded] = useState({});

  // State for course data
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeTopicType, setActiveTopicType] = useState("video");
  const [showTest, setShowTest] = useState(false); // New state for controlling test visibility
  const [activeCourseId, setActiveCourseId] = useState(null);
  const navigate = useNavigate();

  const { courseId } = useParams();
  const { allotmentId } = useParams();

  // Add this to your state declarations at the top of the component
  const [showResults, setShowResults] = useState(false);

  // Add this function to handle showing results
  const handleViewResults = () => {
    setShowResults(true);
  };

  // Add this function to handle closing results
  const handleCloseResults = () => {
    setShowResults(false);
  };

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

  const goToDashboard = () => {
    navigate("/user-dashboard");
  };

  // Fetch course data from API
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const { user, token } = getUserData();

        const response = await axios.post(`${VIEW_USER_COURSE_DETAIL_URL}`, {
          courseId: parseInt(courseId),
          allotmentId: parseInt(allotmentId),
          user: user,
          token: token,
        });

        if (response.data.response === "success") {
          setCourseData(response.data.payload);
          setActiveCourseId(response.data.payload.courseId);

          // Set initial section expanded states
          const initialExpandedState = {};
          response.data.payload.sectionList.forEach((section) => {
            initialExpandedState[section.sectionId] = true;
          });
          setSectionExpanded(initialExpandedState);

          // Set initial active topic if available
          if (
            response.data.payload.sectionList.length > 0 &&
            response.data.payload.sectionList[0].topics.length > 0
          ) {
            const firstTopic = response.data.payload.sectionList[0].topics[0];
            setActiveTopic(firstTopic);
            setActiveTopicType(firstTopic.topicType);
            setActiveLesson(firstTopic.topicId.toString());
          }
        } else {
          setError(response.data.message || "Failed to load course");
        }
      } catch (err) {
        setError(
          "Error fetching course data: " + (err.message || "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Effect to update course data when returning from a test
  useEffect(() => {
    const testCompletionStatus = sessionStorage.getItem("lastCompletedTestId");
    if (testCompletionStatus && courseData) {
      // Update the course data to reflect the completed test
      const updatedCourseData = { ...courseData };
      updatedCourseData.sectionList = updatedCourseData.sectionList.map(
        (section) => {
          section.topics = section.topics.map((topic) => {
            if (topic.topicId.toString() === testCompletionStatus) {
              return {
                ...topic,
                courseTrackingDto: {
                  ...topic.courseTrackingDto,
                  topicCompletionStatus: "completed",
                },
              };
            }
            return topic;
          });
          return section;
        }
      );
      setCourseData(updatedCourseData);

      // Clear the session storage item
      sessionStorage.removeItem("lastCompletedTestId");
    }
  }, [courseData]);

  // Toggle content sidebar
  const toggleContent = () => {
    setContentOpen((prev) => !prev); // Toggle the state
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setSectionExpanded((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Mark topic as completed via API call
  const markTopicAsCompleted = async (topicId) => {
    // Here you would typically make an API call to update the completion status
    // For now, we'll just update the local state
    if (courseData) {
      const updatedCourseData = { ...courseData };
      updatedCourseData.sectionList = updatedCourseData.sectionList.map(
        (section) => {
          section.topics = section.topics.map((topic) => {
            if (topic.topicId.toString() === topicId.toString()) {
              return {
                ...topic,
                courseTrackingDto: {
                  ...topic.courseTrackingDto,
                  topicCompletionStatus: "completed",
                },
              };
            }
            return topic;
          });
          return section;
        }
      );
      setCourseData(updatedCourseData);
    }
  };

  // Mark topic as read
  const markTopicAsRead = (topicId, e) => {
    e.stopPropagation();
    markTopicAsCompleted(topicId);
  };

  // Set active topic
  const setTopicActive = (topic) => {
    setActiveTopic(topic);
    setActiveTopicType(topic.topicType);
    setActiveLesson(topic.topicId.toString());

    // Reset test visibility when changing topics
    setShowTest(false);
  };

  // Handle test selection
  const handleStartTest = () => {
    setShowTest(true);
  };

  // Navigate to previous or next lesson
  const navigateLesson = (direction) => {
    if (!courseData || !activeTopic) return;

    // Create flattened array of all topics across sections
    const allTopics = courseData.sectionList.flatMap(
      (section) => section.topics
    );
    const currentIndex = allTopics.findIndex(
      (topic) => topic.topicId === activeTopic.topicId
    );

    if (direction === "prev" && currentIndex > 0) {
      setTopicActive(allTopics[currentIndex - 1]);
    } else if (direction === "next" && currentIndex < allTopics.length - 1) {
      setTopicActive(allTopics[currentIndex + 1]);
    }
  };

  // Handle video completion - navigate to next topic automatically
  const handleVideoCompleted = (topicId) => {
    // Mark the current topic as completed
    markTopicAsCompleted(topicId);

    // Navigate to next topic automatically
    navigateLesson("next");
  };

  // Render content based on topic type
  const renderContentByType = () => {
    if (!activeTopic) return null;

    switch (activeTopicType) {
      case "video":
        return (
          <UserVideoPlayer
            courseId={activeCourseId}
            topicId={activeTopic?.topicId}
            user={getUserData().user}
            token={getUserData().token}
            trackingId={activeTopic.courseTrackingDto.trackingId}
            completionStatus={
              activeTopic.courseTrackingDto.topicCompletionStatus
            }
            onVideoCompleted={() => handleVideoCompleted(activeTopic.topicId)}
          />
        );
      case "docs":
        return (
          <UserFilePreview
            topicId={activeTopic.topicId}
            user={getUserData().user}
            token={getUserData().token}
            courseId={activeCourseId}
            trackingId={activeTopic.courseTrackingDto.trackingId}
            completionStatus={
              activeTopic.courseTrackingDto.topicCompletionStatus
            }
          />
        );

            case "assignment":
        return (
          <AssignmentUploadInternalPopup
            allotmentId={activeTopic.courseTrackingDto.assignmentAllotmentId}
            trackingId={activeTopic.courseTrackingDto.trackingId}
            courseTrackingStatus={
              activeTopic.courseTrackingDto.topicCompletionStatus
            }
          />
        );

      case "test":
        if (showTest) {
          navigate("/user/internal/test", {
            state: {
              topicId: activeTopic.topicId,
              courseAllotmentId: allotmentId,
              testAllotmentId: activeTopic.testAllotmentId,
              trackingId: activeTopic.courseTrackingDto.trackingId,
              courseId: activeCourseId,
            },
          });
          // Store the current test ID to handle completion status on return
          sessionStorage.setItem(
            "currentTestId",
            activeTopic.topicId.toString()
          );
          return null;
        } else {
          return (
            <div className={styles.testContainer}>
              <div className={styles.testStartCard}>
                <h2>Test: {activeTopic.topicName}</h2>
                <p>This topic contains a test to assess your knowledge.</p>
                <p>
                  Once you start the test, you will need to complete it in the
                  allotted time.
                </p>

                {activeTopic.courseTrackingDto.topicCompletionStatus ===
                "completed" ? (
                  <>
                    <p className={styles.completedMessage}>
                      You already completed this test
                    </p>
                    <button
                      className={styles.viewResultsButton}
                      onClick={handleViewResults}
                    >
                      View Results
                    </button>
                    {showResults && (
                      <ResultPopup
                        testAllotmentId={activeTopic.testAllotmentId}
                        onClose={handleCloseResults}
                      />
                    )}
                  </>
                ) : (
                  <button
                    className={styles.startTestButton}
                    onClick={handleStartTest}
                  >
                    {activeTopic.courseTrackingDto.topicCompletionStatus ===
                    "started"
                      ? "Continue Test"
                      : "Start Test"}
                  </button>
                )}
              </div>
            </div>
          );
        }
      default:
        return (
          <div className={styles.unsupportedContent}>
            <p>Unsupported content type: {activeTopicType}</p>
          </div>
        );
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading course content...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!courseData) {
    return <div className={styles.error}>No course data available</div>;
  }

  return (
    <div className={styles.container}>
      {/* Main content */}
      <div className={styles.mainContent}>
        {/* Video/Content container */}
        <div className={styles.videoContainer}>
          <div className={styles.videoPlayerArea}>
            {/* Content player (video, docs, or test) */}
            <div className={styles.videoPlayer}>{renderContentByType()}</div>

            {/* Navigation arrows - hide when test is showing */}
            {(!showTest || activeTopicType !== "test") && (
              <>
                <button
                  className={styles.navButtonLeft}
                  onClick={() => navigateLesson("prev")}
                >
                  &lt;
                </button>
                <button
                  className={styles.navButtonRight}
                  onClick={() => navigateLesson("next")}
                >
                  &gt;
                </button>
              </>
            )}
          </div>

          {/* Course description - hide when test is showing */}
          {(!showTest || activeTopicType !== "test") && (
            <div className={styles.courseDescription}>
              {/* Hamburger menu button - visible only when sidebar is closed */}
              {!contentOpen && (
                <button
                  onClick={toggleContent}
                  className={styles.hamburgerMenu}
                  aria-label="Open course content"
                  title="Open course content"
                >
                  ≡
                </button>
              )}

              <h2 className={styles.courseTitle}>About this course</h2>
              <p className={styles.courseText}>
                {courseData.description || "No course description available"}
              </p>
            </div>
          )}
        </div>

        {/* Course content sidebar - hide when test is in fullscreen mode */}
        {contentOpen && (!showTest || activeTopicType !== "test") && (
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.headerControls}>
                <div>
                  <button onClick={goToDashboard} className={styles.backButton}>
                    ← Back to Dashboard
                  </button>
                </div>
                <h3 className={styles.sidebarTitle}>Course content</h3>
              </div>
              <button onClick={toggleContent} className={styles.closeButton}>
                ×
              </button>
            </div>

            {/* Sections from API - sorted by sequenceId */}
            {[...courseData.sectionList]
              .sort((a, b) => a.sequenceId - b.sequenceId)
              .map((section) => (
                <div key={section.sectionId} className={styles.section}>
                  <div
                    className={styles.sectionHeader}
                    onClick={() => toggleSection(section.sectionId)}
                  >
                    <div>
                      <h4 className={styles.sectionTitle}>
                        Section {section.sequenceId}: {section.title}
                      </h4>
                      <div className={styles.sectionInfo}>
                        {
                          section.topics.filter(
                            (topic) =>
                              topic.courseTrackingDto.topicCompletionStatus ===
                              "completed"
                          ).length
                        }
                        /{section.topics.length} topics
                      </div>
                    </div>
                    <button className={styles.collapseButton}>
                      {sectionExpanded[section.sectionId] ? "▲" : "▼"}
                    </button>
                  </div>

                  {/* Topics - sorted by topicsSequenceId */}
                  {sectionExpanded[section.sectionId] && (
                    <div className={styles.lecturesList}>
                      {[...section.topics]
                        .sort((a, b) => a.topicsSequenceId - b.topicsSequenceId)
                        .map((topic) => {
                          // Use only the API's topicCompletionStatus to determine if completed
                          const isCompleted =
                            topic.courseTrackingDto.topicCompletionStatus ===
                            "completed";

                          return (
                            <div
                              key={topic.topicId}
                              className={`${styles.lectureItem} ${
                                activeTopic &&
                                activeTopic.topicId === topic.topicId
                                  ? styles.activeLesson
                                  : ""
                              }`}
                              onClick={() => setTopicActive(topic)}
                            >
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                className={styles.lectureCheckbox}
                                onChange={() =>
                                  markTopicAsCompleted(topic.topicId)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className={styles.lectureContent}>
                                <div className={styles.lectureInfo}>
                                  <div className={styles.lectureTitle}>
                                    {topic.topicsSequenceId}. {topic.topicName}
                                  </div>
                                  <div className={styles.lectureType}>
                                    {topic.topicType}
                                    <button
                                      className={styles.markReadBtn}
                                      onClick={(e) =>
                                        markTopicAsRead(topic.topicId, e)
                                      }
                                      aria-label="Mark as read"
                                      title="Mark as read"
                                    >
                                      ✓
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContent;

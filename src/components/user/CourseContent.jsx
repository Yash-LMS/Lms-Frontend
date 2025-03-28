import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "./CourseContent.module.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { VIEW_USER_COURSE_DETAIL_URL } from "../../constants/apiConstants";
import UserVideoPlayer from "./UserVideoPlayer";
import UserFilePreview from "./UserFilePreview";

const CourseContent = () => {
  const [contentOpen, setContentOpen] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [sectionExpanded, setSectionExpanded] = useState({});

  // State for course data
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeTopicType, setActiveTopicType] = useState("video");
  const navigate = useNavigate();

  const { courseId } = useParams();
  const{allotmentId}= useParams();

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

  // Toggle lesson completion
  const toggleLessonCompletion = (topicId) => {
    if (completedLessons.includes(topicId.toString())) {
      setCompletedLessons(
        completedLessons.filter((id) => id !== topicId.toString())
      );
    } else {
      setCompletedLessons([...completedLessons, topicId.toString()]);
    }
  };

  // Mark topic as read
  const markTopicAsRead = (topicId, e) => {
    e.stopPropagation();
    if (!completedLessons.includes(topicId.toString())) {
      setCompletedLessons([...completedLessons, topicId.toString()]);
    }
  };

  // Set active topic
  const setTopicActive = (topic) => {
    setActiveTopic(topic);
    setActiveTopicType(topic.topicType);
    setActiveLesson(topic.topicId.toString());
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

  // Render content based on topic type
  const renderContentByType = () => {
    if (!activeTopic) return null;

    switch (activeTopicType) {
      case "video":
        return (
          <UserVideoPlayer
            courseId={courseId}
            topicId={activeTopic?.topicId}
            user={getUserData().user}
            token={getUserData().token}
          />
        );
      case "docs":
        return (
          <UserFilePreview
            topicId={activeTopic.topicId}
            user={getUserData().user}
            token={getUserData().token}
            courseId={courseId}
          />
        );
      case "test":
        return (
          <div className={styles.testContainer}>
            {/* Test component would be implemented here */}
            <p>Test component for topic: {activeTopic.topicName}</p>
          </div>
        );
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

            {/* Navigation arrows */}
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
          </div>

          {/* Course description */}
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
        </div>

        {/* Course content sidebar */}
        {contentOpen && (
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

            {/* Sections from API */}
            {courseData.sectionList.map((section) => (
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
                        completedLessons.filter((id) =>
                          section.topics.some(
                            (topic) => topic.topicId.toString() === id
                          )
                        ).length
                      }
                      /{section.topics.length} topics
                    </div>
                  </div>
                  <button className={styles.collapseButton}>
                    {sectionExpanded[section.sectionId] ? "▲" : "▼"}
                  </button>
                </div>

                {/* Topics */}
                {sectionExpanded[section.sectionId] && (
                  <div className={styles.lecturesList}>
                    {section.topics.map((topic) => (
                      <div
                        key={topic.topicId}
                        className={`${styles.lectureItem} ${
                          activeTopic && activeTopic.topicId === topic.topicId
                            ? styles.activeLesson
                            : ""
                        }`}
                        onClick={() => setTopicActive(topic)}
                      >
                        <input
                          type="checkbox"
                          checked={completedLessons.includes(
                            topic.topicId.toString()
                          )}
                          className={styles.lectureCheckbox}
                          onChange={() => toggleLessonCompletion(topic.topicId)}
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
                    ))}
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

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './DetailedTrackingModal.module.css';
import { USER_TRACKING_DETAIL_URL } from '../../constants/apiConstants'; 

const DetailedTrackingModal = ({ student, allotmentId, onClose }) => {
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to get user data from sessionStorage
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

  // Fetch course tracking data
  const fetchCourseTracking = async () => {
    setLoading(true);
    const { user, token } = getUserData();

    if (!user || !token) {
      console.error("User  or token is missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(USER_TRACKING_DETAIL_URL, {
        user,
        token,
        allotmentId,
      });

      console.log(response.data);
      if (response.data.response === "success") {
        setTrackingData(response.data.payload); // Set the payload directly
      } else {
        console.error("Failed to fetch tracking data:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching course tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseTracking();
  }, [allotmentId]); // Fetch data when allotmentId changes

  // Get icon for topic type
  const getTopicIcon = (topicType) => {
    switch (topicType) {
      case 'docs':
        return '📄';
      case 'video':
        return '🎬';
      case 'test':
        return '📝';
      default:
        return '📚';
    }
  };

  // Get status color based on completion status
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#2ecc71';
      case 'started':
        return '#f39c12';
      case 'not_viewed':
        return '#e74c3c';
      case 'viewed':
      default:
        return '#95a5a6';
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Course Details</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.studentInfo}>
            <div className={styles.studentPhoto}>
              <div className={styles.photoPlaceholder}>
                {student.traineeName ? student.traineeName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div className={styles.studentDetails}>
              <h3>{student.traineeName}</h3>
            </div>
          </div>
          
          <div className={styles.courseDetails}>
            <div className={styles.detailRow}>
              <div className={styles.detailCard}>
                <span className={styles.detailLabel}>Course Name</span>
                <span className={styles.detailValue}>{student.courseName}</span>
              </div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailCard}>
                <span className={styles.detailLabel}>Progress</span>
                <div className={styles.progressDisplay}>
                  <div className={styles.progressBarModal}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${student.completionPercentage}%` }}
                    ></div>
                  </div>
                  <span>{student.completionPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            {student.timeSpent && (
              <div className={styles.detailRow}>
                <div className={styles.detailCard}>
                  <span className={styles.detailLabel}>Time Spent</span>
                  <span className={styles.detailValue}>{formatTime(student.timeSpent)}</span>
                </div>
                {student.averageScore !== undefined && (
                  <div className={styles.detailCard}>
                    <span className={styles.detailLabel}>Average Score</span>
                    <span className={styles.detailValue}>{student.averageScore}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className={styles.moduleSection}>
            <h3>Course Topics</h3>
            {loading ? (
              <p className={styles.loadingMessage}>Loading course data...</p>
            ) : trackingData.length > 0 ? (
              <div className={styles.topicsList}>
                {trackingData.map((topic, topicIndex) => (
                  <div key={topicIndex} className={styles.topicItem}>
                    <div className={styles.topicIcon}>
                      {getTopicIcon(topic.topicType)}
                    </div>
                    <div className={styles.topicContent}>
                      <div className={styles.topicHeader}>
                        <span className={styles.topicTitle}>{topic.topicName}</span>
                        <span 
                          className={styles.topicStatus}
                          style={{ 
                            backgroundColor: getStatusColor(topic.topicCompletionStatus) + '20',
                            color: getStatusColor(topic.topicCompletionStatus)
                          }}
                        >
                          {topic.topicCompletionStatus.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      {topic.description && (
                        <p className={styles.topicDescription}>{topic.description}</p>
                      )}
                      <span className={styles.topicType}>{topic.topicType}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noModulesMessage}>
                No detailed topic information available.
              </p>
            )}
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.closeModalButton} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DetailedTrackingModal;
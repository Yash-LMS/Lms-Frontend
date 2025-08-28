import React, { useState, useEffect } from "react";
import CodingAssignmentModal from "./CodingAssignmentModal";
import styles from "./CodingTasks.module.css";
import { GET_ALL_CODING_TASK } from "../../constants/apiConstants";
import axios from "axios";

const CodingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

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

 const fetchTasks = async () => {
  setLoading(true);
  setError("");

  const { user, token } = getUserData();

  if (!user || !token) {
    setError("User session data is missing. Please log in again.");
    setLoading(false);
    return;
  }

  try {
    // Axios POST request
    const response = await axios.post(
      GET_ALL_CODING_TASK,
      {
        user: user,
        token: token
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const data = response.data;

    if (data.response === "success") {
      setTasks(data.payload || []);
    } else {
      setError(data.message || "Failed to fetch coding assignments");
    }
  } catch (error) {
    setError(
      "Failed to fetch assignments: " +
        (error.response?.data?.message || error.message)
    );
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchTasks();
  }, []);

  const handleModalClose = () => {
    setShowModal(false);
    // Refresh the tasks list after modal closes (in case a new task was created)
    fetchTasks();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    const plainText = stripHtmlTags(text);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading coding assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Coding Assignments</h1>
          <p>Manage and create coding assignments for students</p>
        </div>
        <button 
          className={styles.createButton}
          onClick={() => setShowModal(true)}
        >
          <span className={styles.plusIcon}>+</span>
          Create New Assignment
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button 
            className={styles.retryButton}
            onClick={fetchTasks}
          >
            Retry
          </button>
        </div>
      )}

      {tasks.length === 0 && !loading && !error ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3>No Coding Assignments Yet</h3>
          <p>Get started by creating your first coding assignment</p>
          <button 
            className={styles.createButton}
            onClick={() => setShowModal(true)}
          >
            <span className={styles.plusIcon}>+</span>
            Create Your First Assignment
          </button>
        </div>
      ) : (
        <div className={styles.tasksGrid}>
          {tasks.map((task) => (
            <div key={task.taskId} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <div className={styles.taskIdBadge}>
                  Task #{task.taskId}
                </div>
                <div className={styles.technologyBadge}>
                  {task.technology}
                </div>
              </div>
              
              <div className={styles.taskContent}>
                <div className={styles.taskDescription}>
                  {truncateText(task.description)}
                </div>
                
                <div className={styles.taskMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Max Marks:</span>
                    <span className={styles.metaValue}>{task.maxMarks}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Instructor:</span>
                    <span className={styles.metaValue}>{task.instructorName}</span>
                  </div>
                </div>
              </div>

              <div className={styles.taskActions}>
                <button className={styles.viewButton}>
                  View Submission
                </button>
                
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating new assignments */}
      <CodingAssignmentModal 
        isOpen={showModal}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default CodingTasks;
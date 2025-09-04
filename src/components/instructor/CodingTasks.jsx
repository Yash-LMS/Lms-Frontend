import React, { useState, useEffect } from "react";
import CodingAssignmentModal from "./CodingAssignmentModal";
import styles from "./CodingTasks.module.css";
import InstructorSidebar from "./InstructorSidebar";
import { GET_ALL_CODING_TASK } from "../../constants/apiConstants";
import axios from "axios";
import ViewCodeSubmissionModal from "./ViewCodeSubmissionModal";

const CodingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("codingTask");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnology, setSelectedTechnology] = useState("");
  
  // States for submission modal
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const technologies = ["java", "c++", "python", "javascript"];

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
        setFilteredTasks(data.payload || []);
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

  // Filter tasks based on search term and technology
  useEffect(() => {
    let filtered = tasks;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.instructorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.taskId?.toString().includes(searchTerm)
      );
    }

    // Filter by technology
    if (selectedTechnology) {
      filtered = filtered.filter(task => 
        task.technology?.toLowerCase() === selectedTechnology.toLowerCase()
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, selectedTechnology]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleModalClose = () => {
    setShowModal(false);
    fetchTasks();
  };

  // Handle submission modal
  const handleViewSubmissions = (taskId) => {
    setSelectedTaskId(taskId);
    setShowSubmissionModal(true);
  };

  const handleSubmissionModalClose = () => {
    setShowSubmissionModal(false);
    setSelectedTaskId(null);
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
        <InstructorSidebar activeTab={activeTab} />
        <div className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading coding assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <InstructorSidebar activeTab={activeTab} />
      <div className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h1>Coding Assignments</h1>
          </div>
          <button 
            className={styles.createButton}
            onClick={() => setShowModal(true)}
          >
            <span className={styles.plusIcon}>+</span>
            Create New Assignment
          </button>

          <div className={styles.headerRight}>
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
            <select
              value={selectedTechnology}
              onChange={(e) => setSelectedTechnology(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Technologies</option>
              {technologies.map(tech => (
                <option key={tech} value={tech}>
                  {tech.charAt(0).toUpperCase() + tech.slice(1)}
                </option>
              ))}
            </select>
          </header>

          {(searchTerm || selectedTechnology) && (
            <div className={styles.searchResultsInfo}>
                        <p>
                          {filteredTasks.length === 0
                            ? "No Tasks match your search criteria"
                            : `Found ${filteredTasks.length} batch${
                                filteredTasks.length !== 1 ? "es" : ""
                              }`}
                        </p>
                        {(searchTerm || selectedTechnology !== "all") && (
                          <button
                            className={styles.clearFiltersBtn}
                            onClick={() => {
                              setSearchTerm("");
                              setSelectedTechnology("");
                            }}
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
          )}
          <>
            {(searchTerm || selectedTechnology) && (
              <div className={styles.resultsInfo}>
                Showing {filteredTasks.length} of {tasks.length} assignments
              </div>
            )}
            <div className={styles.tasksGrid}>
              {filteredTasks.map((task) => (
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
                      {task.dueDate && (
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>Due Date:</span>
                          <span className={styles.metaValue}>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.taskActions}>
                    <button 
                      className={styles.viewButton}
                      onClick={() => handleViewSubmissions(task.taskId)}
                    >
                      View Submissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>

        {/* Modal for creating new assignments */}
        <CodingAssignmentModal 
          isOpen={showModal}
          onClose={handleModalClose}
        />

        {/* Modal for viewing submissions */}
        {showSubmissionModal && (
          <ViewCodeSubmissionModal 
            taskId={selectedTaskId}
            isOpen={showSubmissionModal}
            onClose={handleSubmissionModalClose}
          />
        )}
      </div>
    </div>
  );
};

export default CodingTasks;
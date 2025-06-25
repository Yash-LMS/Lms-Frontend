import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateTopicFile, addNewTopic, deleteTopic, deleteSection, viewCourseDetails } from "../../features/course/courseActions";
import styles from "./EditSectionModal.module.css";
import axios from "axios";
import { TEST_INSTRUCTOR_URL } from "../../constants/apiConstants";

const EditSectionModal = ({ isOpen, onClose, section, onSubmit }) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [topics, setTopics] = useState([]);
  const { selectedCourse } = useSelector((state) => state.courses);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({
    topicName: "",
    topicType: "video",
    testId: null,
    topicDescription: "",
    file: null
  });
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setTopics(section.topics || []);
    }
  }, [section]);

  // Fetch tests when a test type is selected for new topic
  useEffect(() => {
    if (newTopic.topicType === "test") {
      fetchTests();
    }
  }, [newTopic.topicType]);

  const fetchTests = async () => {
    try {
      const { user, token } = getUserData();
      if (!user || !token) {
        console.error("User session data is missing");
        return;
      }
  
      const response = await axios.post(`${TEST_INSTRUCTOR_URL}`,
        {
          user: user,
          token: token
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );
      
      const data = response.data;
      
      if (data.response === "success") {
        setTests(data.payload);
      } else {
        console.error("Failed to fetch tests:", data.message);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
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

  const updateTopic = (topicIndex, field, value) => {
    setTopics(
      topics.map((topic, tIndex) => {
        if (tIndex === topicIndex) {
          return { ...topic, [field]: value };
        }
        return topic;
      })
    );
  };

  const handleFileSelect = (topicIndex, event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFiles(prev => ({
        ...prev,
        [topicIndex]: file
      }));
    }
  };

  const handleAddTopicClick = () => {
    setIsAddingTopic(true);
    setNewTopic({
      topicName: "",
      topicType: "video",
      testId: null,
      topicDescription: "",
      file: null
    });
    setSelectedTest(null);
  };

  const handleNewTopicFileSelect = (event) => {
    const file = event.target.files[0];
    setNewTopic(prev => ({
      ...prev,
      file: file
    }));
  };

  const handleTestSelection = (event) => {
    const testId = parseInt(event.target.value);
    const selectedTest = tests.find(test => test.testId === testId);
    
    if (selectedTest) {
      setSelectedTest(selectedTest);
      // Update the new topic with the test name and ID
      setNewTopic(prev => ({
        ...prev,
        topicName: selectedTest.testName,
        testId: selectedTest.testId
      }));
    } else {
      setSelectedTest(null);
      setNewTopic(prev => ({
        ...prev,
        testId: null,
        topicName: ""
      }));
    }
  };

  const handleTopicTypeChange = (e) => {
    const newType = e.target.value;
    setNewTopic(prev => ({
      ...prev,
      topicType: newType,
      // Reset testId when changing away from test type
      testId: newType === "test" ? prev.testId : null
    }));
    
    // If switching to test type, fetch tests
    if (newType === "test") {
      fetchTests();
    }
  };

  const handleExistingTopicTypeChange = (topicIndex, newType) => {
    // If changing away from test type, reset testId
    if (topics[topicIndex].topicType === "test" && newType !== "test") {
      updateTopic(topicIndex, "testId", null);
    }
    
    updateTopic(topicIndex, "topicType", newType);
    
    // If switching to test type, fetch tests for this topic
    if (newType === "test" && tests.length === 0) {
      fetchTests();
    }
  };

  const handleExistingTopicTestSelection = (topicIndex, testId) => {
    const testId_int = parseInt(testId);
    const selectedTest = tests.find(test => test.testId === testId_int);
    
    if (selectedTest) {
      // Update both the test ID and the topic name
      updateTopic(topicIndex, "testId", testId_int);
      updateTopic(topicIndex, "topicName", selectedTest.testName);
    } else {
      updateTopic(topicIndex, "testId", null);
      updateTopic(topicIndex, "topicName", "");
    }
  };

  const handleSaveNewTopic = async () => {
    const { user, token } = getUserData();
    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    // Validate for test type selection
    if (newTopic.topicType === "test" && !newTopic.testId) {
      alert("Please select a test from the dropdown.");
      return;
    }

    try {
      const topicData = {
        topicName: newTopic.topicName,
        topicType: newTopic.topicType,
        topicDescription: newTopic.topicDescription || ''
      };

      // Add testId if this is a test type topic
      if (newTopic.topicType === "test" && newTopic.testId) {
        topicData.testId = newTopic.testId;
      }

      const resultAction = await dispatch(
        addNewTopic({
          courseId: selectedCourse.courseId,
          sectionId: section.sectionId,
          topics: [topicData],
          user,
          token,
          file: newTopic.file
        })
      );

      if (addNewTopic.fulfilled.match(resultAction)) {
        const addedTopic = resultAction.payload.payload;
        setTopics([...topics, addedTopic]);
        
        // Reset new topic state and close add topic form
        setNewTopic({
          topicName: "",
          topicType: "video",
          testId: null,
          topicDescription: "",
          file: null
        });
        setIsAddingTopic(false);
        setSelectedTest(null);

        // Refresh course details to reflect changes
        await dispatch(viewCourseDetails({
          courseId: selectedCourse.courseId,
          user,
          token
        }));

        // Close the modal after saving
        onClose();
      } else {
        throw new Error("Failed to add topic");
      }
    } catch (error) {
      console.error("Add topic failed:", error);
      alert("Failed to add topic: " + error.message);
    }
  };

  const handleSave = async () => {
    // Validate for test type selections
    const invalidTestTopic = topics.find(topic => 
      topic.topicType === "test" && !topic.testId
    );

    if (invalidTestTopic) {
      alert("Please select a test for all test-type topics before saving.");
      return;
    }

    const updatedSection = {
      ...section,
      title,
      topics,
    };

    // Upload files for each topic if a file is selected
    for (const [index, file] of Object.entries(selectedFiles)) {
      const topic = topics[index];
      const { user, token } = getUserData();

      if (!user || !token) {
        alert("User session data is missing. Please log in again.");
        return;
      }

      try {
        const resultAction = await dispatch(
          updateTopicFile({
            topicId: topic.topicId,
            file,
            user,
            token,
          })
        );

        if (updateTopicFile.fulfilled.match(resultAction)) {
          // Update the topic based on topic type
          if (topic.topicType === "video") {
            updateTopic(index, "videoURL", resultAction.payload.fileUrl);
          } else if (topic.topicType === "docs") {
            updateTopic(index, "docsURL", resultAction.payload.fileUrl);
          }
          updateTopic(index, "file", resultAction.payload.fileUrl);
        } else {
          throw new Error("Failed to upload file");
        }
      } catch (error) {
        console.error("File upload failed:", error);
        alert("Failed to upload file: " + error.message);
      }
    }

    onSubmit(updatedSection);
    onClose(); // Close the modal after saving changes
  };

  const handleRemoveTopic = async (topicIndex) => {
    const { user, token } = getUserData();

    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    try {
      const topicToRemove = topics[topicIndex];

      const resultAction = await dispatch(
        deleteTopic({
          topicId: topicToRemove.topicId,
          user,
          token
        })
      );

      if (deleteTopic.fulfilled.match(resultAction)) {
        const updatedTopics = topics.filter((_, index) => index !== topicIndex);
        setTopics(updatedTopics);

        // Refresh course details to reflect changes
        await dispatch(viewCourseDetails({
          courseId: selectedCourse.courseId,
          user,
          token
        }));

        // Close the modal after removing
        onClose();
      } else {
        throw new Error("Failed to delete topic");
      }
    } catch (error) {
      console.error("Delete topic failed:", error);
      alert("Failed to delete topic: " + error.message);
    }
  };

  const handleRemoveSection = async () => {
    const { user, token } = getUserData();

    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    try {
      const resultAction = await dispatch(
        deleteSection({
          sectionId: section.sectionId,
          user,
          token
        })
      );

      if (deleteSection.fulfilled.match(resultAction)) {
        // Refresh course details to reflect changes
        await dispatch(viewCourseDetails({
          courseId: selectedCourse.courseId,
          user,
          token
        }));

        // Close the modal after removing
        onClose();
      } else {
        throw new Error("Failed to delete section");
      }
    } catch (error) {
      console.error("Delete section failed:", error);
      alert("Failed to delete section: " + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <h2>{section.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Section Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter section title"
              className={styles.formControl}
            />
          </div>
          
          <div className={styles.actionBar}>
            {!isAddingTopic && (
              <button onClick={handleAddTopicClick} className={styles.addButton}>
                <span className={styles.addIcon}>+</span> Add Topic
              </button>
            )}
          </div>
          
          {/* New Topic Form */}
          {isAddingTopic && (
            <div className={styles.newTopicPanel}>
              <h3 className={styles.panelTitle}>Add New Topic</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Topic Type</label>
                <select
                  value={newTopic.topicType}
                  onChange={handleTopicTypeChange}
                  className={styles.formSelect}
                >
                  <option value="video">Video</option>
                  <option value="docs">Documentation</option>
                  <option value="test">Test/Quiz</option>
                </select>
              </div>

              {newTopic.topicType !== "test" && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Topic Name</label>
                  <input
                    type="text"
                    value={newTopic.topicName}
                    onChange={(e) => setNewTopic(prev => ({
                      ...prev,
                      topicName: e.target.value
                    }))}
                    placeholder="Enter topic name"
                    className={styles.formControl}
                  />
                </div>
              )}

              {newTopic.topicType === "test" && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Test</label>
                  <select
                    value={newTopic.testId || ""}
                    onChange={handleTestSelection}
                    className={styles.formSelect}
                  >
                    <option value="">Select a Test</option>
                    {tests.map(test => (
                      <option key={test.testId} value={test.testId}>
                        {test.testName} ({test.duration} min)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(newTopic.topicType === "video" || newTopic.topicType === "docs") && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Upload {newTopic.topicType === "video" ? "Video" : "Document"}
                  </label>
                  <div className={styles.uploadWrapper}>
                    <input
                      type="file"
                      onChange={handleNewTopicFileSelect}
                      className={styles.fileInput}
                      id="newTopicFileUpload"
                      accept={
                        newTopic.topicType === "video"
                          ? "video/*"
                          : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      }
                    />
                    <label
                      htmlFor="newTopicFileUpload"
                      className={styles.uploadButton}
                    >
                      Choose File
                    </label>
                    
                    {newTopic.file && (
                      <span className={styles.fileName}>
                        {newTopic.file.name}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                <button 
                  onClick={() => {
                    setIsAddingTopic(false);
                    setNewTopic({
                      topicName: "",
                      topicType: "video",
                      testId: null,
                      topicDescription: "",
                      file: null
                    });
                    setSelectedTest(null);
                  }}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveNewTopic}
                  className={styles.primaryButton}
                  disabled={!newTopic.topicName || (newTopic.topicType === "test" && !newTopic.testId)}
                >
                  Add Topic
                </button>
              </div>
            </div>
          )}
          
          <div className={styles.existingTopicsSection}>
            <h3 className={styles.sectionTitle}>Topics</h3>
            
            {topics.length === 0 ? (
              <div className={styles.emptyState}>
                No topics added yet. Click "Add Topic" to create one.
              </div>
            ) : (
              topics.map((topic, index) => (
                <div key={index} className={styles.topicCard}>
                  <div className={styles.topicCardHeader}>
                    <span className={styles.topicType}>{topic.topicName} ({topic.topicType})</span>
                    <button 
                      onClick={() => handleRemoveTopic(index)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.topicCardBody}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Topic Type</label>
                      <select
                        value={topic.topicType}
                        onChange={(e) => handleExistingTopicTypeChange(index, e.target.value)}
                        className={styles.formSelect}
                      >
                        <option value="video">Video</option>
                        <option value="docs">Documentation</option>
                        <option value="test">Test/Quiz</option>
                      </select>
                    </div>

                    {topic.topicType !== "test" && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Topic Name</label>
                        <input
                          type="text"
                          value={topic.topicName}
                          onChange={(e) => updateTopic(index, "topicName", e.target.value)}
                          placeholder="Enter topic name"
                          className={styles.formControl}
                        />
                      </div>
                    )}

                    {topic.topicType === "test" && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Select Test</label>
                        <select
                          value={topic.testId || ""}
                          onChange={(e) => handleExistingTopicTestSelection(index, e.target.value)}
                          className={styles.formSelect}
                        >
                          <option value="">Select a Test</option>
                          {tests.map(test => (
                            <option key={test.testId} value={test.testId}>
                              {test.testName} ({test.duration} min)
                            </option>
                          ))}
                        </select>
                        
                        {topic.testId && (
                          <div className={styles.testDetail}>
                            <span className={styles.testIdBadge}>Test ID: {topic.testId}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(topic.topicType === "video" || topic.topicType === "docs") && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Upload {topic.topicType === "video" ? "Video" : "Document"}
                        </label>
                        <div className={styles.uploadWrapper}>
                          <input
                            type="file"
                            onChange={handleFileSelect.bind(null, index)}
                            className={styles.fileInput}
                            id={`fileUpload-${index}`}
                            accept={
                              topic.topicType === "video"
                                ? "video/*"
                                : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            }
                          />
                          <label
                            htmlFor={`fileUpload-${index}`}
                            className={styles.uploadButton}
                          >
                            Choose File
                          </label>
                          
                          {(topic.topicType === "video" && topic.videoURL) && (
                            <span className={styles.fileName}>
                              {topic.videoURL.split('/').pop()}
                            </span>
                          )}
                          {(topic.topicType === "docs" && topic.docsURL) && (
                            <span className={styles.fileName}>
                              {topic.docsURL.split('/').pop()}
                            </span>
                          )}

                          {selectedFiles[index] && (
                            <span className={styles.fileName}>
                              {selectedFiles[index].name}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryButton} onClick={handleSave}>
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditSectionModal;
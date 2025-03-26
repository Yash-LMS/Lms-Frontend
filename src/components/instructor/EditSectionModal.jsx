import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateTopicFile, addNewTopic, deleteTopic, deleteSection, viewCourseDetails } from "../../features/course/courseActions";
import styles from "./EditSectionModal.module.css";

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
    topicDescription: "",
    file: null
  });

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setTopics(section.topics || []);
    }
  }, [section]);

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
      topicDescription: "",
      file: null
    });
  };

  const handleNewTopicFileSelect = (event) => {
    const file = event.target.files[0];
    setNewTopic(prev => ({
      ...prev,
      file: file
    }));
  };

  const handleSaveNewTopic = async () => {
    const { user, token } = getUserData();
    if (!user || !token) {
      alert("User  session data is missing. Please log in again.");
      return;
    }

    try {
      const resultAction = await dispatch(
        addNewTopic({
          courseId: selectedCourse.courseId,
          sectionId: section.sectionId,
          topics: [{
            topicName: newTopic.topicName,
            topicType: newTopic.topicType,
            topicDescription: newTopic.topicDescription || ''
          }],
          user,
          token,
          file: newTopic.file // Only send the file when saving the new topic
        })
      );

      if (addNewTopic.fulfilled.match(resultAction)) {
        const addedTopic = resultAction.payload.payload;
        setTopics([...topics, addedTopic]);
        
        // Reset new topic state and close add topic form
        setNewTopic({
          topicName: "",
          topicType: "video",
          topicDescription: "",
          file: null
        });
        setIsAddingTopic(false);

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
        alert("User  session data is missing. Please log in again.");
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
      alert("User  session data is missing. Please log in again.");
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

  // New function to handle section deletion
  const handleRemoveSection = async () => {
    const { user, token } = getUserData();

    if (!user || !token) {
      alert("User  session data is missing. Please log in again.");
      return;
    }

    try {
      const resultAction = await dispatch(
        deleteSection({
          sectionId: section.sectionId, // Send sectionId as parameter
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
          <h2>Edit Section: {section.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>
        <div className={styles.modalBody}>
          <div className={styles.sectionTitleContainer}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Section Title"
              className={styles.sectionTitleInput}
            />
            {/* <button 
              onClick={handleRemoveSection} // Add delete section button
              className={styles.removeSectionButton}
            >
              Delete Section
            </button> */}
            {!isAddingTopic && (
              <button 
                onClick={handleAddTopicClick} 
                className={styles.addTopicButton}
              >
                + Add Topic
              </button>
            )}
          </div>
          
          {/* New Topic Form */}
          {isAddingTopic && (
            <div className={styles.newTopicForm}>
              <div className={styles.topicRow}>
                <input
                  type="text"
                  value={newTopic.topicName}
                  onChange={(e) => setNewTopic(prev => ({
                    ...prev,
                    topicName: e.target.value
                  }))}
                  placeholder="Topic Name"
                  className={styles.topicInput}
                />
                <select
                  value={newTopic.topicType}
                  onChange={(e) => setNewTopic(prev => ({
                    ...prev,
                    topicType: e.target.value
                  }))}
                  className={`${styles.topicInput} ${styles.topicTypeSelect}`}
                >
                  <option value="video">Video</option>
                  <option value="docs">Documentation</option>
                  <option value="test">Test/Quiz</option>
                </select>
              </div>

              {(newTopic.topicType === "video" || newTopic.topicType === "docs") && (
                <div className={styles.uploadContainer}>
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
                    Upload {newTopic.topicType === "video" ? "Video" : "Document"}
                  </label>
                  
                  {newTopic.file && (
                    <span className={styles.fileName}>
                      {newTopic.file.name}
                    </span>
                  )}
                </div>
              )}

              <div className={styles.newTopicActions}>
                <button 
                  onClick={handleSaveNewTopic} // Save new topic and changes
                  className={styles.saveButton}
                  disabled={!newTopic.topicName}
                >
                  Save Topic
                </button>
                <button 
                  onClick={() => {
                    setIsAddingTopic(false);
                    setNewTopic({
                      topicName: "",
                      topicType: "video",
                      topicDescription: "",
                      file: null
                    });
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <h3>Existing Topics</h3>
          {topics.map((topic, index) => (
            <div key={index} className={styles.topicRow}>
              <input
                type="text"
                value={topic.topicName}
                onChange={(e) =>
                  updateTopic(index, "topicName", e.target.value)
                }
                placeholder="Topic Name"
                className={styles.topicInput}
              />
              <div className={styles.topicTypeContainer}>
                <select
                  value={topic.topicType}
                  onChange={(e) =>
                    updateTopic(index, "topicType", e.target.value)
                  }
                  className={`${styles.topicInput} ${styles.topicTypeSelect}`}
                >
                  <option value="video">Video</option>
                  <option value="docs">Documentation</option>
                  <option value="test">Test/Quiz</option>
                </select>
              </div>

              <div className={styles.topicActionButtons}>
                <button 
                  onClick={() => handleRemoveTopic(index)} // Directly remove topic
                  className={styles.removeTopicButton}
                >
                  Remove
                </button>
              </div>

              <div className={styles.topicResourceInputs}>
                {(topic.topicType === "video" ||
                  topic.topicType === "docs") && (
                  <div className={styles.uploadContainer}>
                    <input
                      type="file"
                      onChange={handleFileSelect.bind(null, index)} // Bind index to the function
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
                      Upload{" "}
                      {topic.topicType === "video" ? "Video" : "Document"}
                    </label>
                    
                    {(topic.topicType === "video" && topic.videoURL) && (
                      <span className={styles.fileName}>
                        {topic.videoURL}
                      </span>
                    )}
                    {(topic.topicType === "docs" && topic.docsURL) && (
                      <span className={styles.fileName}>
                        {topic.docsURL}
                      </span>
                    )}

                    {selectedFiles[index] && (
                      <span className={styles.fileName}>
                        {selectedFiles[index].name}
                      </span>
                    )}
                  </div>
                )}

                {topic.topicType === "test" && (
                  <div className={styles.testInfo}>
                    <p>Test configuration will be added separately.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.saveButton} onClick={handleSave}>
            Save Changes
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditSectionModal;
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addNewSection, viewCourse } from "../../features/course/courseActions";
import styles from "./CourseDetails.module.css";
import { TEST_INSTRUCTOR_URL } from "../../constants/apiConstants";
import axios from "axios";

const CourseDetailsForm = ({ course, onCancel }) => {
  const dispatch = useDispatch();
  const { loading: globalLoading, error } = useSelector(
    (state) => state.courses
  );
  const [sections, setSections] = useState([{ title: "", topics: [] }]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [savingSectionIndex, setSavingSectionIndex] = useState(null); // Track which section is being saved
  const [testList, setTestList] = useState([]);

  // Get user data with role from user object
  const getUserData = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = sessionStorage.getItem("token");
      return {
        user,
        token,
        role: user?.role || null,
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  const fetchTestList = async () => {
    try {
      console.log("Test List");
      const userData = getUserData();
      if (!userData.user || !userData.token) {
        console.error("Missing user data or token");
        return;
      }

      const response = await axios.post(`${TEST_INSTRUCTOR_URL}`, {
        user: userData.user,
        token: userData.token,
      });

      if ((response.data.response = "success")) {
        setTestList(response.data.payload);
      } else {
        setTestList([]);
      }
    } catch (error) {
      console.error("Error fetching test list:", error);
      setTestList([]);
    }
  };

  useEffect(() => {
    fetchTestList();
  }, []);

  useEffect(() => {
    // Initialize with existing course sections if available
    if (course && course.sections && course.sections.length > 0) {
      setSections(
        course.sections.map((section) => ({
          title: section.title,
          topics: section.topics || [],
        }))
      );
    }
  }, [course]);

  const fetchCourses = async () => {
    try {
      await dispatch(viewCourse());
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const addSection = () => {
    if (isUploading || savingSectionIndex !== null) {
      setErrorMessage("Please wait for the current operation to complete");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }
    setSections([...sections, { title: "", topics: [] }]);
  };

  const removeSection = (sectionIndex) => {
    if (isUploading || savingSectionIndex !== null) {
      setErrorMessage("Please wait for the current operation to complete");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }
    setSections(sections.filter((_, index) => index !== sectionIndex));
  };

  const updateSectionTitle = (sectionIndex, title) => {
    if (savingSectionIndex !== null && savingSectionIndex === sectionIndex) {
      return; // Don't allow editing while saving this section
    }
    setSections(
      sections.map((section, index) =>
        index === sectionIndex ? { ...section, title } : section
      )
    );
  };

  const addTopic = (sectionIndex) => {
    if (isUploading || savingSectionIndex !== null) {
      setErrorMessage("Please wait for the current operation to complete");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    setSections(
      sections.map((section, index) => {
        if (index === sectionIndex) {
          const lastTopicId =
            section.topics.length > 0
              ? Math.max(
                  ...section.topics.map((topic) => parseInt(topic.topicId) || 0)
                )
              : 0;
          const newTopicId = lastTopicId + 1;

          return {
            ...section,
            topics: [
              ...section.topics,
              {
                topicId: `${newTopicId}`,
                topicName: "",
                topicType: "video",
                videoURL: "",
                docsURL: "",
                testId: "",
                file: `${newTopicId}`,
              },
            ],
          };
        }
        return section;
      })
    );
  };

  const removeTopic = (sectionIndex, topicIndex) => {
    if (isUploading || savingSectionIndex !== null) {
      setErrorMessage("Please wait for the current operation to complete");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    setSections(
      sections.map((section, index) => {
        if (index === sectionIndex) {
          return {
            ...section,
            topics: section.topics.filter((_, tIndex) => tIndex !== topicIndex),
          };
        }
        return section;
      })
    );
  };

  const updateTopic = (sectionIndex, topicIndex, field, value) => {
    if (savingSectionIndex !== null && savingSectionIndex === sectionIndex) {
      return; // Don't allow editing while saving this section
    }

    setSections(
      sections.map((section, index) => {
        if (index === sectionIndex) {
          return {
            ...section,
            topics: section.topics.map((topic, tIndex) => {
              if (tIndex === topicIndex) {
                // Special handling for test type
                if (field === "testId") {
                  const selectedTest = testList.find(
                    (test) => String(test.testId) === String(value) // Ensure type consistency
                  );
                  console.log("Selected Test:", selectedTest); // Debugging
                  return {
                    ...topic,
                    [field]: value,
                    topicName: selectedTest ? selectedTest.testName : "", // Set to test name
                    topicNameCustom: false, // Reset custom name flag
                  };
                }

                // Allow manual editing of topicName if it's not a test
                if (field === "topicName" && topic.topicType === "test") {
                  return {
                    ...topic,
                    [field]: value,
                    topicNameCustom: true, // Mark as manually edited
                  };
                }

                return { ...topic, [field]: value };
              }
              return topic;
            }),
          };
        }
        return section;
      })
    );
  };

  const handleFileUpload = (sectionIndex, topicIndex, e) => {
    if (savingSectionIndex !== null) {
      e.preventDefault();
      setErrorMessage("Please wait for the current section to be saved");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    const file = e.target.files[0];
    if (file) {
      // Set global uploading state
      setIsUploading(true);

      // Show loading message
      setSuccessMessage("Uploading file... Please wait");

      // Process the file (simulate with timeout)
      setTimeout(() => {
        setSections(
          sections.map((section, index) => {
            if (index === sectionIndex) {
              return {
                ...section,
                topics: section.topics.map((topic, tIndex) => {
                  if (tIndex === topicIndex) {
                    const updatedFile = new File(
                      [file],
                      `${topic.topicId}_${file.name}`,
                      { type: file.type }
                    );
                    return {
                      ...topic,
                      file: updatedFile,
                      videoURL:
                        topic.topicType === "video"
                          ? updatedFile.name
                          : topic.videoURL,
                      docsURL:
                        topic.topicType === "docs"
                          ? updatedFile.name
                          : topic.docsURL,
                    };
                  }
                  return topic;
                }),
              };
            }
            return section;
          })
        );

        // Clear uploading state
        setIsUploading(false);
        setSuccessMessage("File uploaded successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }, 1500); // Simulate upload delay
    }
  };

  const saveSectionToBackend = async (sectionIndex) => {
    // Prevent action if already uploading or saving another section
    if (
      isUploading ||
      (savingSectionIndex !== null && savingSectionIndex !== sectionIndex)
    ) {
      setErrorMessage("Please wait for the current operation to complete");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    const section = sections[sectionIndex];

    if (!section || !section.title.trim()) {
      setErrorMessage("Please enter a section title before saving");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    // Set the saving section index to show loading UI
    setSavingSectionIndex(sectionIndex);

    // Show saving message
    setSuccessMessage("Saving section... Please wait");

    const sectionData = {
      title: section.title,
      topics: section.topics.map((topic) => ({
        topicId: topic.topicId,
        topicName: topic.topicName,
        topicType: topic.topicType,
        testId: topic.testId,
        videoURL: topic.videoURL || "",
        docsURL: topic.docsURL || "",
      })),
    };

    console.log(sectionData);

    const { user, token } = getUserData();
    const courseId = parseInt(course.courseId, 10) || 0;

    const files = [];
    let totalFileSize = 0;

    section.topics.forEach((topic) => {
      if (topic.file && topic.file instanceof File) {
        files.push(topic.file);
        totalFileSize += topic.file.size;
      }
    });

    const maxFileSize = 500 * 1024 * 1024; // 500 MB in bytes
    if (totalFileSize > maxFileSize) {
      setErrorMessage(
        "The total file size exceeds the 500 MB limit. Please reduce the file sizes."
      );
      setTimeout(() => setErrorMessage(""), 5000);
      setSavingSectionIndex(null);
      return;
    }

    const payload = {
      section: sectionData,
      courseId: courseId,
      course: { ...course },
      user,
      token,
      files: files.length > 0 ? files : [],
    };

    console.log("Sending section payload:", payload);

    try {
      // If there are files to upload, show a longer message
      if (files.length > 0) {
        setSuccessMessage(
          `Uploading ${files.length} file(s) and saving section... This may take a moment`
        );
      }

      const result = await dispatch(addNewSection(payload));

      if (result.meta.requestStatus === "fulfilled") {
        setSuccessMessage(`Section '${sectionData.title}' added successfully!`);
        setTimeout(() => setSuccessMessage(""), 5000);
        setSections(
          sections.map((s, idx) =>
            idx === sectionIndex ? { title: "", topics: [] } : s
          )
        );
      } else {
        setErrorMessage(result.error?.message || "Failed to save section");
        setTimeout(() => setErrorMessage(""), 5000);
        console.error("Failed to save section", result.error);
      }
    } catch (error) {
      setErrorMessage(error.message || "Error saving section");
      setTimeout(() => setErrorMessage(""), 5000);
      console.error("Error saving section:", error);
    } finally {
      // Re-fetch course details regardless of success or error
      await fetchCourses();
      // Clear saving section index
      setSavingSectionIndex(null);
    }
  };

  // Check if any section is being saved (for global UI state)
  const isSaving = savingSectionIndex !== null;

  return (
    <div className={styles.courseDetailsForm}>
      <header className={styles.formHeader}>
        <h2>Course Details: {course.courseName}</h2>
      </header>

      {error && (
        <div className={styles.errorAlert}>
          {error.message || "An error occurred"}
        </div>
      )}

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      {successMessage && (
        <div className={styles.successMessage}>{successMessage}</div>
      )}

      {/* Global loading overlay when saving a section */}
      {isSaving && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Saving section... Please wait</p>
        </div>
      )}

      <div className={styles.sectionsContainer}>
        <div className={styles.sectionHeader}>
          <h3>Course Sections</h3>
          <button
            type="button"
            onClick={addSection}
            className={styles.addButton}
            disabled={isSaving || isUploading}
          >
            + Add Section
          </button>
        </div>

        {sections.map((section, sectionIndex) => {
          const isSavingThisSection = savingSectionIndex === sectionIndex;

          return (
            <div
              key={sectionIndex}
              className={`${styles.sectionBox} ${
                isSavingThisSection ? styles.savingSection : ""
              }`}
            >
              <div className={styles.sectionTitleRow}>
                <input
                  type="text"
                  placeholder="Section Title"
                  value={section.title}
                  onChange={(e) =>
                    updateSectionTitle(sectionIndex, e.target.value)
                  }
                  className={styles.sectionTitle}
                  disabled={isSaving || isUploading}
                  required
                />
                <button
                  type="button"
                  onClick={() => saveSectionToBackend(sectionIndex)}
                  className={styles.saveButton}
                  disabled={isSaving || isUploading || globalLoading}
                >
                  {isSavingThisSection ? "Saving..." : "Save Section"}
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(sectionIndex)}
                  className={styles.removeButton}
                  disabled={isSaving || isUploading}
                >
                  Remove Section
                </button>
              </div>

              <div className={styles.topicsContainer}>
                <div className={styles.topicHeader}>
                  <h4>Topics</h4>
                  <button
                    type="button"
                    onClick={() => addTopic(sectionIndex)}
                    className={styles.addTopicButton}
                    disabled={isSaving || isUploading}
                  >
                    + Add Topic
                  </button>
                </div>

                {section.topics.map((topic, topicIndex) => (
                  <div key={topicIndex} className={styles.topicBox}>
                    <div className={styles.topicRow}>
                      <input
                        type="text"
                        placeholder="Topic Name"
                        value={topic.topicName} // Always show the current topicName
                        onChange={(e) =>
                          updateTopic(
                            sectionIndex,
                            topicIndex,
                            "topicName",
                            e.target.value
                          )
                        }
                        className={styles.topicInput}
                        required
                      />

                      <select
                        value={topic.topicType}
                        onChange={(e) =>
                          updateTopic(
                            sectionIndex,
                            topicIndex,
                            "topicType",
                            e.target.value
                          )
                        }
                        className={styles.topicTypeSelect}
                        required
                      >
                        <option value="video">Video</option>
                        <option value="docs">Documentation</option>
                        <option value="test">Test/Quiz</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeTopic(sectionIndex, topicIndex)}
                        className={styles.removeTopicButton}
                      >
                        Remove
                      </button>
                    </div>

                    {(topic.topicType === "video" ||
                      topic.topicType === "docs") && (
                      <div className={styles.uploadContainer}>
                        <div className={styles.fileInputWrapper}>
                          <input
                            type="file"
                            id={`file-${sectionIndex}-${topicIndex}`}
                            onChange={(e) =>
                              handleFileUpload(sectionIndex, topicIndex, e)
                            }
                            className={styles.fileInput}
                            disabled={isSaving || isUploading}
                            accept={
                              topic.topicType === "video"
                                ? "video/*"
                                : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            }
                          />
                          <label
                            htmlFor={`file-${sectionIndex}-${topicIndex}`}
                            className={`${styles.uploadButton} ${
                              isSaving || isUploading
                                ? styles.disabledButton
                                : ""
                            }`}
                          >
                            {isUploading
                              ? "Uploading..."
                              : `Upload ${
                                  topic.topicType === "video"
                                    ? "Video"
                                    : "Document"
                                }`}
                          </label>
                        </div>

                        {topic.videoURL && (
                          <div className={styles.fileInfo}>
                            <span>Selected file: {topic.videoURL}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateTopic(
                                  sectionIndex,
                                  topicIndex,
                                  "videoURL",
                                  ""
                                )
                              }
                              className={styles.clearFileButton}
                              disabled={isSaving || isUploading}
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {topic.topicType === "test" && (
                      <div className={styles.testInfo}>
                        <label
                          htmlFor={`testSelect-${sectionIndex}-${topicIndex}`}
                        >
                          Select a Test:
                        </label>
                        <select
                          id={`testSelect-${sectionIndex}-${topicIndex}`}
                          value={topic.testId || ""}
                          onChange={(e) =>
                            updateTopic(
                              sectionIndex,
                              topicIndex,
                              "testId",
                              e.target.value
                            )
                          }
                          className={styles.testSelect}
                        >
                          <option value="">Select Test</option>
                          {!testList || testList.length === 0 ? (
                            <option disabled>No tests available</option>
                          ) : (
                            testList.map((test) => (
                              <option key={test.testId} value={test.testId}>
                                {test.testName}
                              </option>
                            ))
                          )}
                        </select>
                        {(!testList || testList.length === 0) && (
                          <p className={styles.errorMessage}>
                            No tests are currently available. Please contact
                            support or create a test first.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {section.topics.length === 0 && (
                  <p className={styles.noTopics}>
                    No topics added yet. Add a topic.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isSaving || isUploading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CourseDetailsForm;

import { createSlice } from "@reduxjs/toolkit";
import {
  addNewCourse,
  addNewSection,
  viewCourse,
  editCourseDetail,
  viewCourseDetails,
  editSectionDetail,
  deleteTopicFile,
  updateTopicFile,
  addNewTopic,
  deleteTopic
} from "./courseActions";

const courseSlice = createSlice({
  name: "courses",
  initialState: {
    courses: [],
    selectedCourse: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addNewCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewCourse.fulfilled, (state, action) => {
        state.loading = false;
        console.log("New course added:", action.payload.payload);
        if (state.courses === null) {
          state.courses = [];
        }
        state.courses.push(action.payload.payload);
      })
      .addCase(addNewCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addNewSection.fulfilled, (state, action) => {
        state.loading = false;

        const courseId = action.meta.arg.courseId;
        const section = action.meta.arg.section;

        // Find the course to which the section belongs
        const courseIndex = state.courses.findIndex(
          (course) => course.courseId === courseId
        );

        if (courseIndex !== -1 && section) {
          // Initialize sections array if it doesn't exist
          if (!state.courses[courseIndex].sections) {
            state.courses[courseIndex].sections = [];
          }

          // Clean up the section object before adding it to state
          // Remove file objects since they can't be serialized
          const cleanedSection = {
            ...section,
            courseId: courseId, // Add courseId to the section
            course: { courseId: courseId }, // Add course object with courseId
            topics: section.topics.map((topic) => {
              const { file, ...rest } = topic;
              // Add section reference to each topic with courseId
              return {
                ...rest,
                courseId: courseId, // Add courseId to each topic as well
              };
            }),
          };

          // Add the new section to the appropriate course with courseId
          state.courses[courseIndex].sections.push(cleanedSection);

          // If the selectedCourse matches this courseId, update it too
          if (
            state.selectedCourse &&
            state.selectedCourse.courseId === courseId
          ) {
            if (!state.selectedCourse.sections) {
              state.selectedCourse.sections = [];
            }
            state.selectedCourse.sections.push(cleanedSection);
          }
        }
      })
      .addCase(addNewSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Store error message
      })
      .addCase(viewCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(viewCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.payload;
      })
      .addCase(viewCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Store error message
      })
      .addCase(editCourseDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editCourseDetail.fulfilled, (state, action) => {
        state.loading = false;
        // Extract the course object from the payload structure
        const updatedCourse =
          action.payload.payload || action.payload.course || action.payload;
        console.log("Updated course:", updatedCourse);

        // Check if updatedCourse has courseId property
        if (updatedCourse && updatedCourse.courseId) {
          const courseIndex = state.courses.findIndex(
            (course) => course.courseId === updatedCourse.courseId
          );
          if (courseIndex !== -1) {
            state.courses[courseIndex] = updatedCourse; // Update the course in the state
          }
        } else {
          console.error("Invalid updated course structure:", updatedCourse);
        }
      })
      .addCase(editCourseDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(viewCourseDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(viewCourseDetails.fulfilled, (state, action) => {
        state.loading = false;
        console.log("Course details:", action.payload.payload);
        state.selectedCourse = action.payload.payload;
      })
      .addCase(viewCourseDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || {
          message: "Failed to fetch course details",
        };
      })
      .addCase(editSectionDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editSectionDetail.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSection = action.payload;
        // Update the selectedCourse with the new section details
        if (state.selectedCourse) {
          const sectionIndex = state.selectedCourse.sectionList.findIndex(
            (section) => section.sectionId === updatedSection.sectionId
          );
          if (sectionIndex !== -1) {
            state.selectedCourse.sectionList[sectionIndex] = updatedSection; // Update the section in the state
          }
        }
      })
      .addCase(editSectionDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteTopicFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTopicFile.fulfilled, (state, action) => {
        state.loading = false;

        // Ensure state.courses is an array before processing
        if (!Array.isArray(state.courses)) {
          console.warn("Courses is not an array", state.courses);
          state.courses = []; // Initialize as empty array if undefined
          return;
        }

        // Get the topicId from the action meta
        const { topicId } = action.meta.arg;

        // Safely find the course containing the topic
        const courseIndex = state.courses.findIndex((course) => {
          // Ensure course.sections is an array
          if (!Array.isArray(course.sections)) {
            console.warn("Sections is not an array for course", course);
            return false;
          }

          return course.sections.some((section) => {
            // Ensure section.topics is an array
            if (!Array.isArray(section.topics)) {
              console.warn("Topics is not an array for section", section);
              return false;
            }

            return section.topics.some((topic) => topic.topicId === topicId);
          });
        });

        // If a matching course is found
        if (courseIndex !== -1) {
          const course = state.courses[courseIndex];

          // Find the section containing the topic
          const sectionIndex = course.sections.findIndex(
            (section) =>
              // Ensure section.topics is an array
              Array.isArray(section.topics) &&
              section.topics.some((topic) => topic.topicId === topicId)
          );

          // If a matching section is found
          if (sectionIndex !== -1) {
            const section = course.sections[sectionIndex];

            // Find and remove the topic
            const topicIndex = section.topics.findIndex(
              (topic) => topic.topicId === topicId
            );

            if (topicIndex !== -1) {
              // Remove the topic from the section
              section.topics.splice(topicIndex, 1);
            }
          }
        }
      })
      .addCase(deleteTopicFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to delete topic file";
      })
      .addCase(updateTopicFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTopicFile.fulfilled, (state, action) => {
        state.loading = false;
        // Update the specific topic file if needed
        if (state.selectedCourse) {
          state.selectedCourse.sectionList.forEach((section) => {
            section.topics.forEach((topic) => {
              if (topic.topicId === action.payload.topicId) {
                topic.file = action.payload.fileUrl;
                topic.videoURL = action.payload.fileUrl;
              }
            });
          });
        }
      })
      .addCase(updateTopicFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || {
          message: "Failed to update topic file",
        };
      })
      .addCase(addNewTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNewTopic.fulfilled, (state, action) => {
        state.loading = false;
      
        const { courseId, sectionId } = action.meta.arg;
        const newTopic = action.payload?.payload;
      
        // Ensure state.courses exists and is an array
        if (!state.courses || !Array.isArray(state.courses)) {
          return state;
        }
      
        // Update courses array
        const courseIndex = state.courses.findIndex(
          (course) => course.courseId === courseId
        );
        if (courseIndex !== -1) {
          const course = state.courses[courseIndex];
          
          // Ensure course.sections exists and is an array
          if (course.sections && Array.isArray(course.sections)) {
            const sectionIndex = course.sections.findIndex(
              (section) => section.sectionId === sectionId
            );
      
            if (sectionIndex !== -1) {
              // Initialize topics array if it doesn't exist
              if (!course.sections[sectionIndex].topics) {
                course.sections[sectionIndex].topics = [];
              }
      
              // Add the new topic
              course.sections[sectionIndex].topics.push(newTopic);
            }
          }
        }
      
        // Update selectedCourse if it matches the courseId
        if (
          state.selectedCourse &&
          state.selectedCourse.courseId === courseId &&
          state.selectedCourse.sections &&
          Array.isArray(state.selectedCourse.sections)
        ) {
          const selectedSectionIndex = state.selectedCourse.sections.findIndex(
            (section) => section.sectionId === sectionId
          );
      
          if (selectedSectionIndex !== -1) {
            // Initialize topics array if it doesn't exist
            if (!state.selectedCourse.sections[selectedSectionIndex].topics) {
              state.selectedCourse.sections[selectedSectionIndex].topics = [];
            }
      
            // Add the new topic
            state.selectedCourse.sections[selectedSectionIndex].topics.push(
              newTopic
            );
          }
        }
      })
      .addCase(addNewTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: "Failed to add topic" };
      })

      // Delete Topic
      .addCase(deleteTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTopic.fulfilled, (state, action) => {
        state.loading = false;
        const { topicId } = action.meta.arg;
      
        // Remove topic from courses array
        if (state.courses && Array.isArray(state.courses)) {
          state.courses.forEach((course) => {
            // Ensure course.sections exists and is an array
            if (course.sections && Array.isArray(course.sections)) {
              course.sections.forEach((section) => {
                if (section.topics && Array.isArray(section.topics)) {
                  section.topics = section.topics.filter(
                    (topic) => topic.topicId !== topicId
                  );
                }
              });
            }
          });
        }
      
        // Remove topic from selectedCourse
        if (
          state.selectedCourse && 
          state.selectedCourse.sections && 
          Array.isArray(state.selectedCourse.sections)
        ) {
          state.selectedCourse.sections.forEach((section) => {
            if (section.topics && Array.isArray(section.topics)) {
              section.topics = section.topics.filter(
                (topic) => topic.topicId !== topicId
              );
            }
          });
        }
      })
      .addCase(deleteTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: "Failed to delete topic" };
      });
  },
});

export const { clearError } = courseSlice.actions;

export default courseSlice.reducer;

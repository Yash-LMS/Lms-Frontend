import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { ADD_NEW_COURSE_URL, ADD_NEW_SECTION_URL, VIEW_COURSE_URL, EDIT_COURSE_URL, VIEW_COURSE_DETAILS_URL, EDIT_SECTION_URL, DELETE_FILE_URL, UPDATE_TOPIC_FILE_URL, ADD_TOPIC_URL, DELETE_TOPIC_URL, DELETE_SECTION_URL } from '../../constants/apiConstants';

// Action to add a new course
export const addNewCourse = createAsyncThunk(
  'courses/addNewCourse',
  async ({ course, user, token, imageFile }, { rejectWithValue }) => {
      try {
          const formData = new FormData();
          formData.append('image', imageFile);
          const apiRequestModelCourse = {
              user,
              token,
              course
          };
          formData.append('apiRequestModelCourse', 
              new Blob([JSON.stringify(apiRequestModelCourse)], {
                  type: 'application/json'
              })
          );
          const response = await axios.post(ADD_NEW_COURSE_URL, formData, {
              headers: {
                  'Content-Type': 'multipart/form-data'
              }
          });
          return response.data;
      } catch (error) {
          return rejectWithValue(error.response?.data || error.message);
      }
  }
);

// Action to edit course details
export const editCourseDetail = createAsyncThunk(
    'courses/editCourseDetail',
    async ({ course, user, token }, { rejectWithValue }) => {
        try {
            console.log('Sending course data:', course);
            const response = await axios.put(EDIT_COURSE_URL, {
                courseId: course.courseId,  
                course,
                user,
                token
            });
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response.data); 
        }
    }
);

// Action to add a new section
export const addNewSection = createAsyncThunk(
  'courses/addNewSection',
  async (payload, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Append section data as JSON
      const sectionData = {
        section: payload.section,
        courseId: payload.courseId,
        course: payload.course,
        user: payload.user, 
        token: payload.token,
      };

      formData.append('section', new Blob([JSON.stringify(sectionData)], { type: 'application/json' }));

      if (payload.files && payload.files.length > 0) {
          payload.files.forEach(file => {
            formData.append('files', file);
          });
        }
        

      console.log('Payload:', sectionData);

      const response = await axios.post(ADD_NEW_SECTION_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to add section' });
    }
  }
);

//Action to view courses
export const viewCourse = createAsyncThunk(
    'courses/viewCourse',
    async (_, { rejectWithValue }) => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const token = sessionStorage.getItem('token');
            
            const apiRequestModelCourse = {
                user: user,
                token: token
            };
            
            const response = await axios.post(VIEW_COURSE_URL, apiRequestModelCourse);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { message: 'An error occurred while fetching courses' }
            );
        }
    }
);

// Action to view complete course details
export const viewCourseDetails = createAsyncThunk(
    'courses/viewCourseDetails',
    async ({ courseId, user, token }, { rejectWithValue }) => {
        try {
            const response = await axios.post(VIEW_COURSE_DETAILS_URL, {
                courseId,  
                user,
                token
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Action to edit section details
export const editSectionDetail = createAsyncThunk(
    'courses/editSectionDetail',
    async ({ section, user, token }, { rejectWithValue }) => {
        try {
            const response = await axios.put(EDIT_SECTION_URL, {
                section,
                user,
                token
            });
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response.data); 
        }
    }
);

//Action to delete file
export const deleteTopicFile = createAsyncThunk(
  'courses/deleteTopicFile',
  async (requestBody, { rejectWithValue }) => {
    try {
      const response = await axios.delete(DELETE_FILE_URL, {
        data: requestBody, // Pass the request body here
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data); 
    }
  }
);

// Action to update topic file
export const updateTopicFile = createAsyncThunk(
  'courses/updateTopicFile',
  async ({ topicId, file, user, token }, { rejectWithValue }) => {
    try {
      // Create FormData to send multipart request
      const formData = new FormData();
      
      // Prepare API request model
      const apiRequestModelCourse = {
        topicId: topicId,
        user: user,
        token: token
      };
      
      // Append JSON data and file
      formData.append(
        'apiRequestModelCourse', 
        new Blob([JSON.stringify(apiRequestModelCourse)], { type: 'application/json' })
      );
      
      if (file) {
        formData.append('file', file);
      }

      // Send multipart/form-data request
      const response = await axios.put(UPDATE_TOPIC_FILE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating topic file:', error);
      return rejectWithValue(
        error.response?.data || 
        { message: 'Failed to update topic file', error: error.message }
      );
    }
  }
);

// Action to add a new topic to a section
export const addNewTopic = createAsyncThunk(
  'courses/addNewTopic',
  async (payload, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Prepare API request model - send a single topic instead of an array
      const topicData = {
        courseId: payload.courseId,
        sectionId: payload.sectionId,
        topics: {
          topicName: payload.topics[0].topicName,
          topicType: payload.topics[0].topicType,
          testId: payload.topics[0].testId || null,
          topicDescription: payload.topics[0].topicDescription || ''
        },
        user: payload.user,
        token: payload.token
      };

      formData.append('apiRequestModelCourse', new Blob([JSON.stringify(topicData)], { type: 'application/json' }));

      // Append file if exists
      if (payload.file) {
        formData.append('file', payload.file);
      }

      const response = await axios.post(ADD_TOPIC_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Add topic error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || { message: 'Failed to add topic' });
    }
  }
);

// Action to delete a topic
export const deleteTopic = createAsyncThunk(
  'courses/deleteTopic',
  async (requestBody, { rejectWithValue }) => {
    try {
      const response = await axios.post(DELETE_TOPIC_URL, requestBody);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Action to delete a section
export const deleteSection = createAsyncThunk(
  'courses/deleteSection',
  async (requestBody, { rejectWithValue }) => {
    try {
      const response = await axios.post(DELETE_SECTION_URL, requestBody);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
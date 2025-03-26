import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { VIEW_ALLOTED_COURSE_URL, VIEW_ALLOTED_TEST_URL, USER_COURSE_FEEDBACK_URL } from '../../constants/apiConstants';

export const viewAllotedCourses = createAsyncThunk(
    'courses/viewAllotedCourses',
    async (_, { rejectWithValue }) => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const token = sessionStorage.getItem('token');
            
            const apiRequestModelCourse = {
                user: user,
                token: token
            };
            
            const response = await axios.post(VIEW_ALLOTED_COURSE_URL , apiRequestModelCourse);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { message: 'An error occurred while fetching courses' }
            );
        }
    }
);

export const viewAllotedTest = createAsyncThunk(
    "user/viewAllotedTest",
    async (_, { rejectWithValue }) => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const token = sessionStorage.getItem('token');
        

        const response = await axios.post(VIEW_ALLOTED_TEST_URL, {
          user,
          token,
        });
        return response.data;
      } catch (error) {
        return rejectWithValue(error.response.data);
      }
    }
  );

  export const userCourseFeedback = createAsyncThunk(
    "user/useCourseFeedback",
    async ({user,token,courseId,feedback}, {rejectWithValue}) => {
        try {
            const response = await axios.post(USER_COURSE_FEEDBACK_URL, {
                user,
                token,
                courseId,
                feedBack: feedback,
            });
            return response.data;
        } catch (error) {
          return rejectWithValue(error.response.data);
        }
    }
  )
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { CREATE_TEST_URL, VIEW_TEST_URL, ADD_QUESTION_URL, PREVIEW_TEST_URL, PREVIEW_TEST_MANAGER_URL, INSTRUCTOR_TRAINEE_RESULT_URL  } from '../../constants/apiConstants';

export const createTest = createAsyncThunk(
    'test/createTest',
    async ({ user, token, test }, { rejectWithValue }) => {
        try {
            const response = await axios.post(CREATE_TEST_URL, {
                user,
                token,
                test
            });
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response.data); 
        }
    }
);

export const viewTest = createAsyncThunk(
    'test/viewTest',
    async (_, { rejectWithValue }) => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const token = sessionStorage.getItem('token');
            
            const apiRequestModelCourse = {
                user: user,
                token: token
            };
            
            const response = await axios.post(VIEW_TEST_URL, apiRequestModelCourse);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { message: 'An error occurred while fetching courses' }
            );
        }
    }
);

export const addQuestions = createAsyncThunk(
    'test/addQuestions',
    async (questionsData, { rejectWithValue }) => {
      try {
        const { user, token, role, testId, questionList } = questionsData;
        
        const requestData = {
          user,
          token,
          role,
          testId,
          questionList
        };
  
        const response = await axios.post(
          ADD_QUESTION_URL ,
          requestData
        );
        
        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to add questions"
        );
      }
    }
  );



  export const addQuestionsLibrary = createAsyncThunk(
    'test/addQuestions',
    async (questionsData, { rejectWithValue }) => {
      try {
        const { user, token, role, category, questionList } = questionsData;
        
        const requestData = {
          user,
          token,
          role,
          questionList
        };
  
        const response = await axios.post(
          ADD_QUESTION_URL ,
          requestData
        );
        
        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to add questions"
        );
      }
    }
  );


// Action to view complete test questions
export const viewTestQuestions = createAsyncThunk(
    'test/viewTestQuestions',
    async ({ testId, user, token }, { rejectWithValue }) => {
        try {
            console.log(testId,user,token)
            const response = await axios.post(PREVIEW_TEST_URL, {
                testId,  
                user,
                token
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);


export const viewManagerTestQuestions = createAsyncThunk(
    'test/viewManagerTestQuestions',
    async ({ testId, user, token }, { rejectWithValue }) => {
        try {
            console.log(testId,user,token)
            const response = await axios.post(PREVIEW_TEST_MANAGER_URL , {
                testId,  
                user,
                token
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const viewTraineeResults = createAsyncThunk(
  'test/viewTraineeResults',
  async ({ emailId, user, token }, { rejectWithValue }) => {
      try {
          const response = await axios.post(INSTRUCTOR_TRAINEE_RESULT_URL , {
              emailId,  
              user,
              token
          });
          return response.data;
      } catch (error) {
          return rejectWithValue(error.response.data);
      }
  }
);
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  FIND_COURSE_BY_STATUS_URL,
  APPROVE_COURSE_URL,
  REJECT_COURSE_URL,
  FIND_COURSE_URL, FIND_TRAINEE_URL, ALLOT_COURSE_URL, UPDATE_USER_ROLE_AND_STATUS_URL, FIND_EMPLOYEE_LIST_URL, APPROVE_TEST_URL, REJECT_TEST_URL, FIND_TEST_BY_STATUS_URL, VIEW_TRAINEE_ALLOTED_COURSE_URL,
  FIND_DASHBOARD_INFORMATION_URL,
  TEST_COUNT_URL,
  EMPLOYEE_COUNT_URL,
  COURSE_COUNT_URL,
  INTERN_COUNT_URL,
  FIND_BATCHES_URL,
  APPROVE_BATCH_URL,
  REJECT_BATCH_URL,
  FIND_ASSIGNMENT_URL,
  APPROVE_ASSIGNMENT_URL,
  REJECT_ASSIGNMENT_URL
} from "../../constants/apiConstants";

export const findCoursesByStatus = createAsyncThunk(
  "manager/findCoursesByStatus",
  async ({ user, token, courseStatus }, { rejectWithValue }) => {
    try {
      const response = await axios.post(FIND_COURSE_BY_STATUS_URL, {
        user,
        token,
        courseStatus,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const approveCourse = createAsyncThunk(
  "manager/approveCourse",
  async ({ user, token, courseId, feedBack, feedbackId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(APPROVE_COURSE_URL, {
        user,
        token,
        courseId,
        feedBack,
        feedbackId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const rejectCourse = createAsyncThunk(
  "manager/rejectCourse",
  async ({ user, token, courseId, feedBack }, { rejectWithValue }) => {
    try {
      const response = await axios.post(REJECT_COURSE_URL, {
        user,
        token,
        courseId,
        feedBack,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findTestByStatus = createAsyncThunk(
  "manager/findTestByStatus",
  async ({ user, token, testStatus }, { rejectWithValue }) => {
    try {
      const response = await axios.post(FIND_TEST_BY_STATUS_URL, {
        user,
        token,
        testStatus,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


export const approveTest = createAsyncThunk(
  "manager/approveTest",
  async ({ user, token, testId, feedBack }, { rejectWithValue }) => {
    try {
      const response = await axios.post(APPROVE_TEST_URL, {
        user,
        token,
        testId,
        feedBack,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const rejectTest = createAsyncThunk(
  "manager/rejectTest",
  async ({ user, token, testId, feedBack }, { rejectWithValue }) => {
    try {
      const response = await axios.post(REJECT_TEST_URL, {
        user,
        token,
        testId,
        feedBack,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

//Batches operations
export const findBatches = createAsyncThunk(
  "manager/findBatches",
  async ({ user, token, batchStatus }, { rejectWithValue }) => {
    try {
      const response = await axios.post(FIND_BATCHES_URL, {
        user,
        token,
        batchStatus,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const approveBatch = createAsyncThunk(
  "manager/approveBatch",
  async ({ user, token, batchId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(APPROVE_BATCH_URL, {
        user,
        token,
        batchId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const rejectBatch = createAsyncThunk(
  "manager/rejectBatch",
  async ({ user, token, batchId}, { rejectWithValue }) => {
    try {
      const response = await axios.post(REJECT_BATCH_URL, {
        user,
        token,
        batchId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

//Assignment Operations
export const findAssignments = createAsyncThunk(
  "manager/findAssignments",
  async ({ user, token, status }, { rejectWithValue }) => {
    try {
      const response = await axios.post(FIND_ASSIGNMENT_URL, {
        user,
        token,
        status,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const approveAssignment = createAsyncThunk(
  "manager/approveAssignment",
  async ({ user, token, assignmentId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(APPROVE_ASSIGNMENT_URL, {
        user,
        token,
        assignmentId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const rejectAssignment = createAsyncThunk(
  "manager/rejectAssignment",
  async ({ user, token, assignmentId}, { rejectWithValue }) => {
    try {
      const response = await axios.post(REJECT_ASSIGNMENT_URL, {
        user,
        token,
        assignmentId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



// Fetch user list
export const fetchUserList = createAsyncThunk(
  "manager/fetchUserList",
  async (userData) => {
    const response = await axios.post(FIND_TRAINEE_URL, {
      user: userData.user,
      token: userData.token,
    });
    return response.data.payload;
  }
);

// Fetch course list
export const fetchCourseList = createAsyncThunk(
  "manager/fetchCourseList",
  async (userData) => {
    const response = await axios.post(FIND_COURSE_URL, {
      user: userData.user,
      token: userData.token,
    });
    return response.data.payload;
  }
);

// Allot courses
export const allotCourses = createAsyncThunk(
  "manager/allotCourses",
  async ({ userData, allotmentList }) => {
    console.log(allotmentList)
    const response = await axios.post(
      ALLOT_COURSE_URL,
      {
        user: userData.user,
        token: userData.token,
        allotmentList,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  }
);

//Action to update role and status

export const updateUserRoleAndStatus = createAsyncThunk(
  'user/updateUserRoleAndStatus',
  async ({ user, token, userApproval }, { rejectWithValue }) => {
    try {
      console.log('Sending data to API:', {
        user,
        token,
        userApproval
      });

      console.log(userApproval);
      
      const response = await axios.post(UPDATE_USER_ROLE_AND_STATUS_URL, {
        user,
        token,
        userApproval
      });
      
      return response.data;
    } catch (error) {
      console.error('API error details:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

//Action to fecth employee list
export const findEmployeeList = createAsyncThunk(
    'employee/findEmployeeList',
    async ({ user, token, role, status }, { rejectWithValue }) => {
        try {
            const response = await axios.post(FIND_EMPLOYEE_LIST_URL, {
                user,
                token,
                role,
                status
            });
            console.log(response.data);
            
            // Check if the response indicates not found and handle it
            if (response.data.response === 'not_found') {
                // Return an empty array instead of null when no users are found
                return [];
            }
            
            // For successful responses, return the payload
            if (response.data.response === 'success') {
                return response.data.payload || [];
            }
            
            // For any other response, return empty array
            return [];
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Network error' });
        }
    }
);

export const viewTraineeAllotedCourse = createAsyncThunk(
  "manager/viewTraineeAllotedCourse",
  async ({ user, token, testId, emailId, testFilter }, { rejectWithValue }) => {
    try {
      const response = await axios.post(VIEW_TRAINEE_ALLOTED_COURSE_URL, {
        user,
        token,
        testId,
        emailId,
        testFilter,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findDashboardInformation = createAsyncThunk(
  "manager/findDashboardInformation",
  async ({ user, token, filter, status }, { rejectWithValue }) => {
    try {
      const response = await axios.post(FIND_DASHBOARD_INFORMATION_URL, {
        user,
        token,
        filter,
        status,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findCoursesCount = createAsyncThunk(
  "manager/findCoursesCount",
  async ({ user, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(COURSE_COUNT_URL, {
        user,
        token
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findTestsCount = createAsyncThunk(
  "manager/findTestsCount",
  async ({ user, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(TEST_COUNT_URL, {
        user,
        token
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findEmployeesCount = createAsyncThunk(
  "manager/findEmployeesCount",
  async ({ user, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(EMPLOYEE_COUNT_URL, {
        user,
        token
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findInternsCount = createAsyncThunk(
  "manager/findInternsCount",
  async ({ user, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(INTERN_COUNT_URL, {
        user,
        token
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


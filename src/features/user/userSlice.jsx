import { createSlice } from '@reduxjs/toolkit';
import { viewAllotedCourses, viewAllotedTest, userCourseFeedback } from './userActions';

const userSlice = createSlice({
    name: 'employee',
    initialState: {
        allottedCourses: [],
        allottedTest: [],
        feedbackSubmission: {
            data: null,
            loading: false,
            error: null,
            success: false
        },
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(viewAllotedCourses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(viewAllotedCourses.fulfilled, (state, action) => {
                state.loading = false;
                console.log(action.payload.payload)
                state.allottedCourses = action.payload.payload; 
            })
            .addCase(viewAllotedCourses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(viewAllotedTest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(viewAllotedTest.fulfilled, (state, action) => {
                state.loading = false;
                console.log(action.payload.payload)
                state.allottedTest = action.payload.payload; 
            })
            .addCase(viewAllotedTest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(userCourseFeedback.pending, (state) => {
                state.feedbackSubmission.loading = true;
                state.feedbackSubmission.error = null;
                state.feedbackSubmission.success = false;
            })
            .addCase(userCourseFeedback.fulfilled, (state, action) => {
                state.feedbackSubmission.loading = false;
                state.feedbackSubmission.data = action.payload;
                state.feedbackSubmission.success = true;
                state.feedbackSubmission.error = null;
            })
            .addCase(userCourseFeedback.rejected, (state, action) => {
                state.feedbackSubmission.loading = false;
                state.feedbackSubmission.error = action.payload;
                state.feedbackSubmission.success = false;
            });
    },
});

export default userSlice.reducer;
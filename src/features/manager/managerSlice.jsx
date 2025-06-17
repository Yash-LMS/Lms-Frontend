import { createSlice } from '@reduxjs/toolkit';
import {
    findCoursesByStatus,
    approveCourse,
    rejectCourse,
    fetchCourseList,
    fetchUserList,
    allotCourses,
    updateUserRoleAndStatus,
    findEmployeeList,
    approveTest, 
    rejectTest,  
    findTestByStatus,
    viewTraineeAllotedCourse ,
    findDashboardInformation,
    findCoursesCount,
    findTestsCount,
    findEmployeesCount,
    findInternsCount,
    findBatches,
    approveBatch,
    rejectBatch
} from './managerActions';

const managerSlice = createSlice({
    name: 'manager',
    initialState: {
        courses: [],
        users: [],
        tests: [],
        batches: [],
        allottedCourses: [],
        courseCount: [],
        testCount: [],
        employeeCount: [],
        internCount: [],
        dashboardInfo: null,
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
            // Find courses by status
            .addCase(findCoursesByStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findCoursesByStatus.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    state.courses = action.payload.payload || [];
                } else {
                    state.error = action.payload.message || 'Failed to fetch courses';
                }
            })
            .addCase(findCoursesByStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch courses';
            })
            
            // Approve course
            .addCase(approveCourse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveCourse.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    const updatedCourse = action.payload.payload || {};
                    state.courses = state.courses.map(course => 
                        course.id === updatedCourse.id ? { ...course, courseStatus: 'approved' } : course
                    );
                } else {
                    state.error = action.payload.message || 'Failed to approve course';
                }
            })
            .addCase(approveCourse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to approve course';
            })
            
            // Reject course
            .addCase(rejectCourse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectCourse.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    const updatedCourse = action.payload.payload || {};
                    state.courses = state.courses.map(course => 
                        course.id === updatedCourse.id ? { ...course, courseStatus: 'rejected' } : course
                    );
                } else {
                    state.error = action.payload.message || 'Failed to reject course';
                }
            })
            .addCase(rejectCourse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to reject course';
            })

            // Find test by status
            .addCase(findTestByStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findTestByStatus.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    console.log(action.payload.payload)
                    state.tests = action.payload.payload || [];
                } else {
                    state.error = action.payload.message || 'Failed to fetch courses';
                }
            })
            .addCase(findTestByStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch courses';
            })
            
            // Approve test
            .addCase(approveTest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveTest.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    const updatedTest = action.payload.payload || {};
                    // Update the tests state accordingly (you may need to adjust this based on your state structure)
                    // Assuming you have a tests array in your state
                    state.tests = state.tests.map(test => 
                        test.id === updatedTest.id ? { ...test, status: 'approved' } : test
                    );
                } else {
                    state.error = action.payload.message || 'Failed to approve test';
                }
            })
            .addCase(approveTest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to approve test';
            })

            // Reject test
            .addCase(rejectTest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectTest.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    const updatedTest = action.payload .payload || {};
                    // Update the tests state accordingly (you may need to adjust this based on your state structure)
                    // Assuming you have a tests array in your state
                    state.tests = state.tests.map(test => 
                        test.id === updatedTest.id ? { ...test, status: 'rejected' } : test
                    );
                } else {
                    state.error = action.payload.message || 'Failed to reject test';
                }
            })
            .addCase(rejectTest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to reject test';
            })

            .addCase(findBatches.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findBatches.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    state.batches = action.payload.payload || [];
                } else {
                    state.error = action.payload.message || 'Failed to fetch courses';
                }
            })
            .addCase(findBatches.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch courses';
            })
            
            // Approve course
            .addCase(approveBatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveBatch.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    const updatedBatch = action.payload.payload || {};
                    state.batches = state.batches.map(batch => 
                        batch.id === updatedBatch.id ? { ...batch, batchStatus: 'approved' } : batch
                    );
                } else {
                    state.error = action.payload.message || 'Failed to approve course';
                }
            })
            .addCase(approveBatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to approve course';
            })
            
            // Reject course
            .addCase(rejectBatch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectBatch.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    const updatedBatch = action.payload.payload || {};
                    state.batches = state.batches.map(batch => 
                        batch.id === updatedBatch.id ? { ...batch, batchStatus: 'rejected' } : batch
                    );
                } else {
                    state.error = action.payload.message || 'Failed to reject course';
                }
            })
            .addCase(rejectBatch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch batches';
            })
            
            
            // Fetch user list
            .addCase(fetchUserList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserList.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload || [];
            })
            .addCase(fetchUserList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch users';
            })

            // Fetch course list
            .addCase(fetchCourseList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCourseList.fulfilled, (state, action) => {
                state.loading = false;
                state.courses = action.payload || [];
            })
            .addCase(fetchCourseList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch courses';
            })

            // Allot courses
            .addCase(allotCourses.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(allotCourses.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.status === 'SUCCESS') {
                    // Handle success case
                } else {
                    state.error = action.payload.message || 'Failed to allot courses';
                }
            })
            .addCase(allotCourses.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to allot courses';
            })
            .addCase(updateUserRoleAndStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUserRoleAndStatus.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.status === 'SUCCESS') {
                    const updatedUsers = action.payload.userList; 
                    state.users = updatedUsers; 
                } else {
                    state.error = action.payload.message || 'Failed to update user role and status';
                }
            })
            .addCase(updateUserRoleAndStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update user role and status';
            })
            .addCase(findEmployeeList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findEmployeeList.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(findEmployeeList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch users';
                state.users = [];
            })
            .addCase(viewTraineeAllotedCourse.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(viewTraineeAllotedCourse.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    state.allottedCourses = action.payload.payload || []; 
                } else {
                    state.error = action.payload.message || 'Failed to fetch allotted courses';
                }
            })
            .addCase(viewTraineeAllotedCourse.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch allotted courses';
            })
            .addCase(findDashboardInformation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findDashboardInformation.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    console.log(action.payload)
                    state.dashboardInfo = action.payload.payload || []; // Store the dashboard information
                } else {
                    state.error = action.payload.message || 'Failed to fetch dashboard information';
                }
            })
            .addCase(findDashboardInformation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch dashboard information';
            })

            .addCase(findCoursesCount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findCoursesCount.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    state.courseCount = action.payload.payload || [];
                } else {
                    state.error = action.payload.message || 'Failed to fetch courses';
                }
            })
            .addCase(findCoursesCount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch courses';
            })
            .addCase(findTestsCount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findTestsCount.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    state.testCount = action.payload.payload || [];
                } else {
                    state.error = action.payload.message || 'Failed to fetch tests';
                }
            })
            .addCase(findTestsCount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch tests';
            })
            .addCase(findEmployeesCount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findEmployeesCount.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    state.employeeCount = action.payload.payload || [];
                } else {
                    state.error = action.payload.message || 'Failed to fetch employee';
                }
            })
            .addCase(findEmployeesCount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch employee';
            })
            .addCase(findInternsCount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(findInternsCount.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.response === 'success') {
                    console.log(action.payload.payload)
                    state.internCount = action.payload.payload || [];
                } else {
                    state.error = action.payload.message || 'Failed to fetch intern';
                }
            })
            .addCase(findInternsCount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch intern';
            });
           
    },
});

export const { clearError } = managerSlice.actions;

export default managerSlice.reducer;
import { createSlice } from "@reduxjs/toolkit";
import { createTest, viewTest, addQuestions, viewTestQuestions } from "./testActions";

const testSlice = createSlice({
  name: "tests",
  initialState: {
    tests: [],
    loading: false,
    error: null,
    questionAddSuccess: false,
    questions: [], 
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTest.fulfilled, (state, action) => {
        state.loading = false;
        console.log("New course added:", action.payload.payload);
        if (state.tests === null) {
          state.tests = [];
        }
        state.tests.push(action.payload.payload);
      })
      .addCase(createTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(viewTest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(viewTest.fulfilled, (state, action) => {
        state.loading = false;
        state.tests = action.payload.payload;
      })
      .addCase(viewTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; 
      })
      .addCase(addQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.questionAddSuccess = false;
      })
      .addCase(addQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questionAddSuccess = true;
        
        // Update the test with new questions if needed
        if (action.payload.payload && action.payload.payload.testId) {
          const updatedTestIndex = state.tests.findIndex(
            test => test.id === action.payload.payload.testId
          );
          
          if (updatedTestIndex !== -1) {
            // You can update the test object if the API returns updated test data
            // state.tests[updatedTestIndex] = action.payload.payload;
            
            // Or just mark it as having questions
            state.tests[updatedTestIndex] = {
              ...state.tests[updatedTestIndex],
              hasQuestions: true
            };
          }
        }
      })
      .addCase(addQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.questionAddSuccess = false;
      })
      .addCase(viewTestQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(viewTestQuestions.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.response === 'success') {
          state.questions = action.payload.payload || []; 
          console.log('Questions:', state.questions)
        } else {
          state.error = action.payload.message || 'Failed to fetch questions';
        }
      })
      .addCase(viewTestQuestions.rejected , (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = testSlice.actions;

export default testSlice.reducer;
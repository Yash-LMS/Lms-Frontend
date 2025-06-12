import { createSlice } from "@reduxjs/toolkit";
import { createBatch, viewBatch } from "./batchActions";

const batchSlice = createSlice({
  name: "batches",
  initialState: {
    batches: [],
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
      .addCase(createBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBatch.fulfilled, (state, action) => {
        state.loading = false;
        console.log("New batch added:", action.payload);
        state.batches.push(action.payload);
      })
      .addCase(createBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(viewBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(viewBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload.payload;
      })
      .addCase(viewBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; 
      });
    },
});

export const { clearError } = batchSlice.actions;

export default batchSlice.reducer;
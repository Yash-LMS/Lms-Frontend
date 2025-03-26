import { createSlice } from '@reduxjs/toolkit';
import { fetchOfficeList } from './officeAction';

const officeSlice = createSlice({
    name: 'offices',
    initialState: {
        officeList: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchOfficeList.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOfficeList.fulfilled, (state, action) => {
                state.loading = false;
                state.officeList = action.payload.payload;
            })
            .addCase(fetchOfficeList.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; 
            });
    },
});

export default officeSlice.reducer;
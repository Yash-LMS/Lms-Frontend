import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { CREATE_BATCH_URL, VIEW_BATCH_URL } from '../../constants/apiConstants';

export const createBatch = createAsyncThunk(
    'batch/createBatch',
    async ({ user, token, batchName }, { rejectWithValue }) => {
        try {
            // Ensure the batch object is created correctly
            const batch = { batchName }; // Create the batch object with the required property

            const response = await axios.post(CREATE_BATCH_URL, {
                user,
                token,
                batch // Pass the batch object
            });
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response.data); 
        }
    }
);


export const viewBatch = createAsyncThunk(
    'batch/viewBatch',
    async (_, { rejectWithValue }) => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const token = sessionStorage.getItem('token');
            
            const apiRequestModelCourse = {
                user: user,
                token: token,
                batchStatus: batchStatus,
            };
            
            const response = await axios.post(VIEW_BATCH_URL, apiRequestModelCourse);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data || { message: 'An error occurred while fetching courses' }
            );
        }
    }
);
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { OFFICE_LIST_URL } from '../../constants/apiConstants';

export const fetchOfficeList = createAsyncThunk(
    'offices/fetchOfficeList',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(OFFICE_LIST_URL);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch office list');
        }
    }
);
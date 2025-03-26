import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { REGISTER_USER_URL, LOGIN_URL } from '../../constants/apiConstants';

export const registerUser  = createAsyncThunk(
    'user/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post(REGISTER_USER_URL, userData);
            return response.data; 
        } catch (error) {
            return rejectWithValue(error.response.data); 
        }
    }
);

export const loginUser  = createAsyncThunk(
    'auth/login',
    async ({ emailId, password }, { rejectWithValue }) => {
        try {
            const response = await axios.get(LOGIN_URL, {
                params: { emailId, password } 
            });
            return response.data; 
        } catch (error) {
            console.error("Login error:", error.response);
            return rejectWithValue(error.response ? error.response.data : 'An error occurred');
        }
    }
);
import { createSlice } from '@reduxjs/toolkit';
import { registerUser, loginUser } from './authActions';

const userSlice = createSlice({
    name: 'user',
    initialState: {
        user: null,
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
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.payload; 
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; 
            })

            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload.payload; 
                if (data?.user) {
                    state.user = data.user;
                    sessionStorage.setItem("user", JSON.stringify(data.user));
                    state.token = sessionStorage.setItem('token', data.token);
                    //sessionStorage.setItem("role", data.user.role);
                } else {
                    throw new Error('Invalid credentials. Please try again.') 
                }
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload; 
                console.error("Login failed:", action.payload);
            });
    },
});

export const { clearError } = userSlice.actions;

export default userSlice.reducer;
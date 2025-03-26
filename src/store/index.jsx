import { configureStore } from '@reduxjs/toolkit';
import officeReducer from '../features/offices/officeSlice';
import userReducer from '../features/auth/authSlice';
import courseReducer from '../features/course/courseSlice';
import managerReducer from '../features/manager/managerSlice';
import employeeReducer from '../features/user/userSlice';
import testReducer from '../features/test/testSlice';

const store = configureStore({
    reducer: {
        offices: officeReducer,
        user: userReducer,
        courses: courseReducer,
        manager: managerReducer,
        employee: employeeReducer,
        tests: testReducer,
    },
});

export default store;
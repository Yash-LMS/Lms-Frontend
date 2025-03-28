import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { Provider, useSelector, useDispatch } from "react-redux"; 
import store from "./store/index"; 
import styles from "./App.module.css"; 
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import UserDashboard from "./components/user/UserDashboard";
import MyCourses from "./components/user/MyCourses";
import MyTests from "./components/user/MyTests";
import InstructorDashboard from "./components/instructor/InstructorDashboard";
import CoursePreview from "./components/instructor/CoursePreview";
import TestPreview from "./components/test/TestPreview"
import TestView from "./components/technical-manager/TestView";
import src from "../src/assets/yashLogo.png";
import ManagerDashboard from "./components/technical-manager/ManagerDashboard";
import CourseRequests from "./components/technical-manager/CourseRequests";
import CourseView from "./components/technical-manager/CourseView";
import CourseAllotment from "./components/technical-manager/CourseAllotment";
import CourseBulkAllotment from "./components/technical-manager/CourseBulkAllotment";
import EmployeeManagement from "./components/technical-manager/EmployeeManagement";
import CourseContent from "./components/user/CourseContent";
import UserCourseView from "./components/user/UserCourseView";
import { API_BASE_URL } from "./constants/apiConstants";
import TestModule from "./components/user/TestModule";
import TestManagement from "./components/test/TestManagement";
import TestAllotment from "./components/technical-manager/TestAllotment";
import NotificationPage from "./components/Notification/NotificationPage";
import TestRequests from "./components/technical-manager/TestRequests";
import ResultPage from "./components/user/ResultPage";
import TraineeResults from "./components/technical-manager/TraineeResults";
import ViewTraineeTestAllotment from "./components/technical-manager/ViewTraineeTestAllotment";


// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// List of pages that don't require authentication
const PUBLIC_PAGES = ['/login', '/register', '/'];

// Main App component with Provider only (Router moved to index/main file)
const App = () => {
  return (
    <Provider store={store}> 
      <AppContent />
    </Provider>
  );
};

// App content component with Routes
const AppContent = () => {
  const [loginStatus, setLoginStatus] = useState(!!sessionStorage.getItem("token"));
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const user = JSON.parse(sessionStorage.getItem('user'));

  // Check token on initial load, but allow access to login and register pages
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    // Only redirect to login if not on a public page AND no token
    const isPublicPage = PUBLIC_PAGES.includes(currentPath) || 
                         PUBLIC_PAGES.some(page => currentPath.startsWith(page));
    
    if (!token && !isPublicPage) {
      navigate("/login");
    }
  }, [navigate, currentPath]);

  useEffect(() => {
    const validateToken = async () => {
      const token = sessionStorage.getItem("token");
      const userStr = sessionStorage.getItem("user");
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log("Validating token...");
          const response = await fetch(`${API_BASE_URL}/user/validate_token?emailId=${user.emailId}&token=${token}`);
          
          if (response.status === 401) {
            console.log("Token validation failed: 401 Unauthorized");
            sessionStorage.clear();
            setLoginStatus(false); 
            navigate('/login');
          }
        } catch (error) {
          console.error("Error validating token:", error);
          sessionStorage.clear();
          setLoginStatus(false); 
          navigate('/login');
        }
      }
    };
    
    // Only validate token if user is logged in AND not on a public page
    const isPublicPage = PUBLIC_PAGES.includes(currentPath) || 
                         PUBLIC_PAGES.some(page => currentPath.startsWith(page));
    
    if (loginStatus && !isPublicPage) {
      const interval = setInterval(validateToken, 6000); 
      return () => clearInterval(interval);
    }
  }, [loginStatus, navigate, currentPath]);

  // Update login status whenever session storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const hasToken = !!sessionStorage.getItem("token");
      setLoginStatus(hasToken);
      
      // Only redirect to login if not on a public page AND no token
      const isPublicPage = PUBLIC_PAGES.includes(currentPath) || 
                          PUBLIC_PAGES.some(page => currentPath.startsWith(page));
      
      if (!hasToken && !isPublicPage) {
        navigate("/login");
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, currentPath]);

  return (
    <div className={styles.appContainer}>
      <NavbarWithRouter setLoginStatus={setLoginStatus} />
      <main>
        <Routes>
          <Route path="/" element={<LoginForm setLoginStatus={setLoginStatus} />} />
          <Route path="/login" element={<LoginForm setLoginStatus={setLoginStatus} />} />
          <Route path="/register" element={<RegisterForm />} />
          
          <Route path="/instructor-dashboard" element={
            <ProtectedRoute>
              <InstructorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/instructor/test" element={
            <ProtectedRoute>
              <TestManagement />
            </ProtectedRoute>
          } />
          <Route path="/course/preview/:courseId" element={
            <ProtectedRoute>
              <CoursePreview />
            </ProtectedRoute>
          } />
          <Route path="/test/preview/:testId" element={
            <ProtectedRoute>
              <TestPreview />
            </ProtectedRoute>
          } />
          <Route path="/test/view/:testId" element={
            <ProtectedRoute>
              <TestView/>
            </ProtectedRoute>
          } />

          <Route path="/manager-dashboard" element={
            <ProtectedRoute>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manager/requests" element={
            <ProtectedRoute>
              <CourseRequests />
            </ProtectedRoute>
          } />
           <Route path="/manager/test/requests" element={
            <ProtectedRoute>
              <TestRequests />
            </ProtectedRoute>
          } />
          <Route path="/course/view/:courseId" element={
            <ProtectedRoute>
              <CourseView />
            </ProtectedRoute>
          } />
          <Route path="/manager/allotment" element={
            <ProtectedRoute>
              <CourseAllotment/>
            </ProtectedRoute>
          } />

          <Route path="/manager/test/allotment" element={
            <ProtectedRoute>
              <TestAllotment/>
            </ProtectedRoute>
          } />
          
          <Route path="/manager/employee" element={
            <ProtectedRoute>
              <EmployeeManagement/>
            </ProtectedRoute>
          } />
          <Route path="/manager/bulkAllotment" element={
            <ProtectedRoute>
              <CourseBulkAllotment/>
            </ProtectedRoute>
          } />

          <Route path="/user-dashboard" element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          } />
          <Route path="/my-test" element={
            <ProtectedRoute>
              <MyTests />
            </ProtectedRoute>
          } />
          <Route path="/user/courseContent/:courseId/:allotmentId" element={
            <ProtectedRoute>
              <CourseContent/>
            </ProtectedRoute>
          } />
          <Route path="/user/view/:courseId" element={
            <ProtectedRoute>
              <UserCourseView/>
            </ProtectedRoute>
          } />
          <Route path="/user/test" element={
            <ProtectedRoute>
              <TestModule/>
            </ProtectedRoute>
          } />

        <Route path="/redirect" element={
            <ProtectedRoute>
              <NotificationPage/>
            </ProtectedRoute>
          } />

        <Route path="/result" element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          } />

        <Route path="/manager/result" element={
            <ProtectedRoute>
              <TraineeResults />
            </ProtectedRoute>
          } />

         <Route path="/manager/allottedtest/user" element={
            <ProtectedRoute>
              <ViewTraineeTestAllotment/>
            </ProtectedRoute>
          } />

        </Routes>
      </main>
    </div>
  );
};

// Enhanced Navbar component with direct navigation
const NavbarWithRouter = ({ setLoginStatus }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  
  const user = useSelector((state) => state.user.user);
  const userData = JSON.parse(sessionStorage.getItem('user'));

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      setLoginStatus(false);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      sessionStorage.clear();
      localStorage.clear();
      setLoginStatus(false);
      navigate('/login');
    }
  };

  // Function to handle register navigation directly
  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate('/register');
  };

  // Function to handle login navigation directly
  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };

 return (
  <nav className={styles.navbar}>
    <div className={styles.navbarContent}>
      <span className={styles.navbarBrand}>
        <img src={src} alt="Yash Logo" height="55" />
        LMS
      </span>
      <div className={styles.navbarLinks}>
        {sessionStorage.getItem('user') ? (
          <>
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                {userData.firstName[0] + (userData.lastName ? userData.lastName[0] : '')}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userData.firstName + " " + (userData.lastName || '')}</span>
                <span className={styles.userRole}>{userData.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={handleLoginClick} className={styles.navLinks}>Login</button>
            <button onClick={handleRegisterClick} className={styles.navLinks}>Register</button>
          </>
        )}
      </div>
    </div>
  </nav>
);
};

export default App;
import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { Provider, useSelector, useDispatch } from "react-redux";
import store from "./store/index";
import styles from "./App.module.css";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import UserDashboard from "./components/user/UserDashboard";
import MyCourses from "./components/user/MyCourses";
import MyTests from "./components/user/MyTests";
import InstructorDashboard from "./components/instructor/InstructorDashboard";
import CoursePreview from "./components/instructor/CoursePreview";
import TestPreview from "./components/test/TestPreview";
import TestView from "./components/technical-manager/TestView";
import src from "../src/assets/yashLogo.png";
import ManagerDashboard from "./components/technical-manager/ManagerDashboard";
import CourseRequests from "./components/technical-manager/CourseRequests";
import CourseView from "./components/technical-manager/CourseView";
import CourseAllotment from "./components/technical-manager/CourseAllotment";
import CourseBulkAllotment from "./components/technical-manager/CourseBulkAllotment";
import EmployeeManagement from "./components/technical-manager/EmployeeManagement";
import InternManagement from "./components/technical-manager/InternManagement";
import CourseContent from "./components/user/CourseContent";
import UserCourseView from "./components/user/UserCourseView";
import { API_BASE_URL } from "./constants/apiConstants";
import TestModule from "./components/user/TestModule";
import TestManagement from "./components/test/TestManagement";
import TestAllotment from "./components/technical-manager/TestAllotment";
import NotificationPage from "./components/Notification/NotificationPage";
import TestRequests from "./components/technical-manager/TestRequests";
import ResultPage from "./components/user/ResultPage";
import ViewTraineeTestAllotment from "./components/technical-manager/ViewTraineeTestAllotment";
import InternalTestModule from "./components/user/InternalTestModule";
import axios from "axios";
import CourseProgressTracker from "./components/instructor/CourseProgress";
import ResultComponent from "./components/technical-manager/ResultComponent";
import Allotments from "./components/technical-manager/Allotments";
import AllCourseProgressTracker from "./components/technical-manager/AllCourseProgress";
import CertificateValidation from "./components/certificate/CertificateValidation";
import AddQuestionLibrary from "./components/test/AddQuestionLibrary";
import TraineeResults from "./components/instructor/TraineeResults";
import QuestionEdit from "./components/test/QuestionEdit";
import BatchManagement from "./components/instructor/BatchManagement";
import BatchRequests from "./components/technical-manager/BatchRequests";
import AssignmentManagement from "./components/instructor/Assignmentmanagement";
import AssignmentRequests from "./components/technical-manager/AssignmentRequests";
import FeedbackManagement from "./components/technical-manager/FeedbackManagement";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightToBracket,
  faRightFromBracket,
  faUserPlus,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import InternRegistration from "./components/auth/InternRegistration";
import TrpGenerator from "./components/technical-manager/TrpGenerator";
import UpdatePassword from "./components/technical-manager/UpdatePassword";

import UserPassword from "./components/user/UpdatePassword";
import TraineeAssignmentList from "./components/user/TraineeAssignmentList";
import ProfileCompletion from "./components/auth/ProfileCompletion";
import { USER_PROFILE_IMAGE_URL } from "./constants/apiConstants";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// List of pages that don't require authentication
const PUBLIC_PAGES = ["/login", "/register", "/"];

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
  const [loginStatus, setLoginStatus] = useState(false);
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const user = JSON.parse(sessionStorage.getItem("user"));

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
        role: sessionStorage.getItem("role"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  // Check token on initial load, but allow access to login and register pages
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    // Only redirect to login if not on a public page AND no token
    const isPublicPage =
      PUBLIC_PAGES.includes(currentPath) ||
      PUBLIC_PAGES.some((page) => currentPath.startsWith(page));

    if (!token && !isPublicPage) {
      navigate("/login");
    }
  }, [navigate, currentPath]);

  useEffect(() => {
    const validateToken = async () => {
      const token = sessionStorage.getItem("token");
      const userStr = sessionStorage.getItem("user");

      if (!loginStatus) {
        return;
      }

      if (token && userStr) {
        try {
          const { user, token } = getUserData();
          console.log("Validating token...");

          const response = await axios.get(
            `${API_BASE_URL}/user/validate_token`,
            {
              params: {
                emailId: user.emailId,
                token: token,
              },
            }
          );

          if (response.data.response === "unauthorized") {
            console.log("Token validation failed: 401 Unauthorized");
            sessionStorage.clear();
            setLoginStatus(false);
            navigate("/login");
          }
        } catch (error) {
          console.error("Error validating token:", error);
          sessionStorage.clear();
          setLoginStatus(false);
          navigate("/login");
        }
      }
    };

    if (loginStatus) {
      const interval = setInterval(validateToken, 6000);
      return () => clearInterval(interval);
    }
  }, [loginStatus]);

  // Update login status whenever session storage changes
  useEffect(() => {
    if (!loginStatus) {
      return;
    }

    const handleStorageChange = () => {
      const hasToken = !!sessionStorage.getItem("token");
      setLoginStatus(hasToken);

      if (!hasToken) {
        navigate("/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate, currentPath]);

  return (
    <div className={styles.appContainer}>
      <NavbarWithRouter setLoginStatus={setLoginStatus} />
      <main>
        <Routes>
          <Route
            path="/"
            element={<LoginForm setLoginStatus={setLoginStatus} />}
          />
          <Route
            path="/login"
            element={<LoginForm setLoginStatus={setLoginStatus} />}
          />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/intern/register" element={<InternRegistration />} />

          <Route path="/certificate" element={<CertificateValidation />} />

          <Route path="/forgot-password" element={<ForgotPasswordForm />} />

          
          <Route path="/complete-profile" element={<ProfileCompletion/>} />

          <Route
            path="/instructor-dashboard"
            element={
              <ProtectedRoute>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/view/test"
            element={
              <ProtectedRoute>
                <TestManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/view/result"
            element={
              <ProtectedRoute>
                <TraineeResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/course/progress"
            element={
              <ProtectedRoute>
                <CourseProgressTracker />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/course/library"
            element={
              <ProtectedRoute>
                <AddQuestionLibrary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/course/editLibrary"
            element={
              <ProtectedRoute>
                <QuestionEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/course/preview/:courseId"
            element={
              <ProtectedRoute>
                <CoursePreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/preview/:testId"
            element={
              <ProtectedRoute>
                <TestPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test/view/:testId"
            element={
              <ProtectedRoute>
                <TestView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/requests"
            element={
              <ProtectedRoute>
                <CourseRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/test/requests"
            element={
              <ProtectedRoute>
                <TestRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/course/view/:courseId"
            element={
              <ProtectedRoute>
                <CourseView />
              </ProtectedRoute>
            }
          />

      <Route
            path="/manager/trp"
            element={
              <ProtectedRoute>
                <TrpGenerator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/allotment"
            element={
              <ProtectedRoute>
                <Allotments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/employee"
            element={
              <ProtectedRoute>
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />


          <Route
            path="/manager/intern"
            element={
              <ProtectedRoute>
                <InternManagement />
              </ProtectedRoute>
            }
          />

                 <Route
            path="/manager/update/password"
            element={
              <ProtectedRoute>
                <UpdatePassword />
              </ProtectedRoute>
            }
          />

             <Route
            path="/user/update/password"
            element={
              <ProtectedRoute>
                <UserPassword />
              </ProtectedRoute>
            }
          />


          <Route
            path="/manager/bulkAllotment"
            element={
              <ProtectedRoute>
                <CourseBulkAllotment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/courseProgress"
            element={
              <ProtectedRoute>
                <AllCourseProgressTracker />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-test"
            element={
              <ProtectedRoute>
                <MyTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/courseContent/:courseId/:allotmentId"
            element={
              <ProtectedRoute>
                <CourseContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/view/:courseId"
            element={
              <ProtectedRoute>
                <UserCourseView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/test"
            element={
              <ProtectedRoute>
                <TestModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/internal/test"
            element={
              <ProtectedRoute>
                <InternalTestModule />
              </ProtectedRoute>
            }
          />

          <Route
            path="/redirect"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />


          <Route
            path="/user/assignment"
            element={
              <ProtectedRoute>
                <TraineeAssignmentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/result"
            element={
              <ProtectedRoute>
                <ResultComponent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/allottedtest/user"
            element={
              <ProtectedRoute>
                <ViewTraineeTestAllotment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/view/batch"
            element={
              <ProtectedRoute>
                <BatchManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/batch/requests"
            element={
              <ProtectedRoute>
                <BatchRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/assignment/requests"
            element={
              <ProtectedRoute>
                <AssignmentRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/view/assignment"
            element={
              <ProtectedRoute>
                <AssignmentManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/feedback/management"
            element={
              <ProtectedRoute>
                <FeedbackManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

// Enhanced Navbar component with direct navigation
const NavbarWithRouter = ({ setLoginStatus }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [showHoverImage, setShowHoverImage] = useState(false);
  const [hoverImagePosition, setHoverImagePosition] = useState({ x: 0, y: 0 });

  const user = useSelector((state) => state.user.user);
  const userData = JSON.parse(sessionStorage.getItem("user"));

  // Fetch profile image when component mounts or user changes
  useEffect(() => {
    if (userData && userData.emailId) {
      fetchProfileImage();
    }
  }, [userData]);

  const fetchProfileImage = async () => {
    try {
      const response = await axios.get(USER_PROFILE_IMAGE_URL, {
        params: { emailId: userData.emailId },
        responseType: 'blob'
      });
      
      if (response.data && response.data.size > 0) {
        const imageUrl = URL.createObjectURL(response.data);
        setProfileImage(imageUrl);
      }
    } catch (error) {
      console.log('No profile image found or error fetching image:', error);
      setProfileImage(null);
    }
  };

  const handleLogout = () => {
    try {
      // Clean up image URL to prevent memory leaks
      if (profileImage) {
        URL.revokeObjectURL(profileImage);
      }
      
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      setLoginStatus(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      sessionStorage.clear();
      localStorage.clear();
      setLoginStatus(false);
      navigate("/login");
    }
  };

  const handleDashboardNavigate = () => {
    if (userData.role === "instructor") {
      navigate("/instructor-dashboard");
    } else if (userData.role === "technical_manager") {
      navigate("/manager-dashboard");
    } else if (userData.role === "user") {
      navigate("/user-dashboard");
    }
  };

  const handleCertificateVerification = (e) => {
    e.preventDefault();
    navigate("/certificate");
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate("/register");
  };

  const handleInternRegisterClick = (e) => {
    e.preventDefault();
    navigate("/intern/register");
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleMouseEnter = (e) => {
    if (profileImage) {
      const rect = e.target.getBoundingClientRect();
      setHoverImagePosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 10
      });
      setShowHoverImage(true);
    }
  };

  const handleMouseLeave = () => {
    setShowHoverImage(false);
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (profileImage) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <span
            className={styles.navbarBrand}
            onClick={handleDashboardNavigate}
            style={{ cursor: "pointer" }}
          >
            <img
              src={src}
              alt="Yash Logo"
              height="55"
              onClick={handleDashboardNavigate}
            />
            <h3>LMS</h3>
          </span>

          <div className={styles.navbarLinks}>
            <button
              onClick={handleCertificateVerification}
              className={styles.navLinks}
            >
              <FontAwesomeIcon icon={faCircleCheck} />
              <span>Verify Certificate</span>
            </button>
            {sessionStorage.getItem("user") ? (
              <>
                <div className={styles.userProfile}>
                  <div 
                    className={`${styles.userAvatar} ${profileImage ? styles.userAvatarWithImage : ''}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className={styles.profileImage}
                      />
                    ) : (
                      userData.firstName[0] +
                      (userData.lastName ? userData.lastName[0] : "")
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {userData.firstName + " " + (userData.lastName || "")}
                    </span>
                    <span className={styles.divider}>|</span>
                    <span
                      className={styles.userRole}
                      style={{ fontWeight: 700, fontSize: "14px" }}
                    >
                      {(userData.role
                        ? userData.role.replace(/_/g, " ")
                        : "Not Available"
                      ).toUpperCase()}
                    </span>
                  </div>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  <FontAwesomeIcon icon={faRightFromBracket} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={handleRegisterClick} className={styles.navLinks}>
                  <FontAwesomeIcon icon={faUserPlus} />
                  <span>Register as Employee</span>
                </button>
                <button
                  onClick={handleInternRegisterClick}
                  className={styles.navLinks}
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  <span>Register as Intern</span>
                </button>
                <button onClick={handleLoginClick} className={styles.navLinks}>
                  <FontAwesomeIcon icon={faRightToBracket} />
                  <span>Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hover Image Modal */}
      {showHoverImage && profileImage && (
        <div 
          className={styles.hoverImageModal}
          style={{
            left: `${hoverImagePosition.x}px`,
            top: `${hoverImagePosition.y}px`
          }}
        >
          <img 
            src={profileImage} 
            alt="Profile Preview" 
            className={styles.hoverImage}
          />
        </div>
      )}
    </>
  );
};

export default App;

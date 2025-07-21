import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styles from './UserDashboard.module.css';
import DashboardSidebar from '../../assets/DashboardSidebar';
import { viewCourse } from '../../features/course/courseActions';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { loading, courses } = useSelector((state) => state.courses)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        await dispatch(viewCourse());
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, [dispatch]);

  const getUserData = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const token = sessionStorage.getItem("token");
    const role = user?.role || null;
    
    return {
      user,
      token,
      role,
    };
  } catch (error) {
    console.error("Error parsing user data:", error);
    return { user: null, token: null, role: null };
  }
};


      const needsProfileCompletion = (userData) => {
        const resumeNotUpdated = !userData.resumeStatus || userData.resumeStatus === 'not_updated';
        const photoNotUpdated = !userData.photoStatus || userData.photoStatus === 'not_updated';
        
        return resumeNotUpdated || photoNotUpdated;
    };

    const redirectUser = (userData) => {
        if (userData.role === 'user' && needsProfileCompletion(userData)) {
            navigate("/complete-profile");
            return;
        }

        if (userData.role === 'instructor' && needsProfileCompletion(userData)) {
            navigate("/complete-profile");
            return;
        }
        
        if (userData.role === 'instructor') {
            navigate("/instructor-dashboard");
        } else if (userData.role === 'user') {
            navigate("/user-dashboard");
        } else {
            navigate("/manager-dashboard");
        }
    };


  useEffect(() => {
    const{user,token}=getUserData();
    redirectUser(user);
  }, []);


  return (
    <div className={styles.dashboardContainer}>
      <DashboardSidebar activeLink="dashboard"/>

      {/* Main Content */}
      <main className={styles.dashboardMain}>
        {/* Welcome Banner */}
        <section className={styles.welcomeBanner}>
          <div className={styles.welcomeContent}>
            <h1>Welcome back</h1>
            <p>Pick up where you left off</p>
          </div>
          <div className={styles.learningStats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {courses?.reduce((total, course) => total + (course.totalHours || 0), 0) || 0}
              </span>
              <span className={styles.statLabel}>Hours Learned</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {courses?.filter(course => course.progress > 0 && course.progress < 100).length || 0}
              </span>
              <span className={styles.statLabel}>Courses In Progress</span>
            </div>
          </div>
        </section>

        {/* All Courses Section */}
        <section className={styles.learningSection}>
          <div className={styles.sectionHeader}>
            <h2>All Courses</h2>
            <Link to="/my-courses" className={styles.viewAll}>View My Learning</Link>
          </div>
          
          {loading ? (
            <div className={styles.loadingState}>Loading courses...</div>
          ) : (
            <div className={styles.courseCards}>
              {courses?.map(course => (
                <div key={course.id} className={styles.courseCard}>
                  <div className={styles.courseThumbnail}>
                    <img 
                      src={course.thumbnailUrl || "/default-course-thumbnail.jpg"} 
                      alt={course.courseName} 
                    />
                    {course.progress > 0 && (
                      <span className={styles.progressIndicator}>
                        {course.progress}% Complete
                      </span>
                    )}
                  </div>
                  <div className={styles.courseInfo}>
                    {console.log(course.courseName)}
                    <h3>{course.courseName}</h3>
                    <p className={styles.instructorName}>By {course.instructorName}</p>
                    <p className={styles.courseDescription}>{course.description}</p>
                    <div className={styles.courseDetails}>
                      <span className={styles.totalHours}>
                        Total Hours: {course.totalHours}
                      </span>
                    </div>
                    <Link to={`/course-preview/${course.id}`} className={styles.previewBtn}>
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* In Progress Courses */}
        {!loading && courses?.some(course => course.progress > 0 && course.progress < 100) && (
          <section className={styles.learningSection}>
            <div className={styles.sectionHeader}>
              <h2>Continue Learning</h2>
            </div>
            <div className={styles.courseCards}>
              {courses?.filter(course => course.progress > 0 && course.progress < 100)
                .slice(0, 2)
                .map(course => (
                  <div key={`inprogress-${course.id}`} className={styles.courseCard}>
                    <div className={styles.courseThumbnail}>
                      <img 
                        src={course.thumbnailUrl || "/default-course-thumbnail.jpg"} 
                        alt={course.courseName} 
                      />
                      <span className={styles.progressIndicator}>
                        {course.progress}% Complete
                      </span>
                    </div>
                    <div className={styles.courseInfo}>
                      <h3>{course.courseName}</h3>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progress} 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <p className={styles.lastWatched}>
                        Last watched: {course.lastWatchedModule || "Introduction"}
                      </p>
                      <Link to={`/course/${course.id}`} className={styles.continueBtn}>
                        Continue Learning
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
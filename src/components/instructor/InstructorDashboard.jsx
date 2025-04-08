import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './InstructorDashboard.module.css';
import CourseDetailsForm from './CourseDetails';
import AddCourseModal from './AddCourseModal';
import EditCourseModal from './EditCourseModal'; 
import CourseList from './CourseList';
import SuccessModal from '../../assets/SuccessModal';
import { useDispatch, useSelector } from 'react-redux';
import { addNewCourse, viewCourse, editCourseDetail } from '../../features/course/courseActions';

const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, courses } = useSelector((state) => state.courses);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false); // State for edit modal
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State for success modal
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const courseStatusOptions = ["APPROVED", "NOT_APPROVED", "PENDING", "REJECTED", "HOLD"];

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem('user')),
        token: sessionStorage.getItem('token'),
        role: sessionStorage.getItem('role')
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

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

  const handleAddDetails = (course) => {
    setSelectedCourse(course);
    setShowCourseDetails(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setShowEditCourse(true); // Open the edit modal
  };

  const handleSaveCourseDetails = (updatedCourse) => {
    console.log('Saving course details:', updatedCourse);
    setShowCourseDetails(false);
  };

  const handleSubmitNewCourse = async (course, imageFile) => {
    const { user, token, role } = getUserData();
  
    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }
  
    // Create the course data object with the image file
    const courseData = {
      course: {
        courseName: course.courseName,
        totalHours: course.totalHours,
        description: course.description,
      },
      user,
      token,
      role: user.role,
      imageFile: imageFile // Add the image file to the data
    };
  
    console.log("Submitting course with data:", courseData);
  
    try {
      const resultAction = await dispatch(addNewCourse(courseData));
      
      // Check if the action was fulfilled
      if (addNewCourse.fulfilled.match(resultAction)) {
        setShowAddCourse(false);
        setSuccessMessage("Course added successfully!"); 
        setShowSuccessModal(true);
        
        // Refresh the course list after adding a new course
        dispatch(viewCourse());
      } else {
        throw new Error("Failed to add course");
      }
    } catch (err) {
      console.error("Failed to add course:", err);
      const errorMessage = err.message || "An error occurred while adding the course.";
      alert(errorMessage);
    }
  };

  const handleEditSubmit = async (courseData) => {
    // Destructure all necessary fields, including description
    const { courseId, courseName, totalHours, description, courseCompletionStatus } = courseData;

    // Ensure description is included in the updated course object
    const updatedCourse = {
      courseId,
      courseName,
      totalHours,
      description, 
      courseCompletionStatus
    };

    console.log("Updating course with data:", updatedCourse);

    try {
      const resultAction = await dispatch(editCourseDetail({ 
        course: updatedCourse,
        user: getUserData().user,
        token: getUserData().token
      }));
      
      // Check if the action was fulfilled
      if (editCourseDetail.fulfilled.match(resultAction)) {
        setSuccessMessage("Course updated successfully!");
        setShowEditCourse(false);
        setShowSuccessModal(true);
        dispatch(viewCourse()); // Refresh the course list
      } else {
        throw new Error("Failed to update course");
      }
    } catch (error) {
      console.error("Failed to update course:", error);
      alert("Failed to update course.");
    }
  };
  
  // Filter courses based on search term and status filter
  const getFilteredCourses = () => {
    if (!courses) return [];

    return courses.filter(course => {
      const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                            course.courseStatus.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  };

  // Get filtered courses
  const filteredCourses = getFilteredCourses();

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  return (
    <div className={styles.adminDashboard}>
      {/* Sidebar Navigation */}
      <aside className={styles.dashboardSidebar}>
        <nav className={styles.sidebarNav}>
          <ul>
            <li className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}>
              <a href="#dashboard" onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
                navigate("/instructor-dashboard")
              }}>
                <i className="fas fa-tachometer-alt"></i>
                Courses
              </a>
            </li>
            <li className={`${styles.navItem} ${activeTab === 'tests' ? styles.active : ''}`}>
              <a href="#tests" onClick={(e) => {
                e.preventDefault();
                setActiveTab('tests');
                navigate("/instructor/view/test")
              }}>
                <i className="fas fa-users"></i>
                Tests
              </a>
            </li>
            <li className={`${styles.navItem} ${activeTab === 'library' ? styles.active : ''}`}>
              <a href="#library" onClick={(e) => {
                e.preventDefault();
                setActiveTab('library');
                navigate("/instructor/course/library")
              }}>
                <i className="fas fa-users"></i>
                Question Library
              </a>
            </li>
            
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h1>Course Management</h1>
            <button 
              className={styles.addCourseBtn}
              onClick={() => setShowAddCourse(true)}
            >
              Create New Course
            </button>
          </div>
          <div className={styles.headerRight}>
            <input 
              type="search" 
              placeholder="Search courses..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">All Status</option>
              {courseStatusOptions.map(status => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Display search results info when filtering */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className={styles.searchResultsInfo}>
            <p>
              {filteredCourses.length === 0 
                ? 'No courses match your search criteria' 
                : `Found ${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''}`}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                className={styles.clearFiltersBtn}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Course List Component */}
        <CourseList 
          courses={filteredCourses}
          loading={loading}
          error={error}
          onAddDetails={handleAddDetails}
          onEditCourse={handleEditCourse} // Pass the edit handler
        />

        {/* Add Course Modal Component */}
        <AddCourseModal 
          isOpen={showAddCourse}
          onClose={() => setShowAddCourse(false)}
          onSubmit={handleSubmitNewCourse}
        />

        {/* Edit Course Modal Component */}
        <EditCourseModal 
          isOpen={showEditCourse}
          onClose={() => setShowEditCourse(false)}
          onSubmit={handleEditSubmit}
          course={selectedCourse} // Pass the selected course
        />

        {/* Course Details Modal */}
        {showCourseDetails && selectedCourse && (
          <div className={styles.modal}>
            <div className={`${styles.modalContent} ${styles.largeModal}`}>
              <header className={styles.modalHeader}>
                <h2>Add Course Details</h2>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowCourseDetails(false)}
                >
                  ×
                </button>
              </header>
              
              <CourseDetailsForm 
                course={selectedCourse}
                onSave={handleSaveCourseDetails}
                onCancel={() => setShowCourseDetails(false)}
              />
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <SuccessModal 
            message={successMessage} 
            onClose={() => setShowSuccessModal(false)} 
          />
        )}
      </main>
    </div>
  );
};

export default InstructorDashboard;
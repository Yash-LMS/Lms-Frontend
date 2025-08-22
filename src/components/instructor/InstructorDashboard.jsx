import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './InstructorDashboard.module.css';
import CourseDetailsForm from './CourseDetails';
import AddCourseModal from './AddCourseModal';
import EditCourseModal from './EditCourseModal'; 
import CourseList from './CourseList';
import SuccessModal from '../../assets/SuccessModal';
import { useDispatch, useSelector } from 'react-redux';
import { addNewCourse, viewCourse, editCourseDetail } from '../../features/course/courseActions';
import { COURSE_CTR_DOWNLOAD} from "../../constants/apiConstants";
import InstructorSidebar from './InstructorSidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDownload, faTimes } from '@fortawesome/free-solid-svg-icons';

const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, courses } = useSelector((state) => state.courses);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false); // State for edit modal
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State for success modal
  const [showCtrModal, setShowCtrModal] = useState(false); // State for CTR modal
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDownloading, setIsDownloading] = useState(false); // Loading state for download

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


     const updateEmployeeId = (user) => {
    const employeeIdNotUpdated =   user.employeeId === null || user.employeeId === 0 ;
   
    
    return employeeIdNotUpdated;
  };
   const redirectUser = () => {
   
    const {user,token}=getUserData();


     if (user.role === 'instructor' && updateEmployeeId(user)) {
      navigate("/update-employeeId");
      return;
    }
 
    if (user.role === 'instructor') {
      navigate("/instructor-dashboard");
    } else if (user.role === 'user') {
      navigate("/user-dashboard");
    } else {
      navigate("/manager-dashboard");
    }
  };

  useEffect(() => {
    redirectUser();
  }, []);

  // Fixed useEffect to avoid infinite loop by using an empty dependency array
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        await dispatch(viewCourse());
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchCourses();
  }, []); // Empty dependency array so it only runs once when mounted

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

  // Handle showing the CTR modal
  const handleShowCtrModal = () => {
    setShowCtrModal(true);
  };

  // Download CTR Report function with report type
  const handleDownloadCTR = async (reportType) => {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      alert("User session data is missing. Please log in again.");
      return;
    }

    setIsDownloading(true);
    setShowCtrModal(false);
    
    try {
      const requestData = {
        user,
        token,
        ctrFetchType: reportType // Add the report type to the request
      };

      const response = await axios.post(`${COURSE_CTR_DOWNLOAD}`, requestData, {
        responseType: 'blob', // Important for downloading files
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Create blob link to download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `CTR_Report_${reportType.toLowerCase()}.xlsx`;
      
      if (contentDisposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(link.href);
      
      setSuccessMessage(`${reportType} CTR Report downloaded successfully!`);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Failed to download CTR report:", error);
      let errorMessage = "Failed to download CTR report.";
      
      if (error.response?.status === 401) {
        errorMessage = "Unauthorized. Please log in again.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      alert(errorMessage);
    } finally {
      setIsDownloading(false);
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
      <InstructorSidebar activeTab={activeTab} />

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h1>Course Management</h1>
            <div className={styles.buttonGroup}>
              <button 
                className={styles.addCourseBtn}
                onClick={() => setShowAddCourse(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span style={{marginLeft:'5px'}}>Create Course</span>
              </button>
              
              <button 
                className={`${styles.downloadCtrBtn} ${isDownloading ? styles.downloading : ''}`}
                onClick={handleShowCtrModal}
                disabled={isDownloading}
              >
                <FontAwesomeIcon 
                  icon={faDownload} 
                  className={isDownloading ? styles.spinning : ''}
                />
                <span style={{marginLeft:'5px'}}>
                  {isDownloading ? 'Downloading...' : 'Download CTR Report'}
                </span>
              </button>
            </div>
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

        {/* CTR Report Type Selection Modal */}
        {showCtrModal && (
          <div className={styles.ctrModal}>
            <div className={styles.ctrModalContent}>
              <header className={styles.ctrModalHeader}>
                <h2>Select Report Type</h2>
                <button 
                  className={styles.ctrModalCloseButton}
                  onClick={() => setShowCtrModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </header>
              
              <div className={styles.ctrModalBody}>
                <p className={styles.ctrModalDescription}>
                  Choose the type of CTR report you want to download:
                </p>
                
                <div className={styles.ctrReportOptions}>
                  <div 
                    className={styles.ctrReportOption}
                    onClick={() => handleDownloadCTR('CURRENT')}
                  >
                    <div className={styles.ctrReportOptionIcon}>
                      <FontAwesomeIcon icon={faDownload} />
                    </div>
                    <div className={styles.ctrReportOptionInfo}>
                      <h3>Current Report</h3>
                      <p>Download report for current/ongoing courses</p>
                    </div>
                  </div>
                  
                  <div 
                    className={styles.ctrReportOption}
                    onClick={() => handleDownloadCTR('COMPLETE')}
                  >
                    <div className={styles.ctrReportOptionIcon}>
                      <FontAwesomeIcon icon={faDownload} />
                    </div>
                    <div className={styles.ctrReportOptionInfo}>
                      <h3>Complete Report</h3>
                      <p>Download report for all completed courses</p>
                    </div>
                  </div>
                </div>
                
                <div className={styles.ctrModalActions}>
                  <button 
                    className={styles.ctrCancelBtn}
                    onClick={() => setShowCtrModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { REQUEST_BADGE_URL } from '../../constants/apiConstants'; // Import your API constant
import styles from './Sidebar.module.css';
// Import Font Awesome components
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHouse, 
  faClipboardList, 
  faUsers,
  faPenToSquare,
  faBarsProgress,
  faBell,
  faEye,
  faTasks,
  faFingerprint
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ activeTab }) => {
  const navigate = useNavigate();
  const [courseBadgeCount, setCourseBadgeCount] = useState(0); // State for course requests badge count
  const [testBadgeCount, setTestBadgeCount] = useState(0); // State for test requests badge count
  const [batchBadgeCount, setBatchBadgeCount] = useState(0);
  const [assignmentBadgeCount, setAssignmentBadgeCount] = useState(0);
  const [notActiveEmployeeCount, setNotActiveEmployeeCount] = useState(0);
  const [notActiveInternCount, setNotActiveInternCount] = useState(0);

  const handleNavigation = (path, tab, e) => {
    if (e) e.preventDefault();
    navigate(path);
  };
  
  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null };
    }
  };

  useEffect(() => {
    const fetchBadgeInformation = async () => {
      const { user, token } = getUserData(); 

      if (!user || !token) {
        console.error("User session data is missing.");
        return;
      }

      try {
        const response = await axios.post(REQUEST_BADGE_URL, {
          user, // Send user as token
          token,
        });

        if (response.data && response.data.payload) {
          setCourseBadgeCount(response.data.payload.courseRequestPending || 0); // Set course badge count
          setTestBadgeCount(response.data.payload.testRequestPending || 0); // Set test badge count
          setBatchBadgeCount(response.data.payload.batchRequestPending || 0);
          setAssignmentBadgeCount(response.data.payload.assignmentRequestPending || 0);
          setNotActiveEmployeeCount(response.data.payload.employeeRequestCount || 0); // Set not active count
          setNotActiveInternCount(response.data.payload.internRequestCount || 0);
        }
      } catch (error) {
        console.error("Error fetching badge information:", error);
      }
    };

    fetchBadgeInformation();
  }, []); // Empty dependency array to run only on mount

  return (
    <aside className={styles.dashboardSidebar}>
      <nav className={styles.sidebarNav}>
        <ul>
          <li className={`${styles.navItem} ${activeTab === "dashboard" ? styles.active : ""}`}>
            <a
              href="#dashboard"
              onClick={(e) => handleNavigation('/manager-dashboard', 'dashboard', e)}
            >
              <FontAwesomeIcon icon={faHouse} />
              <span className={styles.navText}>Dashboard</span>
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "requests" ? styles.active : ""}`}>
            <a
              href="#requests"
              onClick={(e) => handleNavigation('/manager/requests', 'requests', e)}
            >
              <FontAwesomeIcon icon={faBell} />
              <span className={styles.navText}>Course Requests</span>
              {courseBadgeCount > 0 && (
                <span className={styles.badge}>{courseBadgeCount}</span>
              )}
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "testRequests" ? styles.active : ""}`}>
            <a
              href="#testRequests"
              onClick={(e) => handleNavigation('/manager/test/requests', 'testRequests', e)}
              className={styles.navButton}
            >
              <FontAwesomeIcon icon={faBell} />
              <span className={styles.navText}>Test Requests</span>
              {testBadgeCount > 0 && (
                <span className={styles.badge}>{testBadgeCount}</span>
              )}
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "batchRequests" ? styles.active : ""}`}>
            <a
              href="#batchRequests"
              onClick={(e) => handleNavigation('/manager/batch/requests', 'batchRequests', e)}
              className={styles.navButton}
            >
              <FontAwesomeIcon icon={faBell} />
              <span className={styles.navText}>Batch Requests</span>
              {batchBadgeCount > 0 && (
                <span className={styles.badge}>{batchBadgeCount}</span>
              )}
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "assignmentRequests" ? styles.active : ""}`}>
            <a
              href="#assignmentRequests"
              onClick={(e) => handleNavigation('/manager/assignment/requests', 'assignmentRequests', e)}
              className={styles.navButton}
            >
              <FontAwesomeIcon icon={faBell} />
              <span className={styles.navText}>Assignment Requests</span>
              {assignmentBadgeCount > 0 && (
                <span className={styles.badge}>{assignmentBadgeCount}</span>
              )}
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === "batch" ? styles.active : ""}`}>
            <a
              href="#batch"
              onClick={(e) => handleNavigation('/view/batch', 'batch', e)}
            >
              <FontAwesomeIcon icon={faUsers} />
              <span className={styles.navText}>Batches</span>
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === "assignments" ? styles.active : ""}`}>
            <a
              href="#assignments"
              onClick={(e) => handleNavigation('/view/assignment', 'assignments', e)}
            >
              <FontAwesomeIcon icon={faTasks} />
              <span className={styles.navText}>Assignments</span>
        
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === "feedback" ? styles.active : ""}`}>
            <a
              href="#feedback"
              onClick={(e) => handleNavigation('/feedback/management', 'feedback', e)}
            >
              <FontAwesomeIcon icon={faTasks} />
              <span className={styles.navText}>Feedback</span>
        
            </a>
          </li>
          

          <li className={`${styles.navItem} ${activeTab === "allot" ? styles.active : ""}`}>
            <a
              href="#allotment"
              onClick={(e) => handleNavigation('/manager/allotment', 'allot', e)}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
              <span className={styles.navText}>Allotments</span>
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === 'progress' ? styles.active : ''}`}>
          <a
              href="#progress"
              onClick={(e) => handleNavigation('/manager/courseProgress', 'progress', e)}
            >
              <FontAwesomeIcon icon={faBarsProgress} />
              <span className={styles.navText}>User Course Progress</span>
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === "results" ? styles.active : ""}`}>
            <a
              href="#testResults"
              onClick={(e) => handleNavigation('/manager/result', 'results', e)}
            >
              <FontAwesomeIcon icon={faClipboardList} />
              <span className={styles.navText}>Results</span>
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === "allotted" ? styles.active : ""}`}>
            <a
              href="#userAllotment"
              onClick={(e) => handleNavigation('/manager/allottedtest/user', 'alloted', e)}
            >
              <FontAwesomeIcon icon={faEye} />
              <span className={styles.navText}>View Allotted Test</span>
            </a>
          </li>
          
          <li className={`${styles.navItem} ${activeTab === "employee" ? styles.active : ""}`}>
            <a
              href="#employee"
              onClick={(e) => handleNavigation('/manager/employee', 'employee', e)}
            >
              <FontAwesomeIcon icon={faUsers} />
              <span className={styles.navText}>Employee Management</span>
              {notActiveEmployeeCount > 0 && (
                <span className={styles.badge}>{notActiveEmployeeCount}</span>
              )}
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === "intern" ? styles.active : ""}`}>
            <a
              href="#intern"
              onClick={(e) => handleNavigation('/manager/intern', 'intern', e)}
            >
              <FontAwesomeIcon icon={faUsers} />
              <span className={styles.navText}>Intern Management</span>
              {notActiveInternCount > 0 && (
                <span className={styles.badge}>{notActiveInternCount}</span>
              )}
            </a>
          </li>

         <li className={`${styles.navItem} ${activeTab === "password" ? styles.active : ""}`}>
            <a
              href="#password"
              onClick={(e) => handleNavigation('/manager/update/password', 'password', e)}
            >
              <FontAwesomeIcon icon={faFingerprint} />
              <span className={styles.navText}>Update Password</span>
     
            </a>
          </li>

        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
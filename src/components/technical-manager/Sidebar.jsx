import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { REQUEST_BADGE_URL } from '../../constants/apiConstants'; // Import your API constant
import styles from './Sidebar.module.css';

const Sidebar = ({ activeTab }) => {
  const navigate = useNavigate();
  const [courseBadgeCount, setCourseBadgeCount] = useState(0); // State for course requests badge count
  const [testBadgeCount, setTestBadgeCount] = useState(0); // State for test requests badge count

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
        console.error("User  session data is missing.");
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
              <i className="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "requests" ? styles.active : ""}`}>
            <a
              href="#requests"
              onClick={(e) => handleNavigation('/manager/requests', 'requests', e)}
            >
              <i className="fas fa-clipboard-list"></i>
              Course Requests
              {courseBadgeCount > 0 && (
                <span className={styles.badge}>{courseBadgeCount}</span> // Display course badge count
              )}
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "testRequests" ? styles.active : ""}`}>
            <a
              href="#testRequests"
              onClick={(e) => handleNavigation('/manager/test/requests', 'testRequests', e)}
              className={styles.navButton}
            >
              <i className="fas fa-clipboard-list"></i>
              Test Requests
              {testBadgeCount > 0 && (
                <span className={styles.badge}>{testBadgeCount}</span> // Display test badge count
              )}
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "allot" ? styles.active : ""}`}>
            <a
              href="#allotment"
              onClick={(e) => handleNavigation('/manager/allotment', 'allot', e)}
            >
              <i className="fas fa-clipboard-list"></i>
              Allotments
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === 'progress' ? styles.active : ''}`}>
          <a
              href="#progress"
              onClick={(e) => handleNavigation('/manager/courseProgress', 'progress', e)}
            >
              <i className="fas fa-users"></i>
              User Course Progress
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === "results" ? styles.active : ""}`}>
            <a
              href="#testResults"
              onClick={(e) => handleNavigation('/manager/result', 'results', e)}
            >
              <i className="fas fa-clipboard-list"></i>
              Results
            </a>
          </li>

          <li className={`${styles.navItem} ${activeTab === "allotted" ? styles.active : ""}`}>
            <a
              href="#userAllotment"
              onClick={(e) => handleNavigation('/manager/allottedtest/user', 'alloted', e)}
            >
              <i className="fas fa-clipboard-list"></i>
              View Allotted Test
            </a>
          </li>
          
          <li className={`${styles.navItem} ${activeTab === "employee" ? styles.active : ""}`}>
            <a
              href="#employee"
              onClick={(e) => handleNavigation('/manager/employee', 'employee', e)}
            >
              <i className="fas fa-clipboard-list"></i>
              Employee Management
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
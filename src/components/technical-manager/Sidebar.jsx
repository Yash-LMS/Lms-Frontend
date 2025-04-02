import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = ({ activeTab }) => {
  const navigate = useNavigate();

  const handleNavigation = (path, tab, e) => {
    if (e) e.preventDefault();
    navigate(path);
  };

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
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "allot" ? styles.active : ""}`}>
            <a
              href="#allotment"
              onClick={(e) => handleNavigation('/manager/allotment', 'allot', e)}
            >
              <i className="fas fa-clipboard-list"></i>
              Course Allotment
            </a>
          </li>
          <li className={`${styles.navItem} ${activeTab === "testAllot" ? styles.active : ""}`}>
            <a
              href="#testAllotment"
              onClick={(e) => handleNavigation('/manager/test/allotment', 'testAllot', e)}
            >
              <i className="fas fa-clipboard-list"></i>
              Test Allotment
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
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../components/user/UserDashboard.module.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListCheck, faFolderOpen,faKey, faClipboardList
} from '@fortawesome/free-solid-svg-icons';

const DashboardSidebar = ({ activeTab }) => {
  return (
    <div className={styles.dashboardSidebar}>
      <nav className={styles.sidebarNav}>
        <ul>
          <li className={`${styles.navItem} ${activeTab === "dashboard" ? styles.active : ""}`}>
            <Link to="/user-dashboard">
              <FontAwesomeIcon icon={faFolderOpen} />
              <span>My Courses</span>
            </Link>
          </li>
          <li className={`${styles.navItem} ${activeTab === "tests" ? styles.active : ""}`}>
            <Link to="/my-test">
              <FontAwesomeIcon icon={faListCheck} />
              <span>My Tests</span>
            </Link>
          </li>

                <li className={`${styles.navItem} ${activeTab === "codingTask" ? styles.active : ""}`}>
            <Link to="/test/coding/viewAssignmentList">
              <FontAwesomeIcon icon={faClipboardList} />
              <span>Coding Task</span>
            </Link>
          </li>

                <li className={`${styles.navItem} ${activeTab === "assignment" ? styles.active : ""}`}>
            <Link to="/user/assignment">
              <FontAwesomeIcon icon={faClipboardList} />
              <span>My Assignment</span>
            </Link>
          </li>
     
     <li className={`${styles.navItem} ${activeTab === "password" ? styles.active : ""}`}>
  <Link to="/user/update/password">
    <FontAwesomeIcon icon={faKey} />
    <span>Update Password</span>
  </Link>
</li>

          {/* Uncomment and add more links as needed */}
          {/* <li className={styles.navItem}>
            <Link to="/certificates">
              <i className="fas fa-certificate"></i>
              <span>Certificates</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/discussions">
              <i className="fas fa-comments"></i>
              <span>Discussions</span>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link to="/progress">
              <i className="fas fa-chart-line"></i>
              <span>Progress</span>
            </Link>
          </li> */}
        </ul>
      </nav>
    </div>
  );
};

export default DashboardSidebar;
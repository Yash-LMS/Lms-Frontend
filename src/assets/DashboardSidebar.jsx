import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../components/user/UserDashboard.module.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListCheck, faFolderOpen
} from '@fortawesome/free-solid-svg-icons';

const DashboardSidebar = ({ activeLink }) => {
  return (
    <div className={styles.dashboardSidebar}>
      <nav className={styles.sidebarNav}>
        <ul>
          <li className={`${styles.navItem} ${activeLink === "dashboard" ? styles.active : ""}`}>
            <Link to="/user-dashboard">
              <FontAwesomeIcon icon={faFolderOpen} />
              <span>My Courses</span>
            </Link>
          </li>
          <li className={`${styles.navItem} ${activeLink === "tests" ? styles.active : ""}`}>
            <Link to="/my-test">
              <FontAwesomeIcon icon={faListCheck} />
              <span>My Tests</span>
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
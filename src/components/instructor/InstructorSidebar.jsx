import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./InstructorSidebar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck, faFolderOpen,faRectangleList, faClipboardList, faPen } from "@fortawesome/free-solid-svg-icons";

const InstructorSidebar = ({ activeTab }) => {
    const navigate = useNavigate();

    const handleNavigation = (path, tab, e) => {
        if (e) e.preventDefault();
        navigate(path);
      };
  return (
    <aside className={styles.dashboardSidebar}>
      <nav className={styles.sidebarNav}>
        <ul>
          <li
            className={`${styles.navItem} ${
              activeTab === "dashboard" ? styles.active : ""
            }`}
          >
            <a
              href="#dashboard"
              onClick={(e) => handleNavigation('/instructor-dashboard', 'dashboard', e)}
            >
              <FontAwesomeIcon icon={faFolderOpen} />
              Courses
            </a>
          </li>
          <li
            className={`${styles.navItem} ${
              activeTab === "tests" ? styles.active : ""
            }`}
          >
            <a
              href="#tests"
              onClick={(e) => handleNavigation('/instructor/view/test', 'tests', e)}
            >
              <FontAwesomeIcon icon={faListCheck} />
              Tests
            </a>
          </li>
          <li
            className={`${styles.navItem} ${
              activeTab === "library" ? styles.active : ""
            }`}
          >
            <a
              href="#library"
              onClick={(e) => handleNavigation('/instructor/course/library', 'library', e)}
            >
              <FontAwesomeIcon icon={faRectangleList} />
              Question Library
            </a>
          </li>
          <li
            className={`${styles.navItem} ${
              activeTab === "editLibrary" ? styles.active : ""
            }`}
          >
            <a
              href="#editLibrary"
              onClick={(e) => handleNavigation('/instructor/course/editLibrary', 'editLibrary', e)}
            >
              <FontAwesomeIcon icon={faPen} />
              Edit Question Library
            </a>
          </li>
          <li
            className={`${styles.navItem} ${
              activeTab === "results" ? styles.active : ""
            }`}
          >
            <a
              href="#results"
              onClick={(e) => handleNavigation('/instructor/view/result', 'results', e)}
            >
              <FontAwesomeIcon icon={faClipboardList} />
              Test Result
            </a>
          </li>

          <li
            className={`${styles.navItem} ${
              activeTab === "batches" ? styles.active : ""
            }`}
          >
            <a
              href="#batches"
              onClick={(e) => handleNavigation('/instructor/view/batch', 'batches', e)}
            >
              <FontAwesomeIcon icon={faClipboardList} />
              Batches
            </a>
          </li>

        </ul>
      </nav>
    </aside>
  );
};

export default InstructorSidebar;

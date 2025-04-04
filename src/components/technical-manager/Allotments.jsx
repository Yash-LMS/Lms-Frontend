import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ResultComponent.module.css";
import CourseAllotment from "./CourseAllotment";
import TestAllotment from "./TestAllotment";

const ResultComponent = () => {
  const [activeView, setActiveView] = useState("course");
  const navigate = useNavigate();

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  return (
    <div className={styles.mainContainer}>
      {/* Action buttons at the top */}
      <div className={styles.actionsContainer}>
        <div className={styles.pageHeader}>
          <h1>Allotments</h1>
        </div>
        <button
          className={`${styles.actionButton} ${
            activeView === "course" ? styles.activeButton : ""
          }`}
          onClick={() => handleViewChange("course")}
        >
          Course Allotment
        </button>
        <button
          className={`${styles.actionButton} ${
            activeView === "test" ? styles.activeButton : ""
          }`}
          onClick={() => handleViewChange("test")}
        >
          Test Allotment
        </button>
      </div>

      {/* Content area */}
      <div className={styles.contentArea}>
        {activeView === "course" ? <CourseAllotment /> : <TestAllotment />}
      </div>
    </div>
  );
};

export default ResultComponent;

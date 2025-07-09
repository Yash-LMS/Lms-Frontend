import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ResultComponent.module.css";
import CourseAllotment from "./CourseAllotment";
import TestAllotment from "./TestAllotment";
import AssignmentAllotment from "./AssignmentAllotment";

const Allotments = () => {
  const [activeView, setActiveView] = useState("course");
  const navigate = useNavigate();

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const renderContent = () => {
    switch (activeView) {
      case "course":
        return <CourseAllotment />;
      case "test":
        return <TestAllotment />;
      case "assignment":
        return <AssignmentAllotment />;
      default:
        return <CourseAllotment />;
    }
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
        <button
          className={`${styles.actionButton} ${
            activeView === "assignment" ? styles.activeButton : ""
          }`}
          onClick={() => handleViewChange("assignment")}
        >
          Assignment Allotment
        </button>
      </div>

      {/* Content area */}
      <div className={styles.contentArea}>
        {renderContent()}
      </div>
    </div>
  );
};

export default Allotments;
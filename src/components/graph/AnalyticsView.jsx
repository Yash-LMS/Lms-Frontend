import React, { useState, useEffect } from 'react';
import CourseAnalytics from './CourseAnalytics';
import TestAnalytics from './TestAnalytics';
import styles from './AnalyticsView.module.css';
import Sidebar from '../technical-manager/Sidebar';
import InstructorSidebar from '../instructor/InstructorSidebar';

const AnalyticsView = () => {
  const [activeView, setActiveView] = useState('course');
  const [role, setRole] = useState();
  const [activeTab, setActiveTab] = useState("analytics");

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
        role: sessionStorage.getItem("role"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  useEffect(() => {
    const { user, token, role } = getUserData();
    
    if (user && role) {
      setRole(role);
    }
  }, []);

  const handleViewChange = (event) => {
    setActiveView(event.target.value);
  };

  return (
    <div className={styles.container}>
      {role === "technical_manager" ? (
        <Sidebar activeTab={activeTab} />
      ) : role === "instructor" ? (
        <InstructorSidebar activeTab={activeTab} />
      ) : null}

      <div className={styles.mainContent}>
        <div className={styles.header}>
          
          <div className={styles.viewSelector}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="analyticsView"
                  value="course"
                  checked={activeView === 'course'}
                  onChange={handleViewChange}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom}></span>
                <span className={styles.radioText}>Course Analytics</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="analyticsView"
                  value="test"
                  checked={activeView === 'test'}
                  onChange={handleViewChange}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom}></span>
                <span className={styles.radioText}>Test Analytics</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.analyticsContent}>
          {activeView === 'course' ? (
            <CourseAnalytics />
          ) : (
            <TestAnalytics />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
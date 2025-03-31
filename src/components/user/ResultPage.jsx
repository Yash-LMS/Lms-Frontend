import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./ResultPage.module.css";

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [navigationPath, setNavigationPath] = useState("/user-dashboard");
  const [buttonText, setButtonText] = useState("Go to Dashboard");

  useEffect(() => {
    // Get result and navigation details from location state if available
    if (location.state) {
      if (location.state.result) {
        setResult(location.state.result);
      }
      
      if (location.state.navigationPath) {
        setNavigationPath(location.state.navigationPath);
      }
      
      if (location.state.buttonText) {
        setButtonText(location.state.buttonText);
      }
    }
  }, [location]);

  // Calculate percentage score
  const calculatePercentage = () => {
    if (!result) return 0;
    return ((result.score / result.totalMarks) * 100).toFixed(1);
  };

  // Determine result status based on score
  const getResultStatus = () => {
    if (!result) return '';
    const percentage = (result.score / result.totalMarks) * 100;
    if (percentage >= 90) return styles.excellent;
    if (percentage >= 75) return styles.good;
    if (percentage >= 60) return styles.average;
    if (percentage >= 40) return styles.belowAverage;
    return styles.poor;
  };

  if (!result) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Test Submitted Successfully</h2>
        </div>

        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <div className={`${styles.scoreCircle} ${getResultStatus()}`}>
              <div className={styles.scoreValue}>{calculatePercentage()}%</div>
              <div className={styles.scoreLabel}>Score</div>
            </div>
            
            <div className={styles.testInfo}>
              <h3>Test Summary</h3>
              <p className={styles.testDescription}>Test Name: {result.testName || "Assessment Results"}</p>
              <p className={styles.testId}>Allotment ID: {result.allotmentId}</p>
            </div>
          </div>
          
          <div className={styles.resultMetrics}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{result.correctAnswers}</div>
              <div className={styles.metricLabel}>Correct</div>
            </div>
            
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{result.incorrectAnswers}</div>
              <div className={styles.metricLabel}>Incorrect</div>
            </div>
            
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{result.questionSkipped}</div>
              <div className={styles.metricLabel}>Skipped</div>
            </div>
            
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{result.totalQuestion}</div>
              <div className={styles.metricLabel}>Total</div>
            </div>
          </div>
          
          <div className={styles.scoreDetails}>
            <div className={styles.scoreItem}>
              <span className={styles.scoreLabel}>Score:</span>
              <span className={styles.scoreValue}>{result.score} out of {result.totalMarks} points</span>
            </div>
            
            <div className={styles.progressBarContainer}>
              <div 
                className={`${styles.progressBar} ${getResultStatus()}`}
                style={{ width: `${calculatePercentage()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <button className={styles.dashboardButton} onClick={() => navigate(navigationPath)}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
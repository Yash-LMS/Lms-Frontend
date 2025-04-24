import React, { useEffect, useState } from "react";
import axios from "axios";
import { RESULT_TEST_URL } from "../../constants/apiConstants";
import styles from "./ResultPopup.module.css";

const ResultPopup = ({ testAllotmentId, onClose }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const[message,setMessage]=useState('');

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
    const fetchTestResult = async () => {
      try {
        const { user, token } = getUserData();

        const response = await axios.post(RESULT_TEST_URL, {
          user,
          token,
          testAllotmentId
        });

        if (response.data.response === "success") {
          setResult(response.data.payload);
        } else {
          setError(response.data.message || "Result not found.");
        }
        setMessage(response.data.message)
      } catch (err) {
        setError("An error occurred while fetching test results");
        console.error("Error fetching test results:", err);
      } finally {
        setLoading(false);
      }
    };

    if (testAllotmentId) {
      fetchTestResult();
    }
  }, [testAllotmentId]);

  const calculatePercentage = () => {
    if (!result) return 0;
    return ((result.score / result.totalMarks) * 100).toFixed(1);
  };

  const getResultStatus = () => {
    if (!result) return '';
    const percentage = (result.score / result.totalMarks) * 100;
    if (percentage >= 90) return styles.excellent;
    if (percentage >= 75) return styles.good;
    if (percentage >= 60) return styles.average;
    if (percentage >= 40) return styles.belowAverage;
    return styles.poor;
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <div className={styles.popupHeader}>
          <h2>Test Results</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className={styles.popupContent}>
          {loading && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading your results...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>!</div>
              <p>{error}</p>
            </div>
          )}

        {!loading && !error && !result && (
           <div className={styles.restrictedContainer}>
           <div className={styles.lockWrapper}>
           <span className={styles.lockIcon}>🔒</span>
          </div>
          <h2 className={styles.title}>Test Results Restricted</h2>
          <p className={styles.description}>{message} </p>
          </div>
        )}



          {!loading && !error && result && (
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
                  <div className={styles.metricLabel}>Unattempted</div>
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
          )}

          <div className={styles.popupFooter}>
            <button className={styles.closeBtn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPopup;

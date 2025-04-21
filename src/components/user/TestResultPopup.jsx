// TestResultPopup.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./TestResultPopup.module.css";
import { DETAIL_RESULT_TEST_URL } from "../../constants/apiConstants";

const TestResultPopup = ({ testAllotmentId, onClose }) => {
  const [resultData, setResultData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const fetchResults = async () => {
      try {
        const { user, token } = getUserData();

        if (!user || !token) {
          throw new Error("User authentication failed. Please login again.");
        }

        const response = await axios.post(`${DETAIL_RESULT_TEST_URL}`, {
          user: { emailId: user.emailId },
          token,
          testAllotmentId,
        });

        console.log(response.data);

        if (response.data.response === "success") {
          setResultData(response.data.payload);
        } else {
          throw new Error(response.data.message || "Failed to fetch results");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testAllotmentId]);

  const getOptionLabel = (optionKey) => {
    return optionKey.replace("option", "").toUpperCase();
  };

  const renderOptions = (question, evaluation) => {
    const options = [];
    const correctOptions = evaluation.correctOptions.split("/");
    const chosenOption = evaluation.optionChosen;

    // Build array of options from question object
    for (let i = 1; i <= 8; i++) {
      const optionKey = `option${i}`;
      if (question[optionKey]) {
        options.push({
          key: optionKey,
          value: question[optionKey],
          isCorrect: correctOptions.includes(optionKey),
          isChosen:
            chosenOption === optionKey ||
            (chosenOption && chosenOption.split("/").includes(optionKey)),
        });
      }
    }

    return options.map((option) => (
      <div
        key={option.key}
        className={`${styles.option} ${
          option.isCorrect ? styles.correct : ""
        } ${option.isChosen ? styles.chosen : ""}`}
      >
        <span className={styles.optionLabel}>{getOptionLabel(option.key)}</span>
        <span className={styles.optionText}>{option.value}</span>
        {option.isCorrect && <span className={styles.correctMark}>✓</span>}
        {option.isChosen && !option.isCorrect && (
          <span className={styles.incorrectMark}>✗</span>
        )}
      </div>
    ));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>Detailed Test Results</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {loading && <div className={styles.loading}>Loading results...</div>}

        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && (
          <div className={styles.content}>
            {resultData.length === 0 ? (
              <p className={styles.noResults}>No results available</p>
            ) : (
              resultData.map((item, index) => (
                <div key={index} className={styles.questionCard}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionNumber}>
                      Question {item.evaluation.sno}
                    </span>
                    <span
                      className={`${styles.status} ${
                        item.evaluation.answerStatus === "correct"
                          ? styles.statusCorrect
                          : styles.statusIncorrect
                      }`}
                    >
                      {item.evaluation.answerStatus === "correct"
                        ? "Correct"
                        : "Incorrect"}
                    </span>
                    <span className={styles.questionMarks}>
                      {item.questionDto.marks} marks
                    </span>
                  </div>

                  <div className={styles.questionDescription}>
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          item.questionDto.description ||
                          "No question text available",
                      }}
                    />
                  </div>

                  <div className={styles.optionsContainer}>
                    {renderOptions(item.questionDto, item.evaluation)}
                  </div>

                  <div className={styles.questionFooter}>
                    <span className={styles.questionType}>
                      Type:{" "}
                      {item.questionDto.questionType === "single_choice"
                        ? "Single Choice"
                        : "Multiple Choice"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResultPopup;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./TestModule.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  VIEW_USER_TEST_URL,
  START_TEST_URL,
  SUBMIT_TEST_URL,
} from "../../constants/apiConstants";

const TestModule = () => {
  const [testDetails, setTestDetails] = useState(null);
  const [testInformation, setTestInformation] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Added for randomization
  const [questionSequence, setQuestionSequence] = useState([]);
  const [optionSequences, setOptionSequences] = useState({});

  // Added for fullscreen functionality
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fullScreenExitCount, setFullScreenExitCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const mainContainerRef = useRef(null);
  const timerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [testAllotmentId, setTestAllotmentId] = useState(null);
  const [isTestStarted, setIsTestStarted] = useState(false);

  // Added for submit confirmation popup
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const[showShortcutWarning,setShowShortcutWarning]=useState(false);
  const[showDevToolWarning,setShowDevToolWarning]=useState(false);
  const[showTimeConfirmation,setShowTimeConfirmation]=useState(false);

  useEffect(() => {}, [location.state, navigate]);

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

  const getTestAllotmentId = () => {
    // Check if we have an allotment ID in the navigation state
    const passedAllotmentId = location.state?.testAllotmentId;

    if (passedAllotmentId) {
      setTestAllotmentId(passedAllotmentId);
      return passedAllotmentId;
    } else {
      // Redirect with a message if no test was selected
      navigate("/redirect", {
        state: {
          message: "No test selected. Please choose a test from your My Tests.",
          redirectPath: "/my-test",
        },
      });
      return null;
    }
  };

  // Helper function to shuffle an array
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Generate randomized question and option sequences
  const randomizeTest = (test) => {
    if (!test || !test.questionList || test.questionList.length === 0) return;

    // Create a randomized question sequence
    const questionIds = test.questionList.map((q, index) => index);
    const randomizedQuestionSequence = shuffleArray(questionIds);
    setQuestionSequence(randomizedQuestionSequence);

    // Create randomized option sequences for each question
    const optionSequencesMap = {};

    test.questionList.forEach((question) => {
      const questionId = question.questionId;

      // Count how many options this question has
      const optionCount = [
        question.option1,
        question.option2,
        question.option3,
        question.option4,
        question.option5,
        question.option6,
      ].filter((option) => option !== null).length;

      // Create an array of option indices (1-based)
      const optionIndices = Array.from(
        { length: optionCount },
        (_, i) => i + 1
      );

      // Shuffle the option indices
      const shuffledOptionIndices = shuffleArray(optionIndices);

      // Store the shuffled sequence
      optionSequencesMap[questionId] = shuffledOptionIndices;
    });

    setOptionSequences(optionSequencesMap);
  };

  const fetchTestDetails = async () => {
    try {
      const { user, token } = getUserData();
      console.log(testAllotmentId);

      if (!testAllotmentId) {
        return;
      }

      const response = await axios.post(`${START_TEST_URL}`, {
        user,
        token,
        testAllotmentId,
        testType: "external",
      });

      if (response.data.response === "success") {
        const test = response.data.payload;
        setTestDetails(test);
        // Convert duration from hours to seconds
        const totalSeconds = Math.floor(test.duration * 60);
        setTimeRemaining(totalSeconds);
        setTotalTime(totalSeconds);

        // Randomize the test questions and options
        randomizeTest(test);

        setLoading(false);
      } else {
        const message = response.data.message;
        handleRedirect(message, "/user-dashboard");
      }
    } catch (err) {
      setError("Failed to load test details.");
      console.log("Error", err);
      setLoading(false);
    }
  };

  const fetchTest = async () => {
    try {
      const { user, token } = getUserData();
      console.log(testAllotmentId);

      if (!testAllotmentId) {
        return;
      }

      const response = await axios.post(`${VIEW_USER_TEST_URL}`, {
        user,
        token,
        testAllotmentId,
        testType: "external",
      });

      if (response.data.response === "success") {
        const test = response.data.payload;
        // Store test information for the start screen
        setTestInformation(test);
        setLoading(false);
      } else {
        const message = response.data.message;
        handleRedirect(message, "/user-dashboard");
      }
    } catch (err) {
      setError("Failed to load test details.");
      console.log("Error", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testAllotmentId) {
      fetchTest();
    }
  }, [testAllotmentId]);

  // Fetch test data from API
  useEffect(() => {
    const id = getTestAllotmentId();
    if (id) {
      setTestAllotmentId(id);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (loading || !testDetails || isPaused || !testStarted) return;
  
    timerRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          if (testDetails && testAllotmentId) {
           pauseTest();
           setShowTimeConfirmation(true);
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, testDetails, isPaused, testStarted]);

  const handleRedirect = (message, path) => {
    navigate("/redirect", {
      state: { message: message, redirectPath: path },
    });
  };

  // Windows switch security
  useEffect(() => {
    const handleWindowBlur = () => {
      if (testStarted && !loading) {
        pauseTest();
        setFullScreenExitCount(prev => prev + 1);
        setShowNotification(true);
  
        if (fullScreenExitCount >= 3) {
          handleSubmit("User changed window many times");
        }
      }
    };
  
    window.addEventListener("blur", handleWindowBlur);
  
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [testStarted, loading, fullScreenExitCount]);

  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
  
      // Disable Ctrl/Meta + C/V/X/P
      if ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "p"].includes(key)) {
        e.preventDefault();
        setShowShortcutWarning(true);
      }
  
      // Detect Alt key press 
      if (e.key === "Alt") {
        e.preventDefault();
        setShowShortcutWarning(true);
      }
    };
  
    const handleKeyUp = (e) => {
      if (e.key === "Alt") {
        e.preventDefault();
      }
    };
  
    const handleRightClick = (e) => {
      e.preventDefault(); // Disable context menu
      setShowShortcutWarning(true);
    };
  
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("contextmenu", handleRightClick);
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);
  
  
  
  useEffect(() => {
    if (showShortcutWarning) {
      const timer = setTimeout(() => {
        setShowShortcutWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showShortcutWarning]);
  
// Inspect warning 
  useEffect(() => {
    let devToolsOpen = false;
    let checkInterval;
  
    const checkDevTools = () => {
      const threshold = 160; // px difference to detect dev tools
  
      const isDevToolsOpen =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;
  
      if (isDevToolsOpen && !devToolsOpen && !loading && testDetails && testStarted) {
        devToolsOpen = true;
  
        // Increment the same warning count
        setFullScreenExitCount((prev) => {
          const updated = prev + 1;
  
          setShowDevToolWarning(true);

          // Auto-submit if limit exceeded
          if (updated >= 4) {
            handleSubmit("User opened inspect/ devtools");
          }
  
          return updated;
        });
      }
  
      if (!isDevToolsOpen) {
        devToolsOpen = false;
      }
    };
  
    checkInterval = setInterval(checkDevTools, 1000); // check every second
  
    return () => clearInterval(checkInterval);
  }, [loading, testDetails, testStarted]);
  


  // Fullscreen event listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullScreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      setIsFullScreen(!!isDocFullScreen);

      if (!isDocFullScreen && !loading && testDetails && testStarted) {
        // User exited fullscreen
        setFullScreenExitCount((prev) => prev + 1);
        pauseTest();
        setShowNotification(true);

        // Auto-submit test after 4 exits
        if (fullScreenExitCount >= 3) {
          // Already incremented count, so check for 3
          handleSubmit("User exited full screen many times");
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [loading, testDetails, fullScreenExitCount, testStarted]);

  const requestFullScreen = () => {
    const element = mainContainerRef.current || document.documentElement;

    try {
      if (element.requestFullscreen) {
        element
          .requestFullscreen()
          .then(() => {
            setTestStarted(true);
          })
          .catch((err) => {
            console.error("Error attempting to enable full-screen mode:", err);
            // Continue without fullscreen as fallback
            setTestStarted(true);
          });
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
        setTestStarted(true);
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
        setTestStarted(true);
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
        setTestStarted(true);
      } else {
        // If fullscreen is not supported, start test anyway
        setTestStarted(true);
      }
    } catch (error) {
      console.error("Error in fullscreen request:", error);
      // Continue without fullscreen as fallback
      setTestStarted(true);
    }
  };

  const startTest = () => {
    setIsTestStarted(true);
    setTestStarted(true);
    fetchTestDetails();
    requestFullScreen();
  };

  const pauseTest = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeTest = () => {
    setIsPaused(false);
    setShowNotification(false);
  };

  // Modified to use option1, option2, etc. as answerId for single choice
  // Now map from randomized option index back to original option index
  const handleSingleChoiceAnswer = (questionId, displayedOptionIndex) => {
    if (isPaused) return;

    // Map from displayed option index to original option index
    const originalOptionIndex =
      optionSequences[questionId][displayedOptionIndex - 1];
    const answerId = `option${originalOptionIndex}`;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  // Modified to use option1/option2/option3 format for multiple choice
  // Now map from randomized option index back to original option index
  const handleMultipleChoiceAnswer = (questionId, displayedOptionIndex) => {
    if (isPaused) return;

    // Map from displayed option index to original option index
    const originalOptionIndex =
      optionSequences[questionId][displayedOptionIndex - 1];
    const optionValue = `option${originalOptionIndex}`;

    setAnswers((prev) => {
      const currentAnswers = prev[questionId]
        ? prev[questionId].split("/")
        : [];

      // If option is already selected, remove it
      if (currentAnswers.includes(optionValue)) {
        const filteredOptions = currentAnswers.filter(
          (opt) => opt !== optionValue
        );
        return {
          ...prev,
          [questionId]:
            filteredOptions.length > 0 ? filteredOptions.join("/") : "",
        };
      }
      // Otherwise, add it
      else {
        const newOptions = [
          ...currentAnswers.filter((o) => o !== ""),
          optionValue,
        ];
        return {
          ...prev,
          [questionId]: newOptions.join("/"),
        };
      }
    });
  };

  const handleNext = () => {
    if (isPaused) return;

    if (currentQuestionIndex < testDetails.questionList.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (isPaused) return;

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const navigateToQuestion = (index) => {
    if (isPaused) return;

    setCurrentQuestionIndex(index);
  };

  // Show submit confirmation popup
  const showSubmitConfirmationPopup = () => {
    if (isPaused) return;
    setShowSubmitConfirmation(true);
  };

  // Modified to match the expected API format
  const handleSubmit = async (description) => {
    try {
      // Get user data from session storage
      const { user, token } = getUserData();

      // Format answers according to the TestEvaluationModel structure
      const testEvaluationList = testDetails.questionList.map((question) => {
        const questionId = question.questionId;
        const answerId = answers[questionId] || ""; // Default to empty string if not answered
      
        return {
          testAllotmentId: testAllotmentId,
          questionId: questionId,
          answerId: answerId,
        };
      });
      

      const submitData = {
        user: user,
        token: token,
        testAllotmentId: testAllotmentId,
        description: description,
        testEvaluationList: testEvaluationList,
      };

      console.log("Submitting data:", submitData);

      // Use the correct API endpoint
      const response = await axios.post(SUBMIT_TEST_URL, submitData);

      if (response.data.response === "success") {
        const resultData = response.data.payload;
        navigate("/result", {
          state: {
            result: resultData,
            navigationPath: "/user-dashboard", // The path to navigate to when button is clicked
            message: response.data.message,
            buttonText: "Back to Dashboard", // Custom button text
          },
        });
      } else {
        const message = response.data.message;
        handleRedirect(message, "/user-dashboard");
      }

      // Exit fullscreen after submission
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit the test.");
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours < 10 ? "0" : ""}${hours} Hrs ${
      minutes < 10 ? "0" : ""
    }${minutes} Min ${remainingSeconds < 10 ? "0" : ""}${remainingSeconds} Sec`;
  };

  // Calculate circle properties for timer
  const calculateTimerCircle = () => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const timeElapsed = totalTime - timeRemaining;
    const percentageComplete = timeElapsed / totalTime;
    const dashOffset = circumference * (1 - percentageComplete);

    return {
      radius,
      circumference,
      dashOffset,
    };
  };

  // Logic for checking if a question is answered (updated to work with new answer format)
  const isQuestionAnswered = (questionId) => {
    return answers[questionId] && answers[questionId].length > 0;
  };

  // Logic for checking if an option is selected (updated for new format and randomization)
  const isOptionSelected = (
    questionId,
    displayedOptionIndex,
    isMultipleChoice
  ) => {
    if (!answers[questionId]) return false;

    // Map from displayed option index to original option index
    const originalOptionIndex =
      optionSequences[questionId][displayedOptionIndex - 1];

    if (isMultipleChoice) {
      const selectedOptions = answers[questionId].split("/");
      return selectedOptions.includes(`option${originalOptionIndex}`);
    } else {
      return answers[questionId] === `option${originalOptionIndex}`;
    }
  };

  if (loading && !testInformation)
    return <div className={styles.loading}>Loading test...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  // If test details loaded but test not started yet, show start screen
  if (!isTestStarted && testInformation) {
    return (
      <div className={styles.startScreen} ref={mainContainerRef}>
        <div className={styles.startCard}>
          <h2>{testInformation.testName}</h2>
          <div className={styles.testInfoStart}>
            <div className={styles.infoItem}>Type: MCQ</div>
            <div className={styles.infoItem}>
              Total Questions: {testInformation.totalQuestion}
            </div>
            <div className={styles.infoItem}>
              Maximum Marks: {testInformation.marks}
            </div>
            <div className={styles.infoItem}>
              Duration: {testInformation.duration} min
            </div>
          </div>
          <div className={styles.testRules}>
            <h3>Important Instructions:</h3>
            <ul>
              <li>This test must be taken in full-screen mode.</li>
              <li>Exiting full-screen mode will pause the test.</li>
              <li>You can return to full-screen to continue.</li>
              <li>
                After exiting full-screen 4 times, your test will be
                automatically submitted.
              </li>
              <li>The timer will start once you begin the test.</li>
              <li>
                For multiple-choice questions, there may be more than one
                correct option. Marks will be awarded only if all correct
                options are selected.
              </li>
              <li>There is no negative marking.</li>
              <li>
                Questions and options will be randomized for each test attempt.
              </li>
            </ul>
          </div>
          <button className={styles.startButton} onClick={startTest}>
            Start Test in Full Screen
          </button>
        </div>
      </div>
    );
  }

  if (!testDetails)
    return <div className={styles.loading}>Starting test...</div>;

  // Get the randomized current question
  const randomizedQuestionIndex =
    questionSequence[currentQuestionIndex] !== undefined
      ? questionSequence[currentQuestionIndex]
      : currentQuestionIndex;
  const currentQuestion = testDetails.questionList[randomizedQuestionIndex];
  const isMultipleChoice = currentQuestion?.questionType === "multiple_choice";
  const questionNumber = currentQuestionIndex + 1;
  const totalQuestions = testDetails.questionList.length;
  const timerProps = calculateTimerCircle();

  // Calculate which questions have been answered
  const questionStatus = testDetails.questionList.map((q) => {
    if (isQuestionAnswered(q.questionId)) {
      return "answered";
    }
    return "";
  });

  // Calculate the number of answered and unanswered questions
  const answeredCount = questionStatus.filter(
    (status) => status === "answered"
  ).length;
  const unansweredCount = totalQuestions - answeredCount;

  const userData = getUserData();
  const userFirstName = userData?.user?.firstName || "User";
  const userLastName = userData?.user?.lastName || "Name";

  return (
    <div className={styles.fullScreenContainer} ref={mainContainerRef}>
      {showNotification && (
        <div className={styles.fullscreenNotification}>
          <div className={styles.notificationContent}>
            <h3>Test Paused</h3>
            <p>
              You have exited fullscreen mode. This is attempt{" "}
              {fullScreenExitCount} of 4.
            </p>
            <p>Please return to fullscreen mode to continue the test.</p>
            <p>After 4 attempts, your test will be automatically submitted.</p>
            <button
              className={styles.returnToFullscreenBtn}
              onClick={() => {
                requestFullScreen();
                resumeTest();
              }}
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Submit confirmation popup */}
      {showSubmitConfirmation && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationPopup}>
            <h3>Confirm Submission</h3>
            <p>Are you sure you want to submit your test?</p>

            <div className={styles.testSummary}>
              <p>
                Total Questions: <strong>{totalQuestions}</strong>
              </p>
              <p>
                Answered: <strong>{answeredCount}</strong>
              </p>
              <p>
                Unanswered: <strong>{unansweredCount}</strong>
              </p>
            </div>

            <div className={styles.confirmationButtons}>
              <button
                className={styles.confirmSubmitBtn}
                onClick={() => handleSubmit("Test submitted by user")}
              >
                Yes, Submit
              </button>
              <button
                className={styles.cancelSubmitBtn}
                onClick={() => setShowSubmitConfirmation(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


{showTimeConfirmation && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationPopup}>
            <h3>Test Time Out</h3>
            
            <div className={styles.testSummary}>
              <p>
                Total Questions: <strong>{totalQuestions}</strong>
              </p>
              <p>
                Answered: <strong>{answeredCount}</strong>
              </p>
              <p>
                Unanswered: <strong>{unansweredCount}</strong>
              </p>
            </div>

            <div className={styles.confirmationButtons}>
              <button
                className={styles.confirmSubmitBtn}
                onClick={() => handleSubmit("Test time out")}
              >
                 Submit
              </button>
            </div>
          </div>
        </div>
      )}


      <div
        className={`${styles.testContent} ${
          isPaused || showSubmitConfirmation ? styles.blurred : ""
        }`}
      >
        <div className={styles.testPanel}>
          <div className={styles.testHeader}>
            <h2>{testDetails.testName}</h2>
            <div className={styles.testInfo}>
              <div className={styles.infoItem}>Name: {userFirstName} {userLastName}</div>
              <div className={styles.infoItem}>Type: MCQ</div>
              <div className={styles.infoItem}>Question: {totalQuestions}</div>
              <div className={styles.infoItem}>Marks: {totalQuestions}</div>
              <div className={styles.infoItem}>
                Time: {Math.ceil(testDetails.duration)} min
              </div>
            </div>
          </div>

          <div className={styles.questionContainer}>
            <div className={styles.questionNum}>Q {questionNumber}</div>
            <div className={styles.questionText}>
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    currentQuestion?.description ||
                    "No question text available",
                }}
              />
            </div>

            <div className={styles.optionsList}>
              {currentQuestion && optionSequences[currentQuestion.questionId]
                ? optionSequences[currentQuestion.questionId].map(
                    (originalIndex, displayIndex) => {
                      // Get the option based on the original index
                      const optionKey = `option${originalIndex}`;
                      const option = currentQuestion[optionKey];

                      // Only render if the option exists
                      if (option !== null && option !== undefined) {
                        const displayedOptionIndex = displayIndex + 1;
                        const isSelected = isOptionSelected(
                          currentQuestion.questionId,
                          displayedOptionIndex,
                          isMultipleChoice
                        );

                        return (
                          <div
                            key={`question-${currentQuestion.questionId}-option-${displayedOptionIndex}`}
                            className={styles.optionItem}
                          >
                            <label
                              className={`${styles.optionLabel} ${
                                isSelected ? styles.selected : ""
                              }`}
                            >
                              <input
                                type={isMultipleChoice ? "checkbox" : "radio"}
                                name={`question-${currentQuestion.questionId}`}
                                value={displayedOptionIndex}
                                checked={isSelected}
                                onChange={() => {
                                  if (isMultipleChoice) {
                                    handleMultipleChoiceAnswer(
                                      currentQuestion.questionId,
                                      displayedOptionIndex
                                    );
                                  } else {
                                    handleSingleChoiceAnswer(
                                      currentQuestion.questionId,
                                      displayedOptionIndex
                                    );
                                  }
                                }}
                                disabled={isPaused || showSubmitConfirmation}
                              />
                              {option}
                            </label>
                          </div>
                        );
                      }
                      return null;
                    }
                  )
                : null}
            </div>
          </div>

          <div className={styles.navigationContainer}>
            <button
              className={`${styles.navButton} ${styles.prev} ${
                currentQuestionIndex === 0 ? styles.disabled : ""
              }`}
              onClick={handlePrevious}
              disabled={
                currentQuestionIndex === 0 || isPaused || showSubmitConfirmation
              }
            >
              Prev
            </button>
            {currentQuestionIndex === testDetails.questionList.length - 1 ? (
              <button
                className={`${styles.navButton} ${styles.submit}`}
                onClick={showSubmitConfirmationPopup}
                disabled={isPaused || showSubmitConfirmation}
              >
                Submit
              </button>
            ) : (
              <button
                className={`${styles.navButton} ${styles.next}`}
                onClick={handleNext}
                disabled={isPaused || showSubmitConfirmation}
              >
                Next
              </button>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.timerPanel}>
            <h3>Timer</h3>

            <div className={styles.roundTimerContainer}>
              <svg
                className={styles.roundTimer}
                width="120"
                height="120"
                viewBox="0 0 120 120"
              >
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={timerProps.radius}
                  fill="none"
                  stroke="#eaeaea"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={timerProps.radius}
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={timerProps.circumference}
                  strokeDashoffset={timerProps.dashOffset}
                  transform="rotate(-90 60 60)"
                />

                {/* Time display - now showing hours, minutes, seconds */}
                <text
                  x="60"
                  y="45"
                  textAnchor="middle"
                  className={styles.timerText}
                >
                  {Math.floor(timeRemaining / 3600)}:
                  {String(Math.floor((timeRemaining % 3600) / 60)).padStart(
                    2,
                    "0"
                  )}
                  :{String(timeRemaining % 60).padStart(2, "0")}
                </text>

                {/* Units label */}
                <text
                  x="60"
                  y="65"
                  textAnchor="middle"
                  className={styles.timerSubText}
                >
                  Hr : Min : Sec
                </text>
              </svg>
            </div>
          </div>

          <div className={styles.questionsPanel}>
            <h3>Questions</h3>
            <div className={styles.questionsGrid}>
              {questionSequence.map((originalIndex, displayIndex) => {
                let dotClass = "";
                const question = testDetails.questionList[originalIndex];

                if (question && isQuestionAnswered(question.questionId)) {
                  dotClass = styles.green;
                } else if (displayIndex === currentQuestionIndex) {
                  dotClass = styles.orange;
                }

                return (
                  <div
                    key={`question-dot-${displayIndex}`}
                    className={`${styles.questionDot} ${dotClass}`}
                    onClick={() => navigateToQuestion(displayIndex)}
                  >
                    {displayIndex + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.legendPanel}>
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendDotOrange} ${styles.orange}`}
              ></span>
              <span>
                Orange color Question indicate that you verified Question but
                not answered
              </span>
            </div>
            <div className={styles.legendItem}>
              <span
                className={`${styles.legendDotGreen} ${styles.green}`}
              ></span>
              <span>Green color Question indicate that you answered</span>
            </div>
          </div>

          {/* Legend for fullscreen exits */}
          <div className={styles.fullscreenExitsInfo}>
            <div className={styles.fullscreenExitCount}>
              <span>Fullscreen Exits: {fullScreenExitCount}/4</span>
            </div>
          </div>
        </div>
      </div>

      {showShortcutWarning && (
  <div className={styles.shortcutPopupOverlay}>
    <div className={styles.shortcutPopup}>
      <h2>⚠️ Shortcut Blocked</h2>
      <p>Shortcut keys like Ctrl+C, Ctrl+V, and Alt+Tab are disabled during the test.</p>
      <button onClick={() => setShowShortcutWarning(false)}>OK</button>
    </div>
  </div>
)}

{showDevToolWarning && (
  <div className={styles.shortcutPopupOverlay}>
    <div className={styles.shortcutPopup}>
      <h2>⚠️ Developer Tools Detected</h2>
      <p>Please close Developer Tools or test will be auto submitted</p>
      <button onClick={() => setShowDevToolWarning(false)}>OK</button>
    </div>
  </div>
)}



    </div>
  );
};

export default TestModule;
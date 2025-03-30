import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './TestModule.module.css';
import { useNavigate, useLocation  } from "react-router-dom";
import { VIEW_USER_TEST_URL,START_TEST_URL, SUBMIT_TEST_URL } from '../../constants/apiConstants';

const InternalTestModule = () => {
  
  const [testDetails, setTestDetails] = useState(null);
  const [testInformation, setTestInformation] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

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
  
  const [courseId, setCourseId] = useState(null);
  const [trackingId, setTrackingId] = useState(null);
  

  const [isTestStarted, setIsTestStarted] = useState(false);
  
  const[courseAllotmentId,setCourseAllotmentId]=useState(null);

  const[isAllValues,setIsAllValue]=useState(false);
  

  useEffect(() => {
   
  }, [location.state, navigate]);

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
      // Check if location.state exists before trying to access values
      if (!location.state) {
        console.error("No location state available");
        return;
      }
    
      const testId = location.state.testAllotmentId || null;
      const course = location.state.courseId || null; 
      const tracking = location.state.trackingId || null;
      const courseAllotment = location.state.courseAllotmentId || null;
      
      // Set the state variables
      setTestAllotmentId(testId);
      setCourseId(course);
      setTrackingId(tracking);
      setCourseAllotmentId(courseAllotment);
      
      // Log after setting
      console.log("Values from location state:", {
        courseAllotmentId: courseAllotment,
        courseId: course,
        trackingId: tracking,
        testAllotmentId: testId
      });

      setIsAllValue(true);

    }, []); // Add location.state as a dependency

    const fetchTestDetails = async () => {
      try {
        const { user, token } = getUserData();
        console.log(testAllotmentId);
      
        if(!testAllotmentId)
          {
            return;
          }
        
        const response = await axios.post(`${START_TEST_URL}`, {
           user,
           token,
           testAllotmentId
        });

        if(response.data.response==='success')
        {
          const test = response.data.payload;
          setTestDetails(test);
          // Convert duration from hours to seconds
          const totalSeconds = Math.floor(test.duration * 60);
          setTimeRemaining(totalSeconds);
          setTotalTime(totalSeconds);
          setLoading(false);
        } else {
          const message=response.data.message;
          handleRedirect(message,"/user-dashboard");
        }
      } catch (err) {
        setError('Failed to load test details.');
        console.log("Error",err);
        setLoading(false);
      }
    };


    useEffect(() => {
      

      if(!isAllValues)
      {
        return;
      }

      if (!testAllotmentId) {
        navigate("/redirect", {
          state: { 
            message: "No test selected. Please choose a test from your My Tests.", 
            redirectPath: "/my-test" 
          },
        });
        return;
      }
      
      if (!courseId) {
        navigate("/redirect", {
          state: { 
            message: "Unable to start test, course not found.",
            redirectPath: "/user-dashboard" 
          },
        });
        return;
      }
      
      if (!trackingId) {
        navigate("/redirect", {
          state: { 
            message: "Unable to start test, tracking Id not found.",
            redirectPath: `/user/courseContent/${courseId || "unknown"}/${courseAllotmentId || "unknown"}` 
          },
        });
        return;
      }
      
      if (!courseAllotmentId) {
        navigate("/redirect", {
          state: { 
            message: "Unable to start test, Course not found.",
            redirectPath: "/user-dashboard" 
          },
        });
        return;
      }
      
    }, [isAllValues]);


    const fetchTest = async () => {
      try {
        const { user, token } = getUserData();
        console.log(testAllotmentId);
      
        if(!testAllotmentId)
          {
            return;
          }
        
        const response = await axios.post(`${VIEW_USER_TEST_URL}`, {
           user,
           token,
          testAllotmentId
        });

        if(response.data.response==='success')
        {
          const test = response.data.payload;
          // Store test information for the start screen
          setTestInformation(test);
          setLoading(false);
        } else {
          const message=response.data.message;
          handleRedirect(message, `/user/courseContent/${courseId}/${courseAllotmentId}`);
        }
      } catch (err) {
        setError('Failed to load test details.');
        console.log("Error",err);
        setLoading(false);
      }
    };


    useEffect(() => {
      if (testAllotmentId) {
        fetchTest();
      }
    }, [testAllotmentId]);
  
 

  // Timer logic
  useEffect(() => {
    if (loading || !testDetails || isPaused || !testStarted) return;
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleSubmit("Test time out");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, testDetails, isPaused, testStarted]);


  const handleRedirect = (message,path) => {
    navigate("/redirect", {
      state: { message: message, redirectPath: path }
    });
  };


  // Fullscreen event listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullScreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement;
      
      setIsFullScreen(!!isDocFullScreen);
      
      if (!isDocFullScreen && !loading && testDetails && testStarted) {
        // User exited fullscreen
        setFullScreenExitCount(prev => prev + 1);
        pauseTest();
        setShowNotification(true);
        
        // Auto-submit test after 4 exits
        if (fullScreenExitCount >= 3) { // Already incremented count, so check for 3
          handleSubmit("User exited full screen many times");
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [loading, testDetails, fullScreenExitCount, testStarted]);

  const requestFullScreen = () => {
    const element = mainContainerRef.current || document.documentElement;
    
    try {
      if (element.requestFullscreen) {
        element.requestFullscreen().then(() => {
          setTestStarted(true);
        }).catch(err => {
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
  const handleSingleChoiceAnswer = (questionId, optionIndex) => {
    if (isPaused) return;
    
    const answerId = `option${optionIndex}`;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  // Modified to use option1/option2/option3 format for multiple choice
  const handleMultipleChoiceAnswer = (questionId, optionIndex) => {
    if (isPaused) return;
    
    setAnswers(prev => {
      const currentAnswers = prev[questionId] ? prev[questionId].split('/') : [];
      const optionValue = `option${optionIndex}`;
      
      // If option is already selected, remove it
      if (currentAnswers.includes(optionValue)) {
        const filteredOptions = currentAnswers.filter(opt => opt !== optionValue);
        return {
          ...prev,
          [questionId]: filteredOptions.length > 0 ? filteredOptions.join('/') : ''
        };
      } 
      // Otherwise, add it
      else {
        const newOptions = [...currentAnswers.filter(o => o !== ''), optionValue];
        return {
          ...prev,
          [questionId]: newOptions.join('/')
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

  // Modified to match the expected API format
  const handleSubmit = async (description) => {
    try {
      // Get user data from session storage
      const { user, token } = getUserData();
      
      // Format answers according to the TestEvaluationModel structure
      const testEvaluationList = Object.entries(answers)
        .filter(([_, answer]) => answer) // Filter out empty answers
        .map(([questionId, answerId]) => ({
          testAllotmentId: testAllotmentId,
          questionId: parseInt(questionId),
          answerId: answerId
        }));
  
      const submitData = {
        user: user,
        token: token,
        testAllotmentId: testAllotmentId,
        description: description,
        testEvaluationList: testEvaluationList
      };
  
      console.log("Submitting data:", submitData);
  
      // Use the correct API endpoint
      const response = await axios.post(SUBMIT_TEST_URL, submitData);
      
      if (response.data.response === 'success') {
        const resultData=response.data.payload;
        navigate("/result", { state: { result: resultData,
                                   navigationPath:  `/user/courseContent/${courseId}/${courseAllotmentId}` , // The path to navigate to when button is clicked
                                    buttonText: "Back to Course" // Custom button text

                            } 
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
    return `${hours < 10 ? '0' : ''}${hours} Hrs ${minutes < 10 ? '0' : ''}${minutes} Min ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds} Sec`;
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
      dashOffset
    };
  };

  // Logic for checking if a question is answered (updated to work with new answer format)
  const isQuestionAnswered = (questionId) => {
    return answers[questionId] && answers[questionId].length > 0;
  };

  // Logic for checking if an option is selected (updated for new format)
  const isOptionSelected = (questionId, optionIndex, isMultipleChoice) => {
    if (!answers[questionId]) return false;
    
    if (isMultipleChoice) {
      const selectedOptions = answers[questionId].split('/');
      return selectedOptions.includes(`option${optionIndex}`);
    } else {
      return answers[questionId] === `option${optionIndex}`;
    }
  };

  if (loading && !testInformation) return <div className={styles.loading}>Loading test...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  // If test details loaded but test not started yet, show start screen
  if (!isTestStarted && testInformation) {
    return (
      <div className={styles.startScreen} ref={mainContainerRef}>
        <div className={styles.startCard}>
          <h2>{testInformation.testName}</h2>
          <div className={styles.testInfoStart}>
            <div className={styles.infoItem}>Type: MCQ</div>
            <div className={styles.infoItem}>Total Questions: {testInformation.totalQuestion}</div>
            <div className={styles.infoItem}>Maximum Marks: {testInformation.marks}</div>
            <div className={styles.infoItem}>Duration: {testInformation.duration} min</div>
          </div>
          <div className={styles.testRules}>
            <h3>Important Instructions:</h3>
            <ul>
              <li>This test must be taken in full-screen mode.</li>
              <li>Exiting full-screen mode will pause the test.</li>
              <li>You can return to full-screen to continue.</li>
              <li>After exiting full-screen 4 times, your test will be automatically submitted.</li>
              <li>The timer will start once you begin the test.</li>
              <li>For multiple-choice questions, there may be more than one correct option. Marks will be awarded only if all correct options are selected.</li>
              <li>There is no negative marking. </li>
              
            </ul>
          </div>
          <button className={styles.startButton} onClick={startTest}>
            Start Test in Full Screen
          </button>
        </div>
      </div>
    );
  }

  if (!testDetails) return <div className={styles.loading}>Starting test...</div>;

  const currentQuestion = testDetails.questionList[currentQuestionIndex];
  const isMultipleChoice = currentQuestion.questionType === "multiple_choice";
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

  return (
    <div className={styles.fullScreenContainer} ref={mainContainerRef}>
      {showNotification && (
        <div className={styles.fullscreenNotification}>
          <div className={styles.notificationContent}>
            <h3>Test Paused</h3>
            <p>You have exited fullscreen mode. This is attempt {fullScreenExitCount} of 4.</p>
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
      
      <div className={`${styles.testContent} ${isPaused ? styles.blurred : ''}`}>
        <div className={styles.testPanel}>
          <div className={styles.testHeader}>
            <h2>{testDetails.testName}</h2>
            <div className={styles.testInfo}>
              <div className={styles.infoItem}>Type: MCQ</div>
              <div className={styles.infoItem}>Question: {totalQuestions}</div>
              <div className={styles.infoItem}>Marks: {totalQuestions}</div>
              <div className={styles.infoItem}>Time: {Math.ceil(testDetails.duration)} min</div>
            </div>
          </div>

          <div className={styles.questionContainer}>
            <div className={styles.questionNum}>Q {questionNumber}</div>
            <div className={styles.questionText}>{currentQuestion.description.toUpperCase()}</div>

            <div className={styles.optionsList}>
              {[currentQuestion.option1, currentQuestion.option2, currentQuestion.option3, 
                currentQuestion.option4, currentQuestion.option5, currentQuestion.option6]
                .filter(option => option !== null)
                .map((option, index) => {
                  const optionIndex = index + 1;
                  const isSelected = isOptionSelected(
                    currentQuestion.questionId, 
                    optionIndex, 
                    isMultipleChoice
                  );
                  
                  return (
                    <div key={`question-${currentQuestion.questionId}-option-${optionIndex}`} className={styles.optionItem}>
                      <label className={`${styles.optionLabel} ${isSelected ? styles.selected : ''}`}>
                        <input 
                          type={isMultipleChoice ? "checkbox" : "radio"} 
                          name={`question-${currentQuestion.questionId}`}
                          value={optionIndex}
                          checked={isSelected}
                          onChange={() => {
                            if (isMultipleChoice) {
                              handleMultipleChoiceAnswer(currentQuestion.questionId, optionIndex);
                            } else {
                              handleSingleChoiceAnswer(currentQuestion.questionId, optionIndex);
                            }
                          }}
                          disabled={isPaused}
                        />
                        {option}
                      </label>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className={styles.navigationContainer}>
            <button 
              className={`${styles.navButton} ${styles.prev} ${currentQuestionIndex === 0 ? styles.disabled : ''}`}
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isPaused}
            >
              Prev
            </button>
            {currentQuestionIndex === testDetails.questionList.length - 1 ? (
              <button 
                className={`${styles.navButton} ${styles.submit}`} 
                onClick={() => handleSubmit("Test submitted by user")}
                disabled={isPaused}
              >
                Submit
              </button>
            ) : (
              <button 
                className={`${styles.navButton} ${styles.next}`} 
                onClick={handleNext}
                disabled={isPaused}
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
    <svg className={styles.roundTimer} width="120" height="120" viewBox="0 0 120 120">
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
      <text x="60" y="45" textAnchor="middle" className={styles.timerText}>
        {Math.floor(timeRemaining / 3600)}:{String(Math.floor((timeRemaining % 3600) / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
      </text>
      
      {/* Units label */}
      <text x="60" y="65" textAnchor="middle" className={styles.timerSubText}>
        Hr : Min : Sec
      </text>
    </svg>
  </div>
</div>

          <div className={styles.questionsPanel}>
            <h3>Questions</h3>
            <div className={styles.questionsGrid}>
              {testDetails.questionList.map((question, index) => {
                let dotClass = "";
                if (questionStatus[index] === "answered") {
                  dotClass = styles.green;
                } else if (index === currentQuestionIndex) {
                  dotClass = styles.orange;
                }
                
                return (
                  <div 
                    key={`question-dot-${question.questionId}`}
                    className={`${styles.questionDot} ${dotClass}`}
                    onClick={() => navigateToQuestion(index)}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.legendPanel}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.orange}`}></span>
              <span>Orange color Question indicate that you verified Question but not answered</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.green}`}></span>
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
    </div>
  );
};

export default InternalTestModule;
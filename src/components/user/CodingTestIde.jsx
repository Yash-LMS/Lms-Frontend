import React, { useState, useEffect, useRef } from 'react';
import styles from './CodingTestIde.module.css';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { VIEW_ALLOTED_CODING_TASK, SUBMIT_CODING_TASK } from '../../constants/apiConstants';

const CodingTestIde = () => {
  const [testDetails, setTestDetails] = useState(null);
  const [testInformation, setTestInformation] = useState(null);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [lineCount, setLineCount] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Security states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fullScreenExitCount, setFullScreenExitCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [showShortcutWarning, setShowShortcutWarning] = useState(false);
  const [showDevToolWarning, setShowDevToolWarning] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showTimeConfirmation, setShowTimeConfirmation] = useState(false);

  const mainContainerRef = useRef(null);
  const timerRef = useRef(null);
  const codeEditorRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const [testAllotmentId, setTestAllotmentId] = useState(null);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [userData, setUserData] = useState(null);
  const [allowedLanguages, setAllowedLanguages] = useState(['python', 'java', 'javascript', 'cpp']);
  const [recommendedLanguage, setRecommendedLanguage] = useState('python');
  const [technologyString, setTechnologyString] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // Enhanced language configurations with package import support
  const languageConfigs = {
    python: {
      name: 'Python',
      extension: '.py',
      defaultCode: '# Write your Python code here\n# You can import any package you need\n# Example: import numpy as np, pandas as pd, matplotlib.pyplot as plt\n\ndef solution():\n    pass\n',
      indentSize: 4,
      useTabs: false,
      autoIndent: true,
      editableStartLine: 0,
      protectedLines: [],
      brackets: {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'"
      },
      keywords: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'return', 'import', 'from'],
      packageImports: [
        'import numpy as np',
        'import pandas as pd',
        'import matplotlib.pyplot as plt',
        'import scipy',
        'import sklearn',
        'import requests',
        'import json',
        'import os',
        'import sys',
        'import re',
        'import math',
        'import collections',
        'import itertools',
        'import functools',
        'import datetime',
        'import random'
      ]
    },
    java: {
      name: 'Java',
      extension: '.java',
      defaultCode: '// You can import any Java packages you need\n// Examples: import java.util.*, import java.io.*, import java.math.*\nimport java.util.*;\nimport java.io.*;\nimport java.math.*;\n\npublic class Main {\n    \n    public static void main(String[] args) {\n        \n    }\n}',
      indentSize: 4,
      useTabs: false,
      autoIndent: true,
      editableStartLine: 1,
      protectedLines: [0, 7],
      mainClassPattern: /^public class Main \{[\s]*$/,
      closingBracePattern: /^\}[\s]*$/,
      brackets: {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"'
      },
      keywords: ['public', 'private', 'class', 'static', 'void', 'int', 'String', 'if', 'else', 'for', 'while', 'return', 'import'],
      packageImports: [
        'import java.util.*;',
        'import java.io.*;',
        'import java.math.*;',
        'import java.time.*;',
        'import java.util.concurrent.*;',
        'import java.util.stream.*;',
        'import java.text.*;',
        'import java.security.*;',
        'import java.net.*;',
        'import java.nio.*'
      ]
    },
    javascript: {
      name: 'JavaScript',
      extension: '.js',
      defaultCode: '// Write your JavaScript code here\n// You can import any Node.js modules or use ES6 imports\n// Examples: const fs = require(\'fs\'), import axios from \'axios\'\n\nfunction solution() {\n    \n}\n',
      indentSize: 2,
      useTabs: false,
      autoIndent: true,
      editableStartLine: 0,
      protectedLines: [],
      brackets: {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'"
      },
      keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export'],
      packageImports: [
        'const fs = require(\'fs\');',
        'const path = require(\'path\');',
        'const axios = require(\'axios\');',
        'const lodash = require(\'lodash\');',
        'const moment = require(\'moment\');',
        'import axios from \'axios\';',
        'import _ from \'lodash\';',
        'import moment from \'moment\';'
      ]
    },
    cpp: {
      name: 'C++',
      extension: '.cpp',
      defaultCode: '// You can include any standard C++ libraries\n// Examples: #include <vector>, #include <algorithm>, #include <map>\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <map>\n#include <set>\n#include <string>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}',
      indentSize: 4,
      useTabs: false,
      autoIndent: true,
      editableStartLine: 0,
      protectedLines: [],
      brackets: {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'"
      },
      keywords: ['int', 'char', 'float', 'double', 'if', 'else', 'for', 'while', 'return', 'include', 'using', 'namespace'],
      packageImports: [
        '#include <vector>',
        '#include <algorithm>',
        '#include <map>',
        '#include <set>',
        '#include <string>',
        '#include <queue>',
        '#include <stack>',
        '#include <unordered_map>',
        '#include <unordered_set>',
        '#include <cmath>',
        '#include <climits>'
      ]
    }
  };

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

  // Enhanced technology parsing functions
  const parseTechnologyString = (technologyStr) => {
    if (!technologyStr || typeof technologyStr !== 'string') {
      return {
        allowedLanguages: ['python', 'java', 'javascript', 'cpp'],
        recommendedLanguage: 'python',
        isAnyAllowed: true
      };
    }

    const techStr = technologyStr.trim().toUpperCase();
    
    // Handle "ANY" case - all languages allowed
    if (techStr === 'ANY') {
      return {
        allowedLanguages: ['python', 'java', 'javascript', 'cpp'],
        recommendedLanguage: 'python',
        isAnyAllowed: true
      };
    }

    // Parse comma-separated technologies
    const technologies = techStr.split(',').map(tech => tech.trim());
    const allowedLangs = [];
    
    // Map technologies to language keys
    const techMap = {
      'PYTHON': 'python',
      'JAVA': 'java',
      'JAVASCRIPT': 'javascript',
      'JS': 'javascript',
      'C++': 'cpp',
      'CPP': 'cpp'
    };

    technologies.forEach(tech => {
      const mappedLang = techMap[tech];
      if (mappedLang && languageConfigs[mappedLang] && !allowedLangs.includes(mappedLang)) {
        allowedLangs.push(mappedLang);
      }
    });

    // If no valid technologies found, default to all
    if (allowedLangs.length === 0) {
      return {
        allowedLanguages: ['python', 'java', 'javascript', 'cpp'],
        recommendedLanguage: 'python',
        isAnyAllowed: true
      };
    }

    // Recommend first language in the list
    const recommendedLang = allowedLangs[0];

    return {
      allowedLanguages: allowedLangs,
      recommendedLanguage: recommendedLang,
      isAnyAllowed: false
    };
  };

  // Get display name for technology
  const getTechnologyDisplayName = (langKey) => {
    const displayMap = {
      'python': 'Python',
      'java': 'Java',
      'javascript': 'JavaScript',
      'cpp': 'C++'
    };
    return displayMap[langKey] || langKey;
  };

  // Validation and initialization
  useEffect(() => {
    const { user, token } = getUserData();
    setUserData({ user, token });
    
    const allotmentId = getCodingValidationStatus();
    if (allotmentId) {
      setTestAllotmentId(allotmentId);
    }
  }, []);

  const getCodingValidationStatus = () => {
    const passedAllotmentId = location.state?.testAllotmentId;
    if (passedAllotmentId) {
      return passedAllotmentId;
    } else {
      navigate("/redirect", {
        state: {
          message: "No test selected. Please choose a test from your My Tests.",
          redirectPath: "/my-test",
        },
      });
      return null;
    }
  };

  // Initialize code based on selected language
  useEffect(() => {
    if (!testStarted && languageConfigs[selectedLanguage]) {
      setCode(languageConfigs[selectedLanguage].defaultCode);
      updateLineCount(languageConfigs[selectedLanguage].defaultCode);
    }
  }, [selectedLanguage, testStarted]);

  // Fetch test details from API
  const fetchTestDetails = async () => {
    try {
      requestFullScreen();
      setLoading(true);
      setError(null);
      
      const { user, token } = getUserData();
      
      const requestData = {
        user: user,
        token: token,
        testAllotmentId: testAllotmentId
      };

      const response = await axios.post(`${VIEW_ALLOTED_CODING_TASK}`, requestData);
      
      if (response.data.response === 'success') {
        const taskData = response.data.payload;
        
        // Parse technology string and set allowed languages
        const technologyConfig = parseTechnologyString(taskData.technology);
        setTechnologyString(taskData.technology || 'ANY');
        setAllowedLanguages(technologyConfig.allowedLanguages);
        setRecommendedLanguage(technologyConfig.recommendedLanguage);
        
        // Set initial language - use recommended if current selection is not allowed
        let initialLanguage = selectedLanguage;
        if (!technologyConfig.allowedLanguages.includes(selectedLanguage)) {
          initialLanguage = technologyConfig.recommendedLanguage;
          setSelectedLanguage(initialLanguage);
        }
        
        // Set code based on initial language
        setCode(languageConfigs[initialLanguage].defaultCode);
        updateLineCount(languageConfigs[initialLanguage].defaultCode);
        
        const testInfo = {
          taskName: 'Algorithm Challenge',
          description: taskData.description,
          duration: taskData.timeInMinutes / 60,
          maxMarks: 100,
          language: initialLanguage,
          technology: taskData.technology || 'ANY',
          allowedLanguages: technologyConfig.allowedLanguages,
          recommendedLanguage: technologyConfig.recommendedLanguage,
          isAnyAllowed: technologyConfig.isAnyAllowed,
          allotmentId: taskData.allotmentId
        };
        
        setTestInformation(testInfo);
        setTestDetails(testInfo);
        
        // Set up timer
        const totalSeconds = Math.floor(taskData.timeInMinutes * 60);
        setTimeRemaining(totalSeconds);
        setTotalTime(totalSeconds);
        
        setIsTestStarted(true);
        setTestStarted(true);
        
      } else {
        // Handle API errors
        if (response.data.message === "Already Completed this test" || 
            response.data.message === "Already Started this test") {
          navigate("/redirect", {
            state: {
              message: response.data.message,
              redirectPath: "/my-test",
            },
          });
        } else if (response.data.message === "Assignment not alloted to you") {
          navigate("/redirect", {
            state: {
              message: "This assignment is not allocated to you.",
              redirectPath: "/my-test",
            },
          });
        } else {
          setError(response.data.message || 'Failed to fetch test details');
        }
      }
    } catch (err) {
      console.error('Error fetching test details:', err);
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Update line count - count all lines including empty ones
  const updateLineCount = (text) => {
    const lines = text.split('\n');
    setLineCount(lines.length);
  };

  // Handle language change - only allow if language is in allowed list
  const handleLanguageChange = (language) => {
    if (!isPaused && !showSubmitConfirmation && allowedLanguages.includes(language)) {
      setSelectedLanguage(language);
      setCode(languageConfigs[language].defaultCode);
      updateLineCount(languageConfigs[language].defaultCode);
    }
  };

  // Reset code to template
  const resetCode = () => {
    if (!isPaused && !showSubmitConfirmation) {
      setCode(languageConfigs[selectedLanguage].defaultCode);
      updateLineCount(languageConfigs[selectedLanguage].defaultCode);
    }
  };

  // Check if current line/position is editable for Java
  const isPositionEditable = (text, cursorPosition) => {
    if (selectedLanguage !== 'java') return true;
    
    const beforeCursor = text.substring(0, cursorPosition);
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
    const currentLineNumber = beforeCursor.split('\n').length - 1;
    
    return !languageConfigs.java.protectedLines.includes(currentLineNumber);
  };

  // Get indentation for current language
  const getIndentation = () => {
    const config = languageConfigs[selectedLanguage];
    return config.useTabs ? '\t' : ' '.repeat(config.indentSize);
  };

  // Check if line should be auto-indented
  const shouldAutoIndent = (line, language) => {
    const config = languageConfigs[language];
    if (!config.autoIndent) return false;

    const trimmed = line.trim();
    
    if (language === 'python') {
      return trimmed.endsWith(':') || 
             trimmed.startsWith('if ') || 
             trimmed.startsWith('elif ') || 
             trimmed.startsWith('else:') ||
             trimmed.startsWith('for ') || 
             trimmed.startsWith('while ') ||
             trimmed.startsWith('def ') ||
             trimmed.startsWith('class ') ||
             trimmed.startsWith('try:') ||
             trimmed.startsWith('except') ||
             trimmed.startsWith('finally:') ||
             trimmed.startsWith('with ');
    } else if (language === 'java') {
      return trimmed.endsWith('{') ||
             trimmed.includes('if (') ||
             trimmed.includes('for (') ||
             trimmed.includes('while (') ||
             trimmed.includes('try {') ||
             trimmed.includes('catch (') ||
             trimmed.includes('finally {');
    }
    
    return false;
  };

  // Handle key down in editor
  const handleKeyDown = (e) => {
    const config = languageConfigs[selectedLanguage];
    const textarea = e.target;
    const cursorPosition = textarea.selectionStart;
    
    // Check if current position is editable for Java
    if (!isPositionEditable(code, cursorPosition) && 
        !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Handle Enter key
    if (e.key === 'Enter') {
      const value = textarea.value;
      const selectionStart = textarea.selectionStart;
      
      // Get current line
      const beforeCursor = value.substring(0, selectionStart);
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine = beforeCursor.substring(currentLineStart);
      
      // Get current indentation
      const currentIndent = currentLine.match(/^[\s]*/)[0];
      let newIndent = currentIndent;
      
      // Add extra indentation if needed
      if (shouldAutoIndent(currentLine, selectedLanguage)) {
        newIndent += getIndentation();
      }
      
      // Insert new line with proper indentation
      e.preventDefault();
      const newValue = value.substring(0, selectionStart) + '\n' + newIndent + value.substring(selectionStart);
      setCode(newValue);
      updateLineCount(newValue);
      
      // Set cursor position after indentation
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + newIndent.length;
      }, 0);
    }
    
    // Handle Tab key for indentation
    else if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const indentation = getIndentation();
      
      const newValue = value.substring(0, start) + indentation + value.substring(end);
      setCode(newValue);
      updateLineCount(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indentation.length;
      }, 0);
    }
    
    // Auto-close brackets
    else if (config.brackets[e.key]) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Only auto-close if no text is selected and it's not a quote in the middle of text
      if (start === end) {
        const beforeChar = value[start - 1];
        const afterChar = value[start];
        
        // For quotes, only auto-close if not in the middle of a word
        if ((e.key === '"' || e.key === "'") && 
            ((/\w/.test(beforeChar) && /\w/.test(afterChar)) || 
             (beforeChar === e.key))) {
          return; // Let default behavior happen
        }
        
        e.preventDefault();
        const openBracket = e.key;
        const closeBracket = config.brackets[e.key];
        const newValue = value.substring(0, start) + openBracket + closeBracket + value.substring(end);
        setCode(newValue);
        updateLineCount(newValue);
        
        // Set cursor position between brackets
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
    }
  };

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

  // Security: Window switch detection
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
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [testStarted, loading, fullScreenExitCount]);

  // Security: Keyboard shortcuts
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
      e.preventDefault();
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

  // Auto-hide shortcut warning
  useEffect(() => {
    if (showShortcutWarning) {
      const timer = setTimeout(() => {
        setShowShortcutWarning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showShortcutWarning]);

  // Security: Developer tools detection
  useEffect(() => {
    let devToolsOpen = false;
    let checkInterval;
  
    const checkDevTools = () => {
      const threshold = 160;
  
      const isDevToolsOpen =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;
  
      if (isDevToolsOpen && !devToolsOpen && !loading && testDetails && testStarted) {
        devToolsOpen = true;
  
        setFullScreenExitCount((prev) => {
          const updated = prev + 1;
          setShowDevToolWarning(true);

          if (updated >= 4) {
            handleSubmit("User opened inspect/devtools");
          }
  
          return updated;
        });
      }
  
      if (!isDevToolsOpen) {
        devToolsOpen = false;
      }
    };
  
    checkInterval = setInterval(checkDevTools, 1000);
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
        setFullScreenExitCount((prev) => prev + 1);
        pauseTest();
        setShowNotification(true);

        if (fullScreenExitCount >= 3) {
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
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [loading, testDetails, fullScreenExitCount, testStarted]);

  const requestFullScreen = () => {
    const element = mainContainerRef.current || document.documentElement;

    try {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
        });
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } catch (error) {
      console.error("Error in fullscreen request:", error);
    }
  };

  const startTest = () => {
    if (testAllotmentId) {
      fetchTestDetails();
    } else {
      setError('Invalid test allotment. Please try again.');
    }
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


const handleSubmit = async (description) => {
  try {
    const { user, token } = getUserData();

    // File name must be allotmentId + extension
    const fileName = `${testAllotmentId}${languageConfigs[selectedLanguage].extension}`;

    // Prepare ApiRequestModel
    const apiRequestModel = {
      user,
      token,
      fileName,
      allotmentId: testAllotmentId
    };

    // Prepare file (convert code string → Blob → File)
    const codeFile = new File([code], fileName, { type: "text/plain" });

    // Prepare FormData
    const formData = new FormData();
    formData.append("requestData", new Blob([JSON.stringify(apiRequestModel)], { type: "application/json" }));
    formData.append("file", codeFile);

    console.log("Submitting coding task:", apiRequestModel, codeFile);

    // Submit using multipart/form-data
    const response = await axios.post(`${SUBMIT_CODING_TASK}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.response === "success") {
      alert(
        `Code submitted successfully!\nLanguage: ${languageConfigs[selectedLanguage].name}\nReason: ${description}\nCode length: ${code.length} characters\nTotal lines: ${lineCount}`
      );

      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }

      // Navigate back
      navigate("/my-test");
    } else {
      throw new Error(response.data.message || "Submission failed");
    }
  } catch (err) {
    console.error("Submission error:", err);
    alert("Error submitting test. Please try again.");
  }
};


  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleCodeChange = (e) => {
    if (!isPaused && !showSubmitConfirmation) {
      const newCode = e.target.value;
      setCode(newCode);
      updateLineCount(newCode);
    }
  };

  // Sync scroll between line numbers and code editor
  const handleScroll = () => {
    if (lineNumbersRef.current && codeEditorRef.current) {
      lineNumbersRef.current.scrollTop = codeEditorRef.current.scrollTop;
    }
  };

  // Generate line numbers based on code content - show all line numbers
  const getLineNumbers = () => {
    const lines = code.split('\n');
    const config = languageConfigs[selectedLanguage];
    
    return lines.map((line, index) => {
      const isProtected = selectedLanguage === 'java' && config.protectedLines.includes(index);
      return (
        <div 
          key={index} 
          className={`${styles.lineNumber} ${isProtected ? styles.protectedLine : ''}`}
        >
          {index + 1}
        </div>
      );
    });
  };

  // Render description with HTML content from react-quill
  const renderDescription = (htmlContent) => {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
        className={styles.problemDescription}
      />
    );
  };

  // Get available languages based on technology configuration
  const getAvailableLanguages = () => {
    const availableConfigs = {};
    allowedLanguages.forEach(langKey => {
      if (languageConfigs[langKey]) {
        availableConfigs[langKey] = languageConfigs[langKey];
      }
    });
    return availableConfigs;
  };

  // Get language status for display
  const getLanguageStatus = (langKey) => {
    if (langKey === recommendedLanguage) {
      return testDetails?.isAnyAllowed ? 'recommended' : 'primary';
    }
    return 'allowed';
  };

  // Get technology display string
  const getTechnologyDisplayString = () => {
    if (!technologyString || technologyString === 'ANY') {
      return 'Any Language (Choose your preferred language)';
    }
    
    const techArray = technologyString.split(',').map(tech => tech.trim());
    const displayTechs = techArray.map(tech => {
      const techUpper = tech.toUpperCase();
      if (techUpper === 'CPP') return 'C++';
      if (techUpper === 'JS') return 'JavaScript';
      return tech;
    });
    
    if (displayTechs.length === 1) {
      return `Required: ${displayTechs[0]}`;
    } else {
      return `Allowed: ${displayTechs.join(', ')}`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading coding test...</div>
        <div>Please wait while we fetch your assignment details.</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.error}>
        <div>{error}</div>
        <button onClick={() => {
          setError(null);
          if (testAllotmentId) {
            fetchTestDetails();
          }
        }}>
          Try Again
        </button>
      </div>
    );
  }

  // Start screen - show before test begins
  if (!isTestStarted && !testInformation && testAllotmentId) {
    return (
      <div className={styles.startScreen} ref={mainContainerRef}>
        <div className={styles.startCard}>
          <h2>Coding Challenge</h2>
          
          <div className={styles.testInfoStart}>
            <div className={styles.infoItem}>Type: Coding Challenge</div>
            <div className={styles.infoItem}>Allotment ID: {testAllotmentId}</div>
            {userData?.user && (
              <div className={styles.infoItem}>
                Student: {userData.user.firstName} {userData.user.lastName}
              </div>
            )}
          </div>

          <div className={styles.testRules}>
            <h3>Important Instructions:</h3>
            <ul>
              <li>This test must be taken in full-screen mode.</li>
              <li>You can import any packages/libraries you need for your solution.</li>
              <li>Copy, paste, and other shortcuts are disabled for security.</li>
              <li>Exiting full-screen mode will pause the test.</li>
              <li>After exiting full-screen 4 times, your test will be automatically submitted.</li>
              <li>Developer tools are monitored and will result in auto-submission.</li>
              <li>The timer will start once you begin the test.</li>
              <li>Write clean, efficient code with proper comments.</li>
              <li>Test your solution with the provided examples.</li>
              <li>Language-specific features: Auto-indentation and bracket matching are enabled.</li>
              <li><strong>Java Specific:</strong> The main class structure is protected and cannot be edited.</li>
              <li><strong>Language Selection:</strong> Available languages are based on the test requirements.</li>
              <li>Your code will be submitted directly without file download.</li>
            </ul>
          </div>

          <button 
            className={styles.startButton} 
            onClick={startTest}
            disabled={!testAllotmentId}
          >
            {testAllotmentId ? 'Start Coding Test in Full Screen' : 'Loading...'}
          </button>
        </div>
      </div>
    );
  }

  // Test in progress screen
  if (!testDetails) {
    return <div className={styles.loading}>Starting coding test...</div>;
  }

  const availableLanguages = getAvailableLanguages();

  return (
    <div className={styles.fullScreenContainer} ref={mainContainerRef}>
      {/* Notification overlays */}
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

      {showSubmitConfirmation && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationPopup}>
            <h3>Confirm Submission</h3>
            <p>Are you sure you want to submit your coding solution?</p>
            <div className={styles.codeSummary}>
              <p>Language: <strong>{languageConfigs[selectedLanguage].name}</strong></p>
              <p>Code length: <strong>{code.length}</strong> characters</p>
              <p>Total lines: <strong>{lineCount}</strong></p>
              <p>Allotment ID: <strong>{testAllotmentId}</strong></p>
              <p>Technology: <strong>{getTechnologyDisplayString()}</strong></p>
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
            <p>Your coding test time has expired.</p>
            <div className={styles.codeSummary}>
              <p>Language: <strong>{languageConfigs[selectedLanguage].name}</strong></p>
              <p>Code length: <strong>{code.length}</strong> characters</p>
              <p>Total lines: <strong>{lineCount}</strong></p>
              <p>Allotment ID: <strong>{testAllotmentId}</strong></p>
              <p>Technology: <strong>{getTechnologyDisplayString()}</strong></p>
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

      {/* Warning popups */}
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

      {/* Header */}
      <div className={styles.testHeader}>
        <div className={styles.headerLeft}>
          <h2>{testDetails.taskName}</h2>
          <div className={styles.testInfo}>
            <div className={styles.infoItem}>
              Student: {userData?.user?.firstName} {userData?.user?.lastName}
            </div>
            <div className={styles.infoItem}>
              Language: {languageConfigs[selectedLanguage].name}
              {getLanguageStatus(selectedLanguage) === 'primary' && (
                <span className={styles.primaryBadge}> (Required)</span>
              )}
              {getLanguageStatus(selectedLanguage) === 'recommended' && (
                <span className={styles.recommendedBadge}> (Recommended)</span>
              )}
            </div>
            <div className={styles.infoItem}>Max Marks: {testDetails.maxMarks}</div>
            <div className={styles.infoItem}>Allotment ID: {testAllotmentId}</div>
            <div className={styles.infoItem}>Exits: {fullScreenExitCount}/4</div>
            <div className={styles.infoItem}>
              Tech: {getTechnologyDisplayString()}
            </div>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.timerDisplay}>
            <div className={styles.timeValue}>{formatTime(timeRemaining)}</div>
            <div className={styles.timeLabel}>Time Remaining</div>
          </div>
          
          <button
            className={`${styles.submitButton} ${isPaused ? styles.disabled : ''}`}
            onClick={() => setShowSubmitConfirmation(true)}
            disabled={isPaused}
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={`${styles.mainContent} ${isPaused || showSubmitConfirmation ? styles.blurred : ''}`}>
        {/* Problem description */}
        <div className={styles.problemPanel}>
          <h3>Problem Description</h3>
          {testDetails.description && typeof testDetails.description === 'string' ? (
            renderDescription(testDetails.description)
          ) : (
            <div className={styles.problemDescription}>
              {testDetails.description || 'Loading problem description...'}
            </div>
          )}
          
          {/* Package import suggestions */}
          <div className={styles.packageSuggestions}>
            <h4>📦 Available Packages/Libraries:</h4>
            <div className={styles.packageList}>
              {languageConfigs[selectedLanguage].packageImports.map((importStatement, index) => (
                <code key={index} className={styles.packageItem}>
                  {importStatement}
                </code>
              ))}
            </div>
            <p className={styles.packageNote}>
              💡 You can use any of these or other packages in your solution. Simply add the import statements in your code.
            </p>
          </div>
        </div>

        {/* Code editor */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <span>Code Editor</span>
            
            {/* Language Selection Dropdown */}
            <div className={styles.languageDropdownContainer}>
              <label htmlFor="languageSelect">Language:</label>
              <select
                id="languageSelect"
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={styles.languageDropdown}
                disabled={isPaused || showSubmitConfirmation}
                title="Select programming language"
              >
                {Object.entries(availableLanguages).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name} ({config.extension})
                    {getLanguageStatus(key) === 'primary' ? ' - Required' : 
                     getLanguageStatus(key) === 'recommended' ? ' - Recommended' : ''}
                  </option>
                ))}
              </select>
              
              {/* Technology status display */}
              <span className={styles.techStatusDisplay}>
                {!testDetails?.isAnyAllowed && allowedLanguages.length === 1 ? (
                  <span className={styles.lockedNotice}>
                    🔒 Language restricted for this test
                  </span>
                ) : allowedLanguages.length < 4 ? (
                  <span className={styles.limitedNotice}>
                    ⚡ Limited to: {allowedLanguages.map(lang => getTechnologyDisplayName(lang)).join(', ')}
                  </span>
                ) : (
                  <span className={styles.openNotice}>
                    🌟 Any language allowed - {getTechnologyDisplayName(recommendedLanguage)} recommended
                  </span>
                )}
              </span>
            </div>
            
            {/* Reset Button */}
            <button
              onClick={resetCode}
              className={styles.resetButton}
              disabled={isPaused || showSubmitConfirmation}
              title="Reset code to template"
            >
              Reset
            </button>
            
            <span className={styles.charCount}>Characters: {code.length}</span>
            <span className={styles.lineCountDisplay}>Total Lines: {lineCount}</span>
          </div>
          
          <div className={styles.editorContainer}>
            <div className={styles.lineNumbers} ref={lineNumbersRef}>
              {getLineNumbers()}
            </div>
            <textarea
              ref={codeEditorRef}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              disabled={isPaused || showSubmitConfirmation}
              className={styles.codeEditor}
              placeholder={`Write your ${languageConfigs[selectedLanguage].name} code here...\nYou can import any packages you need!`}
              spellCheck="false"
              style={{
                tabSize: languageConfigs[selectedLanguage].indentSize,
                fontSize: '14px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingTestIde;
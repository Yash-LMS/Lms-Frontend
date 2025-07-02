// CameraView.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import styles from './CameraView.module.css';
import { TEST_SS_CAPTURE } from '../../constants/apiConstants';

const CameraView = ({ 
  cameraStream, 
  isCameraActive, 
  cameraError, 
  isPermissionBlocked,
  onTurnOnCamera,
  onStopCamera,
  testAllotmentId
}) => {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [feedCheckInterval, setFeedCheckInterval] = useState(null);
  const [screenshotInterval, setScreenshotInterval] = useState(null);
  const retryTimeoutRef = useRef(null);
  const lastScreenshotTimeRef = useRef(0);
  const isCapturingRef = useRef(false); // Prevent multiple simultaneous captures

  // Function to get user data from session storage
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

  // Function to capture screenshot from video feed
  const captureScreenshot = useCallback(() => {
    if (!videoRef.current || !cameraStream || !isVideoLoaded || isCapturingRef.current) {
      console.warn('Video not ready for screenshot capture or capture in progress');
      return null;
    }

    const video = videoRef.current;
    
    // Check if video has valid dimensions
    if (!video.videoWidth || !video.videoHeight) {
      console.warn('Video dimensions not available');
      return null;
    }

    // Check if video is actually playing
    if (video.paused || video.ended || video.readyState < 2) {
      console.warn('Video not in playing state');
      return null;
    }

    isCapturingRef.current = true;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    try {
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          isCapturingRef.current = false;
          resolve(blob);
        }, 'image/jpeg', 0.8); // JPEG with 80% quality
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      isCapturingRef.current = false;
      return null;
    }
  }, [cameraStream, isVideoLoaded]);

  // Function to send screenshot to API
  const sendScreenshotToAPI = useCallback(async () => {
    // Prevent too frequent captures
    const now = Date.now();
    if (now - lastScreenshotTimeRef.current < 30000) { // Minimum 30 seconds between captures
      console.log('Skipping screenshot - too soon after last capture');
      return;
    }
    
    try {
      const screenshotBlob = await captureScreenshot();
      if (!screenshotBlob) {
        console.warn('Failed to capture screenshot');
        return;
      }

      lastScreenshotTimeRef.current = now;

      const userData = getUserData();
      if (!userData.user || !userData.token) {
        console.error('User data not available');
        return;
      }

      // Create FormData for multipart request
      const formData = new FormData();
      
      // Create file from blob
      const file = new File([screenshotBlob], `screenshot_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      
      // Add file and other data to FormData
      formData.append('file', file);
      formData.append('user', JSON.stringify(userData.user));
      formData.append('token', userData.token);
      formData.append('testAllotmentId', testAllotmentId);

      // Send to API using axios
      const response = await axios.post(`${TEST_SS_CAPTURE}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.status === 200) {
        console.log('Screenshot sent successfully:', response.data);
      } else {
        console.error('Failed to send screenshot:', response.status, response.statusText);
      }
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.status, error.response.data);
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network Error:', error.message);
      } else {
        // Something else happened
        console.error('Error sending screenshot to API:', error.message);
      }
    }
  }, [captureScreenshot, testAllotmentId]);

  // Function to start automatic screenshot capture
  const startScreenshotCapture = useCallback(() => {
    if (screenshotInterval) {
      clearInterval(screenshotInterval);
    }

    // Start capturing screenshots every 2 minutes (120000 ms)
    const interval = setInterval(() => {
      console.log('Capturing automatic screenshot...');
      sendScreenshotToAPI();
    }, 120000); // 2 minutes

    setScreenshotInterval(interval);
    console.log('Started automatic screenshot capture (every 2 minutes)');
  }, [sendScreenshotToAPI]);

  // Function to stop automatic screenshot capture
  const stopScreenshotCapture = useCallback(() => {
    if (screenshotInterval) {
      clearInterval(screenshotInterval);
      setScreenshotInterval(null);
      console.log('Stopped automatic screenshot capture');
    }
  }, [screenshotInterval]);

  // Improved video feed checker - less aggressive
  const checkVideoFeed = useCallback(() => {
    if (!videoRef.current || !cameraStream || isCapturingRef.current) return;

    const video = videoRef.current;
    
    // Check if video is in a good state first
    if (video.paused || video.ended || video.readyState < 2) {
      console.log('Video not in playing state, skipping feed check');
      return;
    }

    // Don't check during or right after screenshot capture
    const timeSinceLastCapture = Date.now() - lastScreenshotTimeRef.current;
    if (timeSinceLastCapture < 5000) { // Skip check for 5 seconds after capture
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check if image is mostly black (blank feed) - more lenient threshold
      let nonBlackPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 20 || g > 20 || b > 20) { // Lowered threshold
          nonBlackPixels++;
        }
      }
      
      const totalPixels = data.length / 4;
      const nonBlackRatio = nonBlackPixels / totalPixels;
      
      // If less than 2% of pixels are non-black, consider it a blank feed (more lenient)
      if (nonBlackRatio < 0.02 && isVideoLoaded) {
        console.warn('Blank video feed detected, but not refreshing to avoid disruption');
        // Instead of refreshing, just log the issue
        // Only refresh if the stream is actually broken
        if (video.readyState === 0 || video.networkState === 3) {
          console.warn('Video stream appears broken, attempting refresh...');
          refreshVideoFeed();
        }
      }
    } catch (error) {
      console.error('Error checking video feed:', error);
    }
  }, [cameraStream, isVideoLoaded]);

  // More conservative refresh function
  const refreshVideoFeed = useCallback(() => {
    if (!videoRef.current || !cameraStream) return;

    console.log('Refreshing video feed...');
    const video = videoRef.current;
    
    // Don't refresh if video is working fine
    if (video.readyState >= 2 && !video.paused && !video.ended) {
      console.log('Video appears to be working, skipping refresh');
      return;
    }
    
    // Stop any ongoing monitoring temporarily
    if (feedCheckInterval) {
      clearInterval(feedCheckInterval);
      setFeedCheckInterval(null);
    }
    
    setIsVideoLoaded(false);
    
    // Clear current source
    video.srcObject = null;
    
    // Re-assign after a short delay
    setTimeout(() => {
      if (videoRef.current && cameraStream) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(console.error);
      }
    }, 500); // Increased delay
  }, [cameraStream, feedCheckInterval]);

  // Remove the unnecessary useEffect that calls refreshVideoFeed immediately
  // useEffect(() => {
  //   refreshVideoFeed();
  // }, []); 

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      const video = videoRef.current;
      
      // Set up video element
      video.srcObject = cameraStream;
      
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded');
        setIsVideoLoaded(true);
        video.play().catch(console.error);
      };

      const handleLoadedData = () => {
        console.log('Video data loaded');
        setIsVideoLoaded(true);
      };

      const handleCanPlay = () => {
        console.log('Video can play');
        setIsVideoLoaded(true);
      };

      const handleError = (e) => {
        console.error('Video element error:', e);
        setIsVideoLoaded(false);
        // Only retry if it's a real error, not during normal operation
        if (video.error) {
          retryTimeoutRef.current = setTimeout(() => {
            refreshVideoFeed();
          }, 2000);
        }
      };

      // Add event listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      
      // Force play if metadata is already loaded
      if (video.readyState >= 1) {
        handleLoadedMetadata();
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    } else {
      setIsVideoLoaded(false);
    }
  }, [cameraStream, refreshVideoFeed]);

  // Start feed monitoring separately and less frequently
  useEffect(() => {
    if (isVideoLoaded && isCameraActive && cameraStream) {
      // Start monitoring after video is stable
      const monitoringDelay = setTimeout(() => {
        const interval = setInterval(checkVideoFeed, 10000); // Check every 10 seconds instead of 3
        setFeedCheckInterval(interval);
      }, 5000); // Wait 5 seconds before starting monitoring

      return () => {
        clearTimeout(monitoringDelay);
      };
    }
  }, [isVideoLoaded, isCameraActive, cameraStream, checkVideoFeed]);

  // Start/stop screenshot capture when video loads/unloads
  useEffect(() => {
    if (isVideoLoaded && isCameraActive && cameraStream) {
      // Start screenshot capture after a longer delay to ensure video is stable
      const startDelay = setTimeout(() => {
        startScreenshotCapture();
      }, 5000); // Wait 5 seconds after video loads

      return () => {
        clearTimeout(startDelay);
      };
    } else {
      stopScreenshotCapture();
    }
  }, [isVideoLoaded, isCameraActive, cameraStream, startScreenshotCapture, stopScreenshotCapture]);

  // Clean up intervals and video when component unmounts
  useEffect(() => {
    return () => {
      if (feedCheckInterval) {
        clearInterval(feedCheckInterval);
      }
      if (screenshotInterval) {
        clearInterval(screenshotInterval);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [feedCheckInterval, screenshotInterval]);

  return (
    <div className={styles.cameraContainer}>
      {isCameraActive && (
        <div className={styles.cameraBox}>
          <video
            ref={videoRef}
            className={styles.videoElement}
            autoPlay
            playsInline
            muted
          />
          <div className={styles.cameraControls}>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              Live
            </div>
            {/* Debug info - remove in production */}
            {screenshotInterval && (
              <div className={styles.debugInfo} style={{ fontSize: '12px', color: '#666' }}>
                Auto-capture: Active
              </div>
            )}
          </div>
          
          {/* Loading overlay when video is not loaded */}
          {!isVideoLoaded && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingSpinner}></div>
              <span>Loading feed...</span>
            </div>
          )}
        </div>
      )}

      {cameraError && (
        <div className={styles.errorContainer}>
          <div className={styles.errorMessage}>
            {cameraError.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
          {!isCameraActive && (
            <button
              onClick={onTurnOnCamera}
              className={styles.retryButton}
            >
              Turn On Camera
            </button>
          )}
        </div>
      )}

      {!isCameraActive && !cameraError && (
        <div className={styles.cameraOffContainer}>
          <button
            onClick={onTurnOnCamera}
            className={styles.turnOnButton}
          >
            📹 Turn On Camera
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraView;
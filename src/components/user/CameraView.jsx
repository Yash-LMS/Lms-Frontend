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
    if (!videoRef.current || !cameraStream || !isVideoLoaded) {
      console.warn('Video not ready for screenshot capture');
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    
    try {
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8); // JPEG with 80% quality
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  }, [cameraStream, isVideoLoaded]);

  // Function to send screenshot to API
  const sendScreenshotToAPI = useCallback(async () => {
    try {
      const screenshotBlob = await captureScreenshot();
      if (!screenshotBlob) {
        console.warn('Failed to capture screenshot');
        return;
      }

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
  }, [sendScreenshotToAPI, screenshotInterval]);

  // Function to stop automatic screenshot capture
  const stopScreenshotCapture = useCallback(() => {
    if (screenshotInterval) {
      clearInterval(screenshotInterval);
      setScreenshotInterval(null);
      console.log('Stopped automatic screenshot capture');
    }
  }, [screenshotInterval]);

  // Function to check if video feed is blank/black
  const checkVideoFeed = useCallback(() => {
    if (!videoRef.current || !cameraStream) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check if image is mostly black (blank feed)
      let nonBlackPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 30 || g > 30 || b > 30) {
          nonBlackPixels++;
        }
      }
      
      const totalPixels = data.length / 4;
      const nonBlackRatio = nonBlackPixels / totalPixels;
      
      // If less than 5% of pixels are non-black, consider it a blank feed
      if (nonBlackRatio < 0.05 && isVideoLoaded) {
        console.warn('Blank video feed detected, attempting to refresh...');
        refreshVideoFeed();
      }
    } catch (error) {
      console.error('Error checking video feed:', error);
    }
  }, [cameraStream, isVideoLoaded]);

  // Function to refresh video feed
  const refreshVideoFeed = useCallback(() => {
    if (!videoRef.current || !cameraStream) return;

    const video = videoRef.current;
    
    // Clear current source
    video.srcObject = null;
    
    // Re-assign after a short delay
    setTimeout(() => {
      if (videoRef.current && cameraStream) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(console.error);
      }
    }, 100);
  }, [cameraStream]);

  useEffect(() => {
    refreshVideoFeed();
  }, []); 

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      const video = videoRef.current;
      
      // Set up video element
      video.srcObject = cameraStream;
      
      const handleLoadedMetadata = () => {
        setIsVideoLoaded(true);
        video.play().catch(console.error);
      };

      const handleLoadedData = () => {
        setIsVideoLoaded(true);
      };

      const handleError = () => {
        console.error('Video element error, attempting refresh...');
        setIsVideoLoaded(false);
        // Retry after a short delay
        retryTimeoutRef.current = setTimeout(() => {
          refreshVideoFeed();
        }, 1000);
      };

      // Add event listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      
      // Force play if metadata is already loaded
      if (video.readyState >= 1) {
        handleLoadedMetadata();
      }

      // Start monitoring feed after video loads
      const monitoringDelay = setTimeout(() => {
        if (isVideoLoaded) {
          const interval = setInterval(checkVideoFeed, 3000); // Check every 3 seconds
          setFeedCheckInterval(interval);
        }
      }, 2000);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        clearTimeout(monitoringDelay);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      };
    } else {
      setIsVideoLoaded(false);
    }
  }, [cameraStream, checkVideoFeed, refreshVideoFeed, isVideoLoaded]);

  // Start/stop screenshot capture when video loads/unloads
  useEffect(() => {
    if (isVideoLoaded && isCameraActive && cameraStream) {
      // Start screenshot capture after a short delay to ensure video is stable
      const startDelay = setTimeout(() => {
        startScreenshotCapture();
      }, 3000); // Wait 3 seconds after video loads

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
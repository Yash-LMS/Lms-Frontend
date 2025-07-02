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
  const feedCheckIntervalRef = useRef(null);
  const screenshotIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const lastScreenshotTimeRef = useRef(0);
  const isCapturingRef = useRef(false);

  // Get user data from session storage
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

  // Capture screenshot from video feed
  const captureScreenshot = useCallback(() => {
    if (
      !videoRef.current ||
      !cameraStream ||
      !isVideoLoaded ||
      isCapturingRef.current
    ) {
      console.warn('Video not ready for screenshot capture or capture in progress');
      return null;
    }

    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      console.warn('Video dimensions not available');
      return null;
    }
    if (video.paused || video.ended || video.readyState < 2) {
      console.warn('Video not in playing state');
      return null;
    }

    isCapturingRef.current = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          isCapturingRef.current = false;
          resolve(blob);
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      isCapturingRef.current = false;
      return null;
    }
  }, [cameraStream, isVideoLoaded]);

  // Send screenshot to API
  const sendScreenshotToAPI = useCallback(async () => {
    const now = Date.now();
    if (now - lastScreenshotTimeRef.current < 30000) {
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

      const formData = new FormData();
      const file = new File([screenshotBlob], `screenshot_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      formData.append('file', file);
      formData.append('user', JSON.stringify(userData.user));
      formData.append('token', userData.token);
      formData.append('testAllotmentId', testAllotmentId);

      const response = await axios.post(`${TEST_SS_CAPTURE}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.status === 200) {
        console.log('Screenshot sent successfully:', response.data);
      } else {
        console.error('Failed to send screenshot:', response.status, response.statusText);
      }
    } catch (error) {
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Network Error:', error.message);
      } else {
        console.error('Error sending screenshot to API:', error.message);
      }
    }
  }, [captureScreenshot, testAllotmentId]);

  // Start automatic screenshot capture
  const startScreenshotCapture = useCallback(() => {
    if (screenshotIntervalRef.current) {
      clearInterval(screenshotIntervalRef.current);
    }
    screenshotIntervalRef.current = setInterval(() => {
      console.log('Capturing automatic screenshot...');
      sendScreenshotToAPI();
    }, 120000); // 2 minutes
    console.log('Started automatic screenshot capture (every 2 minutes)');
  }, [sendScreenshotToAPI]);

  // Stop automatic screenshot capture
  const stopScreenshotCapture = useCallback(() => {
    if (screenshotIntervalRef.current) {
      clearInterval(screenshotIntervalRef.current);
      screenshotIntervalRef.current = null;
      console.log('Stopped automatic screenshot capture');
    }
  }, []);

  // Video feed checker
  const checkVideoFeed = useCallback(() => {
    if (!videoRef.current || !cameraStream || isCapturingRef.current) return;

    const video = videoRef.current;
    if (video.paused || video.ended || video.readyState < 2) {
      console.log('Video not in playing state, skipping feed check');
      return;
    }

    const timeSinceLastCapture = Date.now() - lastScreenshotTimeRef.current;
    if (timeSinceLastCapture < 5000) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let nonBlackPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 20 || g > 20 || b > 20) {
          nonBlackPixels++;
        }
      }
      const totalPixels = data.length / 4;
      const nonBlackRatio = nonBlackPixels / totalPixels;

      if (nonBlackRatio < 0.02 && isVideoLoaded) {
        console.warn('Blank video feed detected');
        if (video.readyState === 0 || video.networkState === 3) {
          console.warn('Video stream appears broken, attempting refresh...');
          refreshVideoFeed();
        }
      }
    } catch (error) {
      console.error('Error checking video feed:', error);
    }
  }, [cameraStream, isVideoLoaded]);

  // Refresh video feed (safe version)
  const refreshVideoFeed = useCallback(() => {
    if (!videoRef.current || !cameraStream) return;
    const video = videoRef.current;
    if (video.readyState >= 2 && !video.paused && !video.ended) {
      console.log('Video appears to be working, skipping refresh');
      return;
    }
    setIsVideoLoaded(false);
    setTimeout(() => {
      if (videoRef.current && cameraStream) {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(console.error);
      }
    }, 500);
  }, [cameraStream]);

  // Attach stream and set up video element
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== cameraStream) {
        video.srcObject = cameraStream;
      }

      const handleLoadedMetadata = () => {
        setIsVideoLoaded(true);
        video.play().catch(console.error);
      };
      const handleLoadedData = () => setIsVideoLoaded(true);
      const handleCanPlay = () => setIsVideoLoaded(true);
      const handleError = (e) => {
        console.error('Video element error:', e);
        setIsVideoLoaded(false);
        if (videoRef.current && cameraStream) {
          setTimeout(() => {
            videoRef.current.srcObject = cameraStream;
            videoRef.current.play().catch(console.error);
          }, 1000);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      if (video.readyState >= 1) handleLoadedMetadata();

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      };
    } else {
      setIsVideoLoaded(false);
    }
  }, [cameraStream, isCameraActive]);

  // Start feed monitoring
  useEffect(() => {
    if (isVideoLoaded && isCameraActive && cameraStream) {
      if (feedCheckIntervalRef.current) clearInterval(feedCheckIntervalRef.current);
      feedCheckIntervalRef.current = setInterval(checkVideoFeed, 10000);
      return () => {
        if (feedCheckIntervalRef.current) clearInterval(feedCheckIntervalRef.current);
      };
    }
  }, [isVideoLoaded, isCameraActive, cameraStream, checkVideoFeed]);

  // Start/stop screenshot capture
  useEffect(() => {
    if (isVideoLoaded && isCameraActive && cameraStream) {
      startScreenshotCapture();
      return () => stopScreenshotCapture();
    } else {
      stopScreenshotCapture();
    }
  }, [isVideoLoaded, isCameraActive, cameraStream, startScreenshotCapture, stopScreenshotCapture]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (feedCheckIntervalRef.current) clearInterval(feedCheckIntervalRef.current);
      if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

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
            {screenshotIntervalRef.current && (
              <div className={styles.debugInfo} style={{ fontSize: '12px', color: '#666' }}>
                Auto-capture: Active
              </div>
            )}
          </div>
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
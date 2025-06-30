// CameraView.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './CameraView.module.css';

const CameraView = ({ 
  cameraStream, 
  isCameraActive, 
  cameraError, 
  isPermissionBlocked,
  onTurnOnCamera,
  onStopCamera 
}) => {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [feedCheckInterval, setFeedCheckInterval] = useState(null);
  const retryTimeoutRef = useRef(null);



  
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

  // Clean up intervals and video when component unmounts
  useEffect(() => {
    return () => {
      if (feedCheckInterval) {
        clearInterval(feedCheckInterval);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [feedCheckInterval]);

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
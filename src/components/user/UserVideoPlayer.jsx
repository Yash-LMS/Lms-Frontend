import React, { useState, useEffect, useRef } from "react";
import styles from "./UserVideoPlayer.module.css";
import axios from "axios";

import { 
  USER_VIDEO_WATCH_URL, 
  VIEW_VIDEO_UPDATE_STATUS_URL,
  VIDEO_SIZE_URL,
  COMPLETE_VIDEO_UPDATE_STATUS_URL 
} from "../../constants/apiConstants";

const UserVideoPlayer = ({ courseId, trackingId, completionStatus, topicId, user, token, onVideoCompleted }) => {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [key, setKey] = useState(0);
  const [videoSize, setVideoSize] = useState(0);
  const [videoViewed, setVideoViewed] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const completionCallbackRef = useRef(false);

  useEffect(() => {
    // Reset loading state when topicId changes
    setIsLoading(true);
    setError(null);
    setVideoViewed(false);
    setVideoCompleted(false);
    completionCallbackRef.current = false;
    
    const fetchVideoDetails = async () => {
      if (!validateUserAccess(user, courseId)) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch video using axios
        const response = await axios.get(`${USER_VIDEO_WATCH_URL}?courseId=${courseId}&topicId=${topicId}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });

        if (!response.data) {
          throw new Error("Failed to fetch video URL");
        }

        const contentType = response.headers['content-type'];
        if (!contentType.startsWith("video/")) {
          throw new Error("Invalid video format");
        }

        // Add timestamp to prevent caching when topicId changes
        const newVideoUrl = `${USER_VIDEO_WATCH_URL}?courseId=${courseId}&topicId=${topicId}&t=${new Date().getTime()}`;
        setVideoUrl(newVideoUrl);
        setKey(prevKey => prevKey + 1); // Increment key to force video element to re-render
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    if (courseId && topicId && token) {
      fetchVideoDetails();
    } else {
      setError("Missing required parameters");
      setIsLoading(false);
    }
  }, [courseId, topicId, user, token, trackingId, completionStatus]);

  useEffect(() => {
    if(topicId !== null && topicId !== ""){
      fetchVideoSize();
    }
  }, [topicId, token]);

  const fetchVideoSize = async () => {
    try {
      const sizeResponse = await axios.get(`${VIDEO_SIZE_URL}?topicId=${topicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fix the typo in "success" and handle different response formats
      if (sizeResponse.data && (sizeResponse.data.response === "success" || sizeResponse.data.response === "suceess")) {
        const sizeData = sizeResponse.data.payload;
        if (sizeData && sizeData.size) {
          setVideoSize(sizeData.size);
        } else {
          console.log("Size not found in payload");
          // Set a default size if your API might return a success without size
          setVideoSize(0);
        }
      } else {
        console.log("Size not found in response");
        // Set a default size if size is not found
        setVideoSize(0);
      }
    } catch (error) {
      console.error("Error fetching video size:", error);
      // Set a default size on error
      setVideoSize(0);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    
    if (video) {
      // Function to handle when enough of the video has been played
      const handleTimeUpdate = () => {
        // Mark as viewed when user watches at least 10% of the video
        if (video.currentTime > video.duration * 0.1 && !videoViewed) {
          setVideoViewed(true);
          viewVideo();
        }
        
        // Mark as completed when user watches at least 100% of the video
        if (video.currentTime >= video.duration && !videoCompleted) {
          setVideoCompleted(true);
          completeVideo();
        }
      };
      
      // Function to handle video ending
      const handleVideoEnded = () => {
        if (videoCompleted && !completionCallbackRef.current && typeof onVideoCompleted === "function") {
          completionCallbackRef.current = true;
          onVideoCompleted();
        }
      };
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleVideoEnded);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleVideoEnded);
      };
    }
  }, [videoUrl, videoViewed, videoCompleted, onVideoCompleted]);

  const viewVideo = async () => {
    try {
      const requestBody = {
        user,
        token,
        courseTrackingId: trackingId,
        completionStatus: 'viewed',
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.post(VIEW_VIDEO_UPDATE_STATUS_URL, requestBody, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("View video response:", response.data);
      return response.data;
    } catch (err) {
      console.error('Error updating video status:', err);
      return false;
    }
  };

  const completeVideo = async () => {
    try {
      const requestBody = {
        user,
        token,
        courseTrackingId: trackingId,
      };
      
      const response = await axios.post(COMPLETE_VIDEO_UPDATE_STATUS_URL, requestBody, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Complete video response:", response.data);
      
      return response.data;
    } catch (err) {
      console.error('Error completing video status:', err);
      return false;
    }
  };

  const validateUserAccess = (user, courseId) => {
    return !!user;
  };

  if (isLoading) return <div className={styles.loading}>Loading video...</div>;
  if (!isAuthorized) return <div className={styles.unauthorized}>You are not authorized to view this video.</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.videoPlayer}>
      <div className={styles.videoContainer}>
        <video 
          key={key} // Use key to force complete re-render of video element
          ref={videoRef} 
          controls 
          autoPlay 
          controlsList="nodownload noplaybackrate"
          onError={(e) => console.error("Video error:", e)}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/x-matroska" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default UserVideoPlayer;
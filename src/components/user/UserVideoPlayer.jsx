import React, { useState, useEffect, useRef } from "react";
import styles from "./UserVideoPlayer.module.css";
import { VIDEO_WATCH_URL } from "../../constants/apiConstants";

const UserVideoPlayer = ({ courseId, topicId, user, token }) => {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [key, setKey] = useState(0); // Add a key state to force re-render when videoUrl changes

  useEffect(() => {
    // Reset loading state when topicId changes
    setIsLoading(true);
    setError(null);
    
    const fetchVideoUrl = async () => {
      if (!validateUserAccess(user, courseId)) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      // Fetch video URL with correct file extension
      try {
        const response = await fetch(`${VIDEO_WATCH_URL}?courseId=${courseId}&topicId=${topicId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch video URL");
        }

        const contentType = response.headers.get("Content-Type");
        if (!contentType.startsWith("video/")) {
          throw new Error("Invalid video format");
        }

        // Add timestamp to prevent caching when topicId changes
        const newVideoUrl = `${VIDEO_WATCH_URL}?courseId=${courseId}&topicId=${topicId}&t=${new Date().getTime()}`;
        setVideoUrl(newVideoUrl);
        setKey(prevKey => prevKey + 1); // Increment key to force video element to re-render
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    if (courseId && topicId && token) {
      fetchVideoUrl();
    } else {
      setError("Missing required parameters");
      setIsLoading(false);
    }
  }, [courseId, topicId, user, token]); // This will re-run whenever topicId changes

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

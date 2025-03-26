import React, { useState, useEffect, useRef } from "react";
import styles from "./VideoPlayer.module.css";
import { VIDEO_WATCH_URL } from "../../constants/apiConstants";

const VideoPlayer = ({ courseId, topicId, user, token }) => {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
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

        setVideoUrl(`${VIDEO_WATCH_URL}?courseId=${courseId}&topicId=${topicId}`);
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
  }, [courseId, topicId, user, token]);

  const validateUserAccess = (user, courseId) => {
    return !!user;
  };

  if (isLoading) return <div className={styles.loading}>Loading video...</div>;
  if (!isAuthorized) return <div className={styles.unauthorized}>You are not authorized to view this video.</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.videoPlayer}>
      <div className={styles.videoContainer}>
        <video ref={videoRef} controls autoPlay controlsList="nodownload">
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/x-matroska" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default VideoPlayer;

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./NotificationPage.module.css";

const NotificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve message & redirectPath from state (default values added)
  const { message = "Redirecting...", redirectPath = "/user-dashboard" } = location.state || {};
  
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    
    const timeout = setTimeout(() => {
      navigate(redirectPath);
    }, 10000);
    
    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [navigate, redirectPath]);
  
  return (
    <div className={styles.pageContainer}>
    
      <div className={styles.contentArea}>
        <h1 className={styles.pageTitle}>Notification</h1>
        
        <div className={styles.notificationCard}>
          <div className={styles.messageContainer}>
            <p className={styles.message}>{message}</p>
            <div className={styles.timer}>{countdown}</div>
            <button 
              className={styles.redirectButton}
              onClick={() => navigate(redirectPath)}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Redirecting in ${countdown}s...` : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;


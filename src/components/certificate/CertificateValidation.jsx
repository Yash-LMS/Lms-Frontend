import React, { useState } from 'react';
import axios from 'axios';
import styles from './CertificateValidation.module.css';
import { VERIFY_USER_CERTIFICATE } from '../../constants/apiConstants';

const CertificateValidation = () => {
  const [certificateId, setCertificateId] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setCertificateData(null);
    setValidationStatus(null);

    try {
      const response = await axios.get(`${VERIFY_USER_CERTIFICATE}?certificateId=${certificateId}`);
     
      if(response.status !== 200) {
        setError("Server error. Please try again later.");
        return;
      }

      if (response.data.response === 'success') {
        setCertificateData(response.data.payload);
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
        setError(response.data.message || 'Certificate validation failed. Please check the ID and try again.');
      }
    } catch (err) {
      console.error("Error validating certificate:", err);
      setValidationStatus('invalid');
      setError(err.response?.data?.message || 'An error occurred while validating certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'viewed':
        return styles.statusViewed;
      case 'started':
        return styles.statusStarted;
      case 'not_viewed':
        return styles.statusNotViewed;
      default:
        return '';
    }
  };

  const getTopicTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'docs':
        return '📄';
      case 'test':
        return '✍️';
      default:
        return '📌';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  const resetForm = () => {
    setValidationStatus(null);
    setCertificateData(null);
    setCertificateId('');
    setError(null);
  };

  return (
    <div className={styles.pageContainer}>


      <div className={styles.mainContent}>
        {!validationStatus && !error && (
          <div className={styles.validationCard}>
            <div className={styles.cardHeader}>
              <h2>Certificate Validation</h2>
              <p>Enter  certificate ID to verify</p>
            </div>
            
            <form onSubmit={handleVerify} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="certificateId">Certificate ID</label>
                <input 
                  type="text" 
                  id="certificateId"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Enter  certificate ID"
                  required
                />
              </div>
              <button type="submit" className={styles.primaryButton} disabled={isLoading}>
                {isLoading ? (
                  <span className={styles.loadingSpinner}>
                    <span className={styles.spinnerDot}></span>
                  </span>
                ) : 'Verify Certificate'}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>❌</div>
            <h3>Verification Failed</h3>
            <p>{error}</p>
            <button onClick={resetForm} className={styles.secondaryButton}>
              Try Again
            </button>
          </div>
        )}

        {validationStatus === 'valid' && certificateData && (
          <div className={styles.certificateCard}>
            <div className={styles.validBadge}>
              <span className={styles.checkmark}>✓</span> Valid Certificate
            </div>
            
            <div className={styles.certificateHeader}>
              <h2>{certificateData.courseName}</h2>
              <div className={styles.certMeta}>
                <span>Certificate ID: {certificateData.certificateId}</span>
                <span>Issued: {formatDate(certificateData.completionDate)}</span>
              </div>
            </div>
            
            <div className={styles.recipientInfo}>
              <div className={styles.infoGroup}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Student Name:</span>
                  <span className={styles.value}>{`${certificateData.firstName} ${certificateData.lastName}`}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Instructor:</span>
                  <span className={styles.value}>{certificateData.instructorName}</span>
                </div>
              </div>
              
              <div className={styles.infoGroup}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Allotment ID:</span>
                  <span className={styles.value}>{certificateData.allotmentId}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Allotment Date:</span>
                  <span className={styles.value}>{formatDate(certificateData.allotmentDate)}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.topicsSection}>
              <h3>Course Topics</h3>
              <div className={styles.topicsGrid}>
                {certificateData.courseResultTopicList.map((topic) => (
                  <div key={topic.trackingId} className={styles.topicCard}>
                    <div className={styles.topicHeader}>
                      <span className={styles.topicIcon}>{getTopicTypeIcon(topic.topicType)}</span>
                      <span className={`${styles.statusBadge} ${getStatusColorClass(topic.topicCompletionStatus)}`}>
                        {topic.topicCompletionStatus}
                      </span>
                    </div>
                    <h4 className={styles.topicName}>{topic.topicName}</h4>
                    <p className={styles.topicDesc}>{topic.description || 'No description available'}</p>
                    {topic.feedback && (
                      <div className={styles.topicScore}>
                        Score: <strong>{topic.feedback}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.actionSection}>
              <button onClick={resetForm} className={styles.primaryButton}>
                Verify Another Certificate
              </button>
            </div>
          </div>
        )}
      </div>
      
    
    </div>
  );
};

export default CertificateValidation;
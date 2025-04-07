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
      if (response.data.response === 'success') {
        setCertificateData(response.data.payload);
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
        setError(response.data.message || 'Failed to validate certificate');
      }
    } catch (err) {
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to extract and format score from feedback
  const formatScore = (feedback) => {
    if (!feedback) return null;
    return feedback;
  };

  return (
    <div className={styles.container}>
    

      <div className={styles.content}>
        {!validationStatus ? (
          <div className={styles.validationCard}>
            <h2 className={styles.cardTitle}>Certificate Validation</h2>
            
            <form onSubmit={handleVerify} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="certificateId" className={styles.label}>Certificate ID</label>
                <input 
                  type="text" 
                  id="certificateId"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Enter certificate ID"
                  className={styles.input}
                  required
                />
              </div>
              <button type="submit" className={styles.button} disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Certificate'}
              </button>
            </form>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
          </div>
        ) : (
          validationStatus === 'valid' && certificateData && (
            <div className={styles.validationCard}>
              <header className={styles.header}>
                <div className={styles.logoContainer}>
                  <h1 className={styles.title}>LMS Certificate Verification</h1>
                </div>
               
              </header>
              
              <div className={styles.certificateDetails}>
                <div className={styles.validBadge}>
                  ✓ Valid Certificate
                </div>
                
                <div className={styles.detailsContainer}>
                  <div className={styles.detailRow}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Certificate ID:</span>
                      <span className={styles.detailValue}>{certificateData.certificateId}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Allotment ID:</span>
                      <span className={styles.detailValue}>{certificateData.allotmentId}</span>
                    </div>
                  
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Allotment Date</span>
                      <span className={styles.detailValue}>{certificateData.allotmentDate}</span>
                    </div>
                  
                  </div>
                  
                  <div className={styles.detailSection}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Name:</span>
                      <span className={styles.detailValue}>{`${certificateData.firstName} ${certificateData.lastName}`}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Course:</span>
                      <span className={styles.detailValue}>{certificateData.courseName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Instructor:</span>
                      <span className={styles.detailValue}>{certificateData.instructorName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Completion Date:</span>
                      <span className={styles.detailValue}>{formatDate(certificateData.completionDate)}</span>
                    </div>
                  </div>

                  <div className={styles.topicsSection}>
                    <h3 className={styles.sectionTitle}>Course Topics</h3>
                    <div className={styles.topicsTable}>
                      <div className={styles.tableHeader}>
                        <div className={styles.headerCell}>Topic</div>
                        <div className={styles.headerCell}>Type</div>
                        <div className={styles.headerCell}>Status</div>
                        <div className={styles.headerCell}>Details</div>
                      </div>
                      {certificateData.courseResultTopicList.map((topic) => (
                        <div key={topic.trackingId} className={styles.tableRow}>
                          <div className={styles.tableCell}>{topic.topicName}</div>
                          <div className={styles.tableCell}>
                            <span className={styles.topicType}>
                              {getTopicTypeIcon(topic.topicType)} {topic.topicType}
                            </span>
                          </div>
                          <div className={styles.tableCell}>
                            <span className={`${styles.statusBadge} ${getStatusColorClass(topic.topicCompletionStatus)}`}>
                              {topic.topicCompletionStatus}
                            </span>
                          </div>
                          <div className={styles.tableCell}>
                            <div>{topic.description}</div>
                            {topic.feedback && (
                              <span className={styles.feedback}>
                                Score: {formatScore(topic.feedback)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <button 
                    onClick={() => {
                      setValidationStatus(null);
                      setCertificateData(null);
                      setCertificateId('');
                    }} 
                    className={styles.button}
                  >
                    Validate Another Certificate
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CertificateValidation;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TrpGenerator.module.css';
import { FIND_TEST_URL, FIND_CANDIDATE_URL, GENERATE_TRP_URL } from '../../constants/apiConstants';

const TrpGenerator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Test selection
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  
  // Step 2: Candidate selection
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);

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

  // Fetch available tests
  const fetchTests = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { user, token } = getUserData();
      const officeId = user?.officeId; // Assuming officeId comes from user data
      
      const response = await axios.post(FIND_TEST_URL, {
        user: user,
        token: token,
        officeId: officeId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Adding auth header if needed
        }
      });
      
      if (response.data.status === 'SUCCESS') {
        setAvailableTests(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch tests');
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError(err.response?.data?.message || 'Error fetching tests: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch candidates for selected tests
  const fetchCandidates = async () => {
    if (selectedTests.length === 0) {
      setError('Please select at least one test');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { user, token } = getUserData();
      const officeId = user?.officeId;
      
      const testList = selectedTests.map(test => ({
        testId: test.testId,
        testName: test.testName
      }));

      const response = await axios.post(FIND_CANDIDATE_URL, {
        user: user,
        token: token,
        officeId: officeId,
        testList: testList
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === 'SUCCESS') {
        setAvailableCandidates(response.data.data || []);
        setCurrentStep(2);
      } else {
        setError(response.data.message || 'Failed to fetch candidates');
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.response?.data?.message || 'Error fetching candidates: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate TRP report
  const generateTrpReport = async () => {
    if (selectedCandidates.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { user, token } = getUserData();
      const officeId = user?.officeId;
      
      const testIds = selectedTests.map(test => test.testId);
      const candidateEmails = selectedCandidates.map(candidate => candidate.emailId);

      const response = await axios.post(GENERATE_TRP_URL, {
        user: user,
        token: token,
        officeId: officeId,
        testList: testIds,
        candidateList: candidateEmails
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file downloads
      });

      // Handle file download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `TRP_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Reset form after successful generation
      setSelectedTests([]);
      setSelectedCandidates([]);
      setAvailableTests([]);
      setAvailableCandidates([]);
      setCurrentStep(1);
      
      // Optionally refetch tests for next use
      await fetchTests();
      
    } catch (err) {
      console.error('Error generating TRP report:', err);
      setError(err.response?.data?.message || 'Error generating report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle test selection
  const handleTestSelection = (test) => {
    const isSelected = selectedTests.some(t => t.testId === test.testId);
    if (isSelected) {
      setSelectedTests(selectedTests.filter(t => t.testId !== test.testId));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  // Handle candidate selection
  const handleCandidateSelection = (candidate) => {
    const isSelected = selectedCandidates.some(c => c.emailId === candidate.emailId);
    if (isSelected) {
      setSelectedCandidates(selectedCandidates.filter(c => c.emailId !== candidate.emailId));
    } else {
      setSelectedCandidates([...selectedCandidates, candidate]);
    }
  };

  // Initialize tests on component mount
  useEffect(() => {
    fetchTests();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>TRP Report Generator</h1>
        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>Select Tests</span>
          </div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Select Candidates</span>
          </div>
          <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Generate Report</span>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {currentStep === 1 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Step 1: Select Tests</h2>
          <p className={styles.stepDescription}>Choose the tests you want to include in the TRP report.</p>
          
          <div className={styles.testGrid}>
            {availableTests.map((test) => (
              <div
                key={test.testId}
                className={`${styles.testCard} ${
                  selectedTests.some(t => t.testId === test.testId) ? styles.selected : ''
                }`}
                onClick={() => handleTestSelection(test)}
              >
                <div className={styles.checkbox}>
                  {selectedTests.some(t => t.testId === test.testId) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </div>
                <div className={styles.testInfo}>
                  <h3 className={styles.testName}>{test.testName}</h3>
                  <p className={styles.testId}>ID: {test.testId}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedTests.length > 0 && (
            <div className={styles.selectedInfo}>
              <p>Selected {selectedTests.length} test(s)</p>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button 
              className={styles.primaryButton}
              onClick={fetchCandidates}
              disabled={loading || selectedTests.length === 0}
            >
              {loading ? 'Loading...' : 'Find Candidates'}
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Step 2: Select Candidates</h2>
          <p className={styles.stepDescription}>Choose the candidates for the selected tests.</p>
          
          <div className={styles.candidateList}>
            {availableCandidates.map((candidate) => (
              <div
                key={candidate.emailId}
                className={`${styles.candidateCard} ${
                  selectedCandidates.some(c => c.emailId === candidate.emailId) ? styles.selected : ''
                }`}
                onClick={() => handleCandidateSelection(candidate)}
              >
                <div className={styles.checkbox}>
                  {selectedCandidates.some(c => c.emailId === candidate.emailId) && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </div>
                <div className={styles.candidateInfo}>
                  <h3 className={styles.candidateName}>{candidate.name}</h3>
                  <p className={styles.candidateEmail}>{candidate.emailId}</p>
                  <p className={styles.candidateOffice}>Office: {candidate.officeId}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedCandidates.length > 0 && (
            <div className={styles.selectedInfo}>
              <p>Selected {selectedCandidates.length} candidate(s)</p>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button 
              className={styles.secondaryButton}
              onClick={() => setCurrentStep(1)}
            >
              Back to Tests
            </button>
            <button 
              className={styles.primaryButton}
              onClick={generateTrpReport}
              disabled={loading || selectedCandidates.length === 0}
            >
              {loading ? 'Generating...' : 'Generate TRP Report'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default TrpGenerator;
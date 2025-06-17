import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUser, faSpinner } from "@fortawesome/free-solid-svg-icons";
import styles from "./ViewCandidatesModal.module.css";
import { FIND_CANDIDATE_LIST_FOR_BATCH_URL } from "../../constants/apiConstants";

const ViewCandidatesModal = ({ isOpen, onClose, batchId, batchName }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user and token from localStorage or your auth context
  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem("user")),
        token: sessionStorage.getItem("token"),
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null };
    }
  };

  const fetchCandidates = async () => {
    if (!batchId) return;

    setLoading(true);
    setError(null);

    try {
      const { user, token } = getUserData();
      
      const requestData = {
        batchId: batchId,
        user: user,
        token: token
      };

      console.log(requestData);

      const response = await axios.post(FIND_CANDIDATE_LIST_FOR_BATCH_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data && response.data.response === "success") {
        setCandidates(response.data.payload || []);
      } else {
        setError(response.data?.message || "Failed to fetch candidates");
      }
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "An error occurred while fetching candidates"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && batchId) {
      fetchCandidates();
    }
  }, [isOpen, batchId]);

  const handleClose = () => {
    setCandidates([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Candidates in Batch</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.batchInfo}>
            <h3>{batchName}</h3>
            <p>Batch ID: {batchId}</p>
          </div>

          {loading && (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon icon={faSpinner} spin />
              <p>Loading candidates...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
              <button 
                className={styles.retryButton} 
                onClick={fetchCandidates}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && candidates.length === 0 && (
            <div className={styles.noCandidates}>
              <FontAwesomeIcon icon={faUser} size="2x" />
              <p>No candidates found in this batch</p>
            </div>
          )}

          {!loading && !error && candidates.length > 0 && (
            <div className={styles.candidatesContainer}>
              <div className={styles.candidateHeader}>
                <h4>Total Candidates: {candidates.length}</h4>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.candidatesTable}>
                  <thead>
                    <tr>
                      <th>S.No.</th>
                      <th>
                        <FontAwesomeIcon icon={faUser} className={styles.headerIcon} />
                        Name
                      </th>
                      <th>Email</th>
                      <th>Employee ID</th>
                      <th>Employee Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate, index) => (
                      <tr key={candidate.candidateId || index}>
                        <td className={styles.serialNumber}>{index + 1}</td>
                        <td className={styles.candidateName}>
                          {candidate.name || `Candidate ${index + 1}`}
                        </td>
                        <td className={styles.candidateEmail}>
                          {candidate.emailId || 'N/A'}
                        </td>
                        <td className={styles.candidateId}>
                          {candidate.employeeId || 'N/A'}
                        </td>
                        <td className={styles.candidateEmail}>
                          {candidate.employeeType || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCandidatesModal;
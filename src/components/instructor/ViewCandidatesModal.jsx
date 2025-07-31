import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUser, faSpinner, faUserMinus, faComment } from "@fortawesome/free-solid-svg-icons";
import styles from "./ViewCandidatesModal.module.css";
import { FIND_CANDIDATE_LIST_FOR_BATCH_URL, RELEASE_CANDIDATE_URL } from "../../constants/apiConstants";

// Remark Modal Component
const RemarkModal = ({ isOpen, onClose, onSubmit, candidateName, loading }) => {
  const [remark, setRemark] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (remark.trim()) {
      onSubmit(remark.trim());
    }
  };

  const handleClose = () => {
    setRemark("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.remarkModalOverlay}>
      <div className={styles.remarkModalContent}>
        <div className={styles.remarkModalHeader}>
          <h3>Release Candidate - Add Remark</h3>
          <button className={styles.closeButton} onClick={handleClose} disabled={loading}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.remarkModalBody}>
            <p>You are about to release: <strong>{candidateName}</strong></p>
            <div className={styles.remarkInputGroup}>
              <label htmlFor="remark">
                <FontAwesomeIcon icon={faComment} className={styles.remarkIcon} />
                Remark (Required):
              </label>
              <textarea
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Please provide a reason for releasing this candidate..."
                required
                disabled={loading}
                rows={4}
                className={styles.remarkTextarea}
              />
            </div>
          </div>
          <div className={styles.remarkModalFooter}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.releaseConfirmButton}
              disabled={loading || !remark.trim()}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Releasing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserMinus} />
                  Release Candidate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewCandidatesModal = ({ isOpen, onClose, batchId, batchName }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [releasingCandidates, setReleasingCandidates] = useState(new Set());
  const [remarkModal, setRemarkModal] = useState({
    isOpen: false,
    candidate: null
  });

  // Get user and token from sessionStorage
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
    setSuccessMessage(null);

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

  const handleReleaseClick = (candidate) => {
    setRemarkModal({
      isOpen: true,
      candidate: candidate
    });
  };

  const releaseCandidate = async (remark) => {
    const candidate = remarkModal.candidate;
    const candidateId = candidate.candidateId || candidate.batchCandidateId;
    
    if (!candidateId) {
      setError("Cannot release candidate: Invalid candidate ID");
      setRemarkModal({ isOpen: false, candidate: null });
      return;
    }

    setReleasingCandidates(prev => new Set([...prev, candidateId]));
    setError(null);
    setSuccessMessage(null);

    try {
      const { user, token } = getUserData();
      const requestData = {
        batchId: batchId,
        candidateId: candidateId,
        remark: remark, // Include the remark in the request
        user: user,
        token: token
      };
      
      const response = await axios.post(RELEASE_CANDIDATE_URL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data && response.data.response === "success") {
        // Update the candidate status in the local state
        setCandidates(prevCandidates =>
          prevCandidates.map(c =>
            (c.candidateId || c.batchCandidateId) === candidateId
              ? { ...c, candidateStatus: 'RELEASED', remark: remark }
              : c
          )
        );
        setSuccessMessage(`${candidate.name || 'Candidate'} has been released successfully`);
        setRemarkModal({ isOpen: false, candidate: null });
      } else {
        throw new Error(response.data?.message || "Failed to release candidate");
      }
    } catch (err) {
      console.error("Error releasing candidate:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "An error occurred while releasing the candidate"
      );
    } finally {
      setReleasingCandidates(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
    }
  };

  const closeRemarkModal = () => {
    setRemarkModal({ isOpen: false, candidate: null });
  };

  useEffect(() => {
    if (isOpen && batchId) {
      fetchCandidates();
    }
  }, [isOpen, batchId]);

  const handleClose = () => {
    setCandidates([]);
    setError(null);
    setSuccessMessage(null);
    setReleasingCandidates(new Set());
    setRemarkModal({ isOpen: false, candidate: null });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
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
            </div>

            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}

            {loading && (
              <div className={styles.loadingContainer}>
                <FontAwesomeIcon icon={faSpinner} spin />
                <p>Loading candidates...</p>
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            {error && (
              <div className={styles.errorContainer}>
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
                        <th>Batch Candidate Id</th>
                        <th>Email</th>
                        <th>Employee ID</th>
                        <th>Employee Type</th>
                        <th>Status</th>
                        <th>Remark</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((candidate, index) => {
                        const candidateId = candidate.candidateId || candidate.batchCandidateId;
                        const isReleasing = releasingCandidates.has(candidateId);
                        const canRelease = candidate.candidateStatus === 'IN_BATCH';
                        return (
                          <tr key={candidateId || index}>
                            <td className={styles.serialNumber}>{index + 1}</td>
                            <td className={styles.candidateName}>
                              {candidate.name || `Candidate ${index + 1}`}
                            </td>
                            <td className={styles.batchCandidateId}>
                              {candidate.batchCandidateId || 'N/A'}
                            </td>
                            <td className={styles.candidateEmail}>
                              {candidate.emailId || 'N/A'}
                            </td>
                            <td className={styles.candidateId}>
                              {candidate.employeeId || 'N/A'}
                            </td>
                            <td className={styles.employeeType}>
                              {candidate.employeeType || 'N/A'}
                            </td>
                            <td className={styles.candidateStatus}>
                              <span className={`${styles.statusBadge} ${
                                candidate.candidateStatus === 'IN_BATCH' ? styles.inBatch : 
                                candidate.candidateStatus === 'RELEASED' ? styles.released : 
                                styles[candidate.candidateStatus?.toLowerCase()]
                              }`}>
                                {candidate.candidateStatus || 'N/A'}
                              </span>
                            </td>
                            <td className={styles.remark}>
                              {candidate.remark || 'N/A'}
                            </td>
                            <td className={styles.actions}>
                              {canRelease && (
                                <button
                                  className={styles.releaseButton}
                                  onClick={() => handleReleaseClick(candidate)}
                                  disabled={isReleasing}
                                  title="Release Candidate"
                                >
                                  {isReleasing ? (
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                  ) : (
                                    <FontAwesomeIcon icon={faUserMinus} />
                                  )}
                                  {isReleasing ? 'Releasing...' : 'Release'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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

      {/* Remark Modal */}
      <RemarkModal
        isOpen={remarkModal.isOpen}
        onClose={closeRemarkModal}
        onSubmit={releaseCandidate}
        candidateName={remarkModal.candidate?.name || 'Unknown'}
        loading={releasingCandidates.has(
          remarkModal.candidate?.candidateId || remarkModal.candidate?.batchCandidateId
        )}
      />
    </>
  );
};

export default ViewCandidatesModal;
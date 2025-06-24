import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './TrpGeneratorBatch.module.css';
import Sidebar from './Sidebar';
import { FIND_BATCH_URL, GENERATE_BATCH_TRP_URL } from '../../constants/apiConstants';

const TrpGeneratorBatch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState("results");
  
  const [batchList, setBatchList] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [filteredBatches, setFilteredBatches] = useState([]);

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

  // Filter batches based on search term
  useEffect(() => {
    if (!batchSearchTerm) {
      setFilteredBatches(batchList);
    } else {
      const filtered = batchList.filter(batch =>
        batch.batchName.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
        batch.batchId.toString().includes(batchSearchTerm)
      );
      setFilteredBatches(filtered);
    }
  }, [batchList, batchSearchTerm]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setBatchSearchTerm(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setBatchSearchTerm('');
  };

  // Fetch available batches
  const fetchBatch = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { user, token } = getUserData();
      const officeId = user?.officeId;
      
      const response = await axios.post(FIND_BATCH_URL, {
        user: user,
        token: token,
        officeId: officeId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.response === 'success') {
        setBatchList(response.data.payload || []);
      } else {
        setError(response.data.message || 'Failed to fetch batches');
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.response?.data?.message || 'Error fetching batches: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate TRP report
  const generateTrpReport = async () => {
    if (!selectedBatchId) {
      setError('Please select a batch first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { user, token } = getUserData();
      const officeId = user?.officeId;

      const response = await axios.post(GENERATE_BATCH_TRP_URL, {
        user: user,
        token: token,
        officeId: officeId,
        batchId: selectedBatchId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
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
        : `TRP_Report_Batch_${selectedBatchId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Reset selection after successful generation
      setSelectedBatchId(null);
      setBatchSearchTerm('');
      
    } catch (err) {
      console.error('Error generating TPR report:', err);
      setError(err.response?.data?.message || 'Error generating report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle batch selection
  const handleBatchSelection = (batchId) => {
    setSelectedBatchId(selectedBatchId === batchId ? null : batchId);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get batch status display and CSS class
  const getBatchStatusDisplay = (status) => {
    if (!status) return 'Unknown';
    return status.toString().replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getBatchStatusClass = (status) => {
    if (!status) return '';
    const statusLower = status.toString().toLowerCase();
    if (statusLower.includes('approved')) return 'approved';
    if (statusLower.includes('pending')) return 'pending';
    if (statusLower.includes('rejected')) return 'rejected';
    return '';
  };

  // Get selected batch info
  const getSelectedBatch = () => {
    return batchList.find(batch => batch.batchId === selectedBatchId);
  };

  // Initialize batches on component mount
  useEffect(() => {
    fetchBatch();
  }, []);

  return (
    <div className={styles.container}>
      <Sidebar activeTab={activeTab} />
      
      <div className={styles.header}>
        <h1 className={styles.title}>TPR Report Generator - Batch Mode</h1>
        <p className={styles.subtitle}>Generate TPR reports for selected batches</p>
      </div>

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>Select Batch</h2>
        <p className={styles.stepDescription}>
          Choose a batch to generate the TPR report for all candidates in that batch.
        </p>
        
        {/* Search Section */}
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search batches by name or ID..."
              value={batchSearchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            {batchSearchTerm && (
              <button 
                onClick={clearSearch}
                className={styles.clearSearchButton}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Search Results Info */}
          <div className={styles.searchInfo}>
            <span>
              Showing {filteredBatches.length} of {batchList.length} batches
              {batchSearchTerm && ` for "${batchSearchTerm}"`}
            </span>
          </div>
        </div>

        {/* Selected Batch Info */}
        {selectedBatchId && (
          <div className={styles.selectedInfo}>
            <p>
              Selected: <strong>{getSelectedBatch()?.batchName}</strong> (ID: {selectedBatchId})
            </p>
          </div>
        )}

        {/* Batch Grid */}
        <div className={styles.batchGrid}>
          {filteredBatches.length > 0 ? (
            filteredBatches.map((batch) => (
              <div
                key={batch.batchId}
                className={`${styles.batchCard} ${
                  selectedBatchId === batch.batchId ? styles.selected : ''
                }`}
                onClick={() => handleBatchSelection(batch.batchId)}
              >
                <div className={styles.checkbox}>
                  {selectedBatchId === batch.batchId && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </div>
                <div className={styles.batchInfo}>
                  <h3 className={styles.batchName}>{batch.batchName}</h3>
                  <p className={styles.batchId}>Batch ID: {batch.batchId}</p>
                  <p className={styles.batchDate}>Created: {formatDate(batch.createDate)}</p>
                  <p className={styles.batchStatus}>
                    Status: <span className={`${styles.statusBadge} ${styles[getBatchStatusClass(batch.batchStatus)]}`}>
                      {getBatchStatusDisplay(batch.batchStatus)}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : batchSearchTerm ? (
            <div className={styles.noResults}>
              <p>No batches found matching "{batchSearchTerm}"</p>
              <button onClick={clearSearch} className={styles.clearSearchLink}>
                Clear search to see all batches
              </button>
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>No batches available.</p>
              <button onClick={fetchBatch} className={styles.refreshButton}>
                Refresh Batches
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonGroup}>
          <button 
            className={styles.secondaryButton}
            onClick={fetchBatch}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Batches'}
          </button>
          <button 
            className={styles.primaryButton}
            onClick={generateTrpReport}
            disabled={loading || !selectedBatchId}
          >
            {loading ? 'Generating Report...' : 'Generate TPR Report'}
          </button>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Processing your request...</p>
        </div>
      )}
    </div>
  );
};

export default TrpGeneratorBatch;
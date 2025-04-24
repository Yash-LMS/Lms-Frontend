import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './InternManagement.module.css';
import { FIND_INTERN_LIST_URL, UPDATE_INTERN_STATUS_URL } from '../../constants/apiConstants';
import Sidebar from './Sidebar'; 

const InternManagement = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [activeTab, setActiveTab] = useState("intern");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Status options - matching the employee management page
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'not_active', label: 'Not Active' },
    { value: 'blocked', label: 'Blocked' },
  ];
  
  // Get user information using the provided function
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

  useEffect(() => {
    fetchInterns();
  }, [selectedStatus]);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const { user, token } = getUserData();
      
      const response = await axios.post(FIND_INTERN_LIST_URL, {
        user,
        token,
        status: selectedStatus
      });

      if (response.data && response.data.response === "success") {
        setInterns(response.data.payload || []);
        setError(null); // Clear any existing errors on successful fetch
      } else {
        // Don't set error here, just set empty interns array
        setInterns([]);
      }
    } catch (error) {
      // Don't set error message here, just set empty interns array
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle status change with modal
  const handleStatusChangeInitiate = (intern, newStatus) => {
    // If current status is the same as new status, do nothing
    if (intern.status.toLowerCase() === newStatus.toLowerCase()) {
      return;
    }
    
    setSelectedIntern(intern);
    setSelectedNewStatus(newStatus);
    setRemark('');
    setShowRemarkModal(true);
  };

  // Submit status change with remark
  const handleSubmitStatusChange = async () => {
    if (!selectedIntern || !selectedNewStatus) return;
    
    try {
      const { user, token } = getUserData();
      
      const response = await axios.post(UPDATE_INTERN_STATUS_URL, {
        user,
        token,
        emailId: selectedIntern.emailId,
        remark: remark || `Status updated from ${selectedIntern.status} to ${selectedNewStatus}`,
        status: selectedNewStatus
      });

      if (response.data && response.data.response === "success") {
        // Update local state to reflect the change
        setInterns(interns.map(intern => 
          intern.emailId === selectedIntern.emailId 
            ? { ...intern, status: selectedNewStatus } 
            : intern
        ));
        setShowRemarkModal(false);
        // Reset selected data
        setSelectedIntern(null);
        setSelectedNewStatus('');
        setRemark('');
      } else {
        // We don't want to show an error, just keep the current state
      }
    } catch (error) {
      // We don't want to show an error, just keep the current state
    }
  };

  // Format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Search functionality
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const filteredInterns = searchTerm.trim() === '' 
    ? interns 
    : interns.filter(intern => 
        intern.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.internshipProgram.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleFilterChange = (e) => {
    setSelectedStatus(e.target.value);
    setError(null); // Clear any previous errors when changing filters
  };

  // Determine the appropriate message to display when no interns are found
  const getNoDataMessage = () => {
    if (searchTerm) {
      return "No results found. Try a different search term.";
    } else if (selectedStatus !== 'all') {
      return `No interns found with status "${statusOptions.find(option => option.value === selectedStatus)?.label || selectedStatus}". Try a different filter.`;
    } else {
      return "No interns found.";
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar activeTab={activeTab} />
      
      <div className={styles.card}>
        <div className={styles.pageHeader}>
          <h1>Intern Management</h1>
          <div className={styles.searchField}>
            <input 
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search interns..."
              className={styles.searchInput}
            />
            {searchTerm && (
              <button className={styles.clearSearchButton} onClick={clearSearch}>
                ✕
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <select 
              value={selectedStatus} 
              onChange={handleFilterChange}
              className={styles.select}
            >
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
    
        
        {searchTerm && (
          <div className={styles.searchResultCount}>
            Found <span>{filteredInterns.length}</span> results for "{searchTerm}"
          </div>
        )}
        
        <div className={styles.cardContent}>
          {loading ? (
            <div className={styles.loading}>Loading interns...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Institution</th>
                    <th>Program</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterns.length > 0 ? (
                    filteredInterns.map((intern) => (
                      <tr key={intern.emailId}>
                        <td>{`${intern.firstName} ${intern.lastName}`}</td>
                        <td>{intern.emailId}</td>
                        <td>{intern.institution}</td>
                        <td>{intern.internshipProgram}</td>
                        <td>{formatDate(intern.startDate)}</td>
                        <td>{formatDate(intern.endDate)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${
                            intern.status === 'active' ? styles.statusActive : 
                            intern.status === 'blocked' ? styles.statusBlocked : 
                            styles.statusNotActive
                          }`}>
                            {intern.status === 'not_active' ? 'Not Active' : 
                             intern.status.charAt(0).toUpperCase() + intern.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td>
                          <select
                            className={styles.tableSelect}
                            value={intern.status}
                            onChange={(e) => handleStatusChangeInitiate(intern, e.target.value)}
                          >
                            {statusOptions.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className={styles.noData}>
                        {getNoDataMessage()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Remark Modal */}
      {showRemarkModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              Status Change: {selectedIntern?.status} → {selectedNewStatus}
            </h2>
            <p className={styles.modalDescription}>
              Please provide a remark for changing the status of {selectedIntern?.firstName} {selectedIntern?.lastName}.
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="remark">Remark:</label>
              <textarea
                id="remark"
                className={styles.remarkTextarea}
                placeholder="Enter your remark here..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
              />
            </div>
            <div className={styles.modalButtons}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowRemarkModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.submitButton}
                onClick={handleSubmitStatusChange}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternManagement;
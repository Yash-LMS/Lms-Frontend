import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './InternManagement.module.css';
import { FIND_INTERN_LIST_URL, UPDATE_INTERN_STATUS_URL, UPDATE_COMPLETION_STATUS_URL } from '../../constants/apiConstants';
import Sidebar from './Sidebar';
import InternBulkRegistration from './InternBulkRegistration';

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
  const [showBulkRegistrationModal, setShowBulkRegistrationModal] = useState(false);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'not_active', label: 'Not Active' },
    { value: 'blocked', label: 'Blocked' },
  ];

  const completionStatusOptions = [
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'released', label: 'Released' },
    { value: 'convertedToTrainee', label: 'Converted to Trainee' },
  ];

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
        setError(null);
      } else {
        setInterns([]);
      }
    } catch (error) {
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChangeInitiate = (intern, newStatus) => {
    if (intern.status.toLowerCase() === newStatus.toLowerCase()) return;

    if (newStatus === 'active') {
      setSelectedIntern(intern);
      setSelectedNewStatus(newStatus);
      setRemark('');
      setShowRemarkModal(true);
    } else {
      updateInternStatus(intern, newStatus);
    }
  };

  const updateInternStatus = async (intern, newStatus) => {
    try {
      const { user, token } = getUserData();

      const response = await axios.post(UPDATE_INTERN_STATUS_URL, {
        user,
        token,
        emailId: intern.emailId,
        remark: `Status updated from ${intern.status} to ${newStatus}`,
        status: newStatus
      });

      if (response.data && response.data.response === "success") {
        setInterns(interns.map(i =>
          i.emailId === intern.emailId
            ? { ...i, status: newStatus }
            : i
        ));
      }
    } catch (error) {
      console.error("Error updating intern status", error);
    }
  };

  const handleCompletionStatusChange = async (intern, newCompletionStatus) => {
    try {
      const { user, token } = getUserData();

      const response = await axios.post(UPDATE_COMPLETION_STATUS_URL, {
        user,
        token,
        emailId: intern.emailId,
        completionStatus: newCompletionStatus
      });

      if (response.data && response.data.response === "success") {
        setInterns(interns.map(i =>
          i.emailId === intern.emailId
            ? { ...i, completionStatus: newCompletionStatus }
            : i
        ));
      }
    } catch (error) {
      console.error("Error updating internship completion status", error);
    }
  };

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
        setInterns(interns.map(intern =>
          intern.emailId === selectedIntern.emailId
            ? { ...intern, status: selectedNewStatus }
            : intern
        ));
        setShowRemarkModal(false);
        setSelectedIntern(null);
        setSelectedNewStatus('');
        setRemark('');
      }
    } catch (error) {
      console.error("Error updating status with remark", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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
    setError(null);
  };

  const getNoDataMessage = () => {
    if (searchTerm) {
      return "No results found. Try a different search term.";
    } else if (selectedStatus !== 'all') {
      return `No interns found with status "${statusOptions.find(option => option.value === selectedStatus)?.label || selectedStatus}". Try a different filter.`;
    } else {
      return "No interns found.";
    }
  };

  const handleBulkRegistrationSuccess = () => {
    fetchInterns();
  };

  // Function to get appropriate style class for completion status
  const getCompletionStatusClass = (status) => {
    switch(status) {
      case 'ongoing':
        return styles.completionOngoing;
      case 'released':
        return styles.completionReleased;
      case 'convertedToTrainee':
        return styles.completionConverted;
      default:
        return styles.completionOngoing;
    }
  };

  // Function to get display text for completion status
  const getCompletionStatusDisplay = (status) => {
    switch(status) {
      case 'ongoing':
        return 'Ongoing';
      case 'released':
        return 'Released';
      case 'convertedToTrainee':
        return 'Converted to Trainee';
      default:
        return 'Ongoing';
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar activeTab={activeTab} />

      <div className={styles.card}>
        <div className={styles.pageHeader}>
          <h1>Intern Management</h1>
          <div className={styles.headerActions}>
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
            <button
              className={styles.bulkRegisterButton}
              onClick={() => setShowBulkRegistrationModal(true)}
            >
              Bulk Register
            </button>
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
                    <th>Address</th>
                    <th>Institution</th>
                    <th>Stream</th>
                    <th>Year Of Passing</th>
                    <th>Program</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Duration (in months)</th>
                    <th>Account Status</th>
                    <th>Completion Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterns.length > 0 ? (
                    filteredInterns.map((intern) => (
                      <tr key={intern.emailId}>
                        <td>{`${intern.firstName} ${intern.lastName}`}</td>
                        <td>{intern.emailId}</td>
                        <td>{intern.address}</td>
                        <td>{intern.institution}</td>
                        <td>{intern.stream}</td>
                        <td>{intern.yearOfPassing}</td>
                        <td>{intern.internshipProgram}</td>
                        <td>{formatDate(intern.startDate)}</td>
                        <td>{formatDate(intern.endDate)}</td>
                        <td>{intern.duration}</td>
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
                          <div className={styles.completionStatusContainer}>
                            <span className={`${styles.statusBadge} ${getCompletionStatusClass(intern.completionStatus || 'ongoing')}`}>
                              {getCompletionStatusDisplay(intern.completionStatus || 'ongoing')}
                            </span>
                           
                          </div>
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

                          <select
                              className={styles.tableSelect}
                              value={intern.completionStatus || 'ongoing'}
                              onChange={(e) => handleCompletionStatusChange(intern, e.target.value)}
                            >
                              {completionStatusOptions.map(status => (
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
                      <td colSpan={13} className={styles.noData}>
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

      {showRemarkModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              Status Change: {selectedIntern?.status} → {selectedNewStatus}
            </h2>
            <p className={styles.modalDescription}>
              Please provide a remark for activating {selectedIntern?.firstName} {selectedIntern?.lastName}.
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

      {showBulkRegistrationModal && (
        <InternBulkRegistration
          onClose={() => setShowBulkRegistrationModal(false)}
          onUploadSuccess={handleBulkRegistrationSuccess}
        />
      )}
    </div>
  );
};

export default InternManagement;
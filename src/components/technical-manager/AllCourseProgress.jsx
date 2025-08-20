import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import styles from './AllCourseProgress.module.css';
import { ALL_USER_TRACKING_DETAIL_URL } from '../../constants/apiConstants'; 
import DetailedTrackingModal from './DetailedTrackingModal';
import EmployeeCTRModal from './EmployeeCTRModal';
import SuccessModal from '../../assets/SuccessModal';
import ExportToExcel from "../../assets/ExportToExcel";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

const AllCourseProgressTracker = () => {
  const [activeTab, setActiveTab] = useState("progress");
  const [studentsData, setStudentsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // CTR Modal states
  const [showEmployeeSelectionModal, setShowEmployeeSelectionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Updated date filter states
  const [dateFilterType, setDateFilterType] = useState('none'); // 'none', 'allotment', 'completion'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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
    fetchCourseTrackingData();
  }, []);

  const fetchCourseTrackingData = async () => {
    setIsLoading(true);
    try {
      const { user, token } = getUserData();
      if (!user || !token) {
        setError('Authentication information not found');
        setIsLoading(false);
        return;
      }
      const response = await axios.post(ALL_USER_TRACKING_DETAIL_URL, { user, token });
      if (response.data.response === 'success') {
        setStudentsData(response.data.payload || []);
      } else {
        setError(response.data.message || 'Failed to fetch data');
      }
    } catch (error) {
      setError('Error fetching course tracking data');
      console.error('Error fetching course tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'started', label: 'Started' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'completed', label: 'Completed' }
  ];

  const dateFilterOptions = [
    { value: 'none', label: 'No Date Filter' },
    { value: 'allotment', label: 'Filter by Allotment Date' },
    { value: 'completion', label: 'Filter by Completion Date' }
  ];

  const getProgressColor = (progress) => {
    if (progress < 25) return styles.redProgress;
    if (progress < 75) return styles.yellowProgress;
    return styles.greenProgress;
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // Handle CTR Modal functions
  const handleShowEmployeeSelectionModal = () => {
    setShowEmployeeSelectionModal(true);
  };

  const handleCloseEmployeeSelectionModal = () => {
    setShowEmployeeSelectionModal(false);
  };

  const handleDownloadSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
  };

  // Handle date filter type change
  const handleDateFilterTypeChange = (newType) => {
    setDateFilterType(newType);
    // Clear date inputs when changing filter type
    setDateFrom('');
    setDateTo('');
  };

  // Clear all filters function
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilterType('none');
    setDateFrom('');
    setDateTo('');
  };

  // Helper function to check if a date is within range
  const isDateInRange = (dateString, fromDate, toDate) => {
    if (!dateString) return !fromDate && !toDate; // If no date provided, only match if no filter is set
    
    const date = new Date(dateString);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    
    if (from && to) {
      return date >= from && date <= to;
    } else if (from) {
      return date >= from;
    } else if (to) {
      return date <= to;
    }
    return true;
  };

  const excelHeaders = {
    traineeName: "Trainee Name",
    emailId: "Email ID",
    courseName: "Course Name",
    instructorName: "Instructor Name",
    courseAllotmentDate: "Allotment Date",
    completionPercentage: "Completion %",
    courseCompletionStatus: "Completion Status",
    courseCompletionDate: "Completion Date",
    certificateStatus: "Certificate Status",
  };

  const filteredStudents = studentsData.filter(student => {
    if (!student) return false;

    const matchesSearch = searchTerm === '' || 
      (student.traineeName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.emailId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.courseName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.instructorName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.allotmentId?.toString().includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || student.courseCompletionStatus === statusFilter;

    // Apply date filter based on selected type
    let matchesDateFilter = true;
    if (dateFilterType === 'allotment') {
      matchesDateFilter = isDateInRange(student.allotmentDate, dateFrom, dateTo);
    } else if (dateFilterType === 'completion') {
      matchesDateFilter = isDateInRange(student.completionDate, dateFrom, dateTo);
    }
    // If dateFilterType is 'none', matchesDateFilter remains true

    return matchesSearch && matchesStatus && matchesDateFilter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={styles.container}>
      <Sidebar activeTab={activeTab} />
      <div className={styles.header}>
        <h1>Course Progress Tracker</h1>
        <div className={styles.filters}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by any parameter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className={styles.filterDropdown}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Updated Date Filters Section */}
      <div className={styles.dateFilters}>
        <div className={styles.dateFilterGroup}>
          <label className={styles.dateLabel}>Date Filter Type:</label>
          <select 
            className={styles.filterDropdown}
            value={dateFilterType}
            onChange={(e) => handleDateFilterTypeChange(e.target.value)}
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        {dateFilterType !== 'none' && (
          <div className={styles.dateFilterGroup}>
            <label className={styles.dateLabel}>
              {dateFilterType === 'allotment' ? 'Allotment Date Range:' : 'Completion Date Range:'}
            </label>
            <input
              type="date"
              className={styles.dateInput}
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className={styles.dateSeparator}>to</span>
            <input
              type="date"
              className={styles.dateInput}
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        )}
        
        <button 
          className={styles.clearFiltersButton}
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      <div className={styles.headerActions}>
        {/* CTR Report Download Button */}
        <button 
          className={styles.ctrDownloadButton}
          onClick={handleShowEmployeeSelectionModal}
          title="Download CTR Report for specific instructor"
        >
          <FontAwesomeIcon icon={faDownload} />
          <span style={{marginLeft:'8px'}}>Download CTR Report</span>
        </button>
        
        <ExportToExcel
          data={filteredStudents} 
          headers={excelHeaders}
          fileName="Course-Progress-Results"
          sheetName="Course Progress"
          buttonStyle={{ marginBottom: "20px" }}
        />
        <div className={styles.resultsCount}>
          Showing {filteredStudents.length} of {studentsData.length} records
          {dateFilterType !== 'none' && (
            <span className={styles.filterInfo}>
              {' '}(Filtered by {dateFilterType === 'allotment' ? 'Allotment' : 'Completion'} Date)
            </span>
          )}
        </div>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loadingState}>Loading course data...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : (
          <table className={styles.progressTable}>
            <thead>
              <tr>
                <th>Trainee Name</th>
                <th>Email</th>
                <th>Course Name</th>
                <th>Instructor Name</th>
                <th>Allotment Date</th>
                <th>Completion %</th>
                <th>Completion Status</th>
                <th>Completion Date</th>
                <th>Certificate Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentsData.length === 0 ? (
                <tr>
                  <td colSpan="10" className={styles.noResults}>No records available</td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.allotmentId || Math.random()}>
                    <td>{student.traineeName || 'N/A'}</td>
                    <td>{student.emailId || 'N/A'}</td>
                    <td>{student.courseName || 'N/A'}</td>
                    <td>{student.instructorName || 'N/A'}</td>
                    <td>{formatDate(student.allotmentDate)}</td>
                    <td>
                      <div className={styles.progressBarContainer}>
                        <div 
                          className={`${styles.progressBar} ${getProgressColor(student.completionPercentage || 0)}`} 
                          style={{ width: `${student.completionPercentage || 0}%` }}
                        ></div>
                        <span className={styles.progressText}>
                          {(student.completionPercentage || 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[student.courseCompletionStatus] || styles.notstarted}`}>
                        {(student.courseCompletionStatus || 'not_started').toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(student.completionDate)}</td>
                    <td>
                      {(student.certificateStatus ? student.certificateStatus.replace(/_/g, ' ') : 'Not Available').toUpperCase()}
                    </td>
                    <td>
                      <button 
                        className={styles.viewButton}
                        onClick={() => handleViewDetails(student)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className={styles.noResults}>No results match your search criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Employee Selection Modal for CTR Download */}
      <EmployeeCTRModal
        isOpen={showEmployeeSelectionModal}
        onClose={handleCloseEmployeeSelectionModal}
        onDownloadSuccess={handleDownloadSuccess}
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal 
          message={successMessage} 
          onClose={handleCloseSuccessModal} 
        />
      )}

      {/* Detailed Tracking Modal */}
      {isModalOpen && selectedStudent && (
        <DetailedTrackingModal
          student={selectedStudent} 
          allotmentId={selectedStudent.allotmentId} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default AllCourseProgressTracker;
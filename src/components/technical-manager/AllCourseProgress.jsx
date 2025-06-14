import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import styles from './AllCourseProgress.module.css';
import { ALL_USER_TRACKING_DETAIL_URL } from '../../constants/apiConstants'; 
import DetailedTrackingModal from './DetailedTrackingModal';
import ExportToExcel from "../../assets/ExportToExcel";

const AllCourseProgressTracker = () => {
  const [activeTab, setActiveTab] = useState("progress");
  const [studentsData, setStudentsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New date filter states
  const [allotmentDateFrom, setAllotmentDateFrom] = useState('');
  const [allotmentDateTo, setAllotmentDateTo] = useState('');
  const [completionDateFrom, setCompletionDateFrom] = useState('');
  const [completionDateTo, setCompletionDateTo] = useState('');

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

  // Clear all filters function
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAllotmentDateFrom('');
    setAllotmentDateTo('');
    setCompletionDateFrom('');
    setCompletionDateTo('');
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

    const matchesAllotmentDate = isDateInRange(
      student.allotmentDate, 
      allotmentDateFrom, 
      allotmentDateTo
    );

    const matchesCompletionDate = isDateInRange(
      student.completionDate, 
      completionDateFrom, 
      completionDateTo
    );

    return matchesSearch && matchesStatus && matchesAllotmentDate && matchesCompletionDate;
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

      
        {/* New Date Filters Section */}
        <div className={styles.dateFilters}>
          <div className={styles.dateFilterGroup}>
            <label className={styles.dateLabel}>Allotment Date:</label>
            <input
              type="date"
              className={styles.dateInput}
              placeholder="From"
              value={allotmentDateFrom}
              onChange={(e) => setAllotmentDateFrom(e.target.value)}
            />
            <span className={styles.dateSeparator}>to</span>
            <input
              type="date"
              className={styles.dateInput}
              placeholder="To"
              value={allotmentDateTo}
              onChange={(e) => setAllotmentDateTo(e.target.value)}
            />
          </div>
          
          <div className={styles.dateFilterGroup}>
            <label className={styles.dateLabel}>Completion Date:</label>
            <input
              type="date"
              className={styles.dateInput}
              placeholder="From"
              value={completionDateFrom}
              onChange={(e) => setCompletionDateFrom(e.target.value)}
            />
            <span className={styles.dateSeparator}>to</span>
            <input
              type="date"
              className={styles.dateInput}
              placeholder="To"
              value={completionDateTo}
              onChange={(e) => setCompletionDateTo(e.target.value)}
            />
          </div>
          
          <button 
            className={styles.clearFiltersButton}
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

      <div className={styles.headerActions}>
        <ExportToExcel
          data={filteredStudents} 
          headers={excelHeaders}
          fileName="Course-Progress-Results"
          sheetName="Course Progress"
          buttonStyle={{ marginBottom: "20px" }}
        />
        <div className={styles.resultsCount}>
          Showing {filteredStudents.length} of {studentsData.length} records
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
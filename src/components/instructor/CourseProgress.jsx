import React, { useState } from 'react';
import styles from './CourseProgress.module.css';

const CourseProgressTracker = () => {
  // Static data - will be replaced with Redux state later
  const [activeTab, setActiveTab] = useState('progress');
  const studentsData = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@example.com",
      assignedDate: "2025-03-15",
      courseName: "Advanced JavaScript",
      progress: 75,
      status: "In Progress",
      lastActivity: "2025-04-01"
    },
    {
      id: 2,
      name: "Emma Johnson",
      email: "emma.j@example.com",
      assignedDate: "2025-03-10",
      courseName: "React Fundamentals",
      progress: 100,
      status: "Completed",
      lastActivity: "2025-03-28"
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "m.chen@example.com",
      assignedDate: "2025-03-20",
      courseName: "UI/UX Design Principles",
      progress: 30,
      status: "In Progress",
      lastActivity: "2025-03-31"
    },
    {
      id: 4,
      name: "Sarah Williams",
      email: "s.williams@example.com",
      assignedDate: "2025-03-05",
      courseName: "Data Structures",
      progress: 0,
      status: "Not Started",
      lastActivity: "N/A"
    }
  ];

  // State for filters
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get unique course names for the dropdown
  const courseNames = [...new Set(studentsData.map(student => student.courseName))];
  
  // Get unique statuses for the dropdown
  const statuses = [...new Set(studentsData.map(student => student.status))];

  // Function to determine progress bar color based on completion percentage
  const getProgressColor = (progress) => {
    if (progress < 25) return styles.redProgress;
    if (progress < 75) return styles.yellowProgress;
    return styles.greenProgress;
  };

  // Filter students based on selected filters
  const filteredStudents = studentsData.filter(student => {
    const matchesCourse = courseFilter === 'all' || student.courseName === courseFilter;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesCourse && matchesStatus;
  });

  return (
    <div className={styles.container}>
        {/* Sidebar Navigation */}
              <aside className={styles.dashboardSidebar}>
                <nav className={styles.sidebarNav}>
                  <ul>
                    <li className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}>
                      <a href="#dashboard" onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('dashboard');
                        navigate("/instructor-dashboard")
                      }}>
                        <i className="fas fa-tachometer-alt"></i>
                        Courses
                      </a>
                    </li>
                    <li className={`${styles.navItem} ${activeTab === 'tests' ? styles.active : ''}`}>
                      <a href="#tests" onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('tests');
                        navigate("/instructor/view/test")
                      }}>
                        <i className="fas fa-users"></i>
                        Tests
                      </a>
                    </li>
                    <li className={`${styles.navItem} ${activeTab === 'progress' ? styles.active : ''}`}>
                      <a href="#progress" onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('tests');
                        navigate("/course/progress")
                      }}>
                        <i className="fas fa-users"></i>
                        Course Progress
                      </a>
                    </li>
                  </ul>
                </nav>
              </aside>
      <div className={styles.header}>
        <h1>Course Progress Tracker</h1>
        <div className={styles.filters}>
          <select 
            className={styles.filterDropdown}
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courseNames.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          <select 
            className={styles.filterDropdown}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.progressTable}>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Email</th>
              <th>Course Name</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.courseName}</td>
                  <td>
                    <div className={styles.progressBarContainer}>
                      <div 
                        className={`${styles.progressBar} ${getProgressColor(student.progress)}`} 
                        style={{ width: `${student.progress}%` }}
                      ></div>
                      <span className={styles.progressText}>{student.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[student.status.toLowerCase().replace(/\s+/g, '')]}`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className={styles.noResults}>No results match your filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseProgressTracker;
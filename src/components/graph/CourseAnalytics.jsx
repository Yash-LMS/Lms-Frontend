import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './CourseAnalytics.module.css';
import Sidebar from '../technical-manager/Sidebar';
import InstructorSidebar from '../instructor/InstructorSidebar';
import { COURSE_ANALYSIS_URL } from '../../constants/apiConstants';

const CourseAnalytics = () => {
  const [courseData, setCourseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('pie');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [role, setRole] = useState();
  const [activeTab, setActiveTab] = useState("analysis");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    users: [],
    status: ''
  });

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

  useEffect(() => {
    const { user, token, role } = getUserData();
    
    // Only set role and fetch batches if user data exists
    if (user && role) {
      setRole(role);
    }
  }, []);

  const fetchCourseAnalytics = async () => {
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(COURSE_ANALYSIS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user,
          token: token
        })
      });

      // Check if the response is ok first
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the response as JSON
      const data = await response.json();

      if (data.response === 'success') {
        setCourseData(data.payload || []);
      } else {
        setError(data.message || 'Failed to fetch course analytics');
      }
    } catch (err) {
      setError('Error fetching course analytics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAnalytics();
  }, []);

  // Function to open modal with status details
  const openStatusModal = (course, status) => {
    let users = [];
    let title = '';
    
    switch(status) {
      case 'pending':
        users = course.pendingList || [];
        title = `Pending Users - ${course.courseName}`;
        break;
      case 'started':
        users = course.startedList || [];
        title = `Started Users - ${course.courseName}`;
        break;
      case 'completed':
        users = course.completedList || [];
        title = `Completed Users - ${course.courseName}`;
        break;
      default:
        users = [];
        title = '';
    }
    
    setModalData({
      title,
      users,
      status
    });
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalData({
      title: '',
      users: [],
      status: ''
    });
  };

  const prepareChartData = (course) => {
    return [
      { name: 'Pending', value: course.pendingCount, color: '#ff4444', list: course.pendingList },
      { name: 'Started', value: course.startedCount, color: '#ffaa00', list: course.startedList },
      { name: 'Completed', value: course.completedCount, color: '#22c55e', list: course.completedList }
    ];
  };

  // Calculate Y-axis domain and scale dynamically
  const getYAxisConfig = (course) => {
    const maxValue = Math.max(course.pendingCount, course.startedCount, course.completedCount);
    let scale, maxDomain;
    
    if (maxValue < 10) {
      scale = 1;
      maxDomain = 10;
    } else if (maxValue >= 10 && maxValue < 50) {
      scale = 5;
      maxDomain = Math.ceil(maxValue / 5) * 5;
    } else {
      scale = 10;
      maxDomain = Math.ceil(maxValue / 10) * 10;
    }
    
    const ticks = [];
    for (let i = 0; i <= maxDomain; i += scale) {
      ticks.push(i);
    }
    
    return {
      domain: [0, maxDomain],
      ticks: ticks,
      scale: scale
    };
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`${data.name}: ${data.value} employees`}</p>
          {data.list && data.list.length > 0 && (
            <div className={styles.tooltipList}>
              <p className={styles.tooltipListTitle}>Users:</p>
              <ul>
                {data.list.slice(0, 5).map((user, index) => (
                  <li key={index}>{user}</li>
                ))}
                {data.list.length > 5 && <li>...and {data.list.length - 5} more</li>}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderPieChart = (course) => {
    const data = prepareChartData(course);
    
    return (
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="40%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Color Legend/Scale */}
        <div className={styles.pieChartLegend}>
          {data.map((item, index) => (
            <div key={index} className={styles.legendItem}>
              <div 
                className={styles.legendColor} 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className={styles.legendText}>
                {item.name}: {item.value} ({((item.value / (course.pendingCount + course.startedCount + course.completedCount)) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = (course) => {
    const data = prepareChartData(course);
    const yAxisConfig = getYAxisConfig(course);
    
    return (
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              domain={yAxisConfig.domain}
              ticks={yAxisConfig.ticks}
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Employee Count', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Scale Information */}
        <div className={styles.scaleInfo}>
          Scale: {yAxisConfig.scale}
        </div>
      </div>
    );
  };

  // Modal Component
  const StatusModal = () => {
    if (!isModalOpen) return null;

    return (
      <div className={styles.modalOverlay} onClick={closeModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{modalData.title}</h3>
            <button className={styles.modalCloseBtn} onClick={closeModal}>
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            {modalData.users.length > 0 ? (
              <div className={styles.usersList}>
                <div className={styles.usersCount}>
                  Total: {modalData.users.length} user{modalData.users.length !== 1 ? 's' : ''}
                </div>
                <div className={styles.usersGrid}>
                  {modalData.users.map((user, index) => (
                    <div key={index} className={`${styles.userCard} ${styles[`userCard${modalData.status.charAt(0).toUpperCase() + modalData.status.slice(1)}`]}`}>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.noUsers}>
                No users found for this status.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Loading course analytics...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!courseData || courseData.length === 0) {
    return <div className={styles.noData}>No course data available</div>;
  }

  return (
    <div className={styles.container}>
      {role === "technical_manager" ? (
        <Sidebar activeTab={activeTab} />
      ) : role === "instructor" ? (
        <InstructorSidebar activeTab={activeTab} />
      ) : null}

      <div className={styles.header}>
        <h1>Course Analytics Dashboard</h1>
        <div className={styles.chartToggle}>
          <button
            className={`${styles.toggleBtn} ${chartType === 'pie' ? styles.active : ''}`}
            onClick={() => setChartType('pie')}
          >
            Pie Chart
          </button>
          <button
            className={`${styles.toggleBtn} ${chartType === 'bar' ? styles.active : ''}`}
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </button>
        </div>
      </div>

      <div className={styles.coursesGrid}>
        {courseData.map((course) => (
          <div key={course.courseId} className={styles.courseCard}>
            <div className={styles.courseHeader}>
              <h3>{course.courseName}</h3>
              <div className={styles.totalAllotments}>
                Total Allotments: {course.totalAllotments}
              </div>
            </div>
            
            <div className={styles.chartContainer}>
              {chartType === 'pie' ? renderPieChart(course) : renderBarChart(course)}
            </div>

            <div className={styles.statsContainer}>
              <div 
                className={`${styles.statItem} ${styles.clickableStatItem}`}
                onClick={() => openStatusModal(course, 'pending')}
              >
                <span className={styles.statLabel}>Pending:</span>
                <span className={`${styles.statValue} ${styles.statValuePending}`}>
                  {course.pendingCount}
                </span>
              </div>
              <div 
                className={`${styles.statItem} ${styles.clickableStatItem}`}
                onClick={() => openStatusModal(course, 'started')}
              >
                <span className={styles.statLabel}>Started:</span>
                <span className={`${styles.statValue} ${styles.statValueStarted}`}>
                  {course.startedCount}
                </span>
              </div>
              <div 
                className={`${styles.statItem} ${styles.clickableStatItem}`}
                onClick={() => openStatusModal(course, 'completed')}
              >
                <span className={styles.statLabel}>Completed:</span>
                <span className={`${styles.statValue} ${styles.statValueCompleted}`}>
                  {course.completedCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Modal */}
      <StatusModal />
    </div>
  );
};

export default CourseAnalytics;
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import styles from './TestAnalytics.module.css';
import Sidebar from '../technical-manager/Sidebar';
import InstructorSidebar from '../instructor/InstructorSidebar';
import ExportToExcel from '../../assets/ExportToExcel';
import { TEST_ANALYSIS_URL } from '../../constants/apiConstants';

const TestAnalytics = () => {
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('pie');
  const [selectedTest, setSelectedTest] = useState(null);
  const [role, setRole] = useState();
  const [activeTab, setActiveTab] = useState("testInsight");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    users: [],
    status: ''
  });
  const [currentTest, setCurrentTest] = useState(null);

  // Score Analysis Modal state
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreAnalysisData, setScoreAnalysisData] = useState(null);

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

  const fetchTestAnalytics = async () => {
    try {
      const { user, token } = getUserData();
      
      if (!user || !token) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const response = await axios.post(TEST_ANALYSIS_URL, {
        user: user,
        token: token
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.response === 'success') {
        setTestData(response.data.payload || []);
      } else {
        setError(response.data.message || 'Failed to fetch test analytics');
      }
    } catch (err) {
      setError('Error fetching test analytics: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestAnalytics();
  }, []);

  // Function to open modal with status details
  const openStatusModal = (test, status) => {
    let users = [];
    let title = '';
    
    switch(status) {
      case 'pending':
        users = test.pendingList || [];
        title = `Pending Users - ${test.testName}`;
        break;
      case 'started':
        users = test.startedList || [];
        title = `Started Users - ${test.testName}`;
        break;
      case 'expired':
        users = test.expiredList || [];
        title = `Expired Users - ${test.testName}`;
        break;
      case 'completed':
        users = test.completedList || [];
        title = `Completed Users - ${test.testName}`;
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
    setCurrentTest(test);
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTest(null);
    setModalData({
      title: '',
      users: [],
      status: ''
    });
  };

  // Function to open score analysis modal
  const openScoreAnalysisModal = (test) => {
    const completedUsers = test.completedList || [];
    
    if (completedUsers.length === 0) {
      alert('No completed users found for score analysis');
      return;
    }

    // Prepare score analysis data with 50% as separate range
    const scoreRanges = [
      { range: '0-10%', min: 0, max: 10, count: 0, users: [] },
      { range: '11-20%', min: 11, max: 20, count: 0, users: [] },
      { range: '21-30%', min: 21, max: 30, count: 0, users: [] },
      { range: '31-40%', min: 31, max: 40, count: 0, users: [] },
      { range: '41-49%', min: 41, max: 49, count: 0, users: [] },
      { range: '50%', min: 50, max: 50, count: 0, users: [] },
      { range: '51-60%', min: 51, max: 60, count: 0, users: [] },
      { range: '61-70%', min: 61, max: 70, count: 0, users: [] },
      { range: '71-80%', min: 71, max: 80, count: 0, users: [] },
      { range: '81-90%', min: 81, max: 90, count: 0, users: [] },
      { range: '91-100%', min: 91, max: 100, count: 0, users: [] }
    ];

    completedUsers.forEach(user => {
      const percentage = Number(user.percentage) || 0;
      
      scoreRanges.forEach(range => {
        if (percentage >= range.min && percentage <= range.max) {
          range.count += 1;
          range.users.push(user);
        }
      });
    });

    // Calculate statistics
    const totalUsers = completedUsers.length;
    const averageScore = completedUsers.reduce((sum, user) => sum + (Number(user.percentage) || 0), 0) / totalUsers;
    const highestScore = Math.max(...completedUsers.map(user => Number(user.percentage) || 0));
    const lowestScore = Math.min(...completedUsers.map(user => Number(user.percentage) || 0));
    
    // Count passing students (assuming 50% is passing)
    const passingStudents = completedUsers.filter(user => (Number(user.percentage) || 0) >= 50).length;
    const failingStudents = totalUsers - passingStudents;

    setScoreAnalysisData({
      test,
      scoreRanges: scoreRanges.filter(range => range.count > 0), // Only show ranges with data
      allRanges: scoreRanges, // Keep all ranges for chart
      statistics: {
        totalUsers,
        averageScore: averageScore.toFixed(2),
        highestScore,
        lowestScore,
        passingStudents,
        failingStudents,
        passPercentage: ((passingStudents / totalUsers) * 100).toFixed(1)
      }
    });
    
    setIsScoreModalOpen(true);
  };

  // Function to close score analysis modal
  const closeScoreModal = () => {
    setIsScoreModalOpen(false);
    setScoreAnalysisData(null);
  };

  // Helper function to safely format percentage
  const formatPercentage = (percentage) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return 'N/A';
    }
    const numericPercentage = Number(percentage);
    if (isNaN(numericPercentage)) {
      return 'N/A';
    }
    return `${numericPercentage.toFixed(1)}%`;
  };

  // Helper function to safely get numeric value
  const getNumericValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    const numericValue = Number(value);
    return isNaN(numericValue) ? 'N/A' : numericValue;
  };

  // Prepare data for Excel export
  const prepareExcelData = (users, testName, status) => {
    return users.map((user, index) => ({
      'S.No': index + 1,
      'Employee ID': user.employeeId || 'N/A',
      'Name': user.name || 'N/A',
      'Email ID': user.emailId || 'N/A',
      'Mobile No': user.mobileNo || 'N/A',
      'Employee Type': user.employeeType || 'N/A',
      'Completion Status': user.completionStatus || status.toUpperCase(),
      'Score': getNumericValue(user.score),
      'Total Marks': getNumericValue(user.totalMarks),
      'Percentage': formatPercentage(user.percentage),
      'Test Name': testName
    }));
  };

  const prepareChartData = (test) => {
    return [
      { name: 'Pending', value: test.pendingCount, color: '#6b7280', list: test.pendingList },
      { name: 'Started', value: test.startedCount, color: '#3b82f6', list: test.startedList },
      { name: 'Expired', value: test.expiredCount, color: '#ef4444', list: test.expiredList },
      { name: 'Completed', value: test.completedCount, color: '#10b981', list: test.completedList }
    ];
  };

  // Calculate Y-axis domain and scale dynamically
  const getYAxisConfig = (test) => {
    const maxValue = Math.max(test.pendingCount, test.startedCount, test.expiredCount, test.completedCount);
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
                  <li key={index}>{user.name} - {user.employeeType}</li>
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

  const renderPieChart = (test) => {
    const data = prepareChartData(test);
    
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
                {item.name}: {item.value} ({((item.value / (test.pendingCount + test.startedCount + test.expiredCount + test.completedCount)) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = (test) => {
    const data = prepareChartData(test);
    const yAxisConfig = getYAxisConfig(test);
    
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

  // Score Analysis Chart Component
  const ScoreAnalysisChart = ({ data }) => {
    const chartData = data.allRanges.map(range => ({
      range: range.range,
      count: range.count,
      percentage: data.statistics.totalUsers > 0 ? ((range.count / data.statistics.totalUsers) * 100).toFixed(1) : 0
    }));

    return (
      <div className={styles.scoreChartWrapper}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="range" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${value} students (${chartData.find(d => d.count === value)?.percentage || 0}%)`,
                'Count'
              ]}
            />
            <Bar dataKey="count" fill="#8e6cef" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => {
                // Color coding: red for low scores, yellow for medium, green for high
                let color = '#ef4444'; // Red for 0-49%
                if (index === 5) color = '#f59e0b'; // Yellow for exactly 50%
                if (index >= 6 && index < 9) color = '#f59e0b'; // Yellow for 51-80%
                if (index >= 9) color = '#10b981'; // Green for 81-100%
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Score Analysis Modal Component
  const ScoreAnalysisModal = () => {
    if (!isScoreModalOpen || !scoreAnalysisData) return null;

    const { test, scoreRanges, statistics } = scoreAnalysisData;

    return (
      <div className={styles.modalOverlay} onClick={closeScoreModal}>
        <div className={`${styles.modalContent} ${styles.scoreModalContent}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>Score Analysis - {test.testName}</h3>
            <button className={styles.modalCloseBtn} onClick={closeScoreModal}>
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            {/* Statistics Summary */}
            <div className={styles.statsSection}>
              <h4>Overall Statistics</h4>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{statistics.totalUsers}</div>
                  <div className={styles.statLabel}>Total Students</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{statistics.averageScore}%</div>
                  <div className={styles.statLabel}>Average Score</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{statistics.highestScore}%</div>
                  <div className={styles.statLabel}>Highest Score</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{statistics.lowestScore}%</div>
                  <div className={styles.statLabel}>Lowest Score</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{statistics.passingStudents}</div>
                  <div className={styles.statLabel}>Passing (≥50%)</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{statistics.failingStudents}</div>
                  <div className={styles.statLabel}>Failing (below 50%)</div>
                </div>
              </div>
              <div className={styles.passRateSection}>
                <div className={styles.passRate}>
                  Pass Rate: <span className={styles.passRateValue}>{statistics.passPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Score Distribution Chart */}
            <div className={styles.chartSection}>
              <h4>Score Distribution</h4>
              <ScoreAnalysisChart data={scoreAnalysisData} />
            </div>

            {/* Score Ranges Table */}
            <div className={styles.rangesSection}>
              <h4>Detailed Score Breakdown</h4>
              <div className={styles.rangesGrid}>
                {scoreRanges.map((range, index) => (
                  <div key={index} className={styles.rangeCard}>
                    <div className={styles.rangeHeader}>
                      <span className={styles.rangeTitle}>{range.range}</span>
                      <span className={styles.rangeCount}>{range.count} students</span>
                    </div>
                    <div className={styles.rangePercentage}>
                      {((range.count / statistics.totalUsers) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal Component
  const StatusModal = () => {
    if (!isModalOpen) return null;

    // Prepare data for Excel export
    const excelData = prepareExcelData(modalData.users, currentTest?.testName, modalData.status);
    
    // Generate filename based on test and status
    const fileName = `${currentTest?.testName?.replace(/[^a-zA-Z0-9]/g, '_')}_${modalData.status}_Users_${new Date().toISOString().split('T')[0]}`;

    return (
      <div className={styles.modalOverlay} onClick={closeModal}>
        <div className={`${styles.modalContent} ${styles.modalContentWide}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{modalData.title}</h3>
            <button className={styles.modalCloseBtn} onClick={closeModal}>
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            {modalData.users && modalData.users.length > 0 ? (
              <div className={styles.usersList}>
                <div className={styles.usersCount}>
                  Total: {modalData.users.length} user{modalData.users.length !== 1 ? 's' : ''}
                </div>
                
                {/* Export to Excel Button */}
                <div className={styles.exportSection}>
                  <ExportToExcel
                    data={excelData}
                    fileName={fileName}
                    sheetName={`${modalData.status.charAt(0).toUpperCase() + modalData.status.slice(1)} Users`}
                    buttonStyle={{
                      backgroundColor: '#007bff',
                      fontSize: '14px',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      marginBottom: '15px'
                    }}
                  />
                </div>
                
                <div className={styles.tableHeading}>
                  <h4>Employee Details</h4>
                </div>
                
                <div className={styles.tableContainer}>
                  <table className={styles.usersTable}>
                    <thead>
                      <tr>
                        <th style={{width: '60px'}}>S.No</th>
                        <th style={{width: '100px'}}>Employee ID</th>
                        <th style={{width: '150px'}}>Name</th>
                        <th style={{width: '200px'}}>Email ID</th>
                        <th style={{width: '120px'}}>Mobile No</th>
                        <th style={{width: '120px'}}>Employee Type</th>
                        <th style={{width: '140px'}}>Status</th>
                        <th style={{width: '80px'}}>Score</th>
                        <th style={{width: '100px'}}>Total Marks</th>
                        <th style={{width: '100px'}}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.users.map((user, index) => (
                        <tr key={`user-${index}-${user.employeeId || index}`} className={`${styles.tableRow} ${styles[`row${modalData.status.charAt(0).toUpperCase() + modalData.status.slice(1)}`]}`}>
                          <td style={{textAlign: 'center'}}>{index + 1}</td>
                          <td className={styles.employeeId}>{user.employeeId || 'N/A'}</td>
                          <td className={styles.employeeName}>{user.name || 'N/A'}</td>
                          <td className={styles.employeeEmail}>{user.emailId || 'N/A'}</td>
                          <td className={styles.employeeMobile}>{user.mobileNo || 'N/A'}</td>
                          <td>
                            <span className={`${styles.employeeTypeBadge} ${styles[`badge${user.employeeType?.replace(/[^a-zA-Z0-9]/g, '') || 'Default'}`]}`}>
                              {user.employeeType || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[`status${user.completionStatus?.replace(/[^a-zA-Z0-9]/g, '') || modalData.status.charAt(0).toUpperCase() + modalData.status.slice(1)}`]}`}>
                              {user.completionStatus || modalData.status.toUpperCase()}
                            </span>
                          </td>
                          <td className={styles.scoreCell}>
                            {getNumericValue(user.score)}
                          </td>
                          <td className={styles.totalMarksCell}>
                            {getNumericValue(user.totalMarks)}
                          </td>
                          <td>
                            <div className={styles.percentageCell}>
                              <span className={styles.percentageText}>
                                {formatPercentage(user.percentage)}
                              </span>
                              {user.percentage !== undefined && user.percentage !== null && !isNaN(user.percentage) && (
                                <div className={styles.percentageBarSmall}>
                                  <div 
                                    className={styles.percentageFillSmall} 
                                    style={{ width: `${Number(user.percentage) || 0}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
    return <div className={styles.loading}>Loading test analytics...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!testData || testData.length === 0) {
    return <div className={styles.noData}>No test data available</div>;
  }

  return (
    <div className={styles.container}>
      {role === "technical_manager" ? (
        <Sidebar activeTab={activeTab} />
      ) : role === "instructor" ? (
        <InstructorSidebar activeTab={activeTab} />
      ) : null}

      <div className={styles.header}>
        <h1>Test Analytics Dashboard</h1>
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

      <div className={styles.testsGrid}>
        {testData.map((test) => (
          <div key={test.testId} className={styles.testCard}>
            <div className={styles.testHeader}>
              <h3>{test.testName}</h3>
              <div className={styles.testInfo}>
                <div className={styles.totalAllotments}>
                  Total Allotments: {test.totalAllotments}
                </div>
                <div className={styles.duration}>
                  Duration: {test.duration} mins
                </div>
              </div>
              {/* Score Analysis Button */}
              {test.completedCount > 0 && (
                <div className={styles.scoreAnalysisButtonContainer}>
                  <button 
                    className={styles.scoreAnalysisBtn}
                    onClick={() => openScoreAnalysisModal(test)}
                  >
                    📊 Score Analysis
                  </button>
                </div>
              )}
            </div>
            
            <div className={styles.chartContainer}>
              {chartType === 'pie' ? renderPieChart(test) : renderBarChart(test)}
            </div>

            <div className={styles.statsContainer}>
              <div 
                className={`${styles.statItem} ${styles.clickableStatItem}`}
                onClick={() => openStatusModal(test, 'pending')}
              >
                <span className={styles.statLabel}>Pending:</span>
                <span className={`${styles.statValue} ${styles.statValuePending}`}>
                  {test.pendingCount}
                </span>
              </div>
              <div 
                className={`${styles.statItem} ${styles.clickableStatItem}`}
                onClick={() => openStatusModal(test, 'started')}
              >
                <span className={styles.statLabel}>Started:</span>
                <span className={`${styles.statValue} ${styles.statValueStarted}`}>
                  {test.startedCount}
                </span>
              </div>
              <div 
                className={`${styles.statItem} ${styles.clickableStatItem}`}
                onClick={() => openStatusModal(test, 'expired')}
              >
                <span className={styles.statLabel}>Expired:</span>
                <span className={`${styles.statValue} ${styles.statValueExpired}`}>
                  {test.expiredCount}
                </span>
              </div>
              <div 
                className={`${styles.statItem} ${styles.clickableStatItem}`}
                onClick={() => openStatusModal(test, 'completed')}
              >
                <span className={styles.statLabel}>Completed:</span>
                <span className={`${styles.statValue} ${styles.statValueCompleted}`}>
                  {test.completedCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Modal */}
      <StatusModal />
      
      {/* Score Analysis Modal */}
      <ScoreAnalysisModal />
    </div>
    
  );
};

export default TestAnalytics;
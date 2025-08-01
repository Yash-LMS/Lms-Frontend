import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import styles from './TestAnalytics.module.css';
import Sidebar from '../technical-manager/Sidebar';
import InstructorSidebar from '../instructor/InstructorSidebar';
import StatusModal from './StatusModal';
import ScoreAnalysisModal from './ScoreAnalysisModal';
import { TEST_ANALYSIS_URL } from '../../constants/apiConstants';

const TestAnalytics = () => {
  const [testData, setTestData] = useState([]);
  const [filteredTestData, setFilteredTestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('pie');
  const [role, setRole] = useState();
  const [activeTab, setActiveTab] = useState("analysis");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Status Modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalData, setStatusModalData] = useState({
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
        const data = response.data.payload || [];
        setTestData(data);
        setFilteredTestData(data);
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

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTestData(testData);
    } else {
      const filtered = testData.filter(test =>
        test.testName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTestData(filtered);
    }
  }, [searchTerm, testData]);

  // Function to open status modal
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
    
    setStatusModalData({
      title,
      users,
      status
    });
    setCurrentTest(test);
    setIsStatusModalOpen(true);
  };

  // Function to close status modal
  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setCurrentTest(null);
    setStatusModalData({
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
      scoreRanges: scoreRanges.filter(range => range.count > 0),
      allRanges: scoreRanges,
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

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        {role === "technical_manager" ? (
          <Sidebar activeTab={activeTab} />
        ) : role === "instructor" ? (
          <InstructorSidebar activeTab={activeTab} />
        ) : null}
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading test analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        {role === "technical_manager" ? (
          <Sidebar activeTab={activeTab} />
        ) : role === "instructor" ? (
          <InstructorSidebar activeTab={activeTab} />
        ) : null}
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={fetchTestAnalytics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!testData || testData.length === 0) {
    return (
      <div className={styles.container}>
        {role === "technical_manager" ? (
          <Sidebar activeTab={activeTab} />
        ) : role === "instructor" ? (
          <InstructorSidebar activeTab={activeTab} />
        ) : null}
        <div className={styles.noData}>
          <div className={styles.noDataIcon}>📊</div>
          <h3>No Test Data Available</h3>
          <p>There are currently no tests to display analytics for.</p>
          <button className={styles.refreshBtn} onClick={fetchTestAnalytics}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {role === "technical_manager" ? (
        <Sidebar activeTab={activeTab} />
      ) : role === "instructor" ? (
        <InstructorSidebar activeTab={activeTab} />
      ) : null}

      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1>Test Analytics Dashboard</h1>
          
          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="Search tests by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button 
                  className={styles.clearSearchIcon}
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {searchTerm && (
              <div className={styles.searchResults}>
                Found {filteredTestData.length} test{filteredTestData.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

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

        {filteredTestData.length === 0 && searchTerm ? (
          <div className={styles.noSearchResults}>
            <h3>No tests found</h3>
            <p>No tests match your search term "<strong>{searchTerm}</strong>"</p>
            <button 
              className={styles.clearSearchBtn}
              onClick={handleClearSearch}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>

            <div className={styles.testsGrid}>
              {filteredTestData.map((test) => (
                <div key={test.testId} className={styles.testCard}>
                  <div className={styles.testHeader}>
                    <h3 className={styles.testTitle}>{test.testName}</h3>
                    <div className={styles.testInfo}>
                      <div className={styles.testInfoItem}>
                        <span className={styles.testInfoLabel}>Total Allotments:</span>
                        <span className={styles.testInfoValue}>{test.totalAllotments}</span>
                      </div>
                      <div className={styles.testInfoItem}>
                        <span className={styles.testInfoLabel}>Duration:</span>
                        <span className={styles.testInfoValue}>{test.duration} mins</span>
                      </div>
                    </div>
                    
                    {/* Score Analysis Button */}
                    {test.completedCount > 0 && (
                      <div className={styles.scoreAnalysisButtonContainer}>
                        <button 
                          className={styles.scoreAnalysisBtn}
                          onClick={() => openScoreAnalysisModal(test)}
                          title="View detailed score analysis"
                        >
                          📊 Score Analysis ({test.completedCount} completed)
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.chartContainer}>
                    {chartType === 'pie' ? renderPieChart(test) : renderBarChart(test)}
                  </div>

                  <div className={styles.statsContainer}>
                    <div 
                      className={`${styles.statItem} ${styles.clickableStatItem} ${styles.statPending}`}
                      onClick={() => openStatusModal(test, 'pending')}
                      title="Click to view pending users"
                    >
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Pending</span>
                        <span className={styles.statValue}>{test.pendingCount}</span>
                      </div>
                      <div className={styles.statPercentage}>
                        {((test.pendingCount / test.totalAllotments) * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    <div 
                      className={`${styles.statItem} ${styles.clickableStatItem} ${styles.statStarted}`}
                      onClick={() => openStatusModal(test, 'started')}
                      title="Click to view started users"
                    >
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Started</span>
                        <span className={styles.statValue}>{test.startedCount}</span>
                      </div>
                      <div className={styles.statPercentage}>
                        {((test.startedCount / test.totalAllotments) * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    <div 
                      className={`${styles.statItem} ${styles.clickableStatItem} ${styles.statExpired}`}
                      onClick={() => openStatusModal(test, 'expired')}
                      title="Click to view expired users"
                    >
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Expired</span>
                        <span className={styles.statValue}>{test.expiredCount}</span>
                      </div>
                      <div className={styles.statPercentage}>
                        {((test.expiredCount / test.totalAllotments) * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    <div 
                      className={`${styles.statItem} ${styles.clickableStatItem} ${styles.statCompleted}`}
                      onClick={() => openStatusModal(test, 'completed')}
                      title="Click to view completed users"
                    >
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Completed</span>
                        <span className={styles.statValue}>{test.completedCount}</span>
                      </div>
                      <div className={styles.statPercentage}>
                        {((test.completedCount / test.totalAllotments) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Status Modal */}
        <StatusModal 
          isOpen={isStatusModalOpen}
          onClose={closeStatusModal}
          modalData={statusModalData}
          currentTest={currentTest}
        />
        
        {/* Score Analysis Modal */}
        <ScoreAnalysisModal 
          isOpen={isScoreModalOpen}
          onClose={closeScoreModal}
          scoreAnalysisData={scoreAnalysisData}
        />
      </div>
    </div>
  );
};

export default TestAnalytics;
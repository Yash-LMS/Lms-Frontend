import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './TestAnalytics.module.css';

const ScoreAnalysisModal = ({ 
  isOpen, 
  onClose, 
  scoreAnalysisData 
}) => {
  const [selectedRangeUsers, setSelectedRangeUsers] = useState(null);
  const [showUsersList, setShowUsersList] = useState(false);

  if (!isOpen || !scoreAnalysisData) return null;

  const { test, scoreRanges, statistics } = scoreAnalysisData;

  // Handle bar click to show users in that score range
  const handleBarClick = (data, index) => {
    const clickedRange = scoreAnalysisData.allRanges[index];
    if (clickedRange && clickedRange.users.length > 0) {
      setSelectedRangeUsers({
        range: clickedRange.range,
        users: clickedRange.users
      });
      setShowUsersList(true);
    } else {
      setSelectedRangeUsers(null);
      setShowUsersList(false);
    }
  };

  // Custom Bar component to handle clicks
  const ClickableBar = (props) => {
    return (
      <Bar 
        {...props} 
        onClick={(data, index) => handleBarClick(data, index)}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  // Score Analysis Chart Component - Compact version for modal
  const ScoreAnalysisChart = ({ data }) => {
    const chartData = data.allRanges.map(range => ({
      range: range.range,
      count: range.count,
      percentage: data.statistics.totalUsers > 0 ? ((range.count / data.statistics.totalUsers) * 100).toFixed(1) : 0
    }));

    return (
      <div className={styles.scoreChartWrapper}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="range" 
              angle={-35}
              textAnchor="end"
              height={50}
              interval={0}
              fontSize={11}
            />
            <YAxis 
              label={{ 
                value: 'Students', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: '12px' }
              }}
              fontSize={11}
            />
            <Tooltip 
              formatter={(value, name) => [
                `${value} students (${chartData.find(d => d.count === value)?.percentage || 0}%)`,
                'Count'
              ]}
              contentStyle={{ fontSize: '12px' }}
            />
            <ClickableBar dataKey="count" fill="#8e6cef" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => {
                // Color coding: red for low scores, yellow for medium, green for high
                let color = '#ef4444'; // Red for 0-49%
                if (index === 5) color = '#f59e0b'; // Yellow for exactly 50%
                if (index >= 6 && index < 9) color = '#f59e0b'; // Yellow for 51-80%
                if (index >= 9) color = '#10b981'; // Green for 81-100%
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </ClickableBar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const closeModal = () => {
    setSelectedRangeUsers(null);
    setShowUsersList(false);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={`${styles.modalContent} ${styles.scoreModalContent}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Score Analysis - {test.testName}</h3>
          <button className={styles.modalCloseBtn} onClick={closeModal}>
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
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{statistics.passPercentage}</div>
                <div className={styles.statLabel}>Pass Rate (%)</div>
              </div>
            </div>
          </div>

          {/* Score Distribution Chart - Compact version */}
          <div className={styles.chartSection}>
            <h4>Score Distribution</h4>
            <ScoreAnalysisChart data={scoreAnalysisData} />
          </div>

          {/* Users List for Selected Range */}
          {showUsersList && selectedRangeUsers && (
            <div className={styles.selectedRangeSection}>
              <div className={styles.selectedRangeHeader}>
                <h4>Students in {selectedRangeUsers.range} Range ({selectedRangeUsers.users.length} students)</h4>
                <button 
                  className={styles.closeRangeBtn}
                  onClick={() => setShowUsersList(false)}
                >
                  ✕ Close
                </button>
              </div>
              
              <div className={styles.rangeUsersContainer}>
                <div className={styles.rangeUsersGrid}>
                  {selectedRangeUsers.users.map((user, index) => (
                    <div key={index} className={styles.rangeUserCard}>
                      <div className={styles.rangeUserName}>{user.name}</div>
                      <div className={styles.rangeUserDetails}>
                        <span className={styles.rangeUserEmployee}>ID: {user.employeeId}</span>
                        <span className={styles.rangeUserPercentage}>{user.percentage}%</span>
                      </div>
                      <div className={styles.rangeUserScore}>
                        Score: {user.score}/{user.totalMarks}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Score Ranges Table */}
          <div className={styles.rangesSection} >
            <h4>Detailed Score Breakdown</h4>
            <div className={styles.rangesGrid}>
              {scoreRanges.map((range, index) => (
                <div 
                  key={index} 
                  className={`${styles.rangeCard} ${styles.clickableRangeCard}`}
                  onClick={() => {
                    setSelectedRangeUsers({
                      range: range.range,
                      users: range.users
                    });
                    setShowUsersList(true);
                  }}
                >
                  <div className={styles.rangeHeader}>
                    <span className={styles.rangeTitle}>{range.range}</span>
                    <span className={styles.rangeCount}>{range.count} students</span>
                  </div>
                  <div className={styles.rangePercentage}>
                    {((range.count / statistics.totalUsers) * 100).toFixed(1)}% of total
                  </div>
                  <div className={styles.clickHint}>Click to view students</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreAnalysisModal;
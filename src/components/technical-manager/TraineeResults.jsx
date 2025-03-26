import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './TraineeResults.module.css';
import { VIEW_TRAINEE_RESULT } from '../../constants/apiConstants';
import Sidebar from './Sidebar';
import ExportToExcel from "../../assets/ExportToExcel";

const TraineeResults = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('results');
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('totalMarks');
  const [filterValue, setFilterValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);  

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
    fetchTraineeResults();
  }, []);

  const fetchTraineeResults = async () => {
    setIsLoading(true);
    try {
      const { user, token } = getUserData();
  
      if (!user || !token) {
        console.error("User or token is missing.");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${VIEW_TRAINEE_RESULT}`,
        { user, token }
      );
  
      if (response.data.response === 'success') {
        setResults(response.data.payload);
        setFilteredResults(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching trainee results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterResults();
  }, [searchTerm, filterBy, filterValue, results]);

  const filterResults = () => {
    let filtered = [...results];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(result => 
        Object.values(result).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterBy !== 'all' && filterValue.trim() !== '') {
      filtered = filtered.filter(result => {
        if (filterBy === 'score' || filterBy === 'totalMarks') {
          return result[filterBy] === parseInt(filterValue);
        }
        return result[filterBy] && result[filterBy].toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    }

    setFilteredResults(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterByChange = (e) => {
    setFilterBy(e.target.value);
    setFilterValue('');
  };

  const handleFilterValueChange = (e) => {
    setFilterValue(e.target.value);
  };

  const calculatePassPercentage = (score, totalMarks) => {
    return ((score / totalMarks) * 100).toFixed(0);
  };

  const getPassPercentageClass = (percentage) => {
    percentage = parseInt(percentage);
    if (percentage >= 70) return styles.highPass;
    if (percentage >= 40) return styles.mediumPass;
    return styles.lowPass;
  };

  const handleNavigation = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const excelHeaders = {
    allotmentId: 'Allotment ID',
    name: 'Name',
    emailId: 'Email',
    testName: 'Test Name',
    score: 'Score',
    totalMarks: 'Total Marks',
    correctAnswers: 'Correct Answers',
    incorrectAnswers: 'Incorrect Answers',
    questionSkipped: 'Skipped Questions',
    totalQuestion: 'Total Questions'
  };

  return (
    <div className={styles.container}>
      {/* Sidebar component with fixed width */}
      <div className={styles.sidebarWrapper}>
        <Sidebar activeTab={activeTab}  />
      </div>
          
      {/* Main content */}
      <div className={styles.contentArea}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Trainee Test Results</h1>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by name, email or any parameter..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filter by:</label>
            <select 
              value={filterBy} 
              onChange={handleFilterByChange}
              className={styles.filterSelect}
            >
              <option value="name">Name</option>
              <option value="emailId">Email</option>
              <option value="score">Score</option>
              <option value="totalMarks">Total Marks</option>
              <option value="correctAnswers">Correct Answers</option>
              <option value="incorrectAnswers">Incorrect Answers</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Value:</label>
            <input
              type="text"
              placeholder="Enter filter value..."
              value={filterValue}
              onChange={handleFilterValueChange}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.headerActions}>
            <ExportToExcel 
              data={filteredResults} 
              headers={excelHeaders}
              fileName="Trainee-Test-Results"
              sheetName="Results"
              buttonStyle={{
                backgroundColor: '#2c7be5',
                marginBottom: '0',
              }}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Allotment ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Test Name</th>
                <th>Score</th>
                <th>Total Marks</th>
                <th>Pass %</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Skipped</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="12" className={styles.noRecords}>Loading results...</td>
                </tr>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result) => {
                  const passPercentage = calculatePassPercentage(result.score, result.totalMarks);
                  const percentageClass = getPassPercentageClass(passPercentage);
                  return (
                    <tr key={result.allotmentId || result.id}>
                      <td>{result.allotmentId || result.id}</td>
                      <td>{result.name}</td>
                      <td>{result.emailId}</td>
                      <td>{result.testName}</td>
                      <td>{result.score}</td>
                      <td>{result.totalMarks}</td>
                      <td>
                        <span className={`${styles.passPercentage} ${percentageClass}`}>
                          {passPercentage}%
                        </span>
                      </td>
                      <td>{result.correctAnswers}</td>
                      <td>{result.incorrectAnswers}</td>
                      <td>{result.questionSkipped}</td>
                      <td>{result.totalQuestion}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12" className={styles.noRecords}>No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TraineeResults;
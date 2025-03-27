import React, { useEffect, useState } from 'react';
import styles from './TestManagement.module.css';
import AddTestModal from './AddTestModal';
import TestList from './TestList';
import QuestionModal from './QuestionModal'; 
import SuccessModal from '../../assets/SuccessModal';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createTest, viewTest } from '../../features/test/testActions';

const TestManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, tests, questionAddSuccess } = useSelector((state) => state.tests);  
  const [activeTab, setActiveTab] = useState('tests');
  const [showAddTest, setShowAddTest] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  const testStatusOptions = ["ALL", "APPROVED", "PENDING", "REJECTED"];

  const getUserData = () => {
    try {
      return {
        user: JSON.parse(sessionStorage.getItem('user')),
        token: sessionStorage.getItem('token'),
        role: sessionStorage.getItem('role')
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { user: null, token: null, role: null };
    }
  };

  useEffect(() => {
    const fetchTests = async () => {
      try {
         await dispatch(viewTest());
        console.log('Fetching tests...');
      } catch (err) {
        console.error("Error fetching tests:", err);
      }
    };

    fetchTests();
  }, [dispatch]);

  useEffect(() => {
    if (questionAddSuccess) {
      setShowQuestionModal(false);
      setSelectedTest(null);
    }
  }, [questionAddSuccess]);

  const handleAddQuestions = (test) => {
    setSelectedTest(test);
    setShowQuestionModal(true);
    console.log('Adding questions to test:', test);
  };

  const handleEditTest = (test) => {
    setSelectedTest(test);
    console.log('Editing test:', test);
  };

  const handleSubmitNewTest = async (testName, duration) => {
    const { user, token, role } = getUserData();
    console.log(role)

    if (!user || !token) {
        alert("User session data is missing. Please log in again.");
        return;
    }

    const testData = {
        test: {
            testName,
            duration,
        },
        user,
        token,
        role: user.role,
    };

    try {
        const resultAction = await dispatch(createTest(testData));
        if (createTest.fulfilled.match(resultAction)) {
            setShowAddTest(false);
            setSuccessMessage("Test added successfully!");
            setShowSuccessModal(true);
            await dispatch(viewTest());
        }
    } catch (err) {
        console.error("Failed to add test:", err);
        alert(err.message || "An error occurred");
    }
  };

  // Improved filter function to match testStatus from TestList
  const getFilteredTests = () => {
    if (!tests) return [];

    return tests.filter(test => {
      // Robust null and undefined checks
      if (!test || !test.testName) return false;
      
      // Case-insensitive search term matching
      const matchesSearch = test.testName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Improved status filtering with ALL option and case-insensitive comparison
      const matchesStatus = 
        statusFilter === 'all' || 
        (test.testStatus && test.testStatus.toLowerCase() === statusFilter.toLowerCase());
      
      return matchesSearch && matchesStatus;
    });
  };

  // Get filtered tests
  const filteredTests = getFilteredTests();

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  return (
    <div className={styles.adminDashboard}>
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
                navigate("/instructor/test")
              }}>
                <i className="fas fa-clipboard-list"></i>
                Tests
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <header className={styles.contentHeader}>
          <div className={styles.headerLeft}>
            <h1>Test Management</h1>
            <button 
              className={styles.addTestBtn}
              onClick={() => setShowAddTest(true)}
            >
              Create New Test
            </button>
          </div>
          <div className={styles.headerRight}>
            <input 
              type="search" 
              placeholder="Search tests..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {testStatusOptions.map(status => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Display search results info when filtering */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className={styles.searchResultsInfo}>
            <p>
              {filteredTests.length === 0 
                ? 'No tests match your search criteria' 
                : `Found ${filteredTests.length} test${filteredTests.length !== 1 ? 's' : ''}`}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                className={styles.clearFiltersBtn}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Test List Component */}
        <TestList 
          tests={filteredTests}
          loading={loading}
          error={error}
          onAddQuestions={handleAddQuestions}
          onEditTest={handleEditTest}
        />

        {/* Add Test Modal Component */}
        <AddTestModal 
          isOpen={showAddTest}
          onClose={() => setShowAddTest(false)}
          onSubmit={handleSubmitNewTest}
        />

        {/* Question Modal Component */}
        {selectedTest && (
          <QuestionModal
            isOpen={showQuestionModal}
            onClose={() => {
              setShowQuestionModal(false);
              setSelectedTest(null);
            }}
            testId={selectedTest.id}
          />
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <SuccessModal 
            message={successMessage} 
            onClose={() => setShowSuccessModal(false)} 
          />
        )}
      </main>
    </div>
  );
};

export default TestManagement;
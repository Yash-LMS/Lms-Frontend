import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ResultComponent.module.css';
import TraineeResults from './TraineeResults';
import AllResults from './AllResults';

const ResultComponent = () => {
  const [activeView, setActiveView] = useState('all');
  const navigate = useNavigate();
  
  const handleViewChange = (view) => {
    setActiveView(view);
  };

  return (
    <div className={styles.mainContainer}>
      {/* Action buttons at the top */}
      <div className={styles.actionsContainer}>
        <button 
          className={`${styles.actionButton} ${activeView === 'all' ? styles.activeButton : ''}`}
          onClick={() => handleViewChange('all')}
        >
          Show All Results
        </button>
        <button 
          className={`${styles.actionButton} ${activeView === 'trainee' ? styles.activeButton : ''}`}
          onClick={() => handleViewChange('trainee')}
        >
          Show Trainee Results
        </button>
      </div>
      
      {/* Content area */}
      <div className={styles.contentArea}>
        {activeView === 'all' ? (
          <AllResults />
        ) : (
          <TraineeResults />
        )}
      </div>
    </div>
  );
};

export default ResultComponent;
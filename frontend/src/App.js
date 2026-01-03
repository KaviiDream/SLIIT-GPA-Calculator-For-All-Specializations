import React, { useState, useEffect } from 'react';
import Year1_2 from './components/Year1_2';
import SpecializationSelector from './components/SpecializationSelector';
import Year3_4 from './components/Year3_4';
import ResultsDisplay from './components/ResultsDisplay';
import Navigation from './components/Navigation';
import './styles/AppStyles.css';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [grades, setGrades] = useState([]);
  const [specialization, setSpecialization] = useState(null);
  const [specializationModules, setSpecializationModules] = useState({
    year3: [],
    year4: []
  });

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('gpaCalculatorState');
    if (savedState) {
      try {
        const { 
          grades: savedGrades, 
          specialization: savedSpec,
          specializationModules: savedModules,
          currentStep: savedStep 
        } = JSON.parse(savedState);
        
        if (savedGrades) setGrades(savedGrades);
        if (savedSpec) setSpecialization(savedSpec);
        if (savedModules) setSpecializationModules(savedModules);
        if (savedStep) setCurrentStep(savedStep);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const state = {
      grades,
      specialization,
      specializationModules,
      currentStep,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('gpaCalculatorState', JSON.stringify(state));
  }, [grades, specialization, specializationModules, currentStep]);

  // Update grade handler
  const updateGrade = (moduleCode, grade, moduleData) => {
    setGrades(prev => {
      // Remove existing grade for this module
      const filtered = prev.filter(g => g.moduleCode !== moduleCode);
      
      // If grade is selected, add it
      if (grade && grade !== '') {
        return [...filtered, {
          moduleCode,
          grade,
          credits: moduleData.credits,
          year: moduleData.year,
          semester: moduleData.semester || 1,
          moduleName: moduleData.moduleName
        }];
      }
      
      return filtered;
    });
  };

  // Get current grade for a module
  const getCurrentGrade = (moduleCode) => {
    const grade = grades.find(g => g.moduleCode === moduleCode);
    return grade ? grade.grade : '';
  };

  // Reset calculator
  const resetCalculator = () => {
    if (window.confirm('Are you sure you want to reset all data? This will clear all your grades and selections.')) {
      setGrades([]);
      setSpecialization(null);
      setSpecializationModules({ year3: [], year4: [] });
      setCurrentStep(1);
      localStorage.removeItem('gpaCalculatorState');
    }
  };

  // Navigation
  const goToStep = (step) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  };

  // Calculate total graded modules
  const totalGradedModules = grades.filter(g => g.grade).length;

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">University GPA Calculator</h1>
          <p className="app-subtitle">Track CGPA and WGPA progress across all four academic years.</p>
        </header>

        <Navigation
          currentStep={currentStep}
          goToStep={goToStep}
          grades={grades}
          specialization={specialization}
        />

        {specialization && (
          <div className="stats-bar">
            <div className="stats-summary">
              <div className="stat-metric">
                <span className="stat-value">{totalGradedModules}</span>
                <span className="stat-label">Graded Modules</span>
              </div>
              <div className="stat-metric">
                <span className="stat-value accent">{specialization.name}</span>
                <span className="stat-label">Specialization</span>
              </div>
            </div>
            <button onClick={resetCalculator} className="reset-button">
              Reset Workspace
            </button>
          </div>
        )}

        <div className="app-panel animate-fade-in">
          {currentStep === 1 && (
            <Year1_2
              grades={grades}
              updateGrade={updateGrade}
              getCurrentGrade={getCurrentGrade}
              nextStep={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <SpecializationSelector
              specialization={specialization}
              setSpecialization={setSpecialization}
              setSpecializationModules={setSpecializationModules}
              prevStep={() => setCurrentStep(1)}
              nextStep={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && (
            <Year3_4
              specialization={specialization}
              specializationModules={specializationModules}
              grades={grades}
              updateGrade={updateGrade}
              getCurrentGrade={getCurrentGrade}
              prevStep={() => setCurrentStep(2)}
              nextStep={() => setCurrentStep(4)}
            />
          )}

          {currentStep === 4 && (
            <ResultsDisplay
              grades={grades}
              specialization={specialization}
              resetCalculator={resetCalculator}
              prevStep={() => setCurrentStep(3)}
            />
          )}
        </div>

        <footer className="app-footer">
          <p>Your data stays on this device. GPA computations run securely on the server.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { calculateGPA } from '../services/api';
import { GRADE_COLORS, GPA_COLORS } from '../utils/constants';

const ResultsDisplay = ({ grades, specialization, resetCalculator, prevStep }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    calculateGPAResults();
  }, []);

  const calculateGPAResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter only graded modules
      const gradedModules = grades.filter(g => g.grade);
      
      if (gradedModules.length === 0) {
        setError('No graded modules found. Please go back and select grades for at least one module.');
        setLoading(false);
        return;
      }

      const data = await calculateGPA(gradedModules);
      setResults(data);
    } catch (err) {
      console.error('Failed to calculate GPA:', err);
      setError(err.message || 'Failed to calculate GPA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGpaColorClass = (gpa) => {
    const num = parseFloat(gpa);
    let tone = '0-1.99';

    if (!isNaN(num)) {
      if (num >= 3.7) tone = '3.7-4.0';
      else if (num >= 3.3) tone = '3.3-3.69';
      else if (num >= 3.0) tone = '3.0-3.29';
      else if (num >= 2.0) tone = '2.0-2.99';
    }

    return `gpa-badge ${GPA_COLORS[tone]}`;
  };

  const exportResults = () => {
    const exportData = {
      specialization: specialization,
      grades: grades.filter(g => g.grade),
      results: results,
      calculatedAt: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gpa-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printResults = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner--lg"></div>
        <p>Calculating your GPA…</p>
        <span className="footnote">Processing {grades.filter(g => g.grade).length} graded modules</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={prevStep} className="btn-primary">
          ← Go Back and Add Grades
        </button>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="results-section">
      <div className="section-heading">
        <h2>Your GPA Results</h2>
        <p>Based on {results.totalModules} graded modules · {results.totalCredits} credits</p>
      </div>

      {specialization && (
        <div className="specialization-banner">
          <div>
            <h3>{specialization.specializationName}</h3>
            <span>Specialization · Years 3-4</span>
          </div>
          <span className="chip accent">Code: {specialization.specializationCode}</span>
        </div>
      )}

      <div className="year-grid">
        {Object.entries(results.yearGPAs).map(([year, gpa]) => {
          const yearNum = parseInt(year.replace('year', ''));
          const credits = results.yearCredits[year] || 0;

          return (
            <div key={year} className="year-card">
              <span className="label">Year {yearNum}</span>
              <div className={getGpaColorClass(gpa)}>{gpa}</div>
              <span className="footnote">{credits} credits</span>
            </div>
          );
        })}
      </div>

      <div className="results-grid">
        <div className="results-card">
          <header>
            <div className="icon success" />
            <div>
              <h3>CGPA</h3>
              <span>Cumulative GPA</span>
            </div>
          </header>
          <div className={`metric ${getGpaColorClass(results.cgpa)}`}>{results.cgpa}</div>
          <p className="footnote">Based on {results.totalCredits} credits</p>
        </div>
        <div className="results-card">
          <header>
            <div className="icon info" />
            <div>
              <h3>WGPA</h3>
              <span>Weighted GPA</span>
            </div>
          </header>
          <div className={`metric ${getGpaColorClass(results.wgpa)}`}>{results.wgpa}</div>
          <p className="footnote">Weighted by yearly importance (2nd Year - 20% , 3rd Year - 30%, 4th Year - 50%)</p>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">Detailed Grade Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Year</th>
              <th>Credits</th>
              <th>Grade</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {grades
              .filter(g => g.grade)
              .sort((a, b) => a.year - b.year || a.moduleCode.localeCompare(b.moduleCode))
              .map((grade, index) => {
                const points = {
                  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
                  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                  'D+': 1.3, 'D': 1.0, 'E': 0.0, 'F': 0.0
                }[grade.grade] || 0;

                return (
                  <tr key={index}>
                    <td>
                      <strong>{grade.moduleCode}</strong>
                      <span>{grade.moduleName}</span>
                    </td>
                    <td>
                      <span className="chip info">Year {grade.year}</span>
                    </td>
                    <td>{grade.credits}</td>
                    <td>
                      <span className={`chip ${GRADE_COLORS[grade.grade]}`}>
                        {grade.grade}
                      </span>
                    </td>
                    <td>{points.toFixed(1)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="actions-row">
        <button onClick={prevStep} className="btn-secondary">
          ← Edit Grades
        </button>
        <button onClick={printResults} className="btn-info">
          🖨️ Print Results
        </button>
        <button onClick={resetCalculator} className="btn-danger">
          ↻ Calculate Again
        </button>
      </div>

      <div className="summary-panel">
        <div>
          <span>Total Modules</span>
          <strong>{results.totalModules}</strong>
        </div>
        <div>
          <span>Total Credits</span>
          <strong>{results.totalCredits}</strong>
        </div>
        <div>
          <span>Overall CGPA</span>
          <strong>{results.cgpa}</strong>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
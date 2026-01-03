import React, { useState, useEffect } from 'react';
import { getCommonModules } from '../services/api';
import { GRADE_OPTIONS } from '../utils/constants';

const Year1_2 = ({ grades, updateGrade, getCurrentGrade, nextStep }) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('alphabetical');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCommonModules();
      setModules(data);
    } catch (err) {
      console.error('Failed to load modules:', err);
      setError('Failed to load modules. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter modules based on search and year
  const filteredModules = modules.filter(module => {
    const semesterValue = Number.isFinite(Number(module.semester)) ? Number(module.semester) : 1;
    const matchesSearch = search === '' || 
      module.moduleCode.toLowerCase().includes(search.toLowerCase()) ||
      module.moduleName.toLowerCase().includes(search.toLowerCase());
    const matchesYear = selectedYear === 'all' || module.year.toString() === selectedYear;
    const matchesSemester = selectedSemester === 'all' || semesterValue.toString() === selectedSemester;
    const currentGrade = getCurrentGrade(module.moduleCode);
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'completed' && currentGrade)
      || (statusFilter === 'pending' && !currentGrade);
    return matchesSearch && matchesYear && matchesSemester && matchesStatus;
  });

  const sortedModules = filteredModules.slice().sort((a, b) => {
    if (sortMode === 'credits') {
      return (b.credits || 0) - (a.credits || 0);
    }
    return (a.moduleCode || '').localeCompare(b.moduleCode || '');
  });

  // Group modules by year and semester
  const groupedModules = sortedModules.reduce((acc, module) => {
    const key = `Year ${module.year} · Semester ${module.semester}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(module);
    return acc;
  }, {});

  const toneClasses = (year, semester) => {
    const palette = year === 1 || year === 3 ? 'tone-warm' : 'tone-cool';
    const semesterClass = semester === 2 ? 'semester-two' : 'semester-one';
    return `${palette} ${semesterClass}`;
  };


  // Calculate stats
  const calculateStats = (year) => {
    const yearModules = modules.filter(m => m.year === year);
    const gradedModules = yearModules.filter(m => getCurrentGrade(m.moduleCode));
    
    const totalCredits = yearModules.reduce((sum, m) => sum + m.credits, 0);
    const gradedCredits = gradedModules.reduce((sum, m) => sum + m.credits, 0);
    
    return {
      total: yearModules.length,
      graded: gradedModules.length,
      totalCredits,
      gradedCredits,
      completion: yearModules.length > 0 ? (gradedModules.length / yearModules.length) * 100 : 0
    };
  };

  const year1Stats = calculateStats(1);
  const year2Stats = calculateStats(2);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner--md"></div>
        <p>Loading common modules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={loadModules} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="module-section">
      <div className="section-heading">
        <h2>Years 1 &amp; 2 · Common Modules</h2>
        <p>Select grades for every shared module in the foundation years.</p>
      </div>

      <div className="progress-grid">
        <div className="progress-card year-one">
          <div className="progress-card__header">
            <h3>Year 1 Progress</h3>
            <p>{year1Stats.graded}/{year1Stats.total} modules</p>
          </div>
          <div className="progress-card__metrics">
            <span>{year1Stats.gradedCredits}/{year1Stats.totalCredits} credits</span>
            <span>{year1Stats.completion.toFixed(0)}% complete</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${year1Stats.completion}%` }} />
          </div>
        </div>

        <div className="progress-card year-two">
          <div className="progress-card__header">
            <h3>Year 2 Progress</h3>
            <p>{year2Stats.graded}/{year2Stats.total} modules</p>
          </div>
          <div className="progress-card__metrics">
            <span>{year2Stats.gradedCredits}/{year2Stats.totalCredits} credits</span>
            <span>{year2Stats.completion.toFixed(0)}% complete</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${year2Stats.completion}%` }} />
          </div>
        </div>
      </div>


      {Object.keys(groupedModules).length === 0 ? (
        <div className="empty-state">No modules match your filters.</div>
      ) : (
        <div className="module-groups">
          {Object.entries(groupedModules).map(([groupName, groupModules]) => (
            <div key={groupName} className="module-group animate-slide-up">
              <div className="module-group__title">{groupName}</div>
              <div className="module-grid">
                {groupModules.map((module) => {
                  const currentGrade = getCurrentGrade(module.moduleCode);
                  const semesterValue = Number.isFinite(Number(module.semester)) ? Number(module.semester) : 1;
                  const toneClassNames = toneClasses(module.year, semesterValue);

                  return (
                    <div
                      key={module.moduleCode}
                      className={`module-card ${toneClassNames} ${currentGrade ? 'is-selected' : ''}`}
                    >
                      <div className="module-card__shell">
                        <div className="module-card__header">
                          <span className="code">{module.moduleCode}</span>
                          <span className="credit-badge" aria-label={`${module.credits} credits`}>
                            <span aria-hidden="true">◈</span> {module.credits} Credits
                          </span>
                        </div>
                        <p className="module-card__title">{module.moduleName}</p>
                      </div>

                      <select
                        value={currentGrade}
                        onChange={(e) => updateGrade(module.moduleCode, e.target.value, module)}
                        className="grade-select"
                      >
                        <option value="">Select Grade</option>
                        {GRADE_OPTIONS.map((grade) => (
                          <option key={grade.value} value={grade.value}>
                            {grade.label}
                          </option>
                        ))}
                      </select>

                      {currentGrade && (
                        <div className="module-card__footer">
                          <span className={`module-status ${currentGrade ? 'is-complete' : ''}`}>
                            {currentGrade ? 'Completed' : 'Pending'}
                          </span>
                          {currentGrade && (
                            <span className="points">
                              {GRADE_OPTIONS.find(g => g.value === currentGrade)?.points.toFixed(1)} pts
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-footer">
        <button onClick={nextStep} className="btn-primary btn-block">
          Continue to Specialization →
        </button>
        <p className="footnote">
          {modules.length} modules loaded · {grades.filter(g => g.year <= 2 && g.grade).length} graded
        </p>
      </div>
    </div>
  );
};

export default Year1_2;
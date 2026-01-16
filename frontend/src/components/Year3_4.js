import React, { useState } from 'react';
import { GRADE_OPTIONS } from '../utils/constants';

const Year3_4 = ({
  specialization,
  specializationModules,
  grades,
  updateGrade,
  getCurrentGrade,
  prevStep,
  nextStep
}) => {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('alphabetical');

  const year3ModuleList = specializationModules.year3 || [];
  const year4CompulsoryModules = specializationModules.year4Compulsory || [];
  const year4ElectiveModules = specializationModules.year4Electives || [];
  const combinedYear4Modules = (specializationModules.year4 && specializationModules.year4.length > 0)
    ? specializationModules.year4
    : [...year4CompulsoryModules, ...year4ElectiveModules];
  const hasYear4Categories = year4CompulsoryModules.length > 0 || year4ElectiveModules.length > 0;
  const effectiveYear4Compulsory = hasYear4Categories ? year4CompulsoryModules : combinedYear4Modules;
  const effectiveYear4Electives = hasYear4Categories ? year4ElectiveModules : [];
  const totalYear4Modules = combinedYear4Modules.length;
  const totalModuleCount = year3ModuleList.length + totalYear4Modules;
  const showYear3 = selectedYear === 'all' || selectedYear === '3';
  const showYear4 = selectedYear === 'all' || selectedYear === '4';

  // Calculate stats
  const calculateYearStats = (modules = []) => {
    const gradedModules = modules.filter(module => getCurrentGrade(module.moduleCode));
    
    const totalCredits = modules.reduce((sum, m) => sum + m.credits, 0);
    const gradedCredits = gradedModules.reduce((sum, m) => sum + m.credits, 0);
    
    return {
      total: modules.length,
      graded: gradedModules.length,
      totalCredits,
      gradedCredits,
      completion: modules.length > 0 ? (gradedModules.length / modules.length) * 100 : 0
    };
  };

  const year3Stats = calculateYearStats(year3ModuleList);
  const year4Stats = calculateYearStats(combinedYear4Modules);

  // Filter modules
  const filterModules = (modules) => {
    return modules.filter(module => {
      const moduleName = module.moduleName || '';
      const moduleCode = module.moduleCode || '';
      const query = search.toLowerCase();
      const matchesSearch = search === '' || 
        moduleCode.toLowerCase().includes(query) ||
        moduleName.toLowerCase().includes(query);
      const semesterValue = Number.isFinite(Number(module.semester)) ? Number(module.semester) : 1;
      const matchesSemester = selectedSemester === 'all' || selectedSemester === semesterValue.toString();
       const currentGrade = getCurrentGrade(module.moduleCode);
       const matchesStatus = statusFilter === 'all'
         || (statusFilter === 'completed' && currentGrade)
         || (statusFilter === 'pending' && !currentGrade);
       return matchesSearch && matchesSemester && matchesStatus;
    });
  };

  const groupBySemester = (modules) => {
    return modules.reduce((acc, module) => {
      const parsedSemester = Number(module.semester);
      const semesterValue = Number.isFinite(parsedSemester) ? parsedSemester : 1;
      const semesterLabel = `Semester ${semesterValue}`;

      if (!acc[semesterLabel]) {
        acc[semesterLabel] = { modules: [], order: semesterValue };
      }

      acc[semesterLabel].modules.push(module);
      return acc;
    }, {});
  };

  const sortModules = (modules) => {
    const copy = modules.slice();
    if (sortMode === 'credits') {
      return copy.sort((a, b) => (b.credits || 0) - (a.credits || 0));
    }
    return copy.sort((a, b) => (a.moduleCode || '').localeCompare(b.moduleCode || ''));
  };

  const filteredYear3 = showYear3
    ? sortModules(filterModules(year3ModuleList))
    : [];
  const filteredYear4Compulsory = showYear4
    ? sortModules(filterModules(effectiveYear4Compulsory))
    : [];
  const filteredYear4Electives = showYear4
    ? sortModules(filterModules(effectiveYear4Electives))
    : [];
  const filteredYear4 = showYear4
    ? [...filteredYear4Compulsory, ...filteredYear4Electives]
    : [];

  // Match Year 1 & 2 module card color logic
  const toneClasses = (year, semester) => {
    const palette = year === 1 || year === 3 ? 'tone-warm' : 'tone-cool';
    const semesterClass = semester === 2 ? 'semester-two' : 'semester-one';
    return `${palette} ${semesterClass}`;
  };

  const renderModuleCard = (module, gradeYear, toneVariant = 'default') => {
    const currentGrade = getCurrentGrade(module.moduleCode);
    const safeName = module.moduleName || module.moduleCode;
    const creditLabel = module.credits ? `${module.credits} credits` : 'Credits not set';
    const semester = Number.isFinite(Number(module.semester)) ? Number(module.semester) : 1;
    const paletteClasses = toneClasses(gradeYear, semester);
    const variantClass = toneVariant === 'compulsory'
      ? 'tone-heavy'
      : toneVariant === 'elective'
        ? 'tone-light'
        : '';
    const cardClassName = ['module-card', paletteClasses, variantClass, currentGrade ? 'is-selected' : '']
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={`${module.moduleCode}-${gradeYear}-${semester}`}
        className={cardClassName}
      >
        <div className="module-card__shell">
          <div className="module-card__header">
            <span className="code">{module.moduleCode}</span>
            <span className="credit-badge" aria-label={creditLabel}>
              <span aria-hidden="true">◈</span> {module.credits || 0} Credits
            </span>
          </div>
          <p className="module-card__title">{safeName}</p>
        </div>

        <select
          value={currentGrade}
          onChange={(e) => updateGrade(module.moduleCode, e.target.value, {
            ...module,
            year: gradeYear,
            semester
          })}
          className="grade-select"
        >
          <option value="">Select Grade</option>
          {GRADE_OPTIONS.map((grade) => (
            <option key={grade.value} value={grade.value}>
              {grade.label}
            </option>
          ))}
        </select>

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
      </div>
    );
  };

  const renderGroupedModules = (modules, year, options = {}) => {
    const {
      emptyMessage,
      toneVariant = 'default',
      titleFormatter
    } = options;
    const groups = groupBySemester(modules);
    const groupEntries = Object.entries(groups)
      .sort(([, groupA], [, groupB]) => groupA.order - groupB.order);

    if (!groupEntries.length) {
      return (
        <div className="empty-state">
          {emptyMessage || `No Year ${year} modules found matching your search.`}
        </div>
      );
    }

    return groupEntries.map(([label, group]) => {
      const titleText = typeof titleFormatter === 'function'
        ? titleFormatter(label, year)
        : `Year ${year} · ${label}`;

      return (
        <div key={`${year}-${label}`} className="module-group animate-slide-up">
          <div className="module-group__title">{titleText}</div>
          <div className="module-grid">
            {group.modules.map((module) => renderModuleCard(module, year, toneVariant))}
          </div>
        </div>
      );
    });
  };

  const renderYear4Grid = (modules, sectionLabel, toneVariant, emptyMessage) => {
    if (!modules.length) {
      return (
        <div className="empty-state">
          {emptyMessage || `No Year 4 ${sectionLabel.toLowerCase()} modules match your filters.`}
        </div>
      );
    }

    return (
      <div className="module-grid">
        {modules.map((module) => renderModuleCard(module, 4, toneVariant))}
      </div>
    );
  };

  const renderYear4Sections = () => {
    if (totalYear4Modules === 0) {
      return renderGroupedModules([], 4, {
        emptyMessage: 'No Year 4 modules available for this specialization.'
      });
    }

    const sections = [
      {
        key: 'compulsory',
        title: 'Compulsory Modules',
        modules: filteredYear4Compulsory,
        total: effectiveYear4Compulsory.length,
        toneVariant: 'compulsory',
        emptyMessage: 'No Year 4 compulsory modules found matching your search.'
      },
      {
        key: 'electives',
        title: 'Elective Modules',
        modules: filteredYear4Electives,
        total: effectiveYear4Electives.length,
        toneVariant: 'elective',
        emptyMessage: 'No Year 4 elective modules found matching your search.'
      }
    ];

    const sectionsWithModules = sections.filter(section => section.total > 0);

    if (!sectionsWithModules.length) {
      return renderGroupedModules([], 4, {
        emptyMessage: 'No Year 4 modules match your filters.'
      });
    }

    return sectionsWithModules.map(section => (
      <div key={`year4-${section.key}`} className="module-subgroup">
        <div className="module-group__meta">
          <h3>
            Year 4 · {section.title}
            {section.modules.length > 0 && ` (${section.modules.length})`}
          </h3>
          <span>{section.total} total modules</span>
        </div>

        {renderYear4Grid(section.modules, section.title, section.toneVariant, section.emptyMessage)}
      </div>
    ));
  };

  if (!specialization) {
    return (
      <div className="empty-state">
        <p>Please select a specialization first</p>
        <button onClick={prevStep} className="btn-primary">
          ← Go Back to Select Specialization
        </button>
      </div>
    );
  }

  return (
    <div className="module-section">
      <div className="section-heading">
        <h2>Years 3 &amp; 4 · {specialization.name}</h2>
        <p>
          Grade each specialization module. {totalModuleCount} modules pending.
        </p>
      </div>

      <div className="progress-grid">
        <div className="progress-card year-three">
          <div className="progress-card__header">
            <h3>Year 3 Progress</h3>
            <p>{year3Stats.graded}/{year3Stats.total} modules</p>
          </div>
          <div className="progress-card__metrics">
            <span>{year3Stats.gradedCredits}/{year3Stats.totalCredits} credits</span>
            <span>{year3Stats.completion.toFixed(0)}% complete</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${year3Stats.completion}%` }} />
          </div>
        </div>

        <div className="progress-card year-four">
          <div className="progress-card__header">
            <h3>Year 4 Progress</h3>
            <p>{year4Stats.graded}/{year4Stats.total} modules</p>
          </div>
          <div className="progress-card__metrics">
            <span>{year4Stats.gradedCredits}/{year4Stats.totalCredits} credits</span>
            <span>{year4Stats.completion.toFixed(0)}% complete</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${year4Stats.completion}%` }} />
          </div>
        </div>
      </div>


     

      {/* Modules List */}
      <div className="module-groups">
        {/* Year 3 Modules */}
        {showYear3 && (
          <div className="animate-slide-up">
            <div className="module-group__meta">
              <h3>Year 3 Modules {filteredYear3.length > 0 && `(${filteredYear3.length})`}</h3>
              <span>{year3ModuleList.length} total modules</span>
            </div>
            
            {renderGroupedModules(filteredYear3, 3)}
          </div>
        )}

        {/* Year 4 Modules */}
        {showYear4 && (
          <div className="animate-slide-up">
            <div className="module-group__meta">
              <h3>Year 4 Modules {filteredYear4.length > 0 && `(${filteredYear4.length})`}</h3>
              <span>{totalYear4Modules} total modules</span>
            </div>
            
            {renderYear4Sections()}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="section-footer split">
        <button onClick={prevStep} className="btn-secondary">
          ← Change Specialization
        </button>
        <button onClick={nextStep} className="btn-primary" disabled={loading}>
          {loading ? 'Calculating…' : 'Calculate GPA →'}
        </button>
      </div>

      <div className="tip-card">
        <h4>💡 Tips</h4>
        <ul>
          <li>Only graded modules count toward your GPA.</li>
          <li>Leave modules empty if you have not completed them yet.</li>
          <li>You can revisit any step without losing progress.</li>
        </ul>
      </div>
    </div>
  );
};

export default Year3_4;
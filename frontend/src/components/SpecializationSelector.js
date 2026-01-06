import React, { useState, useEffect } from 'react';
import { getAllSpecializations, getSpecializationModules } from '../services/api';

const SpecializationSelector = ({ 
  specialization, 
  setSpecialization, 
  setSpecializationModules,
  prevStep, 
  nextStep 
}) => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingModules, setLoadingModules] = useState(false);

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllSpecializations();
      setSpecializations(data);
    } catch (err) {
      console.error('Failed to load specializations:', err);
      setError('Failed to load specializations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatMetric = (value) =>
    typeof value === 'number' && !Number.isNaN(value) ? value : '—';

  const handleCardKeyPress = (event, spec) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectSpecialization(spec);
    }
  };

  const handleSelectSpecialization = async (spec) => {
    setLoadingModules(true);
    try {
      // Load modules for this specialization
      const lookupKey = spec._id || spec.specializationCode || spec.specializationNamme || spec.name;
      const data = await getSpecializationModules(lookupKey);

      const year4CompulsoryModules = data.year4CompulsoryModules || [];
      const year4ElectiveModules = data.year4ElectiveModules || [];
      const combinedYear4Modules = (data.year4Modules && data.year4Modules.length > 0)
        ? data.year4Modules
        : [...year4CompulsoryModules, ...year4ElectiveModules];

      setSpecialization(spec);
      setSpecializationModules({
        year3: data.year3Modules || [],
        year4: combinedYear4Modules,
        year4Compulsory: year4CompulsoryModules,
        year4Electives: year4ElectiveModules
      });
    } catch (err) {
      console.error('Failed to load specialization modules:', err);
      alert('Failed to load modules for this specialization. Please try again.');
    } finally {
      setLoadingModules(false);
    }
  };

  const handleClearSelection = () => {
    setSpecialization(null);
    setSpecializationModules({ year3: [], year4: [], year4Compulsory: [], year4Electives: [] });
  };

  const toSearchable = (value = '') => (typeof value === 'string' ? value.toLowerCase() : '');
  const searchQuery = toSearchable(search.trim());

  const filteredSpecializations = specializations.filter((spec) => {
    const name = spec.name || spec.specializationNamme || '';
    const code = spec.specializationCode || '';
    const description = spec.description || '';

    return (
      toSearchable(name).includes(searchQuery) ||
      toSearchable(code).includes(searchQuery) ||
      toSearchable(description).includes(searchQuery)
    );
  });

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner--md"></div>
        <p>Loading specializations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={loadSpecializations} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="module-section">
      <div className="section-heading">
        <h2>Choose Your Specialization</h2>
        <p>Selecting a track tailors the Years 3 &amp; 4 module list to your pathway.</p>
      </div>

      <div className="specialization-toolbar">
        <div className="selection-status" aria-live="polite">
          {specialization ? (
            <>
              <span>Selected:</span>
              <strong>{specialization.specializationName || specialization.name || specialization.specializationCode}</strong>
            </>
          ) : (
            <span>No specialization selected</span>
          )}
        </div>
        <button
          type="button"
          className="pill-button ghost"
          onClick={handleClearSelection}
          disabled={!specialization}
        >
          ⟲ Unselect specialization
        </button>
      </div>

      {filteredSpecializations.length === 0 ? (
        <div className="empty-state">No specializations match your search.</div>
      ) : (
        <div className="specialization-grid">
          {filteredSpecializations.map((spec) => {
            const code = (spec.specializationCode || spec.code || 'N/A').toUpperCase();
            const name = spec.specializationName || spec.name || 'Unnamed Specialization';
            const programmeLine = spec.programme || spec.programmeName || spec.programTitle || '';
            const summary = spec.description || spec.summary || 'No description available.';
            const year3Count = spec.year3Modules?.length ?? spec.year3Count ?? 0;
            const year4Count = spec.year4Modules?.length ?? (
              (spec.year4Compulsory?.length ?? 0) + (spec.year4Electives?.length ?? 0)
            );
            const minYear3 = formatMetric(spec.minCreditsYear3);
            const minYear4 = formatMetric(spec.minCreditsYear4);
            const isSelected = Boolean(
              specialization &&
              (
                specialization._id === spec._id ||
                specialization.specializationCode === spec.specializationCode ||
                specialization.name === spec.name
              )
            );

            return (
              <div
                key={code || name}
                className={`specialization-card ${isSelected ? 'is-selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Select the ${name} specialization`}
                onClick={() => handleSelectSpecialization(spec)}
                onKeyDown={(event) => handleCardKeyPress(event, spec)}
              >
                <div className="specialization-card__head">
                  <div className="specialization-card__identity">
                    <span className="eyebrow-label">Specialization</span>
                    <h3>{name}</h3>
                  </div>
                  <div className="specialization-card__meta-tags">
                    <span className="code-badge" aria-hidden="true">{code}</span>
                    {isSelected && (
                      <span className="selection-tag" aria-label={`${name} selected`}>
                        Selected
                      </span>
                    )}
                  </div>
                </div>

                {programmeLine && (
                  <p className="specialization-card__program">{programmeLine}</p>
                )}

                <p className="specialization-card__description">{summary}</p>

                <div className="specialization-card__stats-grid">
                  <div className="specialization-stat">
                    <span className="stat-label">Year 3 modules</span>
                    <span className="stat-value">{year3Count}</span>
                  </div>
                  <div className="specialization-stat">
                    <span className="stat-label">Year 4 modules</span>
                    <span className="stat-value">{year4Count}</span>
                  </div>
                </div>

               
              </div>
            );
          })}
        </div>
      )}

      {loadingModules && (
        <div className="loading-inline">Loading modules…</div>
      )}

      <div className="section-footer split">
        <button onClick={prevStep} className="btn-secondary">
          ← Back to Years 1-2
        </button>
        <button
          onClick={nextStep}
          disabled={!specialization || loadingModules}
          className="btn-primary"
        >
          Continue to Years 3-4 →
        </button>
      </div>

      {!specialization && (
        <p className="footnote warning">Please select a specialization to continue.</p>
      )}
    </div>
  );
};

export default SpecializationSelector;
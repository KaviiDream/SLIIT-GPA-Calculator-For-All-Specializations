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

  const handleSelectSpecialization = async (spec) => {
    setLoadingModules(true);
    try {
      // Load modules for this specialization
      const lookupKey = spec._id || spec.specializationCode || spec.specializationNamme || spec.name;
      const data = await getSpecializationModules(lookupKey);
      
      setSpecialization(spec);
      setSpecializationModules({
        year3: data.year3Modules || [],
        year4: data.year4Modules || []
      });
    } catch (err) {
      console.error('Failed to load specialization modules:', err);
      alert('Failed to load modules for this specialization. Please try again.');
    } finally {
      setLoadingModules(false);
    }
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

      <div className="search-stack">
        <input
          type="text"
          placeholder="Search specializations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredSpecializations.length === 0 ? (
        <div className="empty-state">No specializations match your search.</div>
      ) : (
        <div className="specialization-grid">
          {filteredSpecializations.map((spec) => {
            const code = spec.specializationCode || 'N/A';
            const name = spec.name || spec.specializationNamme || 'Unnamed Specialization';
            const isSelected = specialization?.specializationCode === spec.specializationCode;

            return (
              <div
                key={code}
                className={`specialization-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelectSpecialization(spec)}
              >
                <div className="specialization-card__header">
                  <div>
                    <h3>{name}</h3>
                    <span className="code">{code}</span>
                  </div>
                  {isSelected && <span className="chip success">Selected</span>}
                </div>
                <p className="description">
                  {spec.description || 'No description available.'}
                </p>
                <div className="specialization-card__meta">
                  <span>📚 Year 3: {spec.year3Modules?.length || 0}</span>
                  <span>🎓 Year 4: {spec.year4Modules?.length || 0}</span>
                </div>
                <div className="specialization-card__foot">
                  Min credits Y3 ({spec.minCreditsYear3}) · Y4 ({spec.minCreditsYear4})
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
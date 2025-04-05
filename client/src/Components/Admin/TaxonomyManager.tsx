import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import '../../styles/TaxonomyManager.css';

// Define interfaces for the taxonomy entities
interface Domain {
  domainId: number;
  name: string;
}

interface Theme {
  themeId: number;
  name: string;
  domainId: number;
}

interface SubTheme {
  subThemeId: number;
  name: string;
  themeId: number;
}

const TaxonomyManager: React.FC = () => {
  // State for domains, themes, subthemes
  const [domains, setDomains] = useState<Domain[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  
  // State for selected items
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  
  // State for new items
  const [newDomainName, setNewDomainName] = useState('');
  const [newThemeName, setNewThemeName] = useState('');
  const [newSubThemeName, setNewSubThemeName] = useState('');
  
  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load domains when component mounts
  useEffect(() => {
    loadDomains();
  }, []);

  // Load themes when a domain is selected
  useEffect(() => {
    if (selectedDomain) {
      loadThemes(selectedDomain.domainId);
    } else {
      setThemes([]);
      setSelectedTheme(null);
    }
  }, [selectedDomain]);

  // Load subthemes when a theme is selected
  useEffect(() => {
    if (selectedTheme) {
      loadSubThemes(selectedTheme.themeId);
    } else {
      setSubThemes([]);
    }
  }, [selectedTheme]);

  // Load domains from API
  const loadDomains = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<Domain[]>('/api/taxonomy/domains');
      setDomains(response.data);
    } catch (err) {
      console.error('Error loading domains:', err);
      setError('Failed to load domains. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load themes for a specific domain
  const loadThemes = async (domainId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<Theme[]>(`/api/taxonomy/themes?domainId=${domainId}`);
      setThemes(response.data);
    } catch (err) {
      console.error('Error loading themes:', err);
      setError('Failed to load themes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load subthemes for a specific theme
  const loadSubThemes = async (themeId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<SubTheme[]>(`/api/taxonomy/subthemes?themeId=${themeId}`);
      setSubThemes(response.data);
    } catch (err) {
      console.error('Error loading subthemes:', err);
      setError('Failed to load subthemes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new domain
  const createDomain = async (): Promise<void> => {
    if (!newDomainName.trim()) {
      setError('Domain name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/taxonomy/domains', { name: newDomainName });
      setNewDomainName('');
      loadDomains();
    } catch (err) {
      console.error('Error creating domain:', err);
      setError('Failed to create domain. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new theme
  const createTheme = async (): Promise<void> => {
    if (!selectedDomain) {
      setError('Please select a domain first');
      return;
    }

    if (!newThemeName.trim()) {
      setError('Theme name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/taxonomy/themes', { 
        name: newThemeName,
        domainId: selectedDomain.domainId
      });
      setNewThemeName('');
      loadThemes(selectedDomain.domainId);
    } catch (err) {
      console.error('Error creating theme:', err);
      setError('Failed to create theme. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new subtheme
  const createSubTheme = async (): Promise<void> => {
    if (!selectedTheme) {
      setError('Please select a theme first');
      return;
    }

    if (!newSubThemeName.trim()) {
      setError('SubTheme name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/taxonomy/subthemes', { 
        name: newSubThemeName,
        themeId: selectedTheme.themeId
      });
      setNewSubThemeName('');
      loadSubThemes(selectedTheme.themeId);
    } catch (err) {
      console.error('Error creating subtheme:', err);
      setError('Failed to create subtheme. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers for each taxonomy level
  const deleteDomain = async (domainId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this domain?')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/taxonomy/domains/${domainId}`);
      setSelectedDomain(null);
      loadDomains();
    } catch (err) {
      console.error('Error deleting domain:', err);
      const axiosError = err as AxiosError;
      if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
        setError(axiosError.response.data.message as string);
      } else {
        setError('Failed to delete domain. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete theme handler
  const deleteTheme = async (themeId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/taxonomy/themes/${themeId}`);
      setSelectedTheme(null);
      if (selectedDomain) {
        loadThemes(selectedDomain.domainId);
      }
    } catch (err) {
      console.error('Error deleting theme:', err);
      const axiosError = err as AxiosError;
      if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
        setError(axiosError.response.data.message as string);
      } else {
        setError('Failed to delete theme. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete subtheme handler
  const deleteSubTheme = async (subThemeId: number): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this sub-theme?')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/taxonomy/subthemes/${subThemeId}`);
      if (selectedTheme) {
        loadSubThemes(selectedTheme.themeId);
      }
    } catch (err) {
      console.error('Error deleting sub-theme:', err);
      const axiosError = err as AxiosError;
      if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
        setError(axiosError.response.data.message as string);
      } else {
        setError('Failed to delete sub-theme. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render the component
  return (
    <div className="taxonomy-manager">
      <h2>Manage Taxonomy</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="taxonomy-container">
        {/* Domain Management */}
        <div className="taxonomy-section">
          <h3>Domains</h3>
          
          <div className="add-item-form">
            <input 
              type="text"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              placeholder="New domain name"
              disabled={loading}
            />
            <button 
              onClick={createDomain}
              disabled={loading || !newDomainName.trim()}
            >
              Add Domain
            </button>
          </div>
          
          <div className="taxonomy-list">
            {domains.map(domain => (
              <div 
                key={domain.domainId} 
                className={`taxonomy-item ${selectedDomain && selectedDomain.domainId === domain.domainId ? 'selected' : ''}`}
                onClick={() => setSelectedDomain(domain)}
              >
                <span>{domain.name}</span>
                <button 
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDomain(domain.domainId);
                  }}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            ))}
            
            {domains.length === 0 && !loading && (
              <div className="no-items">No domains available</div>
            )}
            
            {loading && domains.length === 0 && (
              <div className="loading">Loading domains...</div>
            )}
          </div>
        </div>
        
        {/* Theme Management */}
        <div className="taxonomy-section">
          <h3>Themes</h3>
          
          <div className="add-item-form">
            <input 
              type="text"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="New theme name"
              disabled={loading || !selectedDomain}
            />
            <button 
              onClick={createTheme}
              disabled={loading || !selectedDomain || !newThemeName.trim()}
            >
              Add Theme
            </button>
          </div>
          
          <div className="taxonomy-list">
            {themes.map(theme => (
              <div 
                key={theme.themeId} 
                className={`taxonomy-item ${selectedTheme && selectedTheme.themeId === theme.themeId ? 'selected' : ''}`}
                onClick={() => setSelectedTheme(theme)}
              >
                <span>{theme.name}</span>
                <button 
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTheme(theme.themeId);
                  }}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            ))}
            
            {selectedDomain && themes.length === 0 && !loading && (
              <div className="no-items">No themes available for this domain</div>
            )}
            
            {!selectedDomain && (
              <div className="info-message">Select a domain to view themes</div>
            )}
            
            {loading && selectedDomain && themes.length === 0 && (
              <div className="loading">Loading themes...</div>
            )}
          </div>
        </div>
        
        {/* SubTheme Management */}
        <div className="taxonomy-section">
          <h3>Sub-Themes</h3>
          
          <div className="add-item-form">
            <input 
              type="text"
              value={newSubThemeName}
              onChange={(e) => setNewSubThemeName(e.target.value)}
              placeholder="New sub-theme name"
              disabled={loading || !selectedTheme}
            />
            <button 
              onClick={createSubTheme}
              disabled={loading || !selectedTheme || !newSubThemeName.trim()}
            >
              Add Sub-Theme
            </button>
          </div>
          
          <div className="taxonomy-list">
            {subThemes.map(subTheme => (
              <div 
                key={subTheme.subThemeId} 
                className="taxonomy-item"
              >
                <span>{subTheme.name}</span>
                <button 
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSubTheme(subTheme.subThemeId);
                  }}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            ))}
            
            {selectedTheme && subThemes.length === 0 && !loading && (
              <div className="no-items">No sub-themes available for this theme</div>
            )}
            
            {!selectedTheme && (
              <div className="info-message">Select a theme to view sub-themes</div>
            )}
            
            {loading && selectedTheme && subThemes.length === 0 && (
              <div className="loading">Loading sub-themes...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxonomyManager;
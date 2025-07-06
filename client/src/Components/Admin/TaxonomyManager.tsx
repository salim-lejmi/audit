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

// Interface for API error response
interface ApiErrorResponse {
  message: string;
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
  
  // State for editing
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [editingSubTheme, setEditingSubTheme] = useState<SubTheme | null>(null);
  const [editDomainName, setEditDomainName] = useState('');
  const [editThemeName, setEditThemeName] = useState('');
  const [editSubThemeName, setEditSubThemeName] = useState('');
  
  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to extract error message from API response
  const getErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      if (axiosError.response?.status === 403) {
        return "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
      }
      if (axiosError.response?.status === 401) {
        return "Vous devez être connecté pour effectuer cette action.";
      }
    }
    return "Une erreur inattendue s'est produite. Veuillez réessayer.";
  };

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
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Create a new domain
  const createDomain = async (): Promise<void> => {
    if (!newDomainName.trim()) {
      setError('Le nom du domaine ne peut pas être vide');
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Create a new theme
  const createTheme = async (): Promise<void> => {
    if (!selectedDomain) {
      setError('Veuillez d\'abord sélectionner un domaine');
      return;
    }

    if (!newThemeName.trim()) {
      setError('Le nom du thème ne peut pas être vide');
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Create a new subtheme
  const createSubTheme = async (): Promise<void> => {
    if (!selectedTheme) {
      setError('Veuillez d\'abord sélectionner un thème');
      return;
    }

    if (!newSubThemeName.trim()) {
      setError('Le nom du sous-thème ne peut pas être vide');
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Edit handlers
  const startEditDomain = (domain: Domain): void => {
    setEditingDomain(domain);
    setEditDomainName(domain.name);
  };

  const startEditTheme = (theme: Theme): void => {
    setEditingTheme(theme);
    setEditThemeName(theme.name);
  };

  const startEditSubTheme = (subTheme: SubTheme): void => {
    setEditingSubTheme(subTheme);
    setEditSubThemeName(subTheme.name);
  };

  const cancelEdit = (): void => {
    setEditingDomain(null);
    setEditingTheme(null);
    setEditingSubTheme(null);
    setEditDomainName('');
    setEditThemeName('');
    setEditSubThemeName('');
  };

  // Update handlers
  const updateDomain = async (): Promise<void> => {
    if (!editingDomain || !editDomainName.trim()) {
      setError('Le nom du domaine ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.put(`/api/taxonomy/domains/${editingDomain.domainId}`, { 
        name: editDomainName 
      });
      setEditingDomain(null);
      setEditDomainName('');
      loadDomains();
    } catch (err) {
      console.error('Error updating domain:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = async (): Promise<void> => {
    if (!editingTheme || !editThemeName.trim()) {
      setError('Le nom du thème ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.put(`/api/taxonomy/themes/${editingTheme.themeId}`, { 
        name: editThemeName 
      });
      setEditingTheme(null);
      setEditThemeName('');
      if (selectedDomain) {
        loadThemes(selectedDomain.domainId);
      }
    } catch (err) {
      console.error('Error updating theme:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const updateSubTheme = async (): Promise<void> => {
    if (!editingSubTheme || !editSubThemeName.trim()) {
      setError('Le nom du sous-thème ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.put(`/api/taxonomy/subthemes/${editingSubTheme.subThemeId}`, { 
        name: editSubThemeName 
      });
      setEditingSubTheme(null);
      setEditSubThemeName('');
      if (selectedTheme) {
        loadSubThemes(selectedTheme.themeId);
      }
    } catch (err) {
      console.error('Error updating subtheme:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers for each taxonomy level
  const deleteDomain = async (domainId: number): Promise<void> => {
    const domain = domains.find(d => d.domainId === domainId);
    const themesCount = themes.filter(t => t.domainId === domainId).length;
    
    let confirmMessage = `Êtes-vous sûr de vouloir supprimer le domaine "${domain?.name}" ?`;
    if (themesCount > 0) {
      confirmMessage += `\n\nATTENTION: Cela supprimera également tous les thèmes et sous-thèmes associés (${themesCount} thème(s)).`;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/taxonomy/domains/${domainId}`);
      setSelectedDomain(null);
      setSelectedTheme(null);
      loadDomains();
    } catch (err) {
      console.error('Error deleting domain:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Delete theme handler
  const deleteTheme = async (themeId: number): Promise<void> => {
    const theme = themes.find(t => t.themeId === themeId);
    const subThemesCount = subThemes.filter(s => s.themeId === themeId).length;
    
    let confirmMessage = `Êtes-vous sûr de vouloir supprimer le thème "${theme?.name}" ?`;
    if (subThemesCount > 0) {
      confirmMessage += `\n\nATTENTION: Cela supprimera également tous les sous-thèmes associés (${subThemesCount} sous-thème(s)).`;
    }
    
    if (!window.confirm(confirmMessage)) {
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Delete subtheme handler
  const deleteSubTheme = async (subThemeId: number): Promise<void> => {
    const subTheme = subThemes.find(s => s.subThemeId === subThemeId);
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le sous-thème "${subTheme?.name}" ?`)) {
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Render the component
  return (
    <div className="taxonomy-manager">
      <h2>Gérer la taxonomie</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="taxonomy-container">
        {/* Domain Management */}
        <div className="taxonomy-section">
          <h3>Domaines</h3>
          
          <div className="add-item-form">
            <input 
              type="text"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              placeholder="Nouveau nom de domaine"
              disabled={loading}
            />
            <button 
              onClick={createDomain}
              disabled={loading || !newDomainName.trim()}
            >
              Ajouter un domaine
            </button>
          </div>
          
          <div className="taxonomy-list">
            {domains.map(domain => (
              <div 
                key={domain.domainId} 
                className={`taxonomy-item ${selectedDomain && selectedDomain.domainId === domain.domainId ? 'selected' : ''}`}
                onClick={() => setSelectedDomain(domain)}
              >
                {editingDomain && editingDomain.domainId === domain.domainId ? (
                  <div className="edit-form">
                    <input 
                      type="text"
                      value={editDomainName}
                      onChange={(e) => setEditDomainName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={loading}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDomain();
                      }}
                      disabled={loading}
                      className="save-button"
                    >
                      Sauvegarder
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                      disabled={loading}
                      className="cancel-button"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{domain.name}</span>
                    <div className="button-group">
                      <button 
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditDomain(domain);
                        }}
                        disabled={loading}
                      >
                        Modifier
                      </button>
                      <button 
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDomain(domain.domainId);
                        }}
                        disabled={loading}
                      >
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {domains.length === 0 && !loading && (
              <div className="no-items">Aucun domaine disponible</div>
            )}
            
            {loading && domains.length === 0 && (
              <div className="loading">Chargement des domaines...</div>
            )}
          </div>
        </div>
        
        {/* Theme Management */}
        <div className="taxonomy-section">
          <h3>Thèmes</h3>
          
          <div className="add-item-form">
            <input 
              type="text"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="Nouveau nom de thème"
              disabled={loading || !selectedDomain}
            />
            <button 
              onClick={createTheme}
              disabled={loading || !selectedDomain || !newThemeName.trim()}
            >
              Ajouter un thème
            </button>
          </div>
          
          <div className="taxonomy-list">
            {themes.map(theme => (
              <div 
                key={theme.themeId} 
                className={`taxonomy-item ${selectedTheme && selectedTheme.themeId === theme.themeId ? 'selected' : ''}`}
                onClick={() => setSelectedTheme(theme)}
              >
                {editingTheme && editingTheme.themeId === theme.themeId ? (
                  <div className="edit-form">
                    <input 
                      type="text"
                      value={editThemeName}
                      onChange={(e) => setEditThemeName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={loading}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTheme();
                      }}
                      disabled={loading}
                      className="save-button"
                    >
                      Sauvegarder
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                      disabled={loading}
                      className="cancel-button"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{theme.name}</span>
                    <div className="button-group">
                      <button 
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditTheme(theme);
                        }}
                        disabled={loading}
                      >
                        Modifier
                      </button>
                      <button 
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTheme(theme.themeId);
                        }}
                        disabled={loading}
                      >
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {selectedDomain && themes.length === 0 && !loading && (
              <div className="no-items">Aucun thème disponible pour ce domaine</div>
            )}
            
            {!selectedDomain && (
              <div className="info-message">Sélectionnez un domaine pour voir les thèmes</div>
            )}
            
            {loading && selectedDomain && themes.length === 0 && (
              <div className="loading">Chargement des thèmes...</div>
            )}
          </div>
        </div>
        
        {/* SubTheme Management */}
        <div className="taxonomy-section">
          <h3>Sous-thèmes</h3>
          
          <div className="add-item-form">
            <input 
              type="text"
              value={newSubThemeName}
              onChange={(e) => setNewSubThemeName(e.target.value)}
              placeholder="Nouveau nom de sous-thème"
              disabled={loading || !selectedTheme}
            />
            <button 
              onClick={createSubTheme}
              disabled={loading || !selectedTheme || !newSubThemeName.trim()}
            >
              Ajouter un sous-thème
            </button>
          </div>
          
          <div className="taxonomy-list">
            {subThemes.map(subTheme => (
              <div 
                key={subTheme.subThemeId} 
                className="taxonomy-item"
              >
                {editingSubTheme && editingSubTheme.subThemeId === subTheme.subThemeId ? (
                  <div className="edit-form">
                    <input 
                      type="text"
                      value={editSubThemeName}
                      onChange={(e) => setEditSubThemeName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={loading}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSubTheme();
                      }}
                      disabled={loading}
                      className="save-button"
                    >
                      Sauvegarder
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                      disabled={loading}
                      className="cancel-button"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{subTheme.name}</span>
                    <div className="button-group">
                      <button 
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditSubTheme(subTheme);
                        }}
                        disabled={loading}
                      >
                        Modifier
                      </button>
                      <button 
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubTheme(subTheme.subThemeId);
                        }}
                        disabled={loading}
                      >
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {selectedTheme && subThemes.length === 0 && !loading && (
              <div className="no-items">Aucun sous-thème disponible pour ce thème</div>
            )}
            
            {!selectedTheme && (
              <div className="info-message">Sélectionnez un thème pour voir les sous-thèmes</div>
            )}
            
            {loading && selectedTheme && subThemes.length === 0 && (
              <div className="loading">Chargement des sous-thèmes...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxonomyManager;
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import axios from 'axios';
import { 
  TextListItem, Domain, Theme, SubTheme, FilterState, RequirementStatus 
} from '../shared/types';

interface ComplianceTextListProps {
  onSelectText: (text: TextListItem) => void;
}

const ComplianceTextList: React.FC<ComplianceTextListProps> = ({ onSelectText }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [texts, setTexts] = useState<TextListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Filter states
  const [domains, setDomains] = useState<Domain[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    domainId: '',
    themeId: '',
    subThemeId: '',
    nature: '',
    publicationYear: '',
    keyword: ''
  });

  useEffect(() => {
    // Load domains for filters
    const fetchDomains = async () => {
      try {
        const response = await axios.get<Domain[]>('/api/taxonomy/domains');
        setDomains(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des domaines:', error);
      }
    };
    
    fetchDomains();
    loadTexts();
  }, [currentPage]);

  // Fetch texts based on current filters and pagination
  const loadTexts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filters.domainId) params.append('domainId', filters.domainId.toString());
      if (filters.themeId) params.append('themeId', filters.themeId.toString());
      if (filters.subThemeId) params.append('subThemeId', filters.subThemeId.toString());
      if (filters.nature) params.append('nature', filters.nature);
      if (filters.publicationYear) params.append('publicationYear', filters.publicationYear.toString());
      if (filters.keyword) params.append('keyword', filters.keyword);
      
      // Add pagination
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      const response = await axios.get<{
        texts: TextListItem[],
        totalCount: number,
        totalPages: number,
        currentPage: number
      }>(`/api/compliance/texts?${params.toString()}`);
      
      setTexts(response.data.texts || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(response.data.currentPage || 1);
    } catch (error) {
      console.error('Erreur lors de la récupération des textes:', error);
      // Set empty arrays as a fallback
      setTexts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load themes when domain changes
  useEffect(() => {
    if (filters.domainId) {
      const fetchThemes = async () => {
        try {
          const response = await axios.get<Theme[]>(`/api/taxonomy/themes?domainId=${filters.domainId}`);
          setThemes(response.data);
          // Reset theme and subtheme selections
          setFilters(prev => ({ ...prev, themeId: '', subThemeId: '' }));
          setSubThemes([]);
        } catch (error) {
          console.error('Erreur lors de la récupération des thèmes:', error);
        }
      };
      
      fetchThemes();
    } else {
      setThemes([]);
      setSubThemes([]);
      setFilters(prev => ({ ...prev, themeId: '', subThemeId: '' }));
    }
  }, [filters.domainId]);

  // Load subthemes when theme changes
  useEffect(() => {
    if (filters.themeId) {
      const fetchSubThemes = async () => {
        try {
          const response = await axios.get<SubTheme[]>(`/api/taxonomy/subthemes?themeId=${filters.themeId}`);
          setSubThemes(response.data);
          // Reset subtheme selection
          setFilters(prev => ({ ...prev, subThemeId: '' }));
        } catch (error) {
          console.error('Erreur lors de la récupération des sous-thèmes:', error);
        }
      };
      
      fetchSubThemes();
    } else {
      setSubThemes([]);
      setFilters(prev => ({ ...prev, subThemeId: '' }));
    }
  }, [filters.themeId]);

  const handleFilterChange = (name: keyof FilterState, value: string) => {
    if (name === 'domainId') {
      setFilters({
        ...filters,
        [name]: value,
        themeId: '',
        subThemeId: ''
      });
      if (value) {
        loadThemes(value);
      } else {
        setThemes([]);
        setSubThemes([]);
      }
    } 
    else if (name === 'themeId') {
      setFilters({
        ...filters,
        [name]: value,
        subThemeId: ''
      });
      if (value) {
        loadSubThemes(value);
      } else {
        setSubThemes([]);
      }
    }
    else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
  };

  const loadThemes = async (domainId: string) => {
    try {
      const response = await axios.get<Theme[]>(`/api/taxonomy/themes?domainId=${domainId}`);
      setThemes(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des thèmes:', err);
    }
  };

  const loadSubThemes = async (themeId: string) => {
    try {
      const response = await axios.get<SubTheme[]>(`/api/taxonomy/subthemes?themeId=${themeId}`);
      setSubThemes(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des sous-thèmes:', err);
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadTexts();
  };

  const resetFilters = () => {
    setFilters({
      domainId: '',
      themeId: '',
      subThemeId: '',
      nature: '',
      publicationYear: '',
      keyword: ''
    });
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Function to get the counts of each status
  const getStatusCounts = (text: TextListItem): Record<string, number> => {
    const statusMap: Record<string, number> = {
      'applicable': 0,
      'non-applicable': 0,
      'à vérifier': 0,
      'pour information': 0
    };
    
    if (text.requirementsStatuses) {
      text.requirementsStatuses.forEach((s: RequirementStatus) => {
        if (statusMap[s.status.toLowerCase()] !== undefined) {
          statusMap[s.status.toLowerCase()] = s.count;
        }
      });
    }
    
    return statusMap;
  };

  return (
    <div>
      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-row">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par mot-clé, référence..." 
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
            {filters.keyword && (
              <button 
                className="search-clear" 
                onClick={() => handleFilterChange('keyword', '')}
              >
                ×
              </button>
            )}
          </div>
          <button 
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filtres
          </button>
          <button 
            className="btn-primary"
            onClick={applyFilters}
          >
            Rechercher
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Filtres avancés</h3>
              <button className="btn-reset" onClick={resetFilters}>
                <RefreshCw size={16} />
                Réinitialiser
              </button>
            </div>
            
            <div className="filters-grid">
              <div className="form-group">
                <label>Domaine</label>
                <select 
                  value={filters.domainId}
                  onChange={(e) => handleFilterChange('domainId', e.target.value)}
                >
                  <option value="">Tous les domaines</option>
                  {domains.map((domain) => (
                    <option key={domain.domainId} value={domain.domainId.toString()}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Thème</label>
                <select 
                  value={filters.themeId}
                  onChange={(e) => handleFilterChange('themeId', e.target.value)}
                  disabled={!filters.domainId}
                >
                  <option value="">Tous les thèmes</option>
                  {themes.map((theme) => (
                    <option key={theme.themeId} value={theme.themeId.toString()}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Sous-thème</label>
                <select 
                  value={filters.subThemeId}
                  onChange={(e) => handleFilterChange('subThemeId', e.target.value)}
                  disabled={!filters.themeId}
                >
                  <option value="">Tous les sous-thèmes</option>
                  {subThemes.map((subTheme) => (
                    <option key={subTheme.subThemeId} value={subTheme.subThemeId.toString()}>
                      {subTheme.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Nature</label>
                <input 
                  type="text" 
                  value={filters.nature} 
                  onChange={(e) => handleFilterChange('nature', e.target.value)}
                  placeholder="Nature du texte"
                />
              </div>
              
              <div className="form-group">
                <label>Année de publication</label>
                <input 
                  type="number" 
                  value={filters.publicationYear} 
                  onChange={(e) => handleFilterChange('publicationYear', e.target.value)}
                  placeholder="Année"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="results-section">
        <div className="results-info">
          {totalCount > 0 ? `${totalCount} texte${totalCount > 1 ? 's' : ''} trouvé${totalCount > 1 ? 's' : ''}` : 'Aucun résultat'}
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des textes...</p>
          </div>
        ) : texts.length === 0 ? (
          <div className="empty-state">
            <p>Aucun texte trouvé</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thème</th>
                    <th>Sous-thème</th>
                    <th>Référence</th>
                    <th>P/I</th>
                    <th>Statut des Exigences</th>
                    <th>% Applicable</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {texts.map((text) => {
                    const statusCounts = getStatusCounts(text);
                    
                    return (
                      <tr key={text.textId}>
                        <td>{text.theme || '-'}</td>
                        <td>{text.subTheme || '-'}</td>
                        <td>{text.reference}</td>
                        <td>{text.penaltyOrIncentive || '-'}</td>
                        <td>
                          <div className="status-badges">
                            {Object.entries(statusCounts).map(([status, count]) => (
                              count > 0 && (
                                <span 
                                  key={status}
                                  className={`status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}
                                >
                                  {status}: {count}
                                </span>
                              )
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${text.applicablePercentage}%` }}
                            ></div>
                            <span className="progress-text">
                              {text.applicablePercentage}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <button 
                            className="btn-action btn-view"
                            onClick={() => onSelectText(text)}
                            title="Évaluer"
                          >
                            <Eye size={16} />
                            Évaluer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  onClick={() => goToPage(1)} 
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft size={16} />
                </button>
                <button 
                  className="page-btn"
                  onClick={() => goToPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="page-info">
                  Page {currentPage} sur {totalPages}
                </span>
                
                <button 
                  className="page-btn"
                  onClick={() => goToPage(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
                <button 
                  className="page-btn"
                  onClick={() => goToPage(totalPages)} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ComplianceTextList;
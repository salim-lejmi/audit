import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import '../../styles/TextManagement.css';
import TextModal from './TextModal';
import AddTextModal from './AddTextModal';

interface Text {
  textId: number;
  domain: string;
  theme: string;
  subTheme: string;
  reference: string;
  nature: string;
  publicationYear: number;
  status: string;
  isConsulted: boolean;
  createdAt: string;
  createdBy: string;
  companyId?: number; 
  companyName?: string;
}
  
interface TextFilters {
  domainId: number | null;
  themeId: number | null;
  subThemeId: number | null;
  nature: string;
  publicationYear: number | null;
  keyword: string;
  status: string;
  textType: string;
}

interface DomainOption {
  domainId: number;
  name: string;
}

interface ThemeOption {
  themeId: number;
  name: string;
}

interface SubThemeOption {
  subThemeId: number;
  name: string;
}

const TextManagement: React.FC = () => {
  const navigate = useNavigate();
  const [texts, setTexts] = useState<Text[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [selectedText, setSelectedText] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const [filters, setFilters] = useState<TextFilters>({
    domainId: null,
    themeId: null,
    subThemeId: null,
    nature: '',
    publicationYear: null,
    keyword: '',
    status: '',
    textType: ''
  });

  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [subThemes, setSubThemes] = useState<SubThemeOption[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/verify');
        setUserRole(response.data.role);
      } catch {
        navigate('/', { replace: true });
      }
    };

    checkAuth();
    loadDomains();
    loadTexts();
  }, [navigate, currentPage]);

  const loadDomains = async () => {
    try {
      const response = await axios.get('/api/taxonomy/domains');
      setDomains(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des domaines:', err);
    }
  };

  const loadThemes = async (domainId: number) => {
    try {
      const response = await axios.get(`/api/taxonomy/themes?domainId=${domainId}`);
      setThemes(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des thèmes:', err);
    }
  };

  const loadSubThemes = async (themeId: number) => {
    try {
      const response = await axios.get(`/api/taxonomy/subthemes?themeId=${themeId}`);
      setSubThemes(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des sous-thèmes:', err);
    }
  };

  const loadTexts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.domainId) params.append('domainId', filters.domainId.toString());
      if (filters.themeId) params.append('themeId', filters.themeId.toString());
      if (filters.subThemeId) params.append('subThemeId', filters.subThemeId.toString());
      if (filters.nature) params.append('nature', filters.nature);
      if (filters.publicationYear) params.append('publicationYear', filters.publicationYear.toString());
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.status) params.append('status', filters.status);
      if (filters.textType) params.append('textType', filters.textType);
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());

      const response = await axios.get(`/api/texts?${params.toString()}`);
      setTexts(response.data.texts);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (err) {
      setError('Échec du chargement des textes. Veuillez réessayer plus tard.');
      console.error('Erreur lors du chargement des textes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: keyof TextFilters, value: string | number | null) => {
    if (name === 'domainId') {
      setFilters({
        ...filters,
        [name]: value as number,
        themeId: null,
        subThemeId: null
      });
      if (value) {
        loadThemes(value as number);
      } else {
        setThemes([]);
        setSubThemes([]);
      }
    } 
    else if (name === 'themeId') {
      setFilters({
        ...filters,
        [name]: value as number,
        subThemeId: null
      });
      if (value) {
        loadSubThemes(value as number);
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

  const applyFilters = () => {
    setCurrentPage(1);
    loadTexts();
  };

  const resetFilters = () => {
    setFilters({
      domainId: null,
      themeId: null,
      subThemeId: null,
      nature: '',
      publicationYear: null,
      keyword: '',
      status: '',
      textType: ''
    });
    setCurrentPage(1);
    loadTexts();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const openTextDetail = (textId: number) => {
    setSelectedText(textId);
  };

  const closeTextDetail = () => {
    setSelectedText(null);
    loadTexts();
  };

  const handleDeleteText = async (textId: number) => {
    if (userRole !== 'SuperAdmin' && userRole !== 'SubscriptionManager') {
      alert('Seuls les super administrateurs et les gestionnaires d\'abonnement peuvent supprimer des textes.');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce texte ? Cette action est irréversible.')) {
      try {
        await axios.delete(`/api/texts/${textId}`);
        alert('Texte supprimé avec succès');
        loadTexts();
      } catch (err) {
        alert('Échec de la suppression du texte. Veuillez réessayer.');
        console.error('Erreur lors de la suppression du texte:', err);
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Gestion des textes</h1>
    
      </div>

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
              <div className="header-actions">
          {(userRole === 'SubscriptionManager') && (
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={18} />
              Nouveau texte
            </button>
          )}
        </div>
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
                  value={filters.domainId || ''}
                  onChange={(e) => handleFilterChange('domainId', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Tous les domaines</option>
                  {domains.map((domain) => (
                    <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Thème</label>
                <select 
                  value={filters.themeId || ''}
                  onChange={(e) => handleFilterChange('themeId', e.target.value ? Number(e.target.value) : null)}
                  disabled={!filters.domainId}
                >
                  <option value="">Tous les thèmes</option>
                  {themes.map((theme) => (
                    <option key={theme.themeId} value={theme.themeId}>{theme.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Sous-thème</label>
                <select 
                  value={filters.subThemeId || ''}
                  onChange={(e) => handleFilterChange('subThemeId', e.target.value ? Number(e.target.value) : null)}
                  disabled={!filters.themeId}
                >
                  <option value="">Tous les sous-thèmes</option>
                  {subThemes.map((subTheme) => (
                    <option key={subTheme.subThemeId} value={subTheme.subThemeId}>{subTheme.name}</option>
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
                  value={filters.publicationYear || ''} 
                  onChange={(e) => handleFilterChange('publicationYear', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Année"
                />
              </div>
              
              <div className="form-group">
                <label>Statut</label>
                <select 
                  value={filters.status} 
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  <option value="À vérifier">À vérifier</option>
                  <option value="Applicable">Applicable</option>
                  <option value="Non applicable">Non applicable</option>
                  <option value="Pour information">Pour information</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Type de texte</label>
                <select 
                  value={filters.textType} 
                  onChange={(e) => handleFilterChange('textType', e.target.value)}
                >
                  <option value="">Tous les types</option>
                  <option value="À vérifier">Textes à vérifier</option>
                  <option value="Pour information">Textes informatifs</option>
                </select>
              </div>
            </div>
            
            <div className="filters-actions">
              <button className="btn-apply" onClick={applyFilters}>
                Appliquer les filtres
              </button>
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
            <p>Chargement...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
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
                    {userRole === 'SuperAdmin' && <th>Entreprise</th>}
                    <th>Domaine</th>
                    <th>Thème</th>
                    <th>Référence</th>
                    <th>Nature</th>
                    <th>Année</th>
                    <th>Statut</th>
                    <th>Créé par</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {texts.map((text) => (
                    <tr key={text.textId} className={text.isConsulted ? 'consulted' : ''}>
                      {userRole === 'SuperAdmin' && <td>{text.companyName}</td>}
                      <td>{text.domain}</td>
                      <td>{text.theme}</td>
                      <td>{text.reference}</td>
                      <td>{text.nature}</td>
                      <td>{text.publicationYear}</td>
                      <td>
                        <span className={`status-badge status-${text.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {text.status}
                        </span>
                      </td>
                      <td>{text.createdBy}</td>
                      <td>
                        <button 
                          className="btn-action btn-view" 
                          onClick={() => openTextDetail(text.textId)}
                          title="Consulter"
                        >
                          <Eye size={16} />
                        </button>
                        {(userRole === 'SuperAdmin' || userRole === 'SubscriptionManager') && (
                          <button 
                            className="btn-action btn-delete" 
                            onClick={() => handleDeleteText(text.textId)}
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
      
      {selectedText && (
        <TextModal 
          textId={selectedText} 
          onClose={closeTextDetail}
          userRole={userRole} 
        />
      )}
      
      {showAddModal && (
        <AddTextModal 
          onClose={() => setShowAddModal(false)}
          onTextAdded={loadTexts}
        />
      )}
    </div>
  );
};

export default TextManagement;
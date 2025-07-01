import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

// Type definitions for dropdown options
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
  
  // Filter states
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

  // Domain, theme, subtheme options for dropdown
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [subThemes, setSubThemes] = useState<SubThemeOption[]>([]);

  useEffect(() => {
    // Check user authentication and get role
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

  // Load domain options
  const loadDomains = async () => {
    try {
      const response = await axios.get('/api/taxonomy/domains');
      setDomains(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des domaines:', err);
    }
  };

  // Load theme options based on selected domain
  const loadThemes = async (domainId: number) => {
    try {
      const response = await axios.get(`/api/taxonomy/themes?domainId=${domainId}`);
      setThemes(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des thèmes:', err);
    }
  };

  // Load subtheme options based on selected theme
  const loadSubThemes = async (themeId: number) => {
    try {
      const response = await axios.get(`/api/taxonomy/subthemes?themeId=${themeId}`);
      setSubThemes(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des sous-thèmes:', err);
    }
  };

  // Load texts with filters and pagination
  const loadTexts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
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

  // Handle filter changes
  const handleFilterChange = (name: keyof TextFilters, value: string | number | null) => {
    // Special handling for domain change
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
    // Special handling for theme change
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
    // Default handling for other filters
    else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    loadTexts();
  };

  // Reset filters
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

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Open text detail modal
  const openTextDetail = (textId: number) => {
    setSelectedText(textId);
  };

  // Close text detail modal
  const closeTextDetail = () => {
    setSelectedText(null);
    // Reload texts to update isConsulted status
    loadTexts();
  };

  // Delete text handler
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
    <div className="text-management-container">
      <h1>Gestion des textes</h1>
      
      {/* Filter section */}
      <div className="filters-container">
        <h2>Filtres</h2>
        <div className="filters-grid">
          <div className="filter-item">
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
          
          <div className="filter-item">
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
          
          <div className="filter-item">
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
          
          <div className="filter-item">
            <label>Nature</label>
            <input 
              type="text" 
              value={filters.nature} 
              onChange={(e) => handleFilterChange('nature', e.target.value)}
              placeholder="Entrer la nature"
            />
          </div>
          
          <div className="filter-item">
            <label>Année de publication</label>
            <input 
              type="number" 
              value={filters.publicationYear || ''} 
              onChange={(e) => handleFilterChange('publicationYear', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Entrer l'année"
            />
          </div>
          
          <div className="filter-item">
            <label>Mot-clé</label>
            <input 
              type="text" 
              value={filters.keyword} 
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              placeholder="Rechercher par mot-clé"
            />
          </div>
          
          <div className="filter-item">
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
          
          <div className="filter-item">
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
          <button className="btn-primary" onClick={applyFilters}>Appliquer les filtres</button>
          <button className="btn-secondary" onClick={resetFilters}>Réinitialiser les filtres</button>
          
          {/* Only show Add Text button for SuperAdmin or SubscriptionManager */}
          {(userRole === 'SubscriptionManager') && (
            <button className="btn-add" onClick={() => setShowAddModal(true)}>Ajouter un nouveau texte</button>
          )}
        </div>
      </div>

      {/* Texts table */}
      <div className="texts-table-container">
        <h2>Textes ({totalCount})</h2>
        
        {loading ? (
          <div className="loading">Chargement des textes...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : texts.length === 0 ? (
          <div className="no-results">Aucun texte trouvé correspondant à vos critères.</div>
        ) : (
          <>
            <table className="texts-table">
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
                    <td className="actions-cell">
                      <button 
                        className="btn-view" 
                        onClick={() => openTextDetail(text.textId)}
                        title="Voir les détails du texte"
                      >
                        Consulter
                      </button>
                      {(userRole === 'SuperAdmin' || userRole === 'SubscriptionManager') && (
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDeleteText(text.textId)}
                          title="Supprimer le texte"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="pagination">
              <button 
                onClick={() => goToPage(1)} 
                disabled={currentPage === 1}
              >
                «
              </button>
              <button 
                onClick={() => goToPage(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                ‹
              </button>
              
              <span className="page-info">
                Page {currentPage} sur {totalPages}
              </span>
              
              <button 
                onClick={() => goToPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                ›
              </button>
              <button 
                onClick={() => goToPage(totalPages)} 
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Text Detail Modal */}
      {selectedText && (
        <TextModal 
          textId={selectedText} 
          onClose={closeTextDetail}
          userRole={userRole} 
        />
      )}
      
      {/* Add Text Modal */}
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
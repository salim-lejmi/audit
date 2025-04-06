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
      } catch  {
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
      console.error('Error loading domains:', err);
    }
  };

  // Load theme options based on selected domain
  const loadThemes = async (domainId: number) => {
    try {
      const response = await axios.get(`/api/taxonomy/themes?domainId=${domainId}`);
      setThemes(response.data);
    } catch (err) {
      console.error('Error loading themes:', err);
    }
  };

  // Load subtheme options based on selected theme
  const loadSubThemes = async (themeId: number) => {
    try {
      const response = await axios.get(`/api/taxonomy/subthemes?themeId=${themeId}`);
      setSubThemes(response.data);
    } catch (err) {
      console.error('Error loading subthemes:', err);
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
      setError('Failed to load texts. Please try again later.');
      console.error('Error loading texts:', err);
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
    if (userRole !== 'SuperAdmin') {
      alert('Only Super Administrators can delete texts.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this text? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/texts/${textId}`);
        alert('Text deleted successfully');
        loadTexts();
      } catch (err) {
        alert('Failed to delete text. Please try again.');
        console.error('Error deleting text:', err);
      }
    }
  };

  return (
    <div className="text-management-container">
      <h1>Text Management</h1>
      
      {/* Filter section */}
      <div className="filters-container">
        <h2>Filters</h2>
        <div className="filters-grid">
          <div className="filter-item">
            <label>Domain</label>
            <select 
              value={filters.domainId || ''}
              onChange={(e) => handleFilterChange('domainId', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label>Theme</label>
            <select 
              value={filters.themeId || ''}
              onChange={(e) => handleFilterChange('themeId', e.target.value ? Number(e.target.value) : null)}
              disabled={!filters.domainId}
            >
              <option value="">All Themes</option>
              {themes.map((theme) => (
                <option key={theme.themeId} value={theme.themeId}>{theme.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <label>Sub-Theme</label>
            <select 
              value={filters.subThemeId || ''}
              onChange={(e) => handleFilterChange('subThemeId', e.target.value ? Number(e.target.value) : null)}
              disabled={!filters.themeId}
            >
              <option value="">All Sub-Themes</option>
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
              placeholder="Enter nature"
            />
          </div>
          
          <div className="filter-item">
            <label>Publication Year</label>
            <input 
              type="number" 
              value={filters.publicationYear || ''} 
              onChange={(e) => handleFilterChange('publicationYear', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Enter year"
            />
          </div>
          
          <div className="filter-item">
            <label>Keyword</label>
            <input 
              type="text" 
              value={filters.keyword} 
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              placeholder="Search by keyword"
            />
          </div>
          
          <div className="filter-item">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="À vérifier">À vérifier</option>
              <option value="Applicable">Applicable</option>
              <option value="Non applicable">Non applicable</option>
              <option value="Pour information">Pour information</option>
            </select>
          </div>
          
          <div className="filter-item">
            <label>Text Type</label>
            <select 
              value={filters.textType} 
              onChange={(e) => handleFilterChange('textType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="À vérifier">Texts to verify</option>
              <option value="Pour information">Informational texts</option>
            </select>
          </div>
        </div>
        
        <div className="filters-actions">
          <button className="btn-primary" onClick={applyFilters}>Apply Filters</button>
          <button className="btn-secondary" onClick={resetFilters}>Reset Filters</button>
          
          {/* Only show Add Text button for SuperAdmin or SubscriptionManager */}
          {(userRole === 'SuperAdmin' || userRole === 'SubscriptionManager') && (
            <button className="btn-add" onClick={() => setShowAddModal(true)}>Add New Text</button>
          )}
        </div>
      </div>

      {/* Texts table */}
      <div className="texts-table-container">
        <h2>Texts ({totalCount})</h2>
        
        {loading ? (
          <div className="loading">Loading texts...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : texts.length === 0 ? (
          <div className="no-results">No texts found matching your criteria.</div>
        ) : (
          <>
            <table className="texts-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Theme</th>
                  <th>Reference</th>
                  <th>Nature</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {texts.map((text) => (
                  <tr key={text.textId} className={text.isConsulted ? 'consulted' : ''}>
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
                        title="View text details"
                      >
                        Consult
                      </button>
                      
                      {/* Only show Delete button for SuperAdmin */}
                      {userRole === 'SuperAdmin' && (
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDeleteText(text.textId)}
                          title="Delete text"
                        >
                          Delete
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
                &laquo;
              </button>
              <button 
                onClick={() => goToPage(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                &lsaquo;
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={() => goToPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                &rsaquo;
              </button>
              <button 
                onClick={() => goToPage(totalPages)} 
                disabled={currentPage === totalPages}
              >
                &raquo;
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
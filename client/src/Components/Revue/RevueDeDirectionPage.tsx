import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  Calendar,
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import '../../styles/RevueDirection.css';

interface Review {
  revueId: number;
  domainId: number;
  domainName: string;
  reviewDate: string;
  status: string;
  createdAt: string;
  pdfFilePath?: string;
}

interface Domain {
  domainId: number;
  name: string;
}

interface ReviewFilters {
  domainId: number | null;
  reviewDate: string;
}

const RevueDeDirectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [userRole, setUserRole] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newReview, setNewReview] = useState({ domainId: 0, reviewDate: '' });
  const [editReview, setEditReview] = useState<Review | null>(null);
  
  const [filters, setFilters] = useState<ReviewFilters>({
    domainId: null,
    reviewDate: '',
  });

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
    loadReviews();
  }, [navigate, currentPage]);

  const loadDomains = async () => {
    try {
      const response = await axios.get('/api/taxonomy/domains');
      setDomains(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des domaines:', err);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.domainId) params.append('domainId', filters.domainId.toString());
      if (filters.reviewDate) params.append('lastReviewDate', filters.reviewDate);
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());

      const response = await axios.get(`/api/revue?${params.toString()}`);
      setReviews(response.data);
      setTotalCount(response.data.length);
      setTotalPages(Math.ceil(response.data.length / pageSize));
    } catch (err) {
      setError('Échec du chargement des revues. Veuillez réessayer plus tard.');
      console.error('Erreur lors du chargement des revues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: keyof ReviewFilters, value: string | number | null) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadReviews();
  };

  const resetFilters = () => {
    setFilters({
      domainId: null,
      reviewDate: '',
    });
    setCurrentPage(1);
    loadReviews();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCreateReview = async () => {
    if (newReview.domainId === 0 || !newReview.reviewDate) {
      alert('Veuillez sélectionner un domaine et définir une date de revue');
      return;
    }
    
    try {
      await axios.post('/api/revue', newReview);
      setShowCreateModal(false);
      setNewReview({ domainId: 0, reviewDate: '' });
      loadReviews();
    } catch (err) {
      console.error('Create review error:', err);
      if (err.response) {
        alert(`Échec de la création de la revue : ${err.response.status} - ${err.response.data?.message || JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        alert('Échec de la création de la revue : aucune réponse du serveur');
      } else {
        alert(`Échec de la création de la revue : ${err.message}`);
      }
    }
  };

  const handleEditReview = async () => {
    if (!editReview || !editReview.reviewDate) {
      alert('Veuillez définir une date de revue');
      return;
    }
    
    try {
      await axios.put(`/api/revue/${editReview.revueId}`, {
        reviewDate: editReview.reviewDate,
        status: editReview.status
      });
      setShowEditModal(false);
      setEditReview(null);
      loadReviews();
    } catch (err) {
      alert('Échec de la mise à jour de la revue');
      console.error('Update review error:', err);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette revue ?')) return;
    
    try {
      await axios.delete(`/api/revue/${id}`);
      loadReviews();
    } catch (err) {
      alert('Échec de la suppression de la revue');
      console.error('Delete review error:', err);
    }
  };

  const canCreateDelete = () => {
    return userRole === 'SubscriptionManager';
  };

  const canEdit = () => {
    return userRole === 'SubscriptionManager' || userRole === 'Auditor';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Revue de Direction</h1>
      </div>

      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-row">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher une revue..." 
              value=""
              onChange={() => {}}
              disabled
            />
          </div>
          <button 
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filtres
          </button>
          <div className="header-actions">
            {canCreateDelete() && (
              <button 
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Nouvelle revue
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
                <label>Date de revue</label>
                <input 
                  type="date" 
                  value={filters.reviewDate} 
                  onChange={(e) => handleFilterChange('reviewDate', e.target.value)}
                />
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
          {totalCount > 0 ? `${totalCount} revue${totalCount > 1 ? 's' : ''} trouvée${totalCount > 1 ? 's' : ''}` : 'Aucun résultat'}
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
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <p>Aucune revue trouvée</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Domaine</th>
                    <th>Date de revue</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>PDF</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.revueId}>
                      <td>{review.revueId}</td>
                      <td>{review.domainName}</td>
                      <td>{formatDate(review.reviewDate)}</td>
                      <td>
                        <span className={`status-badge status-${review.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {review.status}
                        </span>
                      </td>
                      <td>{formatDate(review.createdAt)}</td>
                      <td>
                        {review.pdfFilePath ? (
                          <a 
                            href={review.pdfFilePath} 
                            download 
                            className="pdf-link"
                          >
                            <FileText size={16} />
                            Télécharger
                          </a>
                        ) : (
                          <span className="no-pdf">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="btn-action btn-view" 
                            onClick={() => navigate(`${review.revueId}`)}
                            title="Voir"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit() && (userRole === 'SubscriptionManager') && (
                            <button 
                              className="btn-action btn-edit" 
                              onClick={() => { setEditReview(review); setShowEditModal(true); }}
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canCreateDelete() && (
                            <button 
                              className="btn-action btn-delete" 
                              onClick={() => handleDeleteReview(review.revueId)}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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

      {/* Create Review Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer une nouvelle revue</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Domaine</label>
                <select
                  value={newReview.domainId}
                  onChange={(e) => setNewReview({ ...newReview, domainId: parseInt(e.target.value) })}
                >
                  <option value={0}>Sélectionner un domaine</option>
                  {domains.map((domain) => (
                    <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date de revue</label>
                <div className="date-input-wrapper">
                  <input
                    type="date"
                    value={newReview.reviewDate}
                    onChange={(e) => setNewReview({ ...newReview, reviewDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleCreateReview}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditModal && editReview && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier la revue</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Domaine</label>
                <select
                  value={editReview.domainId}
                  disabled
                >
                  {domains.map((domain) => (
                    <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date de revue</label>
                <div className="date-input-wrapper">
                  <input
                    type="date"
                    value={editReview.reviewDate.split('T')[0]}
                    onChange={(e) => setEditReview({ ...editReview, reviewDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleEditReview}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevueDeDirectionPage;
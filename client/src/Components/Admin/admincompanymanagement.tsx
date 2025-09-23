import React, { useState, useEffect } from 'react';
import { Button, Form, Badge } from 'react-bootstrap';
import Modal from '../shared/modal';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Trash2
} from 'lucide-react';
import '../../styles/admincompanymanagement.css';

interface Company {
  companyId: number;
  companyName: string;
  industry: string;
  status: string;
  createdAt: string;
  isEmailVerified: boolean;
  totalUsers: number;
  totalTexts: number;
  totalActions: number;
  subscriptionManagerName: string;
  subscriptionManagerEmail: string;
}

interface UpdateCompanyForm {
  companyName: string;
  industry: string;
  status: string;
}

const AdminCompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [showFilters, setShowFilters] = useState(false);

  const [editForm, setEditForm] = useState<UpdateCompanyForm>({
    companyName: '',
    industry: '',
    status: ''
  });

  const availableStatuses = ['En attente', 'Approuvé', 'Rejeté'];

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/companies/detailed');
      setCompanies(response.data);
      setLoading(false);
    } catch {
      setError('Échec du chargement des entreprises');
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    try {
      await axios.put(`/api/admin/companies/${selectedCompany.companyId}`, editForm);
      setShowEditModal(false);
      fetchCompanies();
    } catch {
      setError('Échec de la mise à jour de l\'entreprise');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCompany) return;
    
    try {
      const response = await axios.delete(`/api/admin/companies/${selectedCompany.companyId}`);
      setShowDeleteModal(false);
      fetchCompanies();
      
      if (response.data.deletedCounts) {
        const counts = response.data.deletedCounts;
        alert(`Entreprise supprimée avec succès !\nSupprimé : ${counts.users} utilisateurs, ${counts.texts} textes, ${counts.actions} actions`);
      }
    } catch {
      setError('Échec de la suppression de l\'entreprise');
    }
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setEditForm({
      companyName: company.companyName,
      industry: company.industry,
      status: company.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (company: Company) => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'Approuvé' ? 'success' : 
                   status === 'En attente' ? 'warning' : 'danger';
    return <Badge bg={variant}>{status}</Badge>;
  };

  const applyFilters = () => {
    fetchCompanies();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('Tous');
    fetchCompanies();
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.subscriptionManagerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.subscriptionManagerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Tous' || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = ['Tous', ...new Set(companies.map(company => company.status))];

  const editModalFooter = (
    <>
      <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
        Annuler
      </button>
      <button className="btn-primary" type="submit" form="editForm">
        Mettre à jour l'entreprise
      </button>
    </>
  );

  const deleteModalFooter = (
    <>
      <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
        Annuler
      </button>
      <button className="btn-danger" onClick={handleDeleteConfirm}>
        Supprimer l'entreprise
      </button>
    </>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Gestion des entreprises</h1>
      </div>

      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-row">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher des entreprises..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
            {searchTerm && (
              <button 
                className="search-clear" 
                onClick={() => {
                  setSearchTerm('');
                  applyFilters();
                }}
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
                <label>Statut</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
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
          {companies.length > 0 ? `${companies.length} entreprise${companies.length > 1 ? 's' : ''} trouvée${companies.length > 1 ? 's' : ''}` : 'Aucun résultat'}
        </div>
        
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des entreprises...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <p>Aucune entreprise trouvée.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom de l'entreprise</th>
                  <th>Secteur</th>
                  <th>Statut</th>
                  <th>Gestionnaire</th>
                  <th>Utilisateurs</th>
                  <th>Textes</th>
                  <th>Actions</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map(company => (
                  <tr key={company.companyId}>
                    <td>
                      <div>
                        <strong>{company.companyName}</strong>
                        {company.isEmailVerified && (
                          <i className="fas fa-check-circle text-success ms-1" title="Email vérifié"></i>
                        )}
                      </div>
                    </td>
                    <td>{company.industry}</td>
                    <td>{getStatusBadge(company.status)}</td>
                    <td>
                      <div>
                        <div className="fw-bold">{company.subscriptionManagerName || 'N/A'}</div>
                        <small className="text-muted">{company.subscriptionManagerEmail || ''}</small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary">{company.totalUsers}</span>
                    </td>
                    <td>
                      <span className="badge bg-info">{company.totalTexts}</span>
                    </td>
                    <td>
                      <span className="badge bg-warning">{company.totalActions}</span>
                    </td>
                    <td>{new Date(company.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <button 
                        className="btn-action btn-delete" 
                        onClick={() => openDeleteModal(company)}
                        title="Supprimer l'entreprise"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Company Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Modifier l'entreprise"
        footer={editModalFooter}
      >
        <Form id="editForm" onSubmit={handleEditSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nom de l'entreprise</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nom de l'entreprise"
              value={editForm.companyName}
              onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Secteur</Form.Label>
            <Form.Control
              type="text"
              placeholder="Secteur"
              value={editForm.industry}
              onChange={(e) => setEditForm({...editForm, industry: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Statut</Form.Label>
            <Form.Select
              value={editForm.status}
              onChange={(e) => setEditForm({...editForm, status: e.target.value})}
              required
            >
              {availableStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal>

      {/* Delete Company Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Supprimer l'entreprise"
        footer={deleteModalFooter}
        size="sm"
      >
        <div className="delete-confirmation">
          <div className="alert alert-danger">
            <strong>Attention !</strong> Cette action est irréversible.
          </div>
          <p>Êtes-vous sûr de vouloir supprimer <strong>{selectedCompany?.companyName}</strong> ?</p>
          {selectedCompany && (
            <div className="deletion-details">
              <p>Cela supprimera également :</p>
              <ul>
                <li>{selectedCompany.totalUsers} utilisateurs</li>
                <li>{selectedCompany.totalTexts} textes</li>
                <li>{selectedCompany.totalActions} actions</li>
                <li>Toutes les évaluations de conformité, revues et autres données associées</li>
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminCompanyManagement;
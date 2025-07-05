import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Users, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import '../../styles/manageusers.css';
import Modal from '../shared/modal';

interface User {
  userId: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  companyName: string; 
  companyId: number;
  createdAt: string;
}

interface UpdateUserForm {
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
}

const AdminManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('Tous');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [companies, setCompanies] = useState<{companyId: number, companyName: string}[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [editForm, setEditForm] = useState<UpdateUserForm>({
    name: '',
    email: '',
    phoneNumber: '',
    role: ''
  });

  const availableRoles = ['Utilisateur', 'Auditeur', 'Gestionnaire', 'Gestionnaire d\'abonnement'];

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (companyFilter !== 'Tous') params.append('companyId', companyFilter);
      if (roleFilter !== 'Tous') params.append('role', roleFilter);
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      const response = await axios.get(`/api/admin/users?${params.toString()}`);
      setUsers(response.data.users || response.data);
      
      // Handle pagination data if available
      if (response.data.totalCount !== undefined) {
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages || Math.ceil(response.data.totalCount / pageSize));
      } else {
        setTotalCount(response.data.length || 0);
        setTotalPages(Math.ceil((response.data.length || 0) / pageSize));
      }
      
    } catch (err) {
      setError('Échec du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/admin/companies');
      setCompanies(response.data);
    } catch (err) {
      console.error('Échec de la récupération des entreprises', err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      await axios.put(`/api/admin/users/${selectedUser.userId}`, editForm);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError('Échec de la mise à jour de l\'utilisateur');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.delete(`/api/admin/users/${selectedUser.userId}`);
      setShowDeleteModal(false);
      fetchUsers();
    } catch (err) {
      setError('Échec de la suppression de l\'utilisateur');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCompanyFilter('Tous');
    setRoleFilter('Tous');
    setCurrentPage(1);
    fetchUsers();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const filteredUsers = users;
  const uniqueRoles = ['Tous', ...new Set(users.map(user => user.role))];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Gestion des utilisateurs</h1>
      </div>

      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-row">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par nom, email..." 
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
                <label>Entreprise</label>
                <select 
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <option value="Tous">Toutes les entreprises</option>
                  {companies.map(company => (
                    <option key={company.companyId} value={company.companyId.toString()}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Rôle</label>
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
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
          {totalCount > 0 ? `${totalCount} utilisateur${totalCount > 1 ? 's' : ''} trouvé${totalCount > 1 ? 's' : ''}` : 'Aucun résultat'}
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
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Entreprise</th>
                    <th>Rôle</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.userId}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phoneNumber || '-'}</td>
                      <td>{user.companyName}</td>
                      <td>
                        <span className={`status-badge role-${user.role.toLowerCase().replace(/\s+/g, '-')}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                  
                        <button 
                          className="btn-action btn-delete" 
                          onClick={() => openDeleteModal(user)}
                          title="Supprimer"
                          disabled={user.role === "Gestionnaire d'abonnement"}
                        >
                          <Trash2 size={16} />
                        </button>
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
      
   

      {/* Delete User Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Supprimer l'utilisateur"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </button>
            <button className="btn-danger" onClick={handleDeleteConfirm}>
              Supprimer
            </button>
          </>
        }
        size="sm"
      >
        <div className="delete-confirmation">
          <p>Êtes-vous sûr de vouloir supprimer <strong>{selectedUser?.name}</strong> ?</p>
          <p className="warning-text">Cette action est irréversible.</p>
        </div>
      </Modal>
    </div>
  );
};

export default AdminManageUsers;
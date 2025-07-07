import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';
import '../../styles/manageusers.css';
import Modal from '../shared/modal';
import CountryPhoneInput from '../shared/CountryPhoneInput';

interface User {
  userId: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
}

interface CreateUserForm {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'User'
  });

  const [editForm, setEditForm] = useState<Partial<User>>({
    name: '',
    email: '',
    phoneNumber: '',
    role: ''
  });

  const availableRoles = ['User', 'Auditor', 'Manager'];
  const roleLabelMap: Record<string, string> = {
    'User': 'Utilisateur',
    'Auditor': 'Auditeur',
    'Manager': 'Gestionnaire'
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'Tous') params.append('role', roleFilter);
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      const response = await axios.get(`/api/company/users?${params.toString()}`);
      setUsers(response.data.users || response.data);
      
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

  const handleCreatePhoneChange = (phoneValue: string) => {
    setCreateForm({
      ...createForm,
      phoneNumber: phoneValue
    });
  };

  const handleEditPhoneChange = (phoneValue: string) => {
    setEditForm({
      ...editForm,
      phoneNumber: phoneValue
    });
  };

 const handleCreateSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Debug: Log the form data being sent
  console.log('Creating user with data:', createForm);
  
  try {
    const response = await axios.post('/api/company/users', createForm);
    
    // Debug: Log successful response
    console.log('User created successfully:', response.data);
    
    setShowCreateModal(false);
    setCreateForm({
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: 'User'
    });
    fetchUsers();
  } catch (err) {
    // Debug: Log detailed error information
    console.error('Error creating user:', err);
    
    if (axios.isAxiosError(err)) {
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error headers:', err.response?.headers);
      
      // Set more specific error message based on response
      if (err.response?.data?.message) {
        setError(`Échec de la création de l'utilisateur: ${err.response.data.message}`);
      } else if (err.response?.status === 400) {
        setError('Échec de la création de l\'utilisateur: Données invalides');
      } else {
        setError('Échec de la création de l\'utilisateur');
      }
    } else {
      console.error('Non-Axios error:', err);
      setError('Échec de la création de l\'utilisateur');
    }
  }
};

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      await axios.put(`/api/company/users/${selectedUser.userId}`, editForm);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError('Échec de la mise à jour de l\'utilisateur');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.delete(`/api/company/users/${selectedUser.userId}`);
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
    setRoleFilter('Tous');
    setCurrentPage(1);
    fetchUsers();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const uniqueRoles = ['Tous', ...new Set(users.map(user => user.role))];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Gestion des utilisateurs de l'entreprise</h1>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Ajouter un utilisateur
          </button>
        </div>
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
                <label>Rôle</label>
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>
                      {role === 'Tous' ? 'Tous les rôles' : (roleLabelMap[role] || role)}
                    </option>
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
            <p>Aucun utilisateur trouvé. Créez votre premier utilisateur pour commencer.</p>
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
                    <th>Rôle</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.userId}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phoneNumber || '-'}</td>
                      <td>
                        <span className={`status-badge role-${user.role.toLowerCase()}`}>
                          {roleLabelMap[user.role] || user.role}
                        </span>
                      </td>
                      <td>
                        {user.createdAt ? 
                          new Date(user.createdAt).toLocaleDateString('fr-FR') : 
                          <span className="status-badge status-pending">En attente</span>
                        }
                      </td>
                      <td>
                        <button 
                          className="btn-action btn-edit" 
                          onClick={() => openEditModal(user)}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-action btn-delete" 
                          onClick={() => openDeleteModal(user)}
                          title="Supprimer"
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
      
      {/* Create User Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title="Créer un nouvel utilisateur"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
              Annuler
            </button>
            <button className="btn-primary" type="submit" form="createForm">
              Créer un utilisateur
            </button>
          </>
        }
      >
        <form id="createForm" onSubmit={handleCreateSubmit} className="modal-form">
          <div className="form-group">
            <label>Nom</label>
            <input
              type="text"
              placeholder="Nom complet"
              value={createForm.name}
              onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Adresse email"
              value={createForm.email}
              onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Numéro de téléphone</label>
            <CountryPhoneInput
              value={createForm.phoneNumber}
              onChange={handleCreatePhoneChange}
              placeholder="Entrez le numéro"
              required
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="Mot de passe"
              value={createForm.password}
              onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Rôle</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
              required
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {roleLabelMap[role] || role}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Modifier l'utilisateur"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
              Annuler
            </button>
            <button className="btn-primary" type="submit" form="editForm">
              Mettre à jour l'utilisateur
            </button>
          </>
        }
      >
        <form id="editForm" onSubmit={handleEditSubmit} className="modal-form">
          <div className="form-group">
            <label>Nom</label>
            <input
              type="text"
              placeholder="Nom complet"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Adresse email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Numéro de téléphone</label>
            <CountryPhoneInput
              value={editForm.phoneNumber || ''}
              onChange={handleEditPhoneChange}
              placeholder="Entrez le numéro"
              required
            />
          </div>
          <div className="form-group">
            <label>Rôle</label>
            <select
              value={editForm.role || ''}
              onChange={(e) => setEditForm({...editForm, role: e.target.value})}
              required
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {roleLabelMap[role] || role}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

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

export default ManageUsers;
import React, { useState, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import Modal from '../shared/modal';
import axios from 'axios';

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
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('Tous');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [companies, setCompanies] = useState<{companyId: number, companyName: string}[]>([]);

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
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
      setLoading(false);
    } catch  {
      setError('Échec du chargement des utilisateurs');
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/admin/companies');
      setCompanies(response.data);
    } catch  {
      console.error('Échec de la récupération des entreprises');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      await axios.put(`/api/admin/users/${selectedUser.userId}`, editForm);
      setShowEditModal(false);
      fetchUsers();
    } catch  {
      setError('Échec de la mise à jour de l\'utilisateur');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.delete(`/api/admin/users/${selectedUser.userId}`);
      setShowDeleteModal(false);
      fetchUsers();
    } catch {
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === 'Tous' || user.companyId.toString() === companyFilter;
    const matchesRole = roleFilter === 'Tous' || user.role === roleFilter;
    
    return matchesSearch && matchesCompany && matchesRole;
  });

  if (loading) {
    return <div className="loading-container">Chargement des utilisateurs...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const editModalFooter = (
    <>
      <Button variant="secondary" onClick={() => setShowEditModal(false)}>
        Annuler
      </Button>
      <Button variant="primary" type="submit" form="editForm">
        Mettre à jour l'utilisateur
      </Button>
    </>
  );

  const deleteModalFooter = (
    <>
      <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
        Annuler
      </Button>
      <Button variant="danger" onClick={handleDeleteConfirm}>
        Supprimer
      </Button>
    </>
  );

  const uniqueRoles = ['Tous', ...new Set(users.map(user => user.role))];

  return (
    <section className="manage-users-section">
      <div className="container">
        <div className="section-header">
          <h2>Gérer tous les utilisateurs</h2>
          <p className="text-muted">Voir et gérer les utilisateurs de toutes les entreprises</p>
        </div>

        <div className="controls-row">
          <div className="search-container">
            <input
              type="text"
              placeholder="Rechercher des utilisateurs..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              className="filter-select"
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
            
            <select 
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="no-users-message">
            <p>Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
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
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn delete"
                        onClick={() => openDeleteModal(user)}
                        title="Supprimer l'utilisateur"
                        disabled={user.role === "Gestionnaire d'abonnement"}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Modifier l'utilisateur"
        footer={editModalFooter}
      >
        <Form id="editForm" onSubmit={handleEditSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nom complet"
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Adresse email"
              value={editForm.email}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Numéro de téléphone</Form.Label>
            <Form.Control
              type="tel"
              placeholder="Numéro de téléphone"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
            />
          </Form.Group>
          {selectedUser && selectedUser.role !== "Gestionnaire d'abonnement" && (
            <Form.Group className="mb-3">
              <Form.Label>Rôle</Form.Label>
              <Form.Select
                value={editForm.role}
                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                required
              >
                {availableRoles.filter(role => role !== "Gestionnaire d'abonnement").map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          {selectedUser && selectedUser.role === "Gestionnaire d'abonnement" && (
            <div className="alert alert-info">
              Le rôle Gestionnaire d'abonnement ne peut pas être modifié
            </div>
          )}
        </Form>
      </Modal>

      {/* Delete User Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Supprimer l'utilisateur"
        footer={deleteModalFooter}
        size="sm"
      >
        <p>Êtes-vous sûr de vouloir supprimer {selectedUser?.name} ?</p>
        <p className="text-danger">Cette action est irréversible.</p>
      </Modal>
    </section>
  );
};

export default AdminManageUsers;
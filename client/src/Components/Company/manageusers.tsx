import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button } from 'react-bootstrap';
import Modal from '../shared/modal';
import '../../styles/manageusers.css';

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
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'User' // Keep original role value
  });

  const [editForm, setEditForm] = useState<Partial<User>>({
    name: '',
    email: '',
    phoneNumber: '',
    role: ''
  });

  const availableRoles = ['User', 'Auditor', 'Manager'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/company/users');
      setUsers(response.data);
      setLoading(false);
    } catch {
      setError('Échec du chargement des utilisateurs');
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/company/users', createForm);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'User'
      });
      fetchUsers();
    } catch {
      setError('Échec de la création de l’utilisateur');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      await axios.put(`/api/company/users/${selectedUser.userId}`, editForm);
      setShowEditModal(false);
      fetchUsers();
    } catch {
      setError('Échec de la mise à jour de l’utilisateur');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.delete(`/api/company/users/${selectedUser.userId}`);
      setShowDeleteModal(false);
      fetchUsers();
    } catch {
      setError('Échec de la suppression de l’utilisateur');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-container">Chargement des utilisateurs...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const createModalFooter = (
    <>
      <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
        Annuler
      </Button>
      <Button variant="primary" type="submit" form="createForm">
        Créer un utilisateur
      </Button>
    </>
  );

  const editModalFooter = (
    <>
      <Button variant="secondary" onClick={() => setShowEditModal(false)}>
        Annuler
      </Button>
      <Button variant="primary" type="submit" form="editForm">
        Mettre à jour l’utilisateur
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

  return (
    <section className="manage-users-section">
      <div className="container">
        <div className="section-header">
          <h2>Gestion des utilisateurs de l’entreprise</h2>
          <p className="text-muted">Créez et gérez les comptes utilisateurs de votre entreprise</p>
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
          <button 
            className="btn-create"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus"></i> Ajouter un nouvel utilisateur
          </button>
        </div>

        {users.length === 0 ? (
          <div className="no-users-message">
            <p>Aucun utilisateur trouvé. Créez votre premier utilisateur pour commencer.</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
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
                {filteredUsers.map(user => (
                  <tr key={user.userId}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 
                       <span className="status-pending">Vérification de l’email en attente</span>}
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn edit"
                        onClick={() => openEditModal(user)}
                        title="Modifier l’utilisateur"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => openDeleteModal(user)}
                        title="Supprimer l’utilisateur"
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

      {/* Create User Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title="Créer un nouvel utilisateur"
        footer={createModalFooter}
      >
        <Form id="createForm" onSubmit={handleCreateSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nom complet"
              value={createForm.name}
              onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Adresse email"
              value={createForm.email}
              onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Numéro de téléphone</Form.Label>
            <Form.Control
              type="tel"
              placeholder="Numéro de téléphone"
              value={createForm.phoneNumber}
              onChange={(e) => setCreateForm({...createForm, phoneNumber: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control
              type="password"
              placeholder="Mot de passe"
              value={createForm.password}
              onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rôle</Form.Label>
            <Form.Select
              value={createForm.role}
              onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
              required
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role === 'User' ? 'Utilisateur' : 
                   role === 'Auditor' ? 'Auditeur' : 
                   role === 'Manager' ? 'Gestionnaire' : role}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal>

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
              value={editForm.name || ''}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Adresse email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Numéro de téléphone</Form.Label>
            <Form.Control
              type="tel"
              placeholder="Numéro de téléphone"
              value={editForm.phoneNumber || ''}
              onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rôle</Form.Label>
            <Form.Select
              value={editForm.role || ''}
              onChange={(e) => setEditForm({...editForm, role: e.target.value})}
              required
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role === 'User' ? 'Utilisateur' : 
                   role === 'Auditor' ? 'Auditeur' : 
                   role === 'Manager' ? 'Gestionnaire' : role}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal>

      {/* Delete User Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Supprimer l’utilisateur"
        footer={deleteModalFooter}
        size="sm"
      >
        <p>Êtes-vous sûr de vouloir supprimer {selectedUser?.name} ?</p>
        <p className="text-danger">Cette action est irréversible.</p>
      </Modal>
    </section>
  );
};

export default ManageUsers;
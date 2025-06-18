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
    role: 'User'
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
      setError('Failed to load users');
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
      setError('Failed to create user');
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
      setError('Failed to update user');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.delete(`/api/company/users/${selectedUser.userId}`);
      setShowDeleteModal(false);
      fetchUsers();
    } catch {
      setError('Failed to delete user');
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
    return <div className="loading-container">Loading users...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const createModalFooter = (
    <>
      <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" form="createForm">
        Create User
      </Button>
    </>
  );

  const editModalFooter = (
    <>
      <Button variant="secondary" onClick={() => setShowEditModal(false)}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" form="editForm">
        Update User
      </Button>
    </>
  );

  const deleteModalFooter = (
    <>
      <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDeleteConfirm}>
        Delete
      </Button>
    </>
  );

  return (
    <section className="manage-users-section">
      <div className="container">
        <div className="section-header">
          <h2>Manage Company Users</h2>
          <p className="text-muted">Create and manage user accounts for your company</p>
        </div>

        <div className="controls-row">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="btn-create"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus"></i> Add New User
          </button>
        </div>

        {users.length === 0 ? (
          <div className="no-users-message">
            <p>No users found. Create your first user to get started.</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Created</th>
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
  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 
   <span className="status-pending">Email Verification Pending</span>}
</td>                    <td className="actions-cell">
                      <button 
                        className="action-btn edit"
                        onClick={() => openEditModal(user)}
                        title="Edit User"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => openDeleteModal(user)}
                        title="Delete User"
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
        title="Create New User"
        footer={createModalFooter}
      >
        <Form id="createForm" onSubmit={handleCreateSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Full Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Email Address"
              value={createForm.email}
              onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              placeholder="Phone Number"
              value={createForm.phoneNumber}
              onChange={(e) => setCreateForm({...createForm, phoneNumber: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={createForm.password}
              onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select
              value={createForm.role}
              onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
              required
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Edit User"
        footer={editModalFooter}
      >
        <Form id="editForm" onSubmit={handleEditSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Full Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Email Address"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              placeholder="Phone Number"
              value={editForm.phoneNumber || ''}
              onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select
              value={editForm.role || ''}
              onChange={(e) => setEditForm({...editForm, role: e.target.value})}
              required
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal>

      {/* Delete User Modal */}
      <Modal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Delete User"
        footer={deleteModalFooter}
        size="sm"
      >
        <p>Are you sure you want to delete {selectedUser?.name}?</p>
        <p className="text-danger">This action cannot be undone.</p>
      </Modal>
    </section>
  );
};

export default ManageUsers;
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
  const [companyFilter, setCompanyFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [companies, setCompanies] = useState<{companyId: number, companyName: string}[]>([]);

  const [editForm, setEditForm] = useState<UpdateUserForm>({
    name: '',
    email: '',
    phoneNumber: '',
    role: ''
  });

  const availableRoles = ['User', 'Auditor', 'Manager', 'SubscriptionManager'];

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
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/admin/companies');
      setCompanies(response.data);
    } catch  {
      console.error('Failed to fetch companies');
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
      setError('Failed to update user');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.delete(`/api/admin/users/${selectedUser.userId}`);
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
    
    const matchesCompany = companyFilter === 'All' || user.companyId.toString() === companyFilter;
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    
    return matchesSearch && matchesCompany && matchesRole;
  });

  if (loading) {
    return <div className="loading-container">Loading users...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

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

  const uniqueRoles = ['All', ...new Set(users.map(user => user.role))];

  return (
    <section className="manage-users-section">
      <div className="container">
        <div className="section-header">
          <h2>Manage All Users</h2>
          <p className="text-muted">View and manage users across all companies</p>
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
          
          <div className="filter-group">
            <select 
              className="filter-select"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="All">All Companies</option>
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
            <p>No users found.</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
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
                    <td>{user.phoneNumber || '-'}</td>
                    <td>{user.companyName}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
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
                        disabled={user.role === "SubscriptionManager"}
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
        title="Edit User"
        footer={editModalFooter}
      >
        <Form id="editForm" onSubmit={handleEditSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Full Name"
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Email Address"
              value={editForm.email}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              placeholder="Phone Number"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
            />
          </Form.Group>
          {selectedUser && selectedUser.role !== "SubscriptionManager" && (
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={editForm.role}
                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                required
              >
                {availableRoles.filter(role => role !== "SubscriptionManager").map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          {selectedUser && selectedUser.role === "SubscriptionManager" && (
            <div className="alert alert-info">
              Subscription Manager role cannot be changed
            </div>
          )}
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

export default AdminManageUsers;
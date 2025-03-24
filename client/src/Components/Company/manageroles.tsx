import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/manageroles.css';

interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
}

const ManageRoles: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

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
      setError('Failed to load users and roles');
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await axios.put(`/api/company/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch {
      setError('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const userCountByRole = users.reduce((counts: Record<string, number>, user) => {
    counts[user.role] = (counts[user.role] || 0) + 1;
    return counts;
  }, {});

  if (loading) {
    return <div className="loading-container">Loading users...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section className="manage-roles-section">
      <div className="container">
        <div className="section-header">
          <h2>Role Management</h2>
          <p className="text-muted">Manage user roles and permissions within your company</p>
        </div>

        <div className="controls-container">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-control">
            <select 
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="User">User</option>
              <option value="Auditor">Auditor</option>
              <option value="Manager">Manager</option>
              <option value="SubscriptionManager">Subscription Manager</option>
            </select>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Current Role</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                    No users found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.userId}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-indicator role-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.role !== 'SubscriptionManager' ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                          className="role-select"
                        >
                          {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="role-indicator role-subscriptionmanager">
                          Primary Account
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="role-descriptions">
          <h4>Role Descriptions</h4>
          <div className="descriptions-grid">
            <div className="description-item">
              <h5>User</h5>
              <p>Standard company user with basic access permissions.</p>
            </div>
            <div className="description-item">
              <h5>Auditor</h5>
              <p>Can view and analyze reports but cannot modify critical data.</p>
            </div>
            <div className="description-item">
              <h5>Manager</h5>
              <p>Has elevated permissions to manage projects and certain user activities.</p>
            </div>
            <div className="description-item">
              <h5>Subscription Manager</h5>
              <p>Primary account with administrative rights for the company.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManageRoles;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
  companyName: string;
  companyId: number;
}

const AdminManageRoles: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [companies, setCompanies] = useState<{companyId: number, companyName: string}[]>([]);

  const availableRoles = ['User', 'Auditor', 'Manager'];

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
    } catch {
      setError('Failed to load users and roles');
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/admin/companies');
      setCompanies(response.data);
    } catch {
      console.error('Failed to fetch companies');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
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
    const matchesCompany = companyFilter === 'All' || user.companyId.toString() === companyFilter;
    
    return matchesSearch && matchesRole && matchesCompany;
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

  const uniqueRoles = ['All', ...new Set(users.map(user => user.role))];

  return (
    <section className="manage-roles-section">
      <div className="container">
        <div className="section-header">
          <h2>Admin Role Management</h2>
          <p className="text-muted">Manage user roles and permissions across all companies</p>
        </div>

        <div className="role-summary">
          <h4>Role Distribution</h4>
          <div className="role-summary-grid">
            {Object.entries(userCountByRole).map(([role, count]) => (
              <div key={role} className="role-summary-item">
                <span className={`role-indicator role-${role.toLowerCase()}`}>{role}</span>
                <span className="role-count">{count} users</span>
              </div>
            ))}
          </div>
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
          
          <div className="filter-controls">
            <select 
              className="filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {uniqueRoles.map(role => (
                <option key={role} value={role}>
                  {role === 'All' ? 'All Roles' : role}
                </option>
              ))}
            </select>
            
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
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Company</th>
                <th>Current Role</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
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
                    <td>{user.companyName}</td>
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

export default AdminManageRoles;
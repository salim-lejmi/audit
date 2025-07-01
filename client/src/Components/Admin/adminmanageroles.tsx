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
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [companyFilter, setCompanyFilter] = useState('Tous');
  const [companies, setCompanies] = useState<{companyId: number, companyName: string}[]>([]);

  const availableRoles = ['Utilisateur', 'Auditeur', 'Gestionnaire'];

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
      setError('Échec du chargement des utilisateurs et rôles');
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/admin/companies');
      setCompanies(response.data);
    } catch {
      console.error('Échec de la récupération des entreprises');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch {
      setError('Échec de la mise à jour du rôle de l\'utilisateur');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'Tous' || user.role === roleFilter;
    const matchesCompany = companyFilter === 'Tous' || user.companyId.toString() === companyFilter;
    
    return matchesSearch && matchesRole && matchesCompany;
  });

  const userCountByRole = users.reduce((counts: Record<string, number>, user) => {
    counts[user.role] = (counts[user.role] || 0) + 1;
    return counts;
  }, {});

  if (loading) {
    return <div className="loading-container">Chargement des utilisateurs...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const uniqueRoles = ['Tous', ...new Set(users.map(user => user.role))];

  return (
    <section className="manage-roles-section">
      <div className="container">
        <div className="section-header">
          <h2>Gestion des rôles administratifs</h2>
          <p className="text-muted">Gérer les rôles et permissions des utilisateurs dans toutes les entreprises</p>
        </div>

        <div className="role-summary">
          <h4>Distribution des rôles</h4>
          <div className="role-summary-grid">
            {Object.entries(userCountByRole).map(([role, count]) => (
              <div key={role} className="role-summary-item">
                <span className={`role-indicator role-${role.toLowerCase()}`}>{role}</span>
                <span className="role-count">{count} utilisateurs</span>
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
              placeholder="Rechercher des utilisateurs..."
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
                  {role === 'Tous' ? 'Tous les rôles' : role}
                </option>
              ))}
            </select>
            
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
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Entreprise</th>
                <th>Rôle actuel</th>
                <th>Modifier le rôle</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun utilisateur trouvé correspondant à vos critères
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
                          Compte principal
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
          <h4>Descriptions des rôles</h4>
          <div className="descriptions-grid">
            <div className="description-item">
              <h5>Utilisateur</h5>
              <p>Utilisateur standard de l'entreprise avec des permissions d'accès de base.</p>
            </div>
            <div className="description-item">
              <h5>Auditeur</h5>
              <p>Peut consulter et analyser les rapports mais ne peut pas modifier les données critiques.</p>
            </div>
            <div className="description-item">
              <h5>Gestionnaire</h5>
              <p>Dispose de permissions élevées pour gérer les projets et certaines activités des utilisateurs.</p>
            </div>
            <div className="description-item">
              <h5>Gestionnaire d'abonnement</h5>
              <p>Compte principal avec des droits administratifs pour l'entreprise.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminManageRoles;
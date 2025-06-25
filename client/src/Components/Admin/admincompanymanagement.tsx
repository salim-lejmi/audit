import React, { useState, useEffect } from 'react';
import { Button, Form, Badge } from 'react-bootstrap';
import Modal from '../shared/modal';
import axios from 'axios';
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
  const [statusFilter, setStatusFilter] = useState('All');

  const [editForm, setEditForm] = useState<UpdateCompanyForm>({
    companyName: '',
    industry: '',
    status: ''
  });

  const availableStatuses = ['Pending', 'Approved', 'Rejected'];

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
      setError('Failed to load companies');
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
      setError('Failed to update company');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCompany) return;
    
    try {
      const response = await axios.delete(`/api/admin/companies/${selectedCompany.companyId}`);
      setShowDeleteModal(false);
      fetchCompanies();
      
      // Show success message with deletion counts
      if (response.data.deletedCounts) {
        const counts = response.data.deletedCounts;
        alert(`Company deleted successfully!\nDeleted: ${counts.users} users, ${counts.texts} texts, ${counts.actions} actions`);
      }
    } catch {
      setError('Failed to delete company');
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
    const variant = status === 'Approved' ? 'success' : 
                   status === 'Pending' ? 'warning' : 'danger';
    return <Badge bg={variant}>{status}</Badge>;
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.subscriptionManagerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.subscriptionManagerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="loading-container">Loading companies...</div>;
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
        Update Company
      </Button>
    </>
  );

  const deleteModalFooter = (
    <>
      <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDeleteConfirm}>
        Delete Company
      </Button>
    </>
  );

  const uniqueStatuses = ['All', ...new Set(companies.map(company => company.status))];

  return (
    <section className="manage-companies-section">
      <div className="container">
        <div className="section-header">
          <h2>Company Management</h2>
          <p className="text-muted">View and manage all companies in the system</p>
        </div>

        <div className="controls-row">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search companies..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="no-companies-message">
            <p>No companies found.</p>
          </div>
        ) : (
          <div className="companies-table-container">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Manager</th>
                  <th>Users</th>
                  <th>Texts</th>
                  <th>Actions</th>
                  <th>Created</th>
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
                          <i className="fas fa-check-circle text-success ms-1" title="Email Verified"></i>
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
                    <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                    
                      <button 
                        className="action-btn delete"
                        onClick={() => openDeleteModal(company)}
                        title="Delete Company"
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

      {/* Edit Company Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Edit Company"
        footer={editModalFooter}
      >
        <Form id="editForm" onSubmit={handleEditSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Company Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Company Name"
              value={editForm.companyName}
              onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Industry</Form.Label>
            <Form.Control
              type="text"
              placeholder="Industry"
              value={editForm.industry}
              onChange={(e) => setEditForm({...editForm, industry: e.target.value})}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
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
        title="Delete Company"
        footer={deleteModalFooter}
        size="sm"
      >
        <div className="alert alert-danger">
          <strong>Warning!</strong> This action cannot be undone.
        </div>
        <p>Are you sure you want to delete <strong>{selectedCompany?.companyName}</strong>?</p>
        {selectedCompany && (
          <div className="deletion-details">
            <p>This will also delete:</p>
            <ul>
              <li>{selectedCompany.totalUsers} users</li>
              <li>{selectedCompany.totalTexts} texts</li>
              <li>{selectedCompany.totalActions} actions</li>
              <li>All associated compliance evaluations, revues, and other data</li>
            </ul>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default AdminCompanyManagement;
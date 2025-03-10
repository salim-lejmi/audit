import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/pending-requests.css';

interface PendingCompany {
  companyId: number;
  companyName: string;
  managerName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  createdAt: string;
}

const PendingRequests: React.FC = () => {
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    try {
      const response = await axios.get('/api/admin/pending-companies');
      setPendingCompanies(response.data);
      setLoading(false);
    } catch {
      setError('Failed to load pending requests');
      setLoading(false);
    }
  };

  const handleApprove = async (companyId: number) => {
    setProcessingId(companyId);
    try {
      await axios.put(`/api/admin/approve-company/${companyId}`);
      setPendingCompanies(pendingCompanies.filter(company => company.companyId !== companyId));
      setSuccessMessage('Company approved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Failed to approve company');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (companyId: number) => {
    setProcessingId(companyId);
    try {
      await axios.put(`/api/admin/reject-company/${companyId}`);
      setPendingCompanies(pendingCompanies.filter(company => company.companyId !== companyId));
      setSuccessMessage('Company rejected successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Failed to reject company');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading pending requests...</div>;
  }

  return (
    <section className="pending-section">
      <div className="pending-container">
        <div className="pending-header">
          <div className="header-title">
            <h2>Pending Company Requests</h2>
            <p className="subtitle">Review and approve new company registrations</p>
          </div>
          <div className="header-actions">
            <Link to="/admin/dashboard" className="back-button">
              <i className="fas fa-arrow-left"></i>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="pending-content">
          {pendingCompanies.length === 0 && !loading ? (
            <div className="info-message">
              No pending company requests to review.
            </div>
          ) : (
            <div className="table-card">
              <div className="table-responsive">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Manager</th>
                      <th>Contact</th>
                      <th>Industry</th>
                      <th>Requested On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCompanies.map((company) => (
                      <tr key={company.companyId}>
                        <td className="company-name">{company.companyName}</td>
                        <td>{company.managerName}</td>
                        <td>
                          <div>{company.email}</div>
                          <small className="phone-number">{company.phoneNumber}</small>
                        </td>
                        <td>{company.industry}</td>
                        <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                        <td className="actions-cell">
                          <button
                            className="approve-button"
                            onClick={() => handleApprove(company.companyId)}
                            disabled={processingId === company.companyId}
                          >
                            {processingId === company.companyId ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            className="reject-button"
                            onClick={() => handleReject(company.companyId)}
                            disabled={processingId === company.companyId}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PendingRequests;
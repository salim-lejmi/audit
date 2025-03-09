import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
    return <div className="text-center p-5">Loading pending requests...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-9">
          <h2>Pending Company Requests</h2>
          <p className="text-muted">Review and approve new company registrations</p>
        </div>
        <div className="col-md-3 text-end">
          <Link to="/admin/dashboard" className="btn btn-outline-primary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {pendingCompanies.length === 0 && !loading ? (
        <div className="alert alert-info">
          No pending company requests to review.
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
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
                    <td className="fw-bold">{company.companyName}</td>
                    <td>{company.managerName}</td>
                    <td>
                      <div>{company.email}</div>
                      <small className="text-muted">{company.phoneNumber}</small>
                    </td>
                    <td>{company.industry}</td>
                    <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleApprove(company.companyId)}
                        disabled={processingId === company.companyId}
                      >
                        {processingId === company.companyId ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
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
  );
};

export default PendingRequests;
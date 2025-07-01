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
      setError('Échec du chargement des demandes en attente');
      setLoading(false);
    }
  };

  const handleApprove = async (companyId: number) => {
    setProcessingId(companyId);
    try {
      await axios.put(`/api/admin/approve-company/${companyId}`);
      setPendingCompanies(pendingCompanies.filter(company => company.companyId !== companyId));
      setSuccessMessage('Entreprise approuvée avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Échec de l\'approbation de l\'entreprise');
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
      setSuccessMessage('Entreprise rejetée avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setError('Échec du(policy: see response document for details) du rejet de l\'entreprise');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="loading-container">Chargement des demandes en attente...</div>;
  }

  return (
    <section className="pending-section">
      <div className="pending-container">
        <div className="pending-header">
          <div className="header-title">
            <h2>Demandes d'entreprises en attente</h2>
            <p className="subtitle">Examiner et approuver les nouvelles inscriptions d'entreprises</p>
          </div>
          <div className="header-actions">
            <Link to="/admin/dashboard" className="back-button">
              <i className="fas fa-arrow-left"></i>
              <span>Retour au tableau de bord</span>
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
              Aucune demande d'entreprise en attente à examiner.
            </div>
          ) : (
            <div className="table-card">
              <div className="table-responsive">
                <table className="requests-table">
                  <thead>
                    <tr>
                      <th>Nom de l'entreprise</th>
                      <th>Gestionnaire</th>
                      <th>Contact</th>
                      <th>Secteur</th>
                      <th>Date de demande</th>
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
                        <td>{new Date(company.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="actions-cell">
                          <button
                            className="approve-button"
                            onClick={() => handleApprove(company.companyId)}
                            disabled={processingId === company.companyId}
                          >
                            {processingId === company.companyId ? 'Traitement...' : 'Approuver'}
                          </button>
                          <button
                            className="reject-button"
                            onClick={() => handleReject(company.companyId)}
                            disabled={processingId === company.companyId}
                          >
                            Rejeter
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
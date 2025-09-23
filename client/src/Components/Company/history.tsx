import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/revuedirection.css';

interface HistoryItem {
  id: number;
  user: string;
  document: string;
  source: string;
  createdAt: string;
  pdfPath?: string;
  type:
    | 'compliance'
    | 'action'
    | 'revue'
    | 'text'
    | 'revue_action'
    | 'revue_legal_text'
    | 'revue_requirement'
    | 'revue_stakeholder'
    | 'company'
    | 'user'
    | 'payment'
    | 'subscription'
    | 'observation'
    | 'monitoring'
    | 'attachment';
  entityId: number;
  details?: string;
  status?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

const sources = [
  { value: 'all', label: 'Toutes les activités' },
  { value: 'compliance', label: 'Évaluations de conformité' },
  { value: 'action', label: "Plans d'action" },
  { value: 'revue', label: 'Revues de direction' },
  { value: 'revue_action', label: 'Actions de revue' },
  { value: 'revue_legal_text', label: 'Textes légaux de revue' },
  { value: 'revue_requirement', label: 'Exigences de revue' },
  { value: 'revue_stakeholder', label: 'Parties prenantes' },
  { value: 'text', label: 'Textes réglementaires' },
  { value: 'company', label: 'Entreprises' },
  { value: 'user', label: 'Utilisateurs' },
  { value: 'payment', label: 'Paiements' },
  { value: 'subscription', label: 'Abonnements' },
  { value: 'observation', label: 'Observations' },
  { value: 'monitoring', label: 'Paramètres de suivi' },
  { value: 'attachment', label: 'Pièces jointes' }
];

const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 20
  });
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistoryData();
    // eslint-disable-next-line
  }, [
    pagination.currentPage,
    searchTerm,
    sourceFilter,
    userFilter,
    dateFromFilter,
    dateToFilter
  ]);

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        pageSize: pagination.pageSize.toString(),
        search: searchTerm,
        source: sourceFilter,
        user: userFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter
      });

      const response = await axios.get(`/api/history?${params}`);
      setHistoryItems(response.data.items);
      setPagination(response.data.pagination);
      setAvailableUsers(response.data.availableUsers);
      setError(null);
    } catch (err: any) {
      setError("Erreur lors du chargement de l'historique");
      setHistoryItems([]);
      setAvailableUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    filterType: string,
    value: string
  ) => {
    switch (filterType) {
      case 'source':
        setSourceFilter(value);
        break;
      case 'user':
        setUserFilter(value);
        break;
      case 'dateFrom':
        setDateFromFilter(value);
        break;
      case 'dateTo':
        setDateToFilter(value);
        break;
    }
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSourceFilter('all');
    setUserFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  const downloadPDF = async (item: HistoryItem) => {
    if (!item.pdfPath) {
      alert('Aucun PDF disponible pour cet élément');
      return;
    }

    try {
      const response = await axios.get(
        `/api/history/download-pdf/${item.entityId}?type=${item.type}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.document}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) +
    ' ' +
    new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      compliance: { label: 'Conformité', className: 'badge-compliance' },
      action: { label: 'Action', className: 'badge-action' },
      revue: { label: 'Revue', className: 'badge-revue' },
      revue_action: { label: 'Action Revue', className: 'badge-revue-action' },
      revue_legal_text: { label: 'Texte Légal', className: 'badge-revue-legal' },
      revue_requirement: { label: 'Exigence', className: 'badge-revue-requirement' },
      revue_stakeholder: { label: 'Partie Prenante', className: 'badge-revue-stakeholder' },
      text: { label: 'Texte', className: 'badge-text' },
      company: { label: 'Entreprise', className: 'badge-company' },
      user: { label: 'Utilisateur', className: 'badge-user' },
      payment: { label: 'Paiement', className: 'badge-payment' },
      subscription: { label: 'Abonnement', className: 'badge-subscription' },
      observation: { label: 'Observation', className: 'badge-observation' },
      monitoring: { label: 'Suivi', className: 'badge-monitoring' },
      attachment: { label: 'Pièce jointe', className: 'badge-attachment' }
    };

    const badge =
      badges[source as keyof typeof badges] ||
      { label: source, className: 'badge-default' };
    return (
      <span className={`status-badge ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;

    const statusBadges = {
      Active: { className: 'status-en-cours', label: 'Actif' },
      Pending: { className: 'status-en-attente', label: 'En attente' },
      Completed: { className: 'status-terminée', label: 'Terminé' },
      'In Progress': { className: 'status-en-cours', label: 'En cours' },
      Draft: { className: 'status-en-attente', label: 'Brouillon' },
      Canceled: { className: 'status-annulée', label: 'Annulé' },
      succeeded: { className: 'status-terminée', label: 'Réussi' },
      failed: { className: 'status-annulée', label: 'Échoué' },
      expired: { className: 'status-annulée', label: 'Expiré' }
    };

    const statusBadge =
      statusBadges[status as keyof typeof statusBadges] ||
      { className: 'status-badge', label: status };

    return (
      <span className={`status-badge ${statusBadge.className}`}>
        {statusBadge.label}
      </span>
    );
  };

  const getDisplayDetails = (details: string | undefined) => {
    if (!details) return '';
    const maxLength = 60;
    if (details.length <= maxLength) return details;
    const truncated = details.substring(0, maxLength);
    const lastDash = truncated.lastIndexOf(' - ');
    const lastComma = truncated.lastIndexOf(', ');
    const lastSpace = truncated.lastIndexOf(' ');

    const breakPoint = Math.max(lastDash, lastComma, lastSpace);
    const cutPoint = breakPoint > maxLength * 0.5 ? breakPoint : maxLength;

    return details.substring(0, cutPoint) + '...';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Historique des Activités</h1>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-row">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Rechercher dans l'historique..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button
            className={`btn-filter${showFilters ? ' active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filtres
          </button>
        </div>
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Filtres avancés</h3>
              <button className="btn-reset" onClick={clearFilters}>
                <RefreshCw size={16} />
                Réinitialiser
              </button>
            </div>
            <div className="filters-grid">
              <div className="form-group">
                <label>Type d'activité</label>
                <select
                  value={sourceFilter}
                  onChange={e =>
                    handleFilterChange('source', e.target.value)
                  }
                >
                  {sources.map(source => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Utilisateur</label>
                <select
                  value={userFilter}
                  onChange={e =>
                    handleFilterChange('user', e.target.value)
                  }
                >
                  <option value="all">Tous les utilisateurs</option>
                  {availableUsers.map(user => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date de début</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={e =>
                    handleFilterChange('dateFrom', e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={e =>
                    handleFilterChange('dateTo', e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="results-section">
        <div className="results-info">
          {pagination.totalItems > 0
            ? `${pagination.totalItems} activité${
                pagination.totalItems > 1 ? 's' : ''
              } trouvée${pagination.totalItems > 1 ? 's' : ''}`
            : 'Aucun résultat'}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchHistoryData}>
              Réessayer
            </button>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="empty-state">
            <p>Aucune activité trouvée</p>
            <p>Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Utilisateur</th>
                    <th>Activité</th>
                    <th>Type</th>
                    <th>Détails</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item, idx) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td>
                        {(pagination.currentPage - 1) *
                          pagination.pageSize +
                          idx +
                          1}
                      </td>
                      <td>
                        <span className="user-name">{item.user}</span>
                      </td>
                      <td>
                        <span
                          className="document-title"
                          title={item.document}
                        >
                          {item.document.length > 50
                            ? `${item.document.substring(0, 50)}...`
                            : item.document}
                        </span>
                      </td>
                      <td>{getSourceBadge(item.source)}</td>
                      <td>
                        {item.details && (
                          <span
                            className="details-text"
                            title={item.details}
                          >
                            {getDisplayDetails(item.details)}
                          </span>
                        )}
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <span className="date-text">
                          {formatDate(item.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => goToPage(1)}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  className="page-btn"
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="page-info">
                  Page {pagination.currentPage} sur {pagination.totalPages}
                </span>
                <button
                  className="page-btn"
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  className="page-btn"
                  onClick={() => goToPage(pagination.totalPages)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
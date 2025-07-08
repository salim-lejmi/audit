import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/history.css'; 

interface HistoryItem {
  id: number;
  user: string;
  document: string;
  source: string;
  createdAt: string;
  modifiedAt: string;
  pdfPath?: string;
  type: 'compliance' | 'action' | 'revue' | 'text';
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

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
    pageSize: 10
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  const sources = [
    { value: 'all', label: 'Toutes les sources' },
    { value: 'compliance', label: 'Évaluation de conformité' },
    { value: 'action', label: 'Plan d\'action' },
    { value: 'revue', label: 'Revue de direction' },
    { value: 'text', label: 'Textes réglementaires' }
  ];

  useEffect(() => {
    fetchHistoryData();
  }, [pagination.currentPage, searchTerm, sourceFilter, userFilter, dateFromFilter, dateToFilter]);

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
      setError('Erreur lors du chargement de l\'historique');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
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

  const clearFilters = () => {
    setSearchTerm('');
    setSourceFilter('all');
    setUserFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const openGoogleSearch = () => {
    const searchQuery = searchTerm || 'prévention sécurité environnement';
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
  };

  const downloadPDF = async (item: HistoryItem) => {
    if (!item.pdfPath) {
      alert('Aucun PDF disponible pour cet élément');
      return;
    }

    try {
      const response = await axios.get(`/api/history/download-pdf/${item.id}?type=${item.type}`, {
        responseType: 'blob'
      });
      
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
      console.error('Error downloading PDF:', err);
      alert('Erreur lors du téléchargement du PDF');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      compliance: { label: 'Conformité', className: 'badge-compliance' },
      action: { label: 'Action', className: 'badge-action' },
      revue: { label: 'Revue', className: 'badge-revue' },
      text: { label: 'Texte', className: 'badge-text' }
    };
    
    const badge = badges[source as keyof typeof badges] || { label: source, className: 'badge-default' };
    return <span className={`source-badge ${badge.className}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Chargement de l'historique...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="container">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchHistoryData} className="retry-btn">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`history-page ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1>Historique des Documents</h1>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label>🔍 Recherche</label>
              <input
                type="text"
                placeholder="Rechercher dans les documents..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>📂 Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="filter-select"
              >
                {sources.map(source => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>👤 Utilisateur</label>
              <select
                value={userFilter}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous les utilisateurs</option>
                {availableUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>📅 Date de début</label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="date-input"
              />
            </div>

            <div className="filter-group">
              <label>📅 Date de fin</label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="date-input"
              />
            </div>

            <div className="filter-actions">
              <button onClick={clearFilters} className="clear-filters-btn">
              Effacer
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <p>
            <strong>{pagination.totalItems}</strong> document{pagination.totalItems > 1 ? 's' : ''} trouvé{pagination.totalItems > 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
          </p>
        </div>

        {/* History Table */}
        <div className="table-section">
          {historyItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-text">Aucun document trouvé</div>
              <div className="empty-state-subtext">
                Essayez de modifier vos critères de recherche
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Utilisateur</th>
                    <th>Document</th>
                    <th>Source</th>
                    <th>Date de création</th>
                    <th>Date de modification</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="row-number">
                        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                      </td>
                      <td className="user-cell">
                        <div className="user-info">
                          <span className="user-name">{item.user}</span>
                        </div>
                      </td>
                      <td className="document-cell">
                        <div className="document-info">
                          <span className="document-title">{item.document}</span>
                        </div>
                      </td>
                      <td className="source-cell">
                        {getSourceBadge(item.source)}
                      </td>
                      <td className="date-cell">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="date-cell">
                        {formatDate(item.modifiedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination-section">
            <div className="pagination-info">
              Page {pagination.currentPage} sur {pagination.totalPages}
              ({pagination.totalItems} éléments au total)
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
                className="pagination-btn"
              >
                ⏮️ Premier
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="pagination-btn"
              >
                ⬅️ Précédent
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`pagination-btn ${pagination.currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="pagination-btn"
              >
                Suivant ➡️
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="pagination-btn"
              >
                Dernier ⏭️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
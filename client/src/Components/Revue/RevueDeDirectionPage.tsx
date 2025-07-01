import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import '../../styles/revueDirection.css';

interface Review {
  revueId: number;
  domainId: number;
  domainName: string;
  reviewDate: string;
  status: string;
  createdAt: string;
  pdfFilePath?: string;
}

interface Domain {
  domainId: number;
  name: string;
}

interface RevueDeDirectionPageProps {
  userRole?: string;
}

const RevueDeDirectionPage: React.FC<RevueDeDirectionPageProps> = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filterDomainId, setFilterDomainId] = useState<number | null>(null);
  const [filterLastReviewDate, setFilterLastReviewDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReview, setNewReview] = useState({ domainId: 0, reviewDate: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await axios.get('/api/auth/verify');
        setUserRole(response.data.role);
      } catch (err) {
        console.error('Failed to verify auth:', err);
      }
    };
    
    verifyAuth();
    
    axios.get('/api/taxonomy/domains')
      .then(response => setDomains(response.data))
      .catch(err => setError('Échec du chargement des domaines'));
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [filterDomainId, filterLastReviewDate]);

  const fetchReviews = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDomainId) params.append('domainId', filterDomainId.toString());
    if (filterLastReviewDate) params.append('lastReviewDate', filterLastReviewDate);

    axios.get(`/api/revue?${params.toString()}`)
      .then(response => {
        setReviews(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Échec du chargement des revues');
        setLoading(false);
      });
  };

  const handleCreateReview = () => {
    if (newReview.domainId === 0 || !newReview.reviewDate) {
      alert('Veuillez sélectionner un domaine et définir une date de revue');
      return;
    }
    axios.post('/api/revue', newReview)
      .then(() => {
        setShowCreateModal(false);
        setNewReview({ domainId: 0, reviewDate: '' });
        fetchReviews();
      })
      .catch(err => {
        console.error('Create review error:', err);
        if (err.response) {
          alert(`Échec de la création de la revue : ${err.response.status} - ${err.response.data?.message || JSON.stringify(err.response.data)}`);
        } else if (err.request) {
          alert('Échec de la création de la revue : aucune réponse du serveur');
        } else {
          alert(`Échec de la création de la revue : ${err.message}`);
        }
      });
  };

  const handleEditReview = () => {
    if (!editReview || editReview.domainId === 0 || !editReview.reviewDate) {
      alert('Veuillez sélectionner un domaine et définir une date de revue');
      return;
    }
    axios.put(`/api/revue/${editReview.revueId}`, {
      reviewDate: editReview.reviewDate,
      status: editReview.status
    })
      .then(() => {
        setShowEditModal(false);
        setEditReview(null);
        fetchReviews();
      })
      .catch(err => alert('Échec de la mise à jour de la revue'));
  };

  const handleDeleteReview = (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette revue ?')) return;
    axios.delete(`/api/revue/${id}`)
      .then(() => fetchReviews())
      .catch(err => alert('Échec de la suppression de la revue'));
  };

  const canCreateDelete = () => {
    return userRole === 'SubscriptionManager';
  };

  const canEdit = () => {
    return userRole === 'SubscriptionManager' || userRole === 'Auditor';
  };

  return (
    <div className="revue-page">
      <h2 className="text-2xl font-bold mb-4">Revue de Direction</h2>
      <div className="filters flex space-x-4 mb-4">
        <select
          value={filterDomainId || ''}
          onChange={e => setFilterDomainId(e.target.value ? parseInt(e.target.value) : null)}
          className="p-2 border rounded"
        >
          <option value="">Tous les domaines</option>
          {domains.map(domain => (
            <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterLastReviewDate}
          onChange={e => setFilterLastReviewDate(e.target.value)}
          className="p-2 border rounded"
        />
        <button onClick={fetchReviews} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Appliquer les filtres
        </button>
      </div>
      
      {loading ? (
        <p>Chargement...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="revue-table w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">ID</th>
              <th className="p-2">Domaine</th>
              <th className="p-2">Date de revue</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Créé le</th>
              <th className="p-2">PDF</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.revueId} className="border-b">
                <td className="p-2">{review.revueId}</td>
                <td className="p-2">{review.domainName}</td>
                <td className="p-2">{new Date(review.reviewDate).toLocaleDateString('fr-FR')}</td>
                <td className="p-2">{review.status}</td>
                <td className="p-2">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="p-2">
                  {review.pdfFilePath ? (
                    <a href={review.pdfFilePath} download className="text-blue-500">Télécharger</a>
                  ) : 'N/A'}
                </td>
                <td className="p-2">
                  <div className="action-buttons">
                    <Link to={`${review.revueId}`} className="action-btn view">Voir</Link>
                    {canEdit() && (userRole === 'SubscriptionManager') && (
                      <button
                        onClick={() => { setEditReview(review); setShowEditModal(true); }}
                        className="action-btn edit"
                      >
                        Modifier
                      </button>
                    )}
                    {canCreateDelete() && (
                      <button
                        onClick={() => handleDeleteReview(review.revueId)}
                        className="action-btn delete"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {canCreateDelete() && (
        <button
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={() => setShowCreateModal(true)}
        >
          + Créer une nouvelle revue
        </button>
      )}

      {canCreateDelete() && (
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Créer une nouvelle revue</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Domaine</label>
                <select
                  value={newReview.domainId}
                  onChange={e => setNewReview({ ...newReview, domainId: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  <option value={0}>Sélectionner un domaine</option>
                  {domains.map(domain => (
                    <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Date de revue</label>
                <input
                  type="date"
                  value={newReview.reviewDate}
                  onChange={e => setNewReview({ ...newReview, reviewDate: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Fermer</Button>
            <Button variant="primary" onClick={handleCreateReview}>Créer</Button>
          </Modal.Footer>
        </Modal>
      )}

      {canEdit() && (
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Modifier la revue</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editReview && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Domaine</label>
                  <select
                    value={editReview.domainId}
                    onChange={e => setEditReview({ ...editReview, domainId: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
                    disabled
                  >
                    {domains.map(domain => (
                      <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Date de revue</label>
                  <input
                    type="date"
                    value={editReview.reviewDate.split('T')[0]}
                    onChange={e => setEditReview({ ...editReview, reviewDate: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Fermer</Button>
            <Button variant="primary" onClick={handleEditReview}>Enregistrer</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default RevueDeDirectionPage;
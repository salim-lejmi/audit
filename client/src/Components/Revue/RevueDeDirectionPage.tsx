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
  userRole?: string; // Add userRole prop
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
    // Get user role from auth verification
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
      .catch(err => setError('Failed to load domains'));
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
        setError('Failed to load reviews');
        setLoading(false);
      });
  };

  const handleCreateReview = () => {
    if (newReview.domainId === 0 || !newReview.reviewDate) {
      alert('Please select a domain and set a review date');
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
          alert(`Failed to create review: ${err.response.status} - ${err.response.data?.message || JSON.stringify(err.response.data)}`);
        } else if (err.request) {
          alert('Failed to create review: No response from server');
        } else {
          alert(`Failed to create review: ${err.message}`);
        }
      });
  };

  const handleEditReview = () => {
    if (!editReview || editReview.domainId === 0 || !editReview.reviewDate) {
      alert('Please select a domain and set a review date');
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
      .catch(err => alert('Failed to update review'));
  };

  const handleDeleteReview = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    axios.delete(`/api/revue/${id}`)
      .then(() => fetchReviews())
      .catch(err => alert('Failed to delete review'));
  };

  // Helper function to check if user can create/delete
  const canCreateDelete = () => {
    return userRole === 'SubscriptionManager';
  };

  // Helper function to check if user can edit
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
          <option value="">All Domains</option>
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
          Apply Filters
        </button>
      </div>
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="revue-table w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">ID</th>
              <th className="p-2">Domain</th>
              <th className="p-2">Review Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created At</th>
              <th className="p-2">PDF</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.revueId} className="border-b">
                <td className="p-2">{review.revueId}</td>
                <td className="p-2">{review.domainName}</td>
                <td className="p-2">{new Date(review.reviewDate).toLocaleDateString()}</td>
                <td className="p-2">{review.status}</td>
                <td className="p-2">{new Date(review.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  {review.pdfFilePath ? (
                    <a href={review.pdfFilePath} download className="text-blue-500">Download</a>
                  ) : 'N/A'}
                </td>
                <td className="p-2">
                  <div className="action-buttons">
                    {/* All company members can view */}
                    <Link to={`${review.revueId}`} className="action-btn view">View</Link>
                    
                    {/* Only SubscriptionManager and Auditor can edit */}
                    {canEdit()  &&(userRole === 'SubscriptionManager') && (
                      <button
                        onClick={() => { setEditReview(review); setShowEditModal(true); }}
                        className="action-btn edit"
                      >
                        Edit
                      </button>
                    )}
                    
                    {/* Only SubscriptionManager can delete */}
                    {canCreateDelete() && (
                      <button
                        onClick={() => handleDeleteReview(review.revueId)}
                        className="action-btn delete"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Only SubscriptionManager can create new reviews */}
      {canCreateDelete() && (
        <button
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Review
        </button>
      )}

      {/* Create Modal - only shown to SubscriptionManager */}
      {canCreateDelete() && (
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Review</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Domain</label>
                <select
                  value={newReview.domainId}
                  onChange={e => setNewReview({ ...newReview, domainId: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  <option value={0}>Select Domain</option>
                  {domains.map(domain => (
                    <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Review Date</label>
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
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Close</Button>
            <Button variant="primary" onClick={handleCreateReview}>Create</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Modal - only shown to SubscriptionManager and Auditor */}
      {canEdit() && (
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Edit Review</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editReview && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Domain</label>
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
                  <label className="block text-sm font-medium">Review Date</label>
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
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Close</Button>
            <Button variant="primary" onClick={handleEditReview}>Save</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default RevueDeDirectionPage;
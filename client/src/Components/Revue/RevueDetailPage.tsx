import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import '../../styles/revueDetail.css';

interface ReviewDetail {
  revueId: number;
  domainId: number;
  domainName: string;
  reviewDate: string;
  status: string;
  pdfFilePath?: string;
  legalTexts: Array<{
    legalTextId: number;
    textId: number;
    textReference: string;
    penalties: string;
    incentives: string;
    risks: string;
    opportunities: string;
    followUp: string;
  }>;
  requirements: Array<{
    requirementId: number;
    textRequirementId: number;
    description: string;
    requirementNumber: string;
    textReference: string;
    implementation: string;
    communication: string;
    followUp: string;
  }>;
  actions: Array<{
    actionId: number;
    description: string;
    source: string;
    status: string;
    observation: string;
    followUp: string;
  }>;
  stakeholders: Array<{
    stakeholderId: number;
    stakeholderName: string;
    relationshipStatus: string;
    reason: string;
    action: string;
    followUp: string;
  }>;
}

interface Text {
  textId: number;
  reference: string;
}

interface AvailableRequirement {
  requirementId: number;
  number: string;
  title: string;
  textReference: string;
  description: string;
}

const RevueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [texts, setTexts] = useState<{ textId: number; reference: string }[]>([]);
  const [availableRequirements, setAvailableRequirements] = useState<AvailableRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textsLoaded, setTextsLoaded] = useState(false);
const [userRole, setUserRole] = useState<string>('');

  // Modal states
  const [showLegalTextModal, setShowLegalTextModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showStakeholderModal, setShowStakeholderModal] = useState(false);

  // Form states
  const [legalTextForm, setLegalTextForm] = useState({
    textId: 0,
    penalties: '',
    incentives: '',
    risks: '',
    opportunities: '',
    followUp: '',
  });
  const [requirementForm, setRequirementForm] = useState({ 
    textRequirementId: 0, 
    implementation: '', 
    communication: '', 
    followUp: '' 
  });
  const [actionForm, setActionForm] = useState({ description: '', source: '', status: '', observation: '', followUp: '' });
  const [stakeholderForm, setStakeholderForm] = useState({ stakeholderName: '', relationshipStatus: '', reason: '', action: '', followUp: '' });

  useEffect(() => {
  // Get user role
  const verifyAuth = async () => {
    try {
      const response = await axios.get('/api/auth/verify');
      setUserRole(response.data.role);
    } catch (err) {
      console.error('Failed to verify auth:', err);
    }
  };
  
  verifyAuth();
  fetchReview();
  fetchTexts();
}, [id]);
const handleCompleteReview = () => {
  if (!window.confirm('Are you sure you want to complete this review? This action cannot be undone.')) {
    return;
  }
 

  axios.post(`/api/revue/${review?.revueId}/complete`)
    .then(() => fetchReview())
    .catch(err => alert('Failed to complete review'));
};


const canModify = () => {
  return userRole === 'SubscriptionManager' || userRole === 'Auditor';
};

const canParticipate = () => {
  // All company members can participate (add content)
  return true; // Since this page is already protected by authentication
};
  const fetchReview = () => {
    setLoading(true);
    axios.get(`/api/revue/${id}`)
      .then(response => {
        setReview(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load review details');
        setLoading(false);
      });
  };

  const fetchTexts = async () => {
    try {
      const response = await axios.get('/api/texts');
      console.log('Raw Texts API response:', response.data);
      
      const fetchedTexts = response.data.texts || [];
      console.log('Fetched texts:', fetchedTexts);
      
      setTexts(fetchedTexts);
      setTextsLoaded(true);
    } catch (err) {
      console.error('Failed to load texts', err);
      setTexts([]);
      setTextsLoaded(true);
    }
  };

  const fetchAvailableRequirements = async () => {
    try {
      const response = await axios.get(`/api/revue/${id}/available-requirements`);
      setAvailableRequirements(response.data);
    } catch (err) {
      console.error('Failed to load available requirements', err);
      setAvailableRequirements([]);
    }
  };

  const handleAddLegalText = () => {
    if (legalTextForm.textId === 0) {
      alert('Please select a text');
      return;
    }
    axios.post(`/api/revue/${review?.revueId}/legaltext`, legalTextForm)
      .then(() => {
        setShowLegalTextModal(false);
        setLegalTextForm({ textId: 0, penalties: '', incentives: '', risks: '', opportunities: '', followUp: '' });
        fetchReview();
      })
      .catch(err => alert('Failed to add legal text'));
  };

const handleAddRequirement = () => {
  if (requirementForm.textRequirementId === 0) {
    alert('Please select a requirement');
    return;
  }
  
  const requestData = {
    TextRequirementId: requirementForm.textRequirementId,
    Implementation: requirementForm.implementation,
    Communication: requirementForm.communication,
    FollowUp: requirementForm.followUp
  };
  
  console.log('Submitting requirement form:', requestData);
  
  axios.post(`/api/revue/${review?.revueId}/requirement`, requestData)
    .then(response => {
      console.log('Requirement added successfully:', response.data);
      setShowRequirementModal(false);
      setRequirementForm({ textRequirementId: 0, implementation: '', communication: '', followUp: '' });
      fetchReview();
    })
    .catch(err => {
      console.error('Failed to add requirement:', err);
      console.error('Error response data:', err.response?.data);
      alert(`Failed to add requirement: ${err.response?.data?.message || err.message}`);
    });
};
  const handleAddAction = () => {
    if (!actionForm.description) {
      alert('Description is required');
      return;
    }
    axios.post(`/api/revue/${review?.revueId}/action`, actionForm)
      .then(() => {
        setShowActionModal(false);
        setActionForm({ description: '', source: '', status: '', observation: '', followUp: '' });
        fetchReview();
      })
      .catch(err => alert('Failed to add action'));
  };

  const handleAddStakeholder = () => {
    if (!stakeholderForm.stakeholderName) {
      alert('Stakeholder name is required');
      return;
    }
    axios.post(`/api/revue/${review?.revueId}/stakeholder`, stakeholderForm)
      .then(() => {
        setShowStakeholderModal(false);
        setStakeholderForm({ stakeholderName: '', relationshipStatus: '', reason: '', action: '', followUp: '' });
        fetchReview();
      })
      .catch(err => alert('Failed to add stakeholder'));
  };

const handleGeneratePdf = () => {
  axios.post(`/api/revue/${review?.revueId}/generate-pdf`, null, { responseType: 'blob' })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `review_${review?.revueId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      fetchReview();
    })
    .catch(err => {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    });
};  const handleStartReview = () => {
    axios.put(`/api/revue/${review?.revueId}`, { reviewDate: review?.reviewDate, status: 'In Progress' })
      .then(() => fetchReview())
      .catch(err => alert('Failed to start review'));
  };

  const handleCancelReview = () => {
    axios.put(`/api/revue/${review?.revueId}`, { reviewDate: review?.reviewDate, status: 'Canceled' })
      .then(() => fetchReview())
      .catch(err => alert('Failed to cancel review'));
  };

  const handleShowRequirementModal = () => {
    fetchAvailableRequirements();
    setShowRequirementModal(true);
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!review) return <div className="text-center p-4">Review not found</div>;

  return (
    <div className="revue-detail">
      <div className="container">
        <h1 className="text-3xl font-bold mb-4">Review ID: {review.revueId}</h1>
        
        <div className="info-card">
          <p><strong>Domain:</strong> {review.domainName}</p>
          <p><strong>Review Date:</strong> {new Date(review.reviewDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span className={`status-badge status-${review.status.toLowerCase().replace(' ', '')}`}>{review.status}</span></p>
          {review.pdfFilePath && (
            <p><strong>PDF:</strong> <a href={review.pdfFilePath} download>Download</a></p>
          )}
        </div>

<div className="action-buttons-row">
  {review.status === 'Draft' && canModify() && (
    <button onClick={handleStartReview} className="action-btn-primary btn-start">
      Start Review
    </button>
  )}
  {review.status === 'In Progress' && canModify() && (
    <button onClick={handleCompleteReview} className="action-btn-primary btn-complete">
      Complete Review
    </button>
  )}
  {review.status !== 'Canceled' && review.status !== 'Completed' && canModify() && (
    <button onClick={handleCancelReview} className="action-btn-primary btn-cancel">
      Cancel Review
    </button>
  )}
  <button onClick={handleGeneratePdf} className="action-btn-primary btn-pdf">
    Generate PDF
  </button>
</div>
        {/* Legal Texts */}
<section className="section">
  <div className="section-header">
    <h2>Legal Texts</h2>
    {canParticipate() && review.status !== 'Completed' && review.status !== 'Canceled' && (
      <button onClick={() => setShowLegalTextModal(true)} className="add-btn">
        Add Legal Text
      </button>
    )}
  </div>          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Penalties</th>
                  <th>Incentives</th>
                  <th>Risks</th>
                  <th>Opportunities</th>
                  <th>Follow Up</th>
                </tr>
              </thead>
              <tbody>
                {review.legalTexts.map(lt => (
                  <tr key={lt.legalTextId}>
                    <td>{lt.textReference}</td>
                    <td>{lt.penalties}</td>
                    <td>{lt.incentives}</td>
                    <td>{lt.risks}</td>
                    <td>{lt.opportunities}</td>
                    <td>{lt.followUp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Requirements */}
     <section className="section">
  <div className="section-header">
    <h2>Requirements</h2>
    {canParticipate() && review.status !== 'Completed' && review.status !== 'Canceled' && (
      <button onClick={handleShowRequirementModal} className="add-btn">
        Add Requirement
      </button>
    )}
  </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Text Reference</th>
                  <th>Requirement</th>
                  <th>Implementation</th>
                  <th>Communication</th>
                  <th>Follow Up</th>
                </tr>
              </thead>
              <tbody>
                {review.requirements.map(req => (
                  <tr key={req.requirementId}>
                    <td>{req.textReference}</td>
                    <td>{req.requirementNumber} - {req.description}</td>
                    <td>{req.implementation}</td>
                    <td>{req.communication}</td>
                    <td>{req.followUp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Actions */}
      <section className="section">
  <div className="section-header">
    <h2>Actions</h2>
    {canParticipate() && review.status !== 'Completed' && review.status !== 'Canceled' && (
      <button onClick={() => setShowActionModal(true)} className="add-btn">
        Add Action
      </button>
    )}
  </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Observation</th>
                  <th>Follow Up</th>
                </tr>
              </thead>
              <tbody>
                {review.actions.map(act => (
                  <tr key={act.actionId}>
                    <td>{act.description}</td>
                    <td>{act.source}</td>
                    <td>{act.status}</td>
                    <td>{act.observation}</td>
                    <td>{act.followUp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Stakeholders */}
       <section className="section">
  <div className="section-header">
    <h2>Stakeholders</h2>
    {canParticipate() && review.status !== 'Completed' && review.status !== 'Canceled' && (
      <button onClick={() => setShowStakeholderModal(true)} className="add-btn">
        Add Stakeholder
      </button>
    )}
  </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship Status</th>
                  <th>Reason</th>
                  <th>Action</th>
                  <th>Follow Up</th>
                </tr>
              </thead>
              <tbody>
                {review.stakeholders.map(stake => (
                  <tr key={stake.stakeholderId}>
                    <td>{stake.stakeholderName}</td>
                    <td>{stake.relationshipStatus}</td>
                    <td>{stake.reason}</td>
                    <td>{stake.action}</td>
                    <td>{stake.followUp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Legal Text Modal */}
        <Modal show={showLegalTextModal} onHide={() => setShowLegalTextModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Legal Text</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Text</label>
                <select
                  value={legalTextForm.textId}
                  onChange={e => setLegalTextForm({ ...legalTextForm, textId: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  <option value={0}>Select Text</option>
                  {texts.length > 0 ? (
                    texts.map(text => (
                      <option key={text.textId} value={text.textId}>{text.reference}</option>
                    ))
                  ) : (
                    <option value={0}>No texts available</option>
                  )}
                </select>              
              </div>
              <div>
                <label className="block text-sm font-medium">Penalties</label>
                <input
                  type="text"
                  value={legalTextForm.penalties}
                  onChange={e => setLegalTextForm({ ...legalTextForm, penalties: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Incentives</label>
                <input
                  type="text"
                  value={legalTextForm.incentives}
                  onChange={e => setLegalTextForm({ ...legalTextForm, incentives: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Risks</label>
                <input
                  type="text"
                  value={legalTextForm.risks}
                  onChange={e => setLegalTextForm({ ...legalTextForm, risks: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Opportunities</label>
                <input
                  type="text"
                  value={legalTextForm.opportunities}
                  onChange={e => setLegalTextForm({ ...legalTextForm, opportunities: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Follow Up</label>
                <input
                  type="text"
                  value={legalTextForm.followUp}
                  onChange={e => setLegalTextForm({ ...legalTextForm, followUp: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLegalTextModal(false)}>Close</Button>
            <Button variant="primary" onClick={handleAddLegalText}>Add</Button>
          </Modal.Footer>
        </Modal>

        {/* Requirement Modal */}
        <Modal show={showRequirementModal} onHide={() => setShowRequirementModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Requirement</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Requirement</label>
                <select
                  value={requirementForm.textRequirementId}
                  onChange={e => setRequirementForm({ ...requirementForm, textRequirementId: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  <option value={0}>Select Requirement</option>
                  {availableRequirements.length > 0 ? (
                    availableRequirements.map(req => (
                      <option key={req.requirementId} value={req.requirementId}>
                        {req.description}
                      </option>
                    ))
                  ) : (
                    <option value={0}>No requirements available (add Legal Texts first)</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Implementation</label>
                <input
                  type="text"
                  value={requirementForm.implementation}
                  onChange={e => setRequirementForm({ ...requirementForm, implementation: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Communication</label>
                <input
                  type="text"
                  value={requirementForm.communication}
                  onChange={e => setRequirementForm({ ...requirementForm, communication: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Follow Up</label>
                <input
                  type="text"
                  value={requirementForm.followUp}
                  onChange={e => setRequirementForm({ ...requirementForm, followUp: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRequirementModal(false)}>Close</Button>
            <Button variant="primary" onClick={handleAddRequirement}>Add</Button>
          </Modal.Footer>
        </Modal>

        {/* Action Modal */}
        <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Action</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={actionForm.description}
                  onChange={e => setActionForm({ ...actionForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Source</label>
                <input
                  type="text"
                  value={actionForm.source}
                  onChange={e => setActionForm({ ...actionForm, source: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <input
                  type="text"
                  value={actionForm.status}
                  onChange={e => setActionForm({ ...actionForm, status: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Observation</label>
                <input
                  type="text"
                  value={actionForm.observation}
                  onChange={e => setActionForm({ ...actionForm, observation: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Follow Up</label>
                <input
                  type="text"
                  value={actionForm.followUp}
                  onChange={e => setActionForm({ ...actionForm, followUp: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowActionModal(false)}>Close</Button>
            <Button variant="primary" onClick={handleAddAction}>Add</Button>
          </Modal.Footer>
        </Modal>

        {/* Stakeholder Modal */}
        <Modal show={showStakeholderModal} onHide={() => setShowStakeholderModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Stakeholder</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={stakeholderForm.stakeholderName}
                  onChange={e => setStakeholderForm({ ...stakeholderForm, stakeholderName: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Relationship Status</label>
                <select
                  value={stakeholderForm.relationshipStatus}
                  onChange={e => setStakeholderForm({ ...stakeholderForm, relationshipStatus: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Status</option>
                  <option value="Need/Expectation">Need/Expectation</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Observation">Observation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Reason</label>
                <input
                  type="text"
                  value={stakeholderForm.reason}
                  onChange={e => setStakeholderForm({ ...stakeholderForm, reason: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Action</label>
                <input
                  type="text"
                  value={stakeholderForm.action}
                  onChange={e => setStakeholderForm({ ...stakeholderForm, action: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Follow Up</label>
                <input
                  type="text"
                  value={stakeholderForm.followUp}
                  onChange={e => setStakeholderForm({ ...stakeholderForm, followUp: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStakeholderModal(false)}>Close</Button>
            <Button variant="primary" onClick={handleAddStakeholder}>Add</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default RevueDetailPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Edit, Trash2 } from 'lucide-react';
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
    createdById: number;
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
    createdById: number;
  }>;
  actions: Array<{
    actionId: number;
    description: string;
    source: string;
    status: string;
    observation: string;
    followUp: string;
    createdById: number;
  }>;
  stakeholders: Array<{
    stakeholderId: number;
    stakeholderName: string;
    relationshipStatus: string;
    reason: string;
    action: string;
    followUp: string;
    createdById: number;
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

interface User {
  userId: number;
  username: string;
  role: string;
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
  const [userId, setUserId] = useState<number>(0);

  // Modal states
  const [showLegalTextModal, setShowLegalTextModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showStakeholderModal, setShowStakeholderModal] = useState(false);

  // Edit states
  const [editingLegalText, setEditingLegalText] = useState<any>(null);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);
  const [editingAction, setEditingAction] = useState<any>(null);
  const [editingStakeholder, setEditingStakeholder] = useState<any>(null);

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
    // Get user info
    const verifyAuth = async () => {
      try {
        const response = await axios.get('/api/auth/verify');
        setUserRole(response.data.role);
        setUserId(response.data.userId);
      } catch (err) {
        console.error('Échec de la vérification de l\'authentification:', err);
      }
    };
    
    verifyAuth();
    fetchReview();
    fetchTexts();
  }, [id]);

const getStatusDisplay = (status: string) => {
  const displayMap:  { [key: string]: string } = {
    'Draft': 'Brouillon',
    'In Progress': 'En cours',
    'Completed': 'Terminé',
    'Canceled': 'Annulé'
  };
  return displayMap[status] || status;
};

const canModifyReviewStatus = () => {
    return userRole === 'SubscriptionManager';
  };

const canAddContent = () => {
  return (userRole === 'SubscriptionManager' || userRole === 'Auditor') && 
         review?.status === 'In Progress';
};

  const canDeleteItem = (itemCreatedById: number) => {
    if (review?.status !== 'In Progress') return false;
    if (userRole === 'SubscriptionManager') return true;
    if (userRole === 'Auditor') return itemCreatedById === userId;
    return false;
  };

  const canModifyItem = (itemCreatedById: number) => {
    if (review?.status !== 'In Progress') return false;
    if (userRole === 'SubscriptionManager') return true;
    if (userRole === 'Auditor') return itemCreatedById === userId;
    return false;
  };

const canGeneratePdf = () => {
  return review?.status === 'Completed' || review?.status === 'Canceled';
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
        setError('Échec du chargement des détails de la revue');
        setLoading(false);
      });
  };

  const fetchTexts = async () => {
    try {
      const response = await axios.get('/api/texts');
      console.log('Réponse brute de l\'API Textes:', response.data);
      
      const fetchedTexts = response.data.texts || [];
      console.log('Textes récupérés:', fetchedTexts);
      
      setTexts(fetchedTexts);
      setTextsLoaded(true);
    } catch (err) {
      console.error('Échec du chargement des textes', err);
      setTexts([]);
      setTextsLoaded(true);
    }
  };

  const fetchAvailableRequirements = async () => {
    try {
      const response = await axios.get(`/api/revue/${id}/available-requirements`);
      setAvailableRequirements(response.data);
    } catch (err) {
      console.error('Échec du chargement des exigences disponibles', err);
      setAvailableRequirements([]);
    }
  };

  const handleCompleteReview = () => {
    if (!window.confirm('Êtes-vous sûr de vouloir finaliser cette revue ? Cette action est irréversible.')) {
      return;
    }

    axios.post(`/api/revue/${review?.revueId}/complete`)
      .then(() => fetchReview())
      .catch(err => {
        console.error('Complete review error:', err.response);
        const errorMsg = err.response?.data?.message || err.response?.data || 'Échec de la finalisation de la revue';
        alert(`Échec de la finalisation de la revue: ${errorMsg}`);
      });
  };
const handleStartReview = () => {
  if (! window.confirm('Êtes-vous sûr de vouloir démarrer cette revue ?')) {
    return;
  }

  axios.put(`/api/revue/${review?.revueId}`, { reviewDate: review?.reviewDate, status: 'In Progress' })
    .then(() => fetchReview())
    .catch(err => alert('Échec du démarrage de la revue'));
};

const handleCancelReview = () => {
  if (!window.confirm('Êtes-vous sûr de vouloir annuler cette revue ?  Cette action est irréversible. ')) {
    return;
  }

  axios.put(`/api/revue/${review?.revueId}`, { reviewDate: review?.reviewDate, status: 'Canceled' })
    .then(() => fetchReview())
    .catch(err => alert('Échec de l\'annulation de la revue'));
};

  // Edit handlers
  const handleEditLegalText = (legalText: any) => {
    setEditingLegalText(legalText);
    setLegalTextForm({
      textId: legalText.textId,
      penalties: legalText.penalties,
      incentives: legalText.incentives,
      risks: legalText.risks,
      opportunities: legalText.opportunities,
      followUp: legalText.followUp,
    });
    setShowLegalTextModal(true);
  };

  const handleEditRequirement = (requirement: any) => {
    setEditingRequirement(requirement);
    setRequirementForm({
      textRequirementId: requirement.textRequirementId,
      implementation: requirement.implementation,
      communication: requirement.communication,
      followUp: requirement.followUp,
    });
    setShowRequirementModal(true);
  };

  const handleEditAction = (action: any) => {
    setEditingAction(action);
    setActionForm({
      description: action.description,
      source: action.source,
      status: action.status,
      observation: action.observation,
      followUp: action.followUp,
    });
    setShowActionModal(true);
  };

  const handleEditStakeholder = (stakeholder: any) => {
    setEditingStakeholder(stakeholder);
    setStakeholderForm({
      stakeholderName: stakeholder.stakeholderName,
      relationshipStatus: stakeholder.relationshipStatus,
      reason: stakeholder.reason,
      action: stakeholder.action,
      followUp: stakeholder.followUp,
    });
    setShowStakeholderModal(true);
  };

  const handleAddLegalText = () => {
    if (legalTextForm.textId === 0) {
      alert('Veuillez sélectionner un texte');
      return;
    }

    const url = editingLegalText 
      ? `/api/revue/${review?.revueId}/legaltext/${editingLegalText.legalTextId}`
      : `/api/revue/${review?.revueId}/legaltext`;
    
    const method = editingLegalText ? 'put' : 'post';
    const data = editingLegalText 
      ? { 
          penalties: legalTextForm.penalties,
          incentives: legalTextForm.incentives,
          risks: legalTextForm.risks,
          opportunities: legalTextForm.opportunities,
          followUp: legalTextForm.followUp 
        }
      : legalTextForm;

    axios[method](url, data)
      .then(() => {
        setShowLegalTextModal(false);
        setLegalTextForm({ textId: 0, penalties: '', incentives: '', risks: '', opportunities: '', followUp: '' });
        setEditingLegalText(null);
        fetchReview();
      })
      .catch(err => alert(`Échec ${editingLegalText ? 'de la modification' : 'de l\'ajout'} du texte légal`));
  };

  const handleAddRequirement = () => {
    if (requirementForm.textRequirementId === 0) {
      alert('Veuillez sélectionner une exigence');
      return;
    }
    
    const url = editingRequirement 
      ? `/api/revue/${review?.revueId}/requirement/${editingRequirement.requirementId}`
      : `/api/revue/${review?.revueId}/requirement`;
    
    const method = editingRequirement ? 'put' : 'post';
    const data = editingRequirement 
      ? {
          Implementation: requirementForm.implementation,
          Communication: requirementForm.communication,
          FollowUp: requirementForm.followUp
        }
      : {
          TextRequirementId: requirementForm.textRequirementId,
          Implementation: requirementForm.implementation,
          Communication: requirementForm.communication,
          FollowUp: requirementForm.followUp
        };
    
    axios[method](url, data)
      .then(() => {
        setShowRequirementModal(false);
        setRequirementForm({ textRequirementId: 0, implementation: '', communication: '', followUp: '' });
        setEditingRequirement(null);
        fetchReview();
      })
      .catch(err => {
        console.error(`Échec ${editingRequirement ? 'de la modification' : 'de l\'ajout'} de l'exigence:`, err);
        alert(`Échec ${editingRequirement ? 'de la modification' : 'de l\'ajout'} de l'exigence: ${err.response?.data?.message || err.message}`);
      });
  };

  const handleAddAction = () => {
    if (!actionForm.description) {
      alert('La description est requise');
      return;
    }

    const url = editingAction 
      ? `/api/revue/${review?.revueId}/action/${editingAction.actionId}`
      : `/api/revue/${review?.revueId}/action`;
    
    const method = editingAction ? 'put' : 'post';

    axios[method](url, actionForm)
      .then(() => {
        setShowActionModal(false);
        setActionForm({ description: '', source: '', status: '', observation: '', followUp: '' });
        setEditingAction(null);
        fetchReview();
      })
      .catch(err => alert(`Échec ${editingAction ? 'de la modification' : 'de l\'ajout'} de l'action`));
  };

  const handleAddStakeholder = () => {
    if (!stakeholderForm.stakeholderName) {
      alert('Le nom de la partie prenante est requis');
      return;
    }

    const url = editingStakeholder 
      ? `/api/revue/${review?.revueId}/stakeholder/${editingStakeholder.stakeholderId}`
      : `/api/revue/${review?.revueId}/stakeholder`;
    
    const method = editingStakeholder ? 'put' : 'post';

    axios[method](url, stakeholderForm)
      .then(() => {
        setShowStakeholderModal(false);
        setStakeholderForm({ stakeholderName: '', relationshipStatus: '', reason: '', action: '', followUp: '' });
        setEditingStakeholder(null);
        fetchReview();
      })
      .catch(err => alert(`Échec ${editingStakeholder ? 'de la modification' : 'de l\'ajout'} de la partie prenante`));
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
        console.error('Échec de la génération du PDF:', err);
        alert('Échec de la génération du PDF. Veuillez réessayer.');
      });
  };

  const handleShowRequirementModal = () => {
    if (!editingRequirement) {
      fetchAvailableRequirements();
    }
    setShowRequirementModal(true);
  };

  const handleCloseModal = (modalType: string) => {
    switch (modalType) {
      case 'legalText':
        setShowLegalTextModal(false);
        setEditingLegalText(null);
        setLegalTextForm({ textId: 0, penalties: '', incentives: '', risks: '', opportunities: '', followUp: '' });
        break;
      case 'requirement':
        setShowRequirementModal(false);
        setEditingRequirement(null);
        setRequirementForm({ textRequirementId: 0, implementation: '', communication: '', followUp: '' });
        break;
      case 'action':
        setShowActionModal(false);
        setEditingAction(null);
        setActionForm({ description: '', source: '', status: '', observation: '', followUp: '' });
        break;
      case 'stakeholder':
        setShowStakeholderModal(false);
        setEditingStakeholder(null);
        setStakeholderForm({ stakeholderName: '', relationshipStatus: '', reason: '', action: '', followUp: '' });
        break;
    }
  };

  // Delete handlers
  const handleDeleteLegalText = (legalTextId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce texte légal ?')) {
      return;
    }

    axios.delete(`/api/revue/${review?.revueId}/legaltext/${legalTextId}`)
      .then(() => fetchReview())
      .catch(err => alert('Échec de la suppression du texte légal'));
  };

  const handleDeleteRequirement = (requirementId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette exigence ?')) {
      return;
    }

    axios.delete(`/api/revue/${review?.revueId}/requirement/${requirementId}`)
      .then(() => fetchReview())
      .catch(err => alert('Échec de la suppression de l\'exigence'));
  };

  const handleDeleteAction = (actionId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
      return;
    }

    axios.delete(`/api/revue/${review?.revueId}/action/${actionId}`)
      .then(() => fetchReview())
      .catch(err => alert('Échec de la suppression de l\'action'));
  };

  const handleDeleteStakeholder = (stakeholderId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette partie prenante ?')) {
      return;
    }

    axios.delete(`/api/revue/${review?.revueId}/stakeholder/${stakeholderId}`)
      .then(() => fetchReview())
      .catch(err => alert('Échec de la suppression de la partie prenante'));
  };

  if (loading) return <div className="text-center p-4">Chargement...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!review) return <div className="text-center p-4">Revue non trouvée</div>;

  return (
    <div className="revue-detail">
      <div className="container">
        <h1 className="text-3xl font-bold mb-4">ID de la revue : {review.revueId}</h1>
        
        <div className="info-card">
          <p><strong>Domaine :</strong> {review.domainName}</p>
          <p><strong>Date de la revue :</strong> {new Date(review.reviewDate).toLocaleDateString('fr-FR')}</p>
          <p><strong>Statut :</strong> <span className={`status-badge status-${review.status.toLowerCase().replace(' ', '')}`}>{getStatusDisplay(review.status)}</span></p>
          {review.pdfFilePath && (
            <p><strong>PDF :</strong> <a href={review.pdfFilePath} download>Télécharger</a></p>
          )}
        </div>

        <div className="action-buttons-row">
{/* Start Review Button */}
{review.status === 'Draft' && canModifyReviewStatus() && (
  <button onClick={handleStartReview} className="action-btn-primary btn-start">
    Démarrer la revue
  </button>
)}

{review.status === 'In Progress' && canModifyReviewStatus() && (
  <button onClick={handleCompleteReview} className="action-btn-primary btn-complete">
    Finaliser la revue
  </button>
)}

{review.status === 'In Progress' && canModifyReviewStatus() && (
  <button onClick={handleCancelReview} className="action-btn-primary btn-cancel">
    Annuler la revue
  </button>
)}
          
          {/* Generate PDF Button */}
          {canGeneratePdf() && (
            <button onClick={handleGeneratePdf} className="action-btn-primary btn-pdf">
              Générer le PDF
            </button>
          )}
        </div>

        {/* Legal Texts */}
        <section className="section">
          <div className="section-header">
            <h2>Textes légaux</h2>
            {canAddContent() && (
              <button onClick={() => setShowLegalTextModal(true)} className="add-btn">
                Ajouter un texte légal
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Sanctions</th>
                  <th>Incitations</th>
                  <th>Risques</th>
                  <th>Opportunités</th>
                  <th>Suivi</th>
                  {review.status === 'In Progress' && <th>Actions</th>}
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
                    {review.status === 'In Progress' && (
                      <td>
                        <div className="action-buttons">
                          {canModifyItem(lt.createdById) && (
                            <button 
                              onClick={() => handleEditLegalText(lt)}
                              className="btn-action btn-edit"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canDeleteItem(lt.createdById) && (
                            <button 
                              onClick={() => handleDeleteLegalText(lt.legalTextId)}
                              className="btn-action btn-delete"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Requirements */}
        <section className="section">
          <div className="section-header">
            <h2>Exigences</h2>
            {canAddContent() && (
              <button onClick={handleShowRequirementModal} className="add-btn">
                Ajouter une exigence
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Référence du texte</th>
                  <th>Exigence</th>
                  <th>Mise en œuvre</th>
                  <th>Communication</th>
                  <th>Suivi</th>
                  {review.status === 'In Progress' && <th>Actions</th>}
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
                    {review.status === 'In Progress' && (
                      <td>
                        <div className="action-buttons">
                          {canModifyItem(req.createdById) && (
                            <button 
                              onClick={() => handleEditRequirement(req)}
                              className="btn-action btn-edit"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canDeleteItem(req.createdById) && (
                            <button 
                              onClick={() => handleDeleteRequirement(req.requirementId)}
                              className="btn-action btn-delete"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
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
            {canAddContent() && (
              <button onClick={() => setShowActionModal(true)} className="add-btn">
                Ajouter une action
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Source</th>
                  <th>Statut</th>
                  <th>Observation</th>
                  <th>Suivi</th>
                  {review.status === 'In Progress' && <th>Actions</th>}
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
                    {review.status === 'In Progress' && (
                      <td>
                        <div className="action-buttons">
                          {canModifyItem(act.createdById) && (
                            <button 
                              onClick={() => handleEditAction(act)}
                              className="btn-action btn-edit"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canDeleteItem(act.createdById) && (
                            <button 
                              onClick={() => handleDeleteAction(act.actionId)}
                              className="btn-action btn-delete"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Stakeholders */}
        <section className="section">
          <div className="section-header">
            <h2>Parties prenantes</h2>
            {canAddContent() && (
              <button onClick={() => setShowStakeholderModal(true)} className="add-btn">
                Ajouter une partie prenante
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Statut de la relation</th>
                  <th>Raison</th>
                  <th>Action</th>
                  <th>Suivi</th>
                  {review.status === 'In Progress' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {review.stakeholders.map(stake => (
                  <tr key={stake.stakeholderId}>
                    <td>{stake.stakeholderName}</td>
                    <td>{stake.relationshipStatus === 'Need/Expectation' ? 'Besoin/Attente' : stake.relationshipStatus === 'Complaint' ? 'Plainte' : stake.relationshipStatus === 'Observation' ? 'Observation' : stake.relationshipStatus}</td>
                    <td>{stake.reason}</td>
                    <td>{stake.action}</td>
                    <td>{stake.followUp}</td>
                    {review.status === 'In Progress' && (
                      <td>
                        <div className="action-buttons">
                          {canModifyItem(stake.createdById) && (
                            <button 
                              onClick={() => handleEditStakeholder(stake)}
                              className="btn-action btn-edit"
                              title="Modifier"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {canDeleteItem(stake.createdById) && (
                            <button 
                              onClick={() => handleDeleteStakeholder(stake.stakeholderId)}
                              className="btn-action btn-delete"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Legal Text Modal */}
        {showLegalTextModal && (
          <div className="modal-overlay" onClick={() => handleCloseModal('legalText')}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', width: '90vw', maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>{editingLegalText ? 'Modifier le texte légal' : 'Ajouter un texte légal'}</h2>
                <button className="modal-close" onClick={() => handleCloseModal('legalText')}>&times;</button>
              </div>
              <div className="modal-body" style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
                <div className="form-group">
                  <label>Texte</label>
                  <select
                    value={legalTextForm.textId}
                    onChange={e => setLegalTextForm({ ...legalTextForm, textId: parseInt(e.target.value) })}
                    disabled={editingLegalText}
                  >
                    <option value={0}>Sélectionner un texte</option>
                    {texts.length > 0 ? (
                      texts.map(text => (
                        <option key={text.textId} value={text.textId}>{text.reference}</option>
                      ))
                    ) : (
                      <option value={0}>Aucun texte disponible</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sanctions</label>
                  <input
                    type="text"
                    value={legalTextForm.penalties}
                    onChange={e => setLegalTextForm({ ...legalTextForm, penalties: e.target.value })}
                    placeholder="Entrer les sanctions"
                  />
                </div>
                <div className="form-group">
                  <label>Incitations</label>
                  <input
                    type="text"
                    value={legalTextForm.incentives}
                    onChange={e => setLegalTextForm({ ...legalTextForm, incentives: e.target.value })}
                    placeholder="Entrer les incitations"
                  />
                </div>
                <div className="form-group">
                  <label>Risques</label>
                  <input
                    type="text"
                    value={legalTextForm.risks}
                    onChange={e => setLegalTextForm({ ...legalTextForm, risks: e.target.value })}
                    placeholder="Entrer les risques"
                  />
                </div>
                <div className="form-group">
                  <label>Opportunités</label>
                  <input
                    type="text"
                    value={legalTextForm.opportunities}
                    onChange={e => setLegalTextForm({ ...legalTextForm, opportunities: e.target.value })}
                    placeholder="Entrer les opportunités"
                  />
                </div>
                <div className="form-group">
                  <label>Suivi</label>
                  <input
                    type="text"
                    value={legalTextForm.followUp}
                    onChange={e => setLegalTextForm({ ...legalTextForm, followUp: e.target.value })}
                    placeholder="Entrer le suivi"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => handleCloseModal('legalText')}>Fermer</button>
                <button className="btn-primary" onClick={handleAddLegalText}>
                  {editingLegalText ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Requirement Modal */}
        {showRequirementModal && (
          <div className="modal-overlay" onClick={() => handleCloseModal('requirement')}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', width: '90vw', maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>{editingRequirement ? 'Modifier l\'exigence' : 'Ajouter une exigence'}</h2>
                <button className="modal-close" onClick={() => handleCloseModal('requirement')}>&times;</button>
              </div>
              <div className="modal-body" style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
                <div className="form-group">
                  <label>Exigence</label>
                  <select
                    value={requirementForm.textRequirementId}
                    onChange={e => setRequirementForm({ ...requirementForm, textRequirementId: parseInt(e.target.value) })}
                    disabled={editingRequirement}
                  >
                    <option value={0}>Sélectionner une exigence</option>
                    {availableRequirements.length > 0 ? (
                      availableRequirements.map(req => (
                        <option key={req.requirementId} value={req.requirementId}>
                          {req.description}
                        </option>
                      ))
                    ) : (
                      <option value={0}>Aucune exigence disponible (ajouter des textes légaux d'abord)</option>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mise en œuvre</label>
                  <input
                    type="text"
                    value={requirementForm.implementation}
                    onChange={e => setRequirementForm({ ...requirementForm, implementation: e.target.value })}
                    placeholder="Entrer la mise en œuvre"
                  />
                </div>
                <div className="form-group">
                  <label>Communication</label>
                  <input
                    type="text"
                    value={requirementForm.communication}
                    onChange={e => setRequirementForm({ ...requirementForm, communication: e.target.value })}
                    placeholder="Entrer la communication"
                  />
                </div>
                <div className="form-group">
                  <label>Suivi</label>
                  <input
                    type="text"
                    value={requirementForm.followUp}
                    onChange={e => setRequirementForm({ ...requirementForm, followUp: e.target.value })}
                    placeholder="Entrer le suivi"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => handleCloseModal('requirement')}>Fermer</button>
                <button className="btn-primary" onClick={handleAddRequirement}>
                  {editingRequirement ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {showActionModal && (
          <div className="modal-overlay" onClick={() => handleCloseModal('action')}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', width: '90vw', maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>{editingAction ? 'Modifier l\'action' : 'Ajouter une action'}</h2>
                <button className="modal-close" onClick={() => handleCloseModal('action')}>&times;</button>
              </div>
              <div className="modal-body" style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={actionForm.description}
                    onChange={e => setActionForm({ ...actionForm, description: e.target.value })}
                    placeholder="Entrer la description"
                  />
                </div>
                <div className="form-group">
                  <label>Source</label>
                  <input
                    type="text"
                    value={actionForm.source}
                    onChange={e => setActionForm({ ...actionForm, source: e.target.value })}
                    placeholder="Entrer la source"
                  />
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={actionForm.status}
                    onChange={e => setActionForm({ ...actionForm, status: e.target.value })}
                  >
                    <option value="">Sélectionner le statut</option>
                    <option value="Pending">En attente</option>
                    <option value="In Progress">En cours</option>
                    <option value="Completed">Terminé</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Observation</label>
                  <textarea
                    value={actionForm.observation}
                    onChange={e => setActionForm({ ...actionForm, observation: e.target.value })}
                    placeholder="Entrer l'observation"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Suivi</label>
                  <textarea
                    value={actionForm.followUp}
                    onChange={e => setActionForm({ ...actionForm, followUp: e.target.value })}
                    placeholder="Entrer le suivi"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => handleCloseModal('action')}>Fermer</button>
                <button className="btn-primary" onClick={handleAddAction}>
                  {editingAction ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stakeholder Modal */}
        {showStakeholderModal && (
          <div className="modal-overlay" onClick={() => handleCloseModal('stakeholder')}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', width: '90vw', maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>{editingStakeholder ? 'Modifier la partie prenante' : 'Ajouter une partie prenante'}</h2>
                <button className="modal-close" onClick={() => handleCloseModal('stakeholder')}>&times;</button>
              </div>
              <div className="modal-body" style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={stakeholderForm.stakeholderName}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, stakeholderName: e.target.value })}
                    placeholder="Entrer le nom"
                  />
                </div>
                <div className="form-group">
                  <label>Statut de la relation</label>
                  <select
                    value={stakeholderForm.relationshipStatus}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, relationshipStatus: e.target.value })}
                  >
                    <option value="">Sélectionner le statut</option>
                    <option value="Need/Expectation">Besoin/Attente</option>
                    <option value="Complaint">Plainte</option>
                    <option value="Observation">Observation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Raison</label>
                  <textarea
                    value={stakeholderForm.reason}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, reason: e.target.value })}
                    placeholder="Entrer la raison"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Action</label>
                  <textarea
                    value={stakeholderForm.action}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, action: e.target.value })}
                    placeholder="Entrer l'action"
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Suivi</label>
                  <textarea
                    value={stakeholderForm.followUp}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, followUp: e.target.value })}
                    placeholder="Entrer le suivi"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => handleCloseModal('stakeholder')}>Fermer</button>
                <button className="btn-primary" onClick={handleAddStakeholder}>
                  {editingStakeholder ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevueDetailPage;
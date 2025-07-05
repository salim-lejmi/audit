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
          console.error('Échec de la vérification de l\'authentification:', err);
        }
      };
      
      verifyAuth();
      fetchReview();
      fetchTexts();
    }, [id]);

    const handleCompleteReview = () => {
      if (!window.confirm('Êtes-vous sûr de vouloir finaliser cette revue ? Cette action est irréversible.')) {
        return;
      }

      axios.post(`/api/revue/${review?.revueId}/complete`)
        .then(() => fetchReview())
        .catch(err => alert('Échec de la finalisation de la revue'));
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

    const handleAddLegalText = () => {
      if (legalTextForm.textId === 0) {
        alert('Veuillez sélectionner un texte');
        return;
      }
      axios.post(`/api/revue/${review?.revueId}/legaltext`, legalTextForm)
        .then(() => {
          setShowLegalTextModal(false);
          setLegalTextForm({ textId: 0, penalties: '', incentives: '', risks: '', opportunities: '', followUp: '' });
          fetchReview();
        })
        .catch(err => alert('Échec de l\'ajout du texte légal'));
    };

    const handleAddRequirement = () => {
      if (requirementForm.textRequirementId === 0) {
        alert('Veuillez sélectionner une exigence');
        return;
      }
      
      const requestData = {
        TextRequirementId: requirementForm.textRequirementId,
        Implementation: requirementForm.implementation,
        Communication: requirementForm.communication,
        FollowUp: requirementForm.followUp
      };
      
      console.log('Soumission du formulaire d\'exigence:', requestData);
      
      axios.post(`/api/revue/${review?.revueId}/requirement`, requestData)
        .then(response => {
          console.log('Exigence ajoutée avec succès:', response.data);
          setShowRequirementModal(false);
          setRequirementForm({ textRequirementId: 0, implementation: '', communication: '', followUp: '' });
          fetchReview();
        })
        .catch(err => {
          console.error('Échec de l\'ajout de l\'exigence:', err);
          console.error('Données de la réponse d\'erreur:', err.response?.data);
          alert(`Échec de l'ajout de l'exigence: ${err.response?.data?.message || err.message}`);
        });
    };

    const handleAddAction = () => {
      if (!actionForm.description) {
        alert('La description est requise');
        return;
      }
      axios.post(`/api/revue/${review?.revueId}/action`, actionForm)
        .then(() => {
          setShowActionModal(false);
          setActionForm({ description: '', source: '', status: '', observation: '', followUp: '' });
          fetchReview();
        })
        .catch(err => alert('Échec de l\'ajout de l\'action'));
    };

    const handleAddStakeholder = () => {
      if (!stakeholderForm.stakeholderName) {
        alert('Le nom de la partie prenante est requis');
        return;
      }
      axios.post(`/api/revue/${review?.revueId}/stakeholder`, stakeholderForm)
        .then(() => {
          setShowStakeholderModal(false);
          setStakeholderForm({ stakeholderName: '', relationshipStatus: '', reason: '', action: '', followUp: '' });
          fetchReview();
        })
        .catch(err => alert('Échec de l\'ajout de la partie prenante'));
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

    const handleStartReview = () => {
      axios.put(`/api/revue/${review?.revueId}`, { reviewDate: review?.reviewDate, status: 'En cours' })
        .then(() => fetchReview())
        .catch(err => alert('Échec du démarrage de la revue'));
    };

    const handleCancelReview = () => {
      axios.put(`/api/revue/${review?.revueId}`, { reviewDate: review?.reviewDate, status: 'Annulé' })
        .then(() => fetchReview())
        .catch(err => alert('Échec de l\'annulation de la revue'));
    };

    const handleShowRequirementModal = () => {
      fetchAvailableRequirements();
      setShowRequirementModal(true);
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
            <p><strong>Statut :</strong> <span className={`status-badge status-${review.status.toLowerCase().replace(' ', '')}`}>{review.status === 'Draft' ? 'Brouillon' : review.status === 'In Progress' ? 'En cours' : review.status === 'Completed' ? 'Terminé' : review.status === 'Canceled' ? 'Annulé' : review.status}</span></p>
            {review.pdfFilePath && (
              <p><strong>PDF :</strong> <a href={review.pdfFilePath} download>Télécharger</a></p>
            )}
          </div>

          <div className="action-buttons-row">
            {review.status === 'Draft' && canModify() && (userRole === 'SubscriptionManager') && (
              <button onClick={handleStartReview} className="action-btn-primary btn-start">
                Démarrer la revue
              </button>
            )}
            {review.status === 'In Progress' && canModify() && (
              <button onClick={handleCompleteReview} className="action-btn-primary btn-complete">
                Finaliser la revue
              </button>
            )}
            {review.status !== 'Canceled' && review.status !== 'Completed' && canModify() && (userRole === 'SubscriptionManager') && (
              <button onClick={handleCancelReview} className="action-btn-primary btn-cancel">
                Annuler la revue
              </button>
            )}
            <button onClick={handleGeneratePdf} className="action-btn-primary btn-pdf">
              Générer le PDF
            </button>
          </div>

          {/* Legal Texts */}
          <section className="section">
            <div className="section-header">
              <h2>Textes légaux</h2>
              {canParticipate() && review.status !== 'Completed' && review.status !== 'Canceled' && (
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
              <h2>Exigences</h2>
              {canParticipate() && review.status !== 'Completed' && review.status !== 'Canceled' && (
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
              <h2>Parties prenantes</h2>
              {canParticipate() && review.status !== 'Completed' && review.status !== 'Canceled' && (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Legal Text Modal */}
          <Modal show={showLegalTextModal} onHide={() => setShowLegalTextModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter un texte légal</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Texte</label>
                  <select
                    value={legalTextForm.textId}
                    onChange={e => setLegalTextForm({ ...legalTextForm, textId: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
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
                <div>
                  <label className="block text-sm font-medium">Sanctions</label>
                  <input
                    type="text"
                    value={legalTextForm.penalties}
                    onChange={e => setLegalTextForm({ ...legalTextForm, penalties: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer les sanctions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Incitations</label>
                  <input
                    type="text"
                    value={legalTextForm.incentives}
                    onChange={e => setLegalTextForm({ ...legalTextForm, incentives: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer les incitations"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Risques</label>
                  <input
                    type="text"
                    value={legalTextForm.risks}
                    onChange={e => setLegalTextForm({ ...legalTextForm, risks: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer les risques"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Opportunités</label>
                  <input
                    type="text"
                    value={legalTextForm.opportunities}
                    onChange={e => setLegalTextForm({ ...legalTextForm, opportunities: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer les opportunités"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Suivi</label>
                  <input
                    type="text"
                    value={legalTextForm.followUp}
                    onChange={e => setLegalTextForm({ ...legalTextForm, followUp: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer le suivi"
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowLegalTextModal(false)}>Fermer</Button>
              <Button variant="primary" onClick={handleAddLegalText}>Ajouter</Button>
            </Modal.Footer>
          </Modal>

          {/* Requirement Modal */}
          <Modal show={showRequirementModal} onHide={() => setShowRequirementModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter une exigence</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Exigence</label>
                  <select
                    value={requirementForm.textRequirementId}
                    onChange={e => setRequirementForm({ ...requirementForm, textRequirementId: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
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
                <div>
                  <label className="block text-sm font-medium">Mise en œuvre</label>
                  <input
                    type="text"
                    value={requirementForm.implementation}
                    onChange={e => setRequirementForm({ ...requirementForm, implementation: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer la mise en œuvre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Communication</label>
                  <input
                    type="text"
                    value={requirementForm.communication}
                    onChange={e => setRequirementForm({ ...requirementForm, communication: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer la communication"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Suivi</label>
                  <input
                    type="text"
                    value={requirementForm.followUp}
                    onChange={e => setRequirementForm({ ...requirementForm, followUp: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer le suivi"
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowRequirementModal(false)}>Fermer</Button>
              <Button variant="primary" onClick={handleAddRequirement}>Ajouter</Button>
            </Modal.Footer>
          </Modal>

          {/* Action Modal */}
          <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter une action</Modal.Title>
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
                    placeholder="Entrer la description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Source</label>
                  <input
                    type="text"
                    value={actionForm.source}
                    onChange={e => setActionForm({ ...actionForm, source: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer la source"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Statut</label>
                  <input
                    type="text"
                    value={actionForm.status}
                    onChange={e => setActionForm({ ...actionForm, status: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer le statut"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Observation</label>
                  <input
                    type="text"
                    value={actionForm.observation}
                    onChange={e => setActionForm({ ...actionForm, observation: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer l'observation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Suivi</label>
                  <input
                    type="text"
                    value={actionForm.followUp}
                    onChange={e => setActionForm({ ...actionForm, followUp: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer le suivi"
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowActionModal(false)}>Fermer</Button>
              <Button variant="primary" onClick={handleAddAction}>Ajouter</Button>
            </Modal.Footer>
          </Modal>

          {/* Stakeholder Modal */}
          <Modal show={showStakeholderModal} onHide={() => setShowStakeholderModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter une partie prenante</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Nom</label>
                  <input
                    type="text"
                    value={stakeholderForm.stakeholderName}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, stakeholderName: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer le nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Statut de la relation</label>
                  <select
                    value={stakeholderForm.relationshipStatus}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, relationshipStatus: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Sélectionner le statut</option>
                    <option value="Need/Expectation">Besoin/Attente</option>
                    <option value="Complaint">Plainte</option>
                    <option value="Observation">Observation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Raison</label>
                  <input
                    type="text"
                    value={stakeholderForm.reason}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, reason: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer la raison"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Action</label>
                  <input
                    type="text"
                    value={stakeholderForm.action}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, action: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer l'action"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Suivi</label>
                  <input
                    type="text"
                    value={stakeholderForm.followUp}
                    onChange={e => setStakeholderForm({ ...stakeholderForm, followUp: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Entrer le suivi"
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowStakeholderModal(false)}>Fermer</Button>
              <Button variant="primary" onClick={handleAddStakeholder}>Ajouter</Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  };

  export default RevueDetailPage;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/TextModal.css';

interface Requirement {
  requirementId: number;
  number: string;
  title: string;
  status: string;
}

interface TextDetail {
  textId: number;
  domain: string;
  theme: string;
  subTheme: string;
  reference: string;
  nature: string;
  publicationYear: number;
  status: string;
  penalties: string;
  relatedTexts: string;
  effectiveDate: string;
  content: string;
  filePath: string;
  isConsulted: boolean;
  createdAt: string;
  createdBy: string;
  requirements: Requirement[];
}

interface TextModalProps {
  textId: number;
  onClose: () => void;
  userRole: string;
}

const TextModal: React.FC<TextModalProps> = ({ textId, onClose, userRole }) => {
  const [text, setText] = useState<TextDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [textStatus, setTextStatus] = useState<string>('');
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [newRequirement, setNewRequirement] = useState<{
    number: string;
    title: string;
    status: string;
  }>({
    number: '',
    title: '',
    status: 'À vérifier'
  });

  // Fetch text details
  useEffect(() => {
    const fetchTextDetail = async () => {
      try {
        const response = await axios.get(`/api/texts/${textId}`);
        setText(response.data);
        setTextStatus(response.data.status);
      } catch (err) {
        setError('Échec du chargement des détails du texte');
        console.error('Erreur lors du chargement des détails du texte:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTextDetail();
  }, [textId]);

  // Download PDF file
  const handleViewPdf = async () => {
    try {
      const response = await axios.get(`/api/texts/${textId}/file`, {
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      setPdfUrl(fileURL);
      setShowPdf(true);
    } catch (err) {
      alert('Échec du chargement du fichier PDF');
      console.error('Erreur lors du chargement du PDF:', err);
    }
  };

  // Update text status
  const handleUpdateStatus = async () => {
    if (!text) return;
    
    try {
      await axios.put(`/api/texts/${textId}/status`, { status: textStatus });
      setText({ ...text, status: textStatus });
      alert('Statut du texte mis à jour avec succès');
      setEditMode(false);
    } catch (err) {
      alert('Échec de la mise à jour du statut du texte');
      console.error('Erreur lors de la mise à jour du statut du texte:', err);
    }
  };

  // Start editing a requirement
  const startEditRequirement = (requirement: Requirement) => {
    setEditingRequirement(requirement);
  };

  // Cancel editing a requirement
  const cancelEditRequirement = () => {
    setEditingRequirement(null);
  };

  // Save edited requirement
  const saveRequirement = async () => {
    if (!editingRequirement) return;
    
    try {
      await axios.put(`/api/texts/${textId}/requirement/${editingRequirement.requirementId}`, {
        status: editingRequirement.status,
        number: editingRequirement.number,
        title: editingRequirement.title
      });
      
      // Update the requirement in the local state
      if (text) {
        const updatedRequirements = text.requirements.map(req => 
          req.requirementId === editingRequirement.requirementId ? editingRequirement : req
        );
        setText({ ...text, requirements: updatedRequirements });
      }
      
      setEditingRequirement(null);
      alert('Exigence mise à jour avec succès');
    } catch (err) {
      alert('Échec de la mise à jour de l\'exigence');
      console.error('Erreur lors de la mise à jour de l\'exigence:', err);
    }
  };

  // Add new requirement
  const addRequirement = async () => {
    if (!text) return;
    
    if (!newRequirement.number || !newRequirement.title) {
      alert('Veuillez remplir les champs Numéro et Titre');
      return;
    }
    
    try {
      const response = await axios.post(`/api/texts/${textId}/requirement`, newRequirement);
      
      // Add the new requirement to the local state
      const addedRequirement = {
        requirementId: response.data.requirementId,
        ...newRequirement
      };
      
      setText({
        ...text,
        requirements: [...text.requirements, addedRequirement]
      });
      
      // Reset the form
      setNewRequirement({
        number: '',
        title: '',
        status: 'À vérifier'
      });
      
      alert('Exigence ajoutée avec succès');
    } catch (err) {
      alert('Échec de l\'ajout de l\'exigence');
      console.error('Erreur lors de l\'ajout de l\'exigence:', err);
    }
  };

  // Delete requirement
  const deleteRequirement = async (requirementId: number) => {
    if (!text) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette exigence ?')) {
      try {
        await axios.delete(`/api/texts/${textId}/requirement/${requirementId}`);
        
        // Remove the requirement from the local state
        setText({
          ...text,
          requirements: text.requirements.filter(req => req.requirementId !== requirementId)
        });
        
        alert('Exigence supprimée avec succès');
      } catch (err) {
        alert('Échec de la suppression de l\'exigence');
        console.error('Erreur lors de la suppression de l\'exigence:', err);
      }
    }
  };

  // Handle requirement field changes when editing
  const handleRequirementChange = (field: keyof Requirement, value: string) => {
    if (!editingRequirement) return;
    
    setEditingRequirement({
      ...editingRequirement,
      [field]: value
    });
  };

  // Handle new requirement field changes
  const handleNewRequirementChange = (field: string, value: string) => {
    setNewRequirement({
      ...newRequirement,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Chargement des détails du texte...</div>
        </div>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error">{error || 'Texte non trouvé'}</div>
          <div className="modal-actions">
            <button onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content text-detail-modal">
        <div className="modal-header">
          <h2>{text.reference}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {showPdf ? (
          <div className="pdf-viewer">
            <div className="pdf-viewer-header">
              <button onClick={() => setShowPdf(false)}>Retour aux détails</button>
            </div>
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              width="100%" 
              height="600px" 
              title="Visionneuse PDF"
            />
          </div>
        ) : (
          <div className="text-detail-content">
            <div className="text-info-section">
              <div className="info-row">
                <div className="info-item">
                  <h3>Domaine</h3>
                  <p>{text.domain}</p>
                </div>
                <div className="info-item">
                  <h3>Thème</h3>
                  <p>{text.theme}</p>
                </div>
                <div className="info-item">
                  <h3>Sous-thème</h3>
                  <p>{text.subTheme || 'N/A'}</p>
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-item">
                  <h3>Nature</h3>
                  <p>{text.nature || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <h3>Année de publication</h3>
                  <p>{text.publicationYear}</p>
                </div>
                <div className="info-item">
                  <h3>Statut</h3>
                  {editMode ? (
                    <div className="edit-status">
                      <select 
                        value={textStatus} 
                        onChange={(e) => setTextStatus(e.target.value)}
                      >
                        <option value="À vérifier">À vérifier</option>
                        <option value="Applicable">Applicable</option>
                        <option value="Non applicable">Non applicable</option>
                        <option value="Pour information">Pour information</option>
                      </select>
                      <div className="status-actions">
                        <button className="btn-primary" onClick={handleUpdateStatus}>Enregistrer</button>
                        <button className="btn-secondary" onClick={() => {
                          setTextStatus(text.status);
                          setEditMode(false);
                        }}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div className="status-display">
                      <span className={`status-badge status-${text.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {text.status}
                      </span>
                      {(userRole === 'SubscriptionManager') && (
                        <button className="btn-edit-small" onClick={() => setEditMode(true)}>Modifier</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-item">
                  <h3>Sanctions</h3>
                  <p>{text.penalties || 'Aucune'}</p>
                </div>
                <div className="info-item">
                  <h3>Textes associés</h3>
                  <p>{text.relatedTexts || 'Aucun'}</p>
                </div>
                <div className="info-item">
                  <h3>Date d'effet</h3>
                  <p>{text.effectiveDate ? new Date(text.effectiveDate).toLocaleDateString('fr-FR') : 'N/A'}</p>
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-item full-width">
                  <h3>Contenu</h3>
                  <div className="text-content">
                    {text.content || 'Aucun contenu disponible'}
                  </div>
                </div>
              </div>
              
              {text.filePath && (
                <div className="info-row">
                  <div className="info-item full-width">
                    <h3>Document PDF</h3>
                    <button className="btn-primary" onClick={handleViewPdf}>Voir le PDF</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="requirements-section">
              <h3>Exigences</h3>
              
              {text.requirements.length === 0 ? (
                <p className="no-requirements">Aucune exigence définie pour ce texte.</p>
              ) : (
                <div className="requirements-list">
                  <table className="requirements-table">
                    <thead>
                      <tr>
                        <th>Numéro</th>
                        <th>Titre</th>
                        <th>Statut</th>
                        {userRole === 'SubscriptionManager' && (
                          <th>Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {text.requirements.map((req) => (
                        <tr key={req.requirementId}>
                          {editingRequirement && editingRequirement.requirementId === req.requirementId ? (
                            // Editing mode
                            <>
                              <td>
                                <input 
                                  type="text" 
                                  value={editingRequirement.number} 
                                  onChange={(e) => handleRequirementChange('number', e.target.value)}
                                />
                              </td>
                              <td>
                                <input 
                                  type="text" 
                                  value={editingRequirement.title} 
                                  onChange={(e) => handleRequirementChange('title', e.target.value)}
                                />
                              </td>
                              <td>
                                <select 
                                  value={editingRequirement.status} 
                                  onChange={(e) => handleRequirementChange('status', e.target.value)}
                                >
                                  <option value="À vérifier">À vérifier</option>
                                  <option value="Applicable">Applicable</option>
                                  <option value="Non applicable">Non applicable</option>
                                  <option value="Pour information">Pour information</option>
                                </select>
                              </td>
                              <td>
                                <div className="req-actions">
                                  <button className="btn-save" onClick={saveRequirement}>Enregistrer</button>
                                  <button className="btn-cancel" onClick={cancelEditRequirement}>Annuler</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Display mode
                            <>
                              <td>{req.number}</td>
                              <td>{req.title}</td>
                              <td>
                                <span className={`status-badge status-${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {req.status}
                                </span>
                              </td>
                              {userRole === 'SubscriptionManager' && (
                                <td>
                                  <div className="req-actions">
                                    <button 
                                      className="btn-edit-small" 
                                      onClick={() => startEditRequirement(req)}
                                    >
                                      Modifier
                                    </button>
                                    <button 
                                      className="btn-delete-small" 
                                      onClick={() => deleteRequirement(req.requirementId)}
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Add new requirement section - only for SuperAdmin and SubscriptionManager */}
              {(userRole === 'SubscriptionManager') && (
                <div className="add-requirement-section">
                  <h4>Ajouter une nouvelle exigence</h4>
                  <div className="add-requirement-form">
                    <div className="form-group">
                      <label>Numéro</label>
                      <input 
                        type="text" 
                        value={newRequirement.number}
                        onChange={(e) => handleNewRequirementChange('number', e.target.value)}
                        placeholder="ex. : Art. 5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Titre</label>
                      <input 
                        type="text" 
                        value={newRequirement.title}
                        onChange={(e) => handleNewRequirementChange('title', e.target.value)}
                        placeholder="Titre de l'exigence"
                      />
                    </div>
                    <div className="form-group">
                      <label>Statut</label>
                      <select 
                        value={newRequirement.status}
                        onChange={(e) => handleNewRequirementChange('status', e.target.value)}
                      >
                        <option value="À vérifier">À vérifier</option>
                        <option value="Applicable">Applicable</option>
                        <option value="Non applicable">Non applicable</option>
                        <option value="Pour information">Pour information</option>
                      </select>
                    </div>
                    <button className="btn-primary" onClick={addRequirement}>
                      Ajouter une exigence
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <div className="text-metadata">
                <p>Créé par : {text.createdBy || 'Inconnu'}</p>
                <p>Créé le : {new Date(text.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <button className="btn-secondary" onClick={onClose}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextModal;
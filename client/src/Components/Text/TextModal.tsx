import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, FileText, Edit3, Save, Plus, Trash2 } from 'lucide-react';
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

  const handleViewPdf = async () => {
    try {
      const response = await axios.get(`/api/texts/${textId}/file`, {
        responseType: 'blob'
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      setPdfUrl(fileURL);
      setShowPdf(true);
    } catch (err) {
      alert('Échec du chargement du fichier PDF');
      console.error('Erreur lors du chargement du PDF:', err);
    }
  };

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

  const startEditRequirement = (requirement: Requirement) => {
    setEditingRequirement(requirement);
  };

  const cancelEditRequirement = () => {
    setEditingRequirement(null);
  };

  const saveRequirement = async () => {
    if (!editingRequirement) return;
    
    try {
      await axios.put(`/api/texts/${textId}/requirement/${editingRequirement.requirementId}`, {
        status: editingRequirement.status,
        number: editingRequirement.number,
        title: editingRequirement.title
      });
      
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

  const addRequirement = async () => {
    if (!text) return;
    
    if (!newRequirement.number || !newRequirement.title) {
      alert('Veuillez remplir les champs Numéro et Titre');
      return;
    }
    
    try {
      const response = await axios.post(`/api/texts/${textId}/requirement`, newRequirement);
      
      const addedRequirement = {
        requirementId: response.data.requirementId,
        ...newRequirement
      };
      
      setText({
        ...text,
        requirements: [...text.requirements, addedRequirement]
      });
      
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

  const deleteRequirement = async (requirementId: number) => {
    if (!text) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette exigence ?')) {
      try {
        await axios.delete(`/api/texts/${textId}/requirement/${requirementId}`);
        
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

  const handleRequirementChange = (field: keyof Requirement, value: string) => {
    if (!editingRequirement) return;
    
    setEditingRequirement({
      ...editingRequirement,
      [field]: value
    });
  };

  const handleNewRequirementChange = (field: string, value: string) => {
    setNewRequirement({
      ...newRequirement,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des détails du texte...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="error-state">
            <p>{error || 'Texte non trouvé'}</p>
            <button className="btn-primary" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>{text.reference}</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {showPdf ? (
          <div className="pdf-viewer">
            <div className="pdf-viewer-header">
              <button className="btn-secondary" onClick={() => setShowPdf(false)}>
                Retour aux détails
              </button>
            </div>
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              width="100%" 
              height="600px" 
              title="Visionneuse PDF"
            />
          </div>
        ) : (
          <>
            <div className="modal-body">
              {/* Text Information */}
              <div className="form-section">
                <h3>Informations du texte</h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Domaine</label>
                    <div className="info-value">{text.domain}</div>
                  </div>
                  <div className="form-group">
                    <label>Thème</label>
                    <div className="info-value">{text.theme}</div>
                  </div>
                  <div className="form-group">
                    <label>Sous-thème</label>
                    <div className="info-value">{text.subTheme || 'N/A'}</div>
                  </div>
                  <div className="form-group">
                    <label>Nature</label>
                    <div className="info-value">{text.nature || 'N/A'}</div>
                  </div>
                  <div className="form-group">
                    <label>Année de publication</label>
                    <div className="info-value">{text.publicationYear}</div>
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    {editMode ? (
                      <div className="status-edit">
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
                          <button className="btn-save" onClick={handleUpdateStatus}>
                            <Save size={14} />
                          </button>
                          <button className="btn-cancel-small" onClick={() => {
                            setTextStatus(text.status);
                            setEditMode(false);
                          }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="status-display">
                        <span className={`status-badge status-${text.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {text.status}
                        </span>
                        {userRole === 'SubscriptionManager' && (
                          <button className="btn-edit" onClick={() => setEditMode(true)}>
                            <Edit3 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Sanctions</label>
                    <div className="info-value">{text.penalties || 'Aucune'}</div>
                  </div>
                  <div className="form-group">
                    <label>Textes associés</label>
                    <div className="info-value">{text.relatedTexts || 'Aucun'}</div>
                  </div>
                  <div className="form-group">
                    <label>Date d'effet</label>
                    <div className="info-value">
                      {text.effectiveDate ? new Date(text.effectiveDate).toLocaleDateString('fr-FR') : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="form-group form-group-full">
                  <label>Contenu</label>
                  <div className="content-box">
                    {text.content || 'Aucun contenu disponible'}
                  </div>
                </div>
                
                {text.filePath && (
                  <div className="form-group form-group-full">
                    <label>Document PDF</label>
                    <button className="btn-secondary" onClick={handleViewPdf}>
                      <FileText size={16} />
                      Voir le PDF
                    </button>
                  </div>
                )}
              </div>
              
              {/* Requirements Section */}
              <div className="form-section">
                <h3>Exigences</h3>
                
                {text.requirements.length === 0 ? (
                  <div className="empty-requirements">
                    <p>Aucune exigence définie pour ce texte</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="requirements-table">
                      <thead>
                        <tr>
                          <th>Numéro</th>
                          <th>Titre</th>
                          <th>Statut</th>
                          {userRole === 'SubscriptionManager' && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {text.requirements.map((req) => (
                          <tr key={req.requirementId}>
                            {editingRequirement && editingRequirement.requirementId === req.requirementId ? (
                              <>
                                <td>
                                  <input 
                                    type="text" 
                                    value={editingRequirement.number} 
                                    onChange={(e) => handleRequirementChange('number', e.target.value)}
                                    className="table-input"
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    value={editingRequirement.title} 
                                    onChange={(e) => handleRequirementChange('title', e.target.value)}
                                    className="table-input"
                                  />
                                </td>
                                <td>
                                  <select 
                                    value={editingRequirement.status} 
                                    onChange={(e) => handleRequirementChange('status', e.target.value)}
                                    className="table-select"
                                  >
                                    <option value="À vérifier">À vérifier</option>
                                    <option value="Applicable">Applicable</option>
                                    <option value="Non applicable">Non applicable</option>
                                    <option value="Pour information">Pour information</option>
                                  </select>
                                </td>
                                <td>
                                  <div className="table-actions">
                                    <button className="btn-save" onClick={saveRequirement}>
                                      <Save size={14} />
                                    </button>
                                    <button className="btn-cancel-small" onClick={cancelEditRequirement}>
                                      <X size={14} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
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
                                    <div className="table-actions">
                                      <button 
                                        className="btn-edit" 
                                        onClick={() => startEditRequirement(req)}
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button 
                                        className="btn-action btn-delete" 
                                        onClick={() => deleteRequirement(req.requirementId)}
                                      >
                                        <Trash2 size={14} />
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
                
                {userRole === 'SubscriptionManager' && (
                  <div className="add-requirement">
                    <h4>Ajouter une nouvelle exigence</h4>
                    <div className="form-grid">
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
                      <div className="form-group">
                        <label>&nbsp;</label>
                        <button className="btn-secondary" onClick={addRequirement}>
                          <Plus size={16} />
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="text-metadata">
                <p>Créé par : {text.createdBy || 'Inconnu'}</p>
                <p>Créé le : {new Date(text.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <button className="btn-cancel" onClick={onClose}>Fermer</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TextModal;
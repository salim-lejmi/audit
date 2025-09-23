import React, { useState, useEffect } from 'react';
import '../../styles/compliance.css';
import { 
  ArrowLeft, ArrowRight, ChevronDown, Plus, 
  Trash2, FileText, Save, Printer 
} from 'lucide-react';
import axios from 'axios';
import { TextWithRequirements, ObservationDialogState, MonitoringDialogState, FileDialogState } from '../shared/types';
import { useNavigate } from 'react-router-dom';

interface ComplianceRequirementEvaluationProps {
  textId: number;
  onBack: () => void;
}

const ComplianceRequirementEvaluation: React.FC<ComplianceRequirementEvaluationProps> = ({ textId, onBack }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<TextWithRequirements | null>(null);
  const navigate = useNavigate();
  const [expandedRequirement, setExpandedRequirement] = useState<number | null>(null);

  const [observationDialog, setObservationDialog] = useState<ObservationDialogState>({
    open: false,
    evaluationId: null,
    content: ''
  });
  
  const [monitoringDialog, setMonitoringDialog] = useState<MonitoringDialogState>({
    open: false,
    evaluationId: null,
    name: '',
    value: ''
  });
  
  const [fileDialog, setFileDialog] = useState<FileDialogState>({
    open: false,
    evaluationId: null,
    file: null
  });

  useEffect(() => {
    fetchTextWithRequirements();
  }, [textId]);

  const fetchTextWithRequirements = async () => {
    setLoading(true);
    try {
      const response = await axios.get<TextWithRequirements>(`/api/compliance/text/${textId}`);
      setData(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération du texte avec exigences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requirementId: number, status: string) => {
    try {
      await axios.post('/api/compliance/evaluate', { requirementId, status });
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'exigence:', error);
    }
  };

  const handleAddObservation = async () => {
    try {
      if (observationDialog.evaluationId === null) return;
      await axios.post('/api/compliance/observation', {
        evaluationId: observationDialog.evaluationId,
        content: observationDialog.content
      });
      setObservationDialog({ open: false, evaluationId: null, content: '' });
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'observation:', error);
    }
  };

  const handleDeleteObservation = async (observationId: number) => {
    try {
      await axios.delete(`/api/compliance/observation/${observationId}`);
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'observation:', error);
    }
  };

  const handleAddMonitoring = async () => {
    try {
      if (monitoringDialog.evaluationId === null) return;
      await axios.post('/api/compliance/monitoring-parameter', {
        evaluationId: monitoringDialog.evaluationId,
        parameterName: monitoringDialog.name,
        parameterValue: monitoringDialog.value
      });
      setMonitoringDialog({ open: false, evaluationId: null, name: '', value: '' });
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paramètre de suivi:', error);
    }
  };

  const handleDeleteMonitoring = async (parameterId: number) => {
    try {
      await axios.delete(`/api/compliance/monitoring-parameter/${parameterId}`);
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Erreur lors de la suppression du paramètre de suivi:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!fileDialog.file || fileDialog.evaluationId === null) return;
    const formData = new FormData();
    formData.append('evaluationId', fileDialog.evaluationId.toString());
    formData.append('file', fileDialog.file);
    try {
      await axios.post('/api/compliance/attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFileDialog({ open: false, evaluationId: null, file: null });
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Erreur lors du téléversement du fichier:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await axios.delete(`/api/compliance/attachment/${attachmentId}`);
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Erreur lors de la suppression de la pièce jointe:', error);
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      const response = await axios.get(`/api/compliance/attachment/${attachmentId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors du téléchargement de la pièce jointe:', error);
    }
  };

  const handleSaveToHistory = async () => {
    try {
      await axios.post('/api/compliance/save-to-history', { textId });
      alert('Évaluations enregistrées dans l\'historique avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement dans l\'historique:', error);
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await axios.get(`/api/compliance/export/${textId}`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `evaluation_conformite_${textId}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileDialog(prev => ({ ...prev, file: event.target.files![0] }));
    }
  };

  const getStatusColor = (status: string | undefined): string => {
    if (!status) return 'grey';
    switch (status.toLowerCase()) {
      case 'applicable': return 'green';
      case 'non-applicable': return 'red';
      case 'à vérifier': return 'orange';
      case 'pour information': return 'blue';
      default: return 'grey';
    }
  };

  const toggleAccordion = (requirementId: number) => {
    if (expandedRequirement === requirementId) {
      setExpandedRequirement(null);
    } else {
      setExpandedRequirement(requirementId);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Chargement des exigences...</p>
      </div>
    );
  }

  if (!data || !data.text) {
    return (
      <div>
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Retour</span>
        </button>
        <h2>Texte non trouvé</h2>
      </div>
    );
  }

  const { text, requirements } = data;

  return (
    <div className="requirement-evaluation">
   
      
      <div className="info-card-c">
        <div className="info-grid">
          <div className="info-column">
            <h2>{text.reference}</h2>
            <p><strong>Domaine :</strong> {text.domain || '-'}</p>
            <p><strong>Thème :</strong> {text.theme || '-'}</p>
            <p><strong>Sous-thème :</strong> {text.subTheme || '-'}</p>
          </div>
          <div className="info-column">
            <p><strong>Nature :</strong> {text.nature || '-'}</p>
            <p><strong>Année de Publication :</strong> {text.publicationYear || '-'}</p>
            <p><strong>Pénalités/Incitations :</strong> {text.penalties || '-'}</p>
          </div>
        </div>
      </div>
      
      <h3 className="section-title">Liste des Exigences</h3>
      
      {requirements.length === 0 ? (
        <div className="empty-state">
          <p>Aucune exigence trouvée pour ce texte.</p>
        </div>
      ) : (
        <div className="requirements-list">
          {requirements.map((req) => {
            const isExpanded = expandedRequirement === req.requirementId;
            const statusColor = getStatusColor(req.evaluation?.status || req.status);
            
            return (
              <div 
                key={req.requirementId} 
                className={`requirement-card ${isExpanded ? 'expanded' : ''}`}
              >
                <div 
                  className="requirement-header"
                  onClick={() => toggleAccordion(req.requirementId)}
                  style={{ borderLeftColor: statusColor }}
                >
                  <div className="requirement-title">
                    <span className="requirement-number">{req.number}.</span> {req.title}
                  </div>
                  <div className="requirement-info">
                    <span className={`status-badge status-${(req.evaluation?.status || req.status).toLowerCase().replace(/\s+/g, '-')}`}>
                      {req.evaluation?.status || req.status}
                    </span>
                    <ChevronDown className={`accordion-icon ${isExpanded ? 'expanded' : ''}`} size={20} />
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="requirement-content">
                    <div className="status-actions">
                      <h4>Modifier le Statut :</h4>
                      <div className="status-buttons">
                        {['applicable', 'non-applicable', 'à vérifier', 'pour information'].map((status) => (
                          <button
                            key={status}
                            className={`status-button ${status} ${(req.evaluation?.status || req.status) === status ? 'active' : ''}`}
                            onClick={() => handleStatusChange(req.requirementId, status)}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="action-row">
                      <button 
                        className="btn-secondary"
                        onClick={() => navigate(`/company/action-plan?textId=${textId}&requirementId=${req.requirementId}`)}
                      >
                        Créer une Action
                      </button>
                    </div>
                    
                    
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="footer-actions">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Textes Applicables
        </button>
        <div className="right-actions">
          <button className="btn-secondary" onClick={handleSaveToHistory}>
            <Save size={16} />
            Enregistrer dans l'Historique
          </button>
          <button className="btn-secondary" onClick={handleExportPdf}>
            <Printer size={16} />
            Exporter en PDF
          </button>
          <button className="btn-primary" onClick={() => navigate(`/company/action-plan?textId=${textId}`)}>
            Plan d'Action
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      
      {/* Dialogs */}
      {observationDialog.open && (
        <div className="modal-overlay" onClick={() => setObservationDialog({ ...observationDialog, open: false })}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajouter une Observation</h3>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Contenu de l'Observation</label>
                <textarea
                  rows={4}
                  value={observationDialog.content}
                  onChange={(e) => setObservationDialog({ ...observationDialog, content: e.target.value })}
                  placeholder="Saisir votre observation ici..."
                  autoFocus
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setObservationDialog({ ...observationDialog, open: false })}
              >
                Annuler
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAddObservation}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
      
      {monitoringDialog.open && (
        <div className="modal-overlay" onClick={() => setMonitoringDialog({ ...monitoringDialog, open: false })}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajouter un Paramètre de Suivi</h3>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Nom du Paramètre</label>
                <input
                  type="text"
                  value={monitoringDialog.name}
                  onChange={(e) => setMonitoringDialog({ ...monitoringDialog, name: e.target.value })}
                  placeholder="Entrer le nom du paramètre"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Valeur du Paramètre</label>
                <input
                  type="text"
                  value={monitoringDialog.value}
                  onChange={(e) => setMonitoringDialog({ ...monitoringDialog, value: e.target.value })}
                  placeholder="Entrer la valeur du paramètre"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setMonitoringDialog({ ...monitoringDialog, open: false })}
              >
                Annuler
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAddMonitoring}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
      
      {fileDialog.open && (
        <div className="modal-overlay" onClick={() => setFileDialog({ ...fileDialog, open: false })}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Importer un Fichier PDF</h3>
            </div>
            <div className="modal-content">
              <div className="file-upload">
                <input
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="file-upload-btn">
                  Sélectionner un Fichier
                </label>
                {fileDialog.file && (
                  <p className="file-name">Fichier sélectionné : {fileDialog.file.name}</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setFileDialog({ ...fileDialog, open: false })}
              >
                Annuler
              </button>
              <button 
                className="btn-primary" 
                onClick={handleFileUpload}
                disabled={!fileDialog.file}
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceRequirementEvaluation;
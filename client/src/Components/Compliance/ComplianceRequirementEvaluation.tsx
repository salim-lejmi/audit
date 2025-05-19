import React, { useState, useEffect } from 'react';
import '../../styles/compliance.css';

import { 
  Box, Paper, Typography, Button, Divider, 
  TextField, CircularProgress, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Accordion, AccordionSummary, 
  AccordionDetails, Chip, List, ListItem, ListItemText
} from '@mui/material';
import { 
  ArrowBack, KeyboardArrowDown, Add, Delete, 
  PictureAsPdf, Save, Print, ArrowForward
} from '@mui/icons-material';
import axios from 'axios';
import { 
  TextWithRequirements, ObservationDialogState, 
  MonitoringDialogState, FileDialogState
} from './types';
import { useNavigate } from 'react-router-dom';

interface ComplianceRequirementEvaluationProps {
  textId: number;
  onBack: () => void;
}

const ComplianceRequirementEvaluation: React.FC<ComplianceRequirementEvaluationProps> = ({ textId, onBack }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<TextWithRequirements | null>(null);
    const navigate = useNavigate();

  // Dialogs state
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
      console.error('Error fetching text with requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requirementId: number, status: string) => {
    try {
      await axios.post('/api/compliance/evaluate', {
        requirementId,
        status
      });
  
      // Refresh data
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Error updating requirement status:', error);
    }
  };

  const handleAddObservation = async () => {
    try {
      if (observationDialog.evaluationId === null) return;
      
      await axios.post('/api/compliance/observation', {
        evaluationId: observationDialog.evaluationId,
        content: observationDialog.content
      });
      
      // Close dialog and refresh data
      setObservationDialog({ open: false, evaluationId: null, content: '' });
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Error adding observation:', error);
    }
  };

  const handleDeleteObservation = async (observationId: number) => {
    try {
      await axios.delete(`/api/compliance/observation/${observationId}`);
      
      // Refresh data
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Error deleting observation:', error);
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
      
      // Close dialog and refresh data
      setMonitoringDialog({ open: false, evaluationId: null, name: '', value: '' });
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Error adding monitoring parameter:', error);
    }
  };

  const handleDeleteMonitoring = async (parameterId: number) => {
    try {
      await axios.delete(`/api/compliance/monitoring-parameter/${parameterId}`);
      
      // Refresh data
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Error deleting monitoring parameter:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!fileDialog.file || fileDialog.evaluationId === null) return;
    
    const formData = new FormData();
    formData.append('evaluationId', fileDialog.evaluationId.toString());
    formData.append('file', fileDialog.file);
    
    try {
      await axios.post('/api/compliance/attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Close dialog and refresh data
      setFileDialog({ open: false, evaluationId: null, file: null });
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await axios.delete(`/api/compliance/attachment/${attachmentId}`);
      
      // Refresh data
      fetchTextWithRequirements();
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    try {
      const response = await axios.get(`/api/compliance/attachment/${attachmentId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleSaveToHistory = async () => {
    try {
      await axios.post('/api/compliance/save-to-history', {
        textId
      });
      alert('Évaluations sauvegardées dans l\'historique avec succès');
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await axios.get(`/api/compliance/export/${textId}`);
      
      // In a real app, you would generate a PDF here using a library like jsPDF
      // For now, we'll just download the JSON data
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `compliance_evaluation_${textId}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
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
      case 'applicable':
        return 'green';
      case 'non-applicable':
        return 'red';
      case 'à vérifier':
        return 'orange';
      case 'pour information':
        return 'blue';
      default:
        return 'grey';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || !data.text) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={onBack}>
          Retour
        </Button>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Texte non trouvé
        </Typography>
      </Box>
    );
  }

  const { text, requirements } = data;

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={onBack}>
        Retour à la liste
      </Button>
      
      <Paper sx={{ p: 3, mt: 2, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid sx={{ xs: 12, md: 6 }}>
            <Typography variant="h5" gutterBottom>
              {text.reference}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Domaine:</strong> {text.domain || '-'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Thème:</strong> {text.theme || '-'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Sous-thème:</strong> {text.subTheme || '-'}
            </Typography>
          </Grid>
          <Grid sx={{ xs: 12, md: 6 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Nature:</strong> {text.nature || '-'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Année de publication:</strong> {text.publicationYear || '-'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Pénalités/Incitations:</strong> {text.penalties || '-'}
            </Typography>
          </Grid>
          <Grid sx={{ xs: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<PictureAsPdf />}
                onClick={handleExportPdf}
                sx={{ mr: 1 }}
              >
                Exporter
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Print />}
                onClick={() => window.print()}
                sx={{ mr: 1 }}
              >
                Imprimer
              </Button>
              <Button 
                variant="contained" 
                startIcon={<Save />}
                onClick={handleSaveToHistory}
              >
                Sauvegarder dans l'historique
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Liste des exigences
      </Typography>
      
      {requirements.length === 0 ? (
        <Typography>Aucune exigence trouvée pour ce texte.</Typography>
      ) : (
        requirements.map((req) => (
          <Accordion key={req.requirementId} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<KeyboardArrowDown />}
              sx={{ 
                borderLeft: `4px solid ${getStatusColor(req.evaluation?.status)}`,
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              <Grid container spacing={1} alignItems="center">
                <Grid sx={{ xs: 8 }}>
                  <Typography>
                    <strong>{req.number}.</strong> {req.title}
                  </Typography>
                </Grid>
                <Grid sx={{ xs: 4 }}>
                  <Chip 
                    label={req.evaluation?.status || 'À vérifier'}
                    size="small"
                    sx={{ 
                      bgcolor: getStatusColor(req.evaluation?.status) + '1A', 
                      color: getStatusColor(req.evaluation?.status),
                      borderRadius: 1
                    }}
                  />
                </Grid>
              </Grid>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid sx={{ xs: 12 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Modifier statut:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['applicable', 'non-applicable', 'à vérifier', 'pour information'].map((status) => (
                      <Button
                        key={status}
                        variant={req.evaluation?.status === status ? "contained" : "outlined"}
                        size="small"
                        sx={{ 
                          borderColor: getStatusColor(status),
                          bgcolor: req.evaluation?.status === status ? getStatusColor(status) : 'transparent',
                          color: req.evaluation?.status === status ? 'white' : getStatusColor(status),
                          '&:hover': { 
                            bgcolor: req.evaluation?.status === status 
                              ? getStatusColor(status) 
                              : getStatusColor(status) + '1A'
                          }
                        }}
                        onClick={() => handleStatusChange(req.requirementId, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </Box>
                </Grid>
                
                {req.evaluation && (
                  <>
                    <Grid sx={{ xs: 12 }}>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          Observations:
                        </Typography>
                        <Button 
                          startIcon={<Add />} 
                          size="small"
                          onClick={() => req.evaluation?.evaluationId && setObservationDialog({
                            open: true,
                            evaluationId: req.evaluation.evaluationId,
                            content: ''
                          })}
                        >
                          Ajouter constat
                        </Button>
                      </Box>
                      {req.evaluation.observations && req.evaluation.observations.length > 0 ? (
                        <List>
                          {req.evaluation.observations.map((obs) => (
                            <ListItem 
                              key={obs.observationId}
                              secondaryAction={
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete"
                                  size="small"
                                  onClick={() => handleDeleteObservation(obs.observationId)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={obs.content}
                                secondary={`${obs.createdBy} - ${new Date(obs.createdAt).toLocaleString()}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Aucune observation
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid sx={{ xs: 12 }}>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          Paramètres de monitoring:
                        </Typography>
                        <Button 
                          startIcon={<Add />} 
                          size="small"
                          onClick={() => req.evaluation?.evaluationId && setMonitoringDialog({
                            open: true,
                            evaluationId: req.evaluation.evaluationId,
                            name: '',
                            value: ''
                          })}
                        >
                          Ajouter paramètre
                        </Button>
                      </Box>
                      {req.evaluation.monitoringParameters && req.evaluation.monitoringParameters.length > 0 ? (
                        <List>
                          {req.evaluation.monitoringParameters.map((param) => (
                            <ListItem 
                              key={param.parameterId}
                              secondaryAction={
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete"
                                  size="small"
                                  onClick={() => handleDeleteMonitoring(param.parameterId)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={`${param.name}: ${param.value}`}
                                secondary={`Ajouté le ${new Date(param.createdAt).toLocaleString()}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Aucun paramètre de monitoring
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid sx={{ xs: 12 }}>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          Pièces jointes:
                        </Typography>
                        <Button 
                          startIcon={<Add />} 
                          size="small"
                          onClick={() => req.evaluation?.evaluationId && setFileDialog({
                            open: true,
                            evaluationId: req.evaluation.evaluationId,
                            file: null
                          })}
                        >
                          Importer PDF
                        </Button>
                      </Box>
                      {req.evaluation.attachments && req.evaluation.attachments.length > 0 ? (
                        <List>
                          {req.evaluation.attachments.map((att) => (
                            <ListItem 
                              key={att.attachmentId}
                              secondaryAction={
                                <Box>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="download"
                                    size="small"
                                    onClick={() => handleDownloadAttachment(att.attachmentId, att.fileName)}
                                    sx={{ mr: 1 }}
                                  >
                                    <PictureAsPdf fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    edge="end" 
                                    aria-label="delete"
                                    size="small"
                                    onClick={() => handleDeleteAttachment(att.attachmentId)}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={att.fileName}
                                secondary={`Ajouté le ${new Date(att.uploadedAt).toLocaleString()}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Aucune pièce jointe
                        </Typography>
                      )}
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 5 }}>
    <Button startIcon={<ArrowBack />} onClick={onBack}>
      Textes applicables
    </Button>
    <Button 
      endIcon={<ArrowForward />} 
      color="primary"
      onClick={() => navigate(`/company/action-plan?textId=${textId}`)}
    >
      Plan d'action
    </Button>
  </Box>

      {/* Observation Dialog */}
      <Dialog open={observationDialog.open} onClose={() => setObservationDialog({ ...observationDialog, open: false })}>
        <DialogTitle>Ajouter une observation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="observation"
            label="Contenu de l'observation"
            fullWidth
            multiline
            rows={4}
            value={observationDialog.content}
            onChange={(e) => setObservationDialog({ ...observationDialog, content: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setObservationDialog({ ...observationDialog, open: false })}>Annuler</Button>
          <Button onClick={handleAddObservation} variant="contained">Ajouter</Button>
        </DialogActions>
      </Dialog>

      {/* Monitoring Parameter Dialog */}
      <Dialog open={monitoringDialog.open} onClose={() => setMonitoringDialog({ ...monitoringDialog, open: false })}>
        <DialogTitle>Ajouter un paramètre de monitoring</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="parameterName"
            label="Nom du paramètre"
            fullWidth
            value={monitoringDialog.name}
            onChange={(e) => setMonitoringDialog({ ...monitoringDialog, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="parameterValue"
            label="Valeur du paramètre"
            fullWidth
            value={monitoringDialog.value}
            onChange={(e) => setMonitoringDialog({ ...monitoringDialog, value: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMonitoringDialog({ ...monitoringDialog, open: false })}>Annuler</Button>
          <Button onClick={handleAddMonitoring} variant="contained">Ajouter</Button>
        </DialogActions>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={fileDialog.open} onClose={() => setFileDialog({ ...fileDialog, open: false })}>
        <DialogTitle>Importer un fichier PDF</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="raised-button-file">
              <Button variant="outlined" component="span">
                Sélectionner un fichier
              </Button>
            </label>
            {fileDialog.file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Fichier sélectionné: {fileDialog.file.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialog({ ...fileDialog, open: false })}>Annuler</Button>
          <Button 
            onClick={handleFileUpload}
            variant="contained"
            disabled={!fileDialog.file}
          >
            Importer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceRequirementEvaluation;
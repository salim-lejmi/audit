import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Button, Grid, 
  TextField, MenuItem, CircularProgress, 
  IconButton, Chip, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, Slider,
  Divider, LinearProgress, Alert
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { 
  ArrowBack, Add, Delete, Edit, PictureAsPdf, 
  FilterAlt, Search, Clear, ArrowForward, KeyboardReturn,
  Close
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Action, Domain, Theme, SubTheme, User, ActionDialogState, TextRequirement
} from '../shared/types';
import dayjs from 'dayjs';
import '../../styles/compliance.css';

type StatusColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const ActionPlan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const textId = queryParams.get('textId') ? parseInt(queryParams.get('textId')!) : undefined;
  const requirementId = queryParams.get('requirementId') ? parseInt(queryParams.get('requirementId')!) : undefined;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [actions, setActions] = useState<Action[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requirements, setRequirements] = useState<TextRequirement[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  
  const [filters, setFilters] = useState({
    domainId: '',
    themeId: '',
    subThemeId: '',
    nature: '',
    publicationYear: '',
    keyword: '',
    responsibleId: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    mode: 'create',
    textId: undefined,
    actionId: undefined,
    data: {
      requirementId: undefined,
      description: '',
      responsibleId: 0,
      deadline: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      progress: 0,
      effectiveness: '',
      status: 'active'
    }
  });
  
  // Check if current user is an auditor (role "User")
  const isAuditor = userRole && userRole !== "SuperAdmin" && userRole !== "SubscriptionManager";
  
  useEffect(() => {
    if (textId) {
      setFilters(prev => ({ ...prev, textId: textId.toString() }));
    }
    fetchUserRole();
    fetchDomains();
    fetchUsers();
    fetchActions();
  }, [textId, requirementId]);
  
  useEffect(() => {
    if (actionDialog.open && actionDialog.textId) {
      fetchRequirements(actionDialog.textId);
    }
  }, [actionDialog.open, actionDialog.textId]);
  
  const fetchUserRole = async () => {
    try {
      const response = await axios.get<{ role: string }>('/api/auth/verify');
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle utilisateur:', error);
    }
  };
  
  const fetchDomains = async () => {
    try {
      const response = await axios.get('/api/taxonomy/domains');
      setDomains(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des domaines:', error);
    }
  };
  
  const fetchThemes = async (domainId: string) => {
    try {
      const response = await axios.get(`/api/taxonomy/themes?domainId=${domainId}`);
      setThemes(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des thèmes:', error);
    }
  };
  
  const fetchSubThemes = async (themeId: string) => {
    try {
      const response = await axios.get(`/api/taxonomy/subthemes?themeId=${themeId}`);
      setSubThemes(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des sous-thèmes:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/company/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    }
  };
  
  const fetchRequirements = async (textId: number) => {
    try {
      const response = await axios.get(`/api/compliance/text/${textId}`);
      setRequirements(response.data.requirements);
    } catch (error) {
      console.error('Erreur lors de la récupération des exigences:', error);
    }
  };
  
  const fetchActions = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      
      if (filters.domainId) params.append('domainId', filters.domainId);
      if (filters.themeId) params.append('themeId', filters.themeId);
      if (filters.subThemeId) params.append('subThemeId', filters.subThemeId);
      if (filters.nature) params.append('nature', filters.nature);
      if (filters.publicationYear) params.append('publicationYear', filters.publicationYear);
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.responsibleId) params.append('responsibleId', filters.responsibleId);
      if (filters.status) params.append('status', filters.status);
      if (textId) params.append('textId', textId.toString());
      if (requirementId) params.append('requirementId', requirementId.toString());
      
      const response = await axios.get(`/api/action-plan?${params.toString()}`);
      setActions(response.data.actions);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erreur lors de la récupération des actions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>
  ) => {
    const name = e.target.name as string;
    const value = e.target.value;
    
    setFilters(prev => ({ ...prev, [name]: value }));
    
    if (name === 'domainId') {
      setFilters(prev => ({ ...prev, themeId: '', subThemeId: '' }));
      if (value) fetchThemes(value);
    }
    
    if (name === 'themeId') {
      setFilters(prev => ({ ...prev, subThemeId: '' }));
      if (value) fetchSubThemes(value);
    }
  };
  
  const handleClearFilters = () => {
    setFilters({
      domainId: '',
      themeId: '',
      subThemeId: '',
      nature: '',
      publicationYear: '',
      keyword: '',
      responsibleId: '',
      status: ''
    });
    fetchActions(1);
  };
  
  const handleApplyFilters = () => {
    fetchActions(1);
  };
  
  const handlePageChange = (newPage: number) => {
    fetchActions(newPage);
  };
  
  const handleCreateAction = () => {
    setActionDialog({
      open: true,
      mode: 'create',
      textId: textId,
      actionId: undefined,
      data: {
        requirementId: requirementId,
        description: '',
        responsibleId: 0,
        deadline: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        progress: 0,
        effectiveness: '',
        status: 'active'
      }
    });
  };
  
  const handleEditAction = (action: Action) => {
    setActionDialog({
      open: true,
      mode: 'edit',
      actionId: action.actionId,
      textId: action.textId,
      data: {
        requirementId: action.requirementId,
        description: action.description,
        responsibleId: action.responsibleId,
        deadline: dayjs(action.deadline).format('YYYY-MM-DD'),
        progress: action.progress,
        effectiveness: action.effectiveness || '',
        status: action.status
      }
    });
  };
  
  const handleActionDialogChange = (field: string, value: unknown) => {
    setActionDialog(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value === '' ? undefined : value
      }
    }));
  };
  
  const handleActionDialogSubmit = async () => {
    try {
      const { mode, actionId, textId, data } = actionDialog;

      console.log('Soumission du dialogue d\'action:', {
        mode,
        actionId,
        textId,
        data,
        isAuditor
      });

      if (mode === 'create') {
        console.log('Création d\'une action avec les données:', {
          textId,
          requirementId: data.requirementId,
          description: data.description,
          responsibleId: data.responsibleId,
          deadline: data.deadline,
          progress: data.progress,
          effectiveness: data.effectiveness,
          status: data.status
        });

        await axios.post('/api/action-plan', {
          textId,
          requirementId: data.requirementId,
          description: data.description,
          responsibleId: data.responsibleId,
          deadline: data.deadline,
          progress: data.progress,
          effectiveness: data.effectiveness,
          status: data.status
        });

      } else {
        if (isAuditor) {
          console.log('Auditeur met à jour l\'action avec les données:', {
            actionId,
            description: data.description,
            responsibleId: data.responsibleId,
            deadline: data.deadline,
            progress: data.progress,
            effectiveness: data.effectiveness,
            status: data.status
          });

          await axios.put(`/api/action-plan/${actionId}`, {
            description: data.description,
            responsibleId: data.responsibleId,
            deadline: data.deadline,
            progress: data.progress,
            effectiveness: data.effectiveness,
            status: data.status
          });

        } else {
          console.log('Éditeur met à jour l\'action avec les données:', {
            actionId,
            description: data.description,
            responsibleId: data.responsibleId,
            deadline: data.deadline,
            progress: data.progress,
            effectiveness: data.effectiveness,
            status: data.status
          });

          await axios.put(`/api/action-plan/${actionId}`, {
            description: data.description,
            responsibleId: data.responsibleId,
            deadline: data.deadline,
            progress: data.progress,
            effectiveness: data.effectiveness,
            status: data.status
          });
        }
      }

      setActionDialog(prev => ({ ...prev, open: false }));
      fetchActions(currentPage);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de l\'action:', error);
      if (error.response) {
        console.error('Données de la réponse du serveur:', error.response.data);
        console.error('Statut de la réponse du serveur:', error.response.status);
        console.error('En-têtes de la réponse du serveur:', error.response.headers);
      } else if (error.request) {
        console.error('Aucune réponse reçue. La requête était:', error.request);
      } else {
        console.error('Erreur lors de la configuration de la requête:', error.message);
      }
    }
  };
  
  const handleDeleteAction = async (actionId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette action ?')) return;
    
    try {
      await axios.delete(`/api/action-plan/${actionId}`);
      fetchActions(currentPage);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'action:', error);
    }
  };
  
  const handleExportPdf = async () => {
    try {
      const params = new URLSearchParams();
      if (textId) params.append('textId', textId.toString());
      if (filters.responsibleId) params.append('responsibleId', filters.responsibleId);
      
      const response = await axios.get(`/api/action-plan/export?${params.toString()}`);
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `plan_action_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Erreur lors de l\'exportation du plan d\'action:', error);
    }
  };
  
  const handleNavigateToEvaluation = () => {
    if (textId) {
      navigate(`/company/compliance?textId=${textId}`);
    } else {
      navigate('/company/compliance');
    }
  };
  
  const handleNavigateToStatistics = () => {
    navigate('/company/statistics');
  };

  const getStatusColor = (status: string): StatusColor => {
    switch (status.toLowerCase()) {
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'canceled': return 'error';
      default: return 'default';
    }
  };
  
  return (
    <Container maxWidth="xl" className="compliance-container">
      <Box sx={{ my: { xs: 2, md: 4 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 600, mb: 3 }}
        >
          Plan d'Action
        </Typography>
        
        <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button startIcon={<ArrowBack />} onClick={handleNavigateToEvaluation}>
              Évaluation de Conformité
            </Button>
            <Box>
              <Button startIcon={<PictureAsPdf />} onClick={handleExportPdf} sx={{ mr: 1 }}>
                Exporter en PDF
              </Button>
              {!isAuditor && (
                <Button startIcon={<Add />} variant="contained" onClick={handleCreateAction}>
                  Nouvelle Action
                </Button>
              )}
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Button 
              startIcon={showFilters ? <Clear /> : <FilterAlt />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Masquer les Filtres' : 'Afficher les Filtres'}
            </Button>
            
            {showFilters && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="domain-label">Domaine</InputLabel>
                    <Select
                      labelId="domain-label"
                      id="domain-select"
                      name="domainId"
                      value={filters.domainId}
                      label="Domaine"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {Array.isArray(domains) ? domains.map(domain => (
                        <MenuItem key={domain.domainId} value={domain.domainId}>
                          {domain.name}
                        </MenuItem>
                      )) : null}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="theme-label">Thème</InputLabel>
                    <Select
                      labelId="theme-label"
                      id="theme-select"
                      name="themeId"
                      value={filters.themeId}
                      label="Thème"
                      onChange={handleFilterChange}
                      disabled={!filters.domainId}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {themes.map(theme => (
                        <MenuItem key={theme.themeId} value={theme.themeId}>
                          {theme.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="subtheme-label">Sous-thème</InputLabel>
                    <Select
                      labelId="subtheme-label"
                      id="subtheme-select"
                      name="subThemeId"
                      value={filters.subThemeId}
                      label="Sous-thème"
                      onChange={handleFilterChange}
                      disabled={!filters.themeId}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {subThemes.map(subTheme => (
                        <MenuItem key={subTheme.subThemeId} value={subTheme.subThemeId}>
                          {subTheme.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    id="nature"
                    name="nature"
                    label="Nature"
                    value={filters.nature}
                    onChange={handleFilterChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    id="publicationYear"
                    name="publicationYear"
                    label="Année de Publication"
                    type="number"
                    value={filters.publicationYear}
                    onChange={handleFilterChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="responsible-label">Responsable</InputLabel>
                    <Select
                      labelId="responsible-label"
                      id="responsible-select"
                      name="responsibleId"
                      value={filters.responsibleId}
                      label="Responsable"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      {users.map(user => (
                        <MenuItem key={user.userId} value={user.userId}>
                          {user.name}
                        </MenuItem>
                      ))}
                      <MenuItem value="null">Non Assigné</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-label">Statut</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status-select"
                      name="status"
                      value={filters.status}
                      label="Statut"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="completed">Terminée</MenuItem>
                      <MenuItem value="canceled">Annulée</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    id="keyword"
                    name="keyword"
                    label="Mot-clé"
                    value={filters.keyword}
                    onChange={handleFilterChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={handleClearFilters}>Réinitialiser</Button>
                    <Button 
                      variant="contained" 
                      startIcon={<Search />}
                      onClick={handleApplyFilters}
                    >
                      Rechercher
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : actions.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
              Aucune action trouvée. {!isAuditor && "Créez votre première action en cliquant sur \"Nouvelle Action\"."}
            </Typography>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <table className="actions-table">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Exigence</th>
                      <th>Description</th>
                      <th>Responsable</th>
                      <th>Échéance</th>
                      <th>Progression</th>
                      <th>Efficacité</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map(action => (
                      <tr key={action.actionId}>
                        <td>{action.textReference}</td>
                        <td>{action.requirementTitle || '-'}</td>
                        <td>{action.description}</td>
                        <td>{action.responsibleName || 'Non Assigné'}</td>
                        <td>
                          <Tooltip title={`Créée le ${new Date(action.createdAt).toLocaleDateString('fr-FR')}`}>
                            <span>{new Date(action.deadline).toLocaleDateString('fr-FR')}</span>
                          </Tooltip>
                        </td>
                        <td>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={action.progress} 
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Typography variant="body2">{action.progress}%</Typography>
                          </Box>
                        </td>
                        <td>{action.effectiveness || '-'}</td>
                        <td>
                          <Chip 
                            label={action.status}
                            size="small"
                            color={getStatusColor(action.status)}
                          />
                        </td>
                        <td>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditAction(action)}
                            aria-label="Modifier"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {!isAuditor && (
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteAction(action.actionId)}
                              aria-label="Supprimer"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
              
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Précédent
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Page {currentPage} sur {totalPages}
                    </Box>
                    <Button 
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Suivant
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 5 }}>
          <Button startIcon={<ArrowBack />} onClick={handleNavigateToEvaluation}>
            Évaluation de Conformité
          </Button>
          <Button endIcon={<ArrowForward />} onClick={handleNavigateToStatistics}>
            Statistiques
          </Button>
          <Button startIcon={<KeyboardReturn />} onClick={() => window.scrollTo(0, 0)}>
            Haut de Page
          </Button>
        </Box>
      </Box>
      
      {/* Modern Action Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog(prev => ({ ...prev, open: false }))}
        maxWidth="md"
        fullWidth
        className="modern-action-dialog"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.20)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {actionDialog.mode === 'create' ? 'Créer une Nouvelle Action' : 
             isAuditor ? 'Mettre à Jour le Statut de l\'Action' : 'Modifier une Action'}
          </Typography>
          <IconButton 
            onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}
            size="small"
            sx={{ color: 'grey.500' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {isAuditor && actionDialog.mode === 'edit' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              En tant qu'auditeur, vous pouvez uniquement modifier la progression et le statut de cette action.
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Requirement Selection - Only for creation and non-auditors */}
            {actionDialog.mode === 'create' && actionDialog.textId && !isAuditor && (
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="requirement-label">Exigence</InputLabel>
                  <Select
                    labelId="requirement-label"
                    id="requirement-select"
                    value={actionDialog.data.requirementId || ''}
                    label="Exigence"
                    onChange={(e) => handleActionDialogChange('requirementId', e.target.value)}
                  >
                    <MenuItem value="">Aucune</MenuItem>
                    {requirements.map(req => (
                      <MenuItem key={req.requirementId} value={req.requirementId}>
                        {req.number} - {req.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {/* Read-only requirement for edit mode */}
            {actionDialog.mode === 'edit' && actionDialog.data.requirementId && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Exigence
                  </Typography>
                  <Typography variant="body1">
                    {requirements.find(r => r.requirementId === actionDialog.data.requirementId)?.title || '-'}
                  </Typography>
                </Box>
              </Grid>
            )}
            
            {/* Description - Read-only for auditors in edit mode */}
            <Grid item xs={12}>
              {isAuditor && actionDialog.mode === 'edit' ? (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description de l'Action
                  </Typography>
                  <Typography variant="body1">{actionDialog.data.description}</Typography>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  id="description"
                  label="Description de l'Action"
                  value={actionDialog.data.description}
                  onChange={(e) => handleActionDialogChange('description', e.target.value)}
                  required
                  variant="outlined"
                />
              )}
            </Grid>
            
            {/* Responsible and Deadline - Read-only for auditors */}
            <Grid item xs={12} sm={6}>
              {isAuditor && actionDialog.mode === 'edit' ? (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Responsable
                  </Typography>
                  <Typography variant="body1">
                    {users.find(u => u.userId === actionDialog.data.responsibleId)?.name || 'Non Assigné'}
                  </Typography>
                </Box>
              ) : (
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="responsible-dialog-label">Responsable</InputLabel>
                  <Select
                    labelId="responsible-dialog-label"
                    id="responsible-dialog-select"
                    value={actionDialog.data.responsibleId || ''}
                    label="Responsable"
                    onChange={(e) => handleActionDialogChange('responsibleId', e.target.value === '' ? null : e.target.value)}
                  >
                    <MenuItem value="">Sélectionner un Responsable</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.userId} value={user.userId}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6}>
              {isAuditor && actionDialog.mode === 'edit' ? (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Date d'Échéance
                  </Typography>
                  <Typography variant="body1">
                    {new Date(actionDialog.data.deadline).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  id="deadline"
                  label="Date d'Échéance"
                  type="date"
                  value={actionDialog.data.deadline}
                  onChange={(e) => handleActionDialogChange('deadline', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  variant="outlined"
                />
              )}
            </Grid>
            
            {/* Progress - Editable for everyone */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Progression: {actionDialog.data.progress}%
                </Typography>
                <Slider
                  value={actionDialog.data.progress}
                  onChange={(_, value) => handleActionDialogChange('progress', value)}
                  aria-labelledby="progress-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                  sx={{
                    '& .MuiSlider-thumb': {
                      height: 20,
                      width: 20,
                    },
                    '& .MuiSlider-track': {
                      height: 6,
                    },
                    '& .MuiSlider-rail': {
                      height: 6,
                    }
                  }}
                />
              </Box>
            </Grid>
            
            {/* Effectiveness - Read-only for auditors */}
            <Grid item xs={12} sm={6}>
              {isAuditor && actionDialog.mode === 'edit' ? (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Efficacité
                  </Typography>
                  <Typography variant="body1">{actionDialog.data.effectiveness || '-'}</Typography>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  id="effectiveness"
                  label="Efficacité"
                  value={actionDialog.data.effectiveness}
                  onChange={(e) => handleActionDialogChange('effectiveness', e.target.value)}
                  helperText="Mesures d'impact, résultats de l'action"
                  variant="outlined"
                />
              )}
            </Grid>
            
            {/* Status - Editable for everyone */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="status-dialog-label">Statut</InputLabel>
                <Select
                  labelId="status-dialog-label"
                  id="status-dialog-select"
                  value={actionDialog.data.status}
                  label="Statut"
                  onChange={(e) => handleActionDialogChange('status', e.target.value)}
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Terminée</MenuItem>
                  <MenuItem value="canceled">Annulée</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleActionDialogSubmit}
            disabled={
              (actionDialog.mode === 'create' && (!actionDialog.data.description || !actionDialog.data.responsibleId || !actionDialog.data.deadline)) ||
              !actionDialog.data.status
            }
            sx={{ 
              minWidth: 120,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }
            }}
          >
            {actionDialog.mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ActionPlan;
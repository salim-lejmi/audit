import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Button, Grid, 
  TextField, MenuItem, CircularProgress, 
   IconButton, Chip, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, Slider,
  Divider, LinearProgress
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { 
  ArrowBack, Add, Delete, Edit, PictureAsPdf, 
  FilterAlt, Search, Clear, ArrowForward, KeyboardReturn
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Action, Domain, Theme, SubTheme, User, ActionDialogState
} from './types';
import dayjs from 'dayjs';
import '../../styles/compliance.css';

// Add type for valid status colors
type StatusColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const ActionPlan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Extract text and requirement IDs if passed in URL
  const textId = queryParams.get('textId') ? parseInt(queryParams.get('textId')!) : undefined;
  const requirementId = queryParams.get('requirementId') ? parseInt(queryParams.get('requirementId')!) : undefined;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [actions, setActions] = useState<Action[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Filter state
  const [domains, setDomains] = useState<Domain[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
  
  // Action dialog state
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    open: false,
    mode: 'create',
    textId: undefined,
    requirementId: undefined,
    actionId: undefined,
    data: {
      description: '',
      responsibleId: 0,
      deadline: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      progress: 0,
      effectiveness: '',
      status: 'active'
    }
  });
  
  useEffect(() => {
    // If textId and/or requirementId are provided, set them in filters
    if (textId) {
      setFilters(prev => ({ ...prev, textId: textId.toString() }));
    }
    fetchDomains();
    fetchUsers();
    fetchActions();
  }, [textId, requirementId]);
  
  const fetchDomains = async () => {
    try {
      const response = await axios.get('/api/taxonomy/domains');
          console.log('domains fetched successfully:', response.data);

      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };
  
  const fetchThemes = async (domainId: string) => {
    try {
      const response = await axios.get(`/api/taxonomy/themes?domainId=${domainId}`);
      setThemes(response.data);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };
  
  const fetchSubThemes = async (themeId: string) => {
    try {
      const response = await axios.get(`/api/taxonomy/subthemes?themeId=${themeId}`);
      setSubThemes(response.data);
    } catch (error) {
      console.error('Error fetching subthemes:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/company/users');
          console.log('Users fetched successfully:', response.data);

      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  const fetchActions = async (page: number = 1) => {
    setLoading(true);
    try {
      // Build query parameters
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
      console.error('Error fetching actions:', error);
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
    
    // If domain changes, reset theme and subTheme
    if (name === 'domainId') {
      setFilters(prev => ({ ...prev, themeId: '', subThemeId: '' }));
      if (value) fetchThemes(value);
    }
    
    // If theme changes, reset subTheme
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
      requirementId: requirementId,
      data: {
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
      requirementId: action.requirementId,
      data: {
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
        [field]: value
      }
    }));
  };
  
  const handleActionDialogSubmit = async () => {
    try {
      const { mode, actionId, textId, requirementId, data } = actionDialog;
      
      if (mode === 'create') {
        // Create action
        await axios.post('/api/action-plan', {
          textId,
          requirementId,
          description: data.description,
          responsibleId: data.responsibleId,
          deadline: data.deadline,
          progress: data.progress,
          effectiveness: data.effectiveness,
          status: data.status
        });
      } else {
        // Update action
        await axios.put(`/api/action-plan/${actionId}`, {
          description: data.description,
          responsibleId: data.responsibleId,
          deadline: data.deadline,
          progress: data.progress,
          effectiveness: data.effectiveness,
          status: data.status
        });
      }
      
      // Close dialog and refresh
      setActionDialog(prev => ({ ...prev, open: false }));
      fetchActions(currentPage);
    } catch (error) {
      console.error('Error saving action:', error);
    }
  };
  
  const handleDeleteAction = async (actionId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette action ?')) return;
    
    try {
      await axios.delete(`/api/action-plan/${actionId}`);
      fetchActions(currentPage);
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };
  
  const handleExportPdf = async () => {
    try {
      const params = new URLSearchParams();
      if (textId) params.append('textId', textId.toString());
      if (filters.responsibleId) params.append('responsibleId', filters.responsibleId);
      
      const response = await axios.get(`/api/action-plan/export?${params.toString()}`);
      
      // In a real app, you would generate a PDF here using a library like jsPDF
      // For now, we'll just download the JSON data
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `action_plan_${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Error exporting action plan:', error);
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
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <Container maxWidth="xl" className="compliance-container">
      <Box sx={{ my: { xs: 2, md: 4 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 600,
            mb: 3
          }}
        >
          Plan d'action
        </Typography>
        
        <Paper 
          elevation={0} 
          sx={{ 
            width: '100%',
            overflow: 'hidden',
            p: { xs: 2, md: 3 }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button 
              startIcon={<ArrowBack />} 
              onClick={handleNavigateToEvaluation}
            >
              Évaluation de conformité
            </Button>
            <Box>
              <Button 
                startIcon={<PictureAsPdf />}
                onClick={handleExportPdf}
                sx={{ mr: 1 }}
              >
                Exporter PDF
              </Button>
              <Button 
                startIcon={<Add />}
                variant="contained"
                onClick={handleCreateAction}
              >
                Nouvelle action
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Button 
              startIcon={showFilters ? <Clear /> : <FilterAlt />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            </Button>
            
            {showFilters && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
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
                
                <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
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
                
                <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
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
                
                <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
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
                
                <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    id="publicationYear"
                    name="publicationYear"
                    label="Année de publication"
                    type="number"
                    value={filters.publicationYear}
                    onChange={handleFilterChange}
                  />
                </Grid>
                
                <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
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
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status-select"
                      name="status"
                      value={filters.status}
                      label="Status"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">Tous</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="completed">Complétée</MenuItem>
                      <MenuItem value="canceled">Annulée</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
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
                
                <Grid item sx={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={handleClearFilters}>
                      Réinitialiser
                    </Button>
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
              Aucune action trouvée. Créez votre première action en cliquant sur "Nouvelle action".
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
                        <td>{action.responsibleName}</td>
                        <td>
                          <Tooltip title={`Créée le ${new Date(action.createdAt).toLocaleDateString()}`}>
                            <span>{new Date(action.deadline).toLocaleDateString()}</span>
                          </Tooltip>
                        </td>
                        <td>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={action.progress} 
                              sx={{ flexGrow: 1, mr: 1 }}
                            />
                            <Typography variant="body2">
                              {action.progress}%
                            </Typography>
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
                            aria-label="Edit"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteAction(action.actionId)}
                            aria-label="Delete"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
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
            Évaluation de conformité
          </Button>
          <Button endIcon={<ArrowForward />} onClick={handleNavigateToStatistics}>
            Statistiques
          </Button>
          <Button startIcon={<KeyboardReturn />} onClick={() => window.scrollTo(0, 0)}>
            Haut de page
          </Button>
        </Box>
      </Box>
      
      {/* Action Dialog */}
      <Dialog 
        open={actionDialog.open} 
        onClose={() => setActionDialog(prev => ({ ...prev, open: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.mode === 'create' ? 'Créer une nouvelle action' : 'Modifier une action'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item sx={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                id="description"
                label="Description de l'action"
                value={actionDialog.data.description}
                onChange={(e) => handleActionDialogChange('description', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item sx={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="responsible-dialog-label">Responsable</InputLabel>
                <Select
                  labelId="responsible-dialog-label"
                  id="responsible-dialog-select"
                  value={actionDialog.data.responsibleId}
                  label="Responsable"
                  onChange={(e) => handleActionDialogChange('responsibleId', e.target.value)}
                  required
                >
                  <MenuItem value={0} disabled>Sélectionner un responsable</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.userId} value={user.userId}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item sx={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                id="deadline"
                label="Date d'échéance"
                type="date"
                value={actionDialog.data.deadline}
                onChange={(e) => handleActionDialogChange('deadline', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item sx={{ xs: 12 }}>
              <Typography gutterBottom>
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
              />
            </Grid>
            
            <Grid item sx={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                id="effectiveness"
                label="Efficacité"
                value={actionDialog.data.effectiveness}
                onChange={(e) => handleActionDialogChange('effectiveness', e.target.value)}
                helperText="Par exemple: Mesures d'impact, résultats de l'action"
              />
            </Grid>
            
            <Grid item sx={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
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
                  <MenuItem value="completed">Complétée</MenuItem>
                  <MenuItem value="canceled">Annulée</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleActionDialogSubmit}
            disabled={
              !actionDialog.data.description || 
              !actionDialog.data.responsibleId ||
              !actionDialog.data.deadline ||
              !actionDialog.data.status
            }
          >
            {actionDialog.mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ActionPlan;
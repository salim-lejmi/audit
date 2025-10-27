import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, Filter, RefreshCw,
  Search, X, Plus, Edit, Trash2, FileText, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUp 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Action, Domain, Theme, SubTheme, User, ActionDialogState, TextRequirement
} from '../shared/types';
import dayjs from 'dayjs';
import '../../styles/compliance.css';  // Keep this for shared styles
import '../../styles/actionplan.css'; // Add this new import for action-plan specific styles

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
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
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
  
  const handleFilterChange = (name: string, value: string) => {
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

      if (mode === 'create') {
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
          await axios.put(`/api/action-plan/${actionId}`, {
            description: data.description,
            responsibleId: data.responsibleId,
            deadline: data.deadline,
            progress: data.progress,
            effectiveness: data.effectiveness,
            status: data.status
          });
        } else {
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

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'canceled': return 'status-canceled';
      default: return '';
    }
  };
  
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Plan d'Action</h1>
      </div>

      <div className="content-container">
        <div className="main-panel">
          {/* Controls section - matches other pages so shared CSS applies */}
          <div className="controls-section">
            <div className="search-row" style={{ alignItems: 'center', gap: '12px' }}>
              <div className="header-left">
                <button 
                  className={`btn-filter ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? <X size={16} /> : <Filter size={16} />}
                  {showFilters ? 'Masquer les Filtres' : 'Filtres'}
                </button>
              </div>

              <div className="header-actions">
                {!isAuditor && (
                  <button className="btn-primary" onClick={handleCreateAction}>
                    <Plus size={16} />
                    Nouvelle Action
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="filters-panel">
                <div className="filters-header">
                  <h3>Filtres avancés</h3>
                  <button className="btn-reset" onClick={handleClearFilters}>
                    <RefreshCw size={16} />
                    Réinitialiser
                  </button>
                </div>
                
                <div className="filters-grid">
                  <div className="form-group">
                    <label>Domaine</label>
                    <select 
                      value={filters.domainId}
                      onChange={(e) => handleFilterChange('domainId', e.target.value)}
                    >
                      <option value="">Tous</option>
                      {domains.map(domain => (
                        <option key={domain.domainId} value={domain.domainId.toString()}>
                          {domain.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Thème</label>
                    <select 
                      value={filters.themeId}
                      onChange={(e) => handleFilterChange('themeId', e.target.value)}
                      disabled={!filters.domainId}
                    >
                      <option value="">Tous</option>
                      {themes.map(theme => (
                        <option key={theme.themeId} value={theme.themeId.toString()}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Sous-thème</label>
                    <select 
                      value={filters.subThemeId}
                      onChange={(e) => handleFilterChange('subThemeId', e.target.value)}
                      disabled={!filters.themeId}
                    >
                      <option value="">Tous</option>
                      {subThemes.map(subTheme => (
                        <option key={subTheme.subThemeId} value={subTheme.subThemeId.toString()}>
                          {subTheme.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Nature</label>
                    <input 
                      type="text"
                      value={filters.nature}
                      onChange={(e) => handleFilterChange('nature', e.target.value)}
                      placeholder="Nature du texte"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Année de Publication</label>
                    <input 
                      type="number"
                      value={filters.publicationYear}
                      onChange={(e) => handleFilterChange('publicationYear', e.target.value)}
                      placeholder="Année"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Responsable</label>
                    <select 
                      value={filters.responsibleId}
                      onChange={(e) => handleFilterChange('responsibleId', e.target.value)}
                    >
                      <option value="">Tous</option>
                      {users.map(user => (
                        <option key={user.userId} value={user.userId.toString()}>
                          {user.name}
                        </option>
                      ))}
                      <option value="null">Non Assigné</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Statut</label>
                    <select 
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">Tous</option>
                      <option value="active">Active</option>
                      <option value="completed">Terminée</option>
                      <option value="canceled">Annulée</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Mot-clé</label>
                    <input 
                      type="text"
                      value={filters.keyword}
                      onChange={(e) => handleFilterChange('keyword', e.target.value)}
                      placeholder="Rechercher..."
                    />
                  </div>
                </div>
                
                <div className="filters-actions">
                  <button className="btn-primary" onClick={handleApplyFilters}>
                    <Search size={16} />
                    Rechercher
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Results */}
          <div className="results-section">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Chargement des actions...</p>
              </div>
            ) : actions.length === 0 ? (
              <div className="empty-state">
                <p>Aucune action trouvée. {!isAuditor && "Créez votre première action en cliquant sur \"Nouvelle Action\"."}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
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
                        <td title={`Créée le ${new Date(action.createdAt).toLocaleDateString('fr-FR')}`}>
                          {new Date(action.deadline).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${action.progress}%` }}
                            ></div>
                            <span className="progress-text">{action.progress}%</span>
                          </div>
                        </td>
                        <td>{action.effectiveness || '-'}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(action.status)}`}>
                            {action.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-action btn-view"
                            onClick={() => handleEditAction(action)}
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          {!isAuditor && (
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteAction(action.actionId)}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft size={16} />
                </button>
                <button 
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="page-info">
                  Page {currentPage} sur {totalPages}
                </span>
                
                <button 
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
                <button 
                  className="page-btn"
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="footer-actions">
            <button className="btn-secondary" onClick={handleNavigateToEvaluation}>
              <ArrowLeft size={16} />
              Évaluation de Conformité
            </button>
            <button className="btn-secondary" onClick={handleNavigateToStatistics}>
              Statistiques
              <ArrowRight size={16} />
            </button>
          
          </div>
        </div>
      </div>
      
      {/* Action Dialog */}
      {actionDialog.open && (
        <div className="modal-overlay" onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionDialog.mode === 'create' ? 'Créer une Nouvelle Action' : 
                isAuditor ? 'Mettre à Jour le Statut de l\'Action' : 'Modifier une Action'}
              </h3>
              <button 
                className="btn-icon"
                onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}
              >
                <X size={18} />
              </button>
            </div>
            
<div className="modal-content" style={{ padding: '24px' }}>
              {isAuditor && actionDialog.mode === 'edit' && (
                <div className="info-alert">
                  En tant qu'auditeur, vous pouvez uniquement modifier la progression et le statut de cette action.
                </div>
              )}
              
              {/* Requirement Selection - Only for creation and non-auditors */}
              {actionDialog.mode === 'create' && actionDialog.textId && !isAuditor && (
                <div className="form-group">
                  <label>Exigence</label>
                  <select
                    value={actionDialog.data.requirementId || ''}
                    onChange={(e) => handleActionDialogChange('requirementId', e.target.value)}
                  >
                    <option value="">Aucune</option>
                    {requirements.map(req => (
                      <option key={req.requirementId} value={req.requirementId}>
                        {req.number} - {req.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Read-only requirement for edit mode */}
              {actionDialog.mode === 'edit' && actionDialog.data.requirementId && (
                <div className="readonly-field">
                  <div className="field-label">Exigence</div>
                  <div className="field-value">
                    {requirements.find(r => r.requirementId === actionDialog.data.requirementId)?.title || '-'}
                  </div>
                </div>
              )}
              
              {/* Description - Read-only for auditors in edit mode */}
              {isAuditor && actionDialog.mode === 'edit' ? (
                <div className="readonly-field">
                  <div className="field-label">Description de l'Action</div>
                  <div className="field-value">{actionDialog.data.description}</div>
                </div>
              ) : (
                <div className="form-group">
                  <label>Description de l'Action</label>
                  <textarea
                    rows={3}
                    value={actionDialog.data.description}
                    onChange={(e) => handleActionDialogChange('description', e.target.value)}
                    required
                  />
                </div>
              )}
              
              {/* Responsible and Deadline - Read-only for auditors */}
              <div className="form-row">
                {isAuditor && actionDialog.mode === 'edit' ? (
                  <div className="readonly-field">
                    <div className="field-label">Responsable</div>
                    <div className="field-value">
                      {users.find(u => u.userId === actionDialog.data.responsibleId)?.name || 'Non Assigné'}
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Responsable</label>
                    <select
                      value={actionDialog.data.responsibleId || ''}
                      onChange={(e) => handleActionDialogChange('responsibleId', e.target.value === '' ? null : parseInt(e.target.value))}
                    >
                      <option value="">Sélectionner un Responsable</option>
                      {users.map(user => (
                        <option key={user.userId} value={user.userId}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {isAuditor && actionDialog.mode === 'edit' ? (
                  <div className="readonly-field">
                    <div className="field-label">Date d'Échéance</div>
                    <div className="field-value">
                      {new Date(actionDialog.data.deadline).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Date d'Échéance</label>
                    <input
                      type="date"
                      value={actionDialog.data.deadline}
                      onChange={(e) => handleActionDialogChange('deadline', e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
              
              {/* Progress - Editable for everyone */}
              <div className="form-group">
                <label>Progression: {actionDialog.data.progress}%</label>
                <div className="progress-slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={actionDialog.data.progress}
                    onChange={(e) => handleActionDialogChange('progress', parseInt(e.target.value))}
                    className="slider"
                  />
                  <div className="slider-marks">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                {/* Effectiveness - Read-only for auditors */}
                {isAuditor && actionDialog.mode === 'edit' ? (
                  <div className="readonly-field">
                    <div className="field-label">Efficacité</div>
                    <div className="field-value">{actionDialog.data.effectiveness || '-'}</div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Efficacité</label>
                    <input
                      type="text"
                      value={actionDialog.data.effectiveness}
                      onChange={(e) => handleActionDialogChange('effectiveness', e.target.value)}
                      placeholder="Mesures d'impact, résultats de l'action"
                    />
                  </div>
                )}
                
                {/* Status - Editable for everyone */}
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={actionDialog.data.status}
                    onChange={(e) => handleActionDialogChange('status', e.target.value)}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="completed">Terminée</option>
                    <option value="canceled">Annulée</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}
              >
                Annuler
              </button>
              <button 
                className="btn-primary"
                onClick={handleActionDialogSubmit}
                disabled={
                  (actionDialog.mode === 'create' && (!actionDialog.data.description || !actionDialog.data.responsibleId || !actionDialog.data.deadline)) ||
                  !actionDialog.data.status
                }
              >
                {actionDialog.mode === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionPlan;  
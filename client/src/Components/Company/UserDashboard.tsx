import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/subscriptiondashboard.css';

interface UserInfo {
  userName: string;
  role: string;
  companyName: string;
  industry: string;
  status: string;
  assignedActions: number;
  completedActions: number;
  pendingEvaluations: number;
  createdAt: string;
}

interface ActionTip {
  actionId: number;
  description: string;
  analysis: {
    priority_level: string;
    risk_assessment: string;
    recommended_tips: string[];
    estimated_effort: string;
    suggested_timeline: string;
    compliance_areas?: string[];
    key_stakeholders?: string[];
    success_metrics?: string[];
  };
}

const UserDashboard: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [actionTips, setActionTips] = useState<ActionTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingTips, setLoadingTips] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('/api/company/user-dashboard-info');
        setUserInfo(response.data);
        setLoading(false);
        await fetchActionTips();
      } catch (err) {
        setError('Échec du chargement des informations utilisateur');
        setLoading(false);
        console.error(err);
      }
    };

    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActionTips = async () => {
    try {
      setLoadingTips(true);
      const actionsResponse = await axios.get('/api/action-plan?pageSize=5');

      if (actionsResponse.data.actions && actionsResponse.data.actions.length > 0) {
        const tips: ActionTip[] = [];
        for (const action of actionsResponse.data.actions.slice(0, 3)) {
          try {
            const tipsResponse = await axios.get(`/api/action-plan/${action.actionId}/tips`);
            if (tipsResponse.data.success && tipsResponse.data.tips && tipsResponse.data.tips.analysis) {
              tips.push({
                actionId: action.actionId,
                description: action.description,
                analysis: tipsResponse.data.tips.analysis,
              });
            }
          } catch (tipError) {
            console.error(`Error fetching tips for action ${action.actionId}:`, tipError);
          }
        }
        setActionTips(tips);
      }
    } catch (err) {
      console.error('Error fetching action tips:', err);
    } finally {
      setLoadingTips(false);
    }
  };

  const getPriorityClass = (priority: string) => {
    if (!priority) return 'medium';
    return priority.toLowerCase();
  };

  const getStatusClass = (status: string) => {
    if (!status) return 'pending';
    return status.toLowerCase();
  };

  const assignedActions = userInfo?.assignedActions || 0;
  const completedActions = userInfo?.completedActions || 0;
  const pendingEvaluations = userInfo?.pendingEvaluations || 0;
  const completionPercentage = assignedActions > 0
    ? Math.round((completedActions / assignedActions) * 100)
    : 0;

  // Build auditor-oriented stat cards with unique links (or no link)
  const statCards = useMemo(() => {
    const cards: {
      key: string;
      title: string;
      value: React.ReactNode;
      subtitle?: string;
      link?: { to: string; label: string };
      icon?: string;
      className?: string;
    }[] = [];

    // 1) Completion (only if there are assigned actions)
    if (assignedActions > 0) {
      cards.push({
        key: 'completion',
        title: "Taux d'Accomplissement",
        value: `${completionPercentage}%`,
        subtitle: `Basé sur ${assignedActions} actions`,
        link: { to: '/user/action-plan', label: 'Voir mes actions' },
        icon: 'fas fa-chart-line',
        className: 'compliance',
      });

      // 2) Action summary (counts) — links to a different page to avoid duplication
      cards.push({
        key: 'actions-summary',
        title: "Résumé des Actions",
        value: `${completedActions}/${assignedActions}`,
        subtitle: `${assignedActions - completedActions} en cours`,
        // use a different sensible route to avoid duplicate link targets
        link: { to: '/user/revue', label: "Revue des actions" },
        icon: 'fas fa-tasks',
        className: 'actions',
      });
    } else {
      // If none assigned, show informative card without duplicating links
      cards.push({
        key: 'no-actions',
        title: "Plans d'Action",
        value: '-',
        subtitle: 'Aucune action assignée',
        link: { to: '/user/action-plan', label: "Parcourir les actions" },
        icon: 'fas fa-tasks',
        className: 'actions',
      });
    }

    // 3) Pending evaluations — always relevant to auditors
    cards.push({
      key: 'pending-evals',
      title: 'Évaluations à Vérifier',
      value: pendingEvaluations,
      subtitle: `${completedActions} actions terminées`,
      link: { to: '/user/compliance', label: 'Gérer les évaluations' },
      icon: 'fas fa-clipboard-check',
      className: 'evaluations',
    });

    // 4) AI tips count — no link (to avoid duplicating the action-plan target)
    if (actionTips && actionTips.length > 0) {
      cards.push({
        key: 'ai-tips',
        title: 'Conseils IA Récents',
        value: actionTips.length,
        subtitle: 'Analyses disponibles pour vos actions',
        icon: 'fas fa-robot',
        className: 'texts',
      });
    }

    return cards;
  }, [assignedActions, completedActions, pendingEvaluations, completionPercentage, actionTips]);

  return (
    <section className="subscription-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
  <div className="dashboard-title">
    <h4>Tableau de Bord Utilisateur</h4>
    <p>
      {userInfo?.companyName
        ? `Bienvenue, ${userInfo.userName} - ${userInfo.companyName}`
        : 'Accédez aux ressources de votre tableau de bord'}
    </p>
          </div>
        </div>

        {/* User Overview */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Aperçu de l'Utilisateur</h5>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Nom :</span>
                  <span>{userInfo?.userName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Rôle :</span>
                  <span>{userInfo?.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Entreprise :</span>
                  <span>{userInfo?.companyName}</span>
                </div>
              </div>
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Industrie :</span>
                  <span>{userInfo?.industry}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Statut :</span>
                  <span className={`status-badge ${getStatusClass(userInfo?.status || '')}`}>
                    {userInfo?.status}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Membre Depuis :</span>
                  <span>{userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auditor stat cards (no Textes card, no duplicate links) */}
        <div className="stats-container">
          {statCards.map(card => (
            <div key={card.key} className={`stat-card ${card.className || ''}`}>
              <div className="stat-icon">
                <i className={card.icon || 'fas fa-info-circle'}></i>
              </div>
              <div className="stat-content">
                <h5 className="stat-title">{card.title}</h5>
                <p className="stat-value">{card.value}</p>
                {card.subtitle && <span className="stat-subtitle">{card.subtitle}</span>}
                {card.link && (
                  <Link to={card.link.to} className="stat-link">
                    {card.link.label} <i className="fas fa-arrow-right"></i>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI-Powered Tips (kept as-is) */}
        <div className="overview-card">
          <div className="card-header">
            <h5>
              <i className="fas fa-robot" style={{ marginRight: '8px', color: '#007bff' }}></i>
              Conseils IA pour vos Actions
            </h5>
          </div>
          <div className="card-body">
            {loadingTips ? (
              <div className="loading-tips">
                <i className="fas fa-spinner fa-spin"></i> Analyse en cours...
              </div>
            ) : actionTips.length > 0 ? (
              <div className="tips-grid">
                {actionTips.map((tip) => (
                  <div key={tip.actionId} className="tip-card">
                    <div className="tip-header">
                      <span className={`priority-badge ${getPriorityClass(tip.analysis.priority_level)}`}>
                        {tip.analysis.priority_level || 'Medium'}
                      </span>
                      <span className="effort-badge">
                        {tip.analysis.estimated_effort || 'Medium'} effort
                      </span>
                    </div>
                    <div className="tip-content">
                      <h6>{tip.description && tip.description.length > 50 ? `${tip.description.substring(0, 50)}...` : tip.description}</h6>
                      <p className="risk-assessment">{tip.analysis.risk_assessment || 'Analyse en cours...'}</p>

                      {tip.analysis.recommended_tips && tip.analysis.recommended_tips.length > 0 && (
                        <div className="recommended-tips">
                          <strong>Conseils recommandés:</strong>
                          <ul>
                            {tip.analysis.recommended_tips.slice(0, 3).map((tipText, i) => (
                              <li key={i}>{tipText}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="timeline">
                        <strong>Délai suggéré:</strong> {tip.analysis.suggested_timeline || '2-4 semaines'}
                      </div>

                      {tip.analysis.compliance_areas && tip.analysis.compliance_areas.length > 0 && (
                        <div className="compliance-areas">
                          <strong>Domaines de conformité:</strong>
                          <div className="areas-tags">
                            {tip.analysis.compliance_areas.map((area, i) => (
                              <span key={i} className="area-tag">{area}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-tips">
                <i className="fas fa-info-circle"></i>
                <p>Aucune action récente à analyser. Vos prochaines actions assignées apparaîtront ici avec des conseils IA.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserDashboard;
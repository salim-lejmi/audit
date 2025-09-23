import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/subscriptiondashboard.css';

interface CompanyInfo {
  companyName: string;
  industry: string;
  totalUsers: number;
  status: string;
  createdAt: string;
}

interface StatItem {
  status: string;
  count: number;
}

interface ActionsByStatus {
  status: string;
  count: number;
}

interface StatsResponse {
  domains: { domainId: number; name: string }[];
  textsByStatus: StatItem[];
  requirementsByStatus: StatItem[];
  actionsByStatus: ActionsByStatus[];
  actionProgressGroups: { range: string; count: number }[];
  actionsByResponsible: {
    responsibleId: number;
    responsibleName: string;
    totalActions: number;
    completedActions: number;
    averageProgress: number;
  }[];
}

const SubscriptionManagerDashboard: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch company info + statistics
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      try {
        const [companyRes, statsRes] = await Promise.all([
          axios.get('/api/company/dashboard-info'),
          axios.get('/api/statistics'),
        ]);

        if (!mounted) return;
        setCompanyInfo(companyRes.data);
        setStats(statsRes.data);
        setLoading(false);
      } catch {
        if (!mounted) return;
        setError('Échec du chargement des informations du tableau de bord');
        setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute key metrics from statistics
  const {
    totalTexts,
    totalRequirements,
    compliantRequirements,
    pendingEvaluations,
    complianceScore,
    totalActions,
    completedActions,
    openActions,
  } = useMemo(() => {
    const normalize = (s: string | null | undefined) =>
      (s || '').toString().trim().toLowerCase();

    const textsByStatus = stats?.textsByStatus ?? [];
    const requirementsByStatus = stats?.requirementsByStatus ?? [];
    const actionsByStatus = stats?.actionsByStatus ?? [];

    const totalTextsCalc = textsByStatus.reduce((acc, t) => acc + (t?.count || 0), 0);

    const totalReqCalc = requirementsByStatus.reduce((acc, r) => acc + (r?.count || 0), 0);
    const compliantReqCalc =
      requirementsByStatus.find(r => normalize(r.status) === 'conforme')?.count || 0;
    const pendingEvalCalc =
      requirementsByStatus.find(r => normalize(r.status) === 'à vérifier')?.count || 0;

    const complianceScoreCalc =
      totalReqCalc > 0 ? Math.round((compliantReqCalc / totalReqCalc) * 100) : 0;

    const totalActionsCalc = actionsByStatus.reduce((acc, a) => acc + (a?.count || 0), 0);
    const completedActionsCalc =
      actionsByStatus.find(a => normalize(a.status) === 'completed')?.count || 0;
    const openActionsCalc = Math.max(totalActionsCalc - completedActionsCalc, 0);

    return {
      totalTexts: totalTextsCalc,
      totalRequirements: totalReqCalc,
      compliantRequirements: compliantReqCalc,
      pendingEvaluations: pendingEvalCalc,
      complianceScore: complianceScoreCalc,
      totalActions: totalActionsCalc,
      completedActions: completedActionsCalc,
      openActions: openActionsCalc,
    };
  }, [stats]);

  if (loading) {
    return <div className="loading-container">Chargement du tableau de bord...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section className="subscription-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h2>Bienvenue, Gestionnaire d&apos;Abonnement</h2>
            <p className="text-muted">Vue d&apos;ensemble et indicateurs clés de votre entreprise</p>
          </div>
        </div>

        {/* Aperçu de l'Entreprise */}
        <div className="overview-card">
          <div className="card-header">
            <h5>Aperçu de l&apos;Entreprise</h5>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Nom de l&apos;Entreprise :</span>
                  <span>{companyInfo?.companyName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Industrie :</span>
                  <span>{companyInfo?.industry}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Statut :</span>
                  <span className={`status-badge ${companyInfo?.status?.toLowerCase()}`}>
                    {companyInfo?.status}
                  </span>
                </div>
              </div>

              <div className="info-column">
                <div className="info-item">
                  <span className="info-label">Nombre Total d&apos;Utilisateurs :</span>
                  <span>{companyInfo?.totalUsers ?? 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Membre Depuis :</span>
                  <span>
                    {companyInfo?.createdAt
                      ? new Date(companyInfo.createdAt).toLocaleDateString('fr-FR')
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs Clés */}
        <div className="stats-container">
          <div className="stat-card compliance">
            <div className="stat-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Score de Conformité</h5>
              <p className="stat-value">{isFinite(complianceScore) ? `${complianceScore}%` : '0%'}</p>
              <span className="stat-subtitle">
                Basé sur {totalRequirements} exigences
              </span>
              <Link to="/company/compliance" className="stat-link">
                Consulter la conformité <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card evaluations">
            <div className="stat-icon">
              <i className="fas fa-clipboard-check"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Évaluations à Vérifier</h5>
              <p className="stat-value">{pendingEvaluations}</p>
              <span className="stat-subtitle">
                {compliantRequirements} exigences conformes
              </span>
              <Link to="/company/compliance" className="stat-link">
                Gérer les évaluations <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card texts">
            <div className="stat-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Textes Réglementaires</h5>
              <p className="stat-value">{totalTexts}</p>
              <span className="stat-subtitle">Documents de votre entreprise</span>
              <Link to="/company/texts" className="stat-link">
                Gérer les textes <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card actions">
            <div className="stat-icon">
              <i className="fas fa-tasks"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Plans d&apos;Action</h5>
              <p className="stat-value">
                {completedActions}/{totalActions}
              </p>
              <span className="stat-subtitle">
                {openActions} en cours
              </span>
              <Link to="/company/action-plan" className="stat-link">
                Voir les plans d&apos;action <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SubscriptionManagerDashboard;
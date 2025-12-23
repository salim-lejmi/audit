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
  const [totalCompanyUsers, setTotalCompanyUsers] = useState(0);
  const [totalRevues, setTotalRevues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch company info + statistics
  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      try {
        const [companyRes, statsRes, usersRes, revuesRes] = await Promise.all([
          axios.get('/api/company/dashboard-info'),
          axios.get('/api/statistics'),
          axios.get('/api/company/users'),
          axios.get('/api/revue')
        ]);

        if (!mounted) return;
        setCompanyInfo(companyRes.data);
        setStats(statsRes.data);
        setTotalCompanyUsers(usersRes.data.length || 0);
        setTotalRevues(revuesRes.data.length || 0);
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
const getStatusLabel = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'approved': 'Approuvé',
    'rejected': 'Rejeté',
    'pending': 'En attente'
  };
  return statusMap[status?.toLowerCase()] || status;
};

  // Compute key metrics from statistics
  const {
    totalTexts,
    totalActions,
    completedActions,
    openActions,
  } = useMemo(() => {
    const normalize = (s: string | null | undefined) =>
      (s || '').toString().trim().toLowerCase();

    const textsByStatus = stats?.textsByStatus ?? [];
    const actionsByStatus = stats?.actionsByStatus ?? [];

    const totalTextsCalc = textsByStatus.reduce((acc, t) => acc + (t?.count || 0), 0);

    const totalActionsCalc = actionsByStatus.reduce((acc, a) => acc + (a?.count || 0), 0);
    const completedActionsCalc =
      actionsByStatus.find(a => normalize(a.status) === 'completed')?.count || 0;
    const openActionsCalc = Math.max(totalActionsCalc - completedActionsCalc, 0);

    return {
      totalTexts: totalTextsCalc,
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
{getStatusLabel(companyInfo?.status || '')}
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
          <div className="stat-card users">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Utilisateurs de l&apos;Entreprise</h5>
              <p className="stat-value">{totalCompanyUsers}</p>
              <span className="stat-subtitle">Membres de votre équipe</span>
              <Link to="/company/users" className="stat-link">
                Gérer les utilisateurs <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="stat-card evaluations">
            <div className="stat-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div className="stat-content">
              <h5 className="stat-title">Revues de Direction</h5>
              <p className="stat-value">{totalRevues}</p>
              <span className="stat-subtitle">Revues enregistrées</span>
              <Link to="/company/revue" className="stat-link">
                Consulter les revues <i className="fas fa-arrow-right"></i>
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
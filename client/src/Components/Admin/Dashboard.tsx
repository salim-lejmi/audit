import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, Paper, Grid, 
  Card, CardContent, CircularProgress, 
  useTheme, useMediaQuery, Button, Stack,
  Chip, Avatar, List, ListItem, ListItemText, 
  ListItemAvatar, Divider, IconButton
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  ArrowUpward as ArrowUpwardIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Subscriptions as SubscriptionsIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement);

interface DashboardStats {
  totalCompanies: number;
  totalUsers: number;
  pendingRequests: number;
  approvedCompanies: number;
  rejectedCompanies: number;
  totalTexts: number;
  totalActions: number;
  totalPayments: number;
  totalSubscriptions: number;
  emailVerificationStats: {
    verified: number;
    unverified: number;
  };
  userRoleDistribution: {
    role: string;
    count: number;
  }[];
  companyStatusDistribution: {
    status: string;
    count: number;
  }[];
  recentCompanies: {
    companyId: number;
    companyName: string;
    industry: string;
    status: string;
    createdAt: string;
    managerName: string;
  }[];
  monthlyGrowth: {
    month: string;
    companies: number;
    users: number;
  }[];
  subscriptionStats: {
    active: number;
    expired: number;
    canceled: number;
  };
  paymentStats: {
    succeeded: number;
    pending: number;
    failed: number;
    totalRevenue: number;
  };
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery('(max-width:1366px)');

  // Modern color palette
  const chartColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];

  const gradientColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff8a80 0%, #ff80ab 100%)'
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/dashboard-detailed');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'succeeded':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
      case 'failed':
      case 'canceled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'succeeded':
        return <CheckCircleIcon sx={{ color: '#10B981' }} />;
      case 'pending':
        return <PendingIcon sx={{ color: '#F59E0B' }} />;
      case 'rejected':
      case 'failed':
      case 'canceled':
        return <CancelIcon sx={{ color: '#EF4444' }} />;
      default:
        return <PendingIcon sx={{ color: '#6B7280' }} />;
    }
  };

  const StatsCard = ({ 
    title, 
    value, 
    icon, 
    gradient, 
    subtitle,
    onClick 
  }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    gradient: string;
    subtitle?: string;
    onClick?: () => void;
  }) => (
    <Card 
      sx={{ 
        background: gradient,
        color: 'white',
        height: isSmallScreen ? '90px' : '100px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease-in-out',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        }
      }}
      onClick={onClick}
    >
      <CardContent 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          p: isSmallScreen ? '12px 16px' : '16px 20px',
          '&:last-child': { pb: isSmallScreen ? '12px' : '16px' }
        }}
      >
        <Box sx={{ mr: isSmallScreen ? 1.5 : 2, opacity: 0.9, display: 'flex', alignItems: 'center' }}>
          {React.cloneElement(icon as React.ReactElement, { 
            fontSize: isSmallScreen ? "medium" : "large"
          })}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography 
            variant={isSmallScreen ? "h5" : "h4"} 
            component="div" 
            fontWeight="bold"
            sx={{ 
              lineHeight: 1.2,
              fontSize: isSmallScreen ? '1.25rem' : '1.5rem'
            }}
          >
            {value.toLocaleString()}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.9,
              fontSize: isSmallScreen ? '0.75rem' : '0.85rem',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                fontSize: isSmallScreen ? '0.65rem' : '0.7rem',
                display: 'block'
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const ChartCard = ({ 
    title, 
    children, 
    icon,
    action
  }: { 
    title: string; 
    children: React.ReactNode; 
    icon?: React.ReactNode;
    action?: React.ReactNode;
  }) => (
    <Card 
      sx={{ 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
        }
      }}
    >
      <CardContent sx={{ p: isSmallScreen ? 2 : 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            {icon && <Box sx={{ mr: 1, color: '#3B82F6' }}>{icon}</Box>}
            <Typography variant={isSmallScreen ? "h6" : "h5"} fontWeight="600" color="text.primary">
              {title}
            </Typography>
          </Box>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  const getCompanyStatusChartData = () => {
    if (!dashboardData) return { labels: [], datasets: [] };
    
    return {
      labels: dashboardData.companyStatusDistribution.map(item => item.status),
      datasets: [
        {
          label: 'Entreprises',
          data: dashboardData.companyStatusDistribution.map(item => item.count),
          backgroundColor: chartColors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    };
  };

  const getUserRoleChartData = () => {
    if (!dashboardData) return { labels: [], datasets: [] };
    
    return {
      labels: dashboardData.userRoleDistribution.map(item => item.role),
      datasets: [
        {
          label: 'Utilisateurs',
          data: dashboardData.userRoleDistribution.map(item => item.count),
          backgroundColor: chartColors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    };
  };

  const getGrowthChartData = () => {
    if (!dashboardData) return { labels: [], datasets: [] };
    
    return {
      labels: dashboardData.monthlyGrowth.map(item => item.month),
      datasets: [
        {
          label: 'Entreprises',
          data: dashboardData.monthlyGrowth.map(item => item.companies),
          backgroundColor: '#3B82F680',
          borderColor: '#3B82F6',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Utilisateurs',
          data: dashboardData.monthlyGrowth.map(item => item.users),
          backgroundColor: '#10B98180',
          borderColor: '#10B981',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: isSmallScreen ? 11 : 12,
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3B82F6',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: isSmallScreen ? 10 : 12,
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: isSmallScreen ? 10 : 12,
          }
        }
      },
    },
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: isSmallScreen ? 2 : 3 }}>
      {/* Header */}
      <Box mb={isSmallScreen ? 2 : 3}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: isSmallScreen ? 2 : 3, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant={isSmallScreen ? "h4" : "h3"} component="h1" fontWeight="bold" gutterBottom>
                Tableau de Bord Administrateur
              </Typography>
              <Typography variant={isSmallScreen ? "body2" : "body1"} sx={{ opacity: 0.9 }}>
                Vue d'ensemble des statistiques et de l'activité de la plateforme
              </Typography>
            </Box>
            <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems="stretch">
              <Button 
                variant="outlined" 
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' },
                  fontSize: isSmallScreen ? '0.8rem' : '0.875rem'
                }}
              >
                {refreshing ? <CircularProgress size={20} /> : 'Actualiser'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={isSmallScreen ? 1.5 : 2} mb={isSmallScreen ? 2 : 3}>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Total Entreprises" 
            value={dashboardData?.totalCompanies || 0}
            subtitle="Approuvées"
            icon={<BusinessIcon />}
            gradient={gradientColors[0]}
            onClick={() => navigate('/admin/companies')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Total Utilisateurs" 
            value={dashboardData?.totalUsers || 0}
            subtitle="Actifs"
            icon={<PeopleIcon />}
            gradient={gradientColors[1]}
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Demandes en Attente" 
            value={dashboardData?.pendingRequests || 0}
            subtitle="À traiter"
            icon={<PendingIcon />}
            gradient={gradientColors[2]}
            onClick={() => navigate('/admin/pending-requests')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Revenus Totaux" 
            value={dashboardData?.paymentStats?.totalRevenue || 0}
            subtitle="€"
            icon={<PaymentIcon />}
            gradient={gradientColors[3]}
          />
        </Grid>
      </Grid>

      {/* Secondary Stats Cards */}
      <Grid container spacing={isSmallScreen ? 1.5 : 2} mb={isSmallScreen ? 2 : 3}>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Textes Légaux" 
            value={dashboardData?.totalTexts || 0}
            icon={<AssignmentIcon />}
            gradient={gradientColors[4]}
            onClick={() => navigate('/admin/texts')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Plans d'Action" 
            value={dashboardData?.totalActions || 0}
            icon={<TrendingUpIcon />}
            gradient={gradientColors[5]}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Abonnements Actifs" 
            value={dashboardData?.subscriptionStats?.active || 0}
            icon={<SubscriptionsIcon />}
            gradient={gradientColors[6]}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard 
            title="Email Vérifiés" 
            value={dashboardData?.emailVerificationStats?.verified || 0}
            icon={<EmailIcon />}
            gradient={gradientColors[7]}
          />
        </Grid>
      </Grid>

      {/* Charts and Lists */}
      <Grid container spacing={isSmallScreen ? 2 : 3}>
        {/* Company Status Distribution */}
        <Grid item xs={12} lg={6}>
          <ChartCard title="Répartition des Entreprises" icon={<BusinessIcon />}>
            <Box sx={{ height: isSmallScreen ? '250px' : '300px' }}>
              {dashboardData?.companyStatusDistribution.length ? (
                <Doughnut data={getCompanyStatusChartData()} options={chartOptions} />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="text.secondary">Aucune donnée disponible</Typography>
                </Box>
              )}
            </Box>
          </ChartCard>
        </Grid>

        {/* User Role Distribution */}
        <Grid item xs={12} lg={6}>
          <ChartCard title="Répartition des Rôles" icon={<PeopleIcon />}>
            <Box sx={{ height: isSmallScreen ? '250px' : '300px' }}>
              {dashboardData?.userRoleDistribution.length ? (
                <Doughnut data={getUserRoleChartData()} options={chartOptions} />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="text.secondary">Aucune donnée disponible</Typography>
                </Box>
              )}
            </Box>
          </ChartCard>
        </Grid>

        {/* Monthly Growth */}
        <Grid item xs={12}>
          <ChartCard title="Croissance Mensuelle" icon={<TrendingUpIcon />}>
            <Box sx={{ height: isSmallScreen ? '300px' : '400px' }}>
              {dashboardData?.monthlyGrowth.length ? (
                <Bar data={getGrowthChartData()} options={barOptions} />
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography color="text.secondary">Aucune donnée disponible</Typography>
                </Box>
              )}
            </Box>
          </ChartCard>
        </Grid>

        {/* Recent Companies */}
        <Grid item xs={12} lg={6}>
          <ChartCard 
            title="Entreprises Récentes" 
            icon={<BusinessIcon />}
            action={
              <Button 
                size="small" 
                onClick={() => navigate('/admin/companies')}
                sx={{ textTransform: 'none' }}
              >
                Voir Tout
              </Button>
            }
          >
            <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {dashboardData?.recentCompanies.length ? (
                <List>
                  {dashboardData.recentCompanies.map((company, index) => (
                    <React.Fragment key={company.companyId}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getStatusColor(company.status) }}>
                            {getStatusIcon(company.status)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1" fontWeight="medium">
                                {company.companyName}
                              </Typography>
                              <Chip 
                                label={company.status} 
                                size="small" 
                                sx={{ 
                                  bgcolor: getStatusColor(company.status) + '20',
                                  color: getStatusColor(company.status),
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {company.industry} • {company.managerName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(company.createdAt).toLocaleDateString('fr-FR')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < dashboardData.recentCompanies.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" textAlign="center" py={3}>
                  Aucune entreprise récente
                </Typography>
              )}
            </Box>
          </ChartCard>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} lg={6}>
          <ChartCard title="État du Système" icon={<SecurityIcon />}>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {dashboardData?.subscriptionStats?.active || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Abonnements Actifs
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {dashboardData?.subscriptionStats?.expired || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Abonnements Expirés
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {dashboardData?.paymentStats?.pending || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paiements en Attente
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {dashboardData?.emailVerificationStats?.unverified || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Emails Non Vérifiés
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Scroll to Top Button */}
      <Box position="fixed" bottom={20} right={20} zIndex={1000}>
        <Button
          variant="contained"
          onClick={scrollToTop}
          sx={{ 
            borderRadius: '50%', 
            width: isSmallScreen ? 48 : 56, 
            height: isSmallScreen ? 48 : 56, 
            minWidth: 'unset',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
            }
          }}
        >
          <ArrowUpwardIcon fontSize={isSmallScreen ? "medium" : "large"} />
        </Button>
      </Box>
    </Container>
  );
};

export default Dashboard;
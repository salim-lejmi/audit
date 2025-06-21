import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, Paper, Grid, 
  FormControl, InputLabel, Select, MenuItem,
  Button, CircularProgress, Divider, Card, CardContent,
  Chip, Stack, useTheme, useMediaQuery
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Domain, StatisticsData } from '../shared/types';
import axios from 'axios';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [domainId, setDomainId] = useState<number | string>('');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery('(max-width:1366px)');

  // Modern color palette
  const chartColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
  ];

  const gradientColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  ];

  useEffect(() => {
    fetchStatistics();
  }, [domainId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/statistics', {
        params: domainId ? { domainId } : {}
      });
      setStatisticsData(response.data);
      setDomains(response.data.domains);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  };

  const handleDomainChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDomainId(event.target.value as number);
  };

  const handleExportPDF = async () => {
    if (!chartsContainerRef.current) return;

    try {
      const canvas = await html2canvas(chartsContainerRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.text('Statistics Report', 105, 15, { align: 'center' });
      
      const domainName = domains.find(d => d.domainId === domainId)?.name || 'All Domains';
      pdf.text(`Domain: ${domainName}`, 105, 25, { align: 'center' });
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 32, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', 10, 40, imgWidth, imgHeight);
      
      pdf.save('compliance-statistics.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chart configurations with modern styling
  const getTextStatusChartData = () => {
    if (!statisticsData) return { labels: [], datasets: [] };
    
    return {
      labels: statisticsData.textsByStatus.map(item => item.status),
      datasets: [
        {
          label: 'Number of Texts',
          data: statisticsData.textsByStatus.map(item => item.count),
          backgroundColor: chartColors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    };
  };

  const getRequirementStatusChartData = () => {
    if (!statisticsData) return { labels: [], datasets: [] };
    
    return {
      labels: statisticsData.requirementsByStatus.map(item => item.status),
      datasets: [
        {
          label: 'Number of Requirements',
          data: statisticsData.requirementsByStatus.map(item => item.count),
          backgroundColor: chartColors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    };
  };

  const getActionStatusChartData = () => {
    if (!statisticsData) return { labels: [], datasets: [] };
    
    return {
      labels: statisticsData.actionsByStatus.map(item => item.status),
      datasets: [
        {
          label: 'Number of Actions',
          data: statisticsData.actionsByStatus.map(item => item.count),
          backgroundColor: chartColors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    };
  };

  const getActionProgressChartData = () => {
    if (!statisticsData) return { labels: [], datasets: [] };
    
    return {
      labels: statisticsData.actionProgressGroups.map(item => item.range),
      datasets: [
        {
          label: 'Actions by Progress',
          data: statisticsData.actionProgressGroups.map(item => item.count),
          backgroundColor: chartColors.map(color => color + '80'),
          borderColor: chartColors,
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const getActionsByResponsibleChartData = () => {
    if (!statisticsData || !statisticsData.actionsByResponsible.length) {
      return { labels: [], datasets: [] };
    }
    
    return {
      labels: statisticsData.actionsByResponsible.map(item => item.responsibleName),
      datasets: [
        {
          label: 'Total Actions',
          data: statisticsData.actionsByResponsible.map(item => item.totalActions),
          backgroundColor: '#3B82F680',
          borderColor: '#3B82F6',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: 'Completed Actions',
          data: statisticsData.actionsByResponsible.map(item => item.completedActions),
          backgroundColor: '#10B98180',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const getActionProgressByResponsibleChartData = () => {
    if (!statisticsData || !statisticsData.actionsByResponsible.length) {
      return { labels: [], datasets: [] };
    }
    
    return {
      labels: statisticsData.actionsByResponsible.map(item => item.responsibleName),
      datasets: [
        {
          label: 'Average Progress (%)',
          data: statisticsData.actionsByResponsible.map(item => item.averageProgress),
          backgroundColor: '#EF444480',
          borderColor: '#EF4444',
          borderWidth: 1,
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

  const StatsCard = ({ title, value, icon, gradient }: { title: string; value: number; icon: React.ReactNode; gradient: string }) => (
    <Card 
      sx={{ 
        background: gradient,
        color: 'white',
        height: isSmallScreen ? '70px' : '80px', // Reduced height significantly
        display: 'flex',
        alignItems: 'center',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        }
      }}
    >
      <CardContent 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          width: '100%', 
          p: isSmallScreen ? '8px 12px' : '12px 16px', // Reduced padding
          '&:last-child': { pb: isSmallScreen ? '8px' : '12px' } // Override default padding-bottom
        }}
      >
        <Box sx={{ mr: isSmallScreen ? 1 : 1.5, opacity: 0.9, display: 'flex', alignItems: 'center' }}>
          {React.cloneElement(icon as React.ReactElement, { 
            fontSize: isSmallScreen ? "small" : "medium" // Smaller icons
          })}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography 
            variant={isSmallScreen ? "h6" : "h5"} 
            component="div" 
            fontWeight="bold"
            sx={{ 
              lineHeight: 1.2,
              fontSize: isSmallScreen ? '1.1rem' : '1.25rem' // Smaller font
            }}
          >
            {value}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.9,
              fontSize: isSmallScreen ? '0.7rem' : '0.8rem', // Smaller subtitle
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const ChartCard = ({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) => (
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
        <Box display="flex" alignItems="center" mb={2}>
          {icon && <Box sx={{ mr: 1, color: '#3B82F6' }}>{icon}</Box>}
          <Typography variant={isSmallScreen ? "h6" : "h5"} fontWeight="600" color="text.primary">
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  const getSummaryStats = () => {
    if (!statisticsData) return { texts: 0, requirements: 0, actions: 0, completed: 0 };
    
    const texts = statisticsData.textsByStatus.reduce((sum, item) => sum + item.count, 0);
    const requirements = statisticsData.requirementsByStatus.reduce((sum, item) => sum + item.count, 0);
    const actions = statisticsData.actionsByStatus.reduce((sum, item) => sum + item.count, 0);
    const completed = statisticsData.actionsByStatus.find(item => item.status.toLowerCase().includes('completed'))?.count || 0;
    
    return { texts, requirements, actions, completed };
  };

  const summaryStats = getSummaryStats();

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
                Analytics Dashboard
              </Typography>
              <Typography variant={isSmallScreen ? "body2" : "body1"} sx={{ opacity: 0.9 }}>
                Comprehensive compliance statistics and insights
              </Typography>
            </Box>
            <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems="stretch">
              <Button 
                variant="contained" 
                color="inherit"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleExportPDF}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  fontSize: isSmallScreen ? '0.8rem' : '0.875rem'
                }}
              >
                Export PDF
              </Button>
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={() => navigate('/company/action-plan')}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(255,255,255,0.1)' },
                  fontSize: isSmallScreen ? '0.8rem' : '0.875rem'
                }}
              >
                Back to Action Plan
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* Domain Filter */}
      <Box mb={isSmallScreen ? 2 : 3}>
        <Paper sx={{ p: isSmallScreen ? 2 : 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <FormControl fullWidth variant="outlined" size={isSmallScreen ? "small" : "medium"}>
            <InputLabel>Filter by Domain</InputLabel>
            <Select
              value={domainId}
              onChange={handleDomainChange as any}
              label="Filter by Domain"
            >
              <MenuItem value="">
                <em>All Domains</em>
              </MenuItem>
              {domains.map((domain) => (
                <MenuItem key={domain.domainId} value={domain.domainId}>
                  {domain.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      ) : (
        <div ref={chartsContainerRef}>
          {(!statisticsData || 
           (!statisticsData.textsByStatus.length && 
            !statisticsData.requirementsByStatus.length && 
            !statisticsData.actionsByStatus.length)) ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h6" color="text.secondary">
                No data available for the selected domain
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Summary Cards - Now much more compact */}
              <Grid container spacing={isSmallScreen ? 1.5 : 2} mb={isSmallScreen ? 2 : 3}>
                <Grid item xs={6} sm={3}>
                  <StatsCard 
                    title="Total Texts" 
                    value={summaryStats.texts} 
                    icon={<AssignmentIcon />}
                    gradient={gradientColors[0]}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <StatsCard 
                    title="Requirements" 
                    value={summaryStats.requirements} 
                    icon={<BarChartIcon />}
                    gradient={gradientColors[1]}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <StatsCard 
                    title="Total Actions" 
                    value={summaryStats.actions} 
                    icon={<TrendingUpIcon />}
                    gradient={gradientColors[2]}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <StatsCard 
                    title="Completed" 
                    value={summaryStats.completed} 
                    icon={<PersonIcon />}
                    gradient={gradientColors[3]}
                  />
                </Grid>
              </Grid>

              {/* Charts Grid */}
              <Grid container spacing={isSmallScreen ? 2 : 3}>
                {/* Text Status */}
                <Grid item xs={12} lg={6}>
                  <ChartCard title="Text Compliance Status" icon={<AssignmentIcon />}>
                    <Box sx={{ height: isSmallScreen ? '250px' : '300px' }}>
                      {statisticsData?.textsByStatus.length ? (
                        <Doughnut data={getTextStatusChartData()} options={chartOptions} />
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                          <Typography color="text.secondary">No data available</Typography>
                        </Box>
                      )}
                    </Box>
                  </ChartCard>
                </Grid>

                {/* Requirement Status */}
                <Grid item xs={12} lg={6}>
                  <ChartCard title="Requirement Status" icon={<BarChartIcon />}>
                    <Box sx={{ height: isSmallScreen ? '250px' : '300px' }}>
                      {statisticsData?.requirementsByStatus.length ? (
                        <Doughnut data={getRequirementStatusChartData()} options={chartOptions} />
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                          <Typography color="text.secondary">No data available</Typography>
                        </Box>
                      )}
                    </Box>
                  </ChartCard>
                </Grid>

                {/* Action Status */}
                <Grid item xs={12} lg={6}>
                  <ChartCard title="Action Status Distribution" icon={<TrendingUpIcon />}>
                    <Box sx={{ height: isSmallScreen ? '250px' : '300px' }}>
                      {statisticsData?.actionsByStatus.length ? (
                        <Pie data={getActionStatusChartData()} options={chartOptions} />
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                          <Typography color="text.secondary">No data available</Typography>
                        </Box>
                      )}
                    </Box>
                  </ChartCard>
                </Grid>

                {/* Action Progress */}
                <Grid item xs={12} lg={6}>
                  <ChartCard title="Action Progress Groups" icon={<TrendingUpIcon />}>
                    <Box sx={{ height: isSmallScreen ? '250px' : '300px' }}>
                      {statisticsData?.actionProgressGroups.length ? (
                        <Bar data={getActionProgressChartData()} options={barOptions} />
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                          <Typography color="text.secondary">No data available</Typography>
                        </Box>
                      )}
                    </Box>
                  </ChartCard>
                </Grid>

                {/* Actions by Responsible */}
                <Grid item xs={12}>
                  <ChartCard title="Actions by Responsible Person" icon={<PersonIcon />}>
                    <Box sx={{ height: isSmallScreen ? '300px' : '400px' }}>
                      {statisticsData?.actionsByResponsible.length ? (
                        <Bar data={getActionsByResponsibleChartData()} options={barOptions} />
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                          <Typography color="text.secondary">No data available</Typography>
                        </Box>
                      )}
                    </Box>
                  </ChartCard>
                </Grid>

                {/* Progress by Responsible */}
                <Grid item xs={12}>
                  <ChartCard title="Average Progress by Responsible Person" icon={<PersonIcon />}>
                    <Box sx={{ height: isSmallScreen ? '300px' : '400px' }}>
                      {statisticsData?.actionsByResponsible.length ? (
                        <Bar data={getActionProgressByResponsibleChartData()} options={barOptions} />
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                          <Typography color="text.secondary">No data available</Typography>
                        </Box>
                      )}
                    </Box>
                  </ChartCard>
                </Grid>
              </Grid>
            </>
          )}
        </div>
      )}

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

export default StatisticsPage;
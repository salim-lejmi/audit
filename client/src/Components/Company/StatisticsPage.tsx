import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Box, Typography, Paper, Grid, 
  FormControl, InputLabel, Select, MenuItem,
  Button, CircularProgress, Divider
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Domain, StatisticsData } from '../Compliance/types';
import axios from 'axios';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [domainId, setDomainId] = useState<number | string>('');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Chart colors
  const chartColors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(199, 199, 199, 0.8)',
    'rgba(83, 102, 255, 0.8)',
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

  // Chart configurations
  const getTextStatusChartData = () => {
    if (!statisticsData) return { labels: [], datasets: [] };
    
    return {
      labels: statisticsData.textsByStatus.map(item => item.status),
      datasets: [
        {
          label: 'Number of Texts',
          data: statisticsData.textsByStatus.map(item => item.count),
          backgroundColor: chartColors,
          borderColor: chartColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
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
          borderColor: chartColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
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
          borderColor: chartColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
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
          backgroundColor: chartColors,
          borderColor: chartColors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
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
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Completed Actions',
          data: statisticsData.actionsByResponsible.map(item => item.completedActions),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
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
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Statistics
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportPDF}
              sx={{ mr: 1 }}
            >
              Export as PDF
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/company/action-plan')}
            >
              Back to Action Plan
            </Button>
          </Box>
        </Box>
        
        <Box mb={4}>
          <FormControl fullWidth variant="outlined">
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
        </Box>
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <div ref={chartsContainerRef}>
            {(!statisticsData || 
             (!statisticsData.textsByStatus.length && 
              !statisticsData.requirementsByStatus.length && 
              !statisticsData.actionsByStatus.length)) ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography variant="h6" color="textSecondary">
                  No data available for the selected domain
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Text Compliance Status
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {statisticsData?.textsByStatus.length ? (
                        <Pie data={getTextStatusChartData()} />
                      ) : (
                        <Typography textAlign="center">No text status data available</Typography>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '400px' }}>
                      {statisticsData?.textsByStatus.length ? (
                        <Box sx={{ height: '100%' }}>
                          <Typography variant="h6" gutterBottom textAlign="center">
                            Text Status Distribution
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
                            {statisticsData.textsByStatus.map((item, index) => (
                              <Box key={item.status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box 
                                    sx={{ 
                                      width: 16, 
                                      height: 16, 
                                      bgcolor: chartColors[index % chartColors.length],
                                      mr: 1,
                                      borderRadius: '50%'
                                    }} 
                                  />
                                  <Typography>{item.status}</Typography>
                                </Box>
                                <Typography fontWeight="bold">{item.count}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Typography textAlign="center">No text status data available</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Requirement Compliance Status
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {statisticsData?.requirementsByStatus.length ? (
                        <Pie data={getRequirementStatusChartData()} />
                      ) : (
                        <Typography textAlign="center">No requirement status data available</Typography>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '400px' }}>
                      {statisticsData?.requirementsByStatus.length ? (
                        <Box sx={{ height: '100%' }}>
                          <Typography variant="h6" gutterBottom textAlign="center">
                            Requirement Status Distribution
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2 }}>
                            {statisticsData.requirementsByStatus.map((item, index) => (
                              <Box key={item.status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box 
                                    sx={{ 
                                      width: 16, 
                                      height: 16, 
                                      bgcolor: chartColors[index % chartColors.length],
                                      mr: 1,
                                      borderRadius: '50%'
                                    }} 
                                  />
                                  <Typography>{item.status}</Typography>
                                </Box>
                                <Typography fontWeight="bold">{item.count}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Typography textAlign="center">No requirement status data available</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Action Status
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {statisticsData?.actionsByStatus.length ? (
                        <Pie data={getActionStatusChartData()} />
                      ) : (
                        <Typography textAlign="center">No action status data available</Typography>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '400px' }}>
                      {statisticsData?.actionProgressGroups.length ? (
                        <Box sx={{ height: '100%' }}>
                          <Typography variant="h6" gutterBottom textAlign="center">
                            Action Progress
                          </Typography>
                          <Box sx={{ height: 300 }}>
                            <Bar 
                              data={getActionProgressChartData()} 
                              options={barOptions} 
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Typography textAlign="center">No action progress data available</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                  Actions by Responsible Person
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, height: '500px' }}>
                      {statisticsData?.actionsByResponsible.length ? (
                        <Box sx={{ height: '100%' }}>
                          <Typography variant="h6" gutterBottom textAlign="center">
                            Actions and Progress by Responsible Person
                          </Typography>
                          <Box sx={{ height: 400 }}>
                            <Bar 
                              data={getActionsByResponsibleChartData()} 
                              options={barOptions} 
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Typography textAlign="center">No data available for actions by responsible person</Typography>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, height: '500px' }}>
                      {statisticsData?.actionsByResponsible.length ? (
                        <Box sx={{ height: '100%' }}>
                          <Typography variant="h6" gutterBottom textAlign="center">
                            Average Action Progress by Responsible Person
                          </Typography>
                          <Box sx={{ height: 400 }}>
                            <Bar 
                              data={getActionProgressByResponsibleChartData()} 
                              options={barOptions} 
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Typography textAlign="center">No progress data available by responsible person</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </div>
        )}
      </Paper>

      <Box position="fixed" bottom="20px" right="20px">
        <Button
          variant="contained"
          color="primary"
          onClick={scrollToTop}
          sx={{ borderRadius: '50%', width: 56, height: 56, minWidth: 'unset' }}
        >
          <ArrowUpwardIcon />
        </Button>
      </Box>
    </Container>
  );
};

export default StatisticsPage;
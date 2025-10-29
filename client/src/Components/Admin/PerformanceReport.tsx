import React, { useState, useRef } from 'react';
import {
  Box, Button, Paper, Typography, Grid, Card, CardContent,
  Chip, List, ListItem, ListItemText, CircularProgress,
  Alert, Divider, Stack
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  TrendingUp, TrendingDown, TrendingFlat
} from '@mui/icons-material';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PerformanceReportProps {
  statistics: any;
}

const PerformanceReport: React.FC<PerformanceReportProps> = ({ statistics }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const reportRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/generate-performance-report', {
        statistics
      });
      
      if (response.data.success) {
        setReport(response.data.report);
      } else {
        setError('Échec de génération du rapport');
      }
    } catch (err) {
      setError('Erreur lors de la génération du rapport');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      heightLeft -= 277; // A4 page height in mm

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= 277;
      }

      const fileName = `rapport-performance-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Erreur lors de l\'exportation PDF:', error);
      setError('Erreur lors de l\'exportation PDF');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUp sx={{ color: '#10B981' }} />;
      case 'down': return <TrendingDown sx={{ color: '#EF4444' }} />;
      default: return <TrendingFlat sx={{ color: '#6B7280' }} />;
    }
  };

  if (!report) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <AssessmentIcon sx={{ fontSize: 60, color: '#3B82F6', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Rapport de Performance avec Analyse NLP
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Générez un rapport détaillé avec insights linguistiques et recommandations stratégiques
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={generateReport}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
        >
          {loading ? 'Analyse en cours...' : 'Générer le Rapport'}
        </Button>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          Rapport de Performance Généré
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={generateReport}
            disabled={loading}
          >
            Régénérer
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportToPDF}
          >
            Exporter PDF
          </Button>
        </Stack>
      </Box>

      <Paper ref={reportRef} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📊 Rapport de Performance Système
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Généré le {new Date(report.metadata.generated_at).toLocaleDateString('fr-FR', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </Typography>
          <Chip 
            label={`Analyse: ${report.metadata.analysis_method}`} 
            size="small" 
            sx={{ mt: 1 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Sentiment Section */}
        <Card sx={{ mb: 3, bgcolor: report.sentiment.color + '15', border: `2px solid ${report.sentiment.color}` }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {report.sentiment.emoji} État Global du Système
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={report.sentiment.color}>
              {report.sentiment.score}/100
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {report.sentiment.description}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Activation</Typography>
                <Typography variant="h6">{report.sentiment.components.activation}%</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Complétion Actions</Typography>
                <Typography variant="h6">{report.sentiment.components.action_completion}%</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Conformité</Typography>
                <Typography variant="h6">{report.sentiment.components.compliance}%</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              📝 Résumé Exécutif
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              {report.executive_summary}
            </Typography>
          </CardContent>
        </Card>

        {/* KPIs */}
        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 3 }}>
          📈 Indicateurs Clés de Performance
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {report.kpis.map((kpi: any, index: number) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {kpi.name}
                    </Typography>
                    {getTrendIcon(kpi.trend)}
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                    {kpi.value}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {kpi.unit}
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {kpi.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Trend Analysis */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              {report.trend_analysis.emoji} Analyse des Tendances
            </Typography>
            <Typography variant="body1" gutterBottom>
              {report.trend_analysis.description}
            </Typography>
            {report.trend_analysis.metrics && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {Object.entries(report.trend_analysis.metrics).map(([key, value]: any) => (
                  <Grid item xs={6} key={key}>
                    <Typography variant="body2" color="text.secondary">
                      {key.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="h6">{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Anomalies */}
        {report.anomalies && report.anomalies.length > 0 && (
          <Card sx={{ mb: 3, bgcolor: '#FEF3C7' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                ⚠️ Anomalies Détectées
              </Typography>
              <List>
                {report.anomalies.map((anomaly: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{anomaly.emoji}</span>
                          <Chip 
                            label={anomaly.severity} 
                            size="small" 
                            color={anomaly.severity === 'high' ? 'error' : 'warning'}
                          />
                        </Box>
                      }
                      secondary={anomaly.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Detailed Sections */}
        <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 3 }}>
          📊 Analyses Détaillées
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(report.sections).map(([key, section]: any) => (
            <Grid item xs={12} md={6} key={key}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {section.emoji} {section.message || section.insight}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {section.description}
                  </Typography>
                  {section.insights && (
                    <List dense>
                      {section.insights.map((insight: string, idx: number) => (
                        <ListItem key={idx}>
                          <Typography variant="body2">• {insight}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recommendations */}
        <Card sx={{ bgcolor: '#EFF6FF' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              💡 Recommandations Stratégiques
            </Typography>
            <List>
              {report.recommendations.map((rec: any, index: number) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{rec.emoji}</span>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {rec.title}
                          </Typography>
                          <Chip 
                            label={rec.priority} 
                            size="small" 
                            color={
                              rec.priority === 'high' ? 'error' : 
                              rec.priority === 'medium' ? 'warning' : 'info'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" gutterBottom>
                            {rec.description}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                            Actions recommandées:
                          </Typography>
                          <List dense>
                            {rec.actions.map((action: string, idx: number) => (
                              <ListItem key={idx}>
                                <Typography variant="body2">✓ {action}</Typography>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < report.recommendations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Rapport généré automatiquement par le système d'analyse NLP
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Méthode: {report.metadata.analysis_method}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PerformanceReport;
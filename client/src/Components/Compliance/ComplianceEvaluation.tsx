import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Tabs, Tab, useTheme, useMediaQuery } from '@mui/material';
import ComplianceTextList from './ComplianceTextList';
import ComplianceRequirementEvaluation from './ComplianceRequirementEvaluation';
import { TextListItem } from '../shared/types';
import '../../styles/compliance.css';

const ComplianceEvaluation: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedText, setSelectedText] = useState<TextListItem | null>(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTextSelection = (text: TextListItem) => {
    setSelectedText(text);
    setTabValue(1);
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
          Évaluation de Conformité
        </Typography>
        
        <Paper 
          elevation={0} 
          sx={{ 
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant={isSmallScreen ? "fullWidth" : "standard"}
          >
            <Tab label="Liste des Textes" />
            {selectedText && (
              <Tab label={
                isSmallScreen 
                  ? `${selectedText.reference.substring(0, 15)}${selectedText.reference.length > 15 ? '...' : ''}`
                  : `Exigences: ${selectedText.reference}`
              } />
            )}
          </Tabs>
          
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {tabValue === 0 && (
              <ComplianceTextList onSelectText={handleTextSelection} />
            )}
            
            {tabValue === 1 && selectedText && (
              <ComplianceRequirementEvaluation 
                textId={selectedText.textId} 
                onBack={() => setTabValue(0)} 
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ComplianceEvaluation;
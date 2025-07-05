import React, { useState } from 'react';
import { 
  ChevronLeft
} from 'lucide-react';
import ComplianceTextList from './ComplianceTextList';
import ComplianceRequirementEvaluation from './ComplianceRequirementEvaluation';
import { TextListItem } from '../shared/types';
import '../../styles/compliance.css';

const ComplianceEvaluation: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedText, setSelectedText] = useState<TextListItem | null>(null);

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const handleTextSelection = (text: TextListItem) => {
    setSelectedText(text);
    setTabValue(1);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Évaluation de Conformité</h1>
      </div>

      <div className="content-container">
        <div className="tabs-container">
          <div className="tabs-header">
            <div 
              className={`tab ${tabValue === 0 ? 'active' : ''}`} 
              onClick={() => handleTabChange(0)}
            >
              Liste des Textes
            </div>
            {selectedText && (
              <div 
                className={`tab ${tabValue === 1 ? 'active' : ''}`} 
                onClick={() => handleTabChange(1)}
              >
                Exigences: {selectedText.reference}
              </div>
            )}
          </div>
          
          <div className="tab-content">
            {tabValue === 0 && (
              <ComplianceTextList onSelectText={handleTextSelection} />
            )}
            
            {tabValue === 1 && selectedText && (
              <div className="requirement-container">
                <div className="back-link" onClick={() => handleTabChange(0)}>
                  <ChevronLeft size={18} />
                  <span>Retour à la liste des textes</span>
                </div>
                <ComplianceRequirementEvaluation 
                  textId={selectedText.textId} 
                  onBack={() => handleTabChange(0)} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceEvaluation;
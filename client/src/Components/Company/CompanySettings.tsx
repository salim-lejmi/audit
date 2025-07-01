import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/companysettings.css';

interface CompanyData {
  companyId: number;
  companyName: string;
  industry: string;
  status: string;
  createdAt: string;
}

const CompanySettings: React.FC = () => {
  const [companyData, setCompanyData] = useState<CompanyData>({
    companyId: 0,
    companyName: '',
    industry: '',
    status: '',
    createdAt: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const industries = [
    'Technologie',
    'Santé',
    'Fabrication',
    'Services financiers',
    'Commerce de détail',
    'Éducation',
    'Autre'
  ];

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get('/api/company/settings');
        console.log('Fetched company data:', response.data);
        setCompanyData(response.data);
      } catch (error) {
        setError('Échec du chargement des données de l\'entreprise');
        console.error('Error fetching company data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyData({
      ...companyData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!companyData.companyName.trim()) {
      setError('Le nom de l\'entreprise est requis');
      return;
    }
    
    if (!companyData.industry.trim()) {
      setError('Le secteur est requis');
      return;
    }
    
    const requestData = {
      companyName: companyData.companyName.trim(),
      industry: companyData.industry.trim()
    };
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.put('/api/company/settings', requestData);
      setSuccess('Paramètres de l\'entreprise mis à jour avec succès');
      setCompanyData(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || 'Échec de la mise à jour des paramètres de l\'entreprise');
      } else {
        setError('Une erreur s\'est produite lors de la mise à jour des paramètres de l\'entreprise');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement des paramètres de l'entreprise...</div>;
  }

  return (
    <section className="company-settings-section">
      <div className="company-settings-container">
        <div className="settings-header">
          <h2 className="settings-title">Paramètres de l'entreprise</h2>
          <p className="settings-subtitle">Gérer les informations de votre entreprise</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="settings-card">
          <form className="settings-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="companyName">Nom de l'entreprise</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                className="form-input"
                value={companyData.companyName}
                onChange={handleInputChange}
                required
                placeholder="Entrez le nom de votre entreprise"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="industry">Secteur</label>
              <select
                id="industry"
                name="industry"
                className="form-select"
                value={companyData.industry}
                onChange={handleInputChange}
                required
              >
                <option value="">Sélectionnez un secteur</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="readonly-info">
              <div className="info-row">
                <span className="info-label">Statut :</span>
                <span className={`status-badge ${companyData.status.toLowerCase()}`}>
                  {companyData.status}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Membre depuis :</span>
                <span className="info-value">
                  {new Date(companyData.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button"
                disabled={isSubmitting}
              >
                <i className="fas fa-save"></i>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CompanySettings;
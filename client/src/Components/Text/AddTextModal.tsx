import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import '../../styles/TextModal.css';

interface AddTextModalProps {
  onClose: () => void;
  onTextAdded: () => void;
}

interface Requirement {
  number: string;
  title: string;
  status: string;
}

interface Domain {
  domainId: number;
  name: string;
}

interface Theme {
  themeId: number;
  name: string;
  domainId: number;
}

interface SubTheme {
  subThemeId: number;
  name: string;
  themeId: number;
}

const AddTextModal: React.FC<AddTextModalProps> = ({ onClose, onTextAdded }) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [newRequirement, setNewRequirement] = useState<Requirement>({
    number: '',
    title: '',
    status: 'À vérifier'
  });
  
  const [formData, setFormData] = useState({
    domainId: 0,
    themeId: 0,
    subThemeId: 0,
    reference: '',
    nature: '',
    publicationYear: new Date().getFullYear(),
    status: 'À vérifier',
    penalties: '',
    relatedTexts: '',
    effectiveDate: '',
    content: '',
    file: null as File | null
  });

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const response = await axios.get('/api/taxonomy/domains');
        setDomains(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des domaines:', err);
      }
    };

    loadDomains();
  }, []);

  const handleDomainChange = async (domainId: number) => {
    setFormData({
      ...formData,
      domainId,
      themeId: 0,
      subThemeId: 0
    });

    if (domainId) {
      try {
        const response = await axios.get(`/api/taxonomy/themes?domainId=${domainId}`);
        setThemes(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des thèmes:', err);
      }
    } else {
      setThemes([]);
      setSubThemes([]);
    }
  };

  const handleThemeChange = async (themeId: number) => {
    setFormData({
      ...formData,
      themeId,
      subThemeId: 0
    });

    if (themeId) {
      try {
        const response = await axios.get(`/api/taxonomy/subthemes?themeId=${themeId}`);
        setSubThemes(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des sous-thèmes:', err);
      }
    } else {
      setSubThemes([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({
        ...formData,
        file: e.target.files[0]
      });
    }
  };

  const handleRequirementChange = (field: keyof Requirement, value: string) => {
    setNewRequirement({
      ...newRequirement,
      [field]: value
    });
  };

  const addRequirement = () => {
    if (!newRequirement.number || !newRequirement.title) {
      setError('Veuillez remplir les champs Numéro et Titre pour l\'exigence');
      return;
    }

    setRequirements([...requirements, { ...newRequirement }]);
    
    setNewRequirement({
      number: '',
      title: '',
      status: 'À vérifier'
    });
    setError(null);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.domainId || !formData.reference || !formData.publicationYear) {
      setError('Veuillez remplir tous les champs requis (Domaine, Référence, Année de publication)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = new FormData();
      
      submitData.append('DomainId', formData.domainId.toString());
      
      if (formData.themeId > 0) {
        submitData.append('ThemeId', formData.themeId.toString());
      }
      
      if (formData.subThemeId > 0) {
        submitData.append('SubThemeId', formData.subThemeId.toString());
      }
      
      submitData.append('Reference', formData.reference);
      submitData.append('Nature', formData.nature);
      submitData.append('PublicationYear', formData.publicationYear.toString());
      submitData.append('Status', formData.status);
      submitData.append('Penalties', formData.penalties);
      submitData.append('RelatedTexts', formData.relatedTexts);
      
      if (formData.effectiveDate) {
        submitData.append('EffectiveDate', formData.effectiveDate);
      }
      
      submitData.append('Content', formData.content);
      
      if (formData.file) {
        submitData.append('File', formData.file);
      }

      if (requirements.length > 0) {
        requirements.forEach((req, index) => {
          submitData.append(`Requirements[${index}].Number`, req.number);
          submitData.append(`Requirements[${index}].Title`, req.title);
          submitData.append(`Requirements[${index}].Status`, req.status);
        });
      }

      await axios.post('/api/texts', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      onTextAdded();
      onClose();
      
    } catch (err) {
      console.error('Erreur lors de la création du texte:', err);
      
      if (axios.isAxiosError(err) && err.response) {
        setError(`Échec de la création du texte : ${typeof err.response.data === 'object' ? JSON.stringify(err.response.data.message || err.response.data) : err.response.data}`);
      } else {
        setError('Échec de la création du texte. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Ajouter un nouveau texte</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="form">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Informations de base</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="domainId">Domaine *</label>
                  <select 
                    id="domainId"
                    name="domainId"
                    value={formData.domainId}
                    onChange={(e) => handleDomainChange(Number(e.target.value))}
                    required
                  >
                    <option value="0">Sélectionner un domaine</option>
                    {domains.map((domain) => (
                      <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="themeId">Thème *</label>
                  <select 
                    id="themeId"
                    name="themeId"
                    value={formData.themeId}
                    onChange={(e) => handleThemeChange(Number(e.target.value))}
                    required
                    disabled={formData.domainId === 0}
                  >
                    <option value="0">Sélectionner un thème</option>
                    {themes.map((theme) => (
                      <option key={theme.themeId} value={theme.themeId}>{theme.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subThemeId">Sous-thème</label>
                  <select 
                    id="subThemeId"
                    name="subThemeId"
                    value={formData.subThemeId}
                    onChange={(e) => setFormData({
                      ...formData,
                      subThemeId: Number(e.target.value)
                    })}
                    disabled={formData.themeId === 0}
                  >
                    <option value="0">Sélectionner un sous-thème</option>
                    {subThemes.map((subTheme) => (
                      <option key={subTheme.subThemeId} value={subTheme.subThemeId}>{subTheme.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="reference">Référence *</label>
                  <input 
                    type="text"
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    required
                    placeholder="Référence du texte"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="nature">Nature</label>
                  <input 
                    type="text"
                    id="nature"
                    name="nature"
                    value={formData.nature}
                    onChange={handleInputChange}
                    placeholder="Nature du texte"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="publicationYear">Année de publication *</label>
                  <input 
                    type="number"
                    id="publicationYear"
                    name="publicationYear"
                    value={formData.publicationYear}
                    onChange={handleInputChange}
                    required
                    min="1900"
                    max="2100"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="status">Statut</label>
                  <select 
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="À vérifier">À vérifier</option>
                    <option value="Applicable">Applicable</option>
                    <option value="Non applicable">Non applicable</option>
                    <option value="Pour information">Pour information</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="penalties">Sanctions/Incitations</label>
                  <input 
                    type="text"
                    id="penalties"
                    name="penalties"
                    value={formData.penalties}
                    onChange={handleInputChange}
                    placeholder="Sanctions ou incitations"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="relatedTexts">Textes associés</label>
                  <input 
                    type="text"
                    id="relatedTexts"
                    name="relatedTexts"
                    value={formData.relatedTexts}
                    onChange={handleInputChange}
                    placeholder="Abrogeant/modifiant/complétant"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="effectiveDate">Date d'effet</label>
                  <input 
                    type="date"
                    id="effectiveDate"
                    name="effectiveDate"
                    value={formData.effectiveDate}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="file">Document PDF</label>
                  <div className="file-input-wrapper">
                    <input 
                      type="file"
                      id="file"
                      name="file"
                      onChange={handleFileChange}
                      accept=".pdf"
                    />
                    <div className="file-input-display">
                      <Upload size={16} />
                      {formData.file ? formData.file.name : 'Choisir un fichier PDF'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-group form-group-full">
                <label htmlFor="content">Contenu</label>
                <textarea 
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Contenu du texte"
                />
              </div>
            </div>
            
            {/* Requirements Section */}
            <div className="form-section">
              <h3>Exigences</h3>
              
              {requirements.length > 0 && (
                <div className="requirements-list">
                  <div className="table-container">
                    <table className="requirements-table">
                      <thead>
                        <tr>
                          <th>Numéro</th>
                          <th>Titre</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requirements.map((req, index) => (
                          <tr key={index}>
                            <td>{req.number}</td>
                            <td>{req.title}</td>
                            <td>
                              <span className={`status-badge status-${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                {req.status}
                              </span>
                            </td>
                            <td>
                              <button 
                                type="button"
                                className="btn-action btn-delete"
                                onClick={() => removeRequirement(index)}
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="add-requirement">
                <h4>Ajouter une exigence</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Numéro</label>
                    <input 
                      type="text"
                      value={newRequirement.number}
                      onChange={(e) => handleRequirementChange('number', e.target.value)}
                      placeholder="ex. : Art. 5"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Titre</label>
                    <input 
                      type="text"
                      value={newRequirement.title}
                      onChange={(e) => handleRequirementChange('title', e.target.value)}
                      placeholder="Titre de l'exigence"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Statut</label>
                    <select 
                      value={newRequirement.status}
                      onChange={(e) => handleRequirementChange('status', e.target.value)}
                    >
                      <option value="À vérifier">À vérifier</option>
                      <option value="Applicable">Applicable</option>
                      <option value="Non applicable">Non applicable</option>
                      <option value="Pour information">Pour information</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <button 
                      type="button"
                      className="btn-secondary"
                      onClick={addRequirement}
                    >
                      <Plus size={16} />
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer le texte'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTextModal;
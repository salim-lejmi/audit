import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  // Domain, theme, and subtheme data with IDs
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
  
  // Form state - updated to use IDs instead of string values
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
    // Load domains when component mounts
    const loadDomains = async () => {
      try {
        // Updated to fetch from taxonomy endpoint to get IDs
        const response = await axios.get('/api/taxonomy/domains');
        setDomains(response.data);
      } catch (err) {
        console.error('Error loading domains:', err);
      }
    };

    loadDomains();
  }, []);

  // Handle domain change - load themes
  const handleDomainChange = async (domainId: number) => {
    setFormData({
      ...formData,
      domainId,
      themeId: 0,
      subThemeId: 0
    });

    if (domainId) {
      try {
        // Updated to fetch from taxonomy endpoint with domainId
        const response = await axios.get(`/api/taxonomy/themes?domainId=${domainId}`);
        setThemes(response.data);
      } catch (err) {
        console.error('Error loading themes:', err);
      }
    } else {
      setThemes([]);
      setSubThemes([]);
    }
  };

  // Handle theme change - load subthemes
  const handleThemeChange = async (themeId: number) => {
    setFormData({
      ...formData,
      themeId,
      subThemeId: 0
    });

    if (themeId) {
      try {
        // Updated to fetch from taxonomy endpoint with themeId
        const response = await axios.get(`/api/taxonomy/subthemes?themeId=${themeId}`);
        setSubThemes(response.data);
      } catch (err) {
        console.error('Error loading subthemes:', err);
      }
    } else {
      setSubThemes([]);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({
        ...formData,
        file: e.target.files[0]
      });
    }
  };

  // Handle new requirement input changes
  const handleRequirementChange = (field: keyof Requirement, value: string) => {
    setNewRequirement({
      ...newRequirement,
      [field]: value
    });
  };

  // Add requirement to the list
  const addRequirement = () => {
    if (!newRequirement.number || !newRequirement.title) {
      alert('Please fill in both Number and Title fields for the requirement');
      return;
    }

    setRequirements([...requirements, { ...newRequirement }]);
    
    // Reset form
    setNewRequirement({
      number: '',
      title: '',
      status: 'À vérifier'
    });
  };

  // Remove requirement from list
  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submission started with data:", formData);
    
    if (!formData.domainId || !formData.reference || !formData.publicationYear) {
      setError('Please fill in all required fields (Domain, Reference, Publication Year)');
      console.log("Missing required fields:", { 
        domainId: formData.domainId, 
        reference: formData.reference, 
        publicationYear: formData.publicationYear 
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData object for file upload
      const submitData = new FormData();
      
      // Log each field as it's being added to the FormData
      console.log("Adding domainId:", formData.domainId);
      submitData.append('DomainId', formData.domainId.toString());
      
      if (formData.themeId > 0) {
        console.log("Adding themeId:", formData.themeId);
        submitData.append('ThemeId', formData.themeId.toString());
      } else {
        console.log("themeId not added, value:", formData.themeId);
      }
      
      if (formData.subThemeId > 0) {
        console.log("Adding subThemeId:", formData.subThemeId);
        submitData.append('SubThemeId', formData.subThemeId.toString());
      } else {
        console.log("subThemeId not added, value:", formData.subThemeId);
      }
      
      console.log("Adding reference:", formData.reference);
      submitData.append('Reference', formData.reference);
      
      console.log("Adding nature:", formData.nature);
      submitData.append('Nature', formData.nature);
      
      console.log("Adding publicationYear:", formData.publicationYear);
      submitData.append('PublicationYear', formData.publicationYear.toString());
      
      console.log("Adding status:", formData.status);
      submitData.append('Status', formData.status);
      
      console.log("Adding penalties:", formData.penalties);
      submitData.append('Penalties', formData.penalties);
      
      console.log("Adding relatedTexts:", formData.relatedTexts);
      submitData.append('RelatedTexts', formData.relatedTexts);
      
      if (formData.effectiveDate) {
        console.log("Adding effectiveDate:", formData.effectiveDate);
        submitData.append('EffectiveDate', formData.effectiveDate);
      } else {
        console.log("effectiveDate not added, value:", formData.effectiveDate);
      }
      
      console.log("Adding content:", formData.content);
      submitData.append('Content', formData.content);
      
      if (formData.file) {
        console.log("Adding file:", formData.file.name);
        submitData.append('File', formData.file);
      } else {
        console.log("No file attached");
      }

      // Add requirements if any
      if (requirements.length > 0) {
        console.log("Adding requirements:", requirements);
        requirements.forEach((req, index) => {
          submitData.append(`Requirements[${index}].Number`, req.number);
          submitData.append(`Requirements[${index}].Title`, req.title);
          submitData.append(`Requirements[${index}].Status`, req.status);
        });
      } else {
        console.log("No requirements to add");
      }

      // Log the complete FormData
      console.log("Final FormData keys:");
      for (const pair of submitData.entries()) {
        console.log(pair[0], ': ', pair[1]);
      }

      console.log("Sending POST request to /api/texts");
      // Send request to create text
      const response = await axios.post('/api/texts', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Request successful:", response.data);

      // Notify parent and close modal
      onTextAdded();
      onClose();
      
    } catch (err) {
      console.error('Error creating text:', err);
      
      if (axios.isAxiosError(err) && err.response) {
        console.error('Server error response:', err.response.data);
        if (typeof err.response.data === 'object') {
          console.error('Error message:', err.response.data.message || 'No specific error message');
          console.error('Full error object:', JSON.stringify(err.response.data, null, 2));
        } else {
          console.error('Raw error response:', err.response.data);
        }
        setError(`Failed to create text: ${typeof err.response.data === 'object' ? JSON.stringify(err.response.data.message || err.response.data) : err.response.data}`);
      } else {
        setError('Failed to create text. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content text-detail-modal">
        <div className="modal-header">
          <h2>Add New Text</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="text-detail-content">
          {error && <div className="error-message">{error}</div>}
          
          <div className="text-info-section">
            <h3>Basic Information</h3>
            
            <div className="info-row">
              <div className="form-group">
                <label htmlFor="domainId">Domain *</label>
                <select 
                  id="domainId"
                  name="domainId"
                  value={formData.domainId}
                  onChange={(e) => handleDomainChange(Number(e.target.value))}
                  required
                >
                  <option value="0">Select Domain</option>
                  {domains.map((domain) => (
                    <option key={domain.domainId} value={domain.domainId}>{domain.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="themeId">Theme *</label>
                <select 
                  id="themeId"
                  name="themeId"
                  value={formData.themeId}
                  onChange={(e) => handleThemeChange(Number(e.target.value))}
                  required
                  disabled={formData.domainId === 0}
                >
                  <option value="0">Select Theme</option>
                  {themes.map((theme) => (
                    <option key={theme.themeId} value={theme.themeId}>{theme.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="subThemeId">Sub-Theme</label>
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
                  <option value="0">Select Sub-Theme</option>
                  {subThemes.map((subTheme) => (
                    <option key={subTheme.subThemeId} value={subTheme.subThemeId}>{subTheme.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="info-row">
              <div className="form-group">
                <label htmlFor="reference">Reference *</label>
                <input 
                  type="text"
                  id="reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter text reference"
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
                  placeholder="Enter text nature"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="publicationYear">Publication Year *</label>
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
            </div>
            
            <div className="info-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
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
                <label htmlFor="penalties">Penalties/Incentives</label>
                <input 
                  type="text"
                  id="penalties"
                  name="penalties"
                  value={formData.penalties}
                  onChange={handleInputChange}
                  placeholder="Enter penalties or incentives"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="relatedTexts">Related Texts</label>
                <input 
                  type="text"
                  id="relatedTexts"
                  name="relatedTexts"
                  value={formData.relatedTexts}
                  onChange={handleInputChange}
                  placeholder="Abrogeant/modifiant/complétant"
                />
              </div>
            </div>
            
            <div className="info-row">
              <div className="form-group">
                <label htmlFor="effectiveDate">Effective Date</label>
                <input 
                  type="date"
                  id="effectiveDate"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="file">PDF Document</label>
                <input 
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                />
              </div>
            </div>
            
            <div className="info-row">
              <div className="form-group full-width">
                <label htmlFor="content">Content</label>
                <textarea 
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Enter text content"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="requirements-section">
            <h3>Requirements</h3>
            
            {requirements.length > 0 ? (
              <div className="requirements-list">
                <table className="requirements-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Title</th>
                      <th>Status</th>
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
                            className="btn-delete-small"
                            onClick={() => removeRequirement(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-requirements">No requirements added yet.</p>
            )}
            
            <div className="add-requirement-section">
              <h4>Add Requirement</h4>
              <div className="add-requirement-form">
                <div className="form-group">
                  <label>Number</label>
                  <input 
                    type="text"
                    value={newRequirement.number}
                    onChange={(e) => handleRequirementChange('number', e.target.value)}
                    placeholder="e.g., Art. 5"
                  />
                </div>
                
                <div className="form-group">
                  <label>Title</label>
                  <input 
                    type="text"
                    value={newRequirement.title}
                    onChange={(e) => handleRequirementChange('title', e.target.value)}
                    placeholder="Requirement title"
                  />
                </div>
                
                <div className="form-group">
                  <label>Status</label>
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
                
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={addRequirement}
                >
                  Add Requirement
                </button>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Text'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTextModal;
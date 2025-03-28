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

const AddTextModal: React.FC<AddTextModalProps> = ({ onClose, onTextAdded }) => {
  const [domains, setDomains] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [subThemes, setSubThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [newRequirement, setNewRequirement] = useState<Requirement>({
    number: '',
    title: '',
    status: 'À vérifier'
  });
  
  // Form state
  const [formData, setFormData] = useState({
    domain: '',
    theme: '',
    subTheme: '',
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
        const response = await axios.get('/api/texts/domains');
        setDomains(response.data);
      } catch (err) {
        console.error('Error loading domains:', err);
      }
    };

    loadDomains();
  }, []);

  // Handle domain change - load themes
  const handleDomainChange = async (domain: string) => {
    setFormData({
      ...formData,
      domain,
      theme: '',
      subTheme: ''
    });

    if (domain) {
      try {
        const response = await axios.get(`/api/texts/themes?domain=${domain}`);
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
  const handleThemeChange = async (theme: string) => {
    setFormData({
      ...formData,
      theme,
      subTheme: ''
    });

    if (theme && formData.domain) {
      try {
        const response = await axios.get(`/api/texts/subthemes?domain=${formData.domain}&theme=${theme}`);
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
    
    if (!formData.domain || !formData.theme || !formData.reference || !formData.publicationYear) {
      setError('Please fill in all required fields (Domain, Theme, Reference, Publication Year)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData object for file upload
      const submitData = new FormData();
      submitData.append('domain', formData.domain);
      submitData.append('theme', formData.theme);
      submitData.append('subTheme', formData.subTheme);
      submitData.append('reference', formData.reference);
      submitData.append('nature', formData.nature);
      submitData.append('publicationYear', formData.publicationYear.toString());
      submitData.append('status', formData.status);
      submitData.append('penalties', formData.penalties);
      submitData.append('relatedTexts', formData.relatedTexts);
      
      if (formData.effectiveDate) {
        submitData.append('effectiveDate', formData.effectiveDate);
      }
      
      submitData.append('content', formData.content);
      
      if (formData.file) {
        submitData.append('file', formData.file);
      }

      // Add requirements if any
      if (requirements.length > 0) {
        submitData.append('requirements', JSON.stringify(requirements));
      }

      // Send request to create text
      await axios.post('/api/texts', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Notify parent and close modal
      onTextAdded();
      onClose();
      
    } catch (err) {
      console.error('Error creating text:', err);
      setError('Failed to create text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content text-detail-modal">
        <div className="modal-header">
          <h2>Add New Text</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="text-detail-content">
          {error && <div className="error-message">{error}</div>}
          
          <div className="text-info-section">
            <h3>Basic Information</h3>
            
            <div className="info-row">
              <div className="form-group">
                <label htmlFor="domain">Domain *</label>
                <select 
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  required
                >
                  <option value="">Select Domain</option>
                  {domains.map((domain, index) => (
                    <option key={index} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="theme">Theme *</label>
                <select 
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  required
                  disabled={!formData.domain}
                >
                  <option value="">Select Theme</option>
                  {themes.map((theme, index) => (
                    <option key={index} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="subTheme">Sub-Theme</label>
                <select 
                  id="subTheme"
                  name="subTheme"
                  value={formData.subTheme}
                  onChange={handleInputChange}
                  disabled={!formData.theme}
                >
                  <option value="">Select Sub-Theme</option>
                  {subThemes.map((subTheme, index) => (
                    <option key={index} value={subTheme}>{subTheme}</option>
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
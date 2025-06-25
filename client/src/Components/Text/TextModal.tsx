import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/TextModal.css';

interface Requirement {
  requirementId: number;
  number: string;
  title: string;
  status: string;
}

interface TextDetail {
  textId: number;
  domain: string;
  theme: string;
  subTheme: string;
  reference: string;
  nature: string;
  publicationYear: number;
  status: string;
  penalties: string;
  relatedTexts: string;
  effectiveDate: string;
  content: string;
  filePath: string;
  isConsulted: boolean;
  createdAt: string;
  createdBy: string;
  requirements: Requirement[];
}

interface TextModalProps {
  textId: number;
  onClose: () => void;
  userRole: string;
}

const TextModal: React.FC<TextModalProps> = ({ textId, onClose, userRole }) => {
  const [text, setText] = useState<TextDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [textStatus, setTextStatus] = useState<string>('');
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [newRequirement, setNewRequirement] = useState<{
    number: string;
    title: string;
    status: string;
  }>({
    number: '',
    title: '',
    status: 'À vérifier'
  });

  // Fetch text details
  useEffect(() => {
    const fetchTextDetail = async () => {
      try {
        const response = await axios.get(`/api/texts/${textId}`);
        setText(response.data);
        setTextStatus(response.data.status);
      } catch (err) {
        setError('Failed to load text details');
        console.error('Error loading text details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTextDetail();
  }, [textId]);

  // Download PDF file
  const handleViewPdf = async () => {
    try {
      const response = await axios.get(`/api/texts/${textId}/file`, {
        responseType: 'blob'
      });
      
      // Create a URL for the blob
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      setPdfUrl(fileURL);
      setShowPdf(true);
    } catch (err) {
      alert('Failed to load PDF file');
      console.error('Error loading PDF:', err);
    }
  };

// Update text status
const handleUpdateStatus = async () => {
  if (!text) return;
  
  try {
    await axios.put(`/api/texts/${textId}/status`, { status: textStatus });
    setText({ ...text, status: textStatus });
    alert('Text status updated successfully');
    setEditMode(false);
  } catch (err) {
    alert('Failed to update text status');
    console.error('Error updating text status:', err);
  }
};
  // Start editing a requirement
  const startEditRequirement = (requirement: Requirement) => {
    setEditingRequirement(requirement);
  };

  // Cancel editing a requirement
  const cancelEditRequirement = () => {
    setEditingRequirement(null);
  };

  // Save edited requirement
  const saveRequirement = async () => {
    if (!editingRequirement) return;
    
    try {
      await axios.put(`/api/texts/${textId}/requirement/${editingRequirement.requirementId}`, {
        status: editingRequirement.status,
        number: editingRequirement.number,
        title: editingRequirement.title
      });
      
      // Update the requirement in the local state
      if (text) {
        const updatedRequirements = text.requirements.map(req => 
          req.requirementId === editingRequirement.requirementId ? editingRequirement : req
        );
        setText({ ...text, requirements: updatedRequirements });
      }
      
      setEditingRequirement(null);
      alert('Requirement updated successfully');
    } catch (err) {
      alert('Failed to update requirement');
      console.error('Error updating requirement:', err);
    }
  };

  // Add new requirement
  const addRequirement = async () => {
    if (!text) return;
    
    if (!newRequirement.number || !newRequirement.title) {
      alert('Please fill in both Number and Title fields');
      return;
    }
    
    try {
      const response = await axios.post(`/api/texts/${textId}/requirement`, newRequirement);
      
      // Add the new requirement to the local state
      const addedRequirement = {
        requirementId: response.data.requirementId,
        ...newRequirement
      };
      
      setText({
        ...text,
        requirements: [...text.requirements, addedRequirement]
      });
      
      // Reset the form
      setNewRequirement({
        number: '',
        title: '',
        status: 'À vérifier'
      });
      
      alert('Requirement added successfully');
    } catch (err) {
      alert('Failed to add requirement');
      console.error('Error adding requirement:', err);
    }
  };

  // Delete requirement
  const deleteRequirement = async (requirementId: number) => {
    if (!text) return;
    
    if (window.confirm('Are you sure you want to delete this requirement?')) {
      try {
        await axios.delete(`/api/texts/${textId}/requirement/${requirementId}`);
        
        // Remove the requirement from the local state
        setText({
          ...text,
          requirements: text.requirements.filter(req => req.requirementId !== requirementId)
        });
        
        alert('Requirement deleted successfully');
      } catch (err) {
        alert('Failed to delete requirement');
        console.error('Error deleting requirement:', err);
      }
    }
  };

  // Handle requirement field changes when editing
  const handleRequirementChange = (field: keyof Requirement, value: string) => {
    if (!editingRequirement) return;
    
    setEditingRequirement({
      ...editingRequirement,
      [field]: value
    });
  };

  // Handle new requirement field changes
  const handleNewRequirementChange = (field: string, value: string) => {
    setNewRequirement({
      ...newRequirement,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading text details...</div>
        </div>
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error">{error || 'Text not found'}</div>
          <div className="modal-actions">
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content text-detail-modal">
        <div className="modal-header">
          <h2>{text.reference}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {showPdf ? (
          <div className="pdf-viewer">
            <div className="pdf-viewer-header">
              <button onClick={() => setShowPdf(false)}>Back to Details</button>
            </div>
            <iframe 
              src={`${pdfUrl}#toolbar=0`} 
              width="100%" 
              height="600px" 
              title="PDF Viewer"
            />
          </div>
        ) : (
          <div className="text-detail-content">
            <div className="text-info-section">
              <div className="info-row">
                <div className="info-item">
                  <h3>Domain</h3>
                  <p>{text.domain}</p>
                </div>
                <div className="info-item">
                  <h3>Theme</h3>
                  <p>{text.theme}</p>
                </div>
                <div className="info-item">
                  <h3>Sub-Theme</h3>
                  <p>{text.subTheme || 'N/A'}</p>
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-item">
                  <h3>Nature</h3>
                  <p>{text.nature || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <h3>Publication Year</h3>
                  <p>{text.publicationYear}</p>
                </div>
                <div className="info-item">
                  <h3>Status</h3>

                  {editMode ? (
                    <div className="edit-status">
                      <select 
                        value={textStatus} 
                        onChange={(e) => setTextStatus(e.target.value)}
                      >
                        <option value="À vérifier">À vérifier</option>
                        <option value="Applicable">Applicable</option>
                        <option value="Non applicable">Non applicable</option>
                        <option value="Pour information">Pour information</option>
                      </select>
                      <div className="status-actions">
                        <button className="btn-primary" onClick={handleUpdateStatus}>Save</button>
                        <button className="btn-secondary" onClick={() => {
                          setTextStatus(text.status);
                          setEditMode(false);
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="status-display">
                      <span className={`status-badge status-${text.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {text.status}
                      </span>
                      {(userRole === 'SubscriptionManager') && (
                        <button className="btn-edit-small" onClick={() => setEditMode(true)}>Edit</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-item">
                  <h3>Penalties</h3>
                  <p>{text.penalties || 'None'}</p>
                </div>
                <div className="info-item">
                  <h3>Related Texts</h3>
                  <p>{text.relatedTexts || 'None'}</p>
                </div>
                <div className="info-item">
                  <h3>Effective Date</h3>
                  <p>{text.effectiveDate ? new Date(text.effectiveDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-item full-width">
                  <h3>Content</h3>
                  <div className="text-content">
                    {text.content || 'No content available'}
                  </div>
                </div>
              </div>
              
              {text.filePath && (
                <div className="info-row">
                  <div className="info-item full-width">
                    <h3>PDF Document</h3>
                    <button className="btn-primary" onClick={handleViewPdf}>View PDF</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="requirements-section">
              <h3>Requirements</h3>
              
              {text.requirements.length === 0 ? (
                <p className="no-requirements">No requirements defined for this text.</p>
              ) : (
                <div className="requirements-list">
                  <table className="requirements-table">
                    <thead>
                      <tr>
                        <th>Number</th>
                        <th>Title</th>
                        <th>Status</th>
                         {userRole === 'SubscriptionManager' && (
                        <th>Actions</th> )}
                      </tr>
                    </thead>
                    <tbody>
                      {text.requirements.map((req) => (
                        <tr key={req.requirementId}>
                          {editingRequirement && editingRequirement.requirementId === req.requirementId ? (
                            // Editing mode
                            <>
                              <td>
                                <input 
                                  type="text" 
                                  value={editingRequirement.number} 
                                  onChange={(e) => handleRequirementChange('number', e.target.value)}
                                />
                              </td>
                              <td>
                                <input 
                                  type="text" 
                                  value={editingRequirement.title} 
                                  onChange={(e) => handleRequirementChange('title', e.target.value)}
                                />
                              </td>
                              <td>
                                <select 
                                  value={editingRequirement.status} 
                                  onChange={(e) => handleRequirementChange('status', e.target.value)}
                                >
                                  <option value="À vérifier">À vérifier</option>
                                  <option value="Applicable">Applicable</option>
                                  <option value="Non applicable">Non applicable</option>
                                  <option value="Pour information">Pour information</option>
                                </select>
                              </td>
                              <td>
                                <div className="req-actions">
                                  <button className="btn-save" onClick={saveRequirement}>Save</button>
                                  <button className="btn-cancel" onClick={cancelEditRequirement}>Cancel</button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Display mode
                            <>
                              <td>{req.number}</td>
                              <td>{req.title}</td>
                              <td>
                                <span className={`status-badge status-${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {req.status}
                                </span>
                              </td>
  <td>
    {userRole === 'SubscriptionManager' && (
      <div className="req-actions">
        <button 
          className="btn-edit-small" 
          onClick={() => startEditRequirement(req)}
        >
          Edit
        </button>
        
       
          <button 
            className="btn-delete-small" 
            onClick={() => deleteRequirement(req.requirementId)}
          >
            Delete
          </button>
      </div>
    )}
  </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Add new requirement section - only for SuperAdmin and SubscriptionManager */}
              {( userRole === 'SubscriptionManager') && (
                <div className="add-requirement-section">
                  <h4>Add New Requirement</h4>
                  <div className="add-requirement-form">
                    <div className="form-group">
                      <label>Number</label>
                      <input 
                        type="text" 
                        value={newRequirement.number}
                        onChange={(e) => handleNewRequirementChange('number', e.target.value)}
                        placeholder="e.g., Art. 5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Title</label>
                      <input 
                        type="text" 
                        value={newRequirement.title}
                        onChange={(e) => handleNewRequirementChange('title', e.target.value)}
                        placeholder="Requirement title"
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        value={newRequirement.status}
                        onChange={(e) => handleNewRequirementChange('status', e.target.value)}
                      >
                        <option value="À vérifier">À vérifier</option>
                        <option value="Applicable">Applicable</option>
                        <option value="Non applicable">Non applicable</option>
                        <option value="Pour information">Pour information</option>
                      </select>
                    </div>
                    <button className="btn-primary" onClick={addRequirement}>
                      Add Requirement
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <div className="text-metadata">
                <p>Created by: {text.createdBy || 'Unknown'}</p>
                <p>Created on: {new Date(text.createdAt).toLocaleDateString()}</p>
              </div>
              <button className="btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextModal;
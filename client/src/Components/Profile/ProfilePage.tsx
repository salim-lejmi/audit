import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/profile.css';

const ProfilePage: React.FC = () => {
  const [userData, setUserData] = useState({
    userId: 0,
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    role: '',
    companyId: null as number | null
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/profile');
        
        let firstName = '';
        let lastName = '';
        if (response.data.name) {
          const nameParts = response.data.name.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        setUserData({
          ...response.data,
          firstName,
          lastName
        });
      } catch (error) {
        setError('Échec du chargement des données du profil');
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    if (id === 'oldPassword' || id === 'newPassword') {
      setPasswordData({
        ...passwordData,
        [id]: value
      });
    } else {
      setUserData({
        ...userData,
        [id]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (passwordData.oldPassword || passwordData.newPassword) {
      if (!passwordData.oldPassword) {
        setError('Veuillez entrer votre mot de passe actuel');
        return;
      }
      
      if (!passwordData.newPassword) {
        setError('Veuillez entrer votre nouveau mot de passe');
        return;
      }
      
      if (passwordData.newPassword.length < 8) {
        setError('Le nouveau mot de passe doit comporter au moins 8 caractères');
        return;
      }
    }
    
    const requestData = {
      name: userData.role === 'SuperAdmin' 
        ? `${userData.firstName} ${userData.lastName}`.trim() 
        : userData.name,
      phoneNumber: userData.phoneNumber,
      ...(userData.role === 'SubscriptionManager' && { companyName: userData.companyName }),
      ...(passwordData.oldPassword && passwordData.newPassword && {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      })
    };
    
    console.log("Submit data:", JSON.stringify(requestData, null, 2));
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.put('/api/profile', requestData);
      console.log("Server response:", response.data);
      setSuccess('Profil mis à jour avec succès');
      
      setPasswordData({
        oldPassword: '',
        newPassword: ''
      });
      
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Error response:", error.response);
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        
        if (error.response.data && error.response.data.errors) {
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: Format d'erreur invalide`;
            })
            .join('; ');
          setError(errorMessages || error.response.data.message || 'Échec de la validation');
        } else {
          setError(error.response.data.message || 'Échec de la mise à jour du profil');
        }
      } else {
        console.error("Unexpected error:", error);
        setError('Une erreur s\'est produite lors de la mise à jour de votre profil');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement des données du profil...</div>;
  }

  return (
    <section className="profile-section">
      <div className="profile-container">
        <h2 className="profile-title">Mon profil</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form className="profile-form" onSubmit={handleSubmit}>
          {userData.role === 'SuperAdmin' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Prénom</label>
                  <input
                    type="text"
                    id="firstName"
                    className="form-input"
                    value={userData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Nom de famille</label>
                  <input
                    type="text"
                    id="lastName"
                    className="form-input"
                    value={userData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Numéro de téléphone</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className="form-input"
                  value={userData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
          
          {userData.role === 'SubscriptionManager' && (
            <>
              <div className="form-group">
                <label htmlFor="name">Nom</label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  value={userData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="companyName">Nom de l'entreprise</label>
                <input
                  type="text"
                  id="companyName"
                  className="form-input"
                  value={userData.companyName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Numéro de téléphone</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className="form-input"
                  value={userData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          {userData.role !== 'SuperAdmin' && userData.role !== 'SubscriptionManager' && (
            <>
              <div className="form-group">
                <label htmlFor="name">Nom</label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  value={userData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Numéro de téléphone</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className="form-input"
                  value={userData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={userData.email}
              readOnly
              disabled
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="oldPassword">Mot de passe actuel</label>
              <input
                type="password"
                id="oldPassword"
                className="form-input"
                value={passwordData.oldPassword}
                onChange={handleInputChange}
                placeholder="Entrez le mot de passe actuel pour modifier"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                type="password"
                id="newPassword"
                className="form-input"
                value={passwordData.newPassword}
                onChange={handleInputChange}
                placeholder="Entrez le nouveau mot de passe"
              />
            </div>
          </div>
          
          <div className="form-group">
            <button 
              type="submit" 
              className="save-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement des modifications...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ProfilePage;
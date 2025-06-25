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
        
        // Parse name into firstName and lastName if needed
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
        setError('Failed to load profile data');
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
    
    // Password validation - both old and new password must be provided together
    if (passwordData.oldPassword || passwordData.newPassword) {
      if (!passwordData.oldPassword) {
        setError('Please enter your current password');
        return;
      }
      
      if (!passwordData.newPassword) {
        setError('Please enter your new password');
        return;
      }
      
      if (passwordData.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }
    }
    
    // Create request data that matches the backend UpdateProfileRequest structure
    const requestData = {
      name: userData.role === 'SuperAdmin' 
        ? `${userData.firstName} ${userData.lastName}`.trim() 
        : userData.name,
      phoneNumber: userData.phoneNumber,
      // Only include companyName for SubscriptionManager
      ...(userData.role === 'SubscriptionManager' && { companyName: userData.companyName }),
      // Include password data only if provided
      ...(passwordData.oldPassword && passwordData.newPassword && {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      })
    };
    
    // DEBUG: Log the data being sent to the server
    console.log("Submit data:", JSON.stringify(requestData, null, 2));
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.put('/api/profile', requestData);
      console.log("Server response:", response.data);
      setSuccess('Profile updated successfully');
      
      // Reset password fields
      setPasswordData({
        oldPassword: '',
        newPassword: ''
      });
      
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        // DEBUG: Log the detailed error response
        console.error("Error response:", error.response);
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        
        // Extract validation error messages if available
        if (error.response.data && error.response.data.errors) {
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: Invalid error format`;
            })
            .join('; ');
          setError(errorMessages || error.response.data.message || 'Validation failed');
        } else {
          setError(error.response.data.message || 'Failed to update profile');
        }
      } else {
        console.error("Unexpected error:", error);
        setError('An error occurred while updating your profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile data...</div>;
  }

  return (
    <section className="profile-section">
      <div className="profile-container">
        <h2 className="profile-title">My Profile</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form className="profile-form" onSubmit={handleSubmit}>
          {/* Admin View Form Fields */}
          {userData.role === 'SuperAdmin' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
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
                  <label htmlFor="lastName">Last Name</label>
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
                <label htmlFor="phoneNumber">Phone Number</label>
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
          
          {/* Subscription Manager View Form Fields */}
          {userData.role === 'SubscriptionManager' && (
            <>
              <div className="form-group">
                <label htmlFor="name">Name</label>
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
                <label htmlFor="companyName">Company Name</label>
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
                <label htmlFor="phoneNumber">Phone Number</label>
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

          {/* Other User Roles (Auditor, etc.) */}
          {userData.role !== 'SuperAdmin' && userData.role !== 'SubscriptionManager' && (
            <>
              <div className="form-group">
                <label htmlFor="name">Name</label>
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
                <label htmlFor="phoneNumber">Phone Number</label>
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
          
          {/* Email Display (Read-only) */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
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
          
          {/* Password Change Section */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="oldPassword">Current Password</label>
              <input
                type="password"
                id="oldPassword"
                className="form-input"
                value={passwordData.oldPassword}
                onChange={handleInputChange}
                placeholder="Enter current password to change"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="form-input"
                value={passwordData.newPassword}
                onChange={handleInputChange}
                placeholder="Enter new password"
              />
            </div>
          </div>
          
          <div className="form-group">
            <button 
              type="submit" 
              className="save-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ProfilePage;
import React, { useState } from 'react';
import '../../styles/signup.css';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    email: '',
    phone: '',
    industry: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const industries = [
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Financial Services',
    'Retail',
    'Education',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await axios.post('/api/auth/signup', {
        companyName: formData.companyName,
        managerName: formData.managerName,
        email: formData.email,
        phoneNumber: formData.phone,
        industry: formData.industry,
        password: formData.password
      });
      
      setSuccess('Your account has been created and is pending approval. You will receive an email when approved.');
      
      // Clear form data
      setFormData({
        companyName: '',
        managerName: '',
        email: '',
        phone: '',
        industry: '',
        password: '',
        confirmPassword: ''
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || 'Registration failed. Please try again.');
      } else {
        setError('Unable to connect to the server. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="signup-section">
      <div className="signup-container">
        <div className="signup-content">
          {/* Left Side */}
          <div className="signup-form-side">
            <div className="logo-container">
              <i className="fas fa-crow logo-icon"></i>
              <span className="logo-text">Logo</span>
            </div>

            <div className="form-wrapper">
              <form className="signup-form" onSubmit={handleSubmit}>
                <h3 className="signup-title">Create Account</h3>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group">
                  <input
                    type="text"
                    id="companyName"
                    className="form-input"
                    placeholder="Company Name"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    id="managerName"
                    className="form-input"
                    placeholder="Subscription Manager Name"
                    value={formData.managerName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="tel"
                    id="phone"
                    className="form-input"
                    placeholder="Phone Number (Optional)"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <select 
                    id="industry" 
                    className="form-input" 
                    value={formData.industry}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select Industry</option>
                    {industries.map((industry, index) => (
                      <option key={index} value={industry.toLowerCase()}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <button 
                    type="submit" 
                    className="signup-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>

                <p className="login-text">
                  Already have an account?{' '}
                  <Link to="/" className="login-link">
                    Login here
                  </Link>
                </p>
              </form>
            </div>
          </div>

          {/* Right Side */}
          <div className="image-side">
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img3.webp"
              alt="Signup"
              className="signup-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
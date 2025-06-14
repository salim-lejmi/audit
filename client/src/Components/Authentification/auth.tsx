  import React, { useState, useEffect } from 'react';
  import '../../styles/auth.css'; // Adjust the path as necessary
  import { useNavigate } from "react-router-dom";
  import axios from 'axios';

  const Auth: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginIsLoading, setLoginIsLoading] = useState(false);

    const [signupFormData, setSignupFormData] = useState({
      companyName: '',
      managerName: '',
      email: '',
      phone: '',
      industry: '',
      password: '',
      confirmPassword: ''
    });
    const [signupError, setSignupError] = useState('');
    const [signupSuccess, setSignupSuccess] = useState('');
    const [signupIsLoading, setSignupIsLoading] = useState(false);

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

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginEmail || !loginPassword) {
        setLoginError('Please enter both email and password');
        return;
      }
      setLoginIsLoading(true);
      setLoginError('');
      try {
        interface LoginResponse {
          data: {
            role: 'SuperAdmin' | 'SubscriptionManager' | 'User';
          };
        }
        const response: LoginResponse = await axios.post('/api/auth/login', {
          email: loginEmail,
          password: loginPassword
        });
        const { role } = response.data;
        if (role === 'SuperAdmin') {
          navigate('/admin/dashboard');
        } else if (role === 'SubscriptionManager') {
          navigate('/company/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response) {
          interface ErrorResponse {
            data: {
              message?: string;
            };
          }
          const errorResponse: ErrorResponse = err.response;
          setLoginError(errorResponse.data.message || 'Login failed. Please check your credentials.');
        } else {
          setLoginError('Unable to connect to the server. Please try again later.');
        }
      } finally {
        setLoginIsLoading(false);
      }
    };

    const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { id, value } = e.target;
      setSignupFormData({
        ...signupFormData,
        [id]: value
      });
    };

    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (signupFormData.password !== signupFormData.confirmPassword) {
        setSignupError('Passwords do not match');
        return;
      }
      if (signupFormData.password.length < 8) {
        setSignupError('Password must be at least 8 characters long');
        return;
      }
      setSignupIsLoading(true);
      setSignupError('');
      setSignupSuccess('');
      try {
        await axios.post('/api/auth/signup', {
          companyName: signupFormData.companyName,
          managerName: signupFormData.managerName,
          email: signupFormData.email,
          phoneNumber: signupFormData.phone,
          industry: signupFormData.industry,
          password: signupFormData.password
        });
        setSignupSuccess('Your account has been created and is pending approval. You will receive an email when approved.');
        setSignupFormData({
          companyName: '',
          managerName: '',
          email: '',
          phone: '',
          industry: '',
          password: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setIsLoginView(true); // Switch to login view after successful signup
          setSignupSuccess(''); // Clear success message
        }, 3000);
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          setSignupError(error.response.data.message || 'Registration failed. Please try again.');
        } else {
          setSignupError('Unable to connect to the server. Please try again later.');
        }
      } finally {
        setSignupIsLoading(false);
      }
    };
    
    // Preload image
    useEffect(() => {
      const img = new Image();
      img.src = "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img3.webp";
    }, []);

    return (
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-image-side">
            <img
              src="auth.jpg" // Adjust the path as necessary
              alt="Auth visual"
              className="auth-image"
            />
          </div>
          <div className="auth-form-side">
            <div className="auth-form-container">
              {/* Dark mode toggle - basic structure */}
              {/* <div className="theme-toggle">
                <button aria-label="Toggle dark mode">
                  <i className="fas fa-moon"></i> {/* Placeholder for moon icon }
                </button>
              </div> */}
              
              <h1 className="auth-title">Prevention Plus</h1> {/* Placeholder Title */}

              <div className="auth-toggle-buttons">
                <button
                  className={`toggle-button ${isLoginView ? 'active' : ''}`}
                  onClick={() => setIsLoginView(true)}
                >
                  Login
                </button>
                <button
                  className={`toggle-button ${!isLoginView ? 'active' : ''}`}
                  onClick={() => setIsLoginView(false)}
                >
                  Sign up
                </button>
              </div>

              {isLoginView ? (
                <form className="auth-form" onSubmit={handleLogin}>
                  {loginError && <div className="error-message">{loginError}</div>}
                  <div className="form-group">
                    <label htmlFor="login-email">Username, email address or phone...</label>
                    <div className="input-wrapper">
                      {/* <i className="fas fa-user input-icon"></i> Placeholder icon */}
                      <input
                        type="email"
                        id="login-email"
                        className="form-input"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="login-password">Enter Password...</label>
                    <div className="input-wrapper">
                      {/* <i className="fas fa-lock input-icon"></i> Placeholder icon */}
                      <input
                        type="password"
                        id="login-password"
                        className="form-input"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      {/* <i className="fas fa-eye input-icon-right"></i> Placeholder icon */}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="auth-button"
                    disabled={loginIsLoading}
                  >
                    {loginIsLoading ? 'Logging in...' : 'Login'}
                  </button>
                  <p className="forgot-password-link">
                    <a href="#!">Forgot password?</a>
                  </p>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleSignup}>
                  {signupError && <div className="error-message">{signupError}</div>}
                  {signupSuccess && <div className="success-message">{signupSuccess}</div>}
                  
                  <div className="form-group">
                    <label htmlFor="companyName">Company Name</label>
                    <input
                      type="text"
                      id="companyName"
                      className="form-input"
                      placeholder="Enter company name"
                      value={signupFormData.companyName}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="managerName">Subscription Manager Name</label>
                    <input
                      type="text"
                      id="managerName"
                      className="form-input"
                      placeholder="Enter manager name"
                      value={signupFormData.managerName}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      className="form-input"
                      placeholder="Enter email address"
                      value={signupFormData.email}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-input"
                      placeholder="Enter phone number"
                      value={signupFormData.phone}
                      onChange={handleSignupChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="industry">Industry</label>
                    <select
                      id="industry"
                      className="form-input"
                      value={signupFormData.industry}
                      onChange={handleSignupChange}
                      required
                    >
                      <option value="" disabled>Select Industry</option>
                      {industries.map((industry, index) => (
                        <option key={index} value={industry.toLowerCase().replace(/\s+/g, '-')}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      className="form-input"
                      placeholder="Enter password (min. 8 characters)"
                      value={signupFormData.password}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-input"
                      placeholder="Confirm your password"
                      value={signupFormData.confirmPassword}
                      onChange={handleSignupChange}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="auth-button"
                    disabled={signupIsLoading}
                  >
                    {signupIsLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>
              )}
              {/* 
              <div className="social-signin">
                <p>Sign in with</p>
                <div className="social-icons">
                  <button aria-label="Sign in with Apple"><i className="fab fa-apple"></i></button>
                  <button aria-label="Sign in with Facebook"><i className="fab fa-facebook-f"></i></button>
                  <button aria-label="Sign in with Google"><i className="fab fa-google"></i></button>
                  <button aria-label="Sign in with Twitter"><i className="fab fa-twitter"></i></button>
                </div>
              </div>
              */}
            </div>
          </div>
        </div>
      </section>
    );
  };

  export default Auth;
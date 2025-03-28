  import React, { useState } from 'react';
  import '../../styles/login.css';
  import { Link, useNavigate } from "react-router-dom";
  import axios from 'axios';

  const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        interface LoginResponse {
          data: {
            role: 'SuperAdmin' | 'SubscriptionManager' | 'User';
          };
        }

        const response: LoginResponse = await axios.post('/api/auth/login', {
          email,
          password
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
          setError(errorResponse.data.message || 'Login failed. Please check your credentials.');
        } else {
          setError('Unable to connect to the server. Please try again later.');
        }
            } finally {
        setIsLoading(false);
            }
    };

    return (
      <section className="login-section">
        <div className="login-container">
          <div className="login-content">
            {/* Left Side */}
            <div className="login-form-side">
              <div className="logo-container">
                <i className="fas fa-crow logo-icon"></i>
                <span className="logo-text">Logo</span>
              </div>

              <div className="form-wrapper">
                <form className="login-form" onSubmit={handleLogin}>
                  <h3 className="login-title">Log in</h3>
                  
                  {error && <div className="error-message">{error}</div>}

                  <div className="form-group">
                    <input
                      type="email"
                      id="form2Example18"
                      className="form-input"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="password"
                      id="form2Example28"
                      className="form-input"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <button 
                      type="submit" 
                      className="login-button" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                  </div>

                  <p className="forgot-password">
                    <a href="#!" className="forgot-link">
                      Forgot password?
                    </a>
                  </p>
                  <p className="register-text">
                    Don't have an account?{' '}
                    <Link to="/signup" className="register-link">
                      Register here
                    </Link>
                  </p>
                </form>
              </div>
            </div>

            {/* Right Side */}
            <div className="image-side">
              <img
                src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img3.webp"
                alt="Login"
                className="login-image"
              />
            </div>
          </div>
        </div>
      </section>
    );
  };

  export default Login;
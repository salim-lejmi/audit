import React from 'react';
import '../../styles/signup.css';
import { Link } from "react-router-dom";

const Signup: React.FC = () => {
  const industries = [
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Financial Services',
    'Retail',
    'Education',
    'Other'
  ];

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
              <form className="signup-form">
                <h3 className="signup-title">Create Account</h3>

                <div className="form-group">
                  <input
                    type="text"
                    id="companyName"
                    className="form-input"
                    placeholder="Company Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    id="managerName"
                    className="form-input"
                    placeholder="Subscription Manager Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="Email Address"
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="tel"
                    id="phone"
                    className="form-input"
                    placeholder="Phone Number (Optional)"
                  />
                </div>

                <div className="form-group">
                  <select id="industry" className="form-input" required>
                    <option value="" disabled selected>Select Industry</option>
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
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    placeholder="Confirm Password"
                    required
                  />
                </div>

                <div className="form-group">
                  <button type="submit" className="signup-button">
                    Create Account
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
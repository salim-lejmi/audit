import React from 'react';
import '../../styles/login.css';
import { Link } from "react-router-dom";

const Login: React.FC = () => {
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
              <form className="login-form">
                <h3 className="login-title">Log in</h3>

                <div className="form-group">
                  <input
                    type="email"
                    id="form2Example18"
                    className="form-input"
                    placeholder="Email address"
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    id="form2Example28"
                    className="form-input"
                    placeholder="Password"
                  />
                </div>

                <div className="form-group">
                  <button type="button" className="login-button">
                    Login
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
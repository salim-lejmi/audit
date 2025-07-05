import React, { useState, useEffect } from 'react';
import '../../styles/auth.css';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import CountryPhoneInput from '../shared/CountryPhoneInput';

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
    'Technologie',
    'Santé',
    'Fabrication',
    'Services financiers',
    'Commerce de détail',
    'Éducation',
    'Autre'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Veuillez entrer votre email et votre mot de passe');
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
        setLoginError(errorResponse.data.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
      } else {
        setLoginError('Impossible de se connecter au serveur. Veuillez réessayer plus tard.');
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

  const handlePhoneChange = (phoneValue: string) => {
    setSignupFormData({
      ...signupFormData,
      phone: phoneValue
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupFormData.password !== signupFormData.confirmPassword) {
      setSignupError('Les mots de passe ne correspondent pas');
      return;
    }
    if (signupFormData.password.length < 8) {
      setSignupError('Le mot de passe doit contenir au moins 8 caractères');
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
      setSignupSuccess('Votre compte a été créé et est en attente d\'approbation. Vous recevrez un email une fois approuvé.');
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
        setIsLoginView(true);
        setSignupSuccess('');
      }, 3000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        setSignupError(error.response.data.message || 'Échec de l\'inscription. Veuillez réessayer.');
      } else {
        setSignupError('Impossible de se connecter au serveur. Veuillez réessayer plus tard.');
      }
    } finally {
      setSignupIsLoading(false);
    }
  };
  
  useEffect(() => {
    const img = new Image();
    img.src = "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img3.webp";
  }, []);

  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-image-side">
          <img
            src="auth.jpg"
            alt="Visuel d'authentification"
            className="auth-image"
          />
        </div>
        <div className="auth-form-side">
          <div className="auth-form-container">
            <h1 className="auth-title">Prevention Plus</h1>

            <div className="auth-toggle-buttons">
              <button
                className={`toggle-button ${isLoginView ? 'active' : ''}`}
                onClick={() => setIsLoginView(true)}
              >
                Connexion
              </button>
              <button
                className={`toggle-button ${!isLoginView ? 'active' : ''}`}
                onClick={() => setIsLoginView(false)}
              >
                Inscription
              </button>
            </div>

            {isLoginView ? (
              <form className="auth-form" onSubmit={handleLogin}>
                {loginError && <div className="error-message">{loginError}</div>}
                <div className="form-group">
                  <label htmlFor="login-email">Nom d'utilisateur, email ou téléphone...</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="login-email"
                      className="form-input"
                      placeholder="Entrez votre email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Entrez votre mot de passe...</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="login-password"
                      className="form-input"
                      placeholder="Entrez votre mot de passe"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loginIsLoading}
                >
                  {loginIsLoading ? 'Connexion en cours...' : 'Connexion'}
                </button>
                <p className="forgot-password-link">
                  <a href="#!">Mot de passe oublié ?</a>
                </p>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignup}>
                {signupError && <div className="error-message">{signupError}</div>}
                {signupSuccess && <div className="success-message">{signupSuccess}</div>}
                
                <div className="form-group">
                  <label htmlFor="companyName">Nom de l'entreprise</label>
                  <input
                    type="text"
                    id="companyName"
                    className="form-input"
                    placeholder="Entrez le nom de l'entreprise"
                    value={signupFormData.companyName}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="managerName">Nom du gestionnaire d'abonnement</label>
                  <input
                    type="text"
                    id="managerName"
                    className="form-input"
                    placeholder="Entrez le nom du gestionnaire"
                    value={signupFormData.managerName}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Adresse email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="Entrez votre adresse email"
                    value={signupFormData.email}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Numéro de téléphone (facultatif)</label>
                  <CountryPhoneInput
                    id="phone"
                    value={signupFormData.phone}
                    onChange={handlePhoneChange}
                    placeholder="Entrez votre numéro"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="industry">Secteur</label>
                  <select
                    id="industry"
                    className="form-input"
                    value={signupFormData.industry}
                    onChange={handleSignupChange}
                    required
                  >
                    <option value="" disabled>Sélectionnez un secteur</option>
                    {industries.map((industry, index) => (
                      <option key={index} value={industry.toLowerCase().replace(/\s+/g, '-')}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="password">Mot de passe</label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    placeholder="Entrez votre mot de passe (min. 8 caractères)"
                    value={signupFormData.password}
                    onChange={handleSignupChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmez le mot de passe</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    placeholder="Confirmez votre mot de passe"
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
                  {signupIsLoading ? 'Création du compte...' : 'Créer un compte'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Auth;
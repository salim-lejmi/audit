import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/emailverification.css';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    if (token && type) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Lien de vérification invalide');
    }
  }, [token, type]);

  const verifyEmail = async () => {
    try {
      const response = await axios.post('/api/auth/verify-email', {
        token,
        type
      });
      
      setStatus('success');
      setMessage(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: unknown) {
      setStatus('error');
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setMessage(error.response.data.message);
        if (error.response.data.message.includes('expired')) {
          setShowResendForm(true);
        }
      } else {
        setMessage('Échec de la vérification. Veuillez réessayer.');
      }
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsResending(true);
    try {
      await axios.post('/api/auth/resend-verification', { email });
      setMessage('Email de vérification envoyé avec succès. Veuillez vérifier votre boîte de réception.');
      setShowResendForm(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Échec de l\'envoi de l\'email de vérification. Veuillez réessayer.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        <div className="verification-icon">
          {status === 'loading' && (
            <div className="spinner"></div>
          )}
          {status === 'success' && (
            <i className="fas fa-check-circle success-icon"></i>
          )}
          {status === 'error' && (
            <i className="fas fa-exclamation-circle error-icon"></i>
          )}
        </div>

        <h1 className="verification-title">Vérification de l'email</h1>
        
        <div className={`verification-message ${status}`}>
          {message}
        </div>

        {status === 'success' && (
          <div className="success-content">
            <p className="redirect-info">
              Redirection vers la page de connexion dans 3 secondes...
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Aller à la connexion maintenant
            </button>
          </div>
        )}

        {status === 'error' && showResendForm && (
          <div className="resend-form">
            <h3>Renvoyer l'email de vérification</h3>
            <form onSubmit={handleResendVerification}>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Entrez votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isResending}
              >
                {isResending ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification'}
              </button>
            </form>
          </div>
        )}

        {status === 'error' && !showResendForm && (
          <div className="error-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Retour à la connexion
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => setShowResendForm(true)}
            >
              Renvoyer l'email de vérification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
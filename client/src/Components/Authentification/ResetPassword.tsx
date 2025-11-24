import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/auth.css';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get('token');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Lien de réinitialisation invalide');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword: password
      });
      
      setSuccess(response.data.message);
      setPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Une erreur s\'est produite');
      } else {
        setError('Impossible de se connecter au serveur. Veuillez réessayer plus tard.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-container">
        <div className="auth-image-side">
          <img
            src="/auth.jpg"
            alt="Visuel d'authentification"
            className="auth-image"
          />
        </div>
        <div className="auth-form-side">
          <div className="auth-form-container">
            <h1 className="auth-title">Prevention Plus</h1>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>
              Réinitialisation du mot de passe
            </h2>

            <form className="auth-form" onSubmit={handleResetPassword}>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="password">Nouveau mot de passe</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    placeholder="Entrez votre nouveau mot de passe (min. 8 caractères)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmez le mot de passe</label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    placeholder="Confirmez votre nouveau mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-button"
                disabled={isLoading}
              >
                {isLoading ? 'Réinitialisation en cours...' : 'Confirmer'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
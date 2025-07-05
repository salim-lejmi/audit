import React from 'react';
import '../../styles/footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-brand">Prévention Plus</span>
            <span className="footer-copyright">© 2025 Tous droits réservés</span>
          </div>
          
          <div className="footer-right">
            <div className="footer-contact">
              <span className="footer-label">Développé par Salim Lejmi</span>
              <div className="footer-socials">
                <a 
                  href="mailto:salimsalem4@gmail.com" 
                  className="footer-social-link"
                  title="Email"
                >
                  <i className="fas fa-envelope"></i>
                </a>
                <a 
                  href="https://github.com/salim-lejmi/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  title="GitHub"
                >
                  <i className="fab fa-github"></i>
                </a>
                <a 
                  href="https://www.linkedin.com/in/salim-lejmi/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  title="LinkedIn"
                >
                  <i className="fab fa-linkedin"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
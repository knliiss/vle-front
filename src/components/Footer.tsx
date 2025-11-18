import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <strong>VLE Platform</strong> © {year}
        </div>
        <div className="footer-center">
          <span className="footer-hint">Навчальна платформа • Адміністрування користувачів та курсів</span>
        </div>
        <div className="footer-right">
          <a href="/admin" className="footer-link">Адмін</a>
          <a href="/student" className="footer-link">Студент</a>
          <a href="/teacher" className="footer-link">Викладач</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


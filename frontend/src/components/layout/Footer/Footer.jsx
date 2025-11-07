import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🍞 Bakery Delight</h3>
            <p>Fresh baked goods made with love and tradition.</p>
          </div>
          
          <div className="footer-section">
            <h4>Contact Info</h4>
            <p>123 Bakery Street</p>
            <p>Sweet City, SC 12345</p>
            <p>(555) 123-BAKE</p>
          </div>
          
          <div className="footer-section">
            <h4>Hours</h4>
            <p>Monday - Friday: 6AM - 8PM</p>
            <p>Saturday - Sunday: 7AM - 6PM</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 Bakery Delight. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
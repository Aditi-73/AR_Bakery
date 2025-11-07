import React from 'react';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton/GoogleLoginButton';
import './Login.css';

const Login = () => {
  return (
    <div className="login-page">
      <div className="container">
        <div className="login-container">
          <div className="login-card">
            <h1>Welcome to Bakery Delight</h1>
            <p className="login-subtitle">
              Sign in to your account to continue
            </p>

            {/* Google Login Button */}
            <div className="social-login">
              <GoogleLoginButton text="Sign in with Google" />
            </div>

            <div className="login-info">
              <p>
                We use Google OAuth for secure authentication. 
                Your email and profile information will be kept private.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
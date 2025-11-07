import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { tokenManager } from '../../services/api';
import './OAuthCallback.css';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { setAuthTokens } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const processOAuthCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      console.log('🔄 OAuth Callback - Processing...', { token, success, error });

      if (error) {
        console.error('❌ OAuth error:', error);
        navigate('/login', { state: { error: `Authentication failed: ${error}` } });
        return;
      }

      if (token && refreshToken) {
        try {
          console.log('✅ Setting tokens...');
          await setAuthTokens(token, refreshToken);
          
          // Clear URL parameters
          window.history.replaceState({}, '', '/');
          
          console.log('🚀 Redirecting to home...');
          navigate('/');
        } catch (error) {
          console.error('❌ Token setting failed:', error);
          navigate('/login', { state: { error: 'Failed to set authentication tokens' } });
        }
      } else {
        console.error('❌ No tokens received');
        navigate('/login', { state: { error: 'No authentication tokens received' } });
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, setAuthTokens]);

  return (
    <div className="oauth-callback">
      <div className="container">
        <div className="loading-spinner">
          <h2>Completing authentication...</h2>
          <p>Please wait while we log you in.</p>
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
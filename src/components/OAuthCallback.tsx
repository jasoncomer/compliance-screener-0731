import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import { setAuthToken } from '../api/api';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAppContext();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          message.error(`OAuth authentication failed: ${error}`);
          navigate('/login');
          return;
        }

        if (!token) {
          message.error('No authentication token received');
          navigate('/login');
          return;
        }

        // Set the auth token
        await setAuthToken(token);

        // Store auth data (the backend should include user data in the redirect)
        const refreshToken = searchParams.get('refreshToken') || token;
        const userDataParam = searchParams.get('user');
        
        if (userDataParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));
            
            // Store auth data
            storage.auth.setTokens(token, refreshToken);
            storage.auth.setUser(userData);
            
            // Update app state
            setUser(userData);
            
            // Navigate to dashboard
            navigate('/home/block-explorer');
            
            message.success('Successfully signed in with Google!');
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            // Fallback: just store the token and redirect
            storage.auth.setTokens(token, refreshToken);
            navigate('/home/block-explorer');
            message.success('Successfully signed in with Google!');
          }
        } else {
          // Fallback: just store the token and redirect
          storage.auth.setTokens(token, refreshToken);
          navigate('/home/block-explorer');
          message.success('Successfully signed in with Google!');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        message.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Spin size="large" />
      <p style={{ marginTop: '20px', color: '#666' }}>
        Completing Google authentication...
      </p>
    </div>
  );
};

export default OAuthCallback; 
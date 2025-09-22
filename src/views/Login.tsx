import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, setAuthToken } from '../api/api';
import { useAppContext } from '../context/AppContext';
import { storage } from '../utils/storage';
import Input from '../components/common/Input';
import { useAnalytics } from '../hooks/useAnalytics';
import GoogleLoginButton from '../components/GoogleLoginButton';
import PageTransition from '../components/PageTransition';
import { cn } from '@/lib/utils';

const Login = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { setUser } = useAppContext();
  const { trackEvent, trackError } = useAnalytics();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isVisible: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message
    });

    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 4000);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await api.users.authenticateUser(email, password);
      const { accessToken, refreshToken, user } = response.data;

      setAuthToken(accessToken);
      storage.auth.setTokens(accessToken, refreshToken || '');
      storage.auth.setUser(user);
      setUser(user);

      trackEvent('login_success', { method: 'email' });

      const from = location.state?.from?.pathname || '/home/block-explorer';
      nav(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      trackError(error, { context: 'email_login' });

      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      showNotification('error', 'Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      showNotification('error', 'Error', 'Please enter your email address.');
      return;
    }

    setIsResetting(true);
    try {
      await api.users.resetPassword(resetEmail);
      showNotification('success', 'Success', 'Password reset email sent. Please check your inbox.');
      setIsResetModalVisible(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      showNotification('error', 'Error', errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const navRegister = () => {
    setTimeout(() => {
      nav('/register');
    }, 150);
  };

  return (
    <PageTransition>
      <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-5">
        {/* Notification */}
        {notification.isVisible && (
          <div
            className={cn(
              "fixed top-5 right-5 px-5 py-4 rounded-lg shadow-lg z-[1001] animate-slide-in",
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500',
              "text-white"
            )}
          >
            <div className="font-semibold mb-1">{notification.title}</div>
            <div className="text-sm">{notification.message}</div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-12 w-full max-w-[420px] shadow-2xl dark:shadow-black/50 border border-gray-200 dark:border-gray-800">
          {/* Logo Section */}
          <div className="text-center mb-10 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center w-[280px] h-[130px] mb-5">
              <img
                src='/aws_blockscout_banner_logo-removebg-preview.png'
                alt="Blockscout Research Logo"
                className="w-[300px] h-[130px] rounded-2xl opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
              Advanced blockchain analytics and compliance
            </p>
          </div>

          {/* Google OAuth Button */}
          <div className="mb-6">
            <GoogleLoginButton
              onError={(error) => {
                trackError(error, { context: 'google_oauth' });
                showNotification('error', 'Google Login Failed', 'Failed to initiate Google login. Please try again.');
              }}
            />
          </div>

          {/* Divider */}
          <div className="relative text-center my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative bg-white dark:bg-gray-900 px-4">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-4">
              <Input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder='Enter your email'
              />

              <Input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder='Enter your password'
              />
            </div>

            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setIsResetModalVisible(true);
              }}
              className="text-[#e87e4f] font-medium text-sm text-center mt-2 block hover:opacity-80 transition-opacity"
            >
              Forgot your password?
            </a>

            <div className="flex gap-4 mt-2">
              <button
                type='button'
                onClick={navRegister}
                className="flex-1 h-12 rounded-xl font-semibold text-sm bg-transparent text-gray-900 dark:text-gray-50 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/40"
              >
                Create account
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "flex-1 h-12 rounded-xl font-semibold text-sm bg-[#e87e4f] text-white border-none hover:bg-[#d6693a] transition-all focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/40 flex items-center justify-center",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                Sign in
                {isLoading && (
                  <span className="ml-2 inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Custom Modal for Reset Password */}
        {isResetModalVisible && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsResetModalVisible(false);
                setResetEmail('');
              }
            }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-[400px] w-full shadow-xl">
              <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-gray-50">
                Reset Password
              </h2>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                  Email<span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Enter the email address associated with your account
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalVisible(false);
                    setResetEmail('');
                  }}
                  className="px-6 h-10 rounded-lg font-medium text-sm bg-transparent text-gray-900 dark:text-gray-50 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className={cn(
                    "px-6 h-10 rounded-lg font-medium text-sm bg-[#e87e4f] text-white border-none hover:bg-[#d6693a] transition-all focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/40 flex items-center",
                    isResetting && "opacity-70 cursor-not-allowed"
                  )}
                >
                  Send Reset Email
                  {isResetting && (
                    <span className="ml-2 inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Login;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import Input from '../components/common/Input';
import { useAnalytics } from '../hooks/useAnalytics';
import PageTransition from '../components/PageTransition';
import { cn } from '../lib/utils';


const Register = () => {
  const navigate = useNavigate();
  const { trackEvent, trackError } = useAnalytics();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    if (loading) return;

    if (!name || !surname || !email || !password) {
      setNotification({ type: 'error', message: 'Please fill in all fields' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.users.registerUser({ name, surname, email, password });
      const { data } = response;
      const { user } = data;
      const { accessToken } = user;

      // Save to local storage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      trackEvent('registration_success', { method: 'email' });
      setNotification({ type: 'success', message: 'Account created successfully!' });

      // Redirect to welcome page
      setTimeout(() => {
        window.location.href = '/welcome';
      }, 1000);
    } catch (error: any) {
      console.error('Registration error:', error);
      trackError(error, { context: 'user_registration' });

      const errorMessage = error.response?.data?.message || 'Error creating account. Please check your details and try again.';
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const navLogin = () => {
    // Add a small delay for smooth transition
    setTimeout(() => {
      navigate('/login');
    }, 150);
  };

  return (
    <PageTransition>
      <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-5">
        {notification && (
          <div className={cn(
            "fixed top-5 right-5 px-5 py-4 rounded-lg shadow-lg z-[1001] animate-slide-in",
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500',
            "text-white"
          )}>
            <div className="text-sm">{notification.message}</div>
          </div>
        )}

        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-12 w-full max-w-[480px] shadow-2xl dark:shadow-black/50 border border-gray-200 dark:border-gray-800">
          <div className="text-center mb-10 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center w-[280px] h-[130px] mb-5">
              <img
                src='/aws_blockscout_banner_logo-removebg-preview.png'
                alt="Blockscout Research Logo"
                className="w-[280px] h-[130px] rounded-2xl opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
              Advanced blockchain analytics and compliance
            </p>
          </div>

          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8 text-center tracking-tight">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex gap-4 max-[480px]:flex-col">
              <Input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder='First Name'
              />
              <Input
                type="text"
                value={surname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSurname(e.target.value)}
                placeholder='Last Name'
              />
            </div>

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
                placeholder='Create a password'
              />
            </div>

            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={navLogin}
                className="flex-1 h-12 rounded-xl font-semibold text-sm bg-transparent text-gray-900 dark:text-gray-50 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/40"
              >
                Back to login
              </button>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex-1 h-12 rounded-xl font-semibold text-sm bg-[#e87e4f] text-white border-none hover:bg-[#d6693a] transition-all focus:outline-none focus:ring-2 focus:ring-[#e87e4f]/40 flex items-center justify-center",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                Create account
                {loading && (
                  <span className="ml-2 inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
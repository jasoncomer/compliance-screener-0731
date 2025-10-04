import { useEffect, useState } from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation
} from "react-router-dom";

import { setAuthToken } from "./api/api";
import OAuthCallback from './components/OAuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { message,MessageContainer, NotificationContainer } from "./components/ui/message";
import { PageSpinner } from "./components/ui/spinner";
import { Toaster } from './components/ui/toaster';
import { config } from "./config/config";
import { useAppContext } from "./context/AppContext";
import { AutosaveProvider } from './context/AutosaveContext';
import { FlowTraceProvider } from './context/FlowTraceContext';
import { useTheme } from "./context/ThemeContext";
import { useAnalytics } from './hooks/useAnalytics';
import { useAppDispatch } from './store/hooks';
import { fetchOrganizations } from './store/slices/organizationsSlice';
import Admin from './views/Admin';
import Alerts from './views/Alerts';
import BlockExplorer from './views/blockexplorer/BlockExplorer';
import ComplianceScreener from './views/Compliance/ComplianceScreener';
import ClientOverviewPage from './views/Compliance/ClientOverviewPage';
import MonitoredAddressesPage from './views/Compliance/MonitoredAddressesPage';
import { ComplianceDashboard } from "./views/compliance-v2/compliance-dashboard";
import FlowTrace from './views/Flowtrace/FlowTracePage';
import Home from "./views/Home";
import Login from './views/Login';
import Register from "./views/Register";
import ResetPassword from "./views/ResetPassword";
import RiskDashboard from './views/RiskDashboard/index';
import Settings from './views/Settings';
import { VASPExplorer } from './views/VASPExplorer';
import Welcome from './views/Welcome/index';

function App() {
  const dispatch = useAppDispatch();
  const { user, setUser } = useAppContext();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { trackUser, trackPageView, clearUser } = useAnalytics();

  useEffect(() => {
    // Set data-theme attribute on body
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Track page views
  useEffect(() => {
    if (!isLoading) {
      trackPageView(location.pathname, {
        isAuthenticated: !!user,
        theme
      });
    }
  }, [location.pathname, isLoading, user, theme, trackPageView]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Development mode bypass - create a mock user for development
        if (import.meta.env.DEV && !localStorage.getItem('bs-app-user')) {
          const mockUser = {
            id: 'dev-user-123',
            name: 'Development User',
            email: 'dev@example.com',
            role: 'user'
          };
          
          setUser(mockUser);
          trackUser(mockUser.id, {
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role
          });
          
          dispatch(fetchOrganizations());
          setIsLoading(false);
          return;
        }

        const { accessToken, user: userKey } = config.localstorageKeys;
        const storedToken = localStorage.getItem(accessToken);
        const storedUser = localStorage.getItem(userKey);

        if (!storedToken || !storedUser) {
          setIsLoading(false);
          return;
        }

        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Set the auth token first
          await setAuthToken(storedToken);
          
          // Then set the user and track user identification
          setUser(parsedUser);
          trackUser(parsedUser.id, {
            email: parsedUser.email,
            name: parsedUser.name,
            role: parsedUser.role
          });
          
          dispatch(fetchOrganizations());
          
        } catch (parseError) {
          // Handle invalid stored data
          localStorage.removeItem(accessToken);
          localStorage.removeItem(userKey);
          clearUser();
          message.error('Session data corrupted. Please login again.');
        }
      } catch (error) {
        message.error('Error loading user session');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [setUser, dispatch, trackUser, clearUser]);

  if (isLoading) {
    return <PageSpinner tip="Loading..." />;
  }

  return (
    <>
      <MessageContainer />
      <NotificationContainer />
      <Toaster />
      <AutosaveProvider>
        <FlowTraceProvider>
          <Routes>
          <Route path="/" element={<Navigate to="/home/block-explorer" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={user ? <Navigate to="/home/block-explorer" replace /> : <Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/welcome" element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }>
            <Route index element={<BlockExplorer />} />
            <Route path="compliance-screener" element={<ComplianceScreener />} />
            <Route path="compliance-screener/active-cases" element={<ComplianceScreener />} />
            <Route path="compliance-screener/archived-cases" element={<ComplianceScreener />} />
            <Route path="compliance-screener/client-overview" element={<ClientOverviewPage />} />
            <Route path="compliance-screener/addresses" element={<MonitoredAddressesPage />} />
            <Route path="compliance-dashboard" element={<ComplianceDashboard />} />
            <Route path="admin" element={<Admin />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="vasp-explorer" element={<VASPExplorer />} />
            <Route path="block-explorer/*" element={<BlockExplorer />} />

            <Route path="risk-dashboard" element={<RiskDashboard />} />
            <Route path="flow-trace" element={<FlowTrace />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </FlowTraceProvider>
      </AutosaveProvider>
    </>
  )
}

export default App;

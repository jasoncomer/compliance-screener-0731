import {
  Route,
  Routes,
  Navigate,
  useLocation
} from "react-router-dom";
import { useEffect, useState } from "react";
import Login from './views/Login';
import Register from "./views/Register";
import ResetPassword from "./views/ResetPassword";
import Home from "./views/Home";
import { ConfigProvider, Spin, message } from "antd";
import { useAppContext } from "./context/AppContext";
import { config } from "./config/config";
import { setAuthToken } from "./api/api";
import { useTheme } from "./context/ThemeContext";
import { lightTheme, darkTheme } from "./styles/theme";
import ComplianceScreener from './views/Compliance/ComplianceScreener';
import Admin from './views/Admin';
import Alerts from './views/Alerts';
import BlockHam from './views/VASPExplorer/VASPExplorer';
import BlockExplorer from './views/blockexplorer/BlockExplorer';

import RiskDashboard from './views/RiskDashboard/index';
import Settings from './views/Settings';
import FlowTrace from './views/FlowTrace';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './views/Welcome/index';
import { useAppDispatch } from './store/hooks';
import { fetchOrganizations } from './store/slices/organizationsSlice';
import { useAnalytics } from './hooks/useAnalytics';
import { ComplianceDashboard } from "./views/compliance-v2/compliance-dashboard";
import { Toaster } from './components/ui/toaster';
import OAuthCallback from './components/OAuthCallback';

function App() {
  const dispatch = useAppDispatch();
  const { user, setUser } = useAppContext();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const location = useLocation();
  const { trackUser, trackPageView, clearUser } = useAnalytics();

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

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
          messageApi.error('Session data corrupted. Please login again.');
        }
      } catch (error) {
        messageApi.error('Error loading user session');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [setUser, messageApi, dispatch, trackUser, clearUser]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider theme={currentTheme}>
      {contextHolder}
      <Toaster />
        <Routes>
          <Route path="/" element={<Navigate to="/home/compliance-screener" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={user ? <Navigate to="/home/compliance-screener" replace /> : <Register />} />
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
            <Route index element={<ComplianceScreener />} />
            <Route path="compliance-screener" element={<ComplianceScreener />} />
            <Route path="compliance-dashboard" element={<ComplianceDashboard />} />
            <Route path="admin" element={<Admin />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="blockham" element={<BlockHam />} />
            <Route path="block-explorer/*" element={<BlockExplorer />} />

            <Route path="risk-dashboard" element={<RiskDashboard />} />
            <Route path="flow-trace" element={<FlowTrace />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </ConfigProvider>
  )
}

export default App;
